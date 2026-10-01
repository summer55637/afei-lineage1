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
		token = "您确定要用两只佩露夏换取5个邦司凉朵字牌吗？"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		ShowHead(meindex, talkerindex)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 1 then
		if select == 1 then
			if checkEmptItemNum(talkerindex) < 5 then
				char.TalkToCli(talkerindex, meindex, "道具栏没有5个以上的空位", "随机色")
				return
			end
			local petindex = {-1,-1}
			local j = 0
			for i=0,4 do
				local TM_PetIndex = char.getCharPet(talkerindex,i)
				if char.check(TM_PetIndex) == 1 then
					if char.getInt(TM_PetIndex,"宠ID") == 777 then
						j = j + 1
						petindex[j] = TM_PetIndex
						if j == 2 then
							break
						end
					end
				end
			end
			if j < 2 then
				char.TalkToCli(talkerindex, meindex, "您身上没有两只佩露夏", "随机色")
				return
			end
			char.DelPet(talkerindex,petindex[1])
			char.DelPet(talkerindex,petindex[2])
			char.Additem(talkerindex,21123)
			char.Additem(talkerindex,21124)
			char.Additem(talkerindex,21125)
			char.Additem(talkerindex,21126)
			char.Additem(talkerindex,21127)
			char.TalkToCli(talkerindex, meindex, "交出两只佩露夏，获得5个邦司凉朵字牌", "随机色")
		end
	end
end


function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()

end

function main()
	Create("水暴字牌兑换员", 100909, 2005, 71, 64, 6)
	data()
end