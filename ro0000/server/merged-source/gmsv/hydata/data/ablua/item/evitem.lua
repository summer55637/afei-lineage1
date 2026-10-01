function PlayerEvent(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(charaindex,"转数") < 1 and char.getInt(charaindex,"等级") < 120 then
		char.newMessageToCli(charaindex,-1,"0转120级以下无法使用","白色")
		return
	end
	if item.getChar(itemindex,"字段") == "1" then
		token = "您确认需要把1.82任务封印到卷轴中吗？\n请确认你完成22个1.82必须完成的任务。\n封印后你会失去这些任务的完成证明。\n制作完成的封印卷轴可以交易给他人使用。\n使用后得到你封印的所有任务的证明。\n确认封印请按确认键。"
	elseif item.getChar(itemindex,"字段") == "2" then
		token = "                  「 封印卷轴 」\n\n\n            您确认要打开到这张1.82卷轴\n             完成所有的1.82相关任务么\n\n                确认打开请确定哦"
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
			for i=1,table.getn(eventid) do
				if npc.Free(meindex, talkerindex, "ENDEV=" .. eventid[i]) ~= 1 then
					char.TalkToCli(talkerindex, -1, "[温馨提示]您的人物还没完成全套1.82任务！", "随机色")
					return
				end
			end
			for i=1,table.getn(eventid2) do
				npc.EvClr(talkerindex, eventid2[i])
			end
			item.setChar(itemindex,"字段","2")
			item.setChar(itemindex,"显示名","任务封印卷轴√1.82")
			item.setChar(itemindex,"说明","已经封印了所有1.82任务的卷轴双击使用可以完成所有1.82任务")
			char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜你封印1.82成功，您的1.82相关任务已经清空！", "随机色")
			item.UpdataItemOne(talkerindex,itemindex)
			--char.charSaveFromConnect(talkerindex)
			char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色")
		elseif type == 2 then
			for i=1,table.getn(eventid2) do
				npc.EvEnd(talkerindex, eventid2[i])
			end
			char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜你已经完成1.82全部任务，为成为一名极品人努力吧！", "随机色")
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
	eventid = {1,2,3,4,5,8,12,13,15,16,17,19,22,27,31,34,35,38,45,47,54}
	eventid2 = {1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,18,19,20,21,22,27,28,29,30,31,32,33,34,35,37,38,44,45,47,54} --清和给
end


function main()
	Create("任务卷轴", 101156, 777, 11, 13, 4)
	data()
	item.addLUAListFunction( "ITEM_PLAYEREVENT", "PlayerEvent", "")
end