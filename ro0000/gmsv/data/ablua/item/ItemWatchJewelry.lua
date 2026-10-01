function trim(s) 
	local ts = string.gsub(s, "^%s*(.-)%s*$", "%1")
	ts = string.gsub(ts, "    ", " ")
	ts = string.gsub(ts, "　　", " ")
	ts = string.gsub(ts, "　", " ")
	ts = string.gsub(ts, "    ", " ")
	ts = string.gsub(ts, "  ", " ")
	return ts
end 

function ShowWindow(meindex, talkerindex, page, maxpage, seqno, token, mytype)
		--char.setWorkInt(talkerindex,"NPC临时11",page)
		
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

function WatchJewelry(itemindex, charaindex, toindex, haveitemindex)
	token = "2\n请选择您要鉴定的合成首饰：\n\n"
	for i = 9, 13 do
		local TempItemIndex = char.getItemIndex( charaindex, i );
		if TempItemIndex > 0 then
			token = token .. "　　　　　　　　　" .. item.getChar(TempItemIndex, "名称") .. "\n"
		else
			token = token .. "　　　　　　　　　没有道具" .. "\n"
		end
	end
	ShowWindow(npcindex, charaindex, 1, 3, 1, token, 1)
	char.setWorkInt(charaindex,"计时器",itemindex)
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno >= 1 and seqno <= 3 then
		if select == 16 then
			if seqno == 1 then
				return
			end
			token = "2\n请选择您要鉴定的合成首饰：\n\n"
			for i = (seqno - 1 - 1) * 5 + 9, (seqno - 1 - 1) * 5 + 13 do
				local TempItemIndex = char.getItemIndex( talkerindex, i );
				if TempItemIndex > 0 then
					token = token .. "　　　　　　　　　" .. item.getChar(TempItemIndex, "名称") .. "\n"
				else
					token = token .. "　　　　　　　　　没有道具" .. "\n"
				end
			end
			ShowWindow(meindex, talkerindex, seqno - 1, 3, seqno - 1, token, 1)
			return
		end
		if select == 32 then
			if seqno == 3 then
				return
			end
			token = "2\n请选择您要鉴定的合成首饰：\n\n"
			for i = seqno * 5 + 9, seqno * 5 + 13 do
				local TempItemIndex = char.getItemIndex( talkerindex, i );
				if TempItemIndex > 0 then
					token = token .. "　　　　　　　　　" .. item.getChar(TempItemIndex, "名称") .. "\n"
				else
					token = token .. "　　　　　　　　　没有道具" .. "\n"
				end
			end
			ShowWindow(meindex, talkerindex, seqno + 1, 3, seqno + 1, token, 1)
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		local itemindex = char.getWorkInt(talkerindex,"计时器")
		if item.check(itemindex) == 0 then
			return
		end
		local j = -1
		for i=9,23 do
			if char.getItemIndex(talkerindex,i) == itemindex then
				j = i
				break
			end
		end
		if j == -1 then
			return
		end
		itemindex = char.getItemIndex(talkerindex,(seqno - 1) * 5 + 8 + num)
		if itemindex > 0 then
			itemname = item.getChar(itemindex, "名称")
			if string.find(itemname,"合成首饰") == nil then
				char.TalkToCli(talkerindex, -1, "[温馨提示]这个道具不是合成首饰哦。", "随机色")
				return
			end
			if item.getInt(itemindex,"序号") < 26201 or item.getInt(itemindex,"序号") > 26215 then
				if string.sub(itemname,1,1) == "*" then
					char.TalkToCli(talkerindex, -1, "[温馨提示]这个合成首饰已经鉴定过了。", "随机色")
					return
				end
			end
			token = ""
			if item.getInt(itemindex, "毒耐") ~= 0 then
				if item.getInt(itemindex, "毒耐") > 0 then
					token = token .. string.format("%-9s","毒抗+" .. item.getInt(itemindex, "毒耐"))
				else
					token = token .. string.format("%-9s","毒抗" .. item.getInt(itemindex, "毒耐"))
				end
			end
			if item.getInt(itemindex, "睡耐") ~= 0 then
				if item.getInt(itemindex, "睡耐") > 0 then
					token = token .. string.format("%-9s","睡抗+" .. item.getInt(itemindex, "睡耐"))
				else
					token = token .. string.format("%-9s","睡抗" .. item.getInt(itemindex, "睡耐"))
				end
			end
			if item.getInt(itemindex, "石耐") ~= 0 then
				if item.getInt(itemindex, "石耐") > 0 then
					token = token .. string.format("%-9s","石抗+" .. item.getInt(itemindex, "石耐"))
				else
					token = token .. string.format("%-9s","石抗" .. item.getInt(itemindex, "石耐"))
				end
			end
			if item.getInt(itemindex, "酒耐") ~= 0 then
				if item.getInt(itemindex, "酒耐") > 0 then
					token = token .. string.format("%-9s","酒抗+" .. item.getInt(itemindex, "酒耐"))
				else
					token = token .. string.format("%-9s","酒抗" .. item.getInt(itemindex, "酒耐"))
				end
			end
			if item.getInt(itemindex, "混耐") ~= 0 then
				if item.getInt(itemindex, "混耐") > 0 then
					token = token .. string.format("%-9s","混抗+" .. item.getInt(itemindex, "混耐"))
				else
					token = token .. string.format("%-9s","混抗" .. item.getInt(itemindex, "混耐"))
				end
			end
			if item.getInt(itemindex,"魅力") > 0 then
				token = token .. "魅+" .. item.getInt(itemindex,"魅力") .. " "
			end
			if string.find(itemname,"[地]") ~= nil then
				token = token .. "[地]"
			elseif string.find(itemname,"[水]") ~= nil then
				token = token .. "[水]"
			elseif string.find(itemname,"[火]") ~= nil then
				token = token .. "[火]"
			elseif string.find(itemname,"[风]") ~= nil then
				token = token .. "[风]"
			end
			if item.getInt(itemindex,"序号") < 26201 or item.getInt(itemindex,"序号") > 26215 then
				item.setChar(itemindex,"名称","*" .. itemname)
				item.setChar(itemindex,"显示名","*" .. itemname)
			end
			item.setChar(itemindex,"说明",token)
			item.UpdataItemOne(talkerindex,itemindex)
			char.DelItem(talkerindex, j)
			char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜您的合成首饰已经鉴定成功。", "随机色")
			return
		else
			char.TalkToCli(talkerindex, -1, "[温馨提示]这个位置好像没有道具哟。", "随机色")
			return
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	
end


function main()
	Create("鉴定之境", 101156, 777, 23, 13, 4)
	data()
	item.addLUAListFunction( "ITEM_WATCH_JEWELRY", "WatchJewelry", "")
end