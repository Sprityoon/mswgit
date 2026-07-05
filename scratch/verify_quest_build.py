# verify_quest_build.py — refresh workspace, then dump build logs to catch compile errors.
import json, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from mcp_probe import Mcp, tool

c = Mcp()
r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-verify", "version": "1.0"}}, timeout=30)
if r is None:
    print("INIT TIMEOUT — Maker editor not running"); sys.exit(1)
c.req("notifications/initialized", notify=True)

print("== refresh_workspace ==")
print(tool(c, "maker_refresh_workspace", {}, timeout=120))

# Give the reimport/compile time to finish.
time.sleep(12)

print("== build logs ==")
bl = tool(c, "maker_logs", {"kind": "build"}, timeout=60)
print(bl)
