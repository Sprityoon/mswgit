-- verify_s1.lua — S1 검증: 실제 몬스터 처치 경로 + 채집/제작/제련 훅 발행 (server_main)
local uid = "20372100009902983"
local player = _UserService:GetUserEntityByUserId(uid)
if not isvalid(player) then
	log("[VERIFY] FAIL: player entity not found for " .. uid)
else
	log("[VERIFY] player ok: " .. tostring(player.Name))

	-- ① 실제 처치 경로: hunt01의 살아있는 몬스터를 Dead()로 처치 (Monster.Dead 내부의 업적 훅 검증)
	local map = _EntityService:GetEntityByPath("/maps/hunt01")
	local killed = false
	if isvalid(map) then
		local monsters = map:GetChildComponentsByTypeName("script.Monster", true)
		if monsters ~= nil then
			for _, mc in ipairs(monsters) do
				if isvalid(mc) then
					---@type Monster
					local mon = mc
					if not mon.IsDead then
						mon.LastAttacker = player
						mon:Dead()
						killed = true
						log("[VERIFY] killed monster via Dead(): " .. mc.Entity.Name)
						break
					end
				end
			end
		end
	end
	if not killed then
		log("[VERIFY] FAIL: no live monster found in hunt01")
	end

	-- ② 채집/제작/제련 훅과 동일한 발행 경로 (itemreact/PlayerInventory/Furnace가 호출하는 그 함수)
	_ActionSignals:EmitToPlayer(player, _ActionEnum.Gather, "Wood", 35)
	_ActionSignals:EmitToPlayer(player, _ActionEnum.Craft, "Work Bench", 1)
	_ActionSignals:EmitToPlayer(player, _ActionEnum.Smelt, "copper ingot", 1)
	log("[VERIFY] emitted Gather x35 / Craft x1 / Smelt x1")
end
