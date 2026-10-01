function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	local numtmp = other.atoi(data)
	
	if numtmp < 1 or numtmp > 4 then
		return
	end
	if checkEmptPetNum(talkerindex) == 0 then
		char.TalkToCli(talkerindex, -1, "[温馨提示]您的宠物栏已满。", "随机色")
		return
	end
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
	char.DelItem(talkerindex, j)
	local petindex = char.AddPet(talkerindex,petid[numtmp],1)
	if char.check(petindex) == 1 then
		char.TalkToCli(talkerindex, -1, "得到一只" .. char.getChar(petindex,"名字") .. "。", "随机色")
	end
end

function ShengShouDan(itemindex, charaindex, toindex, haveitemindex)
	if checkEmptPetNum(charaindex) == 0 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您的宠物栏已满。", "随机色")
		return
	end
	token = "2\n请选择您要哪只圣兽\n\n" 
		  .."              [ 美拉 ] (玄武)\n" 
		  .."              [佩露夏] (白虎)\n" 
		  .."              [菲奇亚] (朱雀)\n" 
		  .."              [ 凯恩 ] (青龙)\n" 
	lssproto.windows(charaindex, "选择框", "取消", 0, char.getWorkInt( npcindex, "对象"), token)
	char.setWorkInt(charaindex,"计时器",itemindex)
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	petid = {3033,1610,3000,3034}
end

function main()
	data()
	Create("圣兽蛋", 105051, 777, 29, 22, 6)
	item.addLUAListFunction( "ITEM_SHENGSHOUDAN", "ShengShouDan", "")
end