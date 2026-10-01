function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function DaySign(charaindex)
	if char.getInt(charaindex,"签到时间") == tonumber(os.date("%Y%m%d", os.time())) then
		char.TalkToCli(charaindex, -1, "您今天已经领取过了，改天再来吧。", "随机色")
		return 0
	end
	if char.getInt(charaindex,"签到在线时间") < 120 then
		char.TalkToCli(charaindex, -1, "[每日奖励] 您今天在线时长[" .. char.getInt(charaindex,"签到在线时间") .. "]分钟，还差[" .. 120 - char.getInt(charaindex,"签到在线时间") .. "]分钟可以领取今日奖励哦。", "随机色")
		return 0
	end
	token = ""
	lssproto.windows(charaindex, 1025, "确定|取消", 0, char.getWorkInt(npcindex,"对象"), token)
	return 0
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	itemid = {22036,22037}
	if select == 1 then
		if char.getInt(talkerindex,"签到时间") == tonumber(os.date("%Y%m%d", os.time())) then
			char.TalkToCli(talkerindex, -1, "您已经领取过了，改天再来吧。", "随机色")
			return
		end
		if char.getInt(talkerindex,"签到在线时间") < 120 then
			char.TalkToCli(talkerindex, -1, "[每日奖励] 您今天在线时长[" .. char.getInt(talkerindex,"签到在线时间") .. "]分钟，还差[" .. 120 - char.getInt(talkerindex,"签到在线时间") .. "]分钟可以领取今日奖励哦。", "随机色")
			return
		end
		if checkEmptItemNum(talkerindex) < table.getn(itemid) then
			char.TalkToCli(talkerindex, -1, "请将您的背包空出" .. table.getn(itemid) .. "个空位。", "随机色")
			return
		end
		for i=1,table.getn(itemid) do
			if npc.Free(meindex, talkerindex, "ITEM=" .. itemid[i]) == 1 then
				char.TalkToCli(talkerindex, -1, "您的昨日的奖励的道具还没有用完哦，用完后再来领吧。", "随机色")
				return
			end
		end
		for i=1,table.getn(itemid) do
			local itemindex = char.Additem(talkerindex,itemid[i])
			--[[if itemid[i] == 22043 then
				item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
				item.UpdataItemOne(talkerindex,itemindex)
			end]]
		end
		char.setInt(talkerindex,"签到时间",tonumber(os.date("%Y%m%d", os.time())))
		char.TalkToCli(talkerindex, -1, "恭喜您领取一枚三小时智慧果、一张地狱通行证、爱生活、爱石器、记得帮我们多多推荐新朋友哦！", "随机色")
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
	itemid = {22036,22037}
end

function main()
	data()
	Create("每日奖励", 60295, 777, 14, 11, 6)
end
