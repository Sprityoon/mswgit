# mcp_call.py — one-shot Maker MCP tool call: python mcp_call.py <tool> [json-args] [timeout]
import json, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from mcp_probe import Mcp

def main():
    name = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].strip() else {}
    tmo = int(sys.argv[3]) if len(sys.argv) > 3 else 90
    c = Mcp()
    r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-call", "version": "1.0"}}, timeout=30)
    if r is None:
        print("INIT TIMEOUT"); sys.exit(1)
    c.req("notifications/initialized", notify=True)
    r = c.req("tools/call", {"name": name, "arguments": args}, timeout=tmo)
    if r is None:
        print("CALL TIMEOUT"); sys.exit(1)
    if "error" in r:
        print("ERROR:", json.dumps(r["error"], ensure_ascii=False)); sys.exit(1)
    out = []
    for x in r["result"].get("content", []):
        if x.get("type") == "text": out.append(x.get("text", ""))
        else: out.append(json.dumps(x, ensure_ascii=False)[:500])
    print("\n".join(out))
    if r["result"].get("isError"): sys.exit(2)

if __name__ == "__main__":
    main()
