function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function ShowWindow(meindex, talkerindex, page, maxpage, seqno, token, mytype)
		TM_NowPage = page
		
		if maxpage == 99 then
			button = 8
		elseif maxpage == 1 then
			button = 12
		elseif page == 1 and page < maxpage then
			button = 40
		elseif page > 1 and page < maxpage then
			button = 56
		elseif page == maxpage then
			button = 24
		end
		
		if mytype == 1 then
			lssproto.windows(talkerindex, "新选择框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 2 then
			lssproto.windows(talkerindex, "对话框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 3 then
			lssproto.windows(talkerindex, "输入框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		end
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = char.getChar(meindex,"名字") .. "|骑证兑换|2|永久骑证兑换|骑证碎片抽奖" 
		lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
--	char.talkToServer(meindex, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	
--	if select == 0 and other.atoi(data) == 0 then
--		ShowHead(meindex, talkerindex)
--	end
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if select == 1 then
			lssproto.windows(talkerindex, 1033, "取消", 2, char.getWorkInt( meindex, "对象"), "")
		end
	elseif seqno == 1 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 4 then
			return
		end
		if num == 1 then
			token = char.getChar(meindex, "名字") .. "|兑换|" .. math.min(table.getn(TM_ItemId),7)
			for i=1,math.min(table.getn(TM_ItemId),7) do
				token = token .. "|".. item.getNameFromNumber(TM_ItemId[i][1])
			end
			ShowWindow(meindex, talkerindex, 1, math.ceil(table.getn(TM_ItemId)/7), 101, token, 1)
		elseif num == 2 then
			token = char.getChar(meindex, "名字") .. "|兑换|" .. math.min(table.getn(TM_ItemId2),7)
			for i=1,math.min(table.getn(TM_ItemId2),7) do
				token = token .. "|".. TM_ItemId2[i][1]
			end
			ShowWindow(meindex, talkerindex, 1, math.ceil(table.getn(TM_ItemId2)/7), 201, token, 1)
		end
	elseif seqno == 2 then
		if data == "" then
			return
		end
		if char.getInt(talkerindex, "骑宠") >= 0 then
			char.TalkToCli(talkerindex, -1, "[错误提示]骑乘中的无法更换形象，请下骑后再试。", "随机色")
			return
		end
		if other.getString(data,"|",2) == "" then
			return
		end
		local playerno = other.atoi(other.getString(data,"|",1))
		local playercolor = other.atoi(other.getString(data,"|",2))
		if playerno < 1 or playerno > 12 then
			return
		end
		if playercolor < 1 or playercolor > 4 then
			return
		end
		char.setInt(talkerindex,"图像号",playercolorData[playerno][playercolor])
		char.setInt(talkerindex,"原图像号",playercolorData[playerno][playercolor])
		char.setInt(talkerindex,"头像号",30000 + (playerno - 1) * 100 + (playercolor - 1) * 25)
		char.sendStatusString(talkerindex,"P")
		char.WarpToSpecificPoint(talkerindex, char.getInt(talkerindex,"地图号"), char.getInt(talkerindex,"坐标X"), char.getInt(talkerindex,"坐标Y"))
		char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜您更换为旧版人物形象，原地登出后头像也会发生变化。", "随机色")
	elseif seqno >= 101 and seqno <= 199 then
		TM_NowPage = seqno - 100
		if select == 16 then
			if TM_NowPage == 1 then
				return
			end
			TM_NowPage = TM_NowPage - 1
			token = char.getChar(meindex, "名字") .. "|兑换|" .. math.min(table.getn(TM_ItemId),TM_NowPage * 7)
			for i=TM_NowPage * 7 - 6,math.min(table.getn(TM_ItemId),TM_NowPage * 7) do
				token = token .. "|" .. item.getNameFromNumber(TM_ItemId[i][1])
			end
			ShowWindow(meindex, talkerindex, TM_NowPage, math.ceil(table.getn(TM_ItemId)/7), TM_NowPage + 100, token, 1)
		elseif select == 32 then
			if TM_NowPage >= math.ceil(table.getn(TM_ItemId)/7) then
				return
			end
			TM_NowPage = TM_NowPage + 1
			token = char.getChar(meindex, "名字") .. "|兑换|" .. math.min(table.getn(TM_ItemId),TM_NowPage * 7)
			for i=TM_NowPage * 7 - 6,math.min(table.getn(TM_ItemId),TM_NowPage * 7) do
				token = token .. "|".. item.getNameFromNumber(TM_ItemId[i][1])
			end
			ShowWindow(meindex, talkerindex, TM_NowPage, math.ceil(table.getn(TM_ItemId)/7), TM_NowPage + 100, token, 1)
		else
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > 7 then
				return
			end
			num = TM_NowPage * 7 - 7 + num
			if num < 1 or num > table.getn(TM_ItemId) then
				return
			end
			local rndnum = math.random(101,999)
			char.setWorkInt(talkerindex,"NPC临时1",rndnum)
			token = "\n" 
				 .. "" .. item.getNameFromNumber(TM_ItemId[num][1]) .. " 兑换需要以下材料\n\n        "
				 .. item.getNameFromNumber(TM_ItemId[num][2]) .. " * " .. TM_ItemId[num][3] .. " 个\n\n"
				 .. "请确认兑换的种类后输入验证码：" .. rndnum
			lssproto.windows(talkerindex, "输入框", "确定|取消", 1000 + num, char.getWorkInt( meindex, "对象"), token)
		end
	elseif seqno >= 201 and seqno <= 299 then
		TM_NowPage = seqno - 200
		if select == 16 then
			if TM_NowPage == 1 then
				return
			end
			TM_NowPage = TM_NowPage - 1
			token = char.getChar(meindex, "名字") .. "|抽奖|" .. math.min(table.getn(TM_ItemId2),TM_NowPage * 7)
			for i=TM_NowPage * 7 - 6,math.min(table.getn(TM_ItemId2),TM_NowPage * 7) do
				token = token .. "|".. TM_ItemId2[i][1]
			end
			ShowWindow(meindex, talkerindex, TM_NowPage, math.ceil(table.getn(TM_ItemId2)/7), TM_NowPage + 200, token, 1)
		elseif select == 32 then
			if TM_NowPage >= math.ceil(table.getn(TM_ItemId2)/7) then
				return
			end
			TM_NowPage = TM_NowPage + 1
			token = char.getChar(meindex, "名字") .. "|抽奖|" .. math.min(table.getn(TM_ItemId2),TM_NowPage * 7)
			for i=TM_NowPage * 7 - 6,math.min(table.getn(TM_ItemId2),TM_NowPage * 7) do
				token = token .. "|".. TM_ItemId2[i][1]
			end
			ShowWindow(meindex, talkerindex, TM_NowPage, math.ceil(table.getn(TM_ItemId2)/7), TM_NowPage + 200, token, 1)
		else
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > 7 then
				return
			end
			num = TM_NowPage * 7 - 7 + num
			if num < 1 or num > table.getn(TM_ItemId2) then
				return
			end
			token = "                 " .. char.getChar(meindex, "名字") .. "\n\n" 
				 .. "[" .. TM_ItemId2[num][1] .. "]抽奖一次需要两个骑证碎片\n\n"
				 .. "抽奖有几率得到3天/7天/30天/永久的骑证\n\n没什么问题的话就点击确认 开始抽奖吧"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 2000 + num, char.getWorkInt( meindex, "对象"), token)
		end
	elseif seqno >= 1001 and seqno <= 1999 then
		num = seqno - 1000
		if num < 1 or num > table.getn(TM_ItemId) then
			return
		end
		if select ~= 1 then
			return
		end
		if data == "" then
			return
		end
		yanzhengnum = other.atoi(data)
		if yanzhengnum < 101 or yanzhengnum > 999 then
			return
		end
		if char.getWorkInt(talkerindex,"NPC临时1") ~= yanzhengnum then
			char.TalkToCli(talkerindex, meindex, "验证码输入错误。", "随机色")
			return
		end
		if npc.Free(meindex,talkerindex,"ITEM=" .. TM_ItemId[num][2] .. "*" .. TM_ItemId[num][3]) ~= 1 then
			char.TalkToCli(talkerindex, meindex, "您身上没有" .. TM_ItemId[num][3] .. "个[" .. item.getNameFromNumber(TM_ItemId[num][2]) .. "] 凑齐后再来找我吧！", "随机色")
			return
		end
		if checkEmptItemNum(talkerindex) == 0 then
			char.TalkToCli(talkerindex, meindex, "你身上的道具栏空位不足！", "随机色")
			return
		end
		npc.DelItem(talkerindex,TM_ItemId[num][2] .. "*" .. TM_ItemId[num][3])
		itemindex = char.Additem(talkerindex,TM_ItemId[num][1])
		char.talkToServer(-1, "[大陆新闻]恭喜玩家[" .. char.getChar(talkerindex,"名字") .. "]使用大量骑证碎片成功兑换一张 " .. item.getChar(itemindex,"名称") .. "  #44 从此骑乘[" .. TM_ItemId[num][4] .. "]所向披靡！", "随机色")
	elseif seqno >= 2001 and seqno <= 2999 then
		num = seqno - 2000
		if num < 1 or num > table.getn(TM_ItemId2) then
			return
		end 
		if npc.Free(meindex,talkerindex,"ITEM=23800*2") ~= 1 then
			char.TalkToCli(talkerindex, meindex, "您身上没有2个[" .. item.getNameFromNumber(23800) .. "]，凑齐后再来找我吧！", "随机色")
			return
		end
		if checkEmptItemNum(talkerindex) == 0 then
			char.TalkToCli(talkerindex, meindex, "你身上的道具栏空位不足！", "随机色")
			return
		end
		npc.DelItem(talkerindex,"23800*2")
		local rndnum = math.random(100)
		if rndnum <= 33 then
			itemindex = char.Additem(talkerindex,TM_ItemId2[num][2])
			char.TalkToCli(talkerindex, meindex, "抽奖中...........", "随机色")
			char.TalkToCli(talkerindex, -1, "本次骑证抽奖得到：" .. item.getChar(itemindex,"名称"), "随机色")
		elseif rndnum <= 88 then
			itemindex = char.Additem(talkerindex,TM_ItemId2[num][3])
			char.TalkToCli(talkerindex, meindex, "抽奖中...........", "随机色")
			char.TalkToCli(talkerindex, -1, "本次骑证抽奖得到：" .. item.getChar(itemindex,"名称"), "随机色")
		elseif rndnum <= 98 then
			itemindex = char.Additem(talkerindex,TM_ItemId2[num][4])
			char.TalkToCli(talkerindex, meindex, "抽奖中...........", "随机色")
			char.TalkToCli(talkerindex, -1, "本次骑证抽奖得到：" .. item.getChar(itemindex,"名称"), "随机色")
			char.talkToServer(-1, "[大陆新闻]恭喜玩家[" .. char.getChar(talkerindex,"名字") .. "]运气爆棚，仅用两枚碎片抽到一张 " .. item.getChar(itemindex,"名称") .. " #44 从此骑乘[" .. TM_ItemId2[num][6] .. "]所向披靡！", "随机色")
		elseif rndnum <= 100 then
			itemindex = char.Additem(talkerindex,TM_ItemId2[num][5])
			char.TalkToCli(talkerindex, meindex, "抽奖中...........", "随机色")
			char.TalkToCli(talkerindex, -1, "本次骑证抽奖得到：" .. item.getChar(itemindex,"名称"), "随机色")
			char.talkToServer(-1, "[大陆新闻]恭喜玩家[" .. char.getChar(talkerindex,"名字") .. "]运气爆棚，仅用两枚碎片抽到一张 " .. item.getChar(itemindex,"名称") .. " #44 从此骑乘[" .. TM_ItemId2[num][6] .. "]所向披靡！", "随机色")
		end
	end
end


function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	TM_ItemId = {{23805,23800,16,"帖拉所伊朵"},{23810,23800,18,"朵拉比斯"},{23815,23800,20,"扬奇洛斯"},{23820,23800,20,"卡达鲁卡斯"},{23825,23800,30,"拉奇鲁哥"},{23830,23800,30,"卡卡金宝"},{23835,23800,50,"布诺斯坦"},{23840,23800,50,"斯坦诺威"}} --需要道具编号
	TM_ItemId2 = {{"机暴骑乘证",23802,23803,23804,23805,"帖拉所伊朵"},{"金飞骑乘证",23807,23808,23809,23810,"朵拉比斯"},{"蓝人龙骑证",23812,23813,23814,23815,"扬奇洛斯"},{"穿山甲骑证",23817,23818,23819,23820,"卡达鲁卡斯"},{"红狗骑乘证",23822,23823,23824,23825,"拉奇鲁哥"},{"红蛙骑乘证",23827,23828,23829,23830,"卡卡金宝"},{"蓝牛骑乘证",23832,23833,23834,23835,"布诺斯坦"},{"绿牛骑乘证",23837,23838,23839,23840,"斯坦诺威"}}
	TM_ReadMe = "　　· 骑证碎片：来自于阎罗十殿、黑暗精灵王入侵等日常活动\n　　· 骑证兑换：使用大量的骑证碎片可以在这里合成永久骑证\n　　· 骑证抽奖：使用两个骑证碎片可以进行一次指定骑证抽奖\n　　· 抽奖所得：抽奖得到3天、7天、30天甚至永久的该种骑证\n　　· 形象变化：新人物造型可以免费变为老形象便于兼容骑证\n\n　　· 时效骑证：相同骑乘对象的时效骑证使用可互相累加时间\n　　　　　　　　 在体验期间一般情况不建议使用其他时效骑证\n　　　　　　　　 强行使用会要求输入验证码并提示取消原骑证\n\n　　· 温馨提示：永久骑证可多证并存、与时效骑乘证明不冲突\n　　· 安全设置：兑换骑证加入验证码避免出现误操作造成损失"
	
	playercolorData = {{100000,100005,100010,100015},
					{100020,100025,100030,100035},
					{100040,100045,100050,100055},
					{100060,100065,100070,100075},
					{100080,100085,100090,100095},
					{100100,100105,100110,100115},
					{100120,100125,100130,100135},
					{100140,100145,100150,100155},
					{100160,100165,100170,100175},
					{100180,100185,100190,100195},
					{100200,100205,100210,100215},
					{100220,100225,100230,100235}}
end

function main()
	--Create("「 骑证兑换员 」", 70014, 2005, 28, 13, 6)
	data()
end