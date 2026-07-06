-- verify_s4_unlock.lua — 스킬트리 해금/강화 전체 체인 (client)
local lp = _UserService.LocalPlayer
local pcComp = lp:GetComponent("script.PlayerController")
---@type PlayerController
local pc = pcComp
pc:ServerRequestSkillLevelUp("power_strike")  -- 해금 (Lv1, ach1001, SP1)
pc:ServerRequestSkillLevelUp("power_strike")  -- 강화 Lv2 (SP1)
pc:ServerRequestSkillLevelUp("dash")          -- 해금 (Lv2, ach1002, SP1)
pc:ServerRequestSkillLevelUp("fireball")      -- 해금 (parent power_strike, Lv3, SP1)
pc:ServerRequestSkillLevelUp("earth_shatter") -- 해금 (parent fireball, Lv5, ach1004, SP2)
pc:ServerRequestSkillLevelUp("swift_gather")  -- 해금 (Lv2, ach1002, SP1)
pc:ServerRequestSkillLevelUp("mine_power")    -- 해금 (parent swift_gather, Lv4, ach1005, SP2)
log("[VERIFY-S4] unlock chain requests sent (expected total SP spend: 9)")
