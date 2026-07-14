# capture_skilltree2.py — refresh 후 재캡처: 빌드 최신화 → Play → K → 캡처 → 노드 선택 → 캡처 → stop
import sys, os, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_probe import Mcp, tool

c = Mcp()
r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                         "clientInfo": {"name": "gjc-capture2", "version": "1.0"}}, timeout=20)
if r is None:
    print("INIT TIMEOUT"); sys.exit(1)
c.req("notifications/initialized", notify=True)

try:
    print("REFRESH:", (tool(c, "maker_refresh_workspace", timeout=300) or "")[:500])
    # 빌드 로그에서 Error 수 확인
    logs = tool(c, "maker_logs", {"kind": "build"}, timeout=60) or ""
    err = logs.lower().count('"error"')
    print("BUILD_LOG_HEAD:", logs[:400].replace("\n", " "))

    print("PLAY:", tool(c, "maker_play", timeout=60))
    for i in range(30):
        time.sleep(2)
        m = tool(c, "maker_get_current_map") or ""
        if '"play"' in m:
            print("MODE OK after", (i + 1) * 2, "s")
            break
    time.sleep(10)

    print("SHOT_HUD:", tool(c, "maker_screenshot"))
    print("KEY_K:", tool(c, "maker_keyboard_input", {"action": "tap", "keys": ["K"]}))
    time.sleep(1.5)
    print("SHOT_TREE:", tool(c, "maker_screenshot"))

    lua = (
        'local popup = _EntityService:GetEntityByPath("/ui/PopupGroup/SkillTreePopup") '
        'if popup ~= nil then local ctl = popup:GetComponent("script.UISkillTreeController") '
        'if ctl ~= nil then ctl:OnNodeClicked("1_1") end end'
    )
    print("SELECT:", tool(c, "maker_execute_script", {"script": lua, "context": "client"}))
    time.sleep(1.5)
    print("SHOT_SELECTED:", tool(c, "maker_screenshot"))
finally:
    print("STOP:", tool(c, "maker_stop", timeout=60))
