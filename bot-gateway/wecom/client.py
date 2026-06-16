from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

import requests

from wecom.config import WeComConfig


class WeComClient:
    API_BASE = "https://qyapi.weixin.qq.com/cgi-bin"

    def __init__(self, config: WeComConfig) -> None:
        self.config = config
        self._token: str = ""
        self._token_expires_at: float = 0.0

    def _get_access_token(self) -> str:
        now = time.time()
        if self._token and now < self._token_expires_at - 60:
            return self._token
        url = f"{self.API_BASE}/gettoken"
        resp = requests.get(
            url,
            params={"corpid": self.config.corp_id, "corpsecret": self.config.agent_secret},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"gettoken failed: {data}")
        self._token = str(data["access_token"])
        self._token_expires_at = now + int(data.get("expires_in", 7200))
        return self._token

    def download_media(self, media_id: str, dest: Path) -> Path:
        token = self._get_access_token()
        url = f"{self.API_BASE}/media/get"
        resp = requests.get(url, params={"access_token": token, "media_id": media_id}, timeout=120, stream=True)
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "")
        if "application/json" in content_type:
            err = resp.json()
            raise RuntimeError(f"media/get failed: {err}")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(resp.content)
        return dest

    def upload_file(self, file_path: Path) -> str:
        if not file_path.exists():
            raise FileNotFoundError(str(file_path))
        size = file_path.stat().st_size
        if size > self.config.max_file_bytes:
            raise ValueError(f"File too large for WeCom upload: {size} bytes")
        token = self._get_access_token()
        url = f"{self.API_BASE}/media/upload"
        with file_path.open("rb") as fh:
            resp = requests.post(
                url,
                params={"access_token": token, "type": "file"},
                files={"media": (file_path.name, fh, "application/octet-stream")},
                timeout=120,
            )
        resp.raise_for_status()
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"media/upload failed: {data}")
        return str(data["media_id"])

    def send_text(self, user_id: str, content: str) -> dict[str, Any]:
        payload = {
            "touser": user_id,
            "msgtype": "text",
            "agentid": self.config.agent_id,
            "text": {"content": content[:2048]},
            "safe": 0,
        }
        return self._send_message(payload)

    def send_file(self, user_id: str, media_id: str) -> dict[str, Any]:
        payload = {
            "touser": user_id,
            "msgtype": "file",
            "agentid": self.config.agent_id,
            "file": {"media_id": media_id},
            "safe": 0,
        }
        return self._send_message(payload)

    def _send_message(self, payload: dict[str, Any]) -> dict[str, Any]:
        token = self._get_access_token()
        url = f"{self.API_BASE}/message/send"
        resp = requests.post(url, params={"access_token": token}, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"message/send failed: {data}")
        return data
