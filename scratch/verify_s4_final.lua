-- verify_s4_final.lua — 최종 상태 + 패시브/실효값 검증 (server_main)
local uid = "20372100009902983"
local player = _UserService:GetUserEntityByUserId(uid)
local pcComp = player:GetComponent("script.PlayerController")
---@type PlayerController
local pc = pcComp
log(string.format("[VERIFY-FIN] Lv=%d SP=%d skills=%s", pc.Level, pc.SP, pc.SkillLevelsJson))
log(string.format("[VERIFY-FIN] passive MineCooldown=%.3f MinePower=%.1f effMineCd=%.3f",
	pc:GetPassiveBonus("MineCooldown"), pc:GetPassiveBonus("MinePower"), pc:GetEffectiveMineCooldown()))
log(string.format("[VERIFY-FIN] power_strike dmg Lv2=%.2f cd Lv2=%.2f (base 1.5/1.2, per +0.3/-0.05)",
	pc:GetEffectiveDamageMultiplier("power_strike", pc:GetSkillLevel("power_strike")),
	pc:GetEffectiveCooldown("power_strike", pc:GetSkillLevel("power_strike"))))
