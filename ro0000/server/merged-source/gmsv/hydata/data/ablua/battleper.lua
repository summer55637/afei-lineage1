function FreeBattlePer( charaindex,isultimate) --判断是否可以打飞
	if char.getInt(charaindex,"地图号") == 12346 then
		return 0
	end
	if char.getInt(charaindex,"类型") == 1 and char.getWorkInt(charaindex,"段位临时") == 1 then
		return 0
	end
	if char.getInt(charaindex,"类型") == 1 and isultimate > 0 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您的人物已经被击飞，如画面未能及时跳转、无法退出战斗，请原地登出一下。", "随机色")
	end
	return isultimate
end
