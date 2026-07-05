-- verify_warp_monster.lua — hunt01의 살아있는 몬스터 옆으로 워프 (server_main)
local uid = "20372100009902983"
local player = _UserService:GetUserEntityByUserId(uid)
local map = _EntityService:GetEntityByPath("/maps/hunt01")
local monsters = map:GetChildComponentsByTypeName("script.Monster", true)
for _, mc in ipairs(monsters) do
	if isvalid(mc) then
		---@type Monster
		local mon = mc
		if not mon.IsDead then
			local p = mc.Entity.TransformComponent.WorldPosition
			local sr = mc.Entity.SpriteRendererComponent
			local sl = isvalid(sr) and tostring(sr.SortingLayer) or "?"
			log(string.format("[VERIFY-MON] %s at (%.1f, %.1f) SortingLayer=%s", mc.Entity.Name, p.x, p.y, sl))
			player.PlayerComponent:MoveToMapPosition("hunt01", Vector2(p.x + 1, p.y))
			break
		end
	end
end
