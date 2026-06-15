#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/knot-chat/run_precheck.sh"
bash "$ROOT/knot-chat/run_hc_check.sh"
echo "DONE: full check completed"
