--此lua是庄园骑证扣除声望功能
function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end


function FreeFameFeatures( meindex, kind, flg)
	char.TalkToCli(meindex, -1, "暂未开放!", "随机色")
--[[
	if char.getInt(meindex, "声望") < 200000 then
		char.TalkToCli(meindex, -1, "你的声望小于2000,所以无法制作骑证!", "随机色")
		return
	end
	if kind == 1 then
		char.TalkToCli(meindex, -1, "暂未开放!", "随机色")
	elseif kind == 2 then
		if checkEmptItemNum(meindex) == 0 then
			char.TalkToCli(meindex, meindex, "物品已满，请道具栏留有足够的空位！", "随机色")
			return
		end
		if char.getWorkInt( meindex, "家族地图") == 1041 then
			if char.getInt( meindex, "家族类型") == 0 then
				npc.AddItem(meindex, "26000")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			else
				npc.AddItem(meindex, "26007")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			end
		elseif char.getWorkInt( meindex, "家族地图") == 2031 then
			if char.getInt( meindex, "家族类型") == 0 then
				npc.AddItem(meindex, "26001")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			else
				npc.AddItem(meindex, "26006")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			end
		elseif char.getWorkInt( meindex, "家族地图") == 3031 then
			if char.getInt( meindex, "家族类型") == 0 then
				npc.AddItem(meindex, "26005")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			else
				npc.AddItem(meindex, "26002")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			end
		elseif char.getWorkInt( meindex, "家族地图") == 4031 then
			if char.getInt( meindex, "家族类型") == 0 then
				npc.AddItem(meindex, "26003")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			else
				npc.AddItem(meindex, "26008")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			end
		elseif char.getWorkInt( meindex, "家族地图") == 5031 then
			if char.getInt( meindex, "家族类型") == 0 then
				npc.AddItem(meindex, "26009")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			else
				npc.AddItem(meindex, "26004")
				char.setInt(meindex, "声望", char.getInt(meindex, "声望") - 200000)
			end
		end
	end
	]]
end
