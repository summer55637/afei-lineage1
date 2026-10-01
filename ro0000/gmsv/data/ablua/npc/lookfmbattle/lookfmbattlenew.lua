function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
	--[[
		token = "4                  " .. char.getChar(meindex, "名字") .. "\n\n"
					.. "请问你需要什么服务??"
					.. "\n\n                  我要到庄园去"
					.. "\n\n                  我要观看族战"
		lssproto.windows(talkerindex, "选择框", "取消", 1, char.getWorkInt( meindex, "对象"), token)
	]]
		WindowTalked(meindex, talkerindex,1,0,1)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--char.TalkToCli(talkerindex, -1, "seqno=" .. seqno .. ",select=" .. select, "随机色")
	fmfloorid = {1042,2032,3032,4032,12345}
	floorname = {"",""}
	floorname[1042] = "萨庄族战"
	floorname[2032] = "渔庄族战"
	floorname[3032] = "加庄族战"
	floorname[4032] = "卡庄族战"
	floorname[12345] = "乱舞PK现场"
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 1 then
			if select == 0 then
					token = char.getChar(meindex, "名字") .. "|我是族战观战师\n提供身临其境的观战服务\n下面请选择您需要观看的战斗吧|3|我要观看族战|查看族战排程|查看场内人数"
					lssproto.windows(talkerindex, "新选择框", 8, 2, char.getWorkInt( meindex, "对象"), token)
			end
		elseif seqno == 2 then
			if select == 0 or select == 1 then
				num = other.atoi(data)
				if num == 1 then
					for i=1,#battleteam1 do
						battleteam1[i] = nil
					end
					for i=1,#battleteam2 do
						battleteam2[i] = nil
					end
					ii = 0
					for i = 0,500 do
						if battle.checkindex(i) == 1 then
							if battle.getBattleFloor(i) == fmfloorid[1] or battle.getBattleFloor(i) == fmfloorid[2] or battle.getBattleFloor(i) == fmfloorid[3] or battle.getBattleFloor(i) == fmfloorid[4] or battle.getBattleFloor(i) == fmfloorid[5] then
								if battle.getType(i) == 2 then
									ii = ii + 1
									for jj=0,9 do
										if char.check(battle.getCharOne(i,jj,0)) == 1 then
											battleteam1[ii] = battle.getCharOne(i,jj,0)
											break
										end
									end
									for jj=0,9 do
										if char.check(battle.getCharOne(i,jj,1)) == 1 then
											battleteam2[ii] = battle.getCharOne(i,jj,1)
											break
										end
									end
								end
							end
						end
					end
					token = ""
					if ii > 0 then
						for i = 1,math.min(#battleteam1,15) do
							token = token .. string.format("ID:%-4d   %s    %16s Vs %s",battleteam1[i],floorname[char.getInt(battleteam1[i],"地图号")],char.getChar(battleteam1[i],"名字"),char.getChar(battleteam2[i],"名字")) .. "\n"
						end
						if #battleteam1 < 15 then
							for i=1,15 - #battleteam1 do
								token = token .. "\n"
							end
						end
						token = token .. "请输入您要观战的战斗编号："
						if #battleteam1 <= 15 then
							lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
						else
							lssproto.windows(talkerindex, "宽输入框", 44, 1001, char.getWorkInt( meindex, "对象"), token)
						end
					else
						token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定族战或比赛已经开始了再点我吧～\n\n    PS：族战排程请查看第二个功能\n        开战时间为对决时间后的15分钟哟～"
						lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					end
				elseif num == 2 then
					token = family.ShowFamilyPkList(talkerindex)
					lssproto.windows(talkerindex, "宽对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				elseif num == 3 then
					token = "3\n\n"
								.. "我是族战观战师，提供身临其境的观战服务。\n下面请选择您需要查看族战人数的庄园："
								.. "\n【萨庄族战】"
								.. "\n【渔庄族战】"
								.. "\n【加庄族战】"
								.. "\n【卡庄族战】"
					lssproto.windows(talkerindex, "选择框", 8, 3, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif seqno == 3 then
			if select == 0 or select == 1 then
				num = other.atoi(data)
				if num < 1 then
					num = 1
				end
				if num > 5 then
					num = 5
				end
				if num >= 1 and num <= 4 then
					token = family.ShowFamilyPkNum(fmfloorid[num],num)
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n\n"
						  .."混乱庄园族战目前人数："
					local hunluannum = 0
					for i = 0, char.getPlayerMaxNum()-1 do
						if char.check(i) == 1 then
							if char.getInt(i, "地图号") == 5032 then
								hunluannum = hunluannum + 1
							end
						end
					end
					token = token .. hunluannum .. " 人。"
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
				if battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[1] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[2] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[3] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[4] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[5] then 
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，您输入的战斗编号错误或战斗已经结束。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					return
				end
				toindex = battleno
				if char.check(toindex) == 1 then
					battle.WatchEntry(talkerindex, toindex)
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定族战或比赛已经开始了再点我吧～\n\n    PS：渔村村长家(22.20)的家族留言板上\n        可以看到家族对战时间表哦！亲～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 16 then
				if seqno == 1001 then
					return
				end
				for i=1,#battleteam1 do
					battleteam1[i] = nil
				end
				for i=1,#battleteam2 do
					battleteam2[i] = nil
				end
				ii = 0
				for i = 0,500 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[1] or battle.getBattleFloor(i) == fmfloorid[2] or battle.getBattleFloor(i) == fmfloorid[3] or battle.getBattleFloor(i) == fmfloorid[4] or battle.getBattleFloor(i) == fmfloorid[5] then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										battleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										battleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1002) * 15 + 1 <= #battleteam1 then
					for i = (seqno - 1002) * 15 + 1,math.min(#battleteam1,(seqno - 1002) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",battleteam1[i],floorname[char.getInt(battleteam1[i],"地图号")],char.getChar(battleteam1[i],"名字"),char.getChar(battleteam2[i],"名字")) .. "\n"
					end
					if #battleteam1 < (seqno - 1002) * 15 + 15 then
						for i = 1,(seqno - 1002) * 15 + 15 - #battleteam1 do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					if #battleteam1 <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 > 0 then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 == 0 then
						lssproto.windows(talkerindex, "宽输入框", 44, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定族战或比赛已经开始了再点我吧～\n\n    PS：渔村村长家(22.20)的家族留言板上\n        可以看到家族对战时间表哦！亲～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 32 then
				if seqno == 1050 then
					return
				end
				for i=1,#battleteam1 do
					battleteam1[i] = nil
				end
				for i=1,#battleteam2 do
					battleteam2[i] = nil
				end
				ii = 0
				for i = 0,500 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[1] or battle.getBattleFloor(i) == fmfloorid[2] or battle.getBattleFloor(i) == fmfloorid[3] or battle.getBattleFloor(i) == fmfloorid[4] or battle.getBattleFloor(i) == fmfloorid[5] then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										battleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										battleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1001 + 1) * 15 + 1 >= #battleteam1 then
					for i = (seqno - 1001 + 1) * 15 + 1,math.min(#battleteam1,(seqno - 1001 + 1) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",battleteam1[i],floorname[char.getInt(battleteam1[i],"地图号")],char.getChar(battleteam1[i],"名字"),char.getChar(battleteam2[i],"名字")) .. "\n"
					end
					if #battleteam1 < (seqno - 1001 + 1) * 15 + 15 then
						for i = 1,(seqno - 1001 + 1) * 15 + 15 - #battleteam1 do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					seqno = seqno + 1
					if #battleteam1 <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 >= #battleteam1 then
						lssproto.windows(talkerindex, "宽输入框", 28, seqno, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 < #battleteam1 then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，目前场内还没有人在对决哦～\n    请确定族战或比赛已经开始了再点我吧～\n\n    PS：渔村村长家(22.20)的家族留言板上\n        可以看到家族对战时间表哦！亲～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	npc.CreateNpc("", 109013, floor, x, y, dir)
	npc.CreateNpc("", 32594, floor, x+3, y-3, dir)
end

function data()
	fmpointwarp = {{1040, 47, 25}
								,{2030, 59, 44}
								,{3030, 61, 42}
								,{4030, 33, 19}
								--,{5030, 57, 30}
								}
	battleteam1 = {-1,-1}
	battleteam2 = {-1,-1}
end
function main()
	if config.getGameservername() == "娱乐互动线" then
	Create("【族战观战师】", 16130, 2005, 5, 12, 6)
	end
	data()
end
