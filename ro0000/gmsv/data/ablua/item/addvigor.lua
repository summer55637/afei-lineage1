function addVigor(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	if char.getInt(charaindex,"活力") + num > 500 then
		char.newMessageToCli(charaindex, -1, "您的活力已达上限", "白色")
		return
	end
	char.setInt(charaindex,"活力",char.getInt(charaindex,"活力") + num)
	char.newMessageToCli(charaindex, -1, "获得活力" .. num, "白色")
	char.DelItem(charaindex, haveitemindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_VIGOR", "addVigor", "")
end
