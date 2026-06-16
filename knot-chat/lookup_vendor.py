#!/usr/bin/env python3
"""Resolve country + vendor + fee_type to vendor profile from config."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def norm_country(raw: str) -> str:
    c = (raw or "").strip().upper()
    if c in {"CA", "CAN", "CANADA"}:
        return "CAN"
    if c in {"US", "USA", "UNITED STATES"}:
        return "US"
    raise ValueError(f"Unknown country: {raw}")


def load_profiles(root: Path) -> dict:
    path = root / "bot-gateway" / "config" / "vendor_profiles.json"
    if not path.exists():
        raise FileNotFoundError(f"vendor_profiles.json not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def match_profile(data: dict, country: str, vendor: str = "", fee_type: str = "") -> dict:
    profiles: dict = data["profiles"]
    vendor_q = vendor.strip().lower()
    fee_q = fee_type.strip().lower()

    candidates = [p for p in profiles.values() if p.get("country") == country]
    if not candidates:
        raise ValueError(f"No profiles for country {country}")

    if not vendor_q and not fee_q:
        default_key = data["defaults"].get(country)
        if default_key and default_key in profiles:
            return profiles[default_key]

    if vendor_q:
        candidates = [p for p in candidates if p.get("vendor", "").lower() == vendor_q]
    if fee_q:
        candidates = [p for p in candidates if p.get("fee_type", "").lower() == fee_q]

    if len(candidates) == 1:
        return candidates[0]
    if len(candidates) > 1:
        opts = ", ".join(f"{p['vendor']}/{p['fee_type']}" for p in candidates)
        raise ValueError(f"Ambiguous vendor profile. Candidates: {opts}")

    # fallback default per country
    default_key = data["defaults"].get(country)
    if default_key and default_key in profiles:
        return profiles[default_key]
    raise ValueError(f"No profile match for country={country} vendor={vendor!r} fee_type={fee_type!r}")


def list_profiles(data: dict, country: str) -> None:
    for p in data["profiles"].values():
        if p.get("country") == country:
            print(f"- {p['vendor']} / {p['fee_type']}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Lookup vendor profile")
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--country", required=True, help="US or CAN")
    parser.add_argument("--vendor", default="", help="Vendor name e.g. Cigna")
    parser.add_argument("--fee-type", default="", help="Fee type e.g. Dental")
    parser.add_argument("--list", action="store_true", help="List profiles for country")
    parser.add_argument("--format", choices=["env", "json"], default="env")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    data = load_profiles(root)
    country = norm_country(args.country)

    if args.list:
        list_profiles(data, country)
        return 0

    profile = match_profile(data, country, args.vendor, args.fee_type)
    if args.format == "json":
        print(json.dumps(profile, ensure_ascii=False, indent=2))
    else:
        mapping = {
            "COUNTRY": profile["country"],
            "ENTITY": profile["entity"],
            "VENDOR": profile["vendor"],
            "FEE_TYPE": profile["fee_type"],
            "CURRENCY": profile["currency"],
            "FPP_SCENARIO": profile.get("fpp_scenario", ""),
        }
        for k, v in mapping.items():
            print(f'{k}="{v}"')
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, FileNotFoundError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise SystemExit(1)
