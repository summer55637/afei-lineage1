function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function queryPlayerData(cdkey)
	local mydate = "00000000"
	local cnt = 0
	local maxcnt = 1
	local endtime = 0
	local id = ""
	local data1 = 0
	local data2 = 0
	local data3 = 0
	local data4 = 0
	local data5 = 0
	local data6 = 0
	local data7 = -1
	local data8 = -1
	local data9 = -1
	local sqltoken = "select * from `wenming` where `cdkey`='" .. cdkey .. "'"
	ret = sasql.query(sqltoken)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			mydate = sasql.data(2)
			cnt = other.atoi(sasql.data(3))
			maxcnt = other.atoi(sasql.data(4))
			endtime = other.atoi(sasql.data(5))
			id = sasql.data(6)
			data1 = other.atoi(sasql.data(7))
			data2 = other.atoi(sasql.data(8))
			data3 = other.atoi(sasql.data(9))
			data4 = other.atoi(sasql.data(10))
			data5 = other.atoi(sasql.data(11))
			data6 = other.atoi(sasql.data(12))
			data7 = other.atoi(sasql.data(13))
			data8 = other.atoi(sasql.data(14))
			data9 = other.atoi(sasql.data(15))
		end
	end
	return mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9
end

function setPlayerData(cdkey,type,...)
	local t = {...}
	if type == 0 then
		local sqltoken = "REPLACE INTO `wenming` values ('" .. cdkey .. "','" .. t[1] .. "','" .. t[2] .. "','" .. t[3] .. "','" .. t[4] .. "','" .. t[5] .. "','" .. t[6] .. "','" .. t[7] .. "','" .. t[8] .. "','" .. t[9] .. "','" .. t[10] .. "','" .. t[11] .. "','" .. t[12] .. "','" .. t[13] .. "','" .. t[14] .. "')"
		sasql.query(sqltoken)
	elseif type == 1 then
		local sqltoken = "update `wenming` set `maxcnt`=`maxcnt` + 1 where `cdkey`='" .. cdkey .. "'"
		sasql.query(sqltoken)
	elseif type == 2 then
		local sqltoken = "update `wenming` set `" .. t[1] .. "`='" .. t[2] .. "' where `id`='" .. cdkey .. "'"
		sasql.query(sqltoken)
	elseif type == 3 then
		local sqltoken = "update `wenming` set `" .. t[1] .. "`='" .. t[2] .. "' where `cdkey`='" .. cdkey .. "'"
		sasql.query(sqltoken)
	end
end

function getEndTime(talkerindex)
	local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
	if mydate == os.date("%Y%m%d",os.time()) then
		if os.time() < endtime then
			return endtime - os.time()
		end
	end
	return 0
end

function login(talkerindex)
	local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
	if mydate == os.date("%Y%m%d",os.time()) then
		if os.time() > endtime then
			if char.getInt(talkerindex,"地图号") >= 40030 and char.getInt(talkerindex,"地图号") <= 40034 then
				char.DischargeParty(talkerindex, 1)
				char.WarpElderPosition(talkerindex)
				if wenmingdata[id] ~= nil then
					wenmingdata[id] = nil
				end
			end
		else
			char.setWorkChar(talkerindex,"NPC临时1",id)
			logout(talkerindex)
			if data1 == 0 then
				if wenmingdata[id] == nil then
					wenmingdata[id] = other.Random(1,8)
				end
			end
		end
	else
		if char.getInt(talkerindex,"地图号") >= 40030 and char.getInt(talkerindex,"地图号") <= 40034 then
			char.DischargeParty(talkerindex, 1)
			char.WarpElderPosition(talkerindex)
			if wenmingdata[id] ~= nil then
				wenmingdata[id] = nil
			end
		end
	end
	return 0
end

function logout(talkerindex)
	if char.getInt(talkerindex,"地图号") == 40030 then
		char.DischargeParty(talkerindex, 1)
		char.WarpToSpecificPoint(talkerindex,40030,47,47)
		return 0
	elseif char.getInt(talkerindex,"地图号") == 40031 then
		char.DischargeParty(talkerindex, 1)
		char.WarpToSpecificPoint(talkerindex,40031,1,12)
		return 0
	elseif char.getInt(talkerindex,"地图号") == 40032 then
		char.DischargeParty(talkerindex, 1)
		char.WarpToSpecificPoint(talkerindex,40032,73,87)
		return 0
	elseif char.getInt(talkerindex,"地图号") == 40033 then
		char.DischargeParty(talkerindex, 1)
		char.WarpToSpecificPoint(talkerindex,40033,1,25)
		return 0
	elseif char.getInt(talkerindex,"地图号") == 40034 then
		char.DischargeParty(talkerindex, 1)
		char.WarpToSpecificPoint(talkerindex,40033,12,35)
		return 0
	end
	return 1
end

function warpmap(talkerindex,floorid)
	if char.getInt(talkerindex,"地图号") == 40030 and floorid == 40031 then
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		if data1 == 1 then
			return 1
		else
			return 0
		end
	elseif char.getInt(talkerindex,"地图号") == 40031 and floorid == 40032 then
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		if data2 > 0 then
			return 1
		else
			return 0
		end
	elseif char.getInt(talkerindex,"地图号") == 40032 and floorid == 40033 then
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		local datacnt = 0
		for i=1,8 do
			if other.DataAndData(data4,i - 1) > 0 then
				datacnt = datacnt + 1
			end
		end
		if datacnt >= 8 then
			return 1
		else
			return 0
		end
	end
	return 1
end

