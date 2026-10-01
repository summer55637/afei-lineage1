function OffLineCommand( battleindex, charaindex, side)
	--print("\n类型="..char.getInt(charaindex, "类型"))
	if char.getInt(charaindex, "类型") == 1 or  char.getInt(charaindex, "类型") == 52 then
		if char.getInt(charaindex, "类型") == 1 and char.getInt(charaindex,"转数") < 1 then
			if npc.CheckEvent(charaindex,301) == 0 and npc.CheckNowEvent(charaindex,301) ~= 0 then
				char.logou(charaindex)
				return
			elseif npc.CheckEvent(charaindex,304) == 0 and npc.CheckNowEvent(charaindex,304) ~= 0 then
				char.logou(charaindex)
				return
			end
		end
		if char.getWorkInt(charaindex,"段位临时") == 1 then
			offline.Guard(charaindex)
			return
		end
		if char.getInt(charaindex, "类型") == 1 then
			if char.getWorkInt(charaindex,"NPC临时1") > other.time() then
				return
			end
			char.setWorkInt(charaindex,"NPC临时1",other.time() + 6)
		elseif char.getInt(charaindex, "类型") == 52 then
			if char.getWorkInt(charaindex,"NPC临时3") > other.time() then
				return
			end
			if char.getWorkInt(charaindex, "组队") == 1 then
				char.setWorkInt(charaindex,"NPC临时3",other.time() + 10)
			else
				char.setWorkInt(charaindex,"NPC临时3",other.time() + 3)
			end
		end
		local jiaren = 0
		if char.getInt(charaindex, "类型") == 52 then
			if char.getWorkInt(charaindex, "组队") == 1 then
				jiaren = 1
			elseif char.getWorkInt(charaindex, "组队") == 2 then
				local duizhangindex = char.getWorkInt(charaindex, "队员1")
				if duizhangindex > -1 then
					if char.getInt(duizhangindex, "类型") == 52 then
						jiaren = 1
					end
				end
			end
		end
		if(char.getInt(charaindex, "HP") < (char.getWorkInt(charaindex, "最大HP") * 0.8)) then
			--加500血
			if jiaren == 1 then
				offline.Recovery(battleindex, charaindex,charaindex, 450)
			else
				offline.Recovery(battleindex, charaindex,charaindex, 850)
			end
		else
			local pindex = char.getCharPet(charaindex, char.getInt(charaindex, "骑宠"))
			if char.check(pindex) == 1 then
				if(char.getInt(pindex, "HP") < (char.getWorkInt(pindex, "最大HP") * 0.8)) then
					if jiaren == 1 then
						offline.Recovery(battleindex, charaindex,charaindex, 450)
					else
						offline.Recovery(battleindex, charaindex,charaindex, 850)
					end
					return
				end
			end
			local pindex2 = char.getCharPet(charaindex, char.getInt(charaindex, "战宠"))
			if char.check(pindex2) == 1 then
				if(char.getInt(pindex2, "HP") < (char.getWorkInt(pindex2, "最大HP") * 0.8)) then
					if jiaren == 1 then
						offline.Recovery(battleindex, charaindex,pindex2, 450)
					else
						offline.Recovery(battleindex, charaindex,pindex2, 850)
					end
					return
				end
			end
			--默认攻击
			offline.Attack(battleindex, charaindex, side)
		end
	else
		--当HP剩下50%时
		--if(char.getInt(charaindex, "HP") < (char.getWorkInt(charaindex, "最大HP") * 0.8)) then
			--加500血
		--	offline.Recovery(battleindex, charaindex, 2000)
		--else
			--默认攻击
			if char.getInt(charaindex, "类型") == 3 then
				local myindex = char.getWorkInt(charaindex,"宠物主人索引")
				if char.check(myindex) == 1 then
					if char.getWorkInt(myindex,"段位临时") == 1 then
						offline.Guard(charaindex)
						return
					end
				end
			end
			offline.Attack(battleindex, charaindex, side)
		--end
	end
end
