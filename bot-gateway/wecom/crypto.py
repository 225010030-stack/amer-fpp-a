from __future__ import annotations

import base64
import hashlib
import socket
import struct
import time
from typing import Optional
from xml.etree import ElementTree as ET

from Crypto.Cipher import AES


class WeComCryptoError(Exception):
    pass


class WeComCrypto:
    """WeCom callback message crypto (compatible with official sample)."""

    def __init__(self, token: str, encoding_aes_key: str, corp_id: str) -> None:
        self.token = token
        self.corp_id = corp_id
        try:
            self.key = base64.b64decode(encoding_aes_key + "=")
        except Exception as exc:  # noqa: BLE001
            raise WeComCryptoError(f"Invalid WECOM_ENCODING_AES_KEY: {exc}") from exc
        if len(self.key) != 32:
            raise WeComCryptoError("WECOM_ENCODING_AES_KEY must decode to 32 bytes")

    @staticmethod
    def _sha1(*parts: str) -> str:
        items = sorted(parts)
        return hashlib.sha1("".join(items).encode("utf-8")).hexdigest()

    def verify_signature(self, signature: str, timestamp: str, nonce: str, echo_or_encrypt: str) -> bool:
        return self._sha1(self.token, timestamp, nonce, echo_or_encrypt) == signature

    def decrypt(self, encrypted: str) -> str:
        try:
            cipher = AES.new(self.key, AES.MODE_CBC, self.key[:16])
            plain = cipher.decrypt(base64.b64decode(encrypted))
        except Exception as exc:  # noqa: BLE001
            raise WeComCryptoError(f"Decrypt failed: {exc}") from exc

        pad = plain[-1]
        if pad < 1 or pad > 32:
            raise WeComCryptoError("Invalid padding")
        content = plain[:-pad]
        xml_len = socket.ntohl(struct.unpack("I", content[16:20])[0])
        xml_content = content[20 : 20 + xml_len].decode("utf-8")
        from_corp = content[20 + xml_len :].decode("utf-8")
        if from_corp != self.corp_id:
            raise WeComCryptoError("CorpId mismatch")
        return xml_content

    def encrypt(self, plain_xml: str) -> str:
        text = plain_xml.encode("utf-8")
        random = hashlib.sha1(str(time.time()).encode()).hexdigest()[:16].encode()
        msg_len = struct.pack("I", socket.htonl(len(text)))
        corp = self.corp_id.encode("utf-8")
        raw = random + msg_len + text + corp
        pad_len = AES.block_size - len(raw) % AES.block_size
        raw += bytes([pad_len]) * pad_len
        cipher = AES.new(self.key, AES.MODE_CBC, self.key[:16])
        return base64.b64encode(cipher.encrypt(raw)).decode("utf-8")

    def decrypt_post_body(self, xml_text: str) -> str:
        root = ET.fromstring(xml_text)
        encrypt_node = root.find("Encrypt")
        if encrypt_node is None or not (encrypt_node.text or "").strip():
            raise WeComCryptoError("Missing Encrypt node")
        return self.decrypt(encrypt_node.text.strip())

    def encrypt_reply(self, plain_xml: str, timestamp: str, nonce: str) -> str:
        encrypted = self.encrypt(plain_xml)
        signature = self._sha1(self.token, timestamp, nonce, encrypted)
        return (
            "<xml>"
            f"<Encrypt><![CDATA[{encrypted}]]></Encrypt>"
            f"<MsgSignature><![CDATA[{signature}]]></MsgSignature>"
            f"<TimeStamp>{timestamp}</TimeStamp>"
            f"<Nonce><![CDATA[{nonce}]]></Nonce>"
            "</xml>"
        )


def verify_plain_signature(token: str, signature: str, timestamp: str, nonce: str) -> bool:
    items = sorted([token, timestamp, nonce])
    return hashlib.sha1("".join(items).encode("utf-8")).hexdigest() == signature
