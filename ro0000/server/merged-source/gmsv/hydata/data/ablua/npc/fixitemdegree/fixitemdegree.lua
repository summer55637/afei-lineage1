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

	token = "3\n                 『" .. char.getChar(meindex, "名字") .. "』\n\n请问您需要修复哪件装备？"

	for i=start, start + 4 do
		itemindex = char.getItemIndex(charindex, i)
		if itemindex == -1 then
			token = token .. string.format("\n    道具栏%-2d：空", i - 8)
		else
			if item.getInt(itemindex, "最大度") > 0 then
				token = token .. string.format("\n    道具栏%-2d：%-16s FM:%d", i - 8, item.getChar(itemindex, "名称"), (item.getInt(itemindex, "最大度") - item.getInt(itemindex, "最小度")) / 10000 + 1)
			else
				token = token .. string.format("\n    道具栏%-2d：%-16s", i - 8, item.getChar(itemindex, "名称"))
			end
		end
	end
	
	lssproto.windows(charindex, "选择框", button, page, char.getWorkInt( meindex, "对象"), token)
end

function ShowItemOne( meindex, charindex, id)
	itemindex = char.getItemIndex(charindex, id)
	if itemindex == -1 then
		char.TalkToCli(charindex, meindex, "该位置并不存在物品！", "黄色")
	else
		if item.getInt(itemindex, "最大度") > 0 then
			fm = (item.getInt(itemindex, "最大度") - item.getInt(itemindex, "最小度")) / 10000 + 1
			if char.getInt(charindex, "声望") < fm * 100 then
				token = "                 『" .. char.getChar(meindex, "名字") .. "』\n\n很抱歉，你的声望不足修复此装备！"
				lssproto.windows(charindex, "对话框", "取消", -1, -1, token)
			else
				npc.DelFame(charindex, fm)
				item.setInt(itemindex, "最小度", item.getInt(itemindex, "最大度"))
				item.UpdataItemOne(charindex, itemindex)
				token = "                 『" .. char.getChar(meindex, "名字") .. "』\n\n"
							.. item.getChar(itemindex, "名称") .. "已修复完毕，需久度为" .. item.getInt(itemindex, "最小度")
				lssproto.windows(charindex, "对话框", "取消", -1, -1, token)
			end
		else
			token = "                 『" .. char.getChar(meindex, "名字") .. "』\n\n该物品无需修复！"
			lssproto.windows(charindex, "对话框", "取消", -1, -1, token)
		end
	end
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "                 『" .. char.getChar(meindex, "名字") .. "』\n\n"
					 .. "    需要修复你身上的装备吗？每1耐久度支付我1声望的进行修复？？"

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
	Create("装备修复", 16363, 2005, 22, 8, 6)
end

