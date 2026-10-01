function BattleDamage(charaindex, defindex, damage)
	local ownindex = -1
	if char.getInt(charaindex,"类型") == 1 then
		ownindex = charaindex
	elseif char.getInt(charaindex,"类型") == 3 then
		ownindex = char.getWorkInt(charaindex,"NPC临时1")
	end
	if ownindex > -1 then
		if string.len(char.getChar(ownindex,"伤害BUFF")) > 1 then
			local damagebuff = char.getChar(ownindex,"伤害BUFF")
			local damageup = other.atoi(other.getString(damagebuff,"-",1))
			local damagetime = other.atoi(other.getString(damagebuff,"-",2))
			if damagetime < other.time() then
				char.setChar(ownindex,"伤害BUFF","")
			else
				damage = damage + math.floor(damage * damageup / 100)
				damagetime = damagetime - other.time()
				damageday = math.floor(damagetime / 86400)
				damagehour = math.floor((damagetime - damageday * 86400) / 3600)
				damagemin = math.floor((damagetime - damageday * 86400 - damagehour * 3600) / 60)
				damagesec = damagetime - damageday * 86400 - damagehour * 3600 - damagemin * 60
				if char.getWorkInt(ownindex,"战斗索引") ~= char.getWorkInt(ownindex,"NPC临时1") then
					char.TalkToCli(ownindex, -1, "至高无上的「屠龙者的荣誉」，此[Buff]提供伤害增益8%，剩余时间：" .. damageday .. " 天 " .. damagehour .. " 时 " .. damagemin .. " 分 " .. damagesec .. " 秒！", "随机色")
					char.setWorkInt(ownindex,"NPC临时1",char.getWorkInt(ownindex,"战斗索引"))
				end
			end
		end
	end
	if ownindex == -1 then
		return damage
	end
	if char.getInt(defindex,"类型") == 2 and char.getInt(ownindex,"地图号") == floorid then
		if char.getInt(defindex,"宠ID") >= 4501 and char.getInt(defindex,"宠ID") <= 4503 then
			if ownindex > -1 then
				local nowdate = other.atoi(os.date("%Y", os.time()) .. os.date("%m", os.time()) .. os.date("%d", os.time()))
				if char.getInt(ownindex,"活动日期") ~= nowdate then
					char.setInt(ownindex,"伤害积分",0)
					char.setInt(ownindex,"活动日期",nowdate)
				end
				char.setInt(ownindex,"伤害积分",char.getInt(ownindex,"伤害积分") + damage)
				local tmdamage = char.getInt(ownindex,"伤害积分")
				if tmdamage > damage1 then
					if char.getChar(ownindex,"账号") == cdkey1 and char.getChar(ownindex,"名字") == charname1 then
						damage1 = tmdamage
					else
						if char.getChar(ownindex,"账号") == cdkey5 and char.getChar(ownindex,"名字") == charname5 then
							cdkey5 = cdkey4
							charname5 = charname4
							damage5 = damage4
							cdkey4 = cdkey3
							charname4 = charname3
							damage4 = damage3
							cdkey3 = cdkey2
							charname3 = charname2
							damage3 = damage2
							cdkey2 = cdkey1
							charname2 = charname1
							damage2 = damage1
						elseif char.getChar(ownindex,"账号") == cdkey4 and char.getChar(ownindex,"名字") == charname4 then
							cdkey4 = cdkey3
							charname4 = charname3
							damage4 = damage3
							cdkey3 = cdkey2
							charname3 = charname2
							damage3 = damage2
							cdkey2 = cdkey1
							charname2 = charname1
							damage2 = damage1
						elseif char.getChar(ownindex,"账号") == cdkey3 and char.getChar(ownindex,"名字") == charname3 then
							cdkey3 = cdkey2
							charname3 = charname2
							damage3 = damage2
							cdkey2 = cdkey1
							charname2 = charname1
							damage2 = damage1
						elseif char.getChar(ownindex,"账号") == cdkey2 and char.getChar(ownindex,"名字") == charname2 then
							cdkey2 = cdkey1
							charname2 = charname1
							damage2 = damage1
						end
						cdkey1 = char.getChar(ownindex,"账号")
						charname1 = char.getChar(ownindex,"名字")
						damage1 = tmdamage
					end
				elseif tmdamage > damage2 then
					if char.getChar(ownindex,"账号") == cdkey2 and char.getChar(ownindex,"名字") == charname2 then
						damage2 = tmdamage
					else
						if char.getChar(ownindex,"账号") == cdkey5 and char.getChar(ownindex,"名字") == charname5 then
							cdkey5 = cdkey4
							charname5 = charname4
							damage5 = damage4
							cdkey4 = cdkey3
							charname4 = charname3
							damage4 = damage3
							cdkey3 = cdkey2
							charname3 = charname2
							damage3 = damage2
						elseif char.getChar(ownindex,"账号") == cdkey4 and char.getChar(ownindex,"名字") == charname4 then
							cdkey4 = cdkey3
							charname4 = charname3
							damage4 = damage3
							cdkey3 = cdkey2
							charname3 = charname2
							damage3 = damage2
						elseif char.getChar(ownindex,"账号") == cdkey3 and char.getChar(ownindex,"名字") == charname3 then
							cdkey3 = cdkey2
							charname3 = charname2
							damage3 = damage2
						end
						cdkey2 = char.getChar(ownindex,"账号")
						charname2 = char.getChar(ownindex,"名字")
						damage2 = tmdamage
					end
				elseif tmdamage > damage3 then
					if char.getChar(ownindex,"账号") == cdkey3 and char.getChar(ownindex,"名字") == charname3 then
						damage3 = tmdamage
					else
						if char.getChar(ownindex,"账号") == cdkey5 and char.getChar(ownindex,"名字") == charname5 then
							cdkey5 = cdkey4
							charname5 = charname4
							damage5 = damage4
							cdkey4 = cdkey3
							charname4 = charname3
							damage4 = damage3
						elseif char.getChar(ownindex,"账号") == cdkey4 and char.getChar(ownindex,"名字") == charname4 then
							cdkey4 = cdkey3
							charname4 = charname3
							damage4 = damage3
						end
						cdkey3 = char.getChar(ownindex,"账号")
						charname3 = char.getChar(ownindex,"名字")
						damage3 = tmdamage
					end
				elseif tmdamage > damage4 then
					if char.getChar(ownindex,"账号") == cdkey4 and char.getChar(ownindex,"名字") == charname4 then
						damage4 = tmdamage
					else
						if char.getChar(ownindex,"账号") == cdkey5 and char.getChar(ownindex,"名字") == charname5 then
							cdkey5 = cdkey4
							charname5 = charname4
							damage5 = damage4
						end
						cdkey4 = char.getChar(ownindex,"账号")
						charname4 = char.getChar(ownindex,"名字")
						damage4 = tmdamage
					end
				elseif tmdamage > damage5 then
					cdkey5 = char.getChar(ownindex,"账号")
					charname5 = char.getChar(ownindex,"名字")
					damage5 = tmdamage
				end
			end
		end
	end
	
	return damage
