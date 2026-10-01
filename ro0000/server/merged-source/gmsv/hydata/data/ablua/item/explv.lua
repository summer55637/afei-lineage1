function explv(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			level = item.getInt(itemindex, "攻")
			if char.getInt(toindex, "限制等级") > 0 then
				levelup = math.min(char.getInt(toindex, "限制等级"), level)
			else
				levelup = math.min(level, 140)
			end

			if char.getInt(toindex, "等级") > 0 then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "宠物无需使用该物品！", "随机色")
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
			char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "等级上升至1" .. levelup .. "级！", "随机色")
			char.DelItem(charaindex, haveitemindex)
			return
		end
	end
      level = item.getInt(itemindex, "攻")
			if char.getInt(charaindex, "限制等级") > 0 then
				levelup = math.min(char.getInt(charaindex, "限制等级"), level)
			else
				levelup = math.min(level, 140)
			end
			if char.getInt(charaindex, "等级") > levelup then
				char.TalkToCli(charaindex, -1, char.getChar(charaindex, "名字") .. "等级高物该物品所提升等级，无需使用该物品！", "红色")
				return
			end
			
			sjlevel = 0
			local lv = char.getInt(charaindex, "等级")
			
			sjlevel = (level - lv) * 3
			
			char.setInt(charaindex, "等级", level)
			char.setInt(charaindex, "技能点", char.getInt(charaindex, "技能点") + sjlevel )
      
			char.setInt(charaindex, "HP", char.getWorkInt(charaindex, "最大HP"))
			char.TalkToCli(charaindex, -1, char.getChar(charaindex, "名字") .. "等级上升至2" .. levelup .. "级！", "黄色")
			
			char.complianceParameter(charaindex)
      char.Skillupsend(charaindex)
      char.sendStatusString(charaindex, "P")
      
			char.DelItem(charaindex, haveitemindex)
			return
end

function main()
	item.addLUAListFunction( "ITEM_EXPLV", "explv", "")
end
