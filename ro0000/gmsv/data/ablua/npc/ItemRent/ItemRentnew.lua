function ShowHead(meindex, talkerindex)
		token = char.getChar(meindex,"名字") .. "|选择你要的服务种类吧|1|修理装备属性|" 
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
end

function ShowWindow(meindex, talkerindex, page, maxpage, seqno, token, mytype)
		char.setWorkInt(talkerindex,"NPC临时11",page)
		
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

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if char.getInt(talkerindex,"安全锁") > 0 then
			if char.getInt(talkerindex,"安全锁") == 1 then
				token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
			else
				token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
			end
			lssproto.windows(talkerindex, "输入框", "确定|取消", "安全锁", -1, token)
			return
		end
		ShowHead(meindex, talkerindex)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
--	char.talkToServer(meindex, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "红色")
	if seqno == 0 then	--租用装备页面
		num = other.atoi(data)
		if num == 2 then
			local TM_ItemNameNum = #TM_ItemName
			local TM_PageNUM = math.ceil(TM_ItemNameNum/7)
			token = "2 请选择您需要的服务：\n\n"
			for i = 1, 7 do
				if i > 	TM_ItemNameNum then
					break
				end
				token = token .. string.format("%39s\n", TM_ItemName[i][1])
			end
			if TM_PageNUM == 1 then
				ShowWindow(meindex, talkerindex, 1, 99, 1, token, 1)
			else
				ShowWindow(meindex, talkerindex, 1, TM_PageNUM, 1, token, 1)
			end
						--租用装备页面结束
		elseif num == 1 or num == 1 then -- 装备修理
			if num == 1 then
				char.setWorkInt(talkerindex,"NPC临时1",1)
			elseif num == 1 then
				char.setWorkInt(talkerindex,"NPC临时1",2)
			end
			local TM_equipname = {"没有装备","没有装备","没有装备","没有装备","没有装备"}
			for i = 1, 5 do
				local TempItemIndex = char.getItemIndex( talkerindex, TM_equipid[i]);
				if TempItemIndex > 0 then
					TM_equipname[i] = item.getChar(TempItemIndex, "显示名")
				end
			end
			token = "2             ≡ 请选择你要修理的装备 ≡\n"
					.. "\n"
					.. "　　　　　　　　 头部:"..TM_equipname[1].."\n"
					.. "　　　　　　　　 身体:"..TM_equipname[2].."\n" 
					.. "　　　　　　　　 武器:"..TM_equipname[3].."\n"
					.. "　　　　　　　　 右饰:"..TM_equipname[4].."\n" 
					.. "　　　　　　　　 左饰:"..TM_equipname[5]
			ShowWindow(meindex, talkerindex, 1, 99, 5, token, 1)
					
		elseif num == 4 then -- 装备鉴定
			token = "                 " .. char.getChar(meindex, "名字") .. "\n\n"
					 .. "    我这里还免费提供鉴定道具真实属性的业务，嘿嘿，没办法，租用的道具都要看属性的嘛，客观有兴趣看看不？"

			ShowWindow(meindex, talkerindex, 1, 1, 7, token, 2)
		elseif num == 5 then -- 系统说明
			token = TM_ReadMe[1]
			ShowWindow(meindex, talkerindex, 1, 2, 11, token, 2)
		end				
		
	elseif seqno == 1 then -- 租用装备页面翻页支持开始
		local TM_NowPage = char.getWorkInt(talkerindex,"NPC临时11")
		num = other.atoi(data) + (TM_NowPage - 1) * 7
		char.setWorkInt(talkerindex,"NPC临时1",num)
		if select == 0 then
			local TM_ItemLevelNum = table.getn(TM_ItemName[num])
			local TM_PageNUM = math.ceil(TM_ItemLevelNum/7)
			token = "2 请选择您需要的服务：\n\n"
			for i = 1, 7 do
				if (i + 1) > TM_ItemLevelNum then
					break
				end
				token = token .. string.format("%39s\n", TM_ItemName[num][i+1])
			end
			if TM_PageNUM == 1 then
				ShowWindow(meindex, talkerindex, 1, 99, 2, token, 1)
			else
				ShowWindow(meindex, talkerindex, 1, TM_PageNUM, 2, token, 1)
			end
		elseif select == 16 then
			local TM_ItemLevelNum = table.getn(TM_ItemName[num])
			local TM_PageNUM = math.ceil(TM_ItemLevelNum/7)
			local TempNum = (TM_NowPage-1) * 7 + 1
			token = "2 请选择您需要的服务：\n\n"
			for i = TempNum-7, TempNum-1 do
				if i > 	TM_ItemLevelNum then
					break
				end
				token = token .. string.format("%39s\n", TM_ItemName[i][1])
			end
			ShowWindow(meindex, talkerindex, TM_NowPage-1, TM_PageNUM, 1, token, 1)
		elseif select == 32 then
			local TM_ItemLevelNum = table.getn(TM_ItemName[num])
			local TM_PageNUM = math.ceil(TM_ItemLevelNum/7)
			local TempNum = TM_NowPage * 7 + 1
			token = "2 请选择您需要的服务：\n\n"
			for i = TempNum, TempNum+6 do
				if i > 	TM_ItemLevelNum then
					break
				end
				token = token .. string.format("%39s\n", TM_ItemName[i][1])
			end
			ShowWindow(meindex, talkerindex, TM_NowPage+1, TM_PageNUM, 1, token, 1)
		end					-- 租用装备页面翻页支持结束
	
	elseif seqno == 2 then	-- 选择租用页面代码开始
		local TM_NowPage = char.getWorkInt(talkerindex,"NPC临时11")
		num = other.atoi(data) + (TM_NowPage - 1) * 7
		char.setWorkInt(talkerindex,"NPC临时2",num)
		local TM_ItemSelect = char.getWorkInt(talkerindex,"NPC临时1")
		local TM_ItemData = char.getWorkInt(talkerindex,"NPC临时2")
		if select == 0 then
			token = "                 " .. char.getChar(meindex, "名字") .. "\n" 
					.. "您租用的"..TM_ItemName[TM_ItemSelect][TM_ItemData+1].."\n↓租用价格↓可选石币支付或活力支付↓\n"
					.. "【石币支付】"..TM_Gold[TM_ItemSelect][TM_ItemData].."Ｗ/天\n" 
					.. "【活力支付】"..TM_Vigor[TM_ItemSelect][TM_ItemData].."点/天\n" 
					.. "\n请输入要租用的天数："
			ShowWindow(meindex, talkerindex, 1, 1, 3, token, 3)
		elseif select == 16 then
			local TempNum = (TM_NowPage-1) * 7 + 1
			local TM_ItemLevelNum = table.getn(TM_ItemName[num])
			local TM_PageNUM = math.ceil(TM_ItemLevelNum/7)
			token = "1 请选择您需要的服务：\n"
			for i = TempNum-7, TempNum-1 do
				if (i+1) > 	TM_ItemLevelNum then
					break
				end
				token = token .. string.format("%39s\n", TM_ItemName[num][i+1])
			end
			ShowWindow(meindex, talkerindex, TM_NowPage-1, TM_PageNUM, 1, token, 1)
		elseif select == 32 then
			TempNum = TM_NowPage * 7 + 1
			local TM_ItemLevelNum = table.getn(TM_ItemName[num])
			local TM_PageNUM = math.ceil(TM_ItemLevelNum/7)			
			token = "1 请选择您需要的服务：\n"
			for i = TempNum, TempNum+6 do
				if (i+1) > 	TM_ItemLevelNum then
					break
				end
				token = token .. string.format("%39s\n", TM_ItemName[num][i+1])
			end
			ShowWindow(meindex, talkerindex, TM_NowPage+1, TM_PageNUM, 1, token, 1)
		end			-- 选择租用页面代码结束
		
	elseif seqno == 3 then  --租用支付代码开始
		num = other.atoi(data)
		char.setWorkInt(talkerindex,"NPC临时3",num)
		local TM_ItemSelect = char.getWorkInt(talkerindex,"NPC临时1")
		local TM_ItemData = char.getWorkInt(talkerindex,"NPC临时2")
		if num < 1 or num > 365 then
			char.TalkToCli(talkerindex, meindex, "租用时间最小1天，最大365天！", "红色")
			return
		end
		local TM_DelGold = TM_Gold[TM_ItemSelect][TM_ItemData] * num
		local TM_DelVigor = TM_Vigor[TM_ItemSelect][TM_ItemData] * num
		token = "2                  " .. char.getChar(meindex, "名字") .. "\n" 
				.. "请选择您要支付的类型:\n"
				.. "石币支付:".. TM_DelGold .."Ｗ 　有效期：" .. num .. "天\n"
				.. "活力支付:".. TM_DelVigor .."点 　有效期：" .. num .. "天" 
		ShowWindow(meindex, talkerindex, 1, 99, 4, token, 1)
	elseif seqno == 4 then --付款代码开始
		num = other.atoi(data)
		local TM_ItemSelect = char.getWorkInt(talkerindex,"NPC临时1")
		local TM_ItemData = char.getWorkInt(talkerindex,"NPC临时2")
		local TM_Day = char.getWorkInt(talkerindex,"NPC临时3")
		local TM_NowTime = os.time()
		local TM_SetTime = TM_NowTime + TM_Day * 60 * 60 * 24
		local ItemEmpty = char.findEmptyItemBox(talkerindex)
		local TM_DelGold = TM_Gold[TM_ItemSelect][TM_ItemData] * TM_Day
		local TM_DelVigor = TM_Vigor[TM_ItemSelect][TM_ItemData] * TM_Day
		local T_Year = os.date("%Y", TM_SetTime)
		local T_Month = os.date ("%m", TM_SetTime)
		local T_Day = os.date ("%d", TM_SetTime)
		local T_Hour = os.date ("%H", TM_SetTime)
		local T_Minute = os.date ("%M", TM_SetTime)
		local T_Second = os.date ("%S", TM_SetTime)
		local TM_Token = "有效期：" .. T_Year .. "." .. T_Month .. "." .. T_Day .. " " .. T_Hour .. ":" .. T_Minute .. ":" .. T_Second
				
		if ItemEmpty < 0 then
			char.TalkToCli(talkerindex, meindex, "您身上没有空位了！", "红色")
			return
		end
		
		if num == 1 then -- 石币支付
			local CharStone = char.getInt(talkerindex,"石币")
			if CharStone < TM_DelGold * 10000 then
				char.TalkToCli(talkerindex, meindex, "您的石币不足，无法租用道具！", "红色")
				return
			end
			char.setInt(talkerindex, "石币", CharStone - TM_DelGold * 10000)
			local TM_ItemIndex = npc.AddRandItem(talkerindex, TM_ItemId[TM_ItemSelect][TM_ItemData])

			local TM_OldSM = item.getChar(TM_ItemIndex, "说明")
			TM_OldSM = string.gsub(TM_OldSM, "净化精灵", "净化")
			TM_OldSM = string.gsub(TM_OldSM, "的精灵", "精灵")
			TM_OldSM = string.gsub(TM_OldSM, "地", "")
			TM_OldSM = string.gsub(TM_OldSM, "水", "")
			TM_OldSM = string.gsub(TM_OldSM, "火", "")
			TM_OldSM = string.gsub(TM_OldSM, "风", "")
			TM_OldSM = string.gsub(TM_OldSM, "[%[%]]", "")
			TM_OldSM = string.gsub(TM_OldSM, "  ", "")
			TM_OldSM = string.gsub(TM_OldSM, "? ", "?")
			TM_OldSM = string.gsub(TM_OldSM, "?", "? ")
			local TM_NewSM = TM_Token .. TM_OldSM
			local TM_OldName = item.getChar(TM_ItemIndex, "显示名")
			local TM_NewName = string.gsub(TM_OldName, "合成", "租用的")
			local TM_BdOldName = item.getChar(TM_ItemIndex, "名称")
			local TM_BdNewName = string.gsub(TM_OldName, "合成", "*租用的")
			item.setChar(TM_ItemIndex, "名称", TM_BdNewName)
			item.setChar(TM_ItemIndex, "说明", TM_NewSM)
			item.setChar(TM_ItemIndex, "显示名", TM_NewName)
			item.setInt(TM_ItemIndex, "物品时间", TM_SetTime)
			item.setInt(TM_ItemIndex, "颜色", 1)
			char.sendStatusString(talkerindex,"I")
			char.Updata(talkerindex, "石币")
			char.TalkToCli(talkerindex, meindex, "扣除石币:" .. TM_DelGold .. "万  拿到道具:" .. item.getChar(TM_ItemIndex, "显示名"), "绿色")
		elseif num == 2 then -- 活力支付
			local CharVigor = char.getInt(talkerindex,"活力")
			if CharVigor < TM_DelVigor then
				char.TalkToCli(talkerindex, meindex, "您的活力不足，无法租用道具！", "红色")
				return
			end
			char.setInt(talkerindex, "活力", CharVigor - TM_DelVigor)
			local TM_ItemIndex = npc.AddRandItem(talkerindex, TM_ItemId[TM_ItemSelect][TM_ItemData])			

			local TM_OldSM = item.getChar(TM_ItemIndex, "说明")
			TM_OldSM = string.gsub(TM_OldSM, "净化精灵", "净化")
			TM_OldSM = string.gsub(TM_OldSM, "的精灵", "精灵")
			TM_OldSM = string.gsub(TM_OldSM, "地", "")
			TM_OldSM = string.gsub(TM_OldSM, "水", "")
			TM_OldSM = string.gsub(TM_OldSM, "火", "")
			TM_OldSM = string.gsub(TM_OldSM, "风", "")
			TM_OldSM = string.gsub(TM_OldSM, "[%[%]]", "")
			TM_OldSM = string.gsub(TM_OldSM, "  ", "")
			TM_OldSM = string.gsub(TM_OldSM, "? ", "?")
			TM_OldSM = string.gsub(TM_OldSM, "?", "? ")
			local TM_NewSM = TM_Token .. TM_OldSM
			local TM_OldName = item.getChar(TM_ItemIndex, "显示名")
			local TM_NewName = string.gsub(TM_OldName, "合成", "租用的")
			local TM_BdOldName = item.getChar(TM_ItemIndex, "名称")
			local TM_BdNewName = string.gsub(TM_OldName, "合成", "*租用的")
			item.setChar(TM_ItemIndex, "名称", TM_BdNewName)
			item.setChar(TM_ItemIndex, "说明", TM_NewSM)
			item.setChar(TM_ItemIndex, "显示名", TM_NewName)
			item.setInt(TM_ItemIndex, "物品时间", TM_SetTime)
			item.setInt(TM_ItemIndex, "颜色", 1)
			char.sendStatusString(talkerindex,"I")
			char.TalkToCli(talkerindex, meindex, "扣除活力:" .. TM_DelVigor .. "  拿到道具:" .. item.getChar(TM_ItemIndex, "显示名"), "绿色")
		end
	elseif seqno == 5 then -- 装备修理代码开始
		num = other.atoi(data)
		char.setWorkInt(talkerindex,"NPC临时9",num)
		if num >= 1 and num <= 5 then
			local TempItemIndex = char.getItemIndex( talkerindex, TM_equipid[num]);	
			if TempItemIndex < 0 then
				char.TalkToCli(talkerindex, meindex, "该道具栏无装备！", "红色")
				return
			end
			local TM_ItemMinNJ = item.getInt(TempItemIndex, "最小度")
			local TM_ItemMaxNJ = item.getInt(TempItemIndex, "最大度")
			local TM_XLtype = char.getWorkInt(talkerindex,"NPC临时1")
			if TM_XLtype == 1 then
				local TM_XlStone = (100 - math.floor( TM_ItemMinNJ / TM_ItemMaxNJ * 100)) * TM_XL[1]
				if TM_ItemMaxNJ <= 0 then
				   char.TalkToCli(talkerindex, meindex, "此装备无需修理，谢谢！", "红色")
				   return
				end
                char.setWorkInt(talkerindex,"NPC临时8",TM_XlStone)				
				token = "                 " .. char.getChar(meindex, "名字") .. "\n\n\n"
						.. "您要修理的装备:" .. item.getChar(TempItemIndex, "显示名") .. "\n"
						.. "修理所需要耗费活力:" .. TM_XlStone .. "\n"
						.. "是否确认修理？确认请按[确定].." 
				ShowWindow(meindex, talkerindex, 1, 1, 6, token, 2)
			elseif TM_XLtype == 2 then
				if item.getInt(TempItemIndex, "物品时间") > 0 then
					char.TalkToCli(talkerindex, meindex, "此装备不是普通装备，无法修理！", "红色")
					return
				end
				local TM_XlStone = (100 - math.floor( TM_ItemMinNJ / TM_ItemMaxNJ * 100)) * TM_XL[2]
				char.setWorkInt(talkerindex,"NPC临时8",TM_XlStone)
				if TM_ItemMaxNJ == 0 and TM_ItemMinNJ == 0 then TM_XlStone = 0 end
				token = "                  " .. char.getChar(meindex, "名字") .. "\n\n\n"
						.. "您要修理的普通装备:" .. item.getChar(TempItemIndex, "显示名") .. "\n"
						.. "修理所需要耗费活力:" .. TM_XlStone .. "\n"
						.. "是否确认修理？确认请按[确定].." 
				ShowWindow(meindex, talkerindex, 1, 1, 6, token, 2)				
			else
				char.TalkToCli(talkerindex, meindex, "未知错误！", "红色")
				return
			end
		end
		
	elseif seqno == 6 then
		if select == 4 then
			local tempnum = char.setWorkInt(talkerindex,"NPC临时9",num)
			local TempItemIndex = char.getItemIndex( talkerindex, TM_equipid[tempnum])
			local MyStone = char.getInt(talkerindex,"活力")
			local TM_XlStone = char.getWorkInt(talkerindex,"NPC临时8")
			if TempItemIndex < 0 then
				char.TalkToCli(talkerindex, meindex, "该道具栏无装备！", "红色")
				return
			elseif item.getInt(TempItemIndex, "最大度") <= 0 then
				char.TalkToCli(talkerindex, meindex, "此装备无需修理，谢谢！", "红色")
				return
			elseif TM_XlStone <= 0 then
				char.TalkToCli(talkerindex, meindex, "此装备无需修理，谢谢！", "红色")
				return
			elseif MyStone < TM_XlStone then
				char.TalkToCli(talkerindex, meindex, "您的活力不足".. TM_XlStone .."，无法修理！", "红色")
				return
			end
			
			char.setInt(talkerindex, "活力", MyStone - TM_XlStone)
			char.TalkToCli(talkerindex, meindex, "扣除".. TM_XlStone .."活力。", "绿色")
			item.setInt(TempItemIndex, "最小度", item.getInt(TempItemIndex, "最大度"))
			char.sendStatusString(talkerindex,"I");
			char.TalkToCli(talkerindex, meindex, item.getChar(TempItemIndex, "显示名") .." 已经成功修复。", "绿色")
		end
		
	elseif seqno == 7 then
		if select == 4 then
			ShowItem(meindex, talkerindex, 8)
		end
	elseif seqno == 8 then
		if select == 32 then
			ShowItem(meindex, talkerindex, 9)
		elseif select == 0 then
			num = other.atoi(data)
			ShowItemOne(meindex, talkerindex, num + 8)
		end
	elseif seqno == 9 then
		if select == 16 then
			ShowItem(meindex, talkerindex, 8)
		elseif select == 32 then
			ShowItem(meindex, talkerindex, 10)
		elseif select == 0 then
			num = other.atoi(data)
			ShowItemOne(meindex, talkerindex, num + 13)
		end
	elseif seqno == 10 then
		if select == 16 then
			ShowItem(meindex, talkerindex, 9)
		elseif select == 0 then
			num = other.atoi(data)
			ShowItemOne(meindex, talkerindex, num + 18)
		end
	
	elseif seqno == 11 then
		if select == 2 or select == 8 then return end
		lssproto.windows(talkerindex, "对话框", 40, 12, char.getWorkInt( meindex, "对象"), TM_ReadMe[2])
	elseif seqno == 12 then	
		if select == 2 or select == 8 then return end
		lssproto.windows(talkerindex, "对话框", 40, 13, char.getWorkInt( meindex, "对象"), TM_ReadMe[3])
	elseif seqno == 13 then
		if select == 2 or select == 8 then return end
		lssproto.windows(talkerindex, "对话框", 40, 14, char.getWorkInt( meindex, "对象"), TM_ReadMe[4])
	elseif seqno == 14 then	
		if select == 2 or select == 8 then return end
		lssproto.windows(talkerindex, "对话框", 40, 15, char.getWorkInt( meindex, "对象"), TM_ReadMe[5])	
	elseif seqno == 15 then	
		if select == 2 or select == 8 then return end
		lssproto.windows(talkerindex, "对话框", 12, -1, char.getWorkInt( meindex, "对象"), TM_ReadMe[6])		

	end						
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function ShowItem( meindex, charindex, page)
	start = 0
	button = 8
	if page == 8 then
		start = 9
		button = 40
	elseif page == 9 then
		start = 14
		button = 56
	elseif page == 10 then
		start = 19
		button = 24
	end

	token = "3\n                  " .. char.getChar(meindex, "名字") .. "\n请问你要鉴定哪个呢？\n"

	for i=start, start + 4 do
		itemindex = char.getItemIndex(charindex, i)
		if itemindex == -1 then
			token = token .. "\n　　　　　　道具栏" .. i - 8 .. "：没有道具"
		else
			token = token .. "\n　　　　　　道具栏" .. i - 8 .. "：" .. item.getChar(itemindex, "名称")
		end
	end
	
	lssproto.windows(charindex, "选择框", button, page, char.getWorkInt( meindex, "对象"), token)
