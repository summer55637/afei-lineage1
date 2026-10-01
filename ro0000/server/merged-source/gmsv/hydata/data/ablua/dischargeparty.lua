function NetLoopFunction()
	local maxplayer = char.getPlayerMaxNum() - 1
	for i=1,#dispartydata do
		if char.check(dispartydata[i]) == 1 and char.getWorkInt(dispartydata[i],"自动组队") > 0 and char.getWorkInt(dispartydata[i],"组队") == 0 then
			if other.time() >= char.getWorkInt(dispartydata[i],"自动组队") then
				local partytype = 0
				for j=1,#autopartymap do
					if char.getInt(dispartydata[i],"地图号") == autopartymap[j] then
						for k=0,maxplayer do
							if char.check(k) == 1 and dispartydata[i] ~= k then
								if char.getWorkInt(k,"组队") == 1 and char.getFlg(k,"组队") == 1 and char.getInt(k,"地图号") == char.getInt(dispartydata[i],"地图号") and math.abs(char.getInt(dispartydata[i], "坐标X") - char.getInt(k, "坐标X")) <= 10 and math.abs(char.getInt(dispartydata[i], "坐标Y") - char.getInt(k, "坐标Y")) <= 10 then
									local partyindex = -1
									local partynum = 0
									for l=1,5 do
										partyindex = char.getWorkInt(k,"队员" .. l)
										if char.check(partyindex) == 1 then
											partynum = partynum + 1
										end
									end
									if partynum < 5 then
										if other.CallFunction("FreePartyJoin","data/ablua/partyjoin.lua",{dispartydata[i],k}) == 1 then
											char.WarpToSpecificPoint(dispartydata[i],char.getInt(k,"地图号"),char.getInt(k,"坐标X"),char.getInt(k,"坐标Y"))
											char.JoinParty(k,dispartydata[i])
											char.setWorkInt(dispartydata[i],"自动组队",0)
											deldispartydata[#deldispartydata + 1] = i
											partytype = 1
										end
									end
								end
							end
							if partytype == 1 then
								break
							end
						end
					end
					if partytype == 1 then
						break
					end
				end
			end
		else
			deldispartydata[#deldispartydata + 1] = i
		end
	end
	for i=#deldispartydata,1,-1 do
		table.remove(dispartydata, deldispartydata[i])
	end
	deldispartydata = {}
end

function FreeDischargeParty(charaindex)
	if char.getInt(charaindex,"类型") == 1 then
		if char.getFlg(charaindex,"自动组队") == 1 then
			for i=1,#autopartymap do
				if char.getInt(charaindex,"地图号") == autopartymap[i] then
					char.setWorkInt(charaindex,"自动组队",other.time() + 300)
					dispartydata[#dispartydata + 1] = charaindex
					return
				end
			end
		end
	end
end

function data()
	autopartymap = {32018,32019,300,30203,11004}
end

function main()
	data()
	dispartydata = {}
	deldispartydata = {}
end