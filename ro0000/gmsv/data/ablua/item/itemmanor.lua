function ITEM_UPMANOR(charaindex, itemindex)
	local data = item.getChar(itemindex, "字段")
	local manorid = other.atoi(other.getString(data, "|", 1))
	local itemtime = other.atoi(other.getString(data, "|", 2))
	local myitemtime = item.getInt(itemindex, "物品时间")
	if myitemtime == 0 and itemtime > 0 then
		local timebuff = {"一","二","三","四","五","六","七","八","九","十","十一","十二"}
		local timebufftype = math.floor(itemtime / 2592000)
		if timebufftype < 1 then
			timebufftype = 1
		elseif timebufftype > 12 then
			timebufftype = 12
		end
		item.setInt(itemindex, "物品时间",other.time() + itemtime)
		item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
		local tempshuo = item.getChar(itemindex,"说明")
		local tempshuo2 = string.gsub(tempshuo, "双击后得到光环", "使用后已绑定的")
		item.setChar(itemindex,"说明",tempshuo2)
		char.TalkToCli(charaindex, -1, "[温馨提示]您的[" .. item.getChar(itemindex,"名称") .. "]已佩戴成功并绑定账号，光环特效激发，有效期" .. timebuff[timebufftype] .. "个月。", "随机色")
	end
	char.setInt(charaindex,"人物光环",manorid)
	char.ToAroundChar(charaindex)
end

function ITEM_DOWNMANOR(charaindex, itemindex)
	char.setInt(charaindex,"人物光环",0)
	char.ToAroundChar(charaindex)
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_UPMANOR", "ITEM_UPMANOR", "")
	item.addLUAListFunction( "ITEM_DOWNMANOR", "ITEM_DOWNMANOR", "")
end
