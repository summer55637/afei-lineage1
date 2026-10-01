function addPayPoint(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	sasql.setPayPoint(charaindex,sasql.getPayPoint(charaindex) + num)
	char.newMessageToCli(charaindex, -1, "获得积分" .. num, "白色")
	char.DelItem(charaindex, haveitemindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_PayPoint", "addPayPoint", "")
end
