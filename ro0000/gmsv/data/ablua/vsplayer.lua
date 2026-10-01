function FreeVsPlayer( meindex, toindex )
	if config.getGameservername() ~= "娱乐互动线" then
		char.newMessageToCli(meindex, -1, "此线路禁止PK", "白色")
		return 1
	end
	if char.getWorkInt(meindex,"段位临时") == 2 then
		char.newMessageToCli(meindex, -1, "您正在排位匹配中，不得进行观战和PK", "随机色")
		return 1
	end
	if char.getWorkInt(toindex,"段位临时") == 2 then
		char.newMessageToCli(meindex, -1, "对方正在排位匹配中，不得进行观战和PK", "随机色")
		return 1
	end
	for i = 1, #nopkfloor do 
		if char.getInt(meindex, "地图号") == nopkfloor[i] then
			char.newMessageToCli(meindex, -1, "该地图禁止私下PK！", "随机色")
			return 1
		end
	end
	
	for i = 1, #fmpkpoint do 
		if char.getInt(meindex, "地图号") == fmpkpoint[i] then
			if char.getWorkInt(toindex,"PK时间") + 120 > other.time() then
				char.newMessageToCli(meindex, -1, "对方正在连点保护中,剩余时间：" .. char.getWorkInt(toindex,"PK时间") + 120 - other.time() .. "秒", "随机色")
				return 1
			end
		end
	end
	
	if char.getInt(meindex,"地图号") == 5032 then
		if char.getInt(meindex,"家族索引") == char.getInt(toindex,"家族索引") then
			char.newMessageToCli(meindex, -1, "双方所在家族相同,不能PK", "随机色")
			return 1
		end
	end

	return 0
end

function main()
	nopkfloor = {12345, 140,40013,40014,40015}
	fmpkpoint = {1042, 2032, 3032, 4032, 2002,5032}
end