function setRamdomBattle(battleindex,playerid,talkerindex)
	if wenmingdata[playerid] == nil or table.getn(wenmingdata[playerid]) <= 0 then
		wenmingdata[playerid] = {}
		for i=0,9 do
			local TempIndex = battle.getCharOne(battleindex, i, 1)
			if char.check(TempIndex) == 1 then
				local randomtype = math.ceil(other.Random(1,100) / 25)
				wenmingdata[playerid][table.getn(wenmingdata[playerid]) + 1] = randomtype
				local Type = {0,0,0,0}
				Type[randomtype] = 100
				char.setInt(TempIndex,"地",Type[1])
				char.setInt(TempIndex,"水",Type[2])
				char.setInt(TempIndex,"火",Type[3])
				char.setInt(TempIndex,"风",Type[4])
				TM_Token = ""
				if Type[1] > 0 then
					TM_Token = TM_Token .. "地:" .. Type[1] / 10 .. " "
				end
				if Type[2] > 0 then
					TM_Token = TM_Token .. "水:" .. Type[2] / 10 .. " "
				end
				if Type[3] > 0 then
					TM_Token = TM_Token .. "火:" .. Type[3] / 10 .. " "
				end
				if Type[4] > 0 then
					TM_Token = TM_Token .. "风:" .. Type[4] / 10 .. " "
				end
				--char.TalkToCli(talkerindex, -1, char.getChar(TempIndex,"名字") .. " 当前属性 - " .. TM_Token , "随机色")
			end
		end
	else
		j = 0
		for i=0,9 do
			local TempIndex = battle.getCharOne(battleindex, i, 1)
			if char.check(TempIndex) == 1 then
				j = j + 1
				if j > table.getn(wenmingdata[playerid]) then
					break
				end
				local Type = {0,0,0,0}
				Type[wenmingdata[playerid][j]] = 100
				char.setInt(TempIndex,"地",Type[1])
				char.setInt(TempIndex,"水",Type[2])
				char.setInt(TempIndex,"火",Type[3])
				char.setInt(TempIndex,"风",Type[4])
				TM_Token = ""
				if Type[1] > 0 then
					TM_Token = TM_Token .. "地:" .. Type[1] / 10 .. " "
				end
				if Type[2] > 0 then
					TM_Token = TM_Token .. "水:" .. Type[2] / 10 .. " "
				end
				if Type[3] > 0 then
					TM_Token = TM_Token .. "火:" .. Type[3] / 10 .. " "
				end
				if Type[4] > 0 then
					TM_Token = TM_Token .. "风:" .. Type[4] / 10 .. " "
				end
				--char.TalkToCli(talkerindex, -1, char.getChar(TempIndex,"名字") .. " 当前属性 - " .. TM_Token , "随机色")
			end
		end
	end
end

