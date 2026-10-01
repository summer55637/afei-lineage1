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

function petoldridechange(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(toindex, "融合宠") > 0 or char.getInt(toindex, "融合类型") > 0 then
		char.TalkToCli(charaindex, -1, "融合宠无法进行重生!", "随机色")
		return
	end
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "等级") < 140 then
				char.TalkToCli(charaindex, -1, "该宠物等级小于140级，无法进行回炉!", "随机色")
				return
			end
			for j = 1, #petlist do
				if char.getInt(toindex, "原图像号") == petlist[j] then
					if char.getInt(charaindex, "骑宠") == i then
						char.TalkToCli(charaindex, -1, "骑乘中的宠物无法回炉!", "随机色")
						return
					end
					local array = char.getInt(toindex, "宠ID")
					
					local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
					if tempno > -1 then
						local abi = {0, 0, 0, 0}
						local vital = enemytemp.getInt(tempno, "体力") + math.random(2, 4)
						local str = enemytemp.getInt(tempno, "腕力") + math.random(2, 4)
						local tgh = enemytemp.getInt(tempno, "耐力") + math.random(2, 4)
						local dex = enemytemp.getInt(tempno, "速度") + math.random(2, 4)
						
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
					return
				end
			end
			char.TalkToCli(charaindex, -1, "回炉宠物类型不符合!", "随机色")
			return
		end
	end
	char.TalkToCli(charaindex, -1, "该物品只能让宠物使用!", "随机色")
end

function data()
					-- 机暴00, 白象01, 金飞02, 红狗03, 蓝龙04, 绿甲05, 红蛙06, 红猩07, 蓝暴08, 红暴09,   红虎,   绿虎,   金虎,   黄虎, 石猩猩, 海主人,   红飞,   红鸡,   灰鸡,   灰雷,   蓝雷,   红雷,   绿雷,   金雷
	petlist = {100374, 100358, 100362, 100279, 100288, 100283, 100346, 100310, 100372, 100373, 100329, 100327, 100330, 100328, 100307, 100348, 100360, 100370, 100369, 100351, 100352, 100353, 100354, 100355}
end


function main()
	data()
	item.addLUAListFunction( "ITEM_PETOLDRIDECHANGE", "petoldridechange", "")
end
