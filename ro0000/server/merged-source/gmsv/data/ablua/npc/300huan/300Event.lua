function BattleOver(meindex, battleindex, iswin)
	if iswin == 1 then
		if char.check(meindex) == 1 then
			local charaindex = battle.getCharOne(battleindex, 0, 0)
			local itemstr = getitemdata(char.Finditem(charaindex,30500))[4]
			if itemstr == 30502 then
				npc.AddItem(charaindex, 30502)
				npc.DelNpc(meindex)
				Create1("狡猾的强盗", npc1, 41001)
			elseif itemstr == 30503 then
				npc.AddItem(charaindex, 30503)
				npc.DelNpc(meindex)
				Create2("恶毒的强盗", npc2, 41001)
			elseif itemstr == 30504 then
				npc.AddItem(charaindex, 30504)
				npc.DelNpc(meindex)
				Create3("凶狠的强盗", npc3, 41001)
			end
		end
	end
end

function Chance2get(num)
    local chance1 = {}
    for i=1,num do
        local Rndnum = math.random(100)
        table.insert(chance1,Rndnum)
    end
    local fault = math.random(100)
    for i=1,#chance1 do
        if fault == chance1[i] then
            return true
        end
    end
    return false
end

function getitemdata(itemindex)
	local itemstr = {}
	local strdata = item.getChar(itemindex, "字段")
	for i=1,5 do
		table.insert(itemstr, other.atoi(other.getString(strdata, "|", i)))
	end
	return itemstr
end

