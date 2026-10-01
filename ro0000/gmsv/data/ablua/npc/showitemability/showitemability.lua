function ShowItem( meindex, charindex, page)
	start = 0
	button = "取消"
	if page == 1 then
		start = 9
		button = "取消|下一页"
	elseif page == 2 then
		start = 14
		button = "取消|上一页|下一页"
	elseif page == 3 then
		start = 19
		button = "取消|上一页"
	end

	token = "3\n                 『" .. char.getChar(meindex, "名字") .. "』\n\n请问我有什么可以帮到您呢？"

	for i=start, start + 4 do
		itemindex = char.getItemIndex(charindex, i)
		if itemindex == -1 then
			token = token .. "\n    道具栏" .. i - 8 .. "：空"
		else
			token = token .. "\n    道具栏" .. i - 8 .. "：" .. item.getChar(itemindex, "名称")
		end
	end
	
	lssproto.windows(charindex, "选择框", button, page, char.getWorkInt( meindex, "对象"), token)
end

function ShowItemOne( meindex, charindex, id)
	itemindex = char.getItemIndex(charindex, id)
	if itemindex == -1 then
		char.TalkToCli(charindex, meindex, "该位置并不存在物品！", "随机色")
	else
		token = "                 『" .. char.getChar(meindex, "名字") .. "』\n"
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
		lssproto.windows(charindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
	end
--end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "                 『" .. char.getChar(meindex, "名字") .. "』\n\n"
					 .. "    我可以帮你鉴定你身上的物品隐藏属性，请问你是否需要我帮你鉴定呢？？"

		lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if select == 1 then
				ShowItem(meindex, talkerindex, 1)
			end
		elseif seqno == 1 then
			if select == 32 then
				ShowItem(meindex, talkerindex, 2)
			elseif select == 0 then
				num = other.atoi(data)
				ShowItemOne(meindex, talkerindex, num + 8)
			end
		elseif seqno == 2 then
			if select == 16 then
				ShowItem(meindex, talkerindex, 1)
			elseif select == 32 then
				ShowItem(meindex, talkerindex, 3)
			elseif select == 0 then
				num = other.atoi(data)
				ShowItemOne(meindex, talkerindex, num + 13)
			end
		elseif seqno == 3 then
			if select == 16 then
				ShowItem(meindex, talkerindex, 2)
			elseif select == 0 then
				num = other.atoi(data)
				ShowItemOne(meindex, talkerindex, num + 18)
			end
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

function main()
	Create("物品鉴定师", 16347, 777, 20, 20, 6)
end

