function petbox(itemindex, charaindex, toindex, haveitemindex)
	local petid = other.atoi(item.getChar(itemindex, "字段"))
	local petindex = char.AddPet(charaindex, petid, 1)
	if char.check(petindex) == 1 then
		char.TalkToCli(charaindex, -1, "恭喜你获得" .. char.getChar(petindex, "名字"), "随机色")
		char.DelItem(charaindex, haveitemindex)
		char.setChar( petindex, "主人账号",char.getChar( charaindex, "账号"))
		char.setChar( petindex, "主人名字",char.getChar( charaindex, "名字"))
	
		local array = char.getInt(petindex, "宠ID")
		local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
		if tempno > -1 then
			local LevelUpPoint = char.getInt(petindex, "能力值")
			local vital = char.getRightTo8(LevelUpPoint, 1)
			local str = char.getRightTo8(LevelUpPoint, 2)
			local tgh = char.getRightTo8(LevelUpPoint, 3)
			local dex = char.getRightTo8(LevelUpPoint, 4)
	
			local ivital = math.max(vital, enemytemp.getInt(tempno, "体力")-1) 
			local istr = math.max(str, enemytemp.getInt(tempno, "腕力")) 
			local itgh = math.max(tgh, enemytemp.getInt(tempno, "耐力")) 
			local idex = math.max(dex, enemytemp.getInt(tempno, "速度"))
			
			char.setInt(petindex, "能力值", char.getLiftTo8(ivital, 1) + char.getLiftTo8(istr, 2) + char.getLiftTo8(itgh, 3) + char.getLiftTo8(idex, 4))
			
			
			initnum = enemytemp.getInt(tempno, "初始值")

			ability = {0, 0, 0, 0}
								
			for i=1, 10 do
				rnd = math.random(1,4)
				ability[rnd] = ability[rnd] + 1
			end
			
			char.setInt(petindex, "体力", (vital + ability[1]) * initnum)
			char.setInt(petindex, "腕力", (str + ability[2]) * initnum)
			char.setInt(petindex, "耐力", (tgh + ability[3]) * initnum)
			char.setInt(petindex, "速度", (dex + ability[4]) * initnum)

			char.setInt(petindex, "等级", 1)
			char.setInt(petindex, "经验", 0)
			char.setInt(petindex, "转数", 0)

			char.complianceParameter(petindex)

			char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))

			
		end
	
		for i = 0, 4 do
			pindex = char.getCharPet( charaindex, i)
			if char.check(pindex) == 1 then
				if pindex == petindex then
					char.sendStatusString(charaindex, "K" .. i)
				end
			end
		end
	else
		char.TalkToCli(charaindex, -1, "你的宠物栏满了或是该宠物ID不存在...", "随机色")
	end
end

function main()
	item.addLUAListFunction( "ITEM_PETBOX", "petbox", "")
end
