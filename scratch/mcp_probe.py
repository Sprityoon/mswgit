# mcp_probe.py — connect to Maker MCP over stdio JSON-RPC, list tools.
import subprocess, json, threading, queue, time, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

class Mcp:
    def __init__(self):
        self.p = subprocess.Popen(
            ["cmd.exe", "/c", "call", r"C:\Users\mh566\AppData\Local\Nexon\MapleStory Worlds\MakerMCP\msw-maker-mcp.bat"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        self.q = queue.Queue(); self._id = 0
        threading.Thread(target=self._reader, daemon=True).start()
    def _reader(self):
        while True:
            ln = self.p.stdout.readline()
            if not ln: break
            ln = ln.strip()
            if not ln: continue
            try: self.q.put(json.loads(ln))
            except Exception: pass
    def req(self, method, params=None, notify=False, timeout=30):
        msg = {"jsonrpc": "2.0", "method": method}
        if params is not None: msg["params"] = params
        if not notify:
            self._id += 1; msg["id"] = self._id
        self.p.stdin.write((json.dumps(msg) + "\n").encode()); self.p.stdin.flush()
        if notify: return None
        end = time.time() + timeout
        while time.time() < end:
            try: m = self.q.get(timeout=0.5)
            except queue.Empty: continue
            if m.get("id") == self._id: return m
        return None

def tool(c, name, args=None, timeout=60):
    r = c.req("tools/call", {"name": name, "arguments": args or {}}, timeout=timeout)
    if not r: return None
    if "error" in r: return "ERR: " + json.dumps(r["error"])
    return "\n".join(x.get("text", "") for x in r["result"].get("content", []) if x.get("type") == "text")

if __name__ == "__main__":
    c = Mcp()
    r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-probe", "version": "1.0"}}, timeout=20)
    if r is None:
        print("INIT TIMEOUT — Maker editor likely not running"); sys.exit(1)
    c.req("notifications/initialized", notify=True)
    tl = c.req("tools/list", {}, timeout=20)
    print("RAW:", json.dumps(tl, ensure_ascii=False)[:3000])
