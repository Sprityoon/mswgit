# mcp_wait_tools.py — poll tools/list until Maker editor registers tools (max ~5 min)
import json, time, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from mcp_probe import Mcp

c = Mcp()
r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-wait", "version": "1.0"}}, timeout=30)
if r is None:
    print("INIT TIMEOUT"); sys.exit(1)
c.req("notifications/initialized", notify=True)

deadline = time.time() + 300
while time.time() < deadline:
    tl = c.req("tools/list", {}, timeout=15)
    tools = (tl or {}).get("result", {}).get("tools", [])
    if tools:
        print("TOOLS(%d): %s" % (len(tools), ", ".join(t["name"] for t in tools)))
        sys.exit(0)
    print("waiting... no tools yet", flush=True)
    time.sleep(15)
print("TIMEOUT: editor never registered tools")
sys.exit(1)
