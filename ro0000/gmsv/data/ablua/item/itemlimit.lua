function limit(itemindex, charaindex, toindex, haveitemindex)
	local itemid =item.getInt(itemindex,"序号")
	if itemid == 22516 then
		char.TalkToCli(charaindex, -1, "非法获取的道具，删除处理！！！", "红色")
		char.DelItem(charaindex, haveitemindex)
		return
	end
	local data = item.getChar(itemindex, "字段")
	char.DelItem(charaindex, haveitemindex)
	local itemid = other.atoi(other.getString(data, "|", 1))
	local hours = other.atoi(other.getString(data, "|", 2))
	local newitemindex = char.Additem(charaindex, itemid)
	item.setChar( newitemindex, "名称", "*" .. item.getChar(newitemindex, "名称"))
	item.setChar( newitemindex, "显示名", "*" .. item.getChar(newitemindex, "显示名"))
	item.setInt(newitemindex,"物品时间",other.time()+hours*3600)
	item.UpdataItemOne(charaindex,newitemindex)
	char.TalkToCli(charaindex, -1, "[温馨提示] 获得限时道具 [" .. item.getChar(newitemindex, "名称") .. "] 可使用时间" .. hours .. "小时。", "黄色")
end

function main()
	item.addLUAListFunction( "ITEM_LIMIT", "limit", "")
end
