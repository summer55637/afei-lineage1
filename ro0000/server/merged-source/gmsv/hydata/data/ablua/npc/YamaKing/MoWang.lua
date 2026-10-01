function BattleOver(meindex, battleindex, iswin)
	for i=0, 4 do
		local charaindex = battle.getCharOne(battleindex, i, 0);
		if char.check(charaindex) == 1 then
			if iswin == 1 and char.getFlg(charaindex, "死亡") ~= 1 then
				local myreward = reward[math.random(#reward)]
				if type(myreward) == "number" then
					npc.AddItem(charaindex,myreward)
				else
					myreward = math.random(other.getString(myreward, "-", 1),other.getString(myreward, "-", 2))
					npc.AddItem(charaindex,myreward)
				end
				npc.AddItem(charaindex,20900)
            	char.talkToServer(-1, "[荒原魔王] 恭喜玩家 "..char.getChar(charaindex,"名字").." 打败了荒原魔王获得了〖"..item.getNameFromNumber(myreward).."〗", math.random(10))
			end
		end
	end
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		local token = char.getChar(meindex, "名字") .. "|要宝物就打败我！\n详情请看介绍|2|挑战|荒原大魔王说明"
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 or select == 8 then 
		return;
	end
	if seqno == 0 then
		if other.atoi(data) == 1 then
			local token = char.getChar(meindex, "名字") .. "|上一次挑战我的人，\n已经飞回记录点了|1|放马过来"
			lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
		elseif  other.atoi(data) == 2 then
           	local token = "\n" 
            .. "           ≡ 大魔王说明 ≡\n\n这个是个挑战副本,挑战需要1张地狱通行证\n队长组队，队员包里也必须带有通行证.\n挑战成功返还通行证*1+随机奖励.\n只有一层，所有BOSS和小怪都是随机出现."				
            lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token);
        end
	elseif seqno == 1 then
		if other.atoi(data) == 1 then
			local playernum = 0
			if char.getWorkInt(talkerindex, "组队") ~= 0 then
				for i=1,5 do
					local tmindex = char.getWorkInt(talkerindex, "队员"..i)
					if char.check(tmindex) == 1 then
						if npc.Free(meindex, tmindex,"ITEM=20900") == 0 then
							char.TalkToCli(talkerindex, meindex, "[" .. char.getChar(tmindex,"名字") .. "]还没有资格挑战我！", 4);
							return
						end
					end
				end
				for i=1,5 do
					local tmindex = char.getWorkInt(talkerindex, "队员"..i)
					if char.check(tmindex) == 1 then
						playernum = playernum+1
						npc.DelItem(tmindex, "20900*1")
					end
				end
			else
				if npc.Free(meindex, talkerindex,"ITEM=20900") == 0 then
					char.TalkToCli(talkerindex, meindex, "看来你并没有资格挑战我！", 4);
					return
				else
					npc.DelItem(talkerindex, "20900*1")
				end
				playernum = 1
			end
			local tmenemytable = {-1, -1, -1, -1, -1, -1, -1, -1, -1, -1}
			if playernum == 1 then
				local bossid = {4001,4002,4001,4002,4000,4000,4002,4000,4003,4001,4001}
				local subid = {4011,4012,4013}
				tmenemytable = {bossid[math.random(#bossid)],subid[math.random(#subid)]}
			else
				
				tmenemytable[1] = bosstable[math.random(#bosstable)]
				for i=2,playernum*2 do
					tmenemytable[i] = enemytable[math.random(#enemytable)]
				end
			end
			battle.CreateVsEnemy(talkerindex, meindex, tmenemytable);
			char.TalkToCli(talkerindex, meindex, "你是不可能阻止我们的", 4);
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	local index = npc.CreateNpc(name, metamo, floor, x, y, dir);
	char.setFunctionPointer(index, "对话事件", "Talked", "");
	char.setFunctionPointer(index, "窗口事件", "WindowTalked", "");
	char.setFunctionPointer(index, "战后事件", "BattleOver", "");
end

function data()
	bosstable = {4002,4002,4003,4003,4004,4004,4005,4005,4005}--BOSS怪
	enemytable = {4011,4011,4012,4012,4001,4012,4013,4001,4013,4014,4014,4014}--小怪
	reward = {"14031-14121","14122-14151","14421-14451","14452-14480",26026,26027,28461,20810,"14721-14751","14752-14781","14991-15051",22062,22051,"15051-15081","15291-15351","15351-15380"
		,"16491-16551"
		,"16551-16580","14721-14751"
	,28452,"15891-15951","15981-16010","14721-14751",29171,29062,29159,"16191-16251","16221-16280","16491-16551","16521-16581","16791-16851","16881-16910","17251-17280","17201-17281","17101-17210",26023,26024,"17601-17660","17659-17710","17821-17850","18061-18080","18081-18090",26045,20599,20600,22050,28468
	,"14181-14216","14421-14451","14481-14516","14721-14751",26026,26027,20810,"14721-14780","15081-15140",22051,21009,"15061-15079","15381-15416"
	,"16491-16551"
	,"16521-16581"
	,28452,"15891-15951","15981-16016",29171,"14721-14751","16191-16251","16221-16280",20810,23800,21010,22033,22003,28461,"16491-16551"
	,"16521-16581"
	,"16791-16851","16881-16940","17251-17280","14721-14751","17281-17300","17101-17160","17101-17210",26023,26024,29518,"17601-17660","17659-17710","17821-17850","17851-17900",26045,20599,20600,22050,22051,28468,28452
	,"14121-14150","14031-14151","14421-14450","14451-14480",22050,26024,29062,20810,"14721-14751",21113,26025,21009,29172,"14661-14721","14721-14751","15021-15050",22050,28496,"14991-15051","15321-15350","15291-15351","15621-15650","15651-15680","15921-15950","15891-15951","16221-16250","16191-16251",23800,"16521-16550","16551-16580","16821-16850","16851-16880","17201-17250","17251-17300",26022,26023,"17701-17750","17751-17800","18031-18060","18061-18075",26044,20599,20600,22050
	}--随机奖励
end

function main() 
	data();
	if config.getGameservername() == "娱乐互动线" then
		Create("荒原大魔王",109131,2005,13,16,6)
	end
end
