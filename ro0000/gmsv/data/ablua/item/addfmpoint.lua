function addFmpoint(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	char.setInt(charaindex,"族战积分",char.getInt(charaindex,"族战积分") + num)
	char.newMessageToCli(charaindex, -1, "获得战点" .. num, "白色")
	char.sendStatusString(charaindex,"P")
	char.DelItem(charaindex, haveitemindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_FMPOINT", "addFmpoint", "")
end