function Loop(meindex)
	local maxplayer = char.getPlayerMaxNum() - 1
	for i=0,maxplayer do
		if char.check(i) == 1 then
			if char.getInt(i,"地图号") >= 40030 and char.getInt(i,"地图号") <= 40034 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(i,"账号"))
				if mydate == os.date("%Y%m%d",os.time()) then
					if os.time() > endtime then
						local battleIndex = char.getWorkInt(i, "战斗索引")
						if battleIndex ~= -1 then
							battle.Exit(i, battleIndex)
						end
						char.DischargeParty(i, 1)
						char.WarpElderPosition(i)
						char.TalkToCli(i, -1, "副本时间已经超时了" , "随机色")
					end
				else
					local battleIndex = char.getWorkInt(i, "战斗索引")
					if battleIndex ~= -1 then
						battle.Exit(i, battleIndex)
					end
					char.DischargeParty(i, 1)
					char.WarpElderPosition(i)
					char.TalkToCli(i, -1, "副本时间已经超时了" , "随机色")
				end
			end
		end
	end
	local sqltoken = "update `wenming` set `id`='' where `endtime`<" .. os.time()
	sasql.query(sqltoken)
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "失落的文明|冒险者们,这是通往地狱魔窟\n的入口,这有失落的石器文明\n一探究竟吧。|3|副本挑战|观战|购买次数"
		lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
		return
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num == 1 then
			if tonumber(os.date("%H", os.time())) < 9 or tonumber(os.date("%H", os.time())) >= 22 then
				char.newMessageToCli(talkerindex, -1, "当前时间活动未开放 开放时间9点-22点", "白色")
				return
			end
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			if endtime > other.time() then
				if char.getWorkInt(talkerindex, "组队") ~= 0 then
					return
				end
				for j=0,23 do
					local itemindex = char.getItemIndex(talkerindex,j)
					if item.check(itemindex) == 1 then
						for k=1,table.getn(noitem) do
							if item.getInt(itemindex,"序号") == noitem[k] then
								char.newMessageToCli(talkerindex, -1, "带有[" .. item.getChar(itemindex,"显示名") .. "]，无法进入副本", "白色")
								return
							end
						end
					end
				end
				char.setWorkChar(talkerindex,"NPC临时1",id)
				char.WarpToSpecificPoint(talkerindex, 40030, 47, 47)
				return
			end
			if char.getWorkInt(talkerindex, "组队") ~= 1 then
				char.newMessageToCli(talkerindex, -1, "只有队长才可以进入", "白色")
				return
			end
			local partynum = 0
			local playercnt = {1,1,1,1,1}
			local playermaxcnt = {1,1,1,1,1}
			for i=1,5 do
				local partyindex = char.getWorkInt(talkerindex,"队员" .. i)
				if char.check(partyindex) == 1 then
					if char.getInt(partyindex,"转数") < 1 or char.getInt(partyindex,"等级") < 130 then
						char.newMessageToCli(talkerindex, -1, "队伍中[" .. char.getChar(partyindex,"名字") .. "]没有达到等级要求，无法进入副本", "白色")
						return
					end
					-- if other.time() < 1548399599 or other.time() > 1549209599 then
						-- if char.getInt(partyindex,"活力") < VigorPoint then
							-- char.newMessageToCli(talkerindex, -1, "队伍中[" .. char.getChar(partyindex,"名字") .. "]没有达到活力要求，无法进入副本", "白色")
							-- return
						-- end
					-- end
					for j=0,23 do
						local itemindex = char.getItemIndex(partyindex,j)
						if item.check(itemindex) == 1 then
							for k=1,table.getn(noitem) do
								if item.getInt(itemindex,"序号") == noitem[k] then
									char.newMessageToCli(talkerindex, -1, "队伍中[" .. char.getChar(partyindex,"名字") .. "]带有[" .. item.getChar(itemindex,"显示名") .. "]，无法进入副本", "白色")
									return
								end
							end
						end
					end
					
					mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(partyindex,"账号"))
					if mydate == os.date("%Y%m%d",os.time()) then
						playercnt[partynum + 1] = cnt + 1
						playermaxcnt[partynum + 1] = maxcnt
						if cnt >= maxcnt then
							char.newMessageToCli(talkerindex, -1, "队伍中[" .. char.getChar(partyindex,"名字") .. "]已经进入过副本，无法进入副本", "白色")
							return
						end
					end
					partynum = partynum + 1
				end
			end
			if partynum < 5 then
				char.newMessageToCli(talkerindex, -1, "玩家不足5人无法进入副本", "白色")
				return
			end
			for i=1,5 do
				local partyindex = char.getWorkInt(talkerindex,"队员" .. i)
				if char.check(partyindex) == 1 then
					setPlayerData(char.getChar(partyindex,"账号"),0,os.date("%Y%m%d",os.time()),playercnt[i],playermaxcnt[i],os.time() + 3600 * 2,char.getChar(talkerindex,"账号"),0,0,0,0,0,0,-1,-1,-1)
					char.setWorkChar(partyindex,"NPC临时1",char.getChar(talkerindex,"账号"))
					-- if other.time() < 1548399599 or other.time() > 1549209599 then
						-- char.setInt(partyindex,"活力",char.getInt(partyindex,"活力") - VigorPoint)
						-- char.newMessageToCli(partyindex, -1, "扣除" .. VigorPoint .. "活力", "白色")
						-- char.setInt(partyindex,"气势",char.getInt(partyindex,"气势") + VigorPoint * 100)
						-- saacproto.ACFixFMData(partyindex,12,char.getInt(partyindex,"气势"),"")
						-- other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {partyindex,2,VigorPoint})
					-- end
				end
			end
			char.AllWarpToSpecificPoint(talkerindex, 40030, 47, 47)
			wenmingdata[char.getChar(talkerindex,"账号")] = nil
			wenmingdata[char.getChar(talkerindex,"账号")] = other.Random(1,8)
		elseif num == 2 then
			token = "失落的文明|冒险者们,这是通往地狱魔窟\n的入口,这有失落的石器文明\n一探究竟吧。|3|第一关BOSS|第二关BOSS|最终BOSS"
			lssproto.windows(talkerindex, "新选择框", "取消", 2, char.getWorkInt( meindex, "对象"), token)
		elseif num == 3 then
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			if mydate == os.date("%Y%m%d",os.time()) then
				if maxcnt > 1 then
					char.newMessageToCli(talkerindex, -1, "您今日已经购买过了", "白色")
					return
				end
				if cnt >= maxcnt then
					token = "您确定要花费" .. BuyMaxCntVipPoint .. "金币购买一次副本次数吗"
					lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
					return
				else
					char.newMessageToCli(talkerindex, -1, "您今日还有副本次数，无需购买", "白色")
					return
				end
			else
				char.newMessageToCli(talkerindex, -1, "您今日还有副本次数，无需购买", "白色")
				return
			end
		end
	elseif seqno == 1 then
		if select == 1 then
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			if mydate == os.date("%Y%m%d",os.time()) then
				if maxcnt > 1 then
					char.newMessageToCli(talkerindex, -1, "您今日已经购买过了", "白色")
					return
				end
				if cnt >= maxcnt then
					local myvippoint = sasql.getVipPoint(talkerindex)
					if myvippoint < BuyMaxCntVipPoint then
						char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
						return
					end
					sasql.setVipPoint(talkerindex,myvippoint - BuyMaxCntVipPoint)
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,BuyMaxCntVipPoint})
					setPlayerData(char.getChar(talkerindex,"账号"),1)
					char.newMessageToCli(talkerindex, -1, "成功购买1次副本次数", "白色")
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -BuyMaxCntVipPoint .. "," .. myvippoint .. "," .. myvippoint - BuyMaxCntVipPoint .. ",'购买副本次数扣除" .. BuyMaxCntVipPoint .. "金币',NOW())"
					sasql.query(token)
					return
				else
					char.newMessageToCli(talkerindex, -1, "您今日还有副本次数，无需购买", "白色")
					return
				end
			else
				char.newMessageToCli(talkerindex, -1, "您今日还有副本次数，无需购买", "白色")
				return
			end
		end
	elseif seqno == 2 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 3 then
			return
		end
		local watchfloorid = {40031,40033,40034}
		token = ""
		local playernum = 0
		local playernumtemp = 0
		local watchbattleindex = -1
		local battlemaxpage = 0
		local battlemaxnum = config.getBattleNum() - 1
		for i=0,battlemaxnum do
			if battle.checkindex(i) == 1 then
				if battle.getBattleFloor(i) == watchfloorid[num] then
					battlemaxpage = battlemaxpage + 1
					for j=0,4 do
						local playerindex = battle.getCharOne(i, j, 0)
						if char.check(playerindex) == 1 then
							playernum = playernum + 1
							if battlemaxpage == 1 then
								playernumtemp = playernumtemp + 1
								if playernumtemp == 1 then
									watchbattleindex = playerindex
								end
								token = token .. "|" .. char.getChar(playerindex,"名字") .. "|" .. char.getInt(playerindex,"图像号")
							end
						end
					end
				end
			end
		end
		if battlemaxpage == 0 then
			char.newMessageToCli(talkerindex, -1, "暂时无人挑战", "白色")
			return
		end
		token = battlemaxpage .. "|1|" .. watchbattleindex .. "|" .. playernum .. "|" .. playernumtemp .. token
		lssproto.windows(talkerindex, 1041, "取消", 10 + num, char.getWorkInt( meindex, "对象"), token)
	elseif seqno >= 11 and seqno <= 13 then
		if data == "" then
			return
		end
		local watchfloorid = {40031,40033,40034}
		local type = other.getString(data,"|",1)
		if type == "P" or type == "N" then
			local watchpage = other.getString(data,"|",2)
			if watchpage == "" then
				return
			end
			watchpage = other.atoi(watchpage)
			token = ""
			local playernum = 0
			local playernumtemp = 0
			local watchbattleindex = -1
			local battlemaxpage = 0
			local battlemaxnum = config.getBattleNum() - 1
			for i=0,battlemaxnum do
				if battle.checkindex(i) == 1 then
					if battle.getBattleFloor(i) == watchfloorid[seqno - 10] then
						battlemaxpage = battlemaxpage + 1
						for j=0,4 do
							local playerindex = battle.getCharOne(i, j, 0)
							if char.check(playerindex) == 1 then
								playernum = playernum + 1
								if battlemaxpage == watchpage then
									playernumtemp = playernumtemp + 1
									if playernumtemp == 1 then
										watchbattleindex = playerindex
									end
									token = token .. "|" .. char.getChar(playerindex,"名字") .. "|" .. char.getInt(playerindex,"图像号")
								end
							end
						end
					end
				end
			end
			if battlemaxpage == 0 or watchpage > battlemaxpage then
				char.newMessageToCli(talkerindex, -1, "暂时无人挑战", "白色")
				return
			end
			token = battlemaxpage .. "|" .. watchpage .. "|" .. watchbattleindex .. "|" .. playernum .. "|" .. playernumtemp .. token
			lssproto.windowsupdate(talkerindex, 1041, "取消", seqno, char.getWorkInt( meindex, "对象"), token)
		elseif type == "L" then
			local watchindex = other.getString(data,"|",2)
			if watchindex == "" then
				return
			end
			watchindex = other.atoi(watchindex)
			local battlemaxnum = config.getBattleNum() - 1
			for i=0,battlemaxnum do
				if battle.checkindex(i) == 1 then
					if battle.getBattleFloor(i) == watchfloorid[seqno - 10] then
						for j=0,4 do
							local playerindex = battle.getCharOne(i, j, 0)
							if char.check(playerindex) == 1 then
								if playerindex == watchindex then
									battle.WatchEntry(talkerindex,watchindex)
									return
								end
							end
						end
					end
				end
			end
			char.newMessageToCli(talkerindex, -1, "您要观看的战斗已结束", "白色")
		end
	end
