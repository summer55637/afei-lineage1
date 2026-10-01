function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function makerandpet(itemindex, charaindex, toindex, haveitemindex)
	if checkEmptPetNum(charaindex) == 0 then
		char.TalkToCli(charaindex, -1, "很抱歉，您的身上宠物已满！", "随机色")
		return
	end

	local data = item.getChar(itemindex, "字段")
	local num = other.atoi(other.getString(data, "|", 1))
	local petid = other.atoi(other.getString(data, "|", math.random(num) + 1))
	npc.AddPet(charaindex, petid)
	char.DelItem(charaindex, haveitemindex)
end

function main()
	item.addLUAListFunction( "ITEM_MAKERANDPET", "makerandpet", "")
end
