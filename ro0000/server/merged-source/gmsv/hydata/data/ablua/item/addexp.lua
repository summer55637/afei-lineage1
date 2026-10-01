function addExp(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local strat_i,end_i,str_i = string.find(data,"增")
	local strat_j,end_j,str_j = string.find(data,"分")
	if strat_i == nil or strat_j == nil then
		return
	end
	local addexpbase = other.atoi(string.sub(data,end_i + 1,strat_j - 1))
	local addexptime = other.atoi(string.sub(data,end_j + 1,-1))
	if addexpbase == char.getWorkInt(charaindex,"经验加成") then
		addexptime = addexptime + math.floor(char.getWorkInt(charaindex, "经验时间") / 60)
	elseif char.getWorkInt(charaindex,"经验加成") > addexpbase then
		char.newMessageToCli(charaindex,-1,"已经吃了更高倍数的智慧果","白色")
		return
	elseif char.getWorkInt(charaindex,"经验加成") > 0 then
		token = "此智慧果经验倍数比您现有的要高,使用后会覆盖当前经验倍数和时间,你确定使用吗"
		lssproto.windows(charaindex, "对话框", "确定|取消", haveitemindex, char.getWorkInt( npcindex, "对象"), token)
		return
	end
	
	char.setWorkInt(charaindex, "经验时间", addexptime * 60)
	char.setWorkInt(charaindex, "经验加成", addexpbase)
    char.setInt(charaindex, "经验加成",char.getWorkInt(charaindex, "经验加成"))
    char.setInt(charaindex, "经验时间",char.getWorkInt(charaindex, "经验时间"))
	char.DelItem(charaindex, haveitemindex)
	char.TalkToCli(charaindex, -1, "您的学习经验的能力提升了" .. addexpbase .. "％，时效剩余" .. addexptime .. "分钟。", "随机色")
	if char.getInt(charaindex,"地图号") >= 40030 and char.getInt(charaindex,"地图号") <= 40034 then
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,1})
	else
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,0})
	end
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	if seqno >= 9 and seqno <= 23 then
		if select ~= 1 then
			return
		end
		local haveitemindex = seqno
		local itemindex = char.getItemIndex(talkerindex,haveitemindex)
		if item.check(itemindex) == 1 then
			if item.getChar(itemindex,"使用函数名") ~= "ITEM_Addexp" then
				return
			end
			local data = item.getChar(itemindex, "字段")
			if data == "" then
				return
			end
			local strat_i,end_i,str_i = string.find(data,"增")
			local strat_j,end_j,str_j = string.find(data,"分")
			if strat_i == nil or strat_j == nil then
				return
			end
			local addexpbase = other.atoi(string.sub(data,end_i + 1,strat_j - 1))
			local addexptime = other.atoi(string.sub(data,end_j + 1,-1))
			if addexpbase == char.getWorkInt(talkerindex,"经验加成") then
				addexptime = addexptime + math.floor(char.getWorkInt(talkerindex, "经验时间") / 60)
			elseif char.getWorkInt(talkerindex,"经验加成") > addexpbase then
				char.newMessageToCli(talkerindex,-1,"已经吃了更高倍数的智慧果","白色")
				return
			end
			char.setWorkInt(talkerindex, "经验时间", addexptime * 60)
			char.setWorkInt(talkerindex, "经验加成", addexpbase)
			char.setInt(talkerindex, "经验加成",char.getWorkInt(talkerindex, "经验加成"))
			char.setInt(talkerindex, "经验时间",char.getWorkInt(talkerindex, "经验时间"))
			char.DelItem(talkerindex, haveitemindex)
			char.TalkToCli(talkerindex, -1, "您的学习经验的能力提升了" .. addexpbase .. "％，时效剩余" .. addexptime .. "分钟。", "随机色")
			if char.getInt(talkerindex,"地图号") >= 40030 and char.getInt(talkerindex,"地图号") <= 40034 then
				other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{talkerindex,1})
			else
				other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{talkerindex,0})
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()

end

function main()
	data()
	Create("智慧果", 100000, 777, 18, 21, 4)
	item.addLUAListFunction( "ITEM_Addexp", "addExp", "")
end
