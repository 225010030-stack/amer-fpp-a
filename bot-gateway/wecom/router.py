from __future__ import annotations

import os
import re
import secrets
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import PlainTextResponse

from wecom.config import load_wecom_config
from wecom.crypto import WeComCrypto, WeComCryptoError, verify_plain_signature
from wecom.handler import WeComHandler
from wecom.parser import parse_incoming_xml

router = APIRouter()


def _workspace_root() -> Path:
    return Path(os.getenv("WORKSPACE_ROOT", str(Path(__file__).resolve().parents[2]))).resolve()


@router.get("/health")
def wecom_health() -> dict:
    cfg = load_wecom_config()
    issues = cfg.validate()
    return {
        "ok": cfg.enabled and not issues,
        "enabled": cfg.enabled,
        "encrypted_mode": cfg.encrypted_mode,
        "missing": issues,
        "callback_path": "/api/wecom/callback",
    }


@router.get("/callback")
def wecom_callback_verify(
    msg_signature: str = Query(default=""),
    timestamp: str = Query(default=""),
    nonce: str = Query(default=""),
    echostr: str = Query(default=""),
) -> Response:
    cfg = load_wecom_config()
    if not cfg.enabled:
        raise HTTPException(status_code=503, detail="WeCom integration disabled")

    missing = cfg.validate()
    if missing:
        raise HTTPException(status_code=500, detail=f"Missing config: {', '.join(missing)}")

    if cfg.encrypted_mode:
        crypto = WeComCrypto(cfg.callback_token, cfg.encoding_aes_key, cfg.corp_id)
        if not crypto.verify_signature(msg_signature, timestamp, nonce, echostr):
            raise HTTPException(status_code=403, detail="Invalid signature")
        try:
            plain = crypto.decrypt(echostr)
        except WeComCryptoError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return PlainTextResponse(content=plain)

    if not verify_plain_signature(cfg.callback_token, msg_signature, timestamp, nonce):
        raise HTTPException(status_code=403, detail="Invalid signature")
    return PlainTextResponse(content=echostr)


@router.post("/callback")
async def wecom_callback_message(
    request: Request,
    msg_signature: str = Query(default=""),
    timestamp: str = Query(default=""),
    nonce: str = Query(default=""),
) -> Response:
    cfg = load_wecom_config()
    if not cfg.enabled:
        raise HTTPException(status_code=503, detail="WeCom integration disabled")

    missing = cfg.validate()
    if missing:
        raise HTTPException(status_code=500, detail=f"Missing config: {', '.join(missing)}")

    body = (await request.body()).decode("utf-8")
    xml_text = body

    if cfg.encrypted_mode:
        crypto = WeComCrypto(cfg.callback_token, cfg.encoding_aes_key, cfg.corp_id)
        m = re.search(r"<Encrypt><!\[CDATA\[(.+?)\]\]></Encrypt>", body)
        encrypt_val = m.group(1) if m else ""
        if encrypt_val and not crypto.verify_signature(msg_signature, timestamp, nonce, encrypt_val):
            raise HTTPException(status_code=403, detail="Invalid signature")
        try:
            xml_text = crypto.decrypt_post_body(body)
        except WeComCryptoError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    else:
        if not verify_plain_signature(cfg.callback_token, msg_signature, timestamp, nonce):
            raise HTTPException(status_code=403, detail="Invalid signature")

    msg = parse_incoming_xml(xml_text)
    handler = WeComHandler(cfg, _workspace_root())
    handler.handle_message(msg)

    if cfg.encrypted_mode:
        crypto = WeComCrypto(cfg.callback_token, cfg.encoding_aes_key, cfg.corp_id)
        ts = timestamp or str(int(time.time()))
        reply_nonce = nonce or secrets.token_hex(8)
        encrypted = crypto.encrypt_reply("success", ts, reply_nonce)
        return Response(content=encrypted, media_type="application/xml")

    return PlainTextResponse(content="success")
