-- verify_s4_neg.lua — 거절 케이스 (client): 레벨 게이트 / SP 부족
local lp = _UserService.LocalPlayer
if not isvalid(lp) then
	log("[VERIFY-S4] FAIL: no local player")
else
	local pcComp = lp:GetComponent("script.PlayerController")
	---@type PlayerController
	local pc = pcComp
	-- Lv1, SP0 상태: dash는 RequiredLevel=2라 게이트 거절, power_strike는 SP 부족 거절이어야 한다
	pc:ServerRequestSkillLevelUp("dash")
	pc:ServerRequestSkillLevelUp("power_strike")
	log("[VERIFY-S4] negative requests sent (dash: level gate, power_strike: SP)")
end
