function explvv(itemindex, charaindex, toindex, haveitemindex)
	local itembuff = item.getChar(itemindex,"字段")
	if itembuff == "" then
		return
	end
	local petid = other.getString(itembuff,"|",1)
	local level = other.getString(itembuff,"|",2)
	if petid == "" or level == "" then
		return
	end
	petid = other.atoi(petid)
	level = other.atoi(level)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if petid ~= -1 then
				if char.getInt(toindex,"宠ID") ~= petid then
					char.newMessageToCli(charaindex, -1, "不能给该宠物使用", "白色")
					return
				end
			end
			if char.getInt(toindex, "限制等级") > 0 then
				levelup = math.min(char.getInt(toindex, "限制等级"), level)
			else
				levelup = math.min(level, 140)
			end

			if char.getInt(toindex, "等级") > levelup then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "等级高于该物品所提升等级，无需使用该物品！", "随机色")
				return
			end
			
			local lv = char.getInt(toindex, "等级")
			char.setInt(toindex, "等级", 0)
			for j = lv + 1, levelup do
				char.PetLevelUp(toindex)
			end

			char.setInt(toindex, "等级", levelup)
			char.complianceParameter(toindex)

			char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))
			char.sendStatusString(charaindex, "K" .. i)
			char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "等级上升至" .. levelup .. "级！", "随机色")
			char.DelItem(charaindex, haveitemindex)
			return
		end
	end

	char.TalkToCli(charaindex, -1, "该物品只能给宠物使用！", "随机色")
end

function main()
	item.addLUAListFunction( "ITEM_EXPLVV", "explvv", "")
end
