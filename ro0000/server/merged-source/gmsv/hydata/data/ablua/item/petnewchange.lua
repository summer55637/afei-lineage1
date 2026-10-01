function Loop(meindex)
	if char.getInt(meindex, "原图像号") == char.getInt(meindex, "图像号") then
		char.setInt(meindex, "图像号", 101147)
		char.ToAroundChar(meindex)
		char.setInt(meindex, "循环事件时间", 2000)
	else
		char.setInt(meindex, "图像号", char.getInt(meindex, "原图像号"))
		char.ToAroundChar(meindex)
		char.setInt(meindex, "循环事件时间", 0)
		char.setWorkInt(meindex, "捡起模式", 1)
		char.delFunctionPointer(meindex, "循环事件")
		char.TalkToRound(meindex, "我已经得到重生了！", "随机色")
	end
end

function petnewchange(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(toindex, 146) > 0 or char.getInt(toindex, 147) > 0 then
		char.TalkToCli(charaindex, -1, "融合宠无法进行重生!", "随机色")
		return
	end
	
	local pettype = other.atoi(item.getChar(itemindex, "字段"))
	local yes = 0
	for i = 1, table.getn(petlist) do
		if pettype == petlist[i][1] then
			for j = 1, table.getn(petlist[i][2]) do
				if char.getInt(toindex, "原图像号") == petlist[i][2][j] then
					yes = 1
					break
				end
			end
		end
	end
	if yes == 0 then
		char.TalkToCli(charaindex, -1, "回炉宠物类型不符!", "随机色")
		return
	end
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(charaindex, "骑宠") == i then
				char.TalkToCli(charaindex, -1, "骑乘中的宠物无法回炉!", "随机色")
				return
			end
			local array = char.getInt(toindex, "宠ID")
			
			local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
			if tempno > -1 then
				local abi = {0, 0, 0, 0}
				local vital = enemytemp.getInt(tempno, "体力") + math.random(0, 2)
				local str = enemytemp.getInt(tempno, "腕力") + math.random(0, 2)
				local tgh = enemytemp.getInt(tempno, "耐力") + math.random(0, 2)
				local dex = enemytemp.getInt(tempno, "速度") + math.random(0, 2)
				
					initnum = enemytemp.getInt(tempno, "初始值")

					ability = {0, 0, 0, 0}
										
					for i=1, 10 do
						rnd = math.random(1,4)
						ability[rnd] = ability[rnd] + 1
					end
					
					char.setInt(toindex, "能力值", char.getLiftTo8(vital, 1) + char.getLiftTo8(str, 2) + char.getLiftTo8(tgh, 3) + char.getLiftTo8(dex, 4))

					char.setInt(toindex, "体力", (vital + ability[1]) * initnum)
					char.setInt(toindex, "腕力", (str + ability[2]) * initnum)
					char.setInt(toindex, "耐力", (tgh + ability[3]) * initnum)
					char.setInt(toindex, "速度", (dex + ability[4]) * initnum)

					char.setInt(toindex, "等级", 1)
					char.setInt(toindex, "经验", 0)

					char.complianceParameter(toindex)

					char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))

					char.setInt(toindex, "等级", 1)
					char.setInt(toindex, "经验", 0)
					char.setInt(toindex, "转数", 0)

					char.complianceParameter(toindex)

					char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))


				char.dropPetFollow(charaindex, i)
				char.setWorkInt(toindex, "捡起模式", 3)
				char.setFunctionPointer(toindex, "循环事件", "Loop", "")
				char.setInt(toindex, "循环事件时间", 1000)
				char.delFunctionPointer(toindex, "对话事件")
				char.delFunctionPointer(toindex, "窗口事件")
				char.DelItem(charaindex, haveitemindex)
			end
		end
	end
end

function data()
	petlist = {{1, {101909,101906,101907,101908}}
							,{2, {100909}}
							,{3, {101881,101882}}
							,{4, {101441}}
							,{5, {101867,101868}}
							,{6, {101875,102057,102034,102033}}
							,{7, {101412}}
							,{8, {101760}}
							,{9, {101616}}
							,{10, {101501}}
							,{11, {101761}}
							,{12, {101886}}
							,{13, {101885,101884,101934}}
							,{14, {100872}}
							,{15, {101424,101425,101426,101427}}
							,{16, {101180}}
							,{17, {101768,101767}}
							,{18, {101871,101766}}
							,{19, {101819}}
							,{20, {104000,100873}}
							,{21, {101438,101437,101442,101443}}
							,{22, {101869,101870}}
							,{23, {101612,101613,101614,101615}}
							,{24, {101910,101911}}
							,{25, {101999,102000,102070,102071,102072}}
							,{26, {101997,101998}}
							,{27, {104124}}
							,{28, {100904}}
							,{29, {102013,102014,102015,102016}}
							,{30, {102009,102010}}
							,{31, {102001,102002}}
							,{32, {102018,102019}}
							,{33, {101177}}
							,{34, {100907}}
							}
end


function main()
	data()
	item.addLUAListFunction( "ITEM_PETNEWCHANGE", "petnewchange", "")
end
