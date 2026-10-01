function getIntPart(x)
    if x <= 0 then
       return math.ceil(x);
    end

    if math.ceil(x) == x then
       x = math.ceil(x);
    else
       x = math.ceil(x) - 1;
    end
    return x;
end

function FreeTradePet( charaindex, petindex )
	if char.getInt(petindex,"宠ID") == 4516 then
		return 1
	end
	if char.getInt(charaindex,"地图号") == 41011 or char.getInt(charaindex,"地图号") == 41012 then
		return 1
	end
	if char.getInt(petindex,"安全锁") > 0 or string.sub(char.getChar(petindex,"名字"),1,1) == "*" then
		return 1
	end
	if char.getInt(charaindex,"转数") < 1 and char.getInt(charaindex,"等级") < 50 then
		return 1
	end
	return 0
end

function FreeTradeItem( charaindex, itemindex )
	if char.getInt(charaindex,"地图号") == 41011 or char.getInt(charaindex,"地图号") == 41012 or (char.getInt(charaindex,"地图号") >= 40030 and char.getInt(charaindex,"地图号") <= 40034)  then
		return 1
	end
	if char.getInt(charaindex,"转数") < 1 and char.getInt(charaindex,"等级") < 50 then
		char.newMessageToCli(charaindex,-1,"0转50级以下无法交易","白色")
		return 1
	end
	if item.getInt(itemindex, "序号") == 22001 then
		local data = item.getChar(itemindex, "字段")
		local valiity = other.atoi(data)
		if other.time() >= valiity then
			char.TalkToCli(charaindex, -1, "[错误提示]支票已过期，无法进行交易。", "随机色")
			return 1
		end
		data = item.getChar(itemindex, "编码")
		local mysqltoken = "SELECT `type`,`value`,`check` FROM `check` "
						.. " WHERE `itemcode` = '" .. data .. "';"
		ret = sasql.query(mysqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			rownum = sasql.num_rows()
			if rownum > 0 then
				sasql.fetch_row(0)
				itemtype = sasql.data(1)
				itemvalue = other.atoi(sasql.data(2))
				itemcheck = other.atoi(sasql.data(3))
				if itemcheck > 0 then
					char.TalkToCli(charaindex, -1, "[错误提示]该支票已被使用过，无法进行交易。", "随机色")
					return 1
				end
			end
		end
	elseif item.getInt(itemindex,"合成") > 0 then
		if string.len(item.getChar(itemindex,"显示名")) > 4 then
			if string.sub(item.getChar(itemindex,"显示名"),1,4) ~= "合成" then
				if item.getChar(itemindex,"名称") ~= item.getChar(itemindex,"显示名") and item.getChar(itemindex,"显示名") ~= "合成装备" then
					char.TalkToCli(charaindex, -1, "[温馨提示]为避免行骗，合成道具经过改名无法进行交易，需要摆摊和交易请改名为<合成装备>", "随机色")
					return 1
				end
			end
		end
	end
	if item.getChar(itemindex,"使用函数名") == "ITEM_MMEXP" then
		return 1
	end
	return 0
end

function FreeTradeGold( charaindex, toindex,gold )
	if char.getInt(charaindex,"石币") > char.getMaxHaveGold(charaindex) then
		return 1
	end
	if char.getInt(toindex,"石币") + gold > char.getMaxHaveGold(toindex) then
		return 1
	end
	return 0
end

function data()

end

function main()
	data()
end

