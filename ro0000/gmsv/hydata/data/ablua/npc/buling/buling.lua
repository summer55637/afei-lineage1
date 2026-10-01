--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if char.getInt(talkerindex,"转数") >= 0 then 
		token = "                「 " .. char.getChar(meindex,"名字") .." 」\n\n"
			  .."我这里可以补领新手棒子和新手铠甲"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--char.TalkToCli(talkerindex,-1, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if select == 1 then
			local jiangitemindex = char.Additem(talkerindex,28319)
			local jiangitemindex1 = char.Additem(talkerindex,20627)
			if jiangitemindex > -1 or jiangitemindex1 > -1 then
				char.TalkToCli(talkerindex,meindex,  "这个"..item.getChar(jiangitemindex,"名称") .. "，需要还可以在拿噢。", "随机色")
				char.TalkToCli(talkerindex,meindex,  "这个"..item.getChar(jiangitemindex1,"名称") .. "，需要还可以在拿噢。", "随机色")
			else
				char.TalkToCli(talkerindex,meindex, "您身上道具已满，无法领取。", "随机色")
				return
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

function data()

end

function main()
	Create("新手装备补领", 60131, 3006, 17,14, 4)
	Create("新手装备补领", 60132, 4006, 17,24, 6)
	Create("新手装备补领", 60132, 1006, 18,24, 6)
	Create("新手装备补领", 60131, 2006, 23,14, 4)
	data()
end