function FmBattlePoint( meid,flg )
	if meid < 1 or meid > 5 then
		return
	end
	local i
	local maxplayer = char.getPlayerMaxNum()
	for i=0,maxplayer - 1 do
		if char.check(i) == 1 then
			if char.getInt(i,"地图号") == fmpkpoint[meid] then
				char.setInt(i,"族战积分",char.getInt(i,"族战积分") + 5)
				char.TalkToCli(i, -1, "[温馨提示]由于您积极参与族战，奖励战点[5]", "随机色")
			end
		end
	end
end

function data()
	fmpkpoint = {1042, 2032, 3032, 4032, 5032}
end

function main()
	data()
end
