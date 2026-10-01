function addXjpoint(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	char.setInt(charaindex,"象卷数量",char.getInt(charaindex,"象卷数量") + num)
	char.newMessageToCli(charaindex, -1, "获得象卷" .. num, "白色")
	char.DelItem(charaindex, haveitemindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_XJPOINT", "addXjpoint", "")
end
