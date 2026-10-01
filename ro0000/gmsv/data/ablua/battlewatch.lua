function BattleWatch( charaindex, toindex )
	if char.getWorkInt(charaindex,"段位临时") == 2 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您正在排位匹配中，不得进行观战和PK操作哦！", "随机色")
		return 1
	end
	for i=1,#nowatchmapid do
		if char.getInt(charaindex,"地图号") == nowatchmapid[i] then
			return 1
		end
	end
	return 0
end

function data()
	nowatchmapid = {12345,1042,2032,3032,4032,5032,40013,40014,40015}
end

function main()
	data()
end
