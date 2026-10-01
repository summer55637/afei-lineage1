function FreeBattleFly(charaindex)--击飞后操作
	if char.getInt(charaindex,"地图号") == 12222 and char.getInt(charaindex,"类型") == 1 then
		char.WarpToSpecificPoint(charaindex,12222,54,46)
		return 0
	end
	if char.getInt(charaindex,"类型") == 1 and char.getWorkInt(charaindex,"段位临时") == 1 then
		return 0
	end
	if char.getInt(charaindex,"类型") == 1 then
		--char.TalkToCli(charaindex, -1, "[温馨提示]您的人物已经被击飞，如画面未能及时跳转、无法退出战斗，请原地登出一下。", "随机色")
		other.CallFunction("battleflysend", "data/ablua/dispatchmessage.lua", {charaindex})
		if other.CallFunction("logout", "data/ablua/npc/wenming/wenming.lua", {charaindex}) == 0 then
			return 0
		end
	end
	return 1
end

function FreeBattlePer( charaindex,isultimate) --判断是否可以打飞
	if char.getInt(charaindex,"地图号") == 12346 then
		return 0
	end
	if char.getInt(charaindex,"类型") == 1 and char.getWorkInt(charaindex,"段位临时") == 1 then
		return 0
	end
	if char.getInt(charaindex,"图像号") == 120113 or char.getInt(charaindex,"图像号") == 120121 or char.getInt(charaindex,"图像号") == 120122 then
		return 0
	end
	return isultimate
end

function data()

end

function main()

end