end

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

function BossLoop(meindex)
	if table.getn(bossbattleindex) > 0 then
		for i=1,table.getn(bossbattleindex) do
			for j=0, 4 do
				local enemyindex = battle.getCharOne(bossbattleindex[i], j, 0)
				if char.check(enemyindex) == 1 then
					if char.getInt(enemyindex,"类型") == 1 and char.getInt(enemyindex,"HP") <= 0 then
						battle.Exit(enemyindex,bossbattleindex[i])
						char.TalkToCli(enemyindex, -1, "[温馨提示]您已经死亡，系统自动帮您退出战斗。", "随机色")
					end
				end
			end
		end
	end
	if start == -1 then
		npc.DelNpc(meindex)
		bossdie = 0
		local maxplayer = char.getPlayerMaxNum() - 1
		local TM_index = {-1,-1,-1}
		for i=0,maxplayer do
			if char.check(i) == 1 then
				if char.getChar(i,"账号") == cdkey1 and char.getChar(i,"名字") == charname1 then
					local TM_ItemIndex = npc.AddRandItem(i, giveitemid[1])
					if TM_ItemIndex > -1 then
						char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage1 .. "伤害[排名第一] 获得[" .. item.getChar(TM_ItemIndex,"显示名") .. "]。", "随机色")
					else
						char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage1 .. "伤害[排名第一] 身上道具数量已满，所以无法获得奖品。", "随机色")
						char.TalkToCli(i, -1, "[温馨提示]您身上的道具已满了，奖励道具消失了！", "随机色")
					end
					TM_index[1] = i
				elseif char.getChar(i,"账号") == cdkey2 and char.getChar(i,"名字") == charname2 then
					local TM_ItemIndex = npc.AddRandItem(i, giveitemid[2])
					if TM_ItemIndex > -1 then
						char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage2 .. "伤害[排名第二] 获得[" .. item.getChar(TM_ItemIndex,"显示名") .. "]。", "随机色")
					else
						char.talkToServer(-1, "[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage2 .. "伤害[排名第二] 身上道具数量已满，所以无法获得奖品。", "随机色")
						char.TalkToCli(i, -1, "[温馨提示]您身上的道具已满了，奖励道具消失了！", "随机色")
					end
					TM_index[2] = i
				elseif char.getChar(i,"账号") == cdkey3 and char.getChar(i,"名字") == charname3 then
					local TM_ItemIndex = npc.AddRandItem(i, giveitemid[3])
					if TM_ItemIndex > -1 then
						char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage3 .. "伤害[排名第三] 获得[" .. item.getChar(TM_ItemIndex,"显示名") .. "]。", "随机色")
					else
						char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage3 .. "伤害[排名第三] 身上道具数量已满，所以无法获得奖品。", "随机色")
						char.TalkToCli(i, -1, "[温馨提示]您身上的道具已满了，奖励道具消失了！", "随机色")
					end
					TM_index[3] = i
				end
			end
		end
		for i=1,3 do
			if TM_index[i] == -1 then
				if i == 1 then
					char.talkToServer(-1,"[龙域副本]勇者 " .. charname1 .. " 在本次龙域作战中伤害排名第一，因不在线，所以无法获得奖品，好可惜啊！", "随机色")
				elseif i == 2 then
					char.talkToServer(-1,"[龙域副本]勇者 " .. charname2 .. " 在本次龙域作战中伤害排名第二，因不在线，所以无法获得奖品，好可惜啊！", "随机色")
				elseif i == 3 then
					char.talkToServer(-1,"[龙域副本]勇者 " .. charname3 .. " 在本次龙域作战中伤害排名第三，因不在线，所以无法获得奖品，好可惜啊！", "随机色")
				end
			end
		end
		for i=1,table.getn(bossbattleindex) do
			if battleindex ~= bossbattleindex[i] then
				for j=0, 4 do
					local enemyindex = battle.getCharOne(bossbattleindex[i], j, 0)
					if char.check(enemyindex) == 1 then
						if char.getInt(enemyindex,"类型") == 1 then
							battle.Exit(enemyindex,bossbattleindex[i])
							char.TalkToCli(enemyindex, -1, "[温馨提示]副本时间已到，战斗结束。", "随机色")
						end
					end
				end
			end
		end
		bossbattleindex = {}
	end
