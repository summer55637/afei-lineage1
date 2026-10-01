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

function petridechange(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(toindex, "融合宠") > 0 or char.getInt(toindex, "融合类型") > 0 then
		char.TalkToCli(charaindex, -1, "融合宠无法进行重生!", "随机色")
		return
	end
	
	local pettype = other.atoi(item.getChar(itemindex, "字段"))
	local yes = 0
	
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(charaindex, "骑宠") == i then
				char.TalkToCli(charaindex, -1, "骑乘中的宠物无法回炉!", "随机色")
				return
			end
			
			for j = 1, table.getn(petlist) do
				if pettype == petlist[j][1] then
					if char.getInt(toindex, "原图像号") == petlist[j][2] then
						local array = char.getInt(toindex, "宠ID")
						
						local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
						if tempno > -1 then
							local abi = {0, 0, 0, 0}
								
							local vital = petlist[j][3][1] + math.random(0, 2)
							local str = petlist[j][3][2] + math.random(0, 2)
							local tgh = petlist[j][3][3] + math.random(0, 2)
							local dex = petlist[j][3][4] + math.random(0, 2)
							
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
							char.setChar(toindex, "名字", petlist[j][4])
			
							char.complianceParameter(toindex)
			
							char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))
			
							char.setChar(toindex, "能力提升", "")
							
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
		end
	end

	char.TalkToCli(charaindex, -1, "回炉宠物类型不符!", "随机色")
end

function data()
	petlist = {{1, 100871, {26,34,17,47}, "普鲁夏[骑]"} 
	           ,{2, 100906, {22,36,17,47}, "朵巴奈特[骑]"}   
						}
end


function main()
	data()
	item.addLUAListFunction( "ITEM_PETRIDECHANGE", "petridechange", "")
end
