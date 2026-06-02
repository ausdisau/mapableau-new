#!/usr/bin/env python3
"""Write NEON_AUTH_BASE_URL (and optional AUTH_PROVIDER) into .env."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


def update_env(base_url: str, *, enable: bool = True) -> None:
    if not ENV_PATH.exists():
        raise SystemExit(f"Missing {ENV_PATH}. Copy from .env.example first.")

    text = ENV_PATH.read_text()
    if re.search(r"^NEON_AUTH_BASE_URL=", text, flags=re.M):
        text = re.sub(
            r'^NEON_AUTH_BASE_URL=.*$',
            f'NEON_AUTH_BASE_URL="{base_url}"',
            text,
            count=1,
            flags=re.M,
        )
    else:
        text += f'\nNEON_AUTH_BASE_URL="{base_url}"\n'

    if enable:
        if re.search(r"^AUTH_PROVIDER=", text, flags=re.M):
            text = re.sub(
                r"^AUTH_PROVIDER=.*$",
                'AUTH_PROVIDER="neon"',
                text,
                count=1,
                flags=re.M,
            )
        else:
            text += '\nAUTH_PROVIDER="neon"\n'

    ENV_PATH.write_text(text)


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: python scripts/configure-neon-auth-env.py "
            "'https://ep-xxx.neonauth....neon.tech/neondb/auth'"
        )
    base_url = sys.argv[1].strip().strip('"').rstrip("/")
    if not base_url.endswith("/auth"):
        base_url = f"{base_url}/auth" if "/auth" not in base_url else base_url
    update_env(base_url)
    print(f"Updated {ENV_PATH}")
    print(f"  NEON_AUTH_BASE_URL → {base_url}")
    print('  AUTH_PROVIDER → "neon"')
    print("Set NEON_AUTH_COOKIE_SECRET (openssl rand -base64 32) if not already set.")


if __name__ == "__main__":
    main()
