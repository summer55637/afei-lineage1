function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = char.getChar(meindex, "名字") .. "|可兑换30天或永久皮肤|8|红王赛亚人[30天]|粉虎赛亚人[30天]|粉虎赛亚人[永久]|橙虎小豆丁[永久]|蓝虎酷哥[永久]|乌宝依豆丁[永久]|绿人龙豆丁[永久]"
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > 7 then
				return
			end
			token = "兑换" .. item.getSecretNameFromNumber(itemlist[num][1]) .. "\n需要:" .. item.getSecretNameFromNumber(itemlist[num][2]) .. " * " .. itemlist[num][3] .. "\n需要声望" .. itemlist[num][4] .."\n需要活力" .. itemlist[num][5] 
			lssproto.windows(talkerindex, "对话框", "确定|取消", num, char.getWorkInt( meindex, "对象"), token)
		elseif seqno >= 1 and seqno <= 7 then
			if select ~= 1 then
				return
			end
			num = seqno
			if checkEmptItemNum(talkerindex) < 1 then
				char.newMessageToCli(talkerindex, -1, "您的道具栏空位不足", "白色")
				return
			end
			if npc.Free(-1,talkerindex,"ITEM=" .. itemlist[num][2] .. "*" .. itemlist[num][3]) ~= 1 then
				char.newMessageToCli(talkerindex, -1, "条件不足", "白色")
				return
			end
			
			if itemlist[num][4] > 0 then
				if char.getInt(talkerindex, "声望") < itemlist[num][4] * 100 then
					char.TalkToCli(talkerindex, meindex, "您的声望不足", "黄色")
					lssproto.windows(talkerindex, 1038, 0, -1, -1, "3")
					return
				end
			end
			if itemlist[num][5] > 0 then
				if char.getInt(talkerindex, "活力") < itemlist[num][5] then
					char.TalkToCli(talkerindex, meindex, "您的活力不足", "黄色")
					lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
					return
				end
			end
				char.setInt(talkerindex, "声望", char.getInt(talkerindex, "声望") - itemlist[num][4] * 100)--需要2种提示
				char.newMessageToCli(talkerindex, -1, "扣除" .. itemlist[num][4] .. "声望", "白色")
				char.TalkToCli(talkerindex, meindex, "扣除".. itemlist[num][4] .. "声望", "黄色")

				char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - itemlist[num][5])--需要2种提示
				char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + itemlist[num][5] * 100)
				saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
				char.newMessageToCli(talkerindex, -1, "扣除" .. itemlist[num][5] .. "活力", "白色")
				char.TalkToCli(talkerindex, meindex, "扣除".. itemlist[num][5] .. "活力", "黄色")
			
				npc.DelItem(talkerindex,itemlist[num][2] .. "*" .. itemlist[num][3])
				char.Additem(talkerindex,itemlist[num][1])
				char.newMessageToCli(talkerindex, -1, "获得" .. item.getSecretNameFromNumber(itemlist[num][1]), "白色")
				--char.charSaveFromConnect(talkerindex)
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
	itemlist = {{28432,29082,8,500,300},
				{28438,29082,8,500,300},
			    {28439,29082,20,2000,1000},
				{28441,29082,20,2000,1000},
				{28443,29082,20,2000,1000},
				{29027,29082,20,2000,1000},
				{29025,29082,20,2000,1000}}--道具，材料，数量,声望,活力
end

function main()
	data()
	Create("皮肤商人", 26886, 2005, 28, 5, 6)
end
