function ShowReadMe( meindex, talkerindex, page)
		token = TM_ReadMe[page+1]
		
		if maxpage == 0 then
			button = 8
		elseif page == 0 and page < maxpage then
			button = 40
		elseif page > 0 and page < maxpage then
			button = 56
		elseif page == maxpage then
			button = 24
		end
		lssproto.windows(talkerindex, "对话框", button, 1100 + page, char.getWorkInt( meindex, "对象"), token)
end

function Loop(meindex)
	local tempfmtime1 = family.ShowFamilyPkTime(2)
	local tempfmtime2 = family.ShowFamilyPkTime(4)
	local temptime
	if tonumber(os.date("%m",os.time())) < 10 then
		temptime = "0" .. tonumber(os.date("%m",os.time()))
	else
		temptime = "" .. tonumber(os.date("%m",os.time()))
	end
	
	if tonumber(os.date("%d",os.time())) < 10 then
		temptime = temptime .. "0" .. tonumber(os.date("%d",os.time()))
	else
		temptime = temptime .. tonumber(os.date("%d",os.time()))
	end
	--if Hour ==  tonumber(os.date("%H", os.time())) then
	if (tonumber(os.date("%w", os.time())) ~= 6 and (tempfmtime1 == temptime or tempfmtime2 == temptime) and (tonumber(os.date("%H", os.time())) == 10 or tonumber(os.date("%H", os.time())) == 15 or tonumber(os.date("%H", os.time())) == 20)) or gmstart > 0 then
		local fmtype = 0
		if tempfmtime1 == temptime or gmstart == 1 then
			fmtype = 1
		end
		
		if fmtype == 1 then
			if start[fmtype] == 0 then
				shuanum[fmtype] = 0
				start[fmtype] = 1
			end
			
			if num[fmtype] < 2 and shuanum[fmtype] < 1 then
				for i = 1, 10 do
					rand = math.random(table.getn(location[fmtype]))
					Create(npcdata[1], npcdata[2], enemyfloorid[fmtype], location[fmtype][rand][1], location[fmtype][rand][2], 0,2 )
				end
				shuanum[fmtype] = 1
			end
			local zhuangname = {"渔庄","卡庄"}
			local zhuangname2 = {"渔村","卡村"}
			if num[fmtype] > 0 then
				char.talkToServer(-1, "[先遣部队]由于今日" .. zhuangname[fmtype] .. "族战，黑暗精灵王会在[10.15.20点]派遣三波先遣部队进入" .. zhuangname2[fmtype] .. "庄园进行骚扰，各路英豪赶紧前去支援吧，目前剩余未击杀先遣部队数量[" .. num[fmtype] .. "]，击杀有掉落14-18级实用装备以及稀有物品哦。", "随机色")
			end
		end
		
		if tempfmtime2 == temptime or gmstart == 2 then
			fmtype = 2
		end
		
		if fmtype == 2 then
			if start[fmtype] == 0 then
				shuanum[fmtype] = 0
				start[fmtype] = 1
			end
			
			if num[fmtype] < 2 and shuanum[fmtype] < 1 then
				for i = 1, 10 do
					rand = math.random(table.getn(location[fmtype]))
					Create(npcdata[1], npcdata[2], enemyfloorid[fmtype], location[fmtype][rand][1], location[fmtype][rand][2], 0,2 )
				end
				shuanum[fmtype] = 1
			end
			local zhuangname = {"渔庄","卡庄"}
			local zhuangname2 = {"渔村","卡村"}
			if num[fmtype] > 0 then
				char.talkToServer(-1, "[先遣部队]由于今日" .. zhuangname[fmtype] .. "族战，黑暗精灵王会在[10.15.20点]派遣三波先遣部队进入" .. zhuangname2[fmtype] .. "庄园进行骚扰，各路英豪赶紧前去支援吧，目前剩余未击杀先遣部队数量[" .. num[fmtype] .. "]，击杀有掉落14-18级实用装备以及稀有物品哦。", "随机色")
			end
		end
	else
		start = {0,0}
	end
end

function EnemyLoop(meindex)
	local fmtype = 0
	if char.getInt(meindex,"地图号") == 2030 then
		fmtype = 1
	else
		fmtype = 2
	end
	if start[fmtype] == 1 then
		if char.getWorkInt(meindex,"NPC临时2") == -1 then
			if other.time() - char.getWorkInt(meindex,"NPC临时1") > 300 then
				char.setWorkInt(meindex,"NPC临时1",other.time())
				rand = math.random(table.getn(location[fmtype]))
				char.AllWarpToSpecificPoint(meindex, enemyfloorid[fmtype], location[fmtype][rand][1], location[fmtype][rand][2])
			else
				char.RandRandWalk(meindex)
			end
		end
	else
		if char.getWorkInt(meindex,"NPC临时2") == -1 then
			npc.DelNpc(meindex)
			num[fmtype] = num[fmtype] - 1
			if num[fmtype] <= 0 then
				num[fmtype] = 0
				start[fmtype] = 0
				if gmstart == fmtype then
					gmstart = 0
				end
			end
		end
	end
