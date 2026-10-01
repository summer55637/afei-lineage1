--丢弃宠物事件
function FreeDropPet( charaindex, havepetindex )
	local petindex = char.getCharPet(charaindex,havepetindex)
	if char.check(petindex) ~= 1 then
		return 0
	end
	if char.getInt(charaindex,"地图号") == 41011 or char.getInt(charaindex,"地图号") == 41012 then
		return 0
	end
	if char.getInt(charaindex,"转数") < 1 then--and npc.CheckEvent(charaindex,304) == 0 
		char.newMessageToCli(charaindex,-1,"条件未满足","白色")
		return 0
	end
	if char.getWorkInt(petindex,"NPC临时1") == 999 then
		return 1
	end
	local Pet_4V_1 = char.getChar( petindex, "宠物四围" )
	local Pet_old_lv = other.atoi(other.getString(Pet_4V_1, "|", 5))
	if char.getInt(petindex,"等级") - Pet_old_lv > 0 and char.getInt(petindex,"等级") > 100 then
		local petpopint = math.floor(char.getWorkInt(petindex,"最大HP") / 4) + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷")
		token = "[style c=1 s=14]一旦丢出如被人捡走或没有捡回无法找回[/style]\n您要丢出的宠物超过 100级且非野生宠物\n------------------------------------\n  卖出宠物 [[style c=4 s=14]" .. char.getChar(petindex,"名字") .. "[/style]][评分:" .. petpopint .. "]\n"
			  .. "  四维成长 [" .. char.getWorkInt(petindex,"最大HP") .. "、" .. char.getWorkInt(petindex, "攻击") .. "、" .. char.getWorkInt(petindex, "防御") .. "、" .. char.getWorkInt(petindex, "敏捷") .. "]"
		      .. "\n------------------------------------\n   确定操作请输入确认码（[style c=5 s=14]"
		local rndnum = math.random(101,999)
		token = token .. rndnum .. "[/style]）"
		char.setWorkInt(charaindex,"NPC临时1",rndnum)
		lssproto.windows(charaindex, "输入框", "确定|取消", havepetindex, char.getWorkInt( npcindex, "对象"), token)
		return 0
	end
	return 1
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno >= 0 and seqno <= 4 then
		local petindex = char.getCharPet(talkerindex,seqno)
		if char.check(petindex) ~= 1 then
			return
		end
		if data == "" then
			char.TalkToCli(talkerindex, -1, "[温馨提示]确认码输入错误，请重新输入确认码，确认码为括号内的三位数字。", "随机色")
			return
		end
		num = other.atoi(data)
		if num < 101 or num > 999 then
			char.TalkToCli(talkerindex, -1, "[温馨提示]确认码输入错误，请重新输入确认码，确认码为括号内的三位数字。", "随机色")
			return
		end
		if num ~= char.getWorkInt(talkerindex,"NPC临时1") then
			char.TalkToCli(talkerindex, -1, "[温馨提示]确认码输入错误，请重新输入确认码，确认码为括号内的三位数字。", "随机色")
			return
		end
		char.setWorkInt(petindex,"NPC临时1",999)
		char.DropPet(talkerindex,seqno)
	end
end


function data()
					 
end

function main()
	npcindex = npc.CreateNpc("MM系统", 100001, 777, 20, 25, 4)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	data()
end
