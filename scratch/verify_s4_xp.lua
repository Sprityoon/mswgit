-- verify_s4_xp.lua — XP 지급으로 레벨업→SP 지급 경로 검증 (server_main)
local uid = "20372100009902983"
local player = _UserService:GetUserEntityByUserId(uid)
local pcComp = player:GetComponent("script.PlayerController")
---@type PlayerController
local pc = pcComp
pc:AddXP(1000)
log(string.format("[VERIFY-S4] after AddXP(1000): Lv=%d XP=%d/%d SP=%d", pc.Level, pc.XP, pc.MaxXP, pc.SP))
