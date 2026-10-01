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

function pethjchange(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(toindex, 146) > 0 or char.getInt(toindex, 147) > 0 then
		char.TalkToCli(charaindex, -1, "融合宠无法进行重生!", "随机色")
		return
	end
	
	local pettype = other.atoi(item.getChar(itemindex, "字段"))
	local yes = 0
	for i = 1, table.getn(petmetamolist) do
		if char.getInt(toindex, "原图像号") == petmetamolist[i] then
			yes = 1
			break
		end
	end
	if yes == 0 then
		char.TalkToCli(charaindex, -1, "回炉宠物类型不符!", "随机色")
		return
	end
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(charaindex, "骑宠") == i then
				char.TalkToCli(charaindex, -1, "骑剩中的宠物无法回炉!", "随机色")
				return
			end
			
			char.DelPet(charaindex, toindex)
			
			local petindex = char.AddPet(charaindex, petidlist[pettype], 1)
			if char.check(petindex) == 1 then
				local array = char.getInt(petindex, "宠ID")
				
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
					
					char.setInt(petindex, "能力值", char.getLiftTo8(vital, 1) + char.getLiftTo8(str, 2) + char.getLiftTo8(tgh, 3) + char.getLiftTo8(dex, 4))
	
					char.setInt(petindex, "体力", (vital + ability[1]) * initnum)
					char.setInt(petindex, "腕力", (str + ability[2]) * initnum)
					char.setInt(petindex, "耐力", (tgh + ability[3]) * initnum)
					char.setInt(petindex, "速度", (dex + ability[4]) * initnum)
	
					char.setInt(petindex, "等级", 1)
					char.setInt(petindex, "经验", 0)
	
					char.complianceParameter(petindex)
	
					char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))
	
					char.setInt(petindex, "等级", 1)
					char.setInt(petindex, "经验", 0)
					char.setInt(petindex, "转数", 0)
					char.setChar(petindex, "主人账号", char.getChar( charaindex, "账号"))
					char.setChar(petindex, "主人名字", char.getChar( charaindex, "名字"))
					char.complianceParameter(petindex)
	
					char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))
	
					for j = 0, 4 do
						if petindex == char.getCharPet(charaindex, j) then
							char.dropPetFollow(charaindex, j)
							break
						end
					end
					char.setWorkInt(petindex, "捡起模式", 3)
					char.setFunctionPointer(petindex, "循环事件", "Loop", "")
					char.setInt(petindex, "循环事件时间", 1000)
					char.delFunctionPointer(petindex, "对话事件")
					char.delFunctionPointer(petindex, "窗口事件")
					char.DelItem(charaindex, haveitemindex)
				end
			end
		end
	end
end

function data()
	petmetamolist = {101999,102000,102071,102070,102072}
	petidlist = {2703,2704,2819,2818,2823}
end


function main()
	data()
	item.addLUAListFunction( "ITEM_PETHJCHANGE", "pethjchange", "")
end