end

function ShowItemOne( meindex, charindex, id)
	itemindex = char.getItemIndex(charindex, id)
	if itemindex == -1 then
		char.TalkToCli(charindex, meindex, "该位置并不存在物品！", "黄色")
		return
	else
		token = "                  " .. char.getChar(meindex, "名字") .. "\n"
					.. "道具栏" .. id .. "：" .. item.getChar(itemindex, "名称") .. "\n"
					.. string.format("\n攻击:%-8d防御:%-8d敏捷:%-8d", item.getInt(itemindex, "攻"), item.getInt(itemindex, "防"), item.getInt(itemindex, "敏"))
					.. string.format("\n运气:%-8d魅力:%-8d回避:%-8d", item.getInt(itemindex, "运气"), item.getInt(itemindex, "魅力"), item.getInt(itemindex, "回避"))
					--.. string.format("\n毒耐:%-8d麻耐:%-8d睡耐:%-8d", item.getInt(itemindex, "毒耐"), item.getInt(itemindex, "麻耐"), item.getInt(itemindex, "睡耐"))
					--.. string.format("\n石耐:%-8d酒耐:%-8d混耐:%-8d", item.getInt(itemindex, "石耐"), item.getInt(itemindex, "酒耐"), item.getInt(itemindex, "混耐"))
		--token = token .. "\n\n物品成份："
		for i=0, 4 do
		--if item.getChar(itemindex, "成份名" .. i) ~= "" then
				--token = token .. item.getChar(itemindex, "成份名" .. i) .. ":" .. item.getInt(itemindex, "份量" .. i) .. "  "
			end
		end
		lssproto.windows(charindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
	end
--end

function data()			
	TM_Gold = {{50,100,150,300},{50,100,150,300},{50,100,150,300},{50,100,150,300}}
	
	TM_Vigor = {{20,50,80,150},{20,50,80,150},{20,50,80,150},{20,50,80,150}}
	
	TM_Point = {{0,0,0,0},{0,0,0,0}}
	
	TM_XL = {10,100}
	
	TM_ItemName = {	
					{
						"租用兜(可租到11到18级的兜)","租用兜11—12(有几率带精灵)","租用兜13—14(有几率带精灵)","租用兜15—16(不带任何精灵)","租用兜17—18(不带任何精灵)"
					},
					
					{	
						"租用铠(可租到11到18级的铠)","租用铠11—12(有几率带精灵)","租用铠13—14(有几率带精灵)","租用铠15—16(不带任何精灵)","租用铠17—18(不带任何精灵)"
					},
					
					{
						"租用服(可租到11到18级的服)","租用服11—12(有几率带精灵)","租用服13—14(有几率带精灵)","租用服15—16(不带任何精灵)","租用服17—18(不带任何精灵)"
					},
					
					{	
						"租防具(可租到11到18级防具)","租用防具11—12(有几率带精灵)","租用防具13—14(有几率带精灵)","租用防具15—16(不带任何精灵)","租用防具17—18(不带任何精灵)"
					}
				};
	
	TM_ItemId = {
					{
						"16401-16406,16431-16436,16401-16430",
						"16461-16466,16491-16496,16461-16520",
						"16521,16527,16533,16539,16545,16521,16551,16557,16563,16569,16575,16551",
						"16581,16587,16593,16607,16599,16581,16611,16617,16623,16629,16635,16611"
					},

					{
						"17001-17010,17051-17060,17001-17100",
						"17101-17110,17151-17160,17101-17200",
						"17201,17211,17221,17231,17241,17201,17251,17261,17271,17281,17291,17251",
						"17301,17311,17321,17331,17341,17301,17351,17361,17371,17381,17391,17351"
					},
					
					{
						"17501-17600",
						"17601-17700",
						"17701,17711,17721,17731,17741,17701,17751,17761,17771,17781,17791,17751",
						"17801,17811,17821,17831,17841,17801,17851,17861,17871,17881,17891,17851"
					},
					
					{
						"16701-16760",
						"16761-16820",
						"16821,16827,16833,16839,16845,16851,16857,16863,16869,16875,16821,16851",
						"16881,16887,16893,16899,16905,16881,16911,16917,16923,16929,16935,16911"
					}
				};
									 
	TM_ReadMe = {
					"　　　　　　　『设计初衷』\n\n为了刺激族战和PK，为了让散人玩家和不会合成装备的玩家也能穿上不俗的装备，我们开发了此系统，此系统主要为活力点数应用、今后以活力点数为主，石币兑换是暂时的，以后会取消。",
					"　　　　　　　『装备租用』\n\n通过石币或者活力点数租用装备，可自选天数\n扣除活力或石币后即可得到随机属性的装备。\n\nPS：为刺激族战和PK,暂时开放石币兑换\n　　15级以上都是不带精灵的白装",
					"　　　　　　　『装备修理』\n\n这里可以修理租用出去的装备和普通装备，租的装备修理价格还是非常便宜的，只要支付一点点的活力就可以把装备修复的崭新崭新的，普通装备要我来修就要贵好几倍咯。\n租用道具修理收费：1%--10活力   [暂定]\n普通道具修理收费：1%--100活力  [暂定]",
					"　　　　　　　『装备鉴定』\n\n这个功能可以鉴定你一切道具的真实属性，不用再自己加加减减了，另外我们在摆摊中也加入了真实属性的显示，所以贩卖装备也非常方便，不用担心上当受骗的哦，赶快去试试吧！",
					"　　　　　　　『注意事项』\n\n租用装备一旦生成不可交易、不可摆摊、不可邮寄、不可合成、不可料理、丢弃消失、会显示到期时间且不可自己增加时间，所以想随机到一个极品再加天数是不可能的，只有在租用之前来定天数的，所以RP还是非常重要的，希望你好运哦。",
					"　　　　　　　『极品秘笈』\n\n\n     多读书,多看报,少吃零食,多睡觉!\n\n\n                            www.shiqi.pk\n                              荣誉出品",
					"dada",
					"dede"
				};		

	TM_equipid = {0,1,2,3,4}

end

function main()
	data()
	Create("「 装备修理商 」", 26855, 2005, 22, 6, 6)
end