end

function Loop(meindex)
	--if Hour ==  tonumber(os.date("%H", os.time())) then
	if ((tonumber(os.date("%w", os.time())) == 2 or tonumber(os.date("%w", os.time())) == 5) and tonumber(os.date("%H", os.time())) >= 18) or gmstart == 1 then
		if todaydate ~= os.date("%x", os.time()) then
			start = 0
			todaydate = os.date("%x", os.time())
		end
		if start == 0 then
			cdkey5 = ""
			charname5 = ""
			damage5 = 0
			cdkey4 = ""
			charname4 = ""
			damage4 = 0
			cdkey3 = ""
			charname3 = ""
			damage3 = 0
			cdkey2 = ""
			charname2 = ""
			damage2 = 0
			cdkey1 = ""
			charname1 = ""
			damage1 = 0
			start = 1
			for i=1,5 do
				for j = 1, 4 do
					rand = math.random(table.getn(location))
					Create(npcdata[j][1], npcdata[j][2], floorid, location[rand][1], location[rand][2], npcdata[j][3],2 )
				end
			end
			char.talkToServer(-1, "[龙域副本]告急告急告急，龙域告急，大量龙族肆虐，勇士们快来消灭他们吧！入口在渔村医院[18.16]", "随机色")
			char.talkToServer(-1, "[龙域副本]告急告急告急，龙域告急，大量龙族肆虐，勇士们快来消灭他们吧！入口在渔村医院[18.16]", "随机色")
			char.talkToServer(-1, "[龙域副本]告急告急告急，龙域告急，大量龙族肆虐，勇士们快来消灭他们吧！入口在渔村医院[18.16]", "随机色")
		elseif start >= 1 and start <= 3 then
			if num <= 0 and start < 3 then
				for i=1,5 do
					for j = 1, 4 do
						rand = math.random(table.getn(location))
						Create(npcdata[j][1], npcdata[j][2], floorid, location[rand][1], location[rand][2], npcdata[j][3],2 )
					end
				end
				char.talkToServer(-1,"[龙域副本]告急告急告急，龙族大军再次增员，勇士们快来帮忙呀！入口在渔村医院[18.16]", "随机色")
				char.talkToServer(-1,"[龙域副本]告急告急告急，龙族大军再次增员，勇士们快来帮忙呀！入口在渔村医院[18.16]", "随机色")
				char.talkToServer(-1,"[龙域副本]告急告急告急，龙族大军再次增员，勇士们快来帮忙呀！入口在渔村医院[18.16]", "随机色")
				start = start + 1
			elseif (tonumber(os.date("%H", os.time())) == 19 and tonumber(os.date("%M", os.time())) >= 45) or start == 3 then
				start = 4
			end
		elseif start == 4 then
			Create("BOSS", 105009, floorid, 60, 77, 0,3 )
			char.talkToServer(-1,"[龙域副本]可怕的龙王[烈焰神龙]带着他的2个副将[黑暗魔龙]、[黑暗翼龙]降临了！！！", "随机色")
			char.talkToServer(-1,"[龙域副本]可怕的龙王[烈焰神龙]带着他的2个副将[黑暗魔龙]、[黑暗翼龙]降临了！！！", "随机色")
			char.talkToServer(-1,"[龙域副本]可怕的龙王[烈焰神龙]带着他的2个副将[黑暗魔龙]、[黑暗翼龙]降临了！！！", "随机色")
			start = 5
		end
	else
		start = -1
	end
end

