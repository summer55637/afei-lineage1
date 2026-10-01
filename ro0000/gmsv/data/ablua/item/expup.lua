function expup(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			local level = char.getInt(toindex, "等级")
			local itemexp = other.atoi(item.getChar(itemindex, "字段"))

			char.setInt(toindex, "当前经验", math.min(2000000000,char.getInt(toindex, "当前经验") + itemexp))
			char.setInt(toindex, "等级", 0)
			if char.getInt(toindex, "限制等级") > 0 then
				levelup = math.max(char.getInt(toindex, "限制等级"), level)
			else
				levelup = 140
			end
			for i = level + 1, levelup do
				local nextexp = char.GetOldLevelExp(level + 1) - char.GetOldLevelExp(level)
				if char.getInt(toindex, "当前经验") > nextexp then
					char.setInt(toindex, "当前经验", char.getInt(toindex, "当前经验") - nextexp)
					char.PetLevelUp(toindex)
					
					level = level + 1
				else
				
				end
			end
			
			char.setInt(toindex, "等级", level)
			if char.getInt(toindex, "等级") == 140 then
				char.setInt(toindex, "当前经验", 0)
			end
			char.complianceParameter(toindex)

			char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))
			char.sendStatusString(charaindex, "K" .. i)
			char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "等级上升至" .. level .. "级！", "随机色")
			char.DelItem(charaindex, haveitemindex)
			return
		end
	end
	char.TalkToCli(charaindex, -1, "该物品只能给宠物使用！", "随机色")
end

function luaexpup(charaindex,exp)
	if char.getInt(charaindex,"等级") >= 140 then
		return 0
	end
	local uptype = 0
	char.setInt(charaindex, "当前经验", math.min(2000000000,char.getInt(charaindex, "当前经验") + exp))
	while char.getInt(charaindex, "当前经验") >= char.getLevelExp(charaindex,char.getInt(charaindex,"等级") + 1) and char.getLevelExp(charaindex,char.getInt(charaindex,"等级") + 1) > 0 do
		char.setInt(charaindex, "当前经验",char.getInt(charaindex, "当前经验") - char.getLevelExp(charaindex,char.getInt(charaindex,"等级") + 1))
		char.setInt(charaindex,"等级",char.getInt(charaindex,"等级") + 1)
		char.setInt(charaindex,"技能点",char.getInt(charaindex,"技能点") + 3)
		uptype = 1
	end
	char.sendStatusString(charaindex, "P")
	char.newMessageToCli(charaindex, -1, "获得" .. exp .. "经验", "白色")
	if uptype == 1 then
		char.newMessageToCli(charaindex, -1, "等级升至" .. char.getInt(charaindex,"等级") .. "级", "白色")
		char.Skillupsend(charaindex)
	end
	local petindex = char.getCharPet(charaindex,char.getInt(charaindex,"战宠"))
	if char.check(petindex) == 1 then
		if char.getInt(petindex, "限制等级") > 0 then
			levelup = math.min(char.getInt(petindex, "限制等级"), 140)
		else
			levelup = 140
		end
		if char.getInt(petindex,"等级") >= levelup then
			return 0
		end
		char.setInt(petindex, "当前经验", math.min(2000000000,char.getInt(petindex, "当前经验") + exp))
		while char.getInt(petindex, "当前经验") >= char.getLevelExp(petindex,char.getInt(petindex,"等级") + 1) and char.getLevelExp(petindex,char.getInt(petindex,"等级") + 1) > 0 do
			char.setInt(petindex, "当前经验",char.getInt(petindex, "当前经验") - char.getLevelExp(petindex,char.getInt(petindex,"等级") + 1))
			char.PetLevelUp(petindex)
			char.setInt(petindex,"等级",char.getInt(petindex,"等级") + 1)
			char.sendStatusString(charaindex, "K" .. char.getInt(charaindex,"战宠"))
		end
	end
	return 0
end

function main()
	item.addLUAListFunction( "ITEM_EXPUP", "expup", "")
end
