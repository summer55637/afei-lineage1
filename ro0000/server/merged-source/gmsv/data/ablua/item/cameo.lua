function cameo(itemindex, charaindex, toindex, haveitemindex)
	local cost = other.atoi(item.getChar(itemindex, "字段"))
	char.setInt(charaindex, "贝壳", char.getInt(charaindex, "贝壳") + cost)
	char.TalkToCli(charaindex, -1, "恭喜你获得".. cost .. "个荣誉值", "随机色")
	char.DelItem(charaindex, haveitemindex)
end

function main()
	item.addLUAListFunction( "ITEM_CAMEO", "cameo", "")
end