function EnemyLoop(meindex)
	if start >= 1 and start <= 3 then
		char.RandRandWalk(meindex)
		local tempbattleindex = char.getWorkInt(meindex,"NPC临时2")
		if tempbattleindex > -1 then
			for i=0, 4 do
				local enemyindex = battle.getCharOne(tempbattleindex, i, 0)
				if char.check(enemyindex) == 1 then
					if char.getInt(enemyindex,"类型") == 1 and char.getInt(enemyindex,"HP") <= 0 then
						battle.Exit(enemyindex,tempbattleindex)
						char.TalkToCli(enemyindex, -1, "[温馨提示]您已经死亡，系统自动帮您退出战斗。", "随机色")
					end
				else
					if battle.getBattlePaiType(tempbattleindex) > 0 then
						local jiaindex = battle.getBattlePaiIndex(tempbattleindex,0)
						if char.check(jiaindex) == 1 then
							local watchbattleindex = char.getWorkInt(jiaindex,"战斗索引")
							if watchbattleindex > -1 then
								battle.Exit(jiaindex,watchbattleindex)
							end
							battle.NewEntry(jiaindex,tempbattleindex,0)
						end
					end
				end
			end
		end
	else
		npc.DelNpc(meindex)
		num = num - 1
		if num < 0 then
			num = 0
		end
	end
end

--NPC重叠事件(NPC索引， 玩家索引)
function Overlap(meindex, toindex)
	--print("\nmeindex=" .. meindex .. ",toindex=" .. char.getInt(toindex,"类型") .."\n")
	if char.getInt(toindex,"类型") == 1 and char.getWorkInt(toindex,"组队") < 2 then
		--战斗宠物数组，设置战斗的宠物ID,最大10只
		for i=1,10 do
			enemytable[i] = npcdata[math.random(table.getn(npcdata))][3]
		end
		local TM_battleindex = battle.CreateVsEnemy(toindex, meindex, enemytable)
		if char.getWorkInt(toindex,"组队") == 0 then
			char.setWorkInt(toindex,"NPC临时2",other.time() + 120)
		else
			for i=1,5 do
				local partyindex = char.getWorkInt(toindex,"队员" .. i)
				if char.check(partyindex) == 1 then
					char.setWorkInt(partyindex,"NPC临时2",other.time() + 120)
				end
			end
		end
		char.setWorkInt(meindex,"NPC临时2",TM_battleindex)
		battle.setBattlePaiType(TM_battleindex,0)
	end
end

--NPC战斗结束事件(NPC索引， 战斗索引，赢败)
function BattleOver(meindex, battleindex, iswin)
		--当NPC输了
		if iswin == 1 then
			for i=0, 4 do
				local charaindex = battle.getCharOne(battleindex, i, 0)
				if char.check(charaindex) == 1 then
					if char.getWorkInt(charaindex,"NPC临时2") < other.time() then
						local jiangrnd = math.random(1,100)
						local jiangtype = 3
						local jiangnum = math.random(1,50)
						local jiangtmp = {"点劵","声望","活力"}
						if jiangrnd <= 50 then
							jiangtype = 3
						elseif jiangrnd <= 80 then
							jiangtype = 2
						else
							jiangtype = 1
						end
						--[[if jiangtype == 1 then
							sasql.setVipPoint(charaindex,sasql.getVipPoint(charaindex) + jiangnum)
						elseif jiangtype == 2 then
							char.setInt(charaindex,"声望",char.getInt(charaindex,"声望") + jiangnum * 100)
						else
							char.setInt(charaindex,"活力",char.getInt(charaindex,"活力") + jiangnum)
						end]]
						local itemrand = math.random(100)
						if other.time() < 1549209600 or other.time() > 1549814399 then	
							itemrand1 = 100
						else
							itemrand1 = 85 
						end
						
						if itemrand >= itemrand1 then
							local TM_ItemIndex = npc.AddRandItem(charaindex, giveitemid2)
							if TM_ItemIndex > -1 then
								char.talkToServer(-1,"[江湖传闻] 玩家 [" .. char.getChar(charaindex, "名字") .. "] 在龙域战斗中掉落宝物 [" .. item.getChar(TM_ItemIndex,"显示名") .. "]", "随机色")
							else
								char.TalkToCli(charaindex, -1, "[温馨提示]您身上的道具已满，建议您空一栏哦！", "随机色")
							end
						end
						--[[if npc.Free(-1,charaindex,"NOWEV=251&ENDEV!=252&ITEM=26101&ITEM!=26102") == 1 then
							if math.random(100) <= 30 then
								char.Additem(charaindex,26102)
							end
						end]]
						--char.talkToServer(-1, "[龙域快讯]勇者 " .. char.getChar(charaindex, "名字") .. " 成功击败 " .. char.getChar(meindex, "名字") .. " 获得[" .. jiangnum .. "]" .. jiangtmp[jiangtype], "随机色")
					else
						char.TalkToCli(charaindex, -1, "[温馨提示]您战斗速度过快，无法获得奖励哦。", "随机色")
					end
				end
			end

			npc.DelNpc(meindex)
			num = num - 1
			killnum = killnum + 1
			if num < 0 then
				num = 0
			end
		else
			char.setWorkInt(meindex,"NPC临时2",-1)
		end
end

