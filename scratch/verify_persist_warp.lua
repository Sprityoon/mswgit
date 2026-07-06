-- verify_persist_warp.lua — 재시작 후 스킬/SP 영속 확인 + hunt01 워프 (server_main)
local uid = "20372100009902983"
local player = _UserService:GetUserEntityByUserId(uid)
local pcComp = player:GetComponent("script.PlayerController")
---@type PlayerController
local pc = pcComp
log(string.format("[VERIFY-PERSIST] Lv=%d SP=%d skills=%s", pc.Level, pc.SP, pc.SkillLevelsJson))
local pa = player.PlayerAchievement
if pa ~= nil then
	local ud = pa.UserDataTable[1005]
	if ud ~= nil then
		log(string.format("[VERIFY-PERSIST] ach1005 state=%s value=%s", tostring(ud.State), tostring(ud.Value)))
	end
end
player.PlayerComponent:MoveToMapPosition("hunt01", Vector2(0, 0))
log("[VERIFY-PERSIST] warped to hunt01")
