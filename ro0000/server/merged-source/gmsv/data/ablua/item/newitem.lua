function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function newitem(itemindex, charaindex, toindex, haveitemindex)
	token = "3\n　　　　　　  　「　新手礼包 」\n\n"
	      .."　　　　　　 请选择您需要的2D人龙\n"
		  .."　　　　　　　  2D利则诺顿[绑]\n"
		  .."　　　　　　　  2D扬奇洛斯[绑]\n"
		  .."　　　　　　　  2D邦浦洛斯[绑]\n"
		  .."　　　　　　 　   2D邦奇诺[绑]\n"
		  .."　　　　　　　    2D布鲁顿[绑]"
	lssproto.windows(charaindex, "选择框", "取消", 1, char.getWorkInt( npcindex, "对象"), token)
	char.setWorkInt(charaindex,"NPC临时1",itemindex)
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 1 then
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		if checkEmptPetNum(talkerindex) < 1 then
			char.TalkToCli(talkerindex, -1, "您的宠物栏已满。", "随机色")
			return
		end
		if checkEmptItemNum(talkerindex) < table.getn(itemid) then
			char.TalkToCli(talkerindex, -1, "您的道具栏空位不足。", "随机色")
			return
		end
		local haveindex = -1
		for i=9,23 do
			if char.getItemIndex(talkerindex,i) == char.getWorkInt(talkerindex,"NPC临时1") then
				haveindex = i
			end
		end
		if haveindex > -1 then
			char.DelItem(talkerindex,haveindex)
		else
			return
		end
		local petindex = char.AddPet(talkerindex,petid[num],1)
		char.setChar(petindex,"名字","*" .. char.getChar(petindex,"名字"))
		for i=0,4 do
			if petindex == char.getCharPet(talkerindex,i) then
				char.sendStatusString(talkerindex,"K" .. i)
			end
		end
		char.TalkToCli(talkerindex, -1, "恭喜您得到[" .. char.getChar(petindex,"名字") .. "]一只", "随机色")
		for i=1,table.getn(itemid) do
			char.Additem(talkerindex,itemid[i])
			char.TalkToCli(talkerindex, -1, "恭喜您得到[" .. item.getNameFromNumber(itemid[i]) .. "]", "随机色")
		end
		char.TalkToCli(talkerindex, -1, "恭喜您打开新手包成功。", "随机色")
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
	itemid = {21017,19646,22027,21100,21021}
	petid = {3001,3002,3003,3004,3005}
end


function main()
	Create("新手包", 101156, 777, 18, 14, 4)
	data()
	item.addLUAListFunction( "ITEM_NEWITEM", "newitem", "")
end