function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function PlayerEvent2(itemindex, charaindex, toindex, haveitemindex)
	if item.getChar(itemindex,"字段") == "1" then
		token = "您确认需要把四大任务封印到卷轴中吗？\n请确认你完成4个四大必须完成的任务。\n而且身上必须携带四大证明。\n封印后你会失去这些任务的完成证明。\n制作完成的封印卷轴可以交易给他人使用。\n使用后得到你封印的所有任务的证明。\n确认封印请按确认键。"
	elseif item.getChar(itemindex,"字段") == "2" then
		token = "                  「 封印卷轴 」\n\n\n            您确认要打开到这张四大卷轴\n             完成所有的四大相关任务么\n\n                确认打开请确定哦"
	else
		return
	end
	lssproto.windows(charaindex, "对话框", 12, 0, char.getWorkInt( npcindex, "对象"), token)
	char.setWorkInt(charaindex,"计时器",itemindex)
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 1 or select == 4 then
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
		local type = other.atoi(item.getChar(itemindex,"字段"))
		if type == 1 then
			for i=1,#eventid do
				if npc.Free(meindex, talkerindex, "ENDEV=" .. eventid[i]) ~= 1 then
					char.TalkToCli(talkerindex, -1, "[温馨提示]您的人物还没完全完成四大洞穴任务！", "随机色")
					return
				end
			end
			for i=1,#itemid do
				if npc.Free(meindex, talkerindex, "ITEM=" .. itemid[i]) ~= 1 then
					char.TalkToCli(talkerindex, -1, "[温馨提示]您身上还需要带齐四大洞穴任务道具，封印后这些道具会清除。", "随机色")
					return
				end
			end
			for i=1,#eventid2 do
				npc.EvClr(talkerindex, eventid2[i])
			end
			for i=1,#itemid do
				for k=9,23 do
					local tempitemindex = char.getItemIndex(talkerindex, k)
					if item.check(tempitemindex) == 1 then
						if item.getInt(tempitemindex,"序号") == itemid[i] then
							char.DelItem(talkerindex,k)
							break
						end
					end
				end
			end
			item.setChar(itemindex,"字段","2")
			item.setChar(itemindex,"显示名","四大封印卷轴√")
			item.setChar(itemindex,"说明","已经封印了所有四大任务的卷轴双击使用可以完成所有四大任务")
			char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜你封印四任务成功，您的四大相关任务和证明已经清空！", "随机色")
			item.UpdataItemOne(talkerindex,itemindex)
			--char.charSaveFromConnect(talkerindex)
			char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色")
		elseif type == 2 then
			if checkEmptItemNum(talkerindex) < #itemid then
				char.TalkToCli(talkerindex, -1, "[温馨提示]请您身上空出" .. table.getn(itemid) .. "个道具位。", "随机色")
				return
			end
			for i=1,#eventid2 do
				npc.EvEnd(talkerindex, eventid2[i])
			end
			for i=1,#itemid do
				char.Additem(talkerindex, itemid[i])
			end
			char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜你已经完成四大洞窟全部任务，为成为一名极品人努力吧！", "随机色")
			char.DelItem(talkerindex, j)
			--char.charSaveFromConnect(talkerindex)
			char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色")
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
	itemid = {2701,2707,2735,2770}
	eventid = {39,40,42,46}
	eventid2 = {39,40,41,42,46} --清和给
end


function main()
	Create("任务卷轴", 101156, 777, 12, 18, 4)
	data()
	item.addLUAListFunction( "ITEM_PLAYEREVENT2", "PlayerEvent2", "")
end