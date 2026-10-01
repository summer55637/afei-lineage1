function ITEM_NewRideNoTime(itemindex, charaindex, toindex, haveitemindex)
	local itembuff = item.getChar(itemindex,"字段")
	local newrideid = other.atoi(other.getString(itembuff, "|", 1))
	local newridetype = other.atoi(other.getString(itembuff, "|", 2))
	local newridetime = other.atoi(other.getString(itembuff, "|", 3))
	if other.DataAndData(char.getInt(charaindex, "证书骑宠"), newridetype - 1) ~= 0 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您已经有该宠物骑乘资格，无需再使用了。", "随机色")
		return
	end
	char.DelItem(charaindex,haveitemindex)
	if newridetime > 0 then
		char.setInt(charaindex,"证书骑宠",other.NumOrNum(char.getInt(charaindex,"证书骑宠"),other.NumLeftToNum(1,newridetype - 1)))
		other.CallFunction("setRideTime", "data/ablua/familyridefunction.lua", {charaindex,newridetype,newridetime * 86400 + other.time()})
		char.TalkToCli(charaindex, -1, "[温馨提示]您成功获得该宠物" .. newridetime .. "天骑乘资格。", "随机色")
	else
		char.setInt(charaindex,"证书骑宠",other.NumOrNum(char.getInt(charaindex,"证书骑宠"),other.NumLeftToNum(1,newridetype - 1)))
		char.TalkToCli(charaindex, -1, "[温馨提示]您成功获得该宠物永久骑乘资格。", "随机色")
	end
end

function data()
	
end


function main()
	data()
	item.addLUAListFunction( "ITEM_NewRideNoTime", "ITEM_NewRideNoTime", "")
end