function getFloorPlayer()
	local num = 0
	for i=1,#palyerindex do
		if char.check(palyerindex[i]) == 1 and char.getInt(palyerindex[i], "地图号") == map then
			num = num + 1
		end
	end
	return num
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		--[[if other.atoi(os.date("%w",os.time())) == 0 and char.getWorkInt(meindex, "NPC临时1") == 0 then
			local token = "\n\n\n" 
			.. "                [style c=5]家族副本开启时间为每周一到周六[/style]"
			lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);]]
		if char.getWorkInt(meindex, "NPC临时5") == 0 then
			local token = "2\n               『" .. char.getChar(meindex, "名字") .. "』"
			.. "\n        [style c=10]     这里是家族副本[/style]"
			.. "\n        [style c=6]    【开启家族副本】 [/style]"
			.. "\n        [style c=2]    【加入家族副本】 [/style]"
			.. "\n        [style c=1]    【增加副本次数】 [/style]"
			.. "\n        [style c=5]    【观看副本战斗】 [/style]"
			.. "\n        [style c=3]    【家族副本说明】 [/style]"
			lssproto.windows(talkerindex, 2, 8, 0, char.getWorkInt( meindex, "对象"), token);
		elseif char.getWorkInt(meindex, "NPC临时5") > 99 then
			if char.getWorkInt(meindex,"战斗") == 2 then
				local token = "\n\n\n" 
				.. "                [style c=5]没看见我在忙吗[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			else
				local token = "\n\n\n" 
				.. "                [style c=5]BOSS说话内容[/style]"
				lssproto.windows(talkerindex, 0, 12, 2, char.getWorkInt( meindex, "对象"), token);
			end
		elseif char.getWorkInt(meindex, "NPC临时5") > 0 then
			if char.getWorkInt(meindex,"战斗") == 2 then
				local token = "\n\n\n" 
						.. "                [style c=5]没看见我在忙吗[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			else
				local token = "\n\n\n" 
				.. "                [style c=5]小怪说话内容[/style]"
				lssproto.windows(talkerindex, 0, 12, 3, char.getWorkInt( meindex, "对象"), token);
			end
		end
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 or select == 8 or other.atoi(os.date("%w",os.time())) == 0 then
		return;
	end
	if seqno >= 0 then
				local token = "\n\n\n" 
					.. "          [style c=5]副本功能暂未开放，敬请期待[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
		return
	end
	if seqno == 0 then
		if other.atoi(data) == 1 then
			local fmindex = char.getInt(talkerindex,"家族索引")
			print (fmindex)
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, "您还没有加入家族", 4)
			elseif char.getWorkInt(meindex, "NPC临时1") == fmindex then
				local token = "\n\n\n" 
					.. "                [style c=5]家族副本已开启，请尽快入场[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			elseif char.getInt(talkerindex,"家族地位") ~= 3 then
				local token = "\n\n\n" 
					.. "                [style c=5]只有[/style][style c=4]族长[/style][style c=5]才允许开启副本[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			elseif char.getWorkInt(meindex, "NPC临时1") > 0 then
				local token = "\n\n\n" 
					.. "                [style c=5]请等待其他家族结束副本后再参与[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			elseif other.atoi(os.date("%w",os.time())) == 0 then
				local token = "\n\n\n" 
					.. "                [style c=5]家族副本开启时间为每周一到周六[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			else
				local ret = sasql.query("select renew,freq from fmfb where Fmno ="..fmindex)
				if ret == 1 then
					sasql.free_result();
					sasql.store_result();
					if sasql.num_rows() > 0 then
						sasql.fetch_row();
						if other.atoi(sasql.data(2)) == 0 or char.getWorkInt( talkerindex, "家族地图") > 1000 and other.atoi(sasql.data(1)) == 0 and other.atoi(sasql.data(2)) < 2 or char.getWorkInt( talkerindex, "家族地图") > 1000 and other.atoi(sasql.data(1)) == 1 and other.atoi(sasql.data(2)) == 0 then
							local token = "3\n                     『" .. char.getChar(meindex, "名字") .. "』"
								.. "\n            [style c=10]20人副本/50人副本介绍[/style]"
								.. "\n            [style c=10]内容[/style]"
								.. "\n            [style c=4]    【开启20人家族副本】 [/style]"
								.. "\n            [style c=1]    【开启50人家族副本】 [/style]"
							lssproto.windows(talkerindex, 2, 8, 1, char.getWorkInt( meindex, "对象"), token);
							char.setWorkInt(talkerindex, "NPC临时1",1)
						elseif other.atoi(sasql.data(2)) == 1 or char.getWorkInt( talkerindex, "家族地图") > 1000 and other.atoi(sasql.data(2)) == 2 or char.getWorkInt( talkerindex, "家族地图") > 1000 and other.atoi(sasql.data(1)) == 1 and other.atoi(sasql.data(2)) == 1 then
							local token = "\n\n\n" 
							.. "                  [style c=5]您的家族本周已完成家族副本[/style]"
							lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt(meindex, "对象"), token);
						end
					else
						local token = "3\n                     『" .. char.getChar(meindex, "名字") .. "』"
							.. "\n            [style c=10]20人副本/50人副本介绍[/style]"
							.. "\n            [style c=10]内容[/style]"
							.. "\n            [style c=4]    【开启20人家族副本】 [/style]"
							.. "\n            [style c=1]    【开启50人家族副本】 [/style]"
						lssproto.windows(talkerindex, 2, 8, 1, char.getWorkInt( meindex, "对象"), token);
						char.setWorkInt(talkerindex, "NPC临时1",2)
					end
				end
			end
		elseif other.atoi(data) == 2 then
			local fmindex = char.getInt(talkerindex,"家族索引")
			if char.getWorkInt(meindex, "NPC临时1") == 0 then
				local token = "\n\n\n" 
					.. "                [style c=5]目前并没有族长开启家族副本[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			elseif char.getWorkInt(meindex, "NPC临时1") ~= fmindex then
				local token = "\n\n\n" 
					.. "                [style c=5]其他家族正启动副本中[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			elseif char.getWorkInt(meindex, "NPC临时2") == 0 then
				local token = "\n\n\n" 
					.. "                [style c=5]家族副本进场已关闭[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			elseif char.getInt(talkerindex,"家族地位") == 2 then
				local token = "\n\n\n" 
						.. "                [style c=5]你并未成为该家族正式成员[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			elseif getFloorPlayer() >= fbtype then
				local token = "\n\n\n" 
						.. "                [style c=5]副本人数已满[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			else
				if char.getWorkInt(talkerindex,"组队") == 0 then
					char.WarpToSpecificPoint(talkerindex, map, 50, 50);
					table.insert(palyerindex,talkerindex)
				else
					local token = "\n\n\n" 
						.. "                [style c=5]请离开队伍后再进入[/style]"
					lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
				end
			end
		elseif other.atoi(data) == 3 then
			if char.getInt(talkerindex,"家族地位") == 3 then
				local ret = sasql.query("select * from fmfb where Fmno ="..fmindex)
				if ret == 1 then
					sasql.free_result();
					sasql.store_result();
					if sasql.num_rows() > 0 then
						sasql.fetch_row();
						if other.atoi(sasql.data(2)) == 1 then
							local token = "\n\n\n" 
							   .. "                [style c=5]您的家族本周已增加过次数[/style]"
							lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
						elseif other.atoi(sasql.data(3)) == 0 then
							local token = "\n\n\n" 
								.. "                [style c=5]您的家族本周尚未开启家族副本[/style]"
							lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
						else
							local token = "\n\n\n" 
							   .. "                [style c=5]已成功增加副本次数[/style]"
							lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
							sasql.query("update fmfb SET renew =1,freq =0 where fmno="..char.getInt(talkerindex,"家族索引"))
						end
					else
						local token = "\n\n\n" 
							   .. "                [style c=5]您的家族本周尚未开启过家族副本[/style]"
						lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
					end
				end
			else
				local token = "\n\n\n" 
						.. "                [style c=5]只有[/style][style c=4]族长[/style][style c=5]才可以使用该功能[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
			end
		elseif other.atoi(data) == 4 then
			local token = "1\n               [style c=4]请选择要观战的队伍：[/style]\n";
			local battlelist = map.getBattleIndex(map);
			if #battlelist < 1 then
				char.TalkToCli(talkerindex, meindex, "目前家族副本没有任何战斗！", 4);
			else
				for i=1,7 do
					if i > #battlelist then
						break ;
					end
					token = token.."                   [style c=1]"..char.getChar(battle.getInt(battlelist[i],"下方队长"),"名字").."[/style]\n";
				end
				lssproto.windows(talkerindex, 2, 8, 4, char.getWorkInt( meindex, "对象"), token);
			end
		elseif other.atoi(data) == 5 then
			local token = "\n\n" 
			.. "                [style c=5]副本说明[/style]\n"
			.. "                [style c=5]副本说明[/style]\n"
			.. "                [style c=5]副本说明[/style]\n"
			.. "                [style c=5]副本说明[/style]\n"
			.. "                [style c=5]副本说明[/style]"
			lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
		end
	elseif seqno == 1 then
		if char.getWorkInt(meindex, "NPC临时1") > 0 then
			local token = "\n\n\n" 
				.. "                [style c=5]请等待其他家族结束副本后再参与[/style]"
			lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
		else
			if char.getWorkInt(talkerindex, "NPC临时1") == 2 then
				sasql.query("INSERT INTO fmfb SET fmno="..char.getInt(talkerindex,"家族索引")..",renew =0,freq =1")
			else
				sasql.query("update fmfb SET freq =freq+1 where fmno="..char.getInt(talkerindex,"家族索引"))
			end
			fbtype = other.atoi(data)*30-10
			char.setWorkInt(meindex, "NPC临时1",fmindex)
			char.setWorkInt(meindex, "NPC临时2",os.time())
			fmname = char.getChar(talkerindex,"家族")
			char.talkToServer(-1,"[家族副本] 『"..fmname.."』族长开启了家族副本，目前参与人数：1/"..fbtype.."，进场时间剩余: 5分钟", math.random(10))
			char.WarpToSpecificPoint(talkerindex, map, 50, 50);
			palyerindex = {talkerindex}
		end
	elseif seqno == 2 or seqno == 3 then
		if char.getWorkInt(meindex,"战斗") ~= 2 then
			local enemytable = {}
			for i=1,10 do
				table.insert(enemytable,other.atoi(other.getString(char.getWorkChar(meindex, "NPC临时1"),"|",i)))
			end
			battle.CreateVsEnemy(talkerindex, meindex, enemytable);
			if seqno == 2 then
				char.TalkToCli(talkerindex, meindex, "BOSS说话", 4);
			else
				char.TalkToCli(talkerindex, meindex, "小怪说话", 4);
			end
		end
	elseif seqno == 4 then
		if char.getWorkInt(battle.getInt(battlelist[other.atoi(data)],"下方队长"),"战斗") ~= 2 then
			char.TalkToCli(talkerindex, meindex, "战斗已经结束！", 4);
		else
			battle.WatchEntry(talkerindex, battle.getInt(battlelist[other.atoi(data)],"下方队长"));
		end
	end
