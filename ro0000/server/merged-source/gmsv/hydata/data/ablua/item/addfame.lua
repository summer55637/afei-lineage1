function addFame(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	if char.getInt(charaindex,"声望") + num * 100 >= 100000000 then
		char.newMessageToCli(charaindex, -1, "您的声望已达上限", "白色")
		return
	end
	char.setInt(charaindex,"声望",char.getInt(charaindex,"声望") + num * 100)
	char.newMessageToCli(charaindex, -1, "获得声望" .. num, "白色")
	char.DelItem(charaindex, haveitemindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_FAME", "addFame", "")
end
