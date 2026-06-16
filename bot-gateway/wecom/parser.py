from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from xml.etree import ElementTree as ET


@dataclass
class WeComMessage:
    msg_type: str
    from_user: str
    to_user: str
    agent_id: str
    msg_id: str
    content: str = ""
    media_id: str = ""
    file_name: str = ""
    recognition: str = ""


def _text(node: Optional[ET.Element]) -> str:
    if node is None or node.text is None:
        return ""
    return node.text.strip()


def parse_incoming_xml(xml_text: str) -> WeComMessage:
    root = ET.fromstring(xml_text)
    msg_type = _text(root.find("MsgType")).lower()
    return WeComMessage(
        msg_type=msg_type,
        from_user=_text(root.find("FromUserName")),
        to_user=_text(root.find("ToUserName")),
        agent_id=_text(root.find("AgentID")),
        msg_id=_text(root.find("MsgId")),
        content=_text(root.find("Content")),
        media_id=_text(root.find("MediaId")),
        file_name=_text(root.find("FileName")) or _text(root.find("Title")),
        recognition=_text(root.find("Recognition")),
    )
