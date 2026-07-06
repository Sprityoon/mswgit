# run_lua.py — execute a Lua file in a Play Test context: python run_lua.py <file.lua> [context]
import json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from mcp_probe import Mcp

path = sys.argv[1]
ctx = sys.argv[2] if len(sys.argv) > 2 else "server_main"
src = open(path, encoding="utf-8").read()
c = Mcp()
c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-lua", "version": "1.0"}}, timeout=30)
c.req("notifications/initialized", notify=True)
r = c.req("tools/call", {"name": "maker_execute_script", "arguments": {"script": src, "context": ctx}}, timeout=60)
print(json.dumps(r.get("result", r), ensure_ascii=False)[:800])
