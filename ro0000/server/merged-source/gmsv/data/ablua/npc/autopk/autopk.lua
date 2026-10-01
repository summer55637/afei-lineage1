function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function FreePartyJoin( meindex, toindex )
	if runline ~= 0 then
		if pktype == 1 then
			if char.getInt(meindex, "地图号") == 12345 then
				char.TalkToCli(meindex, -1, "单P比赛不允许组队哟", "随机色")
				return 0
			end
		end
	end
	return 1
end

function getAutoPk( talkerindex )
	if char.check(talkerindex) == 1 then
		local cdkey = char.getChar(talkerindex,"账号")
		token = "SELECT * FROM `autopk` WHERE `cdkey`='".. char.getChar(talkerindex, "账号") .."'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			num = sasql.num_rows()
			if num > 0 then
				return 1
			end
		end
	end
	return 0
end

function setAutoPk( cdkey )
	token = "insert into `autopk` (`cdkey`) values ('" .. cdkey .. "')"
	ret = sasql.query(token)
end

function AutoPkLoop(meindex)
	if runline == 0 then
		if tonumber(os.date("%w",os.time())) == 5 and tonumber(os.date("%H",os.time())) == 19 and tonumber(os.date("%M",os.time())) == 30 
			or tonumber(os.date("%w",os.time())) == 3 and tonumber(os.date("%H",os.time())) == 19 and tonumber(os.date("%M",os.time())) == 30 then
			SystemAutoPk(meindex,30)
		end
		return
	elseif runline == 1 then
		runtime = runtime - 1
		
		if runtime <= 0 then
			char.talkToAllServer("P|P|[PK快讯]乱舞单P比赛正式开始咯～","")
			
			if pktype == 1 then
				no1pkpoint = 0
				no1cdkey = ""
				no1name = ""
	
				no2pkpoint = 0
				no2cdkey = ""
				no2name = ""
	
				no3pkpoint = 0
				no3cdkey = ""
				no3name = ""
			end
			runline = 2

			autopkplayernum = 0
			char.setInt(meindex, "循环事件时间", 1000)
		else
			if pktype == 1 then
				char.talkToAllServer("P|P|[PK快讯]单P比赛准备开始，现在可以入场了，请到" ..  config.getGameservername() .. "玛丽娜丝渔村医院(9,14)进入，距离乱舞单P比赛开始的时间还剩" .. runtime .. "分钟","")
			end
			char.setInt(meindex, "循环事件时间", 60000)
		end
	elseif runline == 2 then
		autopkplayernum = 0

		for i = 0, char.getPlayerMaxNum()-1 do
			if char.check(i) == 1 then
				if char.getInt(i, "地图号") == 12345 and (char.getInt(i, "坐标X") > 11 and char.getInt(i, "坐标X") < 37)  and (char.getInt(i, "坐标Y") > 7 and char.getInt(i, "坐标Y") < 34)  then
					if pktype == 1 then
						autopkplayernum = autopkplayernum + 1
					else
						if char.getWorkInt(i, "组队") == 0 then
							char.WarpToSpecificPoint(i, 12345, 24, 38)
						else
							autopkplayernum = autopkplayernum + 1
						end
					end
				end
			end
		end

		if autopkplayernum < minpknum then
			if autopkplayernum > 0 then
				for i = 0, char.getPlayerMaxNum()-1 do
					if char.check(i) == 1 then
						if char.getInt(i, "地图号") == 12345 and (char.getInt(i, "坐标X") > 11 and char.getInt(i, "坐标X") < 37)  and (char.getInt(i, "坐标Y") > 7 and char.getInt(i, "坐标Y") < 34)  then
							char.WarpToSpecificPoint(i, 12345, 24, 38)
						end
					end
				end
			end
			char.talkToAllServer("P|P|[PK快讯]由于本届比赛参加比赛的人小于" .. minpknum .. "人，所以本届比赛取消～下次记得多喊点人来一起PK哦～","")
			runline = 0
			char.setInt(meindex, "循环事件时间", 1000)
		else
			strattime = other.time()
			runline = 4
		end
	elseif runline == 3 then
		isbattle = false
		for i = 0, char.getPlayerMaxNum() - 1 do
			if char.check(i) == 1 then
				if char.getInt(i, "地图号") == 12345 and (char.getInt(i, "坐标X") > 11 and char.getInt(i, "坐标X") < 37)  and (char.getInt(i, "坐标Y") > 7 and char.getInt(i, "坐标Y") < 34)  then
					if char.getWorkInt(i, "战斗") ~= 0 then
						autopktime = autopktime + 1
						isbattle = true
						break
					end
				end
			end
		end
		if isbattle == false or autopktime >=20 then
			strattime = other.time() + 60
			char.talkToAllServer("P|P|[PK快讯]" ..  config.getGameservername() .. "1分钟内将自动安排比赛!!","")
			runline = 4
			autopktime = 0
		end
	elseif runline == 4 then
		if other.time() > strattime then
			battlenum = 0
			autopkplayernum = 0
			teamnum = 0
			start = math.random(char.getPlayerMaxNum())
			for i = 0, char.getPlayerMaxNum() - 1 do
				if char.check(i) == 1 then
					if char.getInt(i, "地图号") == 12345 and (char.getInt(i, "坐标X") > 11 and char.getInt(i, "坐标X") < 37)  and (char.getInt(i, "坐标Y") > 7 and char.getInt(i, "坐标Y") < 34)  then
						autopkplayernum = autopkplayernum + 1
					end
				end
				charaindex1 = (start + i) % char.getPlayerMaxNum()
				if char.check(charaindex1) == 1 then
					if char.getInt(charaindex1, "地图号") == 12345 and (char.getInt(charaindex1, "坐标X") > 11 and char.getInt(charaindex1, "坐标X") < 37)  and (char.getInt(charaindex1, "坐标Y") > 7 and char.getInt(charaindex1, "坐标Y") < 34)  then
						if char.getWorkInt(charaindex1, "组队") ~= 2 and char.getWorkInt(charaindex1, "战斗") == 0 then
							charaindex2 = -1
							for j = 0, char.getPlayerMaxNum() - 1 do
								if char.check(j) == 1 then
									if char.getInt(j, "地图号") == 12345 and (char.getInt(j, "坐标X") > 11 and char.getInt(j, "坐标X") < 37)  and (char.getInt(j, "坐标Y") > 7 and char.getInt(j, "坐标Y") < 34)  then
										if char.getWorkInt(j, "组队") ~= 2 and char.getWorkInt(j, "战斗") == 0 then
											if charaindex1 ~= j then
												teamnum = teamnum + 1
												charaindex2 = j
												if pktype == 1 then
													if char.getWorkInt(charaindex1, "自动PK死亡") == char.getWorkInt(j, "自动PK死亡") then
														charaindex2 = j
														if math.random(3) == 1 then
															break
														end
													end
												else
													if math.random(3) == 1 then
														break
													end
												end
											end
										end
									end
								end
							end
							if char.check(charaindex2) == 1 then
								battleindex = battle.CreateVsPlayer(charaindex1, charaindex2)
								if battleindex > -1 then
									char.setWorkInt(charaindex1,"计时器",other.time())
									char.setWorkInt(charaindex2,"计时器",other.time())
									battle.setLUAFunctionPointer(battleindex, "结束事件", "AutoPkBattleFinish", "")
									battlenum = battlenum + 1
								end
							end
						end
					end
				end
			end
			
			if pktype == 1 then
				if autopkplayernum <= 1 then
					for i = 0, char.getPlayerMaxNum()-1 do
						if char.check(i) == 1 then
							if char.getInt(i, "地图号") == 12345 and (char.getInt(i, "坐标X") > 11 and char.getInt(i, "坐标X") < 37)  and (char.getInt(i, "坐标Y") > 7 and char.getInt(i, "坐标Y") < 34)  then
								char.WarpToSpecificPoint(i, 12345, 24, 38)
								if autopktype == 0 then
									char.setWorkInt(i, "自动PK点", char.getWorkInt(i, "自动PK点") + 2)
								end
								if char.getWorkInt(i, "自动PK点") > no1pkpoint then
									if char.getChar(i, "账号") ~= no1cdkey or char.getChar(i, "名字") ~= no1name then
										if char.getChar(i, "账号") == no3cdkey or char.getChar(i, "名字") == no3name then
											no3pkpoint = no2pkpoint
											no3cdkey = no2cdkey
											no3name = no2name
										end
										no2pkpoint = no1pkpoint
										no2cdkey = no1cdkey
										no2name = no1name
									end
		
									no1pkpoint = char.getWorkInt(i, "自动PK点")
									no1cdkey = char.getChar(i, "账号")
									no1name = char.getChar(i, "名字")
								elseif char.getWorkInt(i, "自动PK点") > no2pkpoint then
									if char.getChar(i, "账号") ~= no1cdkey or char.getChar(i, "名字") ~= no1name then
										if char.getChar(i, "账号") ~= no2cdkey or char.getChar(i, "名字") ~= no2name then
											no3pkpoint = no2pkpoint
											no3cdkey = no2cdkey
											no3name = no2name
										end
										no2pkpoint = char.getWorkInt(i, "自动PK点")
										no2cdkey = char.getChar(i, "账号")
										no2name = char.getChar(i, "名字")
									end
								elseif char.getWorkInt(i, "自动PK点") > no3pkpoint then
									if char.getChar(i, "账号") ~= no1cdkey or char.getChar(i, "名字") ~= no1name then
										if char.getChar(i, "账号") ~= no2cdkey or char.getChar(i, "名字") ~= no2name then
											no3pkpoint = char.getWorkInt(i, "自动PK点")
											no3cdkey = char.getChar(i, "账号")
											no3name = char.getChar(i, "名字")
										end
									end				
								end
								break
							end
						end
					end
					
					char.talkToAllServer("P|P|[PK快讯]恭喜玩家 " .. no1name .. " 成为今日PK比赛冠军并获得5000水晶","")
					char.talkToAllServer("P|P|[PK快讯]恭喜玩家 " .. no2name .. " 成为今日PK比赛亚军并获得3000水晶","")
					char.talkToAllServer("P|P|[PK快讯]恭喜玩家 " .. no3name .. " 成为今日PK比赛季军并获得1000水晶","")
					sasql.setPetPointForCdkey(no1cdkey,sasql.getPetPointForCdkey(no1cdkey) + 5000)
					sasql.setPetPointForCdkey(no2cdkey,sasql.getPetPointForCdkey(no2cdkey) + 3000)
					sasql.setPetPointForCdkey(no3cdkey,sasql.getPetPointForCdkey(no3cdkey) + 1000)
					--setAutoPk(no1cdkey)
					--setAutoPk(no2cdkey)
					runline = 0
					char.setInt(meindex, "循环事件时间", 60000)
					return
				end
			end
			if battlenum > 0 then
				char.talkToAllServer("P|P|[PK快讯]" ..  config.getGameservername() .. "第" .. pknum .. "比赛系统自动安排了 " .. battlenum .. " 组PK赛，场内当前剩 " .. autopkplayernum .. " 人","")
				pknum = pknum +1
				if battlenum == 1 and autopkplayernum == 2 then
					for i = 0, char.getPlayerMaxNum()-1 do
						if char.check(i) == 1 then
							if char.getInt(i, "地图号") == 12345 and (char.getInt(i, "坐标X") > 11 and char.getInt(i, "坐标X") < 37)  and (char.getInt(i, "坐标Y") > 7 and char.getInt(i, "坐标Y") < 34)  then
								autopktype = 1
							end
						end
					end
				end
			end
			
			runline = 3
			char.setInt(meindex, "循环事件时间", 3000)
		end
	end
