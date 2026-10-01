function addVipPoint(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	sasql.setVipPoint(charaindex,sasql.getVipPoint(charaindex) + num)
	char.newMessageToCli(charaindex, -1, "获得金币" .. num, "白色")
	char.DelItem(charaindex, haveitemindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_VIPPOINT", "addVipPoint", "")
end
