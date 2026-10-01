function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function ShowHead(meindex, talkerindex)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "您确定要用两只佩鲁夏换取5个邦司凉朵字牌吗？"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = char.getChar(meindex, "名字") .. "||1|" .. itemlist[1][2]
		lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < table.getn(itemlist) or  num > table.getn(itemlist) then
			return
		end
		token = "您确定兑换[" .. itemlist[num][2] .. "]的罐头吗？\n"
			 .. "需要以下材料：\n"
			 .. "道具：" .. item.getSecretNameFromNumber(itemlist[num][3][1]) .. "、"
			 .. item.getSecretNameFromNumber(itemlist[num][3][2]) .. "、"
			 .. item.getSecretNameFromNumber(itemlist[num][3][3]) .. "、"
			 .. item.getSecretNameFromNumber(itemlist[num][3][4]) .. "、"
			 .. item.getSecretNameFromNumber(itemlist[num][3][5]) .. "\n"
			 .. "声望：" .. itemlist[num][4] .. "\n"
			 .. "活力：" .. itemlist[num][5]
		lssproto.windows(talkerindex, "对话框", "确定|取消", num, char.getWorkInt( meindex, "对象"), token)
	elseif seqno >= 1 then
		if seqno < table.getn(itemlist) or seqno > table.getn(itemlist) then
			return
		end
		if select == 1 then
			if npc.Free(-1,talkerindex,"ITEM=" .. itemlist[seqno][3][1] .. "&ITEM=" .. itemlist[seqno][3][2] .. "&ITEM=" .. itemlist[seqno][3][3] .. "&ITEM=" .. itemlist[seqno][3][4] .. "&ITEM=" .. itemlist[seqno][3][5]) ~= 1 then
				char.TalkToCli(talkerindex, meindex, "您没有集齐5种碎片哦", "随机色")
				return
			end
			if char.getInt(talkerindex,"声望") < itemlist[seqno][4] * 100 then
				char.TalkToCli(talkerindex, meindex, "您声望不足哦", "随机色")
				return
			end
			if char.getInt(talkerindex,"活力") < itemlist[seqno][5] then
				char.TalkToCli(talkerindex, meindex, "您活力不足哦", "随机色")
				return
			end
			if checkEmptItemNum(talkerindex) < 1 then
				char.TalkToCli(talkerindex, meindex, "道具栏空位不足", "随机色")
				return
			end
			npc.DelItemNum(talkerindex,itemlist[seqno][3][1] .. ",1")
			npc.DelItemNum(talkerindex,itemlist[seqno][3][2] .. ",1")
			npc.DelItemNum(talkerindex,itemlist[seqno][3][3] .. ",1")
			npc.DelItemNum(talkerindex,itemlist[seqno][3][4] .. ",1")
			npc.DelItemNum(talkerindex,itemlist[seqno][3][5] .. ",1")
			char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - itemlist[seqno][4] * 100)
			char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - itemlist[seqno][5])
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,itemlist[seqno][5]})
			char.Additem(talkerindex,itemlist[seqno][1])
			char.TalkToCli(talkerindex, -1, "交出5个碎片，扣除" .. itemlist[seqno][4] .. "声望、" .. itemlist[seqno][5] .. "活力", "随机色")
			char.TalkToCli(talkerindex, -1, "得到[" .. itemlist[seqno][2] .. "]宠技罐头", "随机色")
		end
	end
end


function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	itemlist = {{22401,"浴血狂袭",{22402,22403,22404,22405,22406},20000,10000}}
end

function main()
	--Create("技能罐头兑换员", 26858, 1000, 73, 72, 4)
	data()
end