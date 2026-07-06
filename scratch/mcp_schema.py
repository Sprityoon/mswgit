# mcp_schema.py — print input schemas of selected Maker MCP tools
import json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from mcp_probe import Mcp

want = set(sys.argv[1:]) or {"maker_execute_script", "maker_keyboard_input", "maker_mouse_input", "maker_screenshot", "maker_get_context_keys"}
c = Mcp()
c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-schema", "version": "1.0"}}, timeout=30)
c.req("notifications/initialized", notify=True)
tl = c.req("tools/list", {}, timeout=20)
for t in tl["result"]["tools"]:
    if t["name"] in want:
        print("=== %s ===" % t["name"])
        print((t.get("description") or "")[:600])
        print(json.dumps(t.get("inputSchema", {}), ensure_ascii=False)[:1500])
        print()
