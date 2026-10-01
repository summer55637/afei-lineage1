function FreegetBattleTime( charaindex,battletime)
	if char.getInt(charaindex,"地图号") == 1042 or char.getInt(charaindex,"地图号") == 2032 then
		return 60
	elseif char.getInt(charaindex,"地图号") == 3032 or char.getInt(charaindex,"地图号") == 4032 then
		return 30
	elseif char.getInt(charaindex,"地图号") == 2005 or char.getInt(charaindex,"地图号") == 40013 or char.getInt(charaindex,"地图号") == 40014 or char.getInt(charaindex,"地图号") == 40015 then
		if char.getWorkInt(charaindex,"组队") == 0 then
			return 30
		else
			local partyindex = charaindex
			if char.getWorkInt(charaindex,"组队") == 2 then
				partyindex = char.getWorkInt(charaindex,"队员1")
			end
			local teamcnt = 0
			for i=1,5 do
				if char.check(char.getWorkInt(partyindex,"队员" .. i)) == 1 then
					teamcnt = teamcnt + 1
				end
			end
			if teamcnt <= 2 then
				return 30
			elseif teamcnt == 3 then
				return 40
			elseif teamcnt == 4 then
				return 50
			elseif teamcnt == 5 then
				return 60
			end
		end
	end
	return 40
end