--NPC战斗结束事件(NPC索引， 战斗索引，赢败)
function BattleOverBoss(meindex, battleindex, iswin)
		--当NPC输了
	if bossdie == 0 and start > -1 then
		if iswin == 1 then
			bossdie = 1
			for i=0, 4 do
				local charaindex = battle.getCharOne(battleindex, i, 0)
				if char.check(charaindex) == 1 then
					if string.len(char.getChar(charaindex,"伤害BUFF")) > 1 then
						local damagebuff = char.getChar(charaindex,"伤害BUFF")
						local damageup = other.atoi(other.getString(damagebuff,"-",1))
						local damagetime = other.atoi(other.getString(damagebuff,"-",2))
						if other.time() < 1549209600 or other.time() > 1549814399 then		
							local daynum = 2
						else
							local daynum = 4
						end
						if damagetime < other.time() then
							char.setChar(charaindex,"伤害BUFF","8-" .. other.time() + 86400 * daynum)
						else
							char.setChar(charaindex,"伤害BUFF","8-" .. damagetime + 86400 * daynum)
						end
					else
						char.setChar(charaindex,"伤害BUFF","8-" .. other.time() + 86400 * daynum)
					end
					char.talkToServer(-1,"[龙域副本]神一样的勇士 " .. char.getChar(charaindex, "名字") .. " 击败了龙王[烈焰神龙]，获得BUFF屠龙者的荣誉[2天]", "随机色")
					other.CallFunction("othertitleuse","data/ablua/chartitle.lua",{charaindex,47})
					char.newMessageToCli(charaindex, -1, "获得屠龙者荣耀称号", "白色")
				end
			end
			local maxplayer = char.getPlayerMaxNum() - 1
			local TM_index = {-1,-1,-1}
			for i=0,maxplayer do
				if char.check(i) == 1 then
					if char.getChar(i,"账号") == cdkey1 and char.getChar(i,"名字") == charname1 then
						local TM_ItemIndex = npc.AddRandItem(i, giveitemid[1])
						if TM_ItemIndex > -1 then
							char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage1 .. "伤害[排名第一] 获得[" .. item.getChar(TM_ItemIndex,"显示名") .. "]。", "随机色")
						else
							char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage1 .. "伤害[排名第一] 身上道具数量已满，所以无法获得奖品。", "随机色")
							char.TalkToCli(i, -1, "[温馨提示]您身上的道具已满了，奖励道具消失了！", "随机色")
						end
						TM_index[1] = i
					elseif char.getChar(i,"账号") == cdkey2 and char.getChar(i,"名字") == charname2 then
						local TM_ItemIndex = npc.AddRandItem(i, giveitemid[2])
						if TM_ItemIndex > -1 then
							char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage2 .. "伤害[排名第二] 获得[" .. item.getChar(TM_ItemIndex,"显示名") .. "]。", "随机色")
						else
							char.talkToServer(-1, "[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage2 .. "伤害[排名第二] 身上道具数量已满，所以无法获得奖品。", "随机色")
							char.TalkToCli(i, -1, "[温馨提示]您身上的道具已满了，奖励道具消失了！", "随机色")
						end
						TM_index[2] = i
					elseif char.getChar(i,"账号") == cdkey3 and char.getChar(i,"名字") == charname3 then
						local TM_ItemIndex = npc.AddRandItem(i, giveitemid[3])
						if TM_ItemIndex > -1 then
							char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage3 .. "伤害[排名第三] 获得[" .. item.getChar(TM_ItemIndex,"显示名") .. "]。", "随机色")
						else
							char.talkToServer(-1,"[龙域副本]勇者 " .. char.getChar(i, "名字") .. " 在龙域作战中对BOSS造成" .. damage3 .. "伤害[排名第三] 身上道具数量已满，所以无法获得奖品。", "随机色")
							char.TalkToCli(i, -1, "[温馨提示]您身上的道具已满了，奖励道具消失了！", "随机色")
						end
						TM_index[3] = i
					end
				end
			end
			for i=1,3 do
				if TM_index[i] == -1 then
					if i == 1 then
						char.talkToServer(-1,"[龙域副本]勇者 " .. charname1 .. " 在本次龙域作战中伤害排名第一，因不在线，所以无法获得奖品，好可惜啊！", "随机色")
					elseif i == 2 then
						char.talkToServer(-1,"[龙域副本]勇者 " .. charname2 .. " 在本次龙域作战中伤害排名第二，因不在线，所以无法获得奖品，好可惜啊！", "随机色")
					elseif i == 3 then
						char.talkToServer(-1,"[龙域副本]勇者 " .. charname3 .. " 在本次龙域作战中伤害排名第三，因不在线，所以无法获得奖品，好可惜啊！", "随机色")
					end
				end
			end
			npc.DelNpc(meindex)
			start = -1
			gmstart = 0
			for i=1,table.getn(bossbattleindex) do
				if battleindex ~= bossbattleindex[i] then
					for j=0, 4 do
						local enemyindex = battle.getCharOne(bossbattleindex[i], j, 0)
						if char.check(enemyindex) == 1 then
							if char.getInt(enemyindex,"类型") == 1 then
								battle.Exit(enemyindex,bossbattleindex[i])
								char.TalkToCli(enemyindex, -1, "[温馨提示]BOSS已被其他玩家消灭，战斗结束。", "随机色")
							end
						end
					end
				end
			end
			bossbattleindex = {}
		else
			for i=1,table.getn(bossbattleindex) do
				if battleindex == bossbattleindex[i] then
					table.remove(bossbattleindex, i)
					break
				end
			end
		end
	end
