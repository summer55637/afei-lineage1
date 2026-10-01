function FreePartyJoin( meindex, toindex )
	if config.getGameservername() == "娱乐互动线" then
		local nWeekDay = tonumber(os.date("%w",  os.time()))
		for i = 1, #fmpkfloorid do 
			if char.getInt(meindex, "地图号") == fmpkfloorid[i] then
				if nWeekDay == 1 then 
					char.TalkToCli(meindex, -1, "今天的族战只允许单P模式！", "随机色")
					return 0
				elseif nWeekDay == 2 or nWeekDay == 3 then 
					partyjionnum = nWeekDay
				else
					partyjionnum = 5
				end
			
				if char.getWorkInt(toindex, "组队") ~= 0 then
					local num = 0

					for j = 1, 5 do
						local pindex = char.getWorkInt(toindex, "队员" .. j) 
						if char.check(pindex) == 1 then
							num = num +1
							if num >= partyjionnum then
								char.TalkToCli(meindex, -1, "今天的族战只允许" .. partyjionnum .. "V模式！", "随机色")
								return 0
							end
						end
					end
				end
				break
			end
		end
		if char.getInt(meindex, "地图号") == 3032 then
			partyjionnum = 2
			if char.getWorkInt(toindex, "组队") ~= 0 then
				local num = 0

				for j = 1, 5 do
					local pindex = char.getWorkInt(toindex, "队员" .. j) 
					if char.check(pindex) == 1 then
						num = num +1
						if num >= partyjionnum then
							char.TalkToCli(meindex, -1, "今天的族战只允许" .. partyjionnum .. "V模式！", "随机色")
							return 0
						end
					end
				end
			end
		elseif char.getInt(meindex, "地图号") == 4032 or char.getInt(meindex, "地图号") == 140 or char.getInt(meindex, "地图号") == 3 then
			char.TalkToCli(meindex, -1, "今天的族战只允许单P模式！", "随机色")
			return 0
		end
	end
	if char.getInt(meindex,"地图号") >= 8200 and char.getInt(meindex,"地图号") <= 8213 then
		return 0
	end
	if char.getInt(meindex,"地图号") == 32021 then
		return 0
	end
	if char.getInt(meindex,"地图号") == 10204 then
		return 0
	end
	if char.getInt(meindex,"地图号") ~= char.getInt(toindex,"地图号") then
		return 0
	end
	
	local battleindex = char.getWorkInt(toindex,"战斗索引")
	if battleindex > -1 then
		if battle.getType(battleindex) == 2 then
			return 0
		end
	end
	if char.getWorkInt(meindex,"交易状态") ~= 0 or char.getWorkInt(toindex,"交易状态") ~= 0 then
		return 0
	end
	if char.getInt(meindex,"地图号") == 2005 then
		if other.CallFunction("partytype","data/ablua/npc/YamaKing/YamaKing.lua",{meindex,toindex}) == 0 then
			return 0
		end
	end
	if char.getInt(meindex,"地图号") >= 40030 and char.getInt(meindex,"地图号") <= 40034 then
		if char.getWorkChar(meindex,"NPC临时1") ~= char.getWorkChar(toindex,"NPC临时1") then
			return 0
		end
		if char.getWorkInt(meindex,"战斗") ~= char.getWorkInt(toindex,"战斗") then
			return 0
		end
	end
	if char.getInt(toindex,"类型") == 1 then
		if char.getInt(toindex,"组队增强模式") == 1 then
			if char.getChar(toindex,"家族") ~= "" and char.getChar(toindex,"家族") == char.getChar(meindex,"家族") then
				return 1
			end
			return 0
		elseif char.getInt(toindex,"组队增强模式") == 2 then
			for i=1,80 do
				addressname = char.getAddressbookName(toindex,i - 1)
				if addressname ~= "" then
					if char.getChar(meindex,"名字") == addressname then
						return 1
					end
				end
			end
			return 0
		elseif char.getInt(toindex,"组队增强模式") == 3 then
			partynamebuff = char.getChar(toindex,"组队增强名字")
			if partynamebuff ~= "" then
				for i=1,4 do
					partyname = other.getString(partynamebuff, "|", i)
					if char.getChar(meindex,"名字") == partyname then
						return 1
					end
				end
			end
			return 0
		end
	end
	if char.getWorkInt(toindex,"战斗") == 2 then
		return 0
	end
	return 1
end

function data()
	newfloordifi = {50001, 50002, 50003, 50004}
	fmpkfloorid = {7777, 8888, 9999, 2032}
end

function main()
	data()
end