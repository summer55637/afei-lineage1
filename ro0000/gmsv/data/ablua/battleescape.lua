function FreeBattleEscape(charaindex)
	if char.getInt(charaindex,"类型") == 1 and char.getWorkInt(charaindex,"段位临时") == 1 then
		char.TalkToCli(charaindex, -1, "[温馨提示]段位比赛中无法逃跑哦 ~囧~ 留下来死战到底吧！", "黄色")
		return 0
	end
	if char.getInt(charaindex,"地图号") >= 40030 and char.getInt(charaindex,"地图号") <= 40034 then
		char.newMessageToCli(charaindex, -1, "副本中无法逃跑", "白色")
		return 0
	end
	return 1
end