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
		char.TalkToRound(meindex, "我已经得到改变了！", "随机色")
	end
end

function skyfusionchange(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			
			if char.getInt(toindex, "宠ID") < 1600 or char.getInt(toindex, "宠ID") > 1631 then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "并非天空融合宠!", "随机色")
				return
			end
			if char.getInt(toindex, "等级") < 140 then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "未达到140级,无法使用该物品!", "随机色")
				return
			end
			local LevelUpPoint = char.getInt(toindex, "能力值")
			local PetRank = char.getInt(toindex, "成长区间")

			local vital = char.getRightTo8(LevelUpPoint, 1)
			local str = char.getRightTo8(LevelUpPoint, 2)
			local tgh = char.getRightTo8(LevelUpPoint, 3)
			local dex = char.getRightTo8(LevelUpPoint, 4)
			local skill = {-1, -1, -1, -1, -1, -1, -1}
			for i = 1, 7 do
				skill[i] = char.getPetSkill(toindex, i - 1)
			end

			char.DelPet(charaindex, toindex)
			
			local petindex = char.AddPet(charaindex, math.random(3000, 3031), 1)
			if char.check(petindex) == 1 then
				local array = char.getInt(petindex, "宠ID")
				
				local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
				if tempno > -1 then
					initnum = enemytemp.getInt(tempno, "初始值")
	
					ability = {0, 0, 0, 0}
										
					for i=1, 10 do
						rnd = math.random(1,4)
						ability[rnd] = ability[rnd] + 1
					end
					
					char.setInt(petindex, "能力值", LevelUpPoint)
					char.setInt(petindex, "成长区间", PetRank)
	
					char.setInt(petindex, "体力", (vital + ability[1]) * initnum)
					char.setInt(petindex, "腕力", (str + ability[2]) * initnum)
					char.setInt(petindex, "耐力", (tgh + ability[3]) * initnum)
					char.setInt(petindex, "速度", (dex + ability[4]) * initnum)
	
					char.setInt(petindex, "等级", 1)
					char.setInt(petindex, "经验", 0)
					char.setInt(petindex, "转数", 2)
					char.setInt(petindex, "融合宠", 1)
					char.setInt(petindex, "融合类型", 3)
	
					for i = 1, 7 do
						char.setPetSkill(petindex, i - 1, skill[i])
					end
			
	
					char.complianceParameter(petindex)
	
					char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))

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
end


function main()
	item.addLUAListFunction( "ITEM_SKYFUSIONCHANGE", "skyfusionchange", "")
end