end


function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "龙域接引人|玩家可在活动日10至22点\n参加详情可看说明|4|进入龙域副本|累计击杀数量|合成守护光环|查看副本说明"
		lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
		--lssproto.windows(talkerindex, "对话框", "取消", 0, -1, "\n\n\n\n                 活动暂未开放")
		--char.TalkToCli(talkerindex, -1, "活动还没开始", "随机色")
		return
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		id = other.atoi(data)
		if id == 1 then
			if start > 0 then
				--[[if char.getWorkInt(talkerindex,"组队") ~= 0 then
					char.TalkToCli(talkerindex, -1, "请不要组队进入哦。", "随机色")
					return
				end
				local MaxPlayer = char.getPlayerMaxNum() - 1
				local charnum = 0
				for i=0,MaxPlayer do
					if char.check(i) == 1 then
						if char.getInt(i,"地图号") == floorid and char.getWorkChar(i,"MAC") == char.getWorkChar(talkerindex,"MAC") and char.getWorkChar(i,"MAC2") == char.getWorkChar(talkerindex,"MAC2") then
							charnum = charnum + 1
							if charnum >= 2 then
								char.TalkToCli(talkerindex, -1, "您已经有两个账号在龙域了哦。", "随机色")
								return
							end
						end
					end
				end]]
				char.AllWarpToSpecificPoint(talkerindex, floorid, 50, 50)
			else
				token = "                   " .. char.getChar(meindex,"名字") .. "\n\n"
					 .. "\n　　　　　　 〈 目前龙域尚未开放 〉\n\n　　龙域开放日为每周二、周五\n　　挑战龙域可以得到丰富的能量晶石和宝物"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				--char.TalkToCli(talkerindex, -1, "活动还没开始", "随机色")
				return
			end
		elseif id == 2 then
			if start > 0 then
				token = "                   " .. char.getChar(meindex,"名字") .. "\n\n"
					.. "\n              当前击杀幼龙数量为：" .. killnum .. "\n\n      击杀数量达到50时会触发刷新世界BOSS\n      击杀数量达不到50时会减半累计到次日"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			else
				token = "                   " .. char.getChar(meindex,"名字") .. "\n\n"
					 .. "\n　　　　　　 〈 目前龙域尚未开放 〉\n\n　　龙域开放日为每周二、周五\n　　挑战龙域可以得到丰富的能量晶石和宝物"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		elseif id == 3 then
			token = "守护光环||4|大地守护系列|海神守护系列|烈焰守护系列|疾风守护系列"
			lssproto.windows(talkerindex, "新选择框", "取消", 1, char.getWorkInt( meindex, "对象"), token)
		elseif id == 4 then
			ShowReadMe(meindex, talkerindex, 0)
		end
	elseif seqno == 1 then
		id = other.atoi(data)
		if id < 1 or id > 4 then
			return
		end
		local tempbuff = {"大地","海神","烈焰","疾风"}
		token = "守护光环||3|" .. item.getNameFromNumber(itemid[id][1])
						.."|" .. item.getNameFromNumber(itemid[id][2])
						.."|" .. item.getNameFromNumber(itemid[id][3])
		lssproto.windows(talkerindex, "新选择框", "取消", id + 10, char.getWorkInt( meindex, "对象"), token)
	elseif seqno >= 11 and seqno <= 14 then
		id = seqno - 10
		selectid = other.atoi(data)
		if selectid < 1 or selectid > 3 then
			return
		end
		token = "               守护光环的升级与合成\n"
			 .. "\n合成 [" .. item.getNameFromNumber(itemid[id][selectid]) .. "] 需要以下条件\n"
			 .. "\n道具：" .. item.getNameFromNumber(itemid2[id][selectid][1]) .. " * " .. itemid2[id][selectid][2]
			 .. " + 声望[" .. itemfame[id][selectid].. "]\n"
		if selectid > 1 then
			token = token .. "\n已经穿戴过的守护光环无法继续升级合成！\n"
		end
		token = token .. "\n确认合成请点击 [确认] 按钮。"
		lssproto.windows(talkerindex, "对话框", "确定|取消", id * 100 + selectid, char.getWorkInt( meindex, "对象"), token)
	elseif seqno >= 101 and seqno <= 403 then
		if select ~= 1 then
			return
		end
		id = math.floor(seqno / 100)
		selectid = seqno % 100
		if selectid < 1 or selectid > 3 then
			return
		end
		local tempitemnum = 0
		for k=9,23 do
			local tempitemindex = char.getItemIndex(talkerindex, k)
			if item.check(tempitemindex) == 1 then
				if item.getInt(tempitemindex,"序号") == itemid2[id][selectid][1] and item.getInt(tempitemindex,"物品时间") <= 0 then
					tempitemnum = tempitemnum + 1
				end
			end
		end
		if tempitemnum < itemid2[id][selectid][2] then
			char.TalkToCli(talkerindex, -1, "您的身上没有" .. itemid2[id][selectid][2] .. "个道具[" .. item.getNameFromNumber(itemid2[id][selectid][1]) .. "]", "随机色")
			return
		end
		if char.getInt(talkerindex,"声望") < itemfame[id][selectid] * 100 then
			char.TalkToCli(talkerindex, -1, "您的声望不足" .. itemfame[id][selectid], "随机色")
			lssproto.windows(talkerindex, 1038, 0, -1, -1, "3")
			return
		end
		tempitemnum = 0
		for k=9,23 do
			local tempitemindex = char.getItemIndex(talkerindex, k)
			if item.check(tempitemindex) == 1 then
				if item.getInt(tempitemindex,"序号") == itemid2[id][selectid][1] and item.getInt(tempitemindex,"物品时间") <= 0 then
					if tempitemnum < itemid2[id][selectid][2] then
						char.DelItem(talkerindex,k)
						tempitemnum = tempitemnum + 1
					else
						break
					end
				end
			end
		end
		char.TalkToCli(talkerindex, -1, "交出" .. itemid2[id][selectid][2] .. "个道具[" .. item.getNameFromNumber(itemid2[id][selectid][1]) .. "]", "随机色")
		char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - itemfame[id][selectid] * 100)
		char.TalkToCli(talkerindex, -1, "扣除声望 " .. itemfame[id][selectid], "随机色")
		char.Additem(talkerindex, itemid[id][selectid])
		char.TalkToCli(talkerindex, -1, "恭喜您合成了一个[" .. item.getNameFromNumber(itemid[id][selectid]) .. "]，此道具使用后绑定人物且无法用于升级合成，切记！","随机色")
	elseif seqno >= 1100 and seqno < 2000 then
		id = seqno - 1100
		if select == 16 then
			ShowReadMe(meindex, talkerindex, id - 1)
		elseif select == 32 then
			ShowReadMe(meindex, talkerindex, id + 1)
		end
	end
