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
		char.TalkToRound(meindex, "我的力量已经POWER UP！", "随机色")
	end
end

function DelSeal(charaindex, flg)
	local num = table.getn(petinfo[flg][1])
 	for i = 1, num do
		for j = 9, 23 do
			itemindex = char.getItemIndex(charaindex, j)
			if itemindex > -1 then
				if item.getInt(itemindex, "序号") == petinfo[flg][1][i][3] then
					if item.getInt(itemindex, "MP") == petinfo[flg][1][i][1] then
						char.TalkToCli(charaindex, -1, "交出" .. item.getChar(itemindex, "名称"), "随机色")
						char.DelItem(charaindex, j)
						break
					end
				end
			end
		end
	end
end

function CheckSeal(charaindex, flg)
	local isfind = false
	local num = table.getn(petinfo[flg][1])
	local vital = 0
	local str = 0
	local tgh = 0
	local dex = 0
 	for i = 1, num do
 		isfind = false
		for j = 9, 23 do
			itemindex = char.getItemIndex(charaindex, j)
			if itemindex > -1 then
				if item.getInt(itemindex, "序号") == petinfo[flg][1][i][3] then
					if item.getInt(itemindex, "MP") == petinfo[flg][1][i][1] then
						vital = vital + item.getInt(itemindex, "HP")
						str = str + item.getInt(itemindex, "攻")
						tgh = tgh + item.getInt(itemindex, "防")
						dex = dex + item.getInt(itemindex, "敏")
						isfind = true
						break
					end
				end
			end
		end
		if isfind == false then
			return -1, -1, -1, -1
		end
	end
	return vital, str, tgh, dex
end

function evolve(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(toindex, "转数") ~= 1 or char.getInt(toindex, "等级") ~= 140 then
		char.TalkToCli(charaindex, -1, "进化的主体宠物必须是1转140级！", "随机色")
		return
	end
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			for j = 1, table.getn(petinfo[1][1]) do
				if char.getInt(toindex, "原图像号") == petinfo[1][1][j][1] then
					ivital, istr, itgh, idex = CheckSeal(charaindex, 1)
					if ivital == -1 or istr == -1 or itgh == -1 or idex == -1 then
						char.TalkToCli(charaindex, -1, "请先将封印蛋收集齐吧！", "随机色")
						return
					end
					char.DelItem(charaindex, haveitemindex)
					array = enemytemp.getEnemyTempIDFromEnemyID(petinfo[1][1][j][2])
					tempno = enemytemp.getEnemyTempArrayFromTempNo(array)

					if tempno > -1 then
						char.dropPetFollow(charaindex, i)
						char.setInt(toindex, "宠ID", array)

						addvital = math.min(math.max(math.ceil((ivital - petinfo[1][2][1] + 8) / 4), -2), 2)
						addstr = math.min(math.max(math.ceil((istr - petinfo[1][2][2] + 8) / 4), -2), 2)
						addtgh = math.min(math.max(math.ceil((itgh - petinfo[1][2][3] + 8) / 4), -2), 2)
						adddex = math.min(math.max(math.ceil((idex - petinfo[1][2][4] + 8) / 4), -2), 2)

						vital = enemytemp.getInt(tempno, "体力") + addvital
						str = enemytemp.getInt(tempno, "腕力") + addstr
						tgh = enemytemp.getInt(tempno, "耐力") + addtgh
						dex = enemytemp.getInt(tempno, "速度") + adddex
						
						char.setInt(toindex, "地", enemytemp.getInt(tempno, "地"))
						char.setInt(toindex, "水", enemytemp.getInt(tempno, "水"))
						char.setInt(toindex, "火", enemytemp.getInt(tempno, "火"))
						char.setInt(toindex, "风", enemytemp.getInt(tempno, "风"))

						char.setChar(toindex, "名字", enemytemp.getChar(tempno, 0))

				  	sum = vital + str + tgh + dex

					  for i = 1, table.getn(ranktbl) do
					  	if sum > ranktbl[i][1] then
					  		char.setInt(toindex, "成长区间", i - 1)
					  		break
					  	end
					  end
					  
						initnum = enemytemp.getInt(tempno, "初始值")
						
						char.setInt(toindex, "能力值", char.getLiftTo8(vital , 1) + char.getLiftTo8(str , 2) + char.getLiftTo8(tgh, 3) + char.getLiftTo8(dex, 4))

						ability = {0, 0, 0, 0}
											
						for i=1, 10 do
							rnd = math.random(1,4)
							ability[rnd] = ability[rnd] + 1
						end

						char.setInt(toindex, "体力", (vital + ability[1]) * initnum)
						char.setInt(toindex, "腕力", (str + ability[2]) * initnum)
						char.setInt(toindex, "耐力", (tgh + ability[3]) * initnum)
						char.setInt(toindex, "速度", (dex + ability[4]) * initnum)

						char.setInt(toindex, "等级", 1)
						char.setInt(toindex, "转数", 0)
						char.setInt(toindex, "经验", 0)

						char.complianceParameter(toindex)

						char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))

						char.setInt(toindex, "图像号", enemytemp.getInt(tempno, "形象"))
						char.setInt(toindex, "原图像号", enemytemp.getInt(tempno, "形象"))

						char.setWorkInt(toindex, "捡起模式", 3)
						char.setFunctionPointer(toindex, "循环事件", "Loop", "")
						char.setInt(toindex, "循环事件时间", 1000)
						char.delFunctionPointer(toindex, "对话事件")
						char.delFunctionPointer(toindex, "窗口事件")
						DelSeal(charaindex, 1)
						
					end
					return
				end
			end
			char.TalkToCli(charaindex, -1, "该宠物无法进行进化！", "随机色")
			break
		end
	end
