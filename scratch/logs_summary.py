# logs_summary.py — fetch Maker logs, print compact "TYPE | message" lines.
# usage: python logs_summary.py [kind] [count] [filter-regex]
import json, sys, re
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from mcp_probe import Mcp

kind = sys.argv[1] if len(sys.argv) > 1 else "normal"
count = int(sys.argv[2]) if len(sys.argv) > 2 else 300
flt = re.compile(sys.argv[3], re.I) if len(sys.argv) > 3 else None

c = Mcp()
r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-logs", "version": "1.0"}}, timeout=30)
c.req("notifications/initialized", notify=True)
r = c.req("tools/call", {"name": "maker_logs", "arguments": {"kind": kind, "count": count}}, timeout=60)
txt = "\n".join(x.get("text", "") for x in r["result"].get("content", []) if x.get("type") == "text")
data = json.loads(txt)
n = 0
for lg in data.get("logs", []):
    t, m = lg.get("logType", "?"), (lg.get("message") or "").replace("\n", " / ")
    line = "%s | %s" % (t, m[:220])
    if flt and not flt.search(line): continue
    if t == "Info" and not flt: continue  # default: show only non-Info unless filtered
    print(line); n += 1
print("--- shown %d of %d (%s)" % (n, data.get("count", 0), kind))
