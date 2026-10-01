function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select ~= 4 then
		return
	end
	if seqno < 0 or seqno > 4 then
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
	if item.getChar(itemindextmp,"使用函数名") ~= "ITEM_useShengShou" then
		return
	end
	local itemid = -1;
	for i=9,23 do
		if char.getItemIndex(talkerindex,i) == itemindextmp then
			itemid = i
			break
		end
	end
	if char.getInt(toitemindex, "宠ID") == 3034 then
		if char.getInt(toitemindex, "转数") < 1 or char.getInt(toitemindex, "等级") < 140 then
			char.TalkToCli(talkerindex, -1, "您的凯恩尚未达到1转140级，无法承受疾风石的力量。", "随机色")
			return
		end
		if char.getChar(toitemindex, "名字") == "凯恩" then
			char.setChar(toitemindex, "名字","凯恩[疾]")
			char.setChar(toitemindex, "昵称","凯恩[疾]")
			char.setInt(toitemindex,"耐力",char.getInt(toitemindex,"耐力") - 2000)
			char.setInt(toitemindex,"速度",char.getInt(toitemindex,"速度") + 2000)
			char.complianceParameter(toitemindex)
			char.sendStatusString(talkerindex, "K" .. seqno)
			char.TalkToCli(talkerindex, -1, "您已经成功将【凯恩】转换成【凯恩[疾]】。", "随机色")
			char.DelItem( talkerindex, itemid)
		else
			char.setChar(toitemindex, "名字","凯恩")
			char.setChar(toitemindex, "昵称","凯恩")
			char.setInt(toitemindex,"耐力",char.getInt(toitemindex,"耐力") + 2000)
			char.setInt(toitemindex,"速度",char.getInt(toitemindex,"速度") - 2000)
			char.complianceParameter(toitemindex)
			char.sendStatusString(talkerindex, "K" .. seqno)
			char.TalkToCli(talkerindex, -1, "您已经成功将【凯恩[疾]】转换成【凯恩】。", "随机色")
			char.DelItem( talkerindex, itemid)
		end
	end
end

function ShengShou(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "宠ID") == 3034 then
				if char.getChar(toindex, "名字") == "凯恩" then
					token = "   您确定要让您的[凯恩]进入疾风状态么？\n" 
						  .."[疾风]状态下凯恩速度提高20点耐力减少20点\n\n"
						  .."                  【综合变化】\n"
						  .."                  敏捷增加20点\n                  防御减少19点\n                  攻击减少 1点"
					lssproto.windows(charaindex, "对话框", "YES|NO", i, char.getWorkInt( npcindex, "对象"), token)
					char.setWorkInt(charaindex,"计时器",itemindex)
					return
				else
					token = "   您确定要让您的[凯恩]恢复普通状态么？\n" 
						  .."[普通]状态下凯恩速度降低20点耐力提高20点\n\n"
						  .."                  【综合变化】\n"
						  .."                  敏捷减少20点\n                  防御增加19点\n                  攻击增加 1点"
					lssproto.windows(charaindex, "对话框", "YES|NO", i, char.getWorkInt( npcindex, "对象"), token)
					char.setWorkInt(charaindex,"计时器",itemindex)
					return
				end
			else
				char.TalkToCli(charaindex, -1, "[温馨提示]此道具只能对1转140级的凯恩使用。", "随机色")
				return
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
	petno = {100353,100396,100351,100352}
end

function main()
	data()
	Create("圣兽疾风石", 105051, 777, 28, 30, 6)
	item.addLUAListFunction( "ITEM_useShengShou", "ShengShou", "")
end