end

function AutoPkBattleFinish( charaindex )
	if char.getInt(charaindex, "地图号") == 12345 and (char.getInt(charaindex, "坐标X") > 11 and char.getInt(charaindex, "坐标X") < 37)  and (char.getInt(charaindex, "坐标Y") > 7 and char.getInt(charaindex, "坐标Y") < 34)  then
		if pktype == 1 then
			if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
				char.WarpToSpecificPoint(charaindex, 12345, 24, 38)
				autopkplayernum = autopkplayernum - 1
				char.setWorkInt(charaindex, "自动PK点", 0)
				char.setInt(charaindex, "声望", char.getInt(charaindex, "声望") + 500)
				char.newMessageToCli(charaindex, -1, "获得安慰奖5声望", "白色")
			else
				if other.time() - char.getWorkInt(charaindex,"计时器") < 600 then
					char.setWorkInt(charaindex, "自动PK点", char.getWorkInt(charaindex, "自动PK点") + 1)
					char.talkToAllServer("P|P|[PK快讯]玩家 " .. char.getChar(charaindex, "名字") .. " 获胜，增加胜点1。累计胜点" ..char.getWorkInt(charaindex, "自动PK点") .. "。","")
				else
					char.setWorkInt(charaindex, "自动PK点", char.getWorkInt(charaindex, "自动PK点") + 2)
					char.talkToAllServer("P|P|[PK快讯]玩家 " .. char.getChar(charaindex, "名字") .. " 获胜，增加胜点2。","")
				end
				if char.getWorkInt(charaindex, "自动PK点") > no1pkpoint then
					if char.getChar(charaindex, "账号") ~= no1cdkey or char.getChar(charaindex, "名字") ~= no1name then
						if char.getChar(charaindex, "账号") == no3cdkey or char.getChar(charaindex, "名字") == no3name then
							no3pkpoint = no2pkpoint
							no3cdkey = no2cdkey
							no3name = no2name
						end
						no2pkpoint = no1pkpoint
						no2cdkey = no1cdkey
						no2name = no1name
					end
		
					no1pkpoint = char.getWorkInt(charaindex, "自动PK点")
					no1cdkey = char.getChar(charaindex, "账号")
					no1name = char.getChar(charaindex, "名字")
					token = "，目前排名第一。"
				elseif char.getWorkInt(charaindex, "自动PK点") > no2pkpoint then
					if char.getChar(charaindex, "账号") == no1cdkey or char.getChar(charaindex, "名字") == no1name then
						return
					end
					
					if char.getChar(charaindex, "账号") ~= no2cdkey or char.getChar(charaindex, "名字") ~= no2name then
						no3pkpoint = no2pkpoint
						no3cdkey = no2cdkey
						no3name = no2name
					end
					
					no2pkpoint = char.getWorkInt(charaindex, "自动PK点")
					no2cdkey = char.getChar(charaindex, "账号")
					no2name = char.getChar(charaindex, "名字")
					token = "，目前排名第二。"
				elseif char.getWorkInt(charaindex, "自动PK点") > no3pkpoint then
					if char.getChar(charaindex, "账号") == no1cdkey or char.getChar(charaindex, "名字") == no1name then
						return
					end
					if char.getChar(charaindex, "账号") == no2cdkey or char.getChar(charaindex, "名字") == no2name then
						return
					end
					no3pkpoint = char.getWorkInt(charaindex, "自动PK点")
					no3cdkey = char.getChar(charaindex, "账号")
					no3name = char.getChar(charaindex, "名字")
					
					token = "，目前排名第三。"
				else
					token = ""
				end
			end
		end
		strattime = other.time() + 60
	end
