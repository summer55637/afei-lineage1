--此lua是经验丹,暂时注释掉，不用
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

function FreeCharExpSave( charaindex, exp )
	itemindex = -1
	--itemindex = char.Finditem(charaindex, 24151)
	if itemindex > -1 then
		if item.getInt(itemindex, "堆叠") > 1 then
			return
		end
		local itemexp = other.atoi(item.getChar(itemindex, "字段"))
		if itemexp > 2000000000 then
			return
		end
		if config.getGameservername() == "零九石器单线" then
			item.setChar(itemindex, "字段", itemexp + exp * 1 * 2 * 2  + exp * 4 * (char.getWorkInt(charaindex, "经验加成") / 100))
		else
			item.setChar(itemindex, "字段", itemexp + exp * 1 * 2 + exp * 3 * (char.getWorkInt(charaindex, "经验加成") / 100))
		end
		if other.atoi(item.getChar(itemindex, "字段")) > 100000000 then
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) / 100000000 .. "亿 EXP")
		elseif other.atoi(item.getChar(itemindex, "字段")) > 10000 then
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) / 10000 .. "万 EXP")
		else
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) .. " EXP")
		end

		item.UpdataItemOne(charaindex, itemindex)
		return
	end
	--itemindex = char.Finditem(charaindex, 24152)

	if itemindex > -1 then
		if item.getInt(itemindex, "堆叠") > 1 then
			return
		end
		local itemexp = other.atoi(item.getChar(itemindex, "字段"))
		if itemexp > 2000000000 then
			return
		end
		if config.getGameservername() == "零九石器单线" then
			item.setChar(itemindex, "字段", itemexp + exp * 3 * 2 * 2 + exp * 4 * (char.getWorkInt(charaindex, "经验加成") / 100))
		else
			item.setChar(itemindex, "字段", itemexp + exp * 3 * 2 + exp * 3 * (char.getWorkInt(charaindex, "经验加成") / 100))
		end
		if other.atoi(item.getChar(itemindex, "字段")) > 100000000 then
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) / 100000000 .. "亿 EXP")
		elseif other.atoi(item.getChar(itemindex, "字段")) > 10000 then
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) / 10000 .. "万 EXP")
		else
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) .. " EXP")
		end

		item.UpdataItemOne(charaindex, itemindex)
		return
	end
	--itemindex = char.Finditem(charaindex, 24153)

	if itemindex > -1 then
		if item.getInt(itemindex, "堆叠") > 1 then
			return
		end
		local itemexp = other.atoi(item.getChar(itemindex, "字段"))
		if itemexp > 2000000000 then
			return
		end
		if config.getGameservername() == "零九石器单线" then
			item.setChar(itemindex, "字段", itemexp + exp * 5 * 2 * 2 + exp * 4 * (char.getWorkInt(charaindex, "经验加成") / 100))
		else
			item.setChar(itemindex, "字段", itemexp + exp * 5 * 2 + exp * 3 * (char.getWorkInt(charaindex, "经验加成") / 100))
		end
		if other.atoi(item.getChar(itemindex, "字段")) > 100000000 then
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) / 100000000 .. "亿 EXP")
		elseif other.atoi(item.getChar(itemindex, "字段")) > 10000 then
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) / 10000 .. "万 EXP")
		else
			item.setChar(itemindex, "说明", "神奇经验丹已收集到" .. other.atoi(item.getChar(itemindex, "字段")) .. " EXP")
		end

		item.UpdataItemOne(charaindex, itemindex)
		return
	end
	--itemindex = char.Finditem(charaindex, 24154)

	if itemindex > -1 then
		if item.getInt(itemindex, "攻") >= 140 then
			return
		end
		if item.getInt(itemindex, "堆叠") > 1 then
			return
		end
		local itemexp = other.atoi(item.getChar(itemindex, "字段"))
	
		if config.getGameservername() == "零九石器单线" then
			item.setChar(itemindex, "字段", itemexp + exp * 1 * 2 * 2 + exp * 4 * (char.getWorkInt(charaindex, "经验加成") / 100))
		else
			item.setChar(itemindex, "字段", itemexp + exp * 1 * 2 + exp * 3 * (char.getWorkInt(charaindex, "经验加成") / 100))
		end
		local nextexp = char.GetOldLevelExp(item.getInt(itemindex, "攻") + 1) - char.GetOldLevelExp(item.getInt(itemindex, "攻"))
		itemexp = other.atoi(item.getChar(itemindex, "字段"))
		if itemexp >= nextexp then
			item.setChar(itemindex, "字段", itemexp - nextexp)
			item.setInt(itemindex, "攻", item.getInt(itemindex, "攻") + 1)
		end
		nextexp = char.GetOldLevelExp(item.getInt(itemindex, "攻") + 1) - char.GetOldLevelExp(item.getInt(itemindex, "攻"))
		item.setChar(itemindex, "说明", "已收集到" .. item.getInt(itemindex, "攻") .. "级,EXP:" .. item.getChar(itemindex, "字段") .. " ,NEXTEXP:" .. nextexp)
		item.UpdataItemOne(charaindex, itemindex)
		return
	end
	--itemindex = char.Finditem(charaindex, 24155)

	if itemindex > -1 then
		if item.getInt(itemindex, "攻") >= 140 then
			return
		end
		if item.getInt(itemindex, "堆叠") > 1 then
			return
		end
		local itemexp = other.atoi(item.getChar(itemindex, "字段"))
	
		if config.getGameservername() == "零九石器单线" then
			item.setChar(itemindex, "字段", itemexp + exp * 3 * 2 * 2 + exp * 4 * (char.getWorkInt(charaindex, "经验加成") / 100))
		else
			item.setChar(itemindex, "字段", itemexp + exp * 3 * 2 + exp * 3 * (char.getWorkInt(charaindex, "经验加成") / 100))
		end
		local nextexp = char.GetOldLevelExp(item.getInt(itemindex, "攻") + 1) - char.GetOldLevelExp(item.getInt(itemindex, "攻"))
		itemexp = other.atoi(item.getChar(itemindex, "字段"))
		if itemexp >= nextexp then
			item.setChar(itemindex, "字段", itemexp - nextexp)
			item.setInt(itemindex, "攻", item.getInt(itemindex, "攻") + 1)
		end
		nextexp = char.GetOldLevelExp(item.getInt(itemindex, "攻") + 1) - char.GetOldLevelExp(item.getInt(itemindex, "攻"))
		item.setChar(itemindex, "说明", "已收集到" .. item.getInt(itemindex, "攻") .. "级,EXP:" .. item.getChar(itemindex, "字段") .. " ,NEXTEXP:" .. nextexp)
		item.UpdataItemOne(charaindex, itemindex)
		return
	end
	--itemindex = char.Finditem(charaindex, 24156)

	if itemindex > -1 then
		if item.getInt(itemindex, "攻") >= 140 then
			return
		end
		if item.getInt(itemindex, "堆叠") > 1 then
			return
		end
		local itemexp = other.atoi(item.getChar(itemindex, "字段"))

		if config.getGameservername() == "零九石器单线" then
			item.setChar(itemindex, "字段", itemexp + exp * 5 * 2 * 2 + exp * 4 * (char.getWorkInt(charaindex, "经验加成") / 100))
		else
			item.setChar(itemindex, "字段", itemexp + exp * 5 * 2 + exp * 3 * (char.getWorkInt(charaindex, "经验加成") / 100))
		end
		local nextexp = char.GetOldLevelExp(item.getInt(itemindex, "攻") + 1) - char.GetOldLevelExp(item.getInt(itemindex, "攻"))
		itemexp = other.atoi(item.getChar(itemindex, "字段"))

		if itemexp >= nextexp then
			item.setChar(itemindex, "字段", itemexp - nextexp)
			item.setInt(itemindex, "攻", item.getInt(itemindex, "攻") + 1)
		end
		nextexp = char.GetOldLevelExp(item.getInt(itemindex, "攻") + 1) - char.GetOldLevelExp(item.getInt(itemindex, "攻"))
		item.setChar(itemindex, "说明", "已收集到" .. item.getInt(itemindex, "攻") .. "级,EXP:" .. item.getChar(itemindex, "字段") .. " ,NEXTEXP:" .. nextexp)
		item.UpdataItemOne(charaindex, itemindex)
		return
	end
end

function data()
					 
end

function main()
	data()
end
