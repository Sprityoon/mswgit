-- verify_ach.lua — 업적 진행도/상태 + 플레이어 스킬 상태 덤프 (server_main)
local uid = "20372100009902983"
local player = _UserService:GetUserEntityByUserId(uid)
if not isvalid(player) then
	log("[VERIFY-ACH] FAIL: player not found")
else
	local pa = player.PlayerAchievement
	if pa == nil then
		log("[VERIFY-ACH] FAIL: PlayerAchievement component missing")
	else
		local n = 0
		for id, ud in pairs(pa.UserDataTable) do
			log(string.format("[VERIFY-ACH] id=%s state=%s step=%s value=%s", tostring(id), tostring(ud.State), tostring(ud.Step), tostring(ud.Value)))
			n = n + 1
		end
		log("[VERIFY-ACH] total entries: " .. n)
	end
	local pcComp = player:GetComponent("script.PlayerController")
	if isvalid(pcComp) then
		---@type PlayerController
		local pc = pcComp
		log(string.format("[VERIFY-PC] Lv=%d XP=%d/%d SP=%d skills=%s", pc.Level, pc.XP, pc.MaxXP, pc.SP, pc.SkillLevelsJson))
		log(string.format("[VERIFY-PC] gate 1001=%s 1002=%s 1004=%s 1005=%s",
			tostring(pc:IsUnlockAchievementSatisfied(1001)),
			tostring(pc:IsUnlockAchievementSatisfied(1002)),
			tostring(pc:IsUnlockAchievementSatisfied(1004)),
			tostring(pc:IsUnlockAchievementSatisfied(1005))))
	end
end
