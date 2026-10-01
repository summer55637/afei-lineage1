function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function Completion(itemindex, charaindex, toindex, haveitemindex)
	if charaindex ~= toindex then
		return
	end
	local data = item.getChar(itemindex, "字段")
	local trans = other.atoi(other.getString(data, "|", 1))
	local level = other.atoi(other.getString(data, "|", 2))
	local point = other.atoi(other.getString(data, "|", 3))
	
	if checkEmptPetNum(charaindex) < 2 then
		char.TalkToCli(charaindex, -1, "很抱歉，你身上的宠物不足两个空位，请整理后再使用该道具", "随机色")
		return
	end
	
	npc.AddPet(charaindex, 353, 1)
	npc.AddPet(charaindex, 2546, 1)

	char.setInt(charaindex, "转数", trans)
	char.setInt(charaindex, "等级", level)
	char.setInt(charaindex, "技能点", (point - 10) )
	char.setInt(charaindex, "体力", 1000)
	char.setInt(charaindex, "腕力", 0)
	char.setInt(charaindex, "耐力", 0)
	char.setInt(charaindex, "速度", 0)
		
	char.setInt(charaindex, "极品", 1)
	
	char.complianceParameter(charaindex)
	char.sendStatusString(charaindex, "P")
	char.Skillupsend(charaindex)
	
	char.DelItem(charaindex, haveitemindex)
		
	char.talkToAllServer("P|P|恭喜玩家" .. char.getChar( charaindex, "名字") .. "成为" .. trans .. "转" .. level .. "级的圆满人物，并获得帖拉所伊朵和帖伊诺斯。","")

end

function data()

end

function main()
	item.addLUAListFunction( "ITEM_COMPLETION", "Completion", "")
	data()
end