end

function AutoPkLookWar ( meindex, talkerindex, seqno, select, data)
	autopkbattleteam1 = {-1,-1}
	autopkbattleteam2 = {-1,-1}
	autopkfloorid = 12345
	autopkfloorname = "乱舞现场"
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 2 then
			if select == 0 or select == 1 then
				for i=1,table.getn(autopkbattleteam1) do
					autopkbattleteam1[i] = nil
				end
				for i=1,table.getn(autopkbattleteam2) do
					autopkbattleteam2[i] = nil
				end
				ii = 0
				for i = 0,400 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == autopkfloorid then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										autopkbattleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										autopkbattleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 then
					for i = 1,math.min(table.getn(autopkbattleteam1),15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",autopkbattleteam1[i],autopkfloorname,char.getChar(autopkbattleteam1[i],"名字"),char.getChar(autopkbattleteam2[i],"名字")) .. "\n"
					end
					if table.getn(autopkbattleteam1) < 15 then
						for i=1,15 - table.getn(autopkbattleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					if table.getn(autopkbattleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽输入框", 44, 1001, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif seqno >= 1001 and seqno <= 1050 then
			if select == 4 then
				battleno = other.atoi(data)
				if battle.checkindex(char.getWorkInt(battleno,"战斗索引")) ~= 1 then
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，您输入的战斗编号错误或战斗已经结束。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					return
				end
				if battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= autopkfloorid then 
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，您输入的战斗编号错误或战斗已经结束。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					return
				end
				toindex = battleno
				if char.check(toindex) == 1 then
					battle.WatchEntry(talkerindex, toindex)
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 16 then
				if seqno == 1001 then
					return
				end
				for i=1,table.getn(autopkbattleteam1) do
					autopkbattleteam1[i] = nil
				end
				for i=1,table.getn(autopkbattleteam2) do
					autopkbattleteam2[i] = nil
				end
				ii = 0
				for i = 0,400 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == autopkfloorid then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										autopkbattleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										autopkbattleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1002) * 15 + 1 <= table.getn(autopkbattleteam1) then
					for i = (seqno - 1002) * 15 + 1,math.min(table.getn(autopkbattleteam1),(seqno - 1002) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",autopkbattleteam1[i],autopkfloorname,char.getChar(autopkbattleteam1[i],"名字"),char.getChar(autopkbattleteam2[i],"名字")) .. "\n"
					end
					if table.getn(autopkbattleteam1) < (seqno - 1002) * 15 + 15 then
						for i = 1,(seqno - 1002) * 15 + 15 - table.getn(autopkbattleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					if table.getn(autopkbattleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 > 0 then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 == 0 then
						lssproto.windows(talkerindex, "宽输入框", 44, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 32 then
				if seqno == 1050 then
					return
				end
				for i=1,table.getn(autopkbattleteam1) do
					autopkbattleteam1[i] = nil
				end
				for i=1,table.getn(autopkbattleteam2) do
					autopkbattleteam2[i] = nil
				end
				ii = 0
				for i = 0,400 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[1] or battle.getBattleFloor(i) == fmfloorid[2] then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										autopkbattleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										autopkbattleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1001 + 1) * 15 + 1 <= table.getn(autopkbattleteam1) then
					for i = (seqno - 1001 + 1) * 15 + 1,math.min(table.getn(autopkbattleteam1),(seqno - 1001 + 1) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",autopkbattleteam1[i],autopkfloorname,char.getChar(autopkbattleteam1[i],"名字"),char.getChar(autopkbattleteam2[i],"名字")) .. "\n"
					end
					if table.getn(autopkbattleteam1) < (seqno - 1001 + 1) * 15 + 15 then
						for i = 1,(seqno - 1001 + 1) * 15 + 15 - table.getn(autopkbattleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					seqno = seqno + 1
					if table.getn(autopkbattleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 >= table.getn(autopkbattleteam1) then
						lssproto.windows(talkerindex, "宽输入框", 28, seqno, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 < table.getn(autopkbattleteam1) then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		end
	end
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = char.getChar(meindex,"名字") .. "|玩家可在每周三/五晚上8点\n详情请看介绍|5|报名参加比赛|我要进入场地|远程观看战斗|查看目前战绩|系统规则介绍"
		lssproto.windows(talkerindex, "新选择框", "取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	pksystembuff = "\n　乱舞比赛开启时间：19：30[入场时间]  20:00[正式开始]\n　乱舞比赛开启条件：逢周三/五开启 入场扣20活力 特殊活动除外\n\n　乱舞PK的比赛模式：[1v1] 系统自动安排模式 败者离场\n　乱舞PK的名次计算：胜点模式 当每场胜利者将获得1-2胜点\n　同胜点的名次计算：当两人同胜点时排名以先到此点数为先\n\n　乱舞PK的前三奖励：[5000]、[3000]、[1000] 水晶\n　参与奖 、战败有5点声望奖励\n\n　查看目前战绩功能：可查看当前比赛中排名前五的选手战点\n　远程观看战斗功能：可自选查看比赛场地内选手的实况比赛\n　非战败离场的处罚：以登出或传送出场的选手扣除２点胜点"
	if seqno == 1 then
		if select == 0 then
			num = other.atoi(data)
			if num == 1 then
				if runline <= 0 then
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n很抱歉，目前乱舞PK活动尚未开始～\n目前乱舞PK设置为每周五8点进行～\n每次开放前半小时可以提前入场～"
					lssproto.windows(talkerindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
				elseif runline == 1 then
					if char.getWorkInt(talkerindex, "组队") ~= 0 then
						char.TalkToCli(talkerindex, -1, "请解散团队后进入！", "随机色")
						return
					end
					
					if char.getInt(talkerindex,"转数") < 1 or char.getInt(talkerindex, "等级") <= 130  then
						char.TalkToCli(talkerindex, -1, "参加比赛的条件必需1转130级以上！", "随机色")
						return
					end
					
					if char.getInt(talkerindex, "活力") < 20 then
						char.newMessageToCli(talkerindex, -1, "活力不足，参加比赛条件需要20活力！", "随机色")
						lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
						return
					end
					
					
					--[[if pktype ~= 5 then
						maxnum = 1
					else
						maxnum = 5
					end]]--
					maxnum = 2
					maxplayer = char.getPlayerMaxNum()
					local numtemp = 0
					for i = 0, maxplayer - 1 do
						if char.check(i) == 1 then
							if char.getInt(i, "地图号") == 12345 and (char.getInt(i, "坐标X") > 11 and char.getInt(i, "坐标X") < 37)  and (char.getInt(i, "坐标Y") > 7 and char.getInt(i, "坐标Y") < 34)  then
								if char.getWorkChar(talkerindex, "MAC") == char.getWorkChar(i, "MAC") then
									numtemp = numtemp +1
									if numtemp >= maxnum then
										char.TalkToCli(talkerindex, -1, "您已经有" .. maxnum .. "个人物参加比赛了哦，不能再参加了。", "随机色")
										return
									end
								end
							end
						end
					end
					--if getAutoPk( talkerindex ) == 0 then
						char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - 20)
						char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + 20 * 100)
						saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
					    other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,20})
					    char.newMessageToCli(talkerindex, -1, "扣除20点活力", "随机色")
						char.WarpToSpecificPoint(talkerindex, 12345, 26, 20)
						char.setWorkInt(talkerindex, "自动PK点", 0)
						char.talkToAllServer("P|P|[PK快讯]" ..  config.getGameservername() .. "选手" .. char.getChar(talkerindex, "名字") .. "在(" ..  config.getGameservername() .. ")参加了乱舞单P比赛","")
						autopkplayernum = autopkplayernum + 1
					--else
					--	char.TalkToCli(talkerindex, -1, "您已经海选晋级成功，无法再参加了哦。", "随机色")
					--end
				else
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n很抱歉，PK比赛已经进行中了～"
					lssproto.windows(talkerindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif num == 2 then
					char.WarpToSpecificPoint(talkerindex, 12345, 24, 38)
			elseif num == 3 then
				AutoPkLookWar( meindex, talkerindex, 2, select, data)
			elseif num == 4 then
				if runline <= 0 then
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n目前还没举行任何PK比赛，请留意系统公告～"
				else
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n当前场内有" .. autopkplayernum .. "选手～\n\n"
					if pktype == 1 then
						token = token .. string.format("第一名：%-16s得分：%d\n第二名：%-16s得分：%d\n第三名：%-16s得分：%d", no1name, no1pkpoint, no2name, no2pkpoint, no3name, no3pkpoint)
					end
				end
				lssproto.windows(talkerindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
			elseif num == 5 then
				token = "                『 乱舞PK比赛介绍 』\n" .. pksystembuff
				lssproto.windows(talkerindex, "宽对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
			end
		end
	elseif seqno >= 1001 and seqno <=1050 then
		AutoPkLookWar ( meindex, talkerindex, seqno, select, data)
	end
end


function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "AutoPkLoop", "")
	char.setInt(npcindex, "循环事件时间", 60000)
	winplayer = {{"",""}
									,{"",""}
									,{"",""}
									,{"",""}
									,{"",""}
								 }

	runline = 0
	autopkplayernum = 0
	data()
end   
          
function PKStart(charaindex, data)
	strattime = other.time() + 10
	char.talkToAllServer("P|P|[PK快讯]" ..  config.getGameservername() .. "10秒内将自动安排比赛!!")
	runline = 4
end

      
function GmAutoPk(charaindex, data)
	runtime = other.atoi(data)
	runline = 1
	pknum = 0
	pktype = 1
	minpknum = 8
	autopktype = 0
	char.TalkToCli(charaindex, -1, "成功激活乱舞单P活动，开始时间剩余" .. runtime .. "分钟", "随机色")
	for i = 0, char.getPlayerMaxNum()-1 do
		if char.check(i) == 1 then
			lssproto.S(i,"T|" .. runtime * 60)
		end
	end
end

function SystemAutoPk(charaindex, data)
	runtime = data
	runline = 1
	pknum = 0
	pktype = 1
	minpknum = 8
	autopktype = 0
	char.talkToAllServer("P|P|[PK快讯]乱舞单P活动[" .. config.getGameservername() .. "]将在" .. runtime .. "分钟后开始。请要参加的玩家提前入场哦！","")
	for i = 0, char.getPlayerMaxNum()-1 do
		if char.check(i) == 1 then
			lssproto.S(i,"T|" .. runtime * 60)
		end
	end
end

function pknext()
	runline = 4
end

function pkstop(charaindex,data)
	npctime = other.atoi(data)
	if npctime < 0 then
		npctime = 0
	end
	autopktime = 0
	runline = 0
	autopktype = 0
	char.setInt(npcindex, "循环事件时间", npctime)
	char.TalkToCli(charaindex, -1, "重新设置NPC循环时间" .. npctime .. "秒成功", "随机色")
end

function getruntime(charaindex)
	if config.getGameservername() ~= "娱乐互动线" then
		return 0
	else
		if runline ~= 1 then
			return 0
		else
			return runtime * 60
		end
	end
end

function data()
	autopktime = 0
end

function main()
	data()
	autopktype = 0
	runtime = 0
	runline = 0
	if config.getGameservername() == "娱乐互动线" then
		Create("乱舞PK比赛", 26785, 2005, 9, 14, 6)
	end
	magic.addLUAListFunction("autopk", "GmAutoPk", "", 1, "[autopk 分钟]")
	magic.addLUAListFunction("pknext", "pknext", "", 1, "[pknext]")
	magic.addLUAListFunction("pkstop", "pkstop", "", 1, "[pkstop]")
end