end

--NPC重叠事件(NPC索引， 玩家索引)
function Overlap(meindex, toindex)
	--print("\nmeindex=" .. meindex .. ",toindex=" .. char.getInt(toindex,"类型") .."\n")
	if char.getInt(toindex,"类型") == 1 and char.getWorkInt(toindex,"组队") == 0 and char.getWorkInt(meindex,"NPC临时2") == -1 then
		--战斗宠物数组，设置战斗的宠物ID,最大10只
		local mac2 = char.getWorkChar(toindex,"MAC")
		local maxplayer = char.getPlayerMaxNum() - 1
		local zhaotype = 0
		for i=0,maxplayer do
			if char.check(i) == 1 and i ~= toindex then
				if char.getWorkChar(i,"MAC") == mac2 and (char.getInt(i,"地图号") == 2030 or char.getInt(i,"地图号") == 4030) and char.getWorkInt(i,"战斗索引") > -1 then
					zhaotype = 1
					break
				end
			end
		end
		if zhaotype == 0 then
			char.setWorkInt(toindex,"NPC临时2",other.time() + 1)
			enemytable = {4508,math.random(4509,4512),-1,-1,-1,-1,-1,-1,-1,-1}
			local TM_battleindex = battle.CreateVsEnemy(toindex, meindex, enemytable)
			for i=0,9 do
				TempIndex = battle.getCharOne(TM_battleindex, i, 1)
				if char.check(TempIndex) == 1 then
					TypeOne = math.random(1,4)
					TypeTwo = math.random(1,4)
					Type = {0,0,0,0}
					if TypeOne+2 == TypeTwo or TypeOne-2 == TypeTwo then
						if math.random(1,2) == 1 then
							TypeTwo = TypeOne+1
						else
							TypeTwo = TypeOne-1
						end
						if TypeTwo == 0 then
							TypeTwo = 4
						elseif TypeTwo == 5 then
							TypeTwo = 1
						end
					end
					if TypeOne == TypeTwo then
						Type[TypeOne] = 100									
					else
						Type[TypeOne] = math.random(1,2) * 10
						Type[TypeTwo] = 100 - Type[TypeOne]
					end
					char.setInt(TempIndex,"地",Type[1])
					char.setInt(TempIndex,"水",Type[2])
					char.setInt(TempIndex,"火",Type[3])
					char.setInt(TempIndex,"风",Type[4])
					--char.TalkToCli(toindex, -1, "[" .. char.getChar(TempIndex,"名字") .. "]地：" .. char.getInt(TempIndex,"地") .. ",水：" .. char.getInt(TempIndex,"水") .. ",火：" .. char.getInt(TempIndex,"火") .. ",风：" .. char.getInt(TempIndex,"风"), "随机色")
				end
			end
			char.setWorkInt(meindex,"NPC临时2",TM_battleindex)
			char.TalkToCli(toindex, -1, "[温馨提示]先遣骑兵和灰熊的属性为随机，请在战斗中摸索，击溃他们吧！勇士！", "随机色")
		else
			char.TalkToCli(toindex, -1, "[温馨提示]由于您已经在该地图开始了一场战斗，无法进入战斗第二场战斗，请退出一人后开始挑战。", "随机色")
		end
	else
		if char.getWorkInt(toindex,"组队") then
			char.TalkToCli(toindex, -1, "[温馨提示]由于您不是单人状态，无法进入战斗，请解散组队后单挑先遣部队。", "随机色")
		end
	end
end