end

function TalkedRlong(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		if data1 == 0 then
			token = "              『变异的邦浦洛斯』\n\n"
							.."\n    擅闯魔窟者死！"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
		else
			char.newMessageToCli(talkerindex, -1, "您已经闯过此关了", "白色")
		end
	end
end

function WindowTalkedRlong ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if select == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
				if data1 == 0 then
					enemytable = {4545, 4545, 4545, 4545, 4545, -1, -1, -1, -1, -1}
					battleindex = battle.CreateVsEnemy(talkerindex, meindex, enemytable)
				else
					char.newMessageToCli(talkerindex, -1, "您已经闯过此关了", "白色")
				end
			end
		end
	end
end

function BattleOverRlong(meindex, battleindex, iswin)
	if iswin == 1 then
		for i=0, 4 do
			charaindex = battle.getCharOne(battleindex, i, 0)
			if char.check(charaindex) == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(charaindex,"账号"))
				if wenmingdata[id] ~= nil then
					if wenmingdata[id] == char.getWorkInt(meindex, "NPC临时15") then
						wenmingdata[id] = nil
						setPlayerData(id,2,"data1",1)
						local playermaxnum = char.getPlayerMaxNum() - 1
						for j=0,playermaxnum do
							if char.check(j) == 1 then
								if char.getInt(j,"地图号") == char.getInt(meindex,"地图号") then
									if char.getWorkChar(j,"NPC临时1") == id then
										char.newMessageToCli(j, -1, "竟然被找到了，那我为你们打开通道吧", "白色")
										char.TalkToCli(j, -1, "竟然被找到了，那我为你们打开通道吧", "白色")
									end
								end
							end
						end
					end
				end
				break
			end
		end
	end
end

function TalkedBoss1(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		if data2 > 0 then
			token = "竟然可以战胜我们两兄弟，不简单"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
		else
			token = "             『魔窟双雄』\n\n"
							.."\n    哪来的渣渣，遇上我们算你们倒霉！"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
		end
	end
end

function WindowTalkedBoss1 ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if select == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
				if data2 > 0 then
					char.DischargeParty(talkerindex, 1)
					char.WarpToSpecificPoint(talkerindex, 40031, 21, 13)
				else
					enemytable = {4547, 4548, -1, -1, -1, -1, -1, -1, -1, -1}
					battleindex = battle.CreateVsEnemy(talkerindex, meindex, enemytable)
					if battle.checkindex(battleindex) == 1 then
						setRamdomBattle(battleindex,id,talkerindex)
					end
				end
			end
		end
	end
end

function BattleOverBoss1(meindex, battleindex, iswin)
	if iswin == 1 then
		for i=0, 4 do
			charaindex = battle.getCharOne(battleindex, i, 0)
			if char.check(charaindex) == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(charaindex,"账号"))
				if data2 == 0 then
					setPlayerData(id,2,"data2",1)
					wenmingdata[id] = nil
				end
				break
			end
		end
	end
end