function getdetail(meindex,talkerindex,itemindex)
	local EventNum = getitemdata(itemindex)[1]
	local EventType = math.random(1,5);
	local request = 0
	local enemyname = ""
	if EventType == 5 then
		EventType = 1
	elseif EventType == 2 then
		request = NeedPet[math.random(#NeedPet)]
	elseif EventType == 3 then
		if EventNum > 199 then
			request = NeedItem3[math.random(#NeedItem3)]
		elseif EventNum > 99 then
			request = NeedItem2[math.random(#NeedItem2)]
		else
			request = NeedItem[math.random(#NeedItem)]
		end
	elseif EventType == 4 then
		if EventNum > 199 then
			request = 30504
			enemyname = "凶狠的强盗"
		elseif EventNum > 99 then
			request = 30503
			enemyname = "恶毒的强盗"
		else
			request = 30502
			enemyname = "狡猾的强盗"
		end
	end
	local NpcNum = math.random(2,9)
	while NpcNum == getitemdata(itemindex)[2] do
		NpcNum = math.random(2,9)
	end
	EventNum = EventNum+1
	local token ="\n[style c=10]                     第[/style][style c=6]"..EventNum.."[/style][style c=10]环[/style]\n"
	item.setChar(itemindex,"字段",EventNum.."|"..NpcNum.."|"..EventType.."|"..request.."|"..os.time());
	item.UpdataItemOne(talkerindex, itemindex)
	if EventType == 1 then
	 	token = token.."\n[style c=10]            麻烦你到[/style][style c=4]"..map.getFloorName(npcdata[NpcNum][3])..npcdata[NpcNum][4]..","..npcdata[NpcNum][5].."[/style]"        
		.."\n[style c=10]            给[/style][style c=1]"..npcdata[NpcNum][1].."[/style][style c=10]捎个口信[/style]"
	elseif EventType == 2 then
		token = token.."\n[style c=1]             "..npcdata[NpcNum][1].."[/style][style c=10]需要一只[/style][style c=5]"..enemytemp.getEnemyTempNameFromEnemyID(request).."[/style]"
		.."\n[style c=10]        麻烦你到[/style][style c=4]"..map.getFloorName(npcdata[NpcNum][3])..npcdata[NpcNum][4]..","..npcdata[NpcNum][5].."[/style][style c=10]交给他吧[/style]\n"
	elseif EventType == 3 then
		token = token.."\n[style c=1]              "..npcdata[NpcNum][1].."[/style][style c=10]需要[/style][style c=5]"..item.getNameFromNumber(request).."[/style]"
		.."\n[style c=10]        麻烦你到[/style][style c=4]"..map.getFloorName(npcdata[NpcNum][3])..npcdata[NpcNum][4]..","..npcdata[NpcNum][5].."[/style][style c=10]交给他吧[/style]\n"
	else
		token = token.."\n[style c=1]          "..npcdata[NpcNum][1].."[/style][style c=10]的[/style][style c=5]"..item.getNameFromNumber(request).."[/style][style c=10]被[/style][style c=2]"..enemyname.."[/style][style c=10]抢走了[/style]"
		.."\n[style c=10]               如果你能帮忙寻找回来[/style]"
		.."\n[style c=10]             请到[/style][style c=4]"..map.getFloorName(npcdata[NpcNum][3])..npcdata[NpcNum][4]..","..npcdata[NpcNum][5].."[/style][style c=10]交给他吧[/style]\n"
	end
	lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt( meindex, "对象"), token);
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if char.getWorkInt(meindex, "NPC临时1") == 1 then
			local token = "3\n                『" .. char.getChar(meindex, "名字") .. "』"
			.. "\n[style c=10]如果你有足够的耐心，我这里有个300环的任务[/style]"
			.. "\n          [style c=10]不知道你是否有兴趣？[/style]"
			.. "\n          [style c=6]    【接受任务】 [/style]"
			.. "\n          [style c=1]    【更换任务】 [/style]"
			.. "\n          [style c=5]    【封存任务】 [/style]"
			.. "\n          [style c=2]    【解封任务】 [/style]"
			lssproto.windows(talkerindex, 2, 8, 0, char.getWorkInt( meindex, "对象"), token);
		elseif char.Finditem(talkerindex,30500) > 0 then
			local NpcNo = getitemdata(char.Finditem(talkerindex,30500))[2]
			local JobType = getitemdata(char.Finditem(talkerindex,30500))[3]
			local Eventfault = os.time()-getitemdata(char.Finditem(talkerindex,30500))[5]
			if math.ceil((2400-Eventfault)/60) >= 0 then
				if char.getWorkInt(meindex, "NPC临时1") == NpcNo and JobType == 1 then
					local token = "\n\n"
				    .."                [style c=10]原来是这么回事[/style]\n"
				    .."                  [style c=10]真是感谢你[/style]\n"
				    .."               [style c=10]想不到竟发生了这些事[/style]"
					lssproto.windows(talkerindex, 0, 12, 2, char.getWorkInt( meindex, "对象"), token);
				elseif char.getWorkInt(meindex, "NPC临时1") == NpcNo and JobType == 2 then
					lssproto.windows(talkerindex, 3, 8, 3, char.getWorkInt( meindex, "对象"), "请选择宠物");
				elseif char.getWorkInt(meindex, "NPC临时1") == NpcNo and JobType == 3 then
					local ItemName = item.getNameFromNumber(getitemdata(char.Finditem(talkerindex,30500))[4])
					local token = "\n\n"
					.."                     [style c=10]急死我了[/style]\n"
				    .."                  [style c=10]我的[/style][style c=5]"..ItemName.."[/style][style c=10]丢了[/style]\n"
				    .."                  [style c=10]这下可怎么好啊[/style]"
					lssproto.windows(talkerindex, 0, 12, 4, char.getWorkInt( meindex, "对象"), token);
				elseif char.getWorkInt(meindex, "NPC临时1") == NpcNo and JobType == 4 then		
					local ItemName = item.getNameFromNumber(getitemdata(char.Finditem(talkerindex,30500))[4])
					local token = "\n\n"
				 		.."                  [style c=10]这该死的强盗[/style]\n"
				 		.."               [style c=10]把我的[/style][style c=5]"..ItemName.."[/style][style c=10]抢走了[/style]\n"
				 		.."            [style c=10]让我再见到他，一定要让他好看[/style]"
					lssproto.windows(talkerindex, 0, 12, 5, char.getWorkInt( meindex, "对象"), token);
				else
					local token = "\n\n"
					.."           [style c=10]风继续吹~[/style]\n"
				 	.."           [style c=10]不忍远离~[/style]\n"
				 	.."           [style c=10]心里亦有泪~[/style]\n"
				  	.."           [style c=10]不愿流泪望着你~~~[/style]"
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
				end
			else
				npc.DelItem(talkerindex, 30500)
				npc.EvClr(talkerindex,"240") 
			end
		else
			local token = "\n\n"
			.."             [style c=10]风继续吹~[/style]\n"
			.."             [style c=10]不忍远离~[/style]\n"
			.."             [style c=10]心里亦有泪~[/style]\n"
			.."             [style c=10]不愿流泪望着你~~~[/style]"
			lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
		end
	end
end

function Talked1(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 and select == 8 then 
		return;
	end
	if char.Finditem(talkerindex,30500) > 0 then
		if char.Finditem(talkerindex, 30502) < 1 then
			local Eventfault = os.time()-getitemdata(char.Finditem(talkerindex,30500))[5]
			if math.ceil((2400-Eventfault)/60) >= 0 then
				if getitemdata(char.Finditem(talkerindex,30500))[4] == 30502 then
					local token = char.getChar(meindex, "名字") .. "|你是来替那小子\n拿回他的东西吗？\n简直是厕所里点灯\n---找屎|1|〖废话真多〗〗"
					lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
				end
			else
				npc.DelItem(talkerindex, 30500)
				npc.EvClr(talkerindex,"240")
			end
		else
			local token = "\n\n[style c=10]          这次输给你[/style]\n "
						.."\n[style c=10]          完全是我大意了[/style] "
			lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
		end
	else
		local token = "\n\n"
		.."             [style c=10]一追再追~[/style]\n"
		.."             [style c=10]追赶一些生命里~[/style]\n"
		.."             [style c=10]一分一秒~[/style]\n"
		.."             [style c=10]原来多么可笑~~~[/style]"
		lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
	end
end

function WindowTalked1 ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 or select == 8 then
		return;
	end
	if seqno == 0 and other.atoi(data) == 1 then
		local tmnum = 0;
		if char.getWorkInt(talkerindex, "组队") ~= 0 then
			for i = 1, 5 do
				local tmindex = char.getWorkInt(talkerindex, "队员" .. i) 
				if char.check(tmindex) == 1 then
					tmnum = tmnum + 1;
				end
			end
		else
			tmnum = 1
		end
		local enemytable1 = {4330, -1, -1, -1, -1, -1, -1, -1, -1, -1}
		local tmenemytable1 = enemytable1
		for t=2,tmnum*2 do
			tmenemytable1[t] = 4333
		end
		battle.CreateVsEnemy(talkerindex, meindex, tmenemytable1);
		char.TalkToCli(talkerindex, meindex, "想拿走先留下小命吧!哈哈哈哈~~~~", 4);
	end
end

function Talked2(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 then 
		return;
	end
	if char.Finditem(talkerindex,30500) > 0 then
		if char.Finditem(talkerindex, 30503) < 1 then
			local Eventfault = os.time()-getitemdata(char.Finditem(talkerindex,30500))[5]
			if math.ceil((2400-Eventfault)/60) >= 0 then
				if getitemdata(char.Finditem(talkerindex,30500))[4] == 30503 then
					local token = char.getChar(meindex, "名字") .. "|人家叫你来你就来\n其实人家是叫你去送死|1|【精  彩】〗"
					lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
				end
			else
				npc.DelItem(talkerindex, 30500)
				npc.EvClr(talkerindex,"240")
			end
		else
			local token = "\n[style c=10]          不可能，不可能[/style]\n "
						.."\n[style c=10]          我怎么会输给你[/style]\n "
			lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
		end
	else
		local token = "\n"
		.."             [style c=10]风里笑着风里唱~[/style]\n"
		.."             [style c=10]感激天意碰著你~[/style]\n"
		.."             [style c=10]总是苦涩~[/style]\n"
		.."             [style c=10]都变得美~~~[/style]\n"
		lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
	end
end

function WindowTalked2 ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 or select == 8 then
		return;
	end
	if seqno == 0 and other.atoi(data) == 1 then
		local tmnum1 = 0;
		if char.getWorkInt(talkerindex, "组队") ~= 0 then
			for i = 1, 5 do
				local tmindex = char.getWorkInt(talkerindex, "队员" .. i) 
				if char.check(tmindex) == 1 then
					tmnum1 = tmnum1 + 1;
				end
			end
		else
			tmnum1 = 1
		end
		local enemytable2 = {4331, -1, -1, -1, -1, -1, -1, -1, -1, -1}
		local tmenemytable2 = enemytable2;
		for t=2,tmnum1*2 do
			tmenemytable2[t] = 4334
		end
		battle.CreateVsEnemy(talkerindex, meindex, tmenemytable2);
		char.TalkToCli(talkerindex, meindex, "我拿走的东西，就不可能还回去", 4);
	end
end

function Talked3(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 then 
		return;
	end
	if char.Finditem(talkerindex,30500) > 0 then
		if char.Finditem(talkerindex, 30504) < 1 then
			local Eventfault = os.time()-getitemdata(char.Finditem(talkerindex,30500))[5]
			if math.ceil((2400-Eventfault)/60) >= 0 then
				if getitemdata(char.Finditem(talkerindex,30500))[4] == 30504 then
					local token = char.getChar(meindex, "名字") .. "|我并没有之前那两个\n家伙那么啰嗦\n高手一般是没有对白的|1|【不吱声】〗"
					lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
				end
			else
				npc.DelItem(talkerindex, 30500)
				npc.EvClr(talkerindex,"240")
			end
		else
			local token = "\n\n[style c=10]          居然有比我还厉害的人存在[/style]\n "
						.."\n[style c=10]          年轻人，有兴趣加入我们吗？[/style] "
			lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
		end
	else
		local token = "\n\n"
		.."             [style c=10]不信眼泪~[/style]\n"
		.."             [style c=10]能令失落的你爱下去~[/style]\n"
		.."             [style c=10]难收的覆水~[/style]\n"
		.."             [style c=10]将感情慢慢荡开去~~~[/style]"
		lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
	end
end

function WindowTalked3 ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 or select == 8 then
		return;
	end
	if seqno == 0 and other.atoi(data) == 1 then
		local tmnum2 = 0;
		if char.getWorkInt(talkerindex, "组队") ~= 0 then
			for i = 1, 5 do
				local tmindex = char.getWorkInt(talkerindex, "队员" .. i) 
				if char.check(tmindex) == 1 then
				tmnum2 = tmnum2 + 1;
				end
			end
		else
			tmnum2 = 1
		end
		local enemytable3 = {4332, -1, -1, -1, -1, -1, -1, -1, -1, -1}   
		local tmenemytable3 = enemytable3;
		for t=2,tmnum2*2 do
			tmenemytable3[t] = 4335
		end
		battle.CreateVsEnemy(talkerindex, meindex, tmenemytable3);
		char.TalkToCli(talkerindex, meindex, "在我出手前你仍有机会离开", 4);
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) ~= 1 or select == 8 then
		return;
	end
	if seqno == 0 then
		if other.atoi(data) == 1 then
			if char.Finditem(talkerindex, 30500) > 0 then
				char.TalkToCli(talkerindex, -1, "你已经接过任务了，赶快去完成吧", 4);
			else
				local token = "                   『" .. char.getChar(meindex, "名字") .. "』"
				.. "\n    [style c=10]那好吧，完成任务需要一段时间[/style]"
				.. "\n    [style c=10]每一环你会有[/style][style c=6]40[/style][style c=10]分钟的时间[/style]"
				.. "\n    [style c=10]如果超过时间，任务将会失败[/style]"
				.. "\n    [style c=10]我可以帮或[/style][style c=5]封存任务[/style][style c=10]这样你可以过后再继续任务[/style]\n"
				.. "\n    [style c=1]接受任务需要花费[/style][style c=4]50[/style][style c=1]声望[/style][style c=1]和[/style][style c=4]10[/style][style c=1]活力[/style]"
				lssproto.windows(talkerindex, 0, 12, 1, char.getWorkInt( meindex, "对象"), token);
			end
		elseif other.atoi(data) == 2 then
			local token = "\n                  『" .. char.getChar(meindex, "名字") .. "』\n"
			.. "\n        [style c=10]这个任务很困难吧，我可以帮你更换[/style]"
			.. "\n          [style c=10]但需要你支付[/style][style c=4]50[/style][style c=10]声望[/style][style c=10]和[/style][style c=4]20[/style][style c=10]活力[/style]"
			lssproto.windows(talkerindex, 0, 12, 6, char.getWorkInt( meindex, "对象"), token);
		elseif other.atoi(data) == 3 then
			local token = "\n                  『" .. char.getChar(meindex, "名字") .. "』\n"
			.. "\n      [style c=10]任务封存后，你可以永久记录你的环数[/style]"
			.. "\n           [style c=10]但请务必保存好你的信物[/style]"
			.. "\n      [style c=10]封存任务需要支付[/style][style c=4]50[/style][style c=10]声望[/style][style c=10]和[/style][style c=4]20[/style][style c=10]活力[/style]"
			lssproto.windows(talkerindex, 0, 12, 7, char.getWorkInt( meindex, "对象"), token);
		elseif other.atoi(data) == 4 then
			local token = "\n                  『" .. char.getChar(meindex, "名字") .. "』\n"
			.. "\n            [style c=10]如果需要继续任务的话[/style]"
			.. "\n             [style c=10]我可以马上为你解封[/style]"
			lssproto.windows(talkerindex, 0, 12, 8, char.getWorkInt( meindex, "对象"), token);
		end
	elseif seqno == 1 then
		if char.getInt(talkerindex,"声望") < 5000 or char.getInt(talkerindex,"活力") < 10 then
			char.TalkToCli(talkerindex,meindex, "年轻人，如果你有足够声望和活力再来找我吧", 4)
			return
		end
		if char.findEmptyItemBox(talkerindex) == -1 then
			char.TalkToCli(talkerindex,meindex, "请先整理下你的背包吧", 4)
			return
		end
		char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - 5000);
		char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - 10);
		if npc.Free(meindex,talkerindex,"ENDEV=240") == 1 then
			npc.EvClr(talkerindex,"240")
		end
		npc.EvNow(talkerindex,"240")
		npc.AddItem(talkerindex, 30500)
		local itemindex = char.Finditem(talkerindex,30500)
		item.setChar(itemindex,"字段","0|0|0|0|0");
		getdetail(meindex,talkerindex,itemindex)
	elseif seqno > 1 and seqno < 6 then
		local Jobnumber = getitemdata(char.Finditem(talkerindex, 30500))[1]
		local Jobreq = getitemdata(char.Finditem(talkerindex,30500))[4]
		if Jobnumber == 100 or Jobnumber == 200 or Jobnumber == 300 then
			if char.findEmptyItemBox(talkerindex) == -1 then
				char.TalkToCli(talkerindex,meindex, "请先整理下你的背包吧", 4)
				return
			end
		end
		if seqno == 3 then
			local petindex = char.getCharPet(talkerindex,data-1)
			if char.getInt(petindex,"宠ID") == enemytemp.getEnemyTempIDFromEnemyID(Jobreq) and char.check(petindex) == 1 then
				char.DelPet(talkerindex, petindex)
				char.TalkToCli(talkerindex, -1, "交出了"..enemytemp.getEnemyTempNameFromEnemyID(Jobreq), 4);
			else
				return
			end
		elseif seqno == 4 or seqno == 5 then
			if char.Finditem(talkerindex, Jobreq) > 0 then
				npc.DelItem(talkerindex, Jobreq.."*1")
			else
				if seqno == 5 then
					local token = "\n\n[style c=10]         下次我再让我看到他[/style]\n"
								.."[style c=10]         他一定跑不了[/style]"
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
				else
					local token = "\n\n\n[style c=10]                    该怎么办呢[/style]"
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), token);
				end
				return
			end
		end
		if Jobnumber == 100 or Jobnumber == 200 or Jobnumber == 300 then
			if Jobnumber == 100 then
				npc.AddItem(talkerindex,award[math.random(#award)])
			elseif Jobnumber == 200 then
				npc.AddItem(talkerindex,award2[math.random(#award2)])
				itemindex = char.Additem(talkerindex, 30350)
				char.TalkToCli(talkerindex,meindex, "拿到球赛竞猜卡", 4)
				item.setChar(itemindex,"说明","含有100水晶的球赛竞猜卡，可到族战互动线医院进行竞猜")
				item.setChar(itemindex,"字段",100)
				for i=9,23 do
					item.UpdataHaveItemOne(talkerindex,i)
				end
			elseif Jobnumber == 300 then
				npc.EvClr(talkerindex,"240")
				npc.EvEnd(talkerindex,"240")
				npc.DelItem(talkerindex, 30500) 
				local jackpot = Chance2get(2)
				if jackpot then
					local itemindex = char.Additem(talkerindex,28496)
					char.talkToAllServer("玩家 ".. char.getChar(talkerindex, "名字") .. " 通过米尔的300环任务获得了[".. item.getChar(itemindex,"名称") .. "]！",4);
				end
				npc.AddItem(talkerindex,award3[math.random(#award3)])
				char.TalkToCli(talkerindex, -1, "恭喜你完成300环任务", 4)
				return
			end
		end
		getdetail(meindex,talkerindex,char.Finditem(talkerindex, 30500))
	elseif seqno == 6 then	
		if char.Finditem(talkerindex, 30500) > 0 then		
			if char.getInt(talkerindex,"声望") < 5000 or char.getInt(talkerindex,"活力") < 20 then
				char.TalkToCli(talkerindex,meindex, "年轻人，如果你有足够声望和活力再来找我吧", 4)
				return
			end
			local itemindex = char.Finditem(talkerindex, 30500)
			local Eventfault = os.time()-getitemdata(itemindex)[5]
			if math.ceil((2400-Eventfault)/60) >= 0 then
				char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - 5000);
				char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - 20);
				item.setChar(itemindex,"字段",(getitemdata(itemindex)[1]-1).."|0|0|0|0");
				getdetail(meindex,talkerindex,itemindex)
			else
				npc.DelItem(talkerindex, 30500)
				npc.EvClr(talkerindex,"240")
			end
		else
			lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n               [style c=10]你还没有接任务哦[/style]");
		end
	elseif seqno == 7 then	
		if char.Finditem(talkerindex, 30500) > 0 then
			if char.getInt(talkerindex,"声望") < 5000 or char.getInt(talkerindex,"活力") < 20 then
				char.TalkToCli(talkerindex,meindex, "年轻人，如果你有足够声望和活力再来找我吧", 4)
				return
			end
			local Eventfault = os.time()-getitemdata(char.Finditem(talkerindex, 30500))[5]
			if math.ceil((2400-Eventfault)/60) >= 0 then
				char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - 5000);
				char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - 20);
				local EventNum = getitemdata(char.Finditem(talkerindex, 30500))[1]
				npc.DelItem(talkerindex, 30500)
          		local itemindex = char.Additem(talkerindex,30501)
				item.setChar(itemindex,"字段",EventNum);
				local token = "\n\n            [style c=10]你的任务已经为你封存好了[/style]\n"
				.."                  [style c=10]如果需要继续[/style]\n"
				.."                 [style c=10]请记得回来解封[/style]"
				lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt( meindex, "对象"), token);
			else
				npc.DelItem(talkerindex, 30500)
				npc.EvClr(talkerindex,"240") 
			end
		else
			lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=10]你还没有接任务哦[/style]");
		end
	elseif seqno == 8 then
		if char.Finditem(talkerindex, 30501) > 0 then
			local strdata = item.getChar(char.Finditem(talkerindex, 30501), "字段")
			npc.DelItem(talkerindex, 30501) 
			local itemindex = char.Additem(talkerindex, 30500)
			item.setChar(itemindex,"字段",(strdata-1).."|0|0|0|0");
			getdetail(meindex,talkerindex,itemindex)
		else
			lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n               [style c=10]你没有封存过任务哦[/style]");
		end
	end
end

function ITEM_300EVEN(itemindex, charaindex, toindex, haveitemindex)
	local ItemNum = getitemdata(itemindex)[1]
	local ItemNpc = getitemdata(itemindex)[2]
	local ItemType = getitemdata(itemindex)[3]
	local ItemNeed = getitemdata(itemindex)[4]
	local nowtime = os.time()-getitemdata(itemindex)[5]
	local mytime = math.ceil((2400-nowtime)/60)
	local token ="\n[style c=10]                     第[/style][style c=6]"..ItemNum.."[/style][style c=10]环[/style]\n"
	if mytime < 0 then
		char.DelItem(charaindex, haveitemindex)
		char.TalkToCli(charaindex,-1, "你的信物已经过期了", 4)
	else
		if ItemType == 1 then
	    	token = token .."\n[style c=10]            麻烦你到[/style][style c=4]"..map.getFloorName(npcdata[ItemNpc][3])..npcdata[ItemNpc][4]..","..npcdata[ItemNpc][5].."[/style]"        
			.."\n[style c=10]            给[/style][style c=1]"..npcdata[ItemNpc][1].."[/style][style c=10]捎个口信[/style]\n"
		elseif ItemType == 2 then
			token = token .."\n[style c=1]             "..npcdata[ItemNpc][1].."[/style][style c=10]需要一只[/style][style c=5]"..enemytemp.getEnemyTempNameFromEnemyID(ItemNeed).."[/style]"
	    	.."\n[style c=10]        麻烦你到[/style][style c=4]"..map.getFloorName(npcdata[ItemNpc][3])..npcdata[ItemNpc][4]..","..npcdata[ItemNpc][5].."[/style][style c=10]交给他吧[/style]\n"
		elseif ItemType == 3 then
			token = token .."\n[style c=1]              "..npcdata[ItemNpc][1].."[/style][style c=10]需要[/style][style c=5]"..item.getNameFromNumber(ItemNeed).."[/style]"
	    	.."\n[style c=10]        麻烦你到[/style][style c=4]"..map.getFloorName(npcdata[ItemNpc][3])..npcdata[ItemNpc][4]..","..npcdata[ItemNpc][5].."[/style][style c=10]交给他吧[/style]\n"
		elseif ItemType == 4 then
			local enemyname = ""
			if ItemNeed == 30503 then
				enemyname = "恶毒的强盗"
			elseif ItemNeed == 30504 then
				enemyname = "凶狠的强盗"
			else
				enemyname = "狡猾的强盗"
			end
			token = token .."\n[style c=1]          "..npcdata[ItemNpc][1].."[/style][style c=10]的[/style][style c=5]"..item.getNameFromNumber(ItemNeed).."[/style][style c=10]被[/style][style c=2]"..enemyname.."[/style][style c=10]抢走了[/style]"
	    	.."\n[style c=10]               如果你能帮忙寻找回来[/style]"
	    	.."\n[style c=10]             请到[/style][style c=4]"..map.getFloorName(npcdata[ItemNpc][3])..npcdata[ItemNpc][4]..","..npcdata[ItemNpc][5].."[/style][style c=10]交给他吧[/style]\n"
	    end
	    token = token.."\n[style c=0]             距离任务失败还剩[/style][style c=2]"..mytime.."[/style][style c=0]分钟[/style]"
		lssproto.windows( charaindex, 0, 1, -1, char.getWorkInt(npcindex, "对象"),token);
	end
end

function Create(name, metamo, floor, x, y, dir, flg)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir);
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "");
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "");
	char.setWorkInt(npcindex, "NPC临时1", flg)
end

function Create1(name, metamo, floor)
	local randxy = xy[math.random(#xy)]
	while randxy[1] == qd3xy[1] do
		randxy = xy[math.random(#xy)]
	end
	local index1 = npc.CreateNpc(name, metamo, floor, randxy[1], randxy[2], math.random(8))
	char.setFunctionPointer(index1, "对话事件", "Talked1", "")
	char.setFunctionPointer(index1, "窗口事件", "WindowTalked1", "")
	char.setFunctionPointer(index1, "战后事件", "BattleOver", "")
end

function Create2(name, metamo, floor)
	local randxy = xy[math.random(#xy)]
	while randxy[1] == qd1xy[1] do
		randxy = xy[math.random(#xy)]
	end
	local index2 = npc.CreateNpc(name, metamo, floor,randxy[1], randxy[2], math.random(8))
	char.setFunctionPointer(index2, "对话事件", "Talked2", "")
	char.setFunctionPointer(index2, "窗口事件", "WindowTalked2", "")
	char.setFunctionPointer(index2, "战后事件", "BattleOver", "")
end

function Create3(name, metamo, floor)
	local randxy = xy[math.random(#xy)]
	while randxy[1] == qd2xy[1] do
		randxy = xy[math.random(#xy)]
	end
	local index3 = npc.CreateNpc(name, metamo, floor, randxy[1], randxy[2], math.random(8))
	char.setFunctionPointer(index3, "对话事件", "Talked3", "")
	char.setFunctionPointer(index3, "窗口事件", "WindowTalked3", "")
	char.setFunctionPointer(index3, "战后事件", "BattleOver", "")
end

function data()
	npcdata = {
			   {"米尔", 16749, 3000, 108, 67, 6,1}
			  ,{"迷路的孩子", 16805, 5100, 48, 36, 6,2}
			  ,{"吉拉", 16809, 5500, 44, 14, 5,3}
			  ,{"夕姬", 16645, 200, 105, 1011, 4,4}
			  ,{"擂主", 16649, 130, 22, 35, 4,5}
			  ,{"小人鱼", 24970, 400, 35, 127, 4,6}
			  ,{"海底矿工", 24961, 31401, 21, 5, 4,7}
			  ,{"白巫", 24953, 5540, 79, 457, 4,8}
			  ,{"旅者", 24968, 100, 183, 577, 4,9}
			  };

	NeedItem = {10,20,30,50,100,110,120,140,200,210,230,300,310,320,600,610,800,810,820,842,900,914,920,1000,1010,1012,1020,1100,1110,1111,1213,1273,1280,1311,1360,1361,1362,1363,1364,1411};
	NeedItem2 = {60,160,260,360,660,760,850,860,1050,1150,1211,1212,1214
		       ,1410,1412,2613,3030,3060,3090,3120,3150,3630
		       ,3660,3690,3720,3750,4230,4260,4290,4320,4350
		       ,4830,4860,4890,4920,4950,5430,5460,5490,5520,5550
		       ,6030,6060,6090,6120,6150,6630,6660,6690,6720
		       ,6750,7230,7260,7290,7320,7350,7830,7860,7890
		       ,7920,7950,8230,8260,8290,8320,8350,8635,8670
		       ,8705,8740,8790,9135,9170,9205,9240,9290};
	NeedItem3 = {70,80,170,180,270,380,890,990,1180,2613,3210,3240,3810
			   ,3840,4410,4440,5010,5040,5610,5640,6210,6240,6810,6840
			   ,7410,7440,8010,8040}
	NeedPet = {10,11,13,15,16,30,21,25,26,27,36,38,39,42,43,47,56,62,76,317,319,330,352,30,31,32,33,34,35,36,37,38,39,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,75,76,77,307,308,306,305,304,303,315,316,317,319,320,321,322,330,331,332,333,334,335,336,337,338,340,346,347,348,349,350,352,358,359,360,363,356,357,362,28,29}
	xy = {{5,5},{4,5},{4,6},{4,7},{4,8},{4,10},{4,11},{4,12},{4,13},{4,14},{4,16},{4,17},{4,18},{4,19},{5,19},{6,18},{5,18},{5,16},{5,15},{5,13},{5,12},{5,11},{5,8},{5,6},{5,5},{6,5},{6,7},{6,10},{6,13},{6,16},{6,19},{6,20},{7,20},{7,16},{7,13},{7,10},{7,7},{7,4},{8,5},{8,6},{8,8},{8,10},{8,13},{8,15},{8,16},{8,19},{8,20},{9,20},{9,17},{9,14},{9,10},{9,7},{10,6},{14,6},{17,6},{18,7},{18,10},{17,11},{16,11},{16,9},{16,8},{16,7},{15,8},{15,10},{15,12},{14,10},{14,8},{13,8},{13,10},{13,12},{12,11},{12,8},{11,9},{11,12},{10,10},{10,8},{9,9},{9,13},{9,16},{9,20},{10,19},{10,17},{10,15},{11,15},{13,15},{11,14},{14,14},{15,16},{14,18},{15,20},{12,20},{11,22},{13,22},{14,21},{14,23},{12,23},{11,24},{13,24},{14,26},{11,26},{12,28},{14,28},{16,28},{17,27},{18,30},{18,33},{16,33},{15,34},{15,32},{16,30},{14,29},{14,31},{13,34},{11,34},{11,32},{13,32},{14,30},{12,30},{11,33},{10,32},{11,30},{10,28},{8,27},{9,25},{6,24},{4,24},{5,25},{6,27},{4,27},{4,30},{4,34},{5,34},{7,35},{7,31},{9,31},{12,26},{11,25},{13,19},{15,16},{17,15},{18,16},{20,15},{19,18},{17,19},{19,19},{18,22},{18,23},{19,22},{21,21},{21,24},{23,23},{25,24},{25,23},{22,21},{26,21},{24,20},{22,19},{25,19},{25,17},{23,17},{22,15},{23,16},{26,16},{25,15},{23,15},{22,14},{25,14},{25,13},{26,15},{26,13},{24,12},{22,12},{23,11},{26,11},{26,10},{23,10},{22,9},{25,9},{26,8},{23,8},{22,7},{24,7},{26,7},{25,6},{22,6},{23,5},{23,4},{25,5},{27,4},{27,6},{27,7},{28,4},{30,5},{32,5},{31,6},{29,6},{29,7},{32,7},{30,8},{26,8},{27,7},{28,9},{31,9},{31,11},{28,13},{30,12},{31,13},{32,13},{30,13},{28,13},{31,14},{32,15},{31,16},{28,16},{30,17},{32,17},{30,18},{28,19},{31,19},{32,21},{29,21},{28,23},{30,22},{31,23},{30,24},{29,23},{31,24},{32,24},{29,24},{29,26},{31,25},{31,27},{27,28},{32,28},{29,28},{24,28},{22,28},{24,30},{28,31},{23,30},{22,32},{25,31},{24,32},{28,32},{28,33},{26,34},{21,33},{23,34},{23,37},{21,37},{19,38},{17,37},{15,37},{13,37},{11,37},{8,37},{7,37},{5,39},{4,41},{4,40},{4,43},{4,46},{4,44},{4,42},{4,43},{4,45},{4,46},{4,47},{4,49},{4,51},{4,53},{4,54},{5,55},{7,55},{6,54},{5,53},{6,53},{9,53},{9,52},{7,52},{5,52},{6,51},{9,51},{11,51},{12,50},{12,49},{10,49},{7,49},{5,48},{7,48},{10,48},{12,48},{12,47},{11,47},{8,47},{6,47},{5,46},{7,46},{9,46},{12,46},{12,45},{13,45},{12,45},{11,45},{9,45},{8,45},{6,45},{5,44},{5,42},{7,41},{8,42},{9,43},{11,44},{10,44},{11,44},{12,44},{12,43},{11,43},{9,42},{8,40},{8,42},{10,43},{11,42},{12,40},{10,40},{8,41},{12,41},{13,40},{11,39},{13,39},{15,39},{17,39},{19,39},{21,39},{21,41},{18,41},{16,39},{20,40},{26,39},{26,35},{28,34},{29,32},{29,37},{27,41},{26,42},{30,42},{30,45},{28,45},{26,45},{23,45},{21,44},{19,44},{17,44},{16,45},{15,47},{15,51},{15,53},{15,54},{16,55},{18,55},{20,55},{19,54},{17,53},{16,54},{18,53},{19,53},{20,53},{21,52},{21,50},{20,49},{18,49},{17,52},{18,47},{19,47},{21,47},{21,46},{23,46},{24,47},{25,45},{25,47},{25,50},{25,51},{24,51},{24,52},{23,53},{24,55},{25,53},{26,53},{27,55},{29,55},{28,52},{27,51},{26,50},{28,52},{30,50},{30,47},{30,46},{29,44},{30,42},{32,40},{32,36},{34,38},{33,40},{34,41},{36,42},{34,42},{37,39},{37,37},{36,34},{36,32},{35,27},{37,24},{37,26},{38,30},{40,33},{41,36},{39,36},{40,35},{39,40},{37,42},{42,40},{42,41},{41,42},{43,43},{42,46},{40,46},{38,45},{36,45},{35,45},{33,48},{33,49},{33,50},{33,52},{33,53},{33,54},{34,55},{36,55},{37,54},{37,51},{37,47},{39,49},{41,49},{42,50},{43,53},{45,53},{44,54},{42,55},{40,55},{37,55},{39,54},{43,52},{44,52},{45,48},{46,48},{47,49},{47,51},{47,54},{48,55},{50,55},{51,55},{52,55},{53,55},{54,55},{55,54},{55,53},{55,52},{55,50},{55,49},{55,48},{52,49},{52,50},{53,52},{50,53},{52,53},{51,51},{51,47},{51,45},{48,44},{44,43},{44,41},{41,38},{46,39},{47,40},{48,39},{48,36},{48,32},{49,31},{52,32},{53,34},{53,36},{55,36},{57,36},{58,35},{58,33},{58,32},{58,31},{58,29},{58,28},{57,26},{54,27},{55,30},{57,28},{56,29},{57,31},{56,33},{54,34},{54,32},{55,29},{52,29},{49,29},{52,27},{49,28},{46,29},{44,27},{42,25},{44,25},{44,23},{42,23},{43,22},{44,21},{43,20},{42,19},{44,19},{45,18},{43,16},{43,15},{42,14},{44,13},{45,14},{45,16},{46,15},{46,13},{48,14},{48,16},{50,17},{51,18},{50,19},{49,18},{48,19},{47,20},{47,21},{47,24},{48,25},{49,25},{50,24},{51,24},{53,23},{53,22},{54,21},{54,19},{51,19},{49,21},{49,22},{49,23},{51,22},{51,20},{51,19},{53,18},{54,16},{54,13},{52,14},{50,13},{50,12},{51,12},{52,12},{54,12},{54,11},{54,10},{54,8},{54,7},{54,5},{52,5},{50,4},{49,4},{48,4},{47,4},{46,4},{45,4},{44,4},{43,4},{42,4},{41,4},{40,4},{38,4},{37,4},{36,5},{36,7},{36,8},{36,9},{36,10},{36,11},{36,13},{36,15},{36,17},{36,19},{37,20},{38,19},{39,18},{37,18},{37,17},{37,16},{38,16},{39,15},{38,15},{37,15},{38,14},{40,14},{40,13},{39,13},{38,12},{37,11},{39,11},{40,12},{41,11},{39,11},{38,9},{38,8},{39,6},{40,6},{40,8},{42,10},{42,8},{41,7},{44,6},{44,7},{44,8},{45,9},{46,11},{47,11},{48,11},{48,12},{47,9},{43,8},{42,7},{46,7},{48,7},{51,8},{51,12},{51,13},{48,10},{46,9},{50,10},{50,13},{44,16},{42,23},{44,29},{40,35},{36,36},{31,38},{28,38},{24,38},{21,38},{18,38},{12,40},{8,44},{8,51},{12,45},{16,39},{22,36},{25,29},{30,24},{30,19},{30,11},{24,9},{24,16},{19,19},{14,16},{8,13},{7,6}}
	qd1xy = {0,0}
	qd2xy = {0,0}
	qd3xy = {0,0}
	award = {28461};  --100环固定奖励
	award2 = {28461,29082,26077,28448}; --200环随机
	award3 = {28461,29082,28449,28495,22470,21113,29130,29129,29001,27020,22062,23809,29507,23839,23840}; --300环随机
	npc1 = 110603 --强盗1图档
	npc2 = 110507 --强盗2图档
	npc3 = 101987 --强盗3图档
end

function main()
	data();
	for i=1,#npcdata do
		Create(npcdata[i][1], npcdata[i][2], npcdata[i][3], npcdata[i][4], npcdata[i][5], npcdata[i][6], npcdata[i][7]);
	end
	Create1("狡猾的强盗", npc1, 41001)
	Create2("恶毒的强盗", npc2, 41001)
	Create3("凶狠的强盗", npc3, 41001)
	item.addLUAListFunction( "ITEM_300EVEN", "ITEM_300EVEN", "")
end