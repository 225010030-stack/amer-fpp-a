from __future__ import annotations

import os
from dataclasses import dataclass


def _flag(name: str, default: bool = False) -> bool:
    val = os.getenv(name, "true" if default else "false").strip().lower()
    return val in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class WeComConfig:
    enabled: bool
    corp_id: str
    agent_id: int
    agent_secret: str
    callback_token: str
    encoding_aes_key: str
    public_base_url: str
    max_reply_files: int
    max_file_bytes: int

    @property
    def encrypted_mode(self) -> bool:
        return bool(self.encoding_aes_key.strip())

    def validate(self) -> list[str]:
        if not self.enabled:
            return []
        missing: list[str] = []
        for name, val in [
            ("WECOM_CORP_ID", self.corp_id),
            ("WECOM_AGENT_ID", self.agent_id),
            ("WECOM_AGENT_SECRET", self.agent_secret),
            ("WECOM_CALLBACK_TOKEN", self.callback_token),
        ]:
            if not val:
                missing.append(name)
        return missing


def load_wecom_config() -> WeComConfig:
    agent_id_raw = os.getenv("WECOM_AGENT_ID", "0").strip()
    return WeComConfig(
        enabled=_flag("WECOM_ENABLED", default=False),
        corp_id=os.getenv("WECOM_CORP_ID", "").strip(),
        agent_id=int(agent_id_raw) if agent_id_raw.isdigit() else 0,
        agent_secret=os.getenv("WECOM_AGENT_SECRET", "").strip(),
        callback_token=os.getenv("WECOM_CALLBACK_TOKEN", "").strip(),
        encoding_aes_key=os.getenv("WECOM_ENCODING_AES_KEY", "").strip(),
        public_base_url=os.getenv("WECOM_PUBLIC_BASE_URL", "").strip().rstrip("/"),
        max_reply_files=max(1, min(int(os.getenv("WECOM_MAX_REPLY_FILES", "3")), 5)),
        max_file_bytes=int(os.getenv("WECOM_MAX_FILE_BYTES", str(20 * 1024 * 1024))),
    )