function TalkedBox(meindex, talkerindex , szMes, color )
	if other.time() >= 1548399599 and other.time() <= 1549209599 then
		zhandiandata = {50,75,100}
	else
		zhandiandata = {100,150,200}
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if checkEmptItemNum(talkerindex) < 1 then
			  char.newMessageToCli(talkerindex, -1, "您的道具栏空位不足", "白色")
			  return
		end
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		if char.getInt(meindex,"地图号") == 40031 then
			if data2 == 1 or data2 == 2 then
				if data7 == -1 then
					data7 = other.Random(boxitem[1][1],boxitem[1][2])
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data7",data7)
				end
				token = "I|青铜宝箱|" .. item.getgraNoFromITEMtabl(data7) .. "|" .. item.getSecretNameFromNumber(data7) .. "|" .. zhandiandata[1]
				if data2 == 1 then
					token = token .. "|" .. vippointdata[1]
				else
					token = token .. "|0"
				end
				lssproto.windows(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), token)
			elseif data2 == 3 then
				token = "您的宝箱已经打开了"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		elseif char.getInt(meindex,"地图号") == 40033 then
			if data5 == 1 or data5 == 2 then
				if data8 == -1 then
					data8 = other.Random(boxitem[2][1],boxitem[2][2])
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data8",data8)
				end
				token = "I|白银宝箱|" .. item.getgraNoFromITEMtabl(data8) .. "|" .. item.getSecretNameFromNumber(data8) .. "|" .. zhandiandata[2]
				if data5 == 1 then
					token = token .. "|" .. vippointdata[2]
				else
					token = token .. "|0"
				end
				lssproto.windows(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), token)
			elseif data5 == 3 then
				token = "您的宝箱已经打开了"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		elseif char.getInt(meindex,"地图号") == 40034 then
			if data6 == 1 or data6 == 2 then
				if data9 == -1 then
					data9 = other.Random(boxitem[3][1],boxitem[3][2])
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data9",data9)
				end
				token = "I|黄金宝箱|" .. item.getgraNoFromITEMtabl(data9) .. "|" .. item.getSecretNameFromNumber(data9) .. "|" .. zhandiandata[3]
				if data6 == 1 then
					token = token .. "|" .. vippointdata[3]
				else
					token = token .. "|0"
				end
				lssproto.windows(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), token)
			elseif data6 == 3 then
				token = "您的宝箱已经打开了"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		end
	end
end

