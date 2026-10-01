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
	fmfloorid = {1042,2032,3032,4032,5032}
	floorname = {"",""}
	floorname[1042] = "萨庄族战"
	floorname[2032] = "渔庄族战"
	floorname[3032] = "加庄族战"
	floorname[4032] = "卡庄族战"
	floorname[5032] = "混乱族战"
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 1 then
			if select == 0 then
					token = char.getChar(meindex, "名字") .. "|我是族战观战师\n提供身临其境的观战服务\n下面请选择您需要观看的战斗吧|2|我要观看族战|查看场内人数"
					lssproto.windows(talkerindex, "新选择框", 8, 2, char.getWorkInt( meindex, "对象"), token)
			end
		elseif seqno == 2 then
			if select == 0 or select == 1 then
				num = other.atoi(data)
				if num == 1 then
					token = char.getChar(meindex, "名字") .. "|我是族战观战师\n提供身临其境的观战服务|4|萨庄族战|渔庄族战|加庄族战|卡庄族战"
					lssproto.windows(talkerindex, "新选择框", 8, 5, char.getWorkInt( meindex, "对象"), token)
			--	elseif num == 2 then
			--		token = family.ShowFamilyPkList(talkerindex)
			--		lssproto.windows(talkerindex, "宽对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				elseif num == 2 then
					token = char.getChar(meindex, "名字") .. "|我是族战观战师\n提供身临其境的观战服务\n下面请选择您需要查看族战人数的庄园|4|萨庄族战|渔庄族战|加庄族战|卡庄族战"
					lssproto.windows(talkerindex, "新选择框", 8, 3, char.getWorkInt( meindex, "对象"), token)
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
		elseif seqno == 5 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > 4 then
				return
			end
			for i = 0,config.getBattleNum() do
				if battle.checkindex(i) == 1 then
					if battle.getBattleFloor(i) == fmfloorid[num] then
						token = char.getChar(meindex, "名字")
						for j = 0, 4 do
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

						lssproto.windows(talkerindex, 1022, "确定|取消|下一页", 1000 * num + i, char.getWorkInt( meindex, "对象"), token)
						return
					end
				end
			end
			token = "             " .. char.getChar(meindex, "名字") .. "\n\n很遗憾，目前场内还没有人在对决哦～\n请确定族战或比赛已经开始了再点我吧～\n\nPS：族战排程请查看第二个功能\n开战时间为对决时间后的15分钟哟～"
			lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
		elseif seqno >= 1000 and seqno <= 4999 then
			battleindex = seqno % 1000
			if select == 1 then
				if battle.checkindex(battleindex) == 1 then
					if battle.getBattleFloor(battleindex) == fmfloorid[math.floor(seqno / 1000)] then
						for i = 0, 4 do
							local index1 = battle.getCharOne(battleindex, i, 0)
							if char.check(index1) == 1 then
								battle.WatchEntry(talkerindex, index1)
								return
							end
						end
					end
				end
				token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n    该场PK比赛已结事～"
				lssproto.windows(talkerindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
			elseif select == 16 then
				for i = battleindex - 1, 0, -1 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[math.floor(seqno / 1000)] then
							token = char.getChar(meindex, "名字")
							for j = 0, 4 do
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

							lssproto.windows(talkerindex, 1022, "确定|取消|下一页|上一页", math.floor(seqno / 1000) * 1000 + i, char.getWorkInt( meindex, "对象"), token)
							return
						end
					end
				end
				token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n    该场PK比赛已结事～"
				lssproto.windows(talkerindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
			elseif select == 32 then
				for i = battleindex + 1, config.getBattleNum() do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[math.floor(seqno / 1000)] then
							token = char.getChar(meindex, "名字")
							for j = 0, 4 do
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

							lssproto.windows(talkerindex, 1022, "确定|取消|下一页|上一页", math.floor(seqno / 1000) * 1000 + i, char.getWorkInt( meindex, "对象"), token)
							return
						end
					end
				end
				token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n    该场PK比赛已结事～"
				lssproto.windows(talkerindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
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
	    Create("族战观战师 ", 16130, 2005, 9, 12, 6)
	end
	data()
end
