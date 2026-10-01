function mvppetbox(itemindex, charaindex, toindex, haveitemindex)
	local abi = {0, 0, 0, 0}
	local data = item.getChar(itemindex, "字段")
	local petid = other.atoi(other.getString(data, "|", 1))
	local lv = other.atoi(other.getString(data, "|", 2))
	local trn = other.atoi(other.getString(data, "|", 3))

	local array = enemytemp.getEnemyTempIDFromEnemyID(petid)
	local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)

	if tempno > -1 then
		abi[1] = enemytemp.getInt(tempno, "体力") + 2
		abi[2] = enemytemp.getInt(tempno, "腕力") + 2
		abi[3] = enemytemp.getInt(tempno, "耐力") + 2
		abi[4] = enemytemp.getInt(tempno, "速度") + 2

		for i = 1, 2 do
			local rnd = math.random(4)
			abi[rnd] = abi[rnd] + math.random(0, 1)
			rnd = math.random(4)
			abi[rnd] = abi[rnd] - math.random(0, 1)
		end

		local petindex = char.AddPetCf(charaindex, petid, lv, trn, abi[1], abi[2], abi[3], abi[4])
		if char.check(petindex) == 1 then
			char.setChar(petindex, "名字", "MVP" .. char.getChar(petindex, "名字"))
			char.setChar( petindex, "主人账号",char.getChar( charaindex, "账号"))
			char.setChar( petindex, "主人名字",char.getChar( charaindex, "名字"))

			char.TalkToCli(charaindex, -1, "恭喜你获得" .. char.getChar(petindex, "名字"), "随机色")
			char.DelItem(charaindex, haveitemindex)

			for i = 0, 4 do
				local pindex = char.getCharPet( charaindex, i)
				if char.check(pindex) == 1 then
					if pindex == petindex then
						char.sendStatusString(charaindex, "K" .. i)
					end
				end
			end
		else
			char.TalkToCli(charaindex, -1, "你的宠物栏满了...", "随机色")
		end
	else
		char.TalkToCli(charaindex, -1, "该道具有问题，请与管理员联系...", "随机色")
	end

end

function main()
	item.addLUAListFunction( "ITEM_MVPPETBOX", "mvppetbox", "")
end
