function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function ShowHead(meindex, talkerindex)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
			token = "3              　「 稀有宠物饲养员 」\n\n\n" 
					.. "              ≡ 【宠物精华】兑换 ≡\n" 
					.. "              ≡ 【稀有宠物】兑换 ≡\n"
					.. "              ≡ 【宠物精华】说明 ≡" 
		lssproto.windows(talkerindex, "选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
	end
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
			lssproto.windows(talkerindex, "选择框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 2 then
			lssproto.windows(talkerindex, "对话框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 3 then
			lssproto.windows(talkerindex, "输入框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		end
end

function ShowReadMe( meindex, talkerindex, page)
		token = TM_ReadMe[page+1]
		
		if ReadMemaxpage == 0 then
			button = 8
		elseif page == 0 and page < ReadMemaxpage then
			button = 40
		elseif page > 0 and page < ReadMemaxpage then
			button = 56
		elseif page == ReadMemaxpage then
			button = 24
		end
		lssproto.windows(talkerindex, "对话框", button, 1000 + page, char.getWorkInt( meindex, "对象"), token)
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if char.getInt(talkerindex,"安全锁") > 0 then
			if char.getInt(talkerindex,"安全锁") == 1 then
				token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
			elseif char.getInt(talkerindex,"安全锁") == 2 then
				token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
			else
				token = "由于您的密码过于简单，并且异地登录。\n例如：密码非常简单或者全包含于账号。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
			end
			lssproto.windows(talkerindex, "输入框", "确定|取消", "安全锁", -1, token)
			return
		end
		ShowHead(meindex, talkerindex)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--char.TalkToCli(talkerindex, meindex, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	
	if select == 0 and other.atoi(data) == 0 then
		ShowHead(meindex, talkerindex)
	end
	
	if seqno == 1 then
		if select == 8 then
			return
		end
		num = other.atoi(data)
		if num == 1 then
			token = "2              　「 稀有宠物饲养员 」\n" 
			for i = 1,math.min(#TM_ItemName,7) do
				token = token .. "\n　　　　　　　　兑换[ " .. TM_ItemName[i] .. " ]"
			end
			ShowWindow(meindex, talkerindex, 1, TM_ItemNameMaxPage, 2, token, 1)
			char.setWorkInt(talkerindex,"NPC临时1",1)
			--char.TalkToCli(talkerindex, meindex, "暂未开放。", "随机色")
		elseif num == 2 then
			token = "2              　「 稀有宠物饲养员 」\n" 
			for i = 1,math.min(#TM_NewPetId,7) do
				token = token .. "\n　　　　　　　　兑换[ " .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[i]),"名字") .. " ]"
			end
			--token = token .. "\n　　　　　　　　兑换[ " .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[2]),"名字") .. " ]"
			ShowWindow(meindex, talkerindex, 1, TM_NewPetMaxPage, 6, token, 1)
			char.setWorkInt(talkerindex,"NPC临时11",1)
		elseif num == 3 then
			ShowReadMe(meindex, talkerindex, 0)
		end
	elseif seqno == 2 then
		if select == 8 then
			return
		elseif select == 16 then
			num = char.getWorkInt(talkerindex,"NPC临时1")
			if num == 1 then
				return
			end
			token = "2              　「 稀有宠物饲养员 」\n" 
			for i = (num-1)*7-6,(num-1)*7 do
				token = token .. "\n　　　　　　　　兑换[ " .. TM_ItemName[i] .. " ]"
			end
			ShowWindow(meindex, talkerindex, num-1, TM_ItemNameMaxPage, 2, token, 1)
			char.setWorkInt(talkerindex,"NPC临时1",num-1)
		elseif select == 32 then
			num = char.getWorkInt(talkerindex,"NPC临时1")
			if num == TM_ItemNameMaxPage then
				return
			end
			token = "2              　「 稀有宠物饲养员 」\n" 
			for i = (num+1)*7-6,math.min((num+1)*7,#TM_ItemName) do
				token = token .. "\n　　　　　　　　兑换[" .. TM_ItemName[i] .. "]"
			end
			ShowWindow(meindex, talkerindex, num+1, TM_ItemNameMaxPage, 2, token, 1)
			char.setWorkInt(talkerindex,"NPC临时1",num+1)
		else
			num = other.atoi(data) - 1
			page = char.getWorkInt(talkerindex,"NPC临时1")
			num = page * 7 - 6 + num
			token = "2              　「 稀有宠物饲养员 」\n"
			local TM_ItemIdNum = #TM_ItemId[num] 
			for i=1,TM_ItemIdNum do
				token = token .. "\n　　　　　　　 兑换[ " .. item.getNameFromNumber(TM_ItemId[num][i]) .. " ]"
			end
			char.setWorkInt(talkerindex,"NPC临时1",num)
			lssproto.windows(talkerindex, "选择框", 8, 3, char.getWorkInt( meindex, "对象"), token)
		end
	elseif seqno == 3 then
		if select == 8 then
			return
		end
		num = other.atoi(data)
		local TM_ItemIdType = char.getWorkInt(talkerindex,"NPC临时1")
		if num < 1 or num > #TM_ItemId[TM_ItemIdType] then
			return
		end
		char.setWorkInt(talkerindex,"NPC临时2",num)
		lssproto.windows(talkerindex, "宠物框", 8, 4, char.getWorkInt( meindex, "对象"), "")
	elseif seqno == 4 then
		if select == 8 then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		char.setWorkInt(talkerindex,"NPC临时3",num)
		local TM_ItemIdType = char.getWorkInt(talkerindex,"NPC临时1")
		local TM_ItemIdTypeNum = char.getWorkInt(talkerindex,"NPC临时2")
		local MyPetIndex = char.getCharPet(talkerindex,num-1)
		local MyPetId = char.getInt(MyPetIndex,"宠ID")
		local MyPetName = char.getChar(MyPetIndex,"名字")
		local MyPet4v = PetUp_4v(MyPetIndex)
		local TM_PetNowZF = {0,0,0,0}
		local TM_PetNowZFBuff = ""
		local TM_PetZFBuff = ""
		local TM_PetZFText = {"水","火","地","风"}
		for i = 1,4 do
			TM_PetNowZF[i] = char.getRightTo8(char.getInt(MyPetIndex, "提升值"), i)
			if TM_PetNowZF[i] > 0 then
				TM_PetNowZFBuff = TM_PetNowZFBuff .. TM_PetZFText[i]
			end
		end
		for i = 1,4 do
			if TM_PetZF[TM_ItemIdType][TM_ItemIdTypeNum][i] > 0 then
				TM_PetZFBuff = TM_PetZFBuff .. TM_PetZFText[i]
			end
		end
		if MyPetId ~= TM_PetId[TM_ItemIdType][TM_ItemIdTypeNum] then
			char.TalkToCli(talkerindex, meindex, "温馨提示,您选择的宠物不正确！请选择宠物[".. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_PetId[TM_ItemIdType][TM_ItemIdTypeNum]),"名字") .."]", "随机色")
			return
		end
		token = "              　「 宠物精华兑换处 」\n"
			.. "你确定要兑换["..item.getNameFromNumber(TM_ItemId[TM_ItemIdType][TM_ItemIdTypeNum]).."]么？\n那就请把宠物[" ..MyPetName.."]送给我吧！\n"
			.. "　　　　　　目前" ..MyPetName.."评分："..MyPet4v.."\n"
			.. "　　　　　　需要" ..MyPetName.."评分："..TM_Pet4v[TM_ItemIdType][TM_ItemIdTypeNum].."\n"
			.. "　　　　　　目前" ..MyPetName.."祝福："..TM_PetNowZFBuff.."\n"
			.. "　　　　　　需要" ..MyPetName.."祝福："..TM_PetZFBuff.."\n"
			.. "是否确认要兑换吗？"
		ShowWindow(meindex, talkerindex, 1, 1, 5, token, 2)

	elseif seqno == 5 then
		if select == 8 or select ~= 4 then
			return
		end
		if checkEmptItemNum(talkerindex) == 0 then
			char.TalkToCli(talkerindex, meindex, "物品已满，请道具栏留有足够的空位！", "随机色")
			return
		end
		num = char.getWorkInt(talkerindex,"NPC临时3")
		local TM_ItemIdType = char.getWorkInt(talkerindex,"NPC临时1")
		local TM_ItemIdTypeNum = char.getWorkInt(talkerindex,"NPC临时2")
		local MyPetIndex = char.getCharPet(talkerindex,num-1)
		local MyPetId = char.getInt(MyPetIndex,"宠ID")
		local MyPetName = char.getChar(MyPetIndex,"名字")
		local MyPet4v = PetUp_4v(MyPetIndex)
		local TM_PetNowZF = {0,0,0,0}
		local TM_PetNowZFBuff = ""
		local TM_PetZFBuff = ""
		local TM_PetZFText = {"水","火","地","风"}
		for i = 1,4 do
			TM_PetNowZF[i] = char.getRightTo8(char.getInt(MyPetIndex, "提升值"), i)
			if TM_PetNowZF[i] > 0 then
				TM_PetNowZFBuff = TM_PetNowZFBuff .. TM_PetZFText[i]
			end
		end
		for i = 1,4 do
			if TM_PetZF[TM_ItemIdType][TM_ItemIdTypeNum][i] > 0 then
				TM_PetZFBuff = TM_PetZFBuff .. TM_PetZFText[i]
			end
		end
		if MyPetId ~= TM_PetId[TM_ItemIdType][TM_ItemIdTypeNum] then
			char.TalkToCli(talkerindex, meindex, "温馨提示,您选择的宠物不正确！请选择宠物[".. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_PetId[TM_ItemIdType][TM_ItemIdTypeNum]),"名字") .."]", "随机色")
			return
		end
		if MyPet4v < TM_Pet4v[TM_ItemIdType][TM_ItemIdTypeNum] then
			char.TalkToCli(talkerindex, meindex, "温馨提示,您选择的宠物评分不足！", "随机色")
			return
		end
		for i=1,4 do
			if TM_PetNowZF[i] < TM_PetZF[TM_ItemIdType][TM_ItemIdTypeNum][i] then
				char.TalkToCli(talkerindex, meindex, "您的[".. MyPetName .."]没有使用过"..TM_PetZFText[i].."祝福! 不能兑换！", "随机色")
				return
			end
		end
		char.DelPet(talkerindex, MyPetIndex)
		char.Additem(talkerindex,TM_ItemId[TM_ItemIdType][TM_ItemIdTypeNum])
		char.TalkToCli(talkerindex, meindex, "恭喜您兑换[" .. item.getNameFromNumber(TM_ItemId[TM_ItemIdType][TM_ItemIdTypeNum]) .. "]成功。", "黄色")
		--char.charSaveFromConnect(talkerindex)
		char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
	elseif seqno == 6 then
		if select == 8 then
			return
		elseif select == 16 then
			num = char.getWorkInt(talkerindex,"NPC临时11")
			if num == 1 then
				return
			end
			token = "2              　「 稀有宠物饲养员 」\n" 
			for i = (num-1)*7-6,(num-1)*7 do
				token = token .. "\n　　　　　　　　兑换[ " .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[i]),"名字") .. " ]"
			end
			ShowWindow(meindex, talkerindex, num-1, TM_NewPetMaxPage, 6, token, 1)
			char.setWorkInt(talkerindex,"NPC临时11",num-1)
		elseif select == 32 then
			num = char.getWorkInt(talkerindex,"NPC临时11")
			if num == TM_NewPetMaxPage then
				return
			end
			token = "2              　「 稀有宠物饲养员 」\n" 
			for i = (num+1)*7-6,math.min((num+1)*7,#TM_NewPetId) do
				token = token .. "\n　　　　　　　　兑换[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[i]),"名字") .. "]"
			end
			ShowWindow(meindex, talkerindex, num+1, TM_NewPetMaxPage, 2, token, 1)
			char.setWorkInt(talkerindex,"NPC临时11",num+1)
		else
			num = other.atoi(data) - 1
			page = char.getWorkInt(talkerindex,"NPC临时11")
			num = page * 7 - 6 + num
			--num = 2
			token = "您要兑换的稀有宠物[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[num]),"名字") .. "]条件如下\n"
				.."【声望】：   " .. TM_Fame[num] .. "\n"
				.."【活力】：   " .. TM_Vigor[num] .. "\n"
			if TM_NewPet4v[num] == 0 then
				for i=1,#TM_ItemPetId[num] do
					token = token .. "【道具】：" .. item.getNameFromNumber(TM_ItemPetId[num][i]) .. "\n"
				end
			elseif TM_NewPet4v[num] == -1 then
				token = token .. "【宠物】： " .. TM_NewPetPetId[num][3] .. "只0转" .. TM_NewPetPetId[num][2] .. "级[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetPetId[num][1]),"名字") .. "]"
			else
				token = token .. "【宠物】：" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetPetId[num]),"名字")
							  .. "　　【评分】：" .. TM_NewPet4v[num] .. "\n"
							  .. "【分差<=５】可用" .. TM_NewPetItemName[num][1] .. "补分\n【分差<=10】可用" .. TM_NewPetItemName[num][2] .. "补分\n【分差<=20】可用"  .. TM_NewPetItemName[num][3].. "补分\n　ＰＳ：补分道具请放在道具栏的第一位"
			end
			char.setWorkInt(talkerindex,"NPC临时11",num)
			--local TM_ItemIdNum = TM_ItemId[num]
			lssproto.windows(talkerindex, "对话框", 12, 7, char.getWorkInt( meindex, "对象"), token)
		end
	elseif seqno == 7 then
		if select == 8 then
			return
		end
		num = char.getWorkInt(talkerindex,"NPC临时11")
		if TM_NewPet4v[num] == 0 then 
			if checkEmptPetNum(talkerindex) == 0 then
				char.TalkToCli(talkerindex, -1, "很抱歉，您的身上宠物已满！", "红色")
				return
			end
			local TM_MyFame = char.getInt(talkerindex,"声望")
			local TM_MyVigor = char.getInt(talkerindex,"活力")
			if TM_MyFame < TM_Fame[num] * 100 then
				char.TalkToCli(talkerindex, meindex, "您的声望不够！再接再厉哦！", "随机色")
				lssproto.windows(talkerindex, 1038, 0, -1, -1, "3")
				return
			end
			if TM_MyVigor < TM_Vigor[num] then
				char.TalkToCli(talkerindex, meindex, "您的活力不够！再接再厉哦！", "随机色")
				lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
				return
			end
			for i=1,#TM_ItemPetId[num] do
				if char.Finditem(talkerindex, TM_ItemPetId[num][i]) < 1 then
					char.TalkToCli(talkerindex, meindex, "你连 "..item.getNameFromNumber(TM_ItemPetId[num][i]).." 都没有带来，不要浪费姐姐的时间！", "随机色")
					return
				end
			end
			for i=1,#TM_ItemPetId[num] do
				npc.DelItemNum(talkerindex, TM_ItemPetId[num][i]..",1")
			end
			char.setInt(talkerindex,"声望",TM_MyFame - TM_Fame[num] * 100)
			char.setInt(talkerindex,"活力",TM_MyVigor - TM_Vigor[num])
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,TM_Vigor[num]})
			char.TalkToCli(talkerindex, -1, "兑换消耗了您 "..TM_Fame[num].." 声望！" , "随机色")
			char.TalkToCli(talkerindex, -1, "兑换消耗了您 "..TM_Vigor[num].." 活力！" , "随机色")
			npc.AddPet(talkerindex,TM_NewPetId[num])
			--char.charSaveFromConnect(talkerindex)
			char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
			char.talkToServer(-1, "「萌宠降世」恭喜玩家 "..char.getChar(talkerindex,"名字").." 兑换稀有宠物 ["..enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[num]),"名字").."] 成功。", "随机色")
		elseif TM_NewPet4v[num] == -1 then
			local TM_MyFame = char.getInt(talkerindex,"声望")
			local TM_MyVigor = char.getInt(talkerindex,"活力")
			if TM_MyFame < TM_Fame[num] * 100 then
				char.TalkToCli(talkerindex, meindex, "您的声望不够！再接再厉哦！", "随机色")
				lssproto.windows(talkerindex, 1038, 0, -1, -1, "3")
				return
			end
			if TM_MyVigor < TM_Vigor[num] then
				char.TalkToCli(talkerindex, meindex, "您的活力不够！再接再厉哦！", "随机色")
				lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
				return
			end
			local temppetnum = 0
			for i=0,4 do
				local MyPetIndex = char.getCharPet(talkerindex,i)
				if char.check(MyPetIndex) == 1 then
					if char.getInt(MyPetIndex,"宠ID") == TM_NewPetPetId[num][1] and char.getInt(MyPetIndex,"转数") == 0 and char.getInt(MyPetIndex,"等级") == TM_NewPetPetId[num][2] then
						temppetnum = temppetnum + 1
					end
				end
			end
			if temppetnum < TM_NewPetPetId[num][3] then
				char.TalkToCli(talkerindex, meindex, "你没有携带 " .. TM_NewPetPetId[num][3] .. "只" .. TM_NewPetPetId[num][2] .. "级[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetPetId[num][1]),"名字") .. "]", "随机色")
				return
			end
			if temppetnum > TM_NewPetPetId[num][3] then
				char.TalkToCli(talkerindex, meindex, "你携带的[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetPetId[num][1]),"名字") .. "]数量过多。", "随机色")
				return
			end
			for i=0,4 do
				local MyPetIndex = char.getCharPet(talkerindex,i)
				if char.check(MyPetIndex) == 1 then
					if char.getInt(MyPetIndex,"宠ID") == TM_NewPetPetId[num][1] and char.getInt(MyPetIndex,"转数") == 0 and char.getInt(MyPetIndex,"等级") == TM_NewPetPetId[num][2] then
						char.DelPet(talkerindex, MyPetIndex)
					end
				end
			end
			char.setInt(talkerindex,"声望",TM_MyFame - TM_Fame[num] * 100)
			char.setInt(talkerindex,"活力",TM_MyVigor - TM_Vigor[num])
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,TM_Vigor[num]})
			char.TalkToCli(talkerindex, -1, "兑换消耗了您" .. TM_NewPetPetId[num][3] .. "只" .. TM_NewPetPetId[num][2] .. "级[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetPetId[num][1]),"名字") .. "]" , "随机色")
			char.TalkToCli(talkerindex, -1, "兑换消耗了您 "..TM_Fame[num].." 声望！" , "随机色")
			char.TalkToCli(talkerindex, -1, "兑换消耗了您 "..TM_Vigor[num].." 活力！" , "随机色")
			npc.AddPet(talkerindex,TM_NewPetId[num])
			--char.charSaveFromConnect(talkerindex)
			char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
			char.talkToServer(-1, "「萌宠降世」恭喜玩家 "..char.getChar(talkerindex,"名字").." 兑换稀有宠物 ["..enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[num]),"名字").."] 成功。", "随机色")
		else
			lssproto.windows(talkerindex, "宠物框", 8, 8, char.getWorkInt( meindex, "对象"), "")
		end
	elseif seqno == 8 then
		if select == 8 then
			return
		end
		selectnum = other.atoi(data)
		if selectnum < 1 or selectnum > 5 then
			return
		end
		num = char.getWorkInt(talkerindex,"NPC临时11")
		local MyPetIndex = char.getCharPet(talkerindex,selectnum-1)
		if char.check(MyPetIndex) == 0 then
			char.TalkToCli(talkerindex, -1, "没有宠物!", "随机色");
			return
		end
		if char.getInt(MyPetIndex,"宠ID") ~= TM_NewPetPetId[num] then
			char.TalkToCli(talkerindex, -1, "兑换此稀有宠物需要[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetPetId[num]),"名字") .. "]!", "随机色")
			return
		end
		token = "您要兑换的稀有宠物[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[num]),"名字") .. "]条件如下\n"
			  .."【声望】：   " .. TM_Fame[num] .. "\n"
			  .."【活力】：   " .. TM_Vigor[num] .. "\n"
			  .."目标评分：   " .. TM_NewPet4v[num] .. "\n"
			  .."当前评分：   " .. PetUp_4v(MyPetIndex) .. "\n"
		if PetUp_4v(MyPetIndex) < TM_NewPet4v[num] then
			if TM_NewPet4v[num] - PetUp_4v(MyPetIndex) <= 5 then
				token = token .. "您的宠物评分少了[" .. TM_NewPet4v[num] - PetUp_4v(MyPetIndex) .. "]分，需要补分道具哦。\n"
							  .. "补分道具：" .. TM_NewPetItemName[num][1] .. "或以上祝福\n"
							  .. "请把道具放在道具栏第一位。"
				lssproto.windows(talkerindex, "对话框", 12, selectnum + 10, char.getWorkInt( meindex, "对象"), token)
			elseif TM_NewPet4v[num] - PetUp_4v(MyPetIndex) <= 10 then
				token = token .. "您的宠物评分少了[" .. TM_NewPet4v[num] - PetUp_4v(MyPetIndex) .. "]分，需要补分道具哦。\n"
							  .. "补分道具：" .. TM_NewPetItemName[num][2] .. "或以上祝福\n"
							  .. "请把道具放在道具栏第一位。"
				lssproto.windows(talkerindex, "对话框", 12, selectnum + 10, char.getWorkInt( meindex, "对象"), token)
			elseif TM_NewPet4v[num] - PetUp_4v(MyPetIndex) <= 20 then
				token = token .. "您的宠物评分少了[" .. TM_NewPet4v[num] - PetUp_4v(MyPetIndex) .. "]分，需要补分道具哦。\n"
							  .. "补分道具：" .. TM_NewPetItemName[num][3] .. "\n"
							  .. "请把道具放在道具栏第一位。"
				lssproto.windows(talkerindex, "对话框", 12, selectnum + 10, char.getWorkInt( meindex, "对象"), token)
			else
				token = token .. "您的宠物评分差的太远了，再去修炼一下吧！\n"
				lssproto.windows(talkerindex, "对话框", 8, 0, -1, token)
			end
		else
			lssproto.windows(talkerindex, "对话框", 12, selectnum + 10, char.getWorkInt( meindex, "对象"), token)
		end
	elseif seqno >= 11 and seqno <= 15 then
		if select == 8 then
			return
		end
		selectnum = seqno - 10
		if selectnum < 1 or selectnum > 5 then
			return
		end
		num = char.getWorkInt(talkerindex,"NPC临时11")
		local MyPetIndex = char.getCharPet(talkerindex,selectnum-1)
		if char.check(MyPetIndex) == 0 then
			char.TalkToCli(talkerindex, -1, "没有宠物!", "随机色");
			return
		end
		if char.getInt(MyPetIndex,"宠ID") ~= TM_NewPetPetId[num] then
			char.TalkToCli(talkerindex, -1, "兑换此稀有宠物需要1只合格的[" .. enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetPetId[num]),"名字") .. "]!", "随机色")
			return
		end
		if char.getInt(talkerindex,"声望") < TM_Fame[num] * 100 then
			char.TalkToCli(talkerindex, -1, "您的声望不够！再接再厉哦！", "随机色")
			return
		end
		if char.getInt(talkerindex,"活力") < TM_Vigor[num] then
			char.TalkToCli(talkerindex, -1, "您的活力不够！再接再厉哦！", "随机色")
			lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
			return
		end
		if PetUp_4v(MyPetIndex) < TM_NewPet4v[num] then
			local TempItemIndex = char.getItemIndex( talkerindex, 9);
			if TM_NewPet4v[num] - PetUp_4v(MyPetIndex) <= 5 then
				if item.check(TempItemIndex) ~= 1 then
					char.TalkToCli(talkerindex, -1, "该位置没道具，请把要求的祝福放到道具栏第一位哦！", "随机色");
					return
				end
				if item.getChar(TempItemIndex,"名称") ~= TM_NewPetItemName[num][1] and item.getChar(TempItemIndex,"名称") ~= TM_NewPetItemName[num][2] and item.getChar(TempItemIndex,"名称") ~= TM_NewPetItemName[num][3] then
					char.TalkToCli(talkerindex, -1, "该位置的道具不符合要求，请把要求的祝福放到道具栏第一位哦！", "随机色");
					return
				end
			elseif TM_NewPet4v[num] - PetUp_4v(MyPetIndex) <= 10 then
				local TempItemIndex = char.getItemIndex( talkerindex, 9);
				if item.check(TempItemIndex) ~= 1 then
					char.TalkToCli(talkerindex, -1, "该位置没道具，请把要求的祝福放到道具栏第一位哦！", "随机色");
					return
				end
				if item.getChar(TempItemIndex,"名称") ~= TM_NewPetItemName[num][2] and item.getChar(TempItemIndex,"名称") ~= TM_NewPetItemName[num][3] then
					char.TalkToCli(talkerindex, -1, "该位置的道具不符合要求，请把要求的祝福放到道具栏第一位哦！", "随机色");
					return
				end
			elseif TM_NewPet4v[num] - PetUp_4v(MyPetIndex) <= 20 then
				local TempItemIndex = char.getItemIndex( talkerindex, 9);
				if item.check(TempItemIndex) ~= 1 then
					char.TalkToCli(talkerindex, -1, "该位置没道具，请把要求的祝福放到道具栏第一位哦！", "随机色");
					return
				end
				if item.getChar(TempItemIndex,"名称") ~= TM_NewPetItemName[num][3] then
					char.TalkToCli(talkerindex, -1, "该位置的道具不符合要求，请把要求的祝福放到道具栏第一位哦！", "随机色");
					return
				end
			else
				token = token .. "您的宠物评分差的太远了，再去修炼一下吧！\n"
				lssproto.windows(talkerindex, "对话框", 8, 0, -1, token)
				return
			end
			char.TalkToCli(talkerindex, -1, "交出道具" .. item.getChar(TempItemIndex,"名称"), "随机色");
			char.DelItem(talkerindex, 9)
		end
		char.TalkToCli(talkerindex, -1, "交出宠物[" .. char.getChar(MyPetIndex,"名字") .. "][Lv:" .. char.getInt(MyPetIndex,"等级") .. "][" .. PetUp_4v(MyPetIndex) .. "]", "随机色");
		char.DelPet(talkerindex, MyPetIndex)
		char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - TM_Fame[num] * 100)
		char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - TM_Vigor[num])
		other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,TM_Vigor[num]})
		char.TalkToCli(talkerindex, -1, "兑换消耗了您 "..TM_Fame[num].." 声望！" , "随机色")
		char.TalkToCli(talkerindex, -1, "兑换消耗了您 "..TM_Vigor[num].." 活力！" , "随机色")
		npc.AddPet(talkerindex,TM_NewPetId[num])
		--char.charSaveFromConnect(talkerindex)
		char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
		char.talkToServer(-1, "「萌宠降世」恭喜玩家 "..char.getChar(talkerindex,"名字").." 兑换稀有宠物 ["..enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(TM_NewPetId[num]),"名字").."] 成功。", "随机色")
	elseif seqno >= 1000 and seqno < 2000 then
		num = seqno - 1000
		if select == 16 then
			ShowReadMe(meindex, talkerindex, num - 1)
		elseif select == 32 then
			ShowReadMe(meindex, talkerindex, num + 1)
		end
 	end
	

	
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	TM_PetId = {{31,32,33,34}}
	TM_Pet4v = {{1320,1320,1320,1330}}--所需的评分值
	TM_PetZF = {{{1,1,1,1},{1,1,1,1},{1,1,1,1},{1,1,1,1}}}--需要祝福
	TM_ItemId = {{23501,23502,23503,23504}}--道具ID
	TM_ItemName = {"威威系精华"}
	TM_ItemNameMaxPage = math.ceil(#TM_ItemName/7)
	TM_ItemPetId = {{23501,23502,23503,23504},{1,1,1,1}}--兑换宠物道具ID
	TM_NewPetId = {3035,3036}--稀有宠物ID
	TM_Fame = {30000,30000,30000,20000}--需要声望
	TM_Vigor = {30000,30000,30000,30000}--需要活力
	TM_NewPet4v = {0,1440,-1,-1}--稀有宠物4V
	TM_NewPetPetId = {-1,3121,{3000,1,2},{777,1,2}}--需要宠物ID
	TM_NewPetItemName = {{"","",""},{"劣质的老虎祝福[地]","普通的老虎祝福[地]","优质的老虎祝福[地]"}}
	TM_NewPetMaxPage = math.ceil(#TM_NewPetId/7)
	TM_ReadMe = {
					"\n稀有宠物是为了丰富游戏内容和造型设计的功能，稀有宠物并不是特别厉害，但是获取难度是非常的高，成长类同与同级圣兽，获取难度十分高！\n\n是呆萌可爱，但性价比低的装逼利器。",
					"\n稀有宠物有不同的获取途径，比如搜集初代宠物的精华，加上其他的条件兑换，初代宠物的精华一般要求为成长极高的初代宠物满祝福为标准，十分不易哟，请新手玩家慎入，以免浪费太多精力。"
					}
	ReadMemaxpage = #TM_ReadMe - 1

end


function PetUp_4v(petindex)
	local Resault = char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷")
	return math.floor(Resault)
end

function main()
	--Create("稀有宠物饲养员", 70095, 1000, 82, 47, 4)
	data()
end