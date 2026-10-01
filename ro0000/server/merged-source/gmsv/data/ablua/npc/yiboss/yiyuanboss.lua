function BattleOver(meindex, battleindex, iswin)
	if iswin == 1 then		
		local charaindex = battle.getCharOne(battleindex, 0, 0)
		if char.check(charaindex) == 1 and char.check(meindex) == 1 then
			local myreward = reward[math.random(#reward)]
			if type(myreward) == "number" then
				npc.AddItem(charaindex,myreward)
			else
				myreward = math.random(other.getString(myreward, "-", 1),other.getString(myreward, "-", 2))
				npc.AddItem(charaindex,myreward)
			end
			char.talkToServer(-1, "[渔村BOSS]英雄 "..char.getChar(charaindex, "名字").." 击败 "..char.getChar(meindex, "名字").." 获得 "..item.getNameFromNumber(myreward), 5)
			npc.DelNpc(meindex)
			emenynum = emenynum + 1
			if emenynum > 11 then
				mydata()
				char.talkToServer(-1, "本次渔村攻城BOSS活动结束！", 6)
			end
		end
	end
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 and char.getWorkInt(meindex,"NPC临时1") > 1 then 
		local token = "\n                  『" .. char.getChar(meindex, "名字") .. "』\n\n"
		   .. "你想来试试我得力量吗？"
		lssproto.windows(talkerindex, 0, 12, 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 and select ~= 8 then
		if seqno == 0 then
			if char.getWorkInt(talkerindex, "组队") == 0 then
				local enemytable = {enemytablexb[math.random(#enemytablexb)]}
				local battleindex = battle.CreateVsEnemy(talkerindex, meindex, enemytable)
			else
				char.TalkToCli(talkerindex, -1, "只允许单人挑战", 4)
			end
		end
	end
end

function Loop(meindex)
	if char.getWorkInt(meindex,"NPC临时1") == 1 and start == true then
		local timer = other.atoi(os.date("%H%M",os.time()))
		for i=1,11 do
			if timer == 1100+i*100 then
				start = false
				for e=1,12 do
					Create(enemyname[e],enemyimg[e],2000,TM_X[e],TM_Y[e],math.random(8),e+1)
					coutndown = os.time()
					char.talkToServer(-1, "[敌情快讯]活动线渔村境内出现BOSS，尼斯大陆的英雄们抓紧行动吧！", 5)
				end
				break
			end
		end
	elseif start == false and char.check(meindex) == 1 then
		if char.getWorkInt(meindex,"NPC临时1") > 1 then
			char.RandRandWalk(meindex)
		end
		local nowtime = os.time()-coutndown
		if nowtime > 2999 then
			char.talkToServer(-1, "本次渔村攻城BOSS活动结束！", 6)
			for i=1,#npcid do
				npc.DelNpc(npcid[i])	
			end
			mydata()
		end
	end
end

function gmset(charaindex, data)
	if other.getString(data, " ", 1) == "开" then
		start = false
		for i=1,12 do
			Create(enemyname[i],enemyimg[i],2000,TM_X[i],TM_Y[i],math.random(8),i+1)
			coutndown = os.time()
		end
		char.talkToServer(-1, "[敌情快讯]活动线渔村村内出现BOSS，尼斯大陆的英雄们抓紧行动吧！", 5)
	end
end

function Create(name, metamo, floor, x, y, dir, flg)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir, flg)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
	char.setWorkInt(npcindex, "NPC临时1", flg)
	if flg > 1 then
		char.setInt(npcindex, "循环事件时间", 5000);
		char.setFunctionPointer(npcindex, "战后事件", "BattleOver", "")
		table.insert(npcid,npcindex)
	else
		char.setInt(npcindex, "循环事件时间", 10000);
	end
end

function mydata()
	start = true
	coutndown = 0
	emenynum = 0
	npcid = {}
end

function data()
	TM_X ={62,79,47,74,69,87,97,66,67,91,85,74,69,60,88}
	TM_Y ={52,68,74,89,114,91,74,38,70,82,89,94,112,95,67}
	enemyimg = {109063,109062,109061,109060,109131,109060,109060,109062}
	enemyname = {"攻城精英","攻城队长","攻城小兵","攻城队长","攻城队长","攻城小兵","攻城小兵","攻城小兵"}
	enemytablexb = {4510,4508,4509,4511}
	reward = {"14721-14810","14121-14160","14161-14240","14421-14480","14481-14516","15021-15116","15321-15440","15621-15716","15921-16040","16221-16316","16491-16614","16821-16946","17151-17360","17701-17860",
	             "18061-18078","18091-18105",20833,20846,20810,20900,21007,21009,21010,"21044-21047",21113,22033,				
				 22050,22051,22052,"22050-22052",22060,22062,22475,25007,25100,26112,26113,26111,
                "14721-14810","14121-14160","14161-14240","14421-14480","14481-14516","15021-15116","15321-15440","15621-15716",				 
				 22407,26027,26026,26059,26073,26025,29035,
				 "15321-15440","15621-15716","15921-16040","16221-16316","16491-16614","16821-16946","17151-17360","17701-17860",
				 "29064-29069",23800,29118,29119,29140,29159,29502,28468,28496}
	math.randomseed(tostring(os.time()):reverse():sub(1, 7))
end

function main()
	if config.getGameservername() == "娱乐互动线" then
		data()
		mydata()
		Create("渔村BOSS", 100000, 777, 29, 38, 6, 1);
		magic.addLUAListFunction("yiyuan", "gmset", "", 3, "[yiyuan 开]");
	end
end


