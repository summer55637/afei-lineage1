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

function XinChunlb(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local XinCunitemid = other.atoi(data)
	if XinCunitemid == "" then
		return
	end

	if checkEmptItemNum(charaindex) == 0 then
		char.TalkToCli(charaindex, -1, "很抱歉，您的身上物品已满！", "随机色")
		return
	end
		
	
    if XinCunitemid == 1 then
		if char.getInt(charaindex,"活力") < 50 then --汤圆
			char.newMessageToCli(charaindex, -1, "很抱歉，您身上不足50活力！", "随机色")
			return
		end	
			local rnd = math.random(1000)
			for i = 1, #drawlist do
				if rnd <= drawlist[i][1] then
					if drawlist[i][2] == 1 then
						local petid = drawlist[i][3][math.random(#drawlist[i][3])]
						npc.AddPet(charaindex, petid)
						npc.DelItem(charaindex,toitemid .. "*1")
						char.talkToServer(-1,"猪年福袋[小]恭喜玩家 [" .. char.getChar(charaindex, "名字") .. "] 打开福袋，得到宠物 — " .. enemytemp.getEnemyTempNameFromEnemyID(petid) , "随机色")
					elseif drawlist[i][2] == 2 then
						local itemid = char.Additem(charaindex,drawlist[i][3][math.random(#drawlist[i][3])])
						if drawlist[i][4] == 1 then
							if string.sub(item.getChar(itemid,"名称"),1,1) ~= "*" then
								item.setChar(itemid,"名称","*" .. item.getChar(itemid,"名称"))
								item.UpdataItemOne(charaindex, itemid)
							end
						end
						char.setInt(charaindex,"活力",char.getInt(charaindex,"活力") - 50)
						char.newMessageToCli(charaindex, -1, "扣除" .. 50 .. "活力", "白色")
						char.setInt(charaindex,"气势",char.getInt(charaindex,"气势") + 50 * 100)
						saacproto.ACFixFMData(charaindex,12,char.getInt(charaindex,"气势"),"")
						other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,2,50})
						char.DelItem(charaindex, haveitemindex)
						char.TalkToCli(charaindex, -1, "打开汤圆，获得" .. item.getChar(itemid, "名称") , "随机色")
					end
					return
				end
		end
	end
	
	if XinCunitemid == 2 then--坐骑礼包
		local rnd = math.random(100)
		for i = 1, #drawlist2 do
			if rnd <= drawlist2[i][1] then
				if drawlist2[i][2] == 1 then
					local petid = drawlist2[i][3][math.random(#drawlist2[i][3])]
					npc.AddPet(charaindex, petid)
					char.DelItem(charaindex, haveitemindex)
					char.talkToServer(-1,"恭喜玩家 [" .. char.getChar(charaindex, "名字") .. "] 打开爆竹，得到宠物 — " .. enemytemp.getEnemyTempNameFromEnemyID(petid) , "随机色")
				elseif drawlist2[i][2] == 2 then
					local itemid = char.Additem(charaindex,drawlist2[i][3][math.random(#drawlist2[i][3])])
					if drawlist2[i][4] == 1 then
						if string.sub(item.getChar(itemid,"名称"),1,1) ~= "*" then
							item.setChar(itemid,"名称","*" .. item.getChar(itemid,"名称"))
							item.UpdataItemOne(charaindex, itemid)
						end
					end
					char.DelItem(charaindex, haveitemindex)
					char.TalkToCli(charaindex, -1, "打开坐骑礼包，获得" .. item.getChar(itemid, "名称") , "随机色")
				end
				return
			end
		end
	end	
	
	if XinCunitemid == 3 then 
		local rnd = math.random(100)
		for i = 1, #drawlist3 do
			if rnd <= drawlist3[i][1] then
				if drawlist3[i][2] == 1 then
					local petid = drawlist3[i][3][math.random(#drawlist3[i][3])]
					npc.AddPet(charaindex, petid)
					char.DelItem(charaindex, haveitemindex)
					char.talkToServer(-1,"恭喜玩家 [" .. char.getChar(charaindex, "名字") .. "] 打开爆竹，得到宠物 — " .. enemytemp.getEnemyTempNameFromEnemyID(petid) , "随机色")
				elseif drawlist3[i][2] == 2 then
					local itemid = char.Additem(charaindex,drawlist3[i][3][math.random(#drawlist3[i][3])])
					if drawlist3[i][4] == 1 then
						if string.sub(item.getChar(itemid,"名称"),1,1) ~= "*" then
							item.setChar(itemid,"名称","*" .. item.getChar(itemid,"名称"))
							item.UpdataItemOne(charaindex, itemid)
						end
					end
					char.DelItem(charaindex, haveitemindex)
					 char.TalkToCli(charaindex, -1, "获得" .. item.getChar(itemid, "名称") , "随机色")
				end
				return
			end
		end
	end		
end

function data()
			 --机率,类型 1=宠物 2=道具,奖品ID 使用方法 20602,20603
			--22483,22484,22485,26449,26450,26472,26473,26474,26475,26303,26347,26348,26349,26023,22512,22504,26476
  drawlist =   {{1,   2, {21113,23800,28405,22494},1} 
			   ,{6,  2, {26057,22050},1}
			   ,{56,  2, {26045},1}
			   ,{256,  2, {21019,21018,22026,22032,22036,26007},1}
			   ,{290,  2, {22035,22041},0}
			   ,{350,  2, {20810,26023,26007},1}
			   ,{450,  2, {21008,21004,22044,26007},1}
			   ,{500,  2, {21002,22042,26007},1}
			   ,{1000, 2, {26007,26035},1}
				}--汤圆


    drawlist2 = {{1,   2, {23825,23830,23805,29061,29117},0}
			   ,{80,  2, {23823,23828,23803,29059,29115},0}
			   ,{99,  2, {23824,23829,23804,29060,29116},0}
			   ,{100, 2, {23824,23829,23804,29060,29116},0}
			   }--骑宠礼包

	drawlist3 = {{1,   2, {28364,28367},0}
			   ,{20,  2, {28364,28367},0}
			   ,{100, 2, {28363,28366},0}
				}--情人节宝箱	
									
end
function main()
	data()
	item.addLUAListFunction( "ITEM_XinChunlb", "XinChunlb", "")
end
