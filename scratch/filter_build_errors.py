# filter_build_errors.py — refresh, then classify build logs by severity and surface non-Info entries.
import json, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from mcp_probe import Mcp, tool

c = Mcp()
if c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-verify", "version": "1.0"}}, timeout=30) is None:
    print("INIT TIMEOUT"); sys.exit(1)
c.req("notifications/initialized", notify=True)

raw = c.req("tools/call", {"name": "maker_logs", "arguments": {"kind": "build"}}, timeout=60)
logs = json.loads("\n".join(x.get("text","") for x in raw["result"]["content"] if x.get("type")=="text"))
entries = logs.get("logs", [])

# severity histogram
from collections import Counter
sev = Counter(e.get("logType") for e in entries)
print("count:", logs.get("count"), "severity:", dict(sev))

# distinct MOD issue codes
codes = Counter()
for e in entries:
    m = e.get("message","")
    if "MODIssueFormat" in m:
        inside = m.split("<MODIssueFormat>")[1].split("</MODIssueFormat>")[0]
        codes[inside] += 1
print("issue codes:", dict(codes))

# print every non-Info entry (errors/warnings) in full
print("\n== NON-INFO ENTRIES ==")
n = 0
for e in entries:
    if e.get("logType") != "Info":
        n += 1
        print(json.dumps(e, ensure_ascii=False))
print("non-info total:", n)

# print entries whose message contains quest/action/warp/place related tokens
print("\n== TOKEN MATCHES (Quest/Action/Warp/Place/Reward) ==")
tok = 0
for e in entries:
    m = e.get("message","") + json.dumps(e.get("stackTrace",[]), ensure_ascii=False)
    if any(k in m for k in ["Quest","Action","Warp","Place","Reward","Onboard"]):
        tok += 1
        print(json.dumps(e, ensure_ascii=False)[:400])
print("token matches:", tok)
