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

function petfusionchange(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "融合宠") == 0 then
				char.TalkToCli(charaindex, -1, "该物品只能对融合宠使用!", "随机色")
				return
			end
			if char.getInt(toindex, "提升值") == 0 then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "未经强化过,无需再进行回炉!", "随机色")
				return
			end
			if char.getInt(toindex, "融合类型") < 1 or char.getInt(toindex, "融合类型") > 3 then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "是不能回炉的!", "随机色")
				return
			end
			
			if char.getInt(toindex, "原图像号") == 101820 or char.getInt(toindex, "原图像号") == 101821 or char.getInt(toindex, "原图像号") == 101822 or char.getInt(toindex, "原图像号") == 101823  or char.getInt(toindex, "原图像号") == 101874 then
				char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "是不能强化的!", "随机色")
				return
			end
			
			local LevelUpPoint = char.getInt(toindex, "能力值")
			local vital = char.getRightTo8(LevelUpPoint, 1)
			local str = char.getRightTo8(LevelUpPoint, 2)
			local tgh = char.getRightTo8(LevelUpPoint, 3)
			local dex = char.getRightTo8(LevelUpPoint, 4)
			array = char.getInt(toindex, "宠ID")
			tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
			if tempno > -1 then
				local initnum = enemytemp.getInt(tempno, "初始值")

				local ability = {0,0,0,0}
				for i=1, 10 do
					rnd = math.random(1,4)
					ability[rnd] = ability[rnd] + 1
				end
				
				char.setInt(toindex, "体力", (vital + ability[1]) * initnum)
				char.setInt(toindex, "腕力", (str + ability[2]) * initnum)
				char.setInt(toindex, "耐力", (tgh + ability[3]) * initnum)
				char.setInt(toindex, "速度", (dex + ability[4]) * initnum)
	
				char.setInt(toindex, "等级", 1)
				char.setInt(toindex, "经验", 0)
				char.setInt(toindex, "提升值", 0)
				char.complianceParameter(toindex)
	
				char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))
				
	
				char.dropPetFollow(charaindex, i)
				char.setWorkInt(toindex, "捡起模式", 3)
				char.setFunctionPointer(toindex, "循环事件", "Loop", "")
				char.setInt(toindex, "循环事件时间", 1000)
				char.delFunctionPointer(toindex, "对话事件")
				char.delFunctionPointer(toindex, "窗口事件")
				char.DelItem(charaindex, haveitemindex)
				return
			end
		end
	end
end

function data()
end


function main()
	item.addLUAListFunction( "ITEM_PETFUSIONCHANGE", "petfusionchange", "")
end
