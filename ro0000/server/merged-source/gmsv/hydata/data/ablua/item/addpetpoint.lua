function addPetPoint(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	sasql.setPetPoint(charaindex,sasql.getPetPoint(charaindex) + num)
	char.newMessageToCli(charaindex, -1, "获得水晶" .. num, "白色")
	char.DelItem(charaindex, haveitemindex)
	other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{charaindex})
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_PETPOINT", "addPetPoint", "")
end