end

function TalkedBoss(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "                    『烈焰神龙』\n\n"
						.."\n    竟敢向龙族出手？本王亲自会会你！"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalkedBoss ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		for i=4,10 do
			bossenemyid[i] = npcdata[math.random(4)][3]
		end
		local bossbattleindextemp = battle.CreateVsEnemy(talkerindex, meindex, bossenemyid)
		if battle.checkindex(bossbattleindextemp) == 1 then
			local TM_type = {"地","水","火","风"}
			for i=0, 9 do
				local enemyindex = battle.getCharOne(bossbattleindextemp, i, 1)
				if char.check(enemyindex) == 1 then
					char.setInt(enemyindex,TM_type[math.random(4)],100)
				end
			end
			bossbattleindex[table.getn(bossbattleindex) + 1] = bossbattleindextemp
		end
	end
end

function TalkedQuery(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if start > 0 then
			token = "龙域万事通||4|查询伤害积分|查询幼龙数量|累计击杀数量|补充全部能量"
			lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
		else
			token = "                   " .. char.getChar(meindex,"名字") .. "\n\n"
					 .. "\n　　　　　　 〈 目前龙域尚未开放 〉\n\n　　龙域开放日为每周二、周五\n　　挑战龙域可以得到丰富的能量晶石和宝物"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		end
	end
end

function WindowTalkedQuery ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		local querynum = other.atoi(data)
		if querynum == 1 then
			token = "                　「 龙域万事通 」\n"
						.."以下是伤害排行：\n"
						.."       第一名：" .. charname1 .. "," .. damage1 .. "\n"
						.."       第二名：" .. charname2 .. "," .. damage2 .. "\n"
						.."       第三名：" .. charname3 .. "," .. damage3 .. "\n"
						.."       第四名：" .. charname4 .. "," .. damage4 .. "\n"
						.."       第五名：" .. charname5 .. "," .. damage5 .. "\n"
						.."       您的伤害值为：" .. char.getInt(talkerindex,"伤害积分")
			lssproto.windows(talkerindex, "对话框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
		elseif querynum == 2 then
			token = "                　「 龙域万事通 」\n\n"
						.."\n    目前在龙域活动的幼龙小队数量为：" .. num .. "\n"
			lssproto.windows(talkerindex, "对话框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
		elseif querynum == 3 then
			token = "                　「 龙域万事通 」\n\n"
				 .. "\n              当前击杀幼龙数量为：" .. killnum .. "\n\n      击杀数量达到50时会触发刷新世界BOSS\n      击杀数量达不到50时会减半累计到次日"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		elseif querynum == 4 then
			char.setInt(talkerindex,"HP",char.getWorkInt(talkerindex,"最大HP"))
			char.setInt(talkerindex,"MP",char.getWorkInt(talkerindex,"最大MP"))
			char.Updata(talkerindex,"HP")
			char.Updata(talkerindex,"MP")
			for i=0,4 do
				local mypetindex = char.getCharPet(talkerindex,i)
				if char.check(mypetindex) == 1 then
					char.setInt(mypetindex,"HP",char.getWorkInt(mypetindex,"最大HP"))
					char.sendStatusString(talkerindex, "K" .. i)
				end
			end
			char.TalkToCli(talkerindex, -1, "已帮您恢复所有能量。", "随机色")
		end
	end
end

function Create(name, metamo, floorid, x, y, id,npctype)
	index = npc.CreateNpc(name, metamo, floorid, x, y, 0)
	if char.check(index) == 1 then
		if npctype == 1 then
			char.setFunctionPointer(index, "对话事件", "Talked", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalked", "")
			char.setFunctionPointer(index, "循环事件", "Loop", "")
			char.setInt(index, "循环事件时间", 60000)
		elseif npctype == 2 then
			num = num + 1
			char.setFunctionPointer(index, "循环事件", "EnemyLoop", "")
			char.setFunctionPointer(index, "重叠事件", "Overlap", "")
			char.setFunctionPointer(index, "战后事件", "BattleOver", "")
			char.setWorkInt(index,"NPC临时2",-1)
			char.ToAroundChar(index)
		elseif npctype == 3 then
			char.setFunctionPointer(index, "对话事件", "TalkedBoss", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalkedBoss", "")
			char.setFunctionPointer(index, "战后事件", "BattleOverBoss", "")
			char.setFunctionPointer(index, "循环事件", "BossLoop", "")
			char.ToAroundChar(index)
		elseif npctype == 4 then
			char.setFunctionPointer(index, "对话事件", "TalkedQuery", "")
			char.setFunctionPointer(index, "窗口事件", "WindowTalkedQuery", "")
		end
	end
end

function longyu(charaindex, data)
	local TM_data = other.atoi(data)
	if TM_data == 0 then
		start = -1
		char.TalkToCli(charaindex, -1, "龙域已经关闭", "青色")
	else
		if start == -1 then
			start = 0
		end
		gmstart = 1
		char.TalkToCli(charaindex, -1, "龙域已经开启", "青色")
	end
end

function data()
	floorid = 12222
	location = {{60,39},{60,46},{60,52},{60,58},{66,56},{61,45},{67,42},{48,39},{49,46},{54,48},{49,67},{55,49},{51,44},{61,38}
						}

	npcdata = {{"烈焰幼龙", 105056, 4504}
						,{"地裂幼龙", 105058, 4505}
						,{"疾风幼龙", 105057, 4506}
						,{"寒冰幼龙", 105055, 4507}
						}

	enemytable = {enemyid, -1, -1, -1, -1, -1, -1, -1, -1, -1}
	bossenemyid = {4501,4502,4503,-1,-1,-1,-1,-1,-1,-1}
	
	TM_ReadMe = {
					"           ≡ 屠龙副本说明 ≡\n\n这个是个大型全民参与的副本.尚在测试中.\n每周二、周五18点开放，活动时间2小时.\n活动开始后可以在里面遇到各种龙族.\n活动开始每隔30分钟刷新20只怪物.\n战胜所有小怪或活动最后15分钟时会刷新世界BOSS.\n勇敢的挑战吧！",
					"           ≡ 幼龙挑战说明 ≡\n\n一波幼龙都是10只，所以建议五人组队挑战。\n杀死幼龙还有几率掉出龙域特产的宝物哦。\n场内禁止使用守护精灵和属性精灵。\n挑战的时候注意怪物的属性哟！",
					"           ≡ 世界BOSS说明 ≡\n\n活动开启后的最后15分钟会刷新BOSS.\n非常强力的BOSS，不可以HELP！\n杀死世界BOSS的玩家可以获得\n限时两天的[BUFF]及称号“屠龙者荣誉”\n可以提供8%的伤害增益.\n对BOSS造成伤害最多的三名玩家，还有神秘礼物哦！",
					"           ≡ 世界BOSS说明 ≡\n\n友情提示：BOSS的属性不是一成不变的哦.\n　　　　　具体的在游戏中体验吧！\n\n         记得好的好喊朋友一起来玩哦!"
				}
	maxpage = table.getn(TM_ReadMe) - 1
	giveitemid = {"25101,25111,25121,25131","25101,25111,25121,25131,25100,25100","25100,25100,25100,25100"}
	giveitemid2 = "25100,25100,25100,25100"
	itemid = {{25101,25102,25103},{25111,25112,25113},{25121,25122,25123},{25131,25132,25133}}
	itemid2 = {{{25100,5},{25101,2},{25102,2}},{{25100,5},{25111,2},{25112,2}},{{25100,5},{25121,2},{25122,2}},{{25100,5},{25131,2},{25132,2}}}
	itemfame = {{300,500,800},{300,500,800},{300,500,800},{300,500,800}}
end

function main()
	start = -1
	bossbattleindex = {}
	cdkey1 = ""
	charname1 = ""
	damage1 = 0
	cdkey2 = ""
	charname2 = ""
	damage2 = 0
	cdkey3 = ""
	charname3 = ""
	damage3 = 0
	cdkey4 = ""
	charname4 = ""
	damage4 = 0
	cdkey5 = ""
	charname5 = ""
	damage5 = 0
	killnum = 0
	todaydate = ""
	num = 0
	bossdie = 0
	gmstart = 0
	data()
	if config.getGameservername() == "娱乐互动线" then
		Create("龙域接引人",60186,100,49,474,0,1)
		Create("龙域万事通",16326,12222,55,46,0,4)
	end
	magic.addLUAListFunction("longyu", "longyu", "", 1, "[longyu 0/1]")
end


