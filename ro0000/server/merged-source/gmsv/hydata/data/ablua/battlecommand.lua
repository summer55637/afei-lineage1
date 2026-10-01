function FreeBattleCommand( battleindex, charaindex, side)
	--print("\n类型="..char.getInt(charaindex, "类型"))
	if char.getInt(charaindex, "类型") == 52 and char.getInt(charaindex,"地图号") == 12346 then
		--battle.Ai_One(charaindex, battleindex, side,0)
		offline.Attack(battleindex, charaindex, side)
		local pindex = char.getCharPet(charaindex, char.getInt(charaindex, "战宠"))
		if char.check(pindex) == 1 then
			--battle.Ai_One(pindex, battleindex, side,0)
			offline.Attack(battleindex, pindex, side)
		end
	end
end
