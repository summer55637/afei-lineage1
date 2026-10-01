function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno < 0 or seqno > 4 then
		return
	end
	local numtmp = other.atoi(data)
	
	if numtmp < 1 or numtmp > 5 then
		return
	end
	local toitemindex = char.getCharPet(talkerindex, seqno)
	if char.check(toitemindex) ~= 1 then
		return
	end
	local itemindextmp = char.getWorkInt(talkerindex,"计时器")
	if item.check(itemindextmp) ~=1 then
		return
	end
	if item.getChar(itemindextmp,"使用函数名") ~= "ITEM_useLeiLong" then
		return
	end
	local itemid = -1;
	for i=9,23 do
		if char.getItemIndex(talkerindex,i) == itemindextmp then
			itemid = i
			break
		end
	end
	if char.getChar(toitemindex, "名字") == "斯天多斯" or char.getChar(toitemindex, "名字") == "*斯天多斯" then
		if char.getInt(toitemindex,"转数") < 0 or char.getInt(toitemindex,"等级") < 1 then
			char.TalkToCli(talkerindex, -1, "您的斯天多斯尚未达到1转140级，无法承受变化造型的力量。", "随机色")
			return
		end
		if char.getInt( toitemindex, "图像号") == petno[numtmp] then
			char.TalkToCli(talkerindex, -1, "请选择其他不同颜色的雷龙造型进行变化。", "随机色")
			return
		end
		char.setInt( toitemindex, "图像号", petno[numtmp])
		char.setInt( toitemindex, "原图像号", petno[numtmp])
		char.sendStatusString(talkerindex, "K" .. seqno)
		char.DelItem( talkerindex, itemid)
		char.TalkToCli(talkerindex, -1, "您已经成功改变了斯天多斯形象。", "随机色")
		return
	end
end

function LeiLong(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getChar(toindex, "名字") == "斯天多斯" or char.getChar(toindex, "名字") == "*斯天多斯" then
				token = "3\n        绿雷变色石可将斯天多斯变化或幻化\n      转化为以下造型，以丰富各种骑乘造型\n\n" 
					  .."            变化 [斯天多斯] (绿雷)\n" 
					  .."            变化 [邦恩多斯] (金雷)\n" 
					  .."            变化 [布洛多斯] (棕雷)\n" 
					  .."            变化 [布林帖斯] (蓝雷)\n" 
					  .."            幻化 [斯天多斯] (未开放)\n"
				lssproto.windows(charaindex, "选择框", "确定", i, char.getWorkInt( npcindex, "对象"), token)
				char.setWorkInt(charaindex,"计时器",itemindex)
				return
			else
				char.TalkToCli(charaindex, -1, "[温馨提示]此道具只能对斯天多斯使用，使用后可幻化为金雷、棕雷、蓝雷、绿幻雷。", "随机色")
			end
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
	petno = {100354,100396,100351,100352,100354}
end

function main()
	data()
	Create("绿雷变色石", 105051, 777, 28, 28, 6)
	item.addLUAListFunction( "ITEM_useLeiLong", "LeiLong", "")
end