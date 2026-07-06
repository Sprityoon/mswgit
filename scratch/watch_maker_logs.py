# watch_maker_logs.py — read-only Maker MCP log watcher (no editor control).
# Polls maker_logs(normal) every 20s; prints only NEW lines relevant to the
# skill-tree / achievement verification session. stdout lines become monitor events.
import subprocess, json, threading, queue, time, sys, re, os

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

KEYWORDS = re.compile(r"ActionSignals|SKILL|LEVEL UP|Achievement|skill", re.I)

def resolve_mcp_bat():
    """Locate msw-maker-mcp.bat portably (no per-user hardcoded path).
    Priority: MSW_MCP_BAT env override -> project .mcp.json -> known install dirs."""
    env = os.environ.get("MSW_MCP_BAT")
    if env and os.path.isfile(env):
        return env
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # scratch/ -> project root
    try:
        with open(os.path.join(root, ".mcp.json"), encoding="utf-8") as f:
            args = json.load(f)["mcpServers"]["msw-maker-mcp"]["args"]
        for a in args:
            if str(a).lower().endswith(".bat") and os.path.isfile(a):
                return a
    except Exception:
        pass
    for cand in (
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Nexon", "MapleStory Worlds", "MakerMCP", "msw-maker-mcp.bat"),
        r"C:\Nexon\MapleStory Worlds\MakerMCP\msw-maker-mcp.bat",
    ):
        if cand and os.path.isfile(cand):
            return cand
    raise FileNotFoundError(
        "msw-maker-mcp.bat not found. Set MSW_MCP_BAT to its full path "
        "(see .mcp.json > mcpServers > msw-maker-mcp > args).")

class Mcp:
    def __init__(self):
        self.p = subprocess.Popen(
            ["cmd.exe", "/c", "call", resolve_mcp_bat()],
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

def connect():
    c = Mcp()
    r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "gjc-logwatch", "version": "1.0"}})
    if r is None: raise RuntimeError("init timeout")
    c.req("notifications/initialized", notify=True)
    return c

def tool(c, name, args=None, timeout=45):
    r = c.req("tools/call", {"name": name, "arguments": args or {}}, timeout=timeout)
    if not r or "result" not in r: return None
    return "\n".join(x.get("text", "") for x in r["result"].get("content", []) if x.get("type") == "text")

seen = set()
c = None
print("[watch] maker log watcher started", flush=True)
while True:
    try:
        if c is None:
            c = connect()
        raw = tool(c, "maker_logs", {"kind": "normal"})
        if raw:
            d = json.loads(raw)
            for l in d.get("logs", []):
                key = (l.get("dateTime"), l.get("message", "")[:160])
                if key in seen: continue
                seen.add(key)
                msg = (l.get("message") or "").replace("\n", " ")
                if l.get("logType") in ("Error", "Warning") or KEYWORDS.search(msg):
                    src = "SVR" if l.get("isGeneratedFromServer") else "CLI"
                    print(f"[{l.get('logType')}|{src}] {msg[:220]}", flush=True)
        if len(seen) > 20000: seen.clear()
    except Exception as e:
        print(f"[watch] reconnect after error: {e}", flush=True)
        try:
            if c: c.p.kill()
        except Exception: pass
        c = None
        time.sleep(10)
    time.sleep(20)
