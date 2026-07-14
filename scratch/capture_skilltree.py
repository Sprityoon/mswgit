# capture_skilltree.py — T48 진단용: Play 진입 → HUD 캡처 → K로 스킬트리 → 캡처 → 노드 선택 → 캡처 → stop
import sys, os, time, json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_probe import Mcp, tool

c = Mcp()
r = c.req("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                         "clientInfo": {"name": "gjc-capture", "version": "1.0"}}, timeout=20)
if r is None:
    print("INIT TIMEOUT — Maker not reachable"); sys.exit(1)
c.req("notifications/initialized", notify=True)

try:
    print("PLAY:", tool(c, "maker_play", timeout=60))
    # play 모드 진입 대기
    for i in range(30):
        time.sleep(2)
        m = tool(c, "maker_get_current_map") or ""
        if '"play"' in m or "'play'" in m or 'play' in m.lower():
            print("MODE OK after", (i + 1) * 2, "s:", m.replace("\n", " ")[:200])
            break
    time.sleep(10)  # 캐릭터 스폰 + HUD 초기화 여유

    print("SHOT_HUD:", tool(c, "maker_screenshot"))

    print("KEY_K:", tool(c, "maker_keyboard_input", {"action": "tap", "keys": ["K"]}))
    time.sleep(1.5)
    print("SHOT_TREE:", tool(c, "maker_screenshot"))

    # 노드 선택 상태 재현 (엔진 버튼은 mouse_input 불가 → 컨트롤러 직접 호출)
    lua = (
        'local popup = _EntityService:GetEntityByPath("/ui/PopupGroup/SkillTreePopup") '
        'if popup ~= nil then local ctl = popup:GetComponent("script.UISkillTreeController") '
        'if ctl ~= nil then ctl:OnNodeClicked("1_1") log("[CAPTURE] node 1_1 selected") '
        'else log("[CAPTURE] controller missing") end else log("[CAPTURE] popup missing") end'
    )
    print("SELECT:", tool(c, "maker_execute_script", {"script": lua, "context": "client"}))
    time.sleep(1.5)
    print("SHOT_SELECTED:", tool(c, "maker_screenshot"))
finally:
    print("STOP:", tool(c, "maker_stop", timeout=60))