end

function Loop(meindex)
	if other.atoi(os.date("%w",os.time())) == 0 and cleanup == false and getFloorPlayer() == 0 then
		local ret = sasql.query("select * from fmfb")
		if ret == 1 then
			sasql.free_result();
			sasql.store_result();
			for i=1,sasql.num_rows() do
				sasql.fetch_row();
				sasql.query("update fmfb SET renew =0,freq =0 where fmno="..other.atoi(sasql.data(1)))
			end
		end
		cleanup = true
	elseif other.atoi(os.date("%w",os.time())) == 1 and cleanup == true then
		cleanup = false
	elseif char.getWorkInt(meindex, "NPC临时2") > 0 then
		local countdown = os.time()-char.getWorkInt(meindex, "NPC临时2")
		if countdown > 299 then
			if getFloorPlayer() > 0 then
				char.talkToServer(-1, "[家族副本] 『"..fmname.."』家族因参与人数不足，本次家族副本结束", 4)
				char.setWorkInt(meindex, "NPC临时1", 0)
				char.setWorkInt(meindex, "NPC临时2", 0)
			else
				char.setWorkInt(meindex, "NPC临时3",os.time())
				char.setWorkInt(meindex, "NPC临时2", 0)
				char.talkToServer(-1, "[家族副本] 进场关闭，目前参与人数："..getFloorPlayer().."/"..fbtype.."，一分钟后开始", math.random(10))
			end
		elseif countdown > 239 and countdown < 252 then
			char.talkToServer(-1, "[家族副本] 『"..fmname.."』族长开启了家族副本，目前参与人数："..getFloorPlayer().."/"..fbtype.."，进场时间剩余: 1分钟", math.random(10))
		elseif countdown > 179 and countdown < 192 then
			char.talkToServer(-1, "[家族副本] 『"..fmname.."』族长开启了家族副本，目前参与人数："..getFloorPlayer().."/"..fbtype.."，进场时间剩余: 2分钟", math.random(10))
		elseif countdown > 119 and countdown < 132 then
			char.talkToServer(-1, "[家族副本] 『"..fmname.."』族长开启了家族副本，目前参与人数："..getFloorPlayer().."/"..fbtype.."，进场时间剩余: 3分钟", math.random(10))
		elseif countdown > 59 and countdown < 72 then
			char.talkToServer(-1, "[家族副本] 『"..fmname.."』族长开启了家族副本，目前参与人数："..getFloorPlayer().."/"..fbtype.."，进场时间剩余: 4分钟", math.random(10))
		end
	elseif char.getWorkInt(meindex, "NPC临时3") > 0 then
		local countdown = os.time()-char.getWorkInt(meindex, "NPC临时3")
		if countdown > 59 then
			char.setWorkInt(meindex, "NPC临时3", 0)
			char.setWorkInt(meindex, "NPC临时4", os.time())
			char.talkToServer(-1, "[家族副本] 请尽快消灭怪物", 4)
			for i=1,enemynum do
				Create("小怪名字", enemyimg[math.random(#enemyimg)], map, map.getX(map.RandXAndY(map)), map.getY(map.RandXAndY(map)),math.random(8), i)
			end
			enemynum2 = enemynum
		end
	elseif char.getWorkInt(meindex, "NPC临时4") > 0 then
		local countdown = math.ceil(os.time()-char.getWorkInt(meindex, "NPC临时4"))
		if getFloorPlayer() > 0 then
			if countdown > (closing-5) and remind5 == false then
				remind5 = true
				char.talkToServer(-1, "[家族副本]5分钟后将关闭", math.random(10))
			elseif countdown > (closing-1) and remind1 == false then
				remind1 = true
				char.talkToServer(-1, "[家族副本]1分钟后将关闭", math.random(10))
			elseif enemynum2 < 1 and bossshow == false then
				for i=100,100+boosnum do
					Create("BOSS名字", bossimg[math.random(#bossimg)], map, map.getX(map.RandXAndY(map)), map.getY(map.RandXAndY(map)),math.random(8), i)
				end
				bossshow = true
				enemynum3 = boosnum
			elseif countdown >= closing or enemynum3 == 0 then
				char.talkToServer(-1, "[家族副本]副本关闭", math.random(10))
				char.setWorkInt(meindex, "NPC临时1", 0)
				char.setWorkInt(meindex, "NPC临时4", 0)
				if #npcid > 0 then
					NPCDEL()
					for i=1,#palyerindex do
						if char.check(palyerindex[i]) == 1 and char.getInt(palyerindex[i], "地图号") == map then
							char.WarpToSpecificPoint(palyerindex[i], 2005, 13, 13);
						end
					end
				end
			end
		else
			char.talkToServer(-1, "[家族副本]『"..fmname.."』家族未能战胜BOSS，副本关闭", math.random(10))
			char.setWorkInt(meindex, "NPC临时1", 0)
			char.setWorkInt(meindex, "NPC临时4", 0)
			if #npcid > 0 then
				NPCDEL()
			end
		end
	end
end

function BattleOver(meindex, battleindex, iswin)
	if iswin == 1 then
		for i=0,4 do
			local charaindex = battle.getCharOne(battleindex, i, 0)
			if char.getFlg(charaindex, "死亡") ~= 1 then
				if char.getWorkInt(meindex, "NPC临时5") < 99 then
					char.Additem(charaindex, reward1[math.random(#reward1)])
					enemynum2 = enemynum2 - 1
				else
					char.Additem(charaindex, reward2[math.random(#reward2)])
					enemynum3 = enemynum3 - 1
				end
			end
		end
		npc.DelNpc(meindex)
	end
end

function NPCDEL()
	for i=1,#npcid do
		if char.check(npcid[i]) == 1 then
			npc.DelNpc(npcid[i])
		end
		if #bossid >= i then
			if char.check(bossid[i]) == 1 then
				npc.DelNpc(bossid[i])
			end
		end
	end
	bossid = {}
	npcid = {}
	remind1 = false
	remind5 = false
	bossshow = false
end

function Create(name, metamo, floor, x, y, dir, flg)
	local npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir);
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "");
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setWorkInt(npcindex, "NPC临时5", flg)
	if flg == 0 then
		char.setWorkInt(npcindex, "NPC临时1", 0)
		char.setWorkInt(npcindex, "NPC临时2", 0)
		char.setWorkInt(npcindex, "NPC临时3", 0)
		char.setWorkInt(npcindex, "NPC临时4", 0)
		char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
		char.setInt(npcindex, "循环事件时间", 10000);
	else
		local enemytable = {}
		char.setFunctionPointer(npcindex, "战后事件", "BattleOver", "")
		if flg > 99 then
			table.insert(bossid,npcindex)
			enemytable = {boss[math.random(#boss)]}
			for i=1,9 do
				table.insert(enemytable,enemy[math.random(#enemy)])
			end
		else
			table.insert(npcid,npcindex)
			for i=1,10 do
				table.insert(enemytable,enemy[math.random(#enemy)])
			end
		end
		char.setWorkChar(npcindex, "NPC临时1",table.concat(enemytable,"|"))
	end
end

function data()
	reward1 = {22062} --小怪奖励
	reward2 = {22062} --BOSS奖励
	bossshow = false
	remind1 = false
	remind5 = false
	cleanup = false
	fmname = "" 
	fbtype = 0
	palyerindex = {}
	npcid = {}
	bossid = {}
	start = 5  --入场时间
	closing = 40 --副本时间
	map = 41021 --副本地图
	enemyimg = {105082,100289,113024} --小怪图形
	bossimg = {109005,100872,101442} --BOSS图形
	enemy = {3021,3022,3023,3024,3028,3029,3030,3031,4011,4012} --小怪
	boss = {4000,4001,4002}  --BOSS
	enemynum = 20 --小怪数
	boosnum = 1 --boss数
end

function main()
	data()
	Create("家族副本", 101424, 2005, 28, 2, 6, 0);
end