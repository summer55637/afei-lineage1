function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "                [style c=4 s=16]「 机暴以旧换新 」[/style]\n\n" 
			 .. "你对你的机暴不满意么？可以找我换新的，你必须拿\n两只机暴给我，再加上200活力，\n就给你重新换成新的机暴玩偶！\n请准备好材料哦！只能带两只机暴来兑换\n你可以考虑下，再找我，其实还是很挺划算的嘛！" 						 
		lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		j = 0
		for i=1,5 do
			local TM_PetIndex = char.getCharPet(talkerindex,i-1)
			if char.check(TM_PetIndex) == 1 then
				if char.getInt(TM_PetIndex,"宠ID") == 304 then
					j = j + 1
				end
			end
		end
		
		if j < 2 then
	--		char.TalkToCli(talkerindex, -1, "您没有带足2只机暴哟！", "随机色")
		char.TalkToCli(talkerindex,"您没有带给我2只机暴哟！",4,300)
			return
		end
		
		if j > 2 then
			-- char.TalkToCli(talkerindex, -1, "您的机暴太多了吧，去存一个再来找我！", "随机色")
			char.TalkToCli(talkerindex,"您的机暴太多了吧，去存几个再来找我！",4,300)
			return
		end
		
		if char.getInt(talkerindex, "活力") < 200 then
			-- char.TalkToCli(talkerindex, -1, "您的声望不足500，不满足我的要求呢！", "随机色")
			char.TalkToCli(talkerindex,"您的活力不足200，这样可不行哦！",4,300)
			return
		end
		
		if checkEmptItemNum(talkerindex) < 1 then
			-- char.TalkToCli(talkerindex, -1, "您的道具栏已满，清空个位置给我放东西嘛。", "随机色")
			char.TalkToCli(talkerindex,"您的道具栏已满，清一下再来吧。",4,300)
			return
		end
		token = "               「 机暴以旧换新 」\n\n\n" 
			 .. "您真的确认要用2个机暴加上200活力兑换一个新的机暴玩偶哦！\n\n点了确认就不能反悔啦！！！" 						 
		lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
	elseif seqno == 1 then
		j = 0
		for i=1,5 do
			local TM_PetIndex = char.getCharPet(talkerindex,i-1)
			if char.check(TM_PetIndex) == 1 then
				if char.getInt(TM_PetIndex,"宠ID") == 304 then
					j = j + 1
				end
			end
		end
		
		if j < 2 then
			-- char.TalkToCli(talkerindex, -1, "您没有带足2只机暴哟！", "随机色")
			char.TalkToCli(talkerindex,"您没有带给我2只机暴哟！",4,300)
			return
		end
		
		if j > 2 then
			-- char.TalkToCli(talkerindex, -1, "您的机暴太多了吧，去存几个再来找我！", "随机色")
			char.TalkToCli(talkerindex,"您的机暴太多了吧，去存几个再来找我！",4,300)
			return
		end
		
		if char.getInt(talkerindex, "活力") < 200 then
			-- char.TalkToCli(talkerindex, -1, "您的声望不足500，不满足我的要求呢！", "随机色")
			char.TalkToCli(talkerindex,"您的活力不足200，这样可不行哦！",4,300)
			return
		end
		
		if checkEmptItemNum(talkerindex) < 1 then
			-- char.TalkToCli(talkerindex, -1, "您的道具栏已满，清空个位置给我放东西嘛。", "随机色")
			char.TalkToCli(talkerindex,"您的道具栏已满，清一下再来吧。",4,300)
			return
		end
		
		for i=1,5 do
			local TM_PetIndex = char.getCharPet(talkerindex,i-1)
			if char.check(TM_PetIndex) == 1 then
				if char.getInt(TM_PetIndex,"宠ID") == 304 then
					char.DelPet(talkerindex, TM_PetIndex)
				end
			end
		end
		char.TalkToCli(talkerindex, meindex, "回收两只机暴", "随机色")
		char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - 200)
		char.newMessageToCli(talkerindex, -1, "扣除200点活力", "随机色")
		char.Additem(talkerindex,29501)
		char.TalkToCli(talkerindex, meindex, "拿到一个机暴玩偶", "随机色")
		char.charSaveFromConnect(talkerindex)
		char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色")
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
	Create("「 T机暴兑换员 」", 100374, 2000, 66, 33, 4)
	Create("「 T机暴兑换收员 」", 100374, 2005, 28, 14, 6)
	data()
end