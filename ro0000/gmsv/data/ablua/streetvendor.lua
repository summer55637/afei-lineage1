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

function FreeStreetVendorName( charaindex, streetname )
	local nostreetname = {"gm","GM","Gm","坑","ＧＭ","不玩","退服","圾服","闪人","脱","遗产"}
	for i = 1, table.getn(nostreetname) do
		str, len = string.gsub(streetname, nostreetname[i], "")
		if len > 0 then
			char.TalkToCli(charaindex, -1, "[错误提示]非法店名，摆摊失败，摆摊广告名请带一些正能量，谢谢合作。", "随机色")
			return 1
		end
	end
	if char.getInt(charaindex,"转数") < 1 and char.getInt(charaindex,"等级") < 50 then
		char.newMessageToCli(charaindex,-1,"0转50级以下无法摆摊","白色")
		return 1
    end
	if char.getInt(charaindex,"地图号") == 2005 then
		char.TalkToCli(charaindex, -1, "[错误提示]渔村医院禁止摆摊,换个地方摆摊吧！", "随机色")
		return 1
	end
	if char.getInt(charaindex,"地图号") == 2000 and char.getInt(charaindex,"坐标X") >= 61 and char.getInt(charaindex,"坐标Y") >= 79 and char.getInt(charaindex,"坐标X") <= 67 and char.getInt(charaindex,"坐标Y") <= 85 then
		char.TalkToCli(charaindex, -1, "[错误提示]医院门口区域无法摆摊,换个地方摆摊吧！", "随机色")
		return 1
	end
	
	return 0
end

function FreeStreetVendorPet( charaindex, petindex )
	if char.getInt(petindex,"宠ID") == 4516 then
		return 1
	end
	return 0
end

function FreeStreetVendorItem( charaindex, itemindex )
	if item.getInt(itemindex, "序号") == 22001 then
		local data = item.getChar(itemindex, "字段")
		local valiity = other.atoi(data)
		if other.time() >= valiity then
			char.TalkToCli(charaindex, -1, "[错误提示]支票已过期，无法摆摊出售。", "随机色")
			return 1
		end
	elseif item.getInt(itemindex, "序号") == 22034 then
		local itemnum = other.atoi(item.getChar(itemindex,"字段"))
		if itemnum < 720 then
			char.TalkToCli(charaindex, -1, "[温馨提示]您的ＭＭ玩偶尚未搜集全部经验，无法摆摊销售。", "随机色")
			return 1
		end
	elseif item.getInt(itemindex, "序号") == 22035 then
		if item.getChar(itemindex,"字段") ~= "2" then
			char.TalkToCli(charaindex, -1, "[温馨提示]您的1.82封印卷轴尚未封印任务，无法摆摊销售。", "随机色")
			return 1
		end
	elseif item.getInt(itemindex, "序号") == 22041 then
		if item.getChar(itemindex,"字段") ~= "2" then
			char.TalkToCli(charaindex, -1, "[温馨提示]您的四大封印卷轴尚未封印任务，无法摆摊销售。", "随机色")
			return 1
		end
	elseif item.getInt(itemindex, "序号") == 22003 then
		local itembuff = item.getChar(itemindex,"字段")
		local itemlevel = other.atoi(other.getString(itembuff,"|",1))
		if itemlevel < 120 then
			char.TalkToCli(charaindex, -1, "[温馨提示]您的经验收集丹未满一百二十级，无法摆摊销售。", "随机色")
			return 1
		end
	elseif item.getInt(itemindex,"合成") > 0 then
		if string.len(item.getChar(itemindex,"显示名")) > 4 then
			if string.sub(item.getChar(itemindex,"显示名"),1,4) ~= "合成" then
				if item.getChar(itemindex,"名称") ~= item.getChar(itemindex,"显示名") and item.getChar(itemindex,"显示名") ~= "合成装备" then
					char.TalkToCli(charaindex, -1, "[温馨提示]为避免行骗，合成道具经过改名无法进行摆摊，需要摆摊和交易请改名为<合成装备>", "随机色")
					return 1
				end
			end
		end
	end
	
	
	return 0
end

function data()

end

function main()
	data()
end

