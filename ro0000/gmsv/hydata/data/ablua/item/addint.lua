function addInt(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	local field = other.getString(data, "|", 1)
	local value = other.atoi(other.getString(data, "|", 2))
	char.setInt(charaindex, field, char.getInt(charaindex, field) + value)
	char.TalkToCli(charaindex, -1, "恭喜你获得".. value .. "点" .. field .. ",目前你一共拥有" .. char.getInt(charaindex, field) .. "点" .. field, "随机色")
	char.DelItem(charaindex, haveitemindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_ADDINT", "addInt", "")
end
