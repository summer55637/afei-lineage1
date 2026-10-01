function petboxcf(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	local petid = other.atoi(other.getString(data, "|", 1))
	local lv = other.atoi(other.getString(data, "|", 2))
	local trn = other.atoi(other.getString(data, "|", 3))
	local vital = other.atoi(other.getString(data, "|", 4))
	local str = other.atoi(other.getString(data, "|", 5))
	local tgh = other.atoi(other.getString(data, "|", 6))
	local dex = other.atoi(other.getString(data, "|", 7))
	
	local petindex = char.AddPetCf(charaindex, petid, lv, trn, vital, str, tgh, dex)
	if char.check(petindex) == 1 then
		char.TalkToCli(charaindex, -1, "恭喜你获得" .. char.getChar(petindex, "名字"), "随机色")
		char.setChar( petindex, "主人账号",char.getChar( charaindex, "账号"))
		char.setChar( petindex, "主人名字",char.getChar( charaindex, "名字"))

		
		
		if item.getInt(itemindex, "序号") == 24801 or item.getInt(itemindex, "序号") == 24819 then
			if char.getInt(petindex, "体力") > 20000 then
				char.setInt(petindex, "体力", 20000)
			end
			if char.getInt(petindex, "腕力") > 20000 then
				char.setInt(petindex, "腕力", 20000)
			end
			if char.getInt(petindex, "耐力") > 20000 then
				char.setInt(petindex, "耐力", 20000)
			end
			if char.getInt(petindex, "速度") > 20000 then
				char.setInt(petindex, "速度", 20000)
			end
			char.complianceParameter(petindex)
		end
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
end

function main()
	item.addLUAListFunction( "ITEM_PETBOXCF", "petboxcf", "")
end