end

function seal(itemindex, charaindex, toindex, haveitemindex)
	metamo = other.atoi(item.getChar(itemindex, "字段"))
	if metamo == item.getInt(itemindex, "MP") then
		char.TalkToCli(charaindex, -1, "该封印蛋已经封印过了，无需再次封印！", "随机色")
		return
	end
	if char.getInt(toindex, "转数") ~= 1 or char.getInt(toindex, "等级") ~= 140 then
		char.TalkToCli(charaindex, -1, "封印的宠物必须是1转140级！", "随机色")
		return
	end
	if char.getInt(toindex, "极品") == 1 then
		char.TalkToCli(charaindex, -1, "新手宠无法用于封印！", "随机色")
		return
	end

	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "原图像号") == metamo then
				local LevelUpPoint = char.getInt( toindex, "能力值")
				local vital = char.getRightTo8(LevelUpPoint, 1)
				local str = char.getRightTo8(LevelUpPoint, 2)
				local tgh = char.getRightTo8(LevelUpPoint, 3)
				local dex = char.getRightTo8(LevelUpPoint, 4)
				
				item.setInt(itemindex, "MP", char.getInt(toindex, "原图像号"))
				item.setInt(itemindex, "HP", vital)
				item.setInt(itemindex, "攻", str)
				item.setInt(itemindex, "防", tgh)
				item.setInt(itemindex, "敏", dex)
				
				item.setInt(itemindex, "颜色", 6)

				item.setChar(itemindex, "说明", "此蛋已封印完毕，封印能力如下体:".. vital .. ",攻:" .. str .. ",防:" .. tgh.. ",敏:" .. dex)
				item.UpdataHaveItemOne(charaindex, haveitemindex)

				char.TalkToCli(charaindex, -1, "成功将" .. char.getChar(toindex, "名字") .. "进行封印！", "随机色")
				char.DelPet(charaindex, toindex)

			else
				char.TalkToCli(charaindex, -1, "宠物不搭配，无法进行封印！", "随机色")
			end
			return
		end
	end
	char.TalkToCli(charaindex, -1, "请选择你需要封印的宠物！", "随机色")
end

function data()
	petinfo = {{{{100327, 2786, 22242 }
						 ,{100328, 2787, 22243 }
						 ,{100329, 2788, 22244 }
						 ,{100330, 2789, 22245 }
						 },{121,149,102,143}}
						 }

	ranktbl = {{ 130, 2.5}
		    	,{ 100, 2.0}
		    	,{ 95, 1.5}
		    	,{ 90, 1.0}
		    	,{ 85, 0.5}
		    	,{ 0, 0.0}
	  				}
end


function main()
	item.addLUAListFunction( "ITEM_EVOLVE", "evolve", "")
	item.addLUAListFunction( "ITEM_SEAL", "seal", "")
	data()
end