function WindowTalkedBox( meindex, talkerindex, seqno, select, data)
	if other.time() >= 1548399599 and other.time() <= 1549209599 then
		zhandiandata = {50,75,100}
	else
		zhandiandata = {100,150,200}
	end
	if seqno == 0 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		if type == "G" then
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			if char.getInt(meindex,"地图号") == 40031 then
				if data2 == 1 or data2 == 2 then
					if checkEmptItemNum(talkerindex) < 1 then
						char.newMessageToCli(talkerindex, -1, "您的道具栏空位不足", "白色")
						return
					end
					if data7 == -1 then
						return
					end
					if char.getInt(talkerindex,"声望") < zhandiandata[1] * 100 then
						char.newMessageToCli(talkerindex, -1, "您的声望不足", "白色")
						return
					end
					local itemindex = char.Additem(talkerindex, data7)
					if item.check(itemindex) == 1 then
						char.newMessageToCli(talkerindex, -1, "获得" .. item.getChar(itemindex,"显示名"), "白色")
						setPlayerData(char.getChar(talkerindex,"账号"),3,"data2",3)
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - zhandiandata[1] * 100)
						lssproto.windowsupdate(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), "C")
					end
				end
			elseif char.getInt(meindex,"地图号") == 40033 then
				if data5 == 1 or data5 == 2 then
					if checkEmptItemNum(talkerindex) < 1 then
						char.newMessageToCli(talkerindex, -1, "您的道具栏空位不足", "白色")
						return
					end
					if data8 == -1 then
						return
					end
					if char.getInt(talkerindex,"声望") < zhandiandata[2] * 100 then
						char.newMessageToCli(talkerindex, -1, "您的声望不足", "白色")
						return
					end
					local itemindex = char.Additem(talkerindex, data8)
					if item.check(itemindex) == 1 then
						char.newMessageToCli(talkerindex, -1, "获得" .. item.getChar(itemindex,"显示名"), "白色")
						setPlayerData(char.getChar(talkerindex,"账号"),3,"data5",3)
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - zhandiandata[2] * 100)
						lssproto.windowsupdate(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), "C")
					end
				end
			elseif char.getInt(meindex,"地图号") == 40034 then
				if data6 == 1 or data6 == 2 then
					if checkEmptItemNum(talkerindex) < 1 then
						char.newMessageToCli(talkerindex, -1, "您的道具栏空位不足", "白色")
						return
					end
					if data9 == -1 then
						return
					end
					if char.getInt(talkerindex,"声望") < zhandiandata[3] * 100 then
						char.newMessageToCli(talkerindex, -1, "您的声望不足", "白色")
						return
					end
					local itemindex = char.Additem(talkerindex, data9)
					if item.check(itemindex) == 1 then
						char.newMessageToCli(talkerindex, -1, "获得" .. item.getChar(itemindex,"显示名"), "白色")
						setPlayerData(char.getChar(talkerindex,"账号"),3,"data6",3)
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - zhandiandata[3] * 100)
						lssproto.windowsupdate(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), "C")
						local sqltoken = "select `type` from `wenmingfirst` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(1)) == 0 then
									sqltoken = "update `wenmingfirst` set `type`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
									ret = sasql.query(sqltoken)
									if ret == 1 then
										other.CallFunction("othertitleuse","data/ablua/chartitle.lua",{talkerindex,47})
										char.newMessageToCli(talkerindex, -1, "获得弑神者称号", "白色")
										char.talkToAllServer("P|P|恭喜勇者" .. char.getChar(talkerindex,"名字") .. "成功完成全服首次副本通关","")
									end
								end
							end
						end
						char.WarpToSpecificPoint(talkerindex, 2000, 65, 58)
					end
				end
			end
		elseif type == "R" then
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			if char.getInt(meindex,"地图号") == 40031 then
				if data2 == 1 then
					local myvippoint = sasql.getVipPoint(talkerindex)
					if myvippoint < vippointdata[1] then
						char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
						return
					end
					sasql.setVipPoint(talkerindex,myvippoint - vippointdata[1])
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vippointdata[1]})
					char.newMessageToCli(talkerindex, -1, "刷新宝箱成功，扣除金币" .. vippointdata[1], "白色")
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -vippointdata[1] .. "," .. myvippoint .. "," .. myvippoint - vippointdata[1] .. ",'刷新宝箱扣除" .. vippointdata[1] .. "金币',NOW())"
					sasql.query(token)
					data7 = other.Random(boxitem[1][3],boxitem[1][4])
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data2",2)
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data7",data7)
					token = "I|青铜宝箱|" .. item.getgraNoFromITEMtabl(data7) .. "|" .. item.getSecretNameFromNumber(data7) .. "|" .. zhandiandata[1] .. "|0"
					lssproto.windowsupdate(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				end
			elseif char.getInt(meindex,"地图号") == 40033 then
				if data5 == 1 then
					local myvippoint = sasql.getVipPoint(talkerindex)
					if myvippoint < vippointdata[2] then
						char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
						return
					end
					sasql.setVipPoint(talkerindex,myvippoint - vippointdata[2])
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vippointdata[2]})
					char.newMessageToCli(talkerindex, -1, "刷新宝箱成功，扣除金币" .. vippointdata[2], "白色")
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -vippointdata[2] .. "," .. myvippoint .. "," .. myvippoint - vippointdata[2] .. ",'刷新宝箱扣除" .. vippointdata[2] .. "金币',NOW())"
					sasql.query(token)
					data8 = other.Random(boxitem[2][3],boxitem[2][4])
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data5",2)
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data8",data8)
					token = "I|白银宝箱|" .. item.getgraNoFromITEMtabl(data8) .. "|" .. item.getSecretNameFromNumber(data8) .. "|" .. zhandiandata[2] .. "|0"
					lssproto.windowsupdate(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				end
			elseif char.getInt(meindex,"地图号") == 40034 then
				if data6 == 1 then
					local myvippoint = sasql.getVipPoint(talkerindex)
					if myvippoint < vippointdata[3] then
						char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
						return
					end
					sasql.setVipPoint(talkerindex,myvippoint - vippointdata[3])
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vippointdata[3]})
					char.newMessageToCli(talkerindex, -1, "刷新宝箱成功，扣除金币" .. vippointdata[3], "白色")
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -vippointdata[3] .. "," .. myvippoint .. "," .. myvippoint - vippointdata[3] .. ",'刷新宝箱扣除" .. vippointdata[3] .. "金币',NOW())"
					sasql.query(token)
					data9 = other.Random(boxitem[3][3],boxitem[3][4])
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data6",2)
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data9",data9)
					token = "I|黄金宝箱|" .. item.getgraNoFromITEMtabl(data9) .. "|" .. item.getSecretNameFromNumber(data9) .. "|" .. zhandiandata[3] .. "|0"
					lssproto.windowsupdate(talkerindex, 1040, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif type == "F" then
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			if char.getInt(meindex,"地图号") == 40031 then
				if data2 == 1 or data2 == 2 then
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data2",3)
				end
			elseif char.getInt(meindex,"地图号") == 40033 then
				if data5 == 1 or data5 == 2 then
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data5",3)
				end
			elseif char.getInt(meindex,"地图号") == 40034 then
				if data6 == 1 or data6 == 2 then
					setPlayerData(char.getChar(talkerindex,"账号"),3,"data6",3)
					char.WarpToSpecificPoint(talkerindex, 2000, 65, 58)
				end
			end
		end
	end
end

function TalkedBoss2(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		if data5 > 0 then
			token = "很好，你们非常强大，但是等待你们的依然是死亡"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
		else
			token = "             『泰勒夫』\n\n"
							.."\n    来受死了吗？让我看看你们有几斤几两吧"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
		end
	end
end

function WindowTalkedBoss2( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if select == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
				if data5 > 0 then
					char.DischargeParty(talkerindex, 1)
					char.WarpToSpecificPoint(talkerindex, 40033, 23, 14)
				else
					enemytable = {4549, -1, -1, -1, -1, -1, -1, -1, -1, -1}
					battleindex = battle.CreateVsEnemy(talkerindex, meindex, enemytable)
					if battle.checkindex(battleindex) == 1 then
						setRamdomBattle(battleindex,id,talkerindex)
					end
				end
			end
		end
	end
end

function BattleOverBoss2(meindex, battleindex, iswin)
	if iswin == 1 then
		for i=0, 4 do
			charaindex = battle.getCharOne(battleindex, i, 0)
			if char.check(charaindex) == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(charaindex,"账号"))
				if data5 == 0 then
					setPlayerData(id,2,"data5",1)
					wenmingdata[id] = nil
				end
				break
			end
		end
	end
end

function TalkedBoss3(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
		if data6 > 0 then
			token = "别以为这样就结束了"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
		else
			token = "             『魔神雷尔』\n\n"
							.."\n    渺小的蝼蚁！现在跑还来得及！"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
		end
	end
end

function WindowTalkedBoss3( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if select == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
				if data6 > 0 then
					char.DischargeParty(talkerindex, 1)
					char.WarpToSpecificPoint(talkerindex, 40034, 12, 6)
				else
					enemytable = {2535, -1, -1, -1, -1, -1, -1, -1, -1, -1}
					battleindex = battle.CreateVsEnemy(talkerindex, meindex, enemytable)
					if battle.checkindex(battleindex) == 1 then
						setRamdomBattle(battleindex,id,talkerindex)
					end
				end
			end
		end
	end
end

function BattleOverBoss3(meindex, battleindex, iswin)
	if iswin == 1 then
		for i=0, 4 do
			charaindex = battle.getCharOne(battleindex, i, 0)
			if char.check(charaindex) == 1 then
				local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(charaindex,"账号"))
				if data6 == 0 then
					setPlayerData(id,2,"data6",1)
					wenmingdata[id] = nil
					local sqltoken = "select * from `wenmingfirst`"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() <= 0 then
							sqltoken = "select `cdkey` from `wenming` where `id`='" .. id .. "'"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								local sqlnum = sasql.num_rows()
								local firstcdkey = {}
								for i=1,sqlnum do
									sasql.fetch_row()
									firstcdkey[table.getn(firstcdkey) + 1] = sasql.data(1)
								end
								for i=1,table.getn(firstcdkey) do
									sqltoken = "insert into `wenmingfirst` values ('" .. firstcdkey[i] .. "',0)"
									sasql.query(sqltoken)
								end
							end
						end
					end
				end
				break
			end
		end
	end
end


function TalkedJi(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if char.getWorkInt(talkerindex,"组队") < 2 then
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			if data3 < os.time() then
				local newtime = os.time() + 60 * 10
				setPlayerData(id,2,"data3",newtime)
				setPlayerData(id,2,"data4",0)
				local playermaxnum = char.getPlayerMaxNum() - 1
				for i=0,playermaxnum do
					if char.check(i) == 1 then
						if char.getInt(i,"地图号") == char.getInt(meindex,"地图号") then
							if char.getWorkChar(i,"NPC临时1") == id then
								--char.newMessageToCli(i, -1, "关卡已激活，重置时间" .. os.date("%H:%M:%S",newtime), "白色")
								--char.TalkToCli(i, -1, "关卡已激活，重置时间" .. os.date("%H:%M:%S",newtime), "白色")
								char.talkToFloor(40032,-1,"此关卡有几率激活机关时触发BOSS请玩家保留一个物品栏！","随机色")
							end
						end
					end
				end
			end
			char.AllWarpToSpecificPoint(talkerindex, 40032, 70, 85)
		end
	end
end

function TalkedJiNum(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if char.getWorkInt(talkerindex,"组队") < 2 then
			local mydate,cnt,maxcnt,endtime,id,data1,data2,data3,data4,data5,data6,data7,data8,data9 = queryPlayerData(char.getChar(talkerindex,"账号"))
			local datacnt = 0
			for i=1,8 do
				if other.DataAndData(data4,i - 1) > 0 then
					datacnt = datacnt + 1
				end
			end
			--[[if data3 < os.time() and datacnt < 8 then
				local newtime = os.time() + 60 * 10
				setPlayerData(id,2,"data3",newtime)
				setPlayerData(id,2,"data4",0)
				local playermaxnum = char.getPlayerMaxNum() - 1
				for i=0,playermaxnum do
					if char.check(i) == 1 then
						if char.getInt(i,"地图号") == char.getInt(meindex,"地图号") then
							if char.getWorkChar(i,"NPC临时1") == id then
								char.WarpToSpecificPoint(i, 40032, 68, 83)
								char.newMessageToCli(i, -1, "关卡超时，重置时间" .. os.date("%H:%M:%S",newtime), "白色")
								char.TalkToCli(i, -1, "关卡超时，重置时间" .. os.date("%H:%M:%S",newtime), "白色")
							end
						end
					end
				end
			else]]
				if datacnt >= 8 then
					return
				end
				if other.DataAndData(data4,char.getWorkInt(meindex,"NPC临时15") - 1) > 0 then
					char.newMessageToCli(talkerindex, -1, "此机关已经被开启", "白色")
					return
				end
				
				if math.random(100) <= 20 then
					local enemyid = {4553,4553,4554,4554,4554,4554}
					battle.CreateVsEnemy(talkerindex,meindex,enemyid)
					char.talkToFloor(40032,-1,"[魔窟关卡]恭喜玩家[".. char.getChar(talkerindex,"名字") .. " ]触发BOSS！","随机色")
				end
				
				datacnt = datacnt + 1
				data4 = other.DataOrData(data4,char.getWorkInt(meindex,"NPC临时15") - 1)
				if datacnt >= 8 then
					datacnt = 8
				end
				local playermaxnum = char.getPlayerMaxNum() - 1
				for i=0,playermaxnum do
					if char.check(i) == 1 then
						if char.getInt(i,"地图号") == char.getInt(meindex,"地图号") then
							if char.getWorkChar(i,"NPC临时1") == id then
								if datacnt >= 8 then
									char.newMessageToCli(i, -1, "机关已经全部开启，请尽快进入下一关", "白色")
									char.TalkToCli(i, -1, "机关已经全部开启，请尽快进入下一关", "白色")
								else
									char.newMessageToCli(i, -1, "目前已经开启" .. datacnt .. "个机关", "白色")
									char.TalkToCli(i, -1, "目前已经开启" .. datacnt .. "个机关", "白色")
								end
							end
						end
					end
				end
				setPlayerData(id,2,"data4",data4)
			--end
		end
	end
end

function BattleOverjiBoss(meindex, battleindex, iswin)
	for i=0, 4 do
		charaindex = battle.getCharOne(battleindex, i, 0)
		if char.check(charaindex) == 1 then
			if iswin == 1 then
					local randjl = math.random(100)
				if randjl <= 20 then
			        local itemindex = char.Additem(charaindex,26022)
			        if itemindex > -1 then
				          char.talkToServer(-1,"玩家[" .. char.getChar(charaindex,"名字") .. "]在魔窟关卡击败BOSS获取[" .. item.getChar(itemindex,"名称") .. "]。","随机色")
				    end
				elseif randjl <= 80 then
				 local itemindex = char.Additem(charaindex,26008)
			        if itemindex > -1 then
				          char.talkToServer(-1,"玩家[" .. char.getChar(charaindex,"名字") .. "]在魔窟关卡击败BOSS获取[" .. item.getChar(itemindex,"名称") .. "]。","随机色")
				    end
		        end
			end
		end
	end
end

	
function Create(name, metamo, floorid, x, y, dir,npctype)
	index = npc.CreateNpc(name, metamo, floorid, x, y, dir)
	if char.check(index) == 1 then
		if npctype == 1 then
			char.setFunctionPointer(index, "对话事件", "Talked", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalked", "")
			char.setFunctionPointer(index, "循环事件", "Loop", "")
			char.setInt(index, "循环事件时间", 60000)
		elseif npctype >= 11 and npctype <= 18 then
			char.setFunctionPointer(index, "对话事件", "TalkedRlong", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalkedRlong", "")
			char.setFunctionPointer(index, "战后事件", "BattleOverRlong", "")
			char.setWorkInt(index,"NPC临时15",npctype - 10)
		elseif npctype == 3 then
			char.setFunctionPointer(index, "对话事件", "TalkedBoss1", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalkedBoss1", "")
			char.setFunctionPointer(index, "战后事件", "BattleOverBoss1", "")
		elseif npctype == 4 then
			char.setFunctionPointer(index, "对话事件", "TalkedBoss2", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalkedBoss2", "")
			char.setFunctionPointer(index, "战后事件", "BattleOverBoss2", "")
		elseif npctype == 5 then
			char.setFunctionPointer(index, "对话事件", "TalkedBoss3", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalkedBoss3", "")
			char.setFunctionPointer(index, "战后事件", "BattleOverBoss3", "")
		elseif npctype == 6 then
			char.setFunctionPointer(index, "对话事件", "TalkedBox", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalkedBox", "")
		elseif npctype == 30 then
			char.setFunctionPointer(index, "对话事件", "TalkedJi", "")
		elseif npctype >= 21 and npctype <= 28 then
			char.setWorkInt(index,"NPC临时15",npctype - 20)
			char.setFunctionPointer(index, "对话事件", "TalkedJiNum", "")
			char.setFunctionPointer(index, "战后事件", "BattleOverjiBoss", "")
		end
	end
	
end


function data()
	NpcData = {
				{{20,29},{34,33},{39,40},{45,40},{51,4},{21,13},{4,23},{4,36}},--人龙坐标,{9,38},{4,41}
				{2,6,4,4,6,8,2,8,2,4},
				{{10,83},{74,53},{91,79},{7,37},{42,12},{88,6},{86,45},{64,25}}--机关坐标
			}
			
			
			
			
			--[[drawlist1 = {{1, {26023,26024}}                    
						 ,{10, {26023,26024}}    
						 ,{30, {21005}}    
						 ,{55, {22050}}     
						 ,{63, {29107}}     
						 ,{70, {29108}}    
						 ,{77, {29110}}    
						 ,{85, {29102}}    
						 ,{92, {29088}}   
                         ,{100,{29105}} 						 
						 }
						 
			  drawlist2 = {{1, {29100}}                    
						 ,{20, {29100}}    
						 ,{40, {29098}}    
						 ,{50, {29112}}     
						 ,{70, {22050}}   
						 ,{75, {22051}}  
						 ,{95, {21009}}    
						 ,{100,{29082}}    					 
						 }
						 
			 drawlist3 = {{10, {29099}}                    
						 ,{100, {29099}}    
						 ,{300, {29100}}    
						 ,{400, {29111}}     
						 ,{600, {29098}} 
						 ,{700, {29112}}     
						 ,{850, {22050}}    
						 ,{900, {22051}}  
                         ,{920, {22052}}
                         ,{970, {29082}}
                         ,{984, {29065}}	
                         ,{998, {22482}}
                         ,{999, {29118}}	---开出的宠物也是绑定
                         ,{1000, {29119}}	---开出的宠物也是绑定					 
						 }--]]
			drawlist1={{1,{26023,26024}}
					 ,{10,{26023,26024}}
				     ,{15,{21005}}
					 ,{20,{29107}}
				     ,{25,{22050}}
					 ,{30,{29108}}
				     ,{32,{29110}}
					 ,{33,{29102}}	
					 ,{34,{29088}}
					 ,{35,{26023,26024}}
				     ,{36,{21005}}
					 ,{37,{29107}}
				     ,{38,{22050}}
					 ,{39,{29108}}
				     ,{40,{29110}}
					 ,{45,{29102}}	
					 ,{46,{29088}}
					 ,{47,{29105}}	 
									}

				drawlist2={{1,{29100}}
				,{20,{29100}}
				,{40,{29098}}
				,{50,{29112}}
				,{55,{22051}}
				,{60,{29082}}
				,{65,{22050}}
				,{70,{21009}} 
				,{75,{29100}}
				,{80,{29098}}
				,{85,{29112}}
				,{95,{22051}}
				,{100,{29082}}
				,{105,{22050}}
				,{110,{21009}}
				}
				drawlist3={{10,{29099}}
				,{100,{29099}}--镜子
				,{300,{29100}}--守护
				,{400,{29111}}--彩虹
				,{450,{22051}}--灵魂
				,{470,{22052}}--天佑
				,{484,{22482}}--称号
				,{485,{29118}}--年单
				,{486,{29119}}--人龙
				,{487,{29119}}--人龙
				,{120,{28350}}--扑满
				,{500,{29065}}--特效
				,{550,{29082}}--皮肤
				,{700,{22050}}--祝福
				,{800,{29112}}--极光
				,{1000,{29098}}--光
				}
						
	BuyMaxCntVipPoint = 5000
	FamePoint = 1000
	VigorPoint = 100
	
	noitem = {20126,20127,20128,22504,22505,22506,22507,29044,29049,18546,18547,18548}
	
	boxitem = {{29141,29146,29141,29146}
				,{29148,29152,29147,29152}
				,{29153,29157,29153,29158}}
	zhandiandata = {500,1000,2000}
	vippointdata = {200,400,600}
end


function main()
	data()
	wenmingdata = {}
	if config.getGameservername() == "娱乐互动线" then
		Create("失落的文明",16435,100,298,564,6,1)
		Create("玄关魔王",120121,40031,16,14,6,3)
		Create("前庭魔王",120113,40033,15,3,4,4)
	    Create("王宫魔王",101813,40034,12,18,4,5)--
		Create("青铜宝箱",24770,40031,25,7,6,6)
		Create("白银宝箱",24782,40033,26,13,6,6)
		Create("黄金宝箱",24773,40034,12,4,4,6)
		for i = 1,8 do
			Create("变异的邦浦洛斯", 100289, 40030, NpcData[1][i][1], NpcData[1][i][2], NpcData[2][i] , 10 + i) 
		end
		Create("机关", 120120, 40032, 87, 90, 6 , 30)
		for i = 1,8 do
			Create("机关", 120120, 40032, NpcData[3][i][1], NpcData[3][i][2], 6 , 20 + i)
		end
	end
end
