function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		local token = char.getChar(meindex, "名字") .. "|如果你自认为实力足够力压\n全场!请来这里报名吧\n每两周二三四五挑选16强选手|4|参加1V1比赛|领取决赛奖励|PK赛观战|查看决赛排名"
		lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked (meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 and select ~= 8 then
		if seqno == 0 then
			if start and data*1 ==1 then
				if pktype == "总决赛" then
					local enable = false
					sasql.query("select * from PKdasai where session="..session)
					sasql.free_result()
					sasql.store_result()
					sasql.fetch_row()
					for i=2,32,2 do
						if sasql.data(i) == char.getChar(talkerindex,"账号") then
							enable = true
							break
						end
					end
					if enable then
						char.DischargeParty(talkerindex, 1)
						char.AllWarpToSpecificPoint(talkerindex, pkfloorid, 15, 15)
						char.talkToAllServer("P|P|[PK大赛]"..char.getChar(talkerindex,"名字").."参加了本次的PK总决赛。目前场内人数："..Gettotalppl(talkerindex),"")
					else
						char.newMessageToCli(talkerindex, -1, "您并没有资格参加本届总决赛", 4)
					end
				else
					if math.floor(char.getInt(talkerindex,"体力")/100) + math.floor(char.getInt(talkerindex,"腕力")/100) + math.floor(char.getInt(talkerindex,"耐力")/100)
					+ math.floor(char.getInt(talkerindex,"速度")/100) + char.getInt(talkerindex,"技能点") > 623 then
						char.DischargeParty(talkerindex, 1)
						char.AllWarpToSpecificPoint(talkerindex, pkfloorid, 15, 15)
						char.talkToAllServer("P|P|[PK大赛]"..char.getChar(talkerindex,"名字").."参加了本次的PK资格赛。目前场内人数："..Gettotalppl(talkerindex),"")
					else
						char.newMessageToCli(talkerindex, -1, "你目前未有资格参加比赛", 4)
					end
				end
			elseif data*1 == 1 then
				char.newMessageToCli(talkerindex, -1, "目前没有任何比赛可参与", 4)
			elseif data*1 == 2 then
				sasql.query("select session,champion,second,third from PKdasai where champion ='"..char.getChar(talkerindex,"账号").."' and flag1 is null"
				.." or second ='"..char.getChar(talkerindex,"账号").."' and flag2 is null or third ='"..char.getChar(talkerindex,"账号").."' and flag3 is null")
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					if sasql.data(2) == char.getChar(talkerindex,"账号") then
						npc.AddItem(talkerindex, reward[1])
						sasql.query("update PKdasai set flag1 = 1 where session ="..sasql.data(1))
					elseif sasql.data(3) == char.getChar(talkerindex,"账号") then
						npc.AddItem(talkerindex, reward[2])
						sasql.query("update PKdasai set flag2 = 1 where session ="..sasql.data(1))
					elseif sasql.data(4) == char.getChar(talkerindex,"账号") then
						npc.AddItem(talkerindex, reward[3])
						sasql.query("update PKdasai set flag3 = 1 where session ="..sasql.data(1))
					end
					char.newMessageToCli(talkerindex, -1, "您没有赢取任何比赛奖励", 4)
				else
					char.newMessageToCli(talkerindex, -1, "您没有赢取任何比赛奖励", 4)
				end
			elseif data*1 == 3 then
				local token = char.getChar(meindex, "名字")
				for i=0,config.getBattleNum() do
					if battle.checkindex(i) == 1 and battle.getBattleFloor(i) == pkfloorid then
						for j=0,4 do
							local index1 = battle.getCharOne(i, j, 0)
							if char.check(index1) == 1 then
								token = token .. "\n" .. char.getInt(index1, "图像号") .. "|" .. char.getChar(index1, "名字") .. "|" .. char.getChar(index1, "家族")
							else
								token = token .. "\n0|"
							end
							local index2 = battle.getCharOne(i, j, 1)
							if char.check(index2) == 1 then
								token = token .. "\n" .. char.getInt(index2, "图像号") .. "|" .. char.getChar(index2, "名字") .. "|" .. char.getChar(index2, "家族")
							else
								token = token .. "\n-1|"
							end
						end
						lssproto.windows(talkerindex, 1022, 40, 10+i, char.getWorkInt( meindex, "对象"), token)
						return
					end
				end
				char.newMessageToCli(talkerindex, -1, "目前并未有任何比赛", 4)
			elseif data*1 == 4 then
				char.newMessageToCli(talkerindex, -1, "目前未产生任何PK决赛冠军", 4)
			end
		elseif seqno > 9 then
			local battleindex = seqno-10
			local token = ""
			if select == 1 then
				if battle.checkindex(battleindex) == 1 and battle.getBattleFloor(battleindex) == pkfloorid then
					for i=0,4 do
						local index1 = battle.getCharOne(battleindex, i, 0)
						if char.check(index1) == 1 then
							battle.WatchEntry(talkerindex, index1)
							return
						end
					end
				end
				char.newMessageToCli(talkerindex, -1, "该赛事已结束", 4)
			elseif select == 16 then
				for i=battleindex-1,0,-1 do
					if battle.checkindex(i) == 1 and battle.getBattleFloor(i) == pkfloorid then
						token = char.getChar(meindex, "名字")
						for j=0,4 do
							local index1 = battle.getCharOne(i, j, 0)
							if char.check(index1) == 1 then
								token = token .. "\n" .. char.getInt(index1, "图像号") .. "|" .. char.getChar(index1, "名字") .. "|" .. char.getChar(index1, "家族")
							else
								token = token .. "\n-1|"
							end
							local index2 = battle.getCharOne(i, j, 1)
							if char.check(index2) == 1 then
								token = token .. "\n" .. char.getInt(index2, "图像号") .. "|" .. char.getChar(index2, "名字") .. "|" .. char.getChar(index2, "家族")
							else
								token = token .. "\n-1|"
							end
						end
						lssproto.windows(talkerindex, 1022, 56, 10 + i, char.getWorkInt( meindex, "对象"), token)
						return
					end
				end
				char.newMessageToCli(talkerindex, -1, "没有更多比赛", 4)
			elseif select == 32 then
				for i=battleindex+1,config.getBattleNum() do
					if battle.checkindex(i) == 1 and battle.getBattleFloor(i) == pkfloorid then
						token = char.getChar(meindex, "名字")
						for j=0,4 do
							local index1 = battle.getCharOne(i, j, 0)
							if char.check(index1) == 1 then
								token = token .. "\n" .. char.getInt(index1, "图像号") .. "|" .. char.getChar(index1, "名字") .. "|" .. char.getChar(index1, "家族")
							else
								token = token .. "\n-1|"
							end
							local index2 = battle.getCharOne(i, j, 1)
							if char.check(index2) == 1 then
								token = token .. "\n" .. char.getInt(index2, "图像号") .. "|" .. char.getChar(index2, "名字") .. "|" .. char.getChar(index2, "家族")
							else
								token = token .. "\n-1|"
							end
						end
						lssproto.windows(talkerindex, 1022, 56, 10 + i, char.getWorkInt( meindex, "对象"), token)
						return
					end
				end
				char.newMessageToCli(talkerindex, -1, "没有更多比赛", 4)
			end
		end
	end
end

function Gettotalppl(charaindex)
	local check = true
	if #ppl == 0 then
		ppl = {char.getChar(charaindex,"账号")}
	else
		for i=1,#ppl do
			if char.getChar(charaindex,"账号") == ppl[i] then
				check = false
				break
			end
		end
		if check then
			table.insert(ppl,char.getChar(charaindex,"账号"))
		end
	end
	return #ppl
end

function BattleFinish(charaindex)
	if pktype == "总决赛" then
		if finallist[1] == charaindex and os.time() - char.getWorkInt(charaindex,"NPC临时1") >= 180 or finallist[2] == charaindex and os.time() - char.getWorkInt(charaindex,"NPC临时1") >= 180 
			or finallist2[1] == charaindex and os.time() - char.getWorkInt(charaindex,"NPC临时1") >= 180 or finallist2[2] == charaindex and os.time() - char.getWorkInt(charaindex,"NPC临时1") >= 180 then
			for i=1,#finallist do
				if charaindex == finallist[i] then
					if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
						second = char.getChar(charaindex, "名字")
						sasql.query("update PKdasai set second ='"..char.getChar(charaindex,"账号").."' where session ="..session)
					else
						champion = char.getChar(charaindex, "名字")
						sasql.query("update PKdasai set champion ='"..char.getChar(charaindex,"账号").."' where session ="..session)
					end
					if #finallist2 == 0 and not third then
						third = "-"
					end
					char.WarpElderPosition(charaindex)
					return
				end
			end
			for i=1,#finallist2 do
				if charaindex == finallist2[i] then
					if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
						sasql.setVipPoint(charaindex,sasql.getVipPoint(charaindex)+2000)
						char.TalkToCli(charaindex, -1, "获得2000金币", 4);
					else
						third = char.getChar(charaindex, "名字")
						sasql.query("update PKdasai set third ='"..char.getChar(charaindex,"账号").."' where session ="..session)
						char.WarpElderPosition(charaindex)
					end
					char.WarpElderPosition(charaindex)
				end
			end
		elseif finalcheck then
			if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
				if GetPlayers(true) == 1 then
					champion = char.getChar(charaindex, "名字")
					second = "-"
					third = "-"
					sasql.query("update PKdasai set third ='"..char.getChar(charaindex,"账号").."' where session ="..session)
					char.WarpElderPosition(charaindex)
				elseif GetPlayers(true) == 2 then
					second = char.getChar(charaindex, "名字")
					sasql.query("update PKdasai set second ='"..char.getChar(charaindex,"账号").."' where session ="..session)
					Removefromlist(charaindex)
					champion = char.getChar(pklist[1][1], "名字")
					sasql.query("update PKdasai set champion ='"..char.getChar(pklist[1][1],"账号").."' where session ="..session)
					third = "-"
					char.WarpElderPosition(charaindex)
				elseif GetPlayers(true) == 3 then
					char.WarpElderPosition(charaindex)
					third = char.getChar(charaindex, "名字")
					sasql.query("update PKdasai set third ='"..char.getChar(charaindex,"账号").."' where session ="..session)
					Removefromlist(charaindex)
				elseif GetPlayers(true) == 4 then
					table.insert(finallist2,charaindex)
					char.setWorkInt(charaindex,"NPC临时1",os.time())
				end
			else
				table.insert(finallist,charaindex)
				char.setWorkInt(charaindex,"NPC临时1",os.time())
			end
		else
			if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
				char.WarpElderPosition(charaindex)
				Removefromlist(charaindex)
				char.talkToAllServer("P|P|[PK大赛]"..char.getChar(charaindex,"名字")..msg[math.random(4,#msg)],"")
				sasql.setVipPoint(charaindex,sasql.getVipPoint(charaindex)+2000)
				char.TalkToCli(charaindex, -1, "获得2000金币", 4);
				if GetPlayers(true) < 5 then
					last4 = true
				end
			else
				char.setWorkInt(charaindex,"NPC临时1",os.time())
			end
		end
	else
		if last2 then
			if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
				char.WarpElderPosition(charaindex)
				sasql.setPetPoint(charaindex,sasql.getPetPoint(charaindex)+5000)
				char.TalkToCli(charaindex, -1, "获得5000水晶", 4);
				char.talkToAllServer("P|P|[PK大赛]"..char.getChar(charaindex,"名字")..msg[math.random(4,#msg)],"")
			else
				Winner(charaindex)
				char.WarpElderPosition(charaindex)
				sasql.setPetPoint(charaindex,sasql.getPetPoint(charaindex)+8000)
				char.TalkToCli(charaindex, -1, "获得8000水晶", 4);
			end
		else
			if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
				char.WarpElderPosition(charaindex)
				char.talkToAllServer("P|P|[PK大赛]"..char.getChar(charaindex,"名字")..msg[math.random(#msg)],"")
				Removefromlist(charaindex)
				sasql.setPetPoint(charaindex,sasql.getPetPoint(charaindex)+200)
				char.TalkToCli(charaindex, -1, "获得200水晶", 4);
			else
				char.setWorkInt(charaindex,"NPC临时1",os.time())
			end
		end
	end
end

function Onlinecheck()
 	for i=1,#pklist do
 		for j=#pklist[i],1,-1 do
			if char.check(pklist[i][j]) ~= 1 or char.getInt(pklist[i][j], "地图号") ~= pkfloorid then
				table.remove(pklist[i],j)
				if pklist[i] == 0 then
					table.remove(pklist,i)
				end
			end
 		end
 	end
 end 

function Removefromlist(charaindex)
	for i=1,#pklist do
		for j=1,#pklist[i] do
			if pklist[i][j] == charaindex then
				table.remove(pklist[i],j)
				break
			end
		end
	end
end

function GetPlayers(check)
	local num = 1
	local remix = {}
	for i=0,char.getPlayerMaxNum()-1 do
		if char.check(i) == 1 and char.getInt(i, "地图号") == pkfloorid then
			table.insert(remix,i)
		end
	end
	if check then
		return #remix
	end
	if pktype == "总决赛" and #remix <= 4 then
		last4 = true
		if #remix == 2 then
			finallist = remix
		elseif #remix == 1 then
			finallist = {1}
			third = "-"
			second = "-"
			champion = char.getChar(charaindex, "名字")
			sasql.query("update PKdasai set champion ='"..char.getChar(charaindex,"账号").."' where session ="..session)
		end
		table.insert(pklist,remix)
	else
		if #remix > 0 then
			table.insert(pklist,{remix[1]})
			table.remove(remix,1)
			while #remix > 0 do
				if #pklist[num] < 2 then
					local rndnum =  math.random(#remix)
					table.insert(pklist[num],remix[rndnum])
					table.remove(remix,rndnum)
				end
				num = num+1
				if #remix > 0 then
					table.insert(pklist,{remix[1]})
					table.remove(remix,1)
				end
			end
		end
	end
end

function Loop(meindex)
	if start and math.floor((os.time()-countdown)/60) == char.getWorkInt(meindex,"NPC临时1") then
		char.talkToAllServer("P|P|[PK大赛]PK大赛"..pktype.."开始了，离开赛还剩".. 20-char.getWorkInt(meindex,"NPC临时1") .."分钟","")
		char.setWorkInt(meindex,"NPC临时1", char.getWorkInt(meindex,"NPC临时1")+1)
	elseif start and char.getWorkInt(meindex,"NPC临时1") == 20 then
		GetPlayers()
		if not last4 then
			for i=1,#pklist do
				if #pklist[i] == 2 then
					local player1,player2 = true,true
					if char.check(pklist[i][1]) ~= 1 or char.getInt(pklist[i][1], "地图号") ~= pkfloorid then
						player1 = false
						table.remove(pklist[i],1)
						char.newMessageToCli(pklist[i][2], -1, "因对方离赛，您本次对战轮空", 4)
					end
					if char.check(pklist[i][2]) ~= 1 or char.getInt(pklist[i][2], "地图号") ~= pkfloorid then
						player2 = false
						table.remove(pklist[i],2)
						char.newMessageToCli(pklist[i][1], -1, "因对方离赛，您本次对战轮空", 4)
					end
					if player1 and player2 then
						char.DischargeParty(pklist[i][1], 1)
						char.DischargeParty(pklist[i][2], 1)
						local battleindex = battle.CreateVsPlayer(pklist[i][1], pklist[i][2])
						battle.setLUAFunctionPointer(battleindex, "结束事件", "BattleFinish", "")
					elseif #pklist == 1 then
						if player1 then
							Winner(pklist[i][1])
						elseif player2 then
							Winner(pklist[i][2])
						else
							winner(nil)
						end
					end
				elseif #pklist[i] == 1 then
					char.newMessageToCli(pklist[i][1], -1, "您本次对战轮空", 4)
				end
			end
			PKcombo()
		end
		start,round = false,true
	elseif round then
		if #finallist == 0 then
			local num = 0
			if last4 then
				if Finalbattlecheck() == 0 and not finalcheck then
					PKcombo()
					local player1,player2,playerA,playerB = math.random(#pklist[1]),math.random(#pklist[1]),true,true
					while player1 == player2 do
						player2 = math.random(#pklist[1])
					end
					if char.check(pklist[1][player1]) ~= 1 or char.getInt(pklist[1][player1], "地图号") ~= pkfloorid then
						playerA = false
						char.newMessageToCli(pklist[1][player2], -1, "因对方离赛，您本轮获胜", 4)
						Removefromlist(pklist[1][player1])
						table.insert(finallist,pklist[1][player2])
					end
					if char.check(pklist[1][player2]) ~= 1 or char.getInt(pklist[1][player2], "地图号") ~= pkfloorid then
						playerB = false
						char.newMessageToCli(pklist[1][player1], -1, "因对方离赛，您本轮获胜", 4)
						Removefromlist(pklist[1][player2])
						table.insert(finallist,pklist[1][player1])
					end
					if playerA and playerB then
						char.DischargeParty(pklist[1][player1], 1)
						char.DischargeParty(pklist[1][player2], 1)
						local battleindex = battle.CreateVsPlayer(pklist[1][player1], pklist[1][player2])
						battle.setLUAFunctionPointer(battleindex, "结束事件", "BattleFinish", "")
					end
					local pklist2 = pklist[1]
					for i=#pklist2,1,-1 do
						if pklist2[i] == pklist[1][player1] or pklist2[i] == pklist[1][player2]then
							table.remove(pklist2,i)
						end
					end
					if #pklist2 == 2 then
						playerA,playerB = true,true
						if char.check(pklist2[1]) ~= 1 or char.getInt(pklist2[1], "地图号") ~= pkfloorid then
							playerA = false
							char.newMessageToCli(pklist2[2], -1, "因对方离赛，您本轮获胜", 4)
							Removefromlist(pklist2[1])
							table.insert(finallist,pklist2[2])
						end
						if char.check(pklist2[2]) ~= 1 or char.getInt(pklist2[2], "地图号") ~= pkfloorid then
							playerB = false
							char.newMessageToCli(pklist2[1], -1, "因对方离赛，您本轮获胜", 4)
							Removefromlist(pklist2[2])
							table.insert(finallist,pklist2[1])
						end
						if playerA and playerB then
							char.DischargeParty(pklist2[1], 1)
							char.DischargeParty(pklist2[2], 1)
							local battleindex = battle.CreateVsPlayer(pklist2[1], pklist2[2])
							battle.setLUAFunctionPointer(battleindex, "结束事件", "BattleFinish", "")
						end
					elseif #pklist2 == 1 then
						table.insert(finallist,pklist2[1])
					end
					finalcheck = true
				elseif GetPlayers(true) == 1 and finalcheck then
					finallist = pklist[1]
					champion = char.getChar(pklist[1][1], "名字")
					second = "-"
					third = "-"
					sasql.query("update PKdasai set champion ='"..char.getChar(pklist[1][1],"账号").."' where session ="..session)
				end
			else
				Onlinecheck()
				for i=1,#pklist do
					if #pklist[i] == 2 then
						PKcheck(i)
						if #pklist == 1 and #pklist[1] == 2 and pktype == "资格赛" then
							last2 = true
						end
					elseif #pklist[i] < 2 then
						num = num+1
					end
				end
				if num == #pklist then
					PKcombo()
				end
			end
		else
			if champion and second and third then
				char.talkToAllServer("P|P|[PK大赛]第"..session.."届PK总决赛季军是"..third,"")
				char.talkToAllServer("P|P|[PK大赛]第"..session.."届PK总决赛亚军是"..second,"")
				char.talkToAllServer("P|P|[PK大赛]全体起立！第"..session.."届PK总决赛冠军是"..champion,"")
				QXPKDS()
			else
				local player1,player2 = true,true
				if not champion and not second then
					if char.check(finallist[1]) ~= 1 or char.getInt(finallist[1], "地图号") ~= pkfloorid then
						player1 = false
						char.newMessageToCli(finallist[2], -1, "因对方离赛，您本轮获胜", 4)
						Removefromfinallist(finallist[1])
					end
					if char.check(finallist[2]) ~= 1 or char.getInt(finallist[2], "地图号") ~= pkfloorid then
						player2 = false
						char.newMessageToCli(finallist[1], -1, "因对方离赛，您本轮获胜", 4)
						Removefromfinallist(finallist[2])
					end
					if player1 and player2 then
						if os.time() - char.getWorkInt(finallist[1],"NPC临时1") >= 180 and os.time() - char.getWorkInt(finallist[2],"NPC临时1") >= 180
						and char.getWorkInt(finallist[1], "战斗") == 0 and char.getWorkInt(finallist[2], "战斗") == 0 then
							char.DischargeParty(finallist[1], 1)
							char.DischargeParty(finallist[2], 1)
							local battleindex = battle.CreateVsPlayer(finallist[1], finallist[2])
							battle.setLUAFunctionPointer(battleindex, "结束事件", "BattleFinish", "")
						end
					end
				end
				if not third then
					player1,player2 = true,true
					if char.check(finallist2[1]) ~= 1 or char.getInt(finallist2[1], "地图号") ~= pkfloorid then
						player1 = false
						char.newMessageToCli(finallist2[2], -1, "因对方离赛，您本轮获胜", 4)
						Removefromfinallist2(finallist2[1])
					end
					if char.check(finallist2[2]) ~= 1 or char.getInt(finallist2[2], "地图号") ~= pkfloorid then
						player2 = false
						char.newMessageToCli(finallist2[1], -1, "因对方离赛，您本轮获胜", 4)
						Removefromfinallist2(finallist2[2])
					end
					if player1 and player2 then
						if os.time() - char.getWorkInt(finallist2[1],"NPC临时1") >= 180 and os.time() - char.getWorkInt(finallist2[2],"NPC临时1") >= 180
						and char.getWorkInt(finallist2[1], "战斗") == 0 and char.getWorkInt(finallist2[2], "战斗") == 0 then
							char.DischargeParty(finallist2[1], 1)
							char.DischargeParty(finallist2[2], 1)
							local battleindex = battle.CreateVsPlayer(finallist2[1], finallist2[2])
							battle.setLUAFunctionPointer(battleindex, "结束事件", "BattleFinish", "")
						end
					end
				end
			end
		end
	end
end

function Removefromfinallist(charaindex)
	for i=1,#finallist do
		if charaindex == finallist[i] then
			table.remove(finallist,i)
		end
	end
	champion = char.getChar(finallist[1], "名字")
	second = "-"
	sasql.query("update PKdasai set champion ='"..char.getChar(finallist[1],"账号").."' where session ="..session)
end

function Removefromfinallist2(charaindex)
	for i=1,#finallist2 do
		if charaindex == finallist2[i] then
			table.remove(finallist2,i)
		end
	end
	third = char.getChar(finallist[1], "名字")
	sasql.query("update PKdasai set third ='"..char.getChar(finallist[1],"账号").."' where session ="..session)
end

function Finalbattlecheck()
	local num = #pklist[1]
	for i=1,#pklist[1] do
		if char.getWorkInt(pklist[1][i], "战斗") == 0 and os.time() - char.getWorkInt(pklist[1][i],"NPC临时1") >= 180 then
			num = num-1
		end
	end
	return num
end

function Winner(charaindex)
	if #pklist == 1 then
		local player1,player2 = false,false
		if charaindex then
			if char.check(pklist[1][1]) == 1 and charaindex and charaindex == pklist[1][1] then
				char.talkToAllServer("P|P|[PK大赛]第"..session.."届资格赛冠军是"..char.getChar(pklist[1][1],"名字").."，恭喜获得奖金8000水晶","")
				player1 = true
				if  char.check(pklist[1][2]) == 1 then
					char.talkToAllServer("P|P|[PK大赛]第"..session.."届资格赛亚军是"..char.getChar(pklist[1][2],"名字").."，恭喜获得奖金5000水晶","")
					player2 = true
				end
			elseif  char.check(pklist[1][2]) == 1 and charaindex and charaindex == pklist[1][2] then
				char.talkToAllServer("P|P|[PK大赛]第"..session.."届资格赛冠军是"..char.getChar(pklist[1][2],"名字").."，恭喜获得奖金8000水晶","")
				player2 = true
				if char.check(pklist[1][1]) == 1 then
					char.talkToAllServer("P|P|[PK大赛]第"..session.."届资格赛亚军是"..char.getChar(pklist[1][1],"名字").."，恭喜获得奖金5000水晶","")
					player1 = true
				end
			end
			sasql.query("select * from PKdasai where session="..session)
			sasql.free_result()
			sasql.store_result()
			sasql.fetch_row()
			for i=2,30,2 do
				if sasql.data(i) == nil or sasql.data(i) == "" then
					if player1 then
						sasql.query("update PKdasai set account".. i/2 .." = '"..char.getChar(pklist[1][1],"账号").."',name".. i/2 .." ='"..char.getChar(pklist[1][1],"名字").."' where session ="..session)
						if player2 then
							sasql.query("update PKdasai set account".. i/2+1 .." ='"..char.getChar(pklist[1][2],"账号").."',name".. i/2+1 .." ='"..char.getChar(pklist[1][2],"名字").."' where session ="..session)
						end
						break
					end
				end
			end
		end
		start,round = false,false
		pklist = {}
	end
end

function PKcheck(i)
	local player1,player2 = true,true
	if char.check(pklist[i][1]) ~= 1 or char.getInt(pklist[i][1], "地图号") ~= pkfloorid then
		player1 = false
		table.remove(pklist[i],1)
		char.newMessageToCli(pklist[i][2], -1, "因对方离赛，您本次对战轮空", 4)
	end
	if char.check(pklist[i][2]) ~= 1 or char.getInt(pklist[i][2], "地图号") ~= pkfloorid then
		player2 = false
		table.remove(pklist[i],2)
		char.newMessageToCli(pklist[i][1], -1, "因对方离赛，您本次对战轮空", 4)
	end
	if player1 and player2 then
		if os.time() - char.getWorkInt(pklist[i][1],"NPC临时1") >= 180 and os.time() - char.getWorkInt(pklist[i][2],"NPC临时1") >= 180
			and char.getWorkInt(pklist[i][1], "战斗") == 0 and char.getWorkInt(pklist[i][2], "战斗") == 0 then
			char.DischargeParty(pklist[i][1], 1)
			char.DischargeParty(pklist[i][2], 1)
			local battleindex = battle.CreateVsPlayer(pklist[i][1], pklist[i][2])
			battle.setLUAFunctionPointer(battleindex, "结束事件", "BattleFinish", "")
		end
	elseif #pklist == 1 and #pklist[i] == 1 then
		if player1 then
			Winner(pklist[i][1])
		elseif player2 then
			Winner(pklist[i][2])
		else
			winner(nil)
		end
	end
end

function PKcombo()
	local num = 1
	local remix = {pklist[num]}
	table.remove(pklist,num)
	while #pklist > 0 do
		if #remix[num] < 3 then
			local rndnum =  math.random(#pklist)
			for i=1,#pklist[rndnum] do
				table.insert(remix[num],pklist[rndnum][i])
			end
			table.remove(pklist,rndnum)
			num = num+1
			if #pklist > 0 then
				table.insert(remix,pklist[1])
				table.remove(pklist,1)
			end
		end
	end
	pklist = remix
end

function PKDS()
	sasql.query("select champion,session from PKdasai order by session desc")
	sasql.free_result()
	sasql.store_result()
	sasql.fetch_row()
	session = sasql.data(2)
	if sasql.data(1) ~= nil and sasql.data(1) ~= "" then
		session = session+1
		sasql.query("insert into PKdasai set session ="..session)
	end
	start,last4,last2,countdown,pktype = true,false,false,os.time(),"资格赛"
	char.talkToAllServer("P|P|[PK大赛]第"..session.."届PK大赛资格赛开始了","")
	char.setWorkInt(npcindex,"NPC临时1", 1)
	ppl,pklist,finallist= {},{},{}
end

function JSPK()
	sasql.query("select champion,session from PKdasai order by session desc")
	sasql.free_result()
	sasql.store_result()
	sasql.fetch_row()
	session = sasql.data(2)
	if sasql.data(1) == nil or sasql.data(1) == "" then
		char.talkToAllServer("P|P|[PK大赛]第"..session.."届PK大赛总决赛开始了","")
		char.setWorkInt(npcindex,"NPC临时1", 1)
		ppl,pklist,finallist,finallist2 = {},{},{},{}
		start,finalcheck,last4,countdown,champion,second,third,pktype = true,false,false,os.time(),nil,nil,nil,"总决赛"
	end
end

function QXPKDS()
	start,round = false,false
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
	char.setInt(npcindex, "循环事件时间", 3000);
end

function data()
	reward = {29515,29513,29154}
	msg = {"在PK比赛中失利退出PK赛场。得到200水晶参与奖励，希望下次多多练习PK技术。",
			"身受重伤，只能灰溜溜的领取安慰奖200水晶后离开",
			"与对手经过多回合的切磋，未能拿下比赛，只获得了200水晶安慰奖",
			"因没吃饱饭，导致本场PK失利被飞出PK赛场，望其注意饮食。耗子尾之",
			"本想胜局已定，谁知对手在关键时刻扭转局势，只能含泪离开PK赛场",
			"因为PK技术太菜，被对手按在地上使劲摩擦致气绝身亡",
			"因PK失败被对手羞辱，无地自容！看着桌上的【葵花宝典】，默默地举起了刀",
			"无奈的退出了PK场，临走前说：不是因为我技术菜，而是对方长得太丑了。",
			"因为被飞出比赛场，受尽众人嘲讽然不忘鼓励自己：你们现在对我爱搭不理，下轮让你们高攀不起"}
end

function main()
	data()
	start,round,pkfloorid = false,false,12345
	--if config.getGameservername() == "娱乐互动线" then
		Create("自动PK大赛活动", 26785, 2005, 14, 8, 6)
	--end
	magic.addLUAListFunction("kaishipk", "PKDS", "", 3, "PK测试专用命令")
	magic.addLUAListFunction("quxiaopk", "QXPKDS", "", 3, "PK测试专用命令")
	magic.addLUAListFunction("juesaipk", "JSPK", "", 3, "PK测试专用命令")
	data()
end