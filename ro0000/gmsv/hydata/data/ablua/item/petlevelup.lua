function petlevelup(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "限制等级") > 0 then
				level = math.min(char.getInt(toindex, "限制等级"), 140)
			else
				level = 140
			end
			if char.getInt(toindex, "等级") == level then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "已经是140级，无需使用该物品！", "随机色")
				return
			end

			for j = char.getInt(toindex, "等级") + 1, level do
				char.PetLevelUp(toindex)
			end

			char.setInt(toindex, "等级", 140)
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

function main()
	item.addLUAListFunction( "ITEM_PETLEVELUP", "petlevelup", "")
end
