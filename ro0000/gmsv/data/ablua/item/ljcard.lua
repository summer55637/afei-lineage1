function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function ljcard(itemindex, charaindex, toindex, haveitemindex)
	if checkEmptItemNum(charaindex) == 0 then
		char.TalkToCli(charaindex, -1, "很抱歉，您的身上物品已满！", "随机色")
		return
	end
		
	if checkEmptPetNum(charaindex) == 0 then
		char.TalkToCli(charaindex, -1, "很抱歉，您的身上宠物已满！", "随机色")
		return
	end
		

	char.DelItem(charaindex, haveitemindex)
	local rnd = math.random(100)
	for i = 1, table.getn(drawlist) do
		if rnd <= drawlist[i][1] then
			if drawlist[i][2] == 1 then
				local petid = drawlist[i][3][math.random(table.getn(drawlist[i][3]))]
				npc.AddPet(charaindex, petid)
				char.talkToServer(-1,"[幸运宝箱] 恭喜玩家 [" .. char.getChar(charaindex, "名字") .. "] 打开宝箱，得到宠物 — " .. enemytemp.getEnemyTempNameFromEnemyID(petid) , "随机色")
			elseif drawlist[i][2] == 2 then
				local itemid = drawlist[i][3][math.random(table.getn(drawlist[i][3]))]
				npc.AddItem(charaindex, itemid)
				char.talkToServer(-1,"[幸运宝箱] 恭喜玩家 [" .. char.getChar(charaindex, "名字") .. "] 打开宝箱，得到道具 — " ..  item.getNameFromNumber(itemid) , "随机色")
			end
			return
		end
	end
end

function data()
						--机率,类型,奖品ID
	drawlist = {{1,   2, {21032,21033,21034,21035,21036,21037,21038,21039,21040,21041,21042,21043,21108}}
						 ,{10,   2, {21032,21033,21034,21035,21036,21037,21038,21039,21040,21041,21042,21043,21108}}
						 ,{15,  2, {21032,21033,21034,21035,21036,21037,21038,21039,21040,21041,21042,21043,21108}}
						 ,{25,  2, {21032,21033,21034,21035,21036,21037,21038,21039,21040,21041,21042,21043,21108}}
						 ,{45,  2, {21032,21033,21034,21035,21036,21037,21038,21039,21040,21041,21042,21043,21108}}
						 ,{60,  2, {21032,21033,21034,21035,21036,21037,21038,21039,21040,21041,21042,21043,21108}}
						 ,{91,  2, {21032,21033,21034,21035,21036,21037,21038,21039,21040,21041,21042,21043,21108}}
						 ,{99,  2, {21108,21023,21024,21025,21026,18063}}       --出环8
						 ,{100, 2, {21108,21023,21024,21025,21026,18069,18075,18066}}       --出属性环8
						 }
end

function main()
	data()
	item.addLUAListFunction( "ITEM_LJCARD", "ljcard", "")
end