--NPC战斗结束事件(NPC索引， 战斗索引，赢败)
function BattleOver(meindex, battleindex, iswin)
		--当NPC输了
		if iswin == 1 then
			local fmtype = 0
			if char.getInt(meindex,"地图号") == 2030 then
				fmtype = 1
			else
				fmtype = 2
			end
			for i=0, 4 do
				local charaindex = battle.getCharOne(battleindex, i, 0)
				if char.check(charaindex) == 1 then
					if char.getWorkInt(charaindex,"NPC临时2") < other.time() then
						local RandItem = math.random(1,100)
						local GiveItem = ""
						local ItemNum = table.getn(GiveItemList)
						for i = 1,ItemNum do
							if RandItem <= GiveItemListRand[i] then
								GiveItem = GiveItemList[i]
								break
							end	
						end
						local TM_ItemIndex = npc.AddRandItem(charaindex, GiveItem)
						if TM_ItemIndex > -1 then
							token = "[守庄勇士]恭喜玩家[" .. char.getChar(charaindex, "名字") .. "]成功击退一名先遣骑兵，得到战利品〈 " .. item.getChar(TM_ItemIndex,"显示名") .. " 〉"
							local magicid = item.getInt(TM_ItemIndex,"精灵")
							if magicid > 0 then
								token = token .. "[" .. magic.getChar(magicid,"名字") .. "]"
							end
							if num[fmtype] - 1 > 0 then
								token = token .. "，目前剩余[" .. num[fmtype] - 1 .. "]个先遣骑兵。"
							else
								token = token .. "，本轮先遣骑兵已被全部击退。"
							end
							char.talkToServer(-1,token, "随机色")
						else
							char.TalkToCli(charaindex, -1, "[温馨提示]您身上的道具已满，建议您空一栏哦！", "随机色")
						end
						
						if math.random(101,200) <= 125 and npc.Free(meindex, charaindex, "ENDEV=222") ~= 1 then
							TM_ItemIndex = npc.AddRandItem(charaindex, "23601,23601")
							if TM_ItemIndex > -1 then
								char.TalkToCli(charaindex, -1, "[温馨提示]恭喜您获得封印原石", "随机色")
							end
						end
					else
						char.TalkToCli(charaindex, -1, "[温馨提示]您战斗速度过快，无法获得奖励哦。", "随机色")
					end
				end
			end
			
			num[fmtype] = num[fmtype] - 1
			if num[fmtype] <= 0 then
				num[fmtype] = 0
				start[fmtype] = 2
				if gmstart == fmtype then
					gmstart = 0
				end
			end
			npc.DelNpc(meindex)
		else
			char.setWorkInt(meindex,"NPC临时2",-1)
		end
end


function Create(name, metamo, floorid, x, y, id,npctype)
	index = npc.CreateNpc(name, metamo, floorid, x, y, 0)
	if char.check(index) == 1 then
		if npctype == 1 then
			char.setFunctionPointer(index, "循环事件", "Loop", "")
			char.setInt(index, "循环事件时间", 60000)
		elseif npctype == 2 then
			if floorid == 2030 then
				num[1] = num[1] + 1
			else
				num[2] = num[2] + 1
			end
			char.setFunctionPointer(index, "循环事件", "EnemyLoop", "")
			char.setFunctionPointer(index, "重叠事件", "Overlap", "")
			char.setFunctionPointer(index, "战后事件", "BattleOver", "")
			char.setWorkInt(index,"NPC临时2",-1)
			char.setWorkInt(index,"NPC临时1",other.time())
			char.ToAroundChar(index)
		end
	end
end

function zyenenmy(charaindex, data)
	local TM_data = other.atoi(data)
	if TM_data == 0 then
		gmstart = 0
		char.TalkToCli(charaindex, -1, "庄园怪物已经关闭", "青色")
	elseif TM_data == 1 then
		gmstart = 1
		char.TalkToCli(charaindex, -1, "1号庄园怪物已经开启", "青色")
	elseif TM_data == 2 then
		gmstart = 2
		char.TalkToCli(charaindex, -1, "2号庄园怪物已经开启", "青色")
	end
end

function data()
	enemyfloorid = {2030,4030}
	location = {{{39,45},{52,39},{39,53},{56,50},{49,53},{53,31},{55,22},{61,37},{55,55},{34,54}},
				{{39,34},{44,30},{49,34},{45,39},{41,32},{40,42},{30,56},{17,38},{25,36},{31,20}}}

	npcdata = {"黑暗势力先遣部队", 105092
						}

	enemytable = {-1, -1, -1, -1, -1, -1, -1, -1, -1, -1}
	
	GiveItemListRand = {5,20,40,65,90,100}
	GiveItemList = {"14691-14720,14991-15020,16491-16520,17151-17200,14391-14420","14421-14450,14721-14750,15021-15050,16521-16550,17201-17250","14451-14480,14751-14780,15051-15080,16551-16580,17251-17300","14481-14510,14781-14810,15081-15110,16581-16610,17301-17350","14511-14540,14811-14840,15111-15140,16611-16640,17351-17400","22050,22050,22050,22050,22050,22051,23800,23800,23800,23800"}
end

function main()
	--[[start = {0,0}
	num = {0,0}
	shuanum = {0,0}
	gmstart = 0
	data()
	if config.getGameservername() == "娱乐互动线" then
		Create("庄园怪物",60113,777,31,31,0,1)
	end
	magic.addLUAListFunction("zyenenmy", "zyenenmy", "", 3, "[zyenenmy 0/1/2]")
	--]]
end



