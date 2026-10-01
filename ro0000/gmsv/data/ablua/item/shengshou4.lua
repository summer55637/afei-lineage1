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
	if item.getChar(itemindextmp,"使用函数名") ~= "ITEM_useShengShou4" then
		return
	end
	local itemid = -1;
	for i=9,23 do
		if char.getItemIndex(talkerindex,i) == itemindextmp then
			itemid = i
			break
		end
	end
	if char.getInt(toitemindex, "宠ID") == 3073 then
		if char.getInt(toitemindex, "转数") < 1 or char.getInt(toitemindex, "等级") < 140 then
			char.TalkToCli(talkerindex, -1, "您的莱恩奇夫尚未达到1转140级，无法承受疾风石的力量。", "随机色")
			return
		end
		if char.getChar(toitemindex, "名字") == "莱恩奇夫" then
			char.setChar(toitemindex, "名字","莱恩奇夫[疾]")
			char.setChar(toitemindex, "昵称","莱恩奇夫[疾]")
			char.setInt(toitemindex,"体力",char.getInt(toitemindex,"体力") - 157)
			char.setInt(toitemindex,"腕力",char.getInt(toitemindex,"腕力") + 103)
			char.setInt(toitemindex,"耐力",char.getInt(toitemindex,"耐力") - 2273)
			char.setInt(toitemindex,"速度",char.getInt(toitemindex,"速度") + 2800)
			char.complianceParameter(toitemindex)
			char.sendStatusString(talkerindex, "K" .. seqno)
			char.TalkToCli(talkerindex, -1, "您已经成功将【莱恩奇夫】转换成【莱恩奇夫[疾]】。", "随机色")
			char.DelItem( talkerindex, itemid)
		else
			char.setChar(toitemindex, "名字","莱恩奇夫")
			char.setChar(toitemindex, "昵称","莱恩奇夫")
			char.setInt(toitemindex,"体力",char.getInt(toitemindex,"体力") + 157)
			char.setInt(toitemindex,"腕力",char.getInt(toitemindex,"腕力") - 103)
			char.setInt(toitemindex,"耐力",char.getInt(toitemindex,"耐力") + 2273)
			char.setInt(toitemindex,"速度",char.getInt(toitemindex,"速度") - 2800)
			char.complianceParameter(toitemindex)
			char.sendStatusString(talkerindex, "K" .. seqno)
			char.TalkToCli(talkerindex, -1, "您已经成功将【莱恩奇夫[疾]】转换成【莱恩奇夫】。", "随机色")
			char.DelItem( talkerindex, itemid)
		end
	end
end

function ShengShou4(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "宠ID") == 3073 then
				if char.getChar(toindex, "名字") == "莱恩奇夫" then
					token = "  您确定要让您的[莱恩奇夫]进入疾风状态么\n" 
						  .."  [疾风]状态下莱恩奇夫会进入高敏疾风状态\n\n"
						  .."                  【综合变化】\n"
						  .."                  敏捷增加28点\n                  防御减少22点\n               有些许误差属于正常"
					lssproto.windows(charaindex, "对话框", "YES|NO", i, char.getWorkInt( npcindex, "对象"), token)
					char.setWorkInt(charaindex,"计时器",itemindex)
					return
				else
					token = "  您确定要让您的[莱恩奇夫]恢复普通状态么\n" 
						  .."  [普通]状态下莱恩奇夫会进入常敏普通状态\n\n"
						  .."                  【综合变化】\n"
						  .."                  敏捷减少28点\n                  防御增加22点\n               有些许误差属于正常"
					lssproto.windows(charaindex, "对话框", "YES|NO", i, char.getWorkInt( npcindex, "对象"), token)
					char.setWorkInt(charaindex,"计时器",itemindex)
					return
				end
			else
				char.TalkToCli(charaindex, -1, "[温馨提示]此道具只能对1转140级的莱恩奇夫使用。", "随机色")
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
	
end

function main()
	data()
	Create("圣兽疾风石", 105051, 777, 31, 47, 6)
	item.addLUAListFunction( "ITEM_useShengShou4", "ShengShou4", "")
end