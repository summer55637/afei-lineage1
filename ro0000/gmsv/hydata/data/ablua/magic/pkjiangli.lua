function getXY(x,y,dir)
	if dir == 1 then
		x = x + 1
		y = y - 1
		return x,y
	elseif dir == 2 then
		x = x + 1
		return x,y
	elseif dir == 3 then
		x = x + 1
		y = y + 1
		return x,y
	elseif dir == 4 then
		y = y + 1
		return x,y
	elseif dir == 5 then
		x = x - 1
		y = y + 1
		return x,y
	elseif dir == 6 then
		x = x - 1
		return x,y
	elseif dir == 7 then
		x = x - 1
		y = y - 1
		return x,y
	elseif dir == 8 then
		y = y - 1
		return x,y
	else
		return x,y
	end
end

function Loop(meindex)
	if announcecnt > 0 and announcetext ~= "" then
		char.talkToAllServer(announcetext,"")
		announcecnt = announcecnt - 1
	end
end

function pkjiangli(charaindex, data)
	pkname = {"",""}
	pkindex = {-1,-1}
	pkplayernum = 0
	dx,dy = getXY(char.getInt(charaindex,"坐标X"),char.getInt(charaindex,"坐标Y"),char.getInt(charaindex,"方向"))
	local maxplayer = char.getPlayerMaxNum() - 1
	for i = 0, maxplayer do
		if char.check(i) == 1 then
			if char.getInt(i,"坐标X") == dx and char.getInt(i,"坐标Y") == dy and char.getInt(charaindex,"地图号") == char.getInt(i,"地图号") then
				pkplayernum = pkplayernum + 1
				pkname[pkplayernum] = char.getChar(i,"名字")
				pkindex[pkplayernum] = i
			end
		end
	end
	if pkplayernum <= 0 then
		char.TalkToCli(charaindex, -1, "您的前方无账号。", "随机色")
		return
	end
	token = "1\n请选择人物："
	for i=1,math.min(pkplayernum,7) do
		token = token .. "\n" .. pkname[i]
	end
	lssproto.windows(charaindex, "选择框", 8, 0, char.getWorkInt( npcindex, "对象"), token)
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--print("\nseqno=" .. seqno .. ",select=" .. select .. ",data=" .. data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 7 then
			return
		end
		if num > pkplayernum then
			return
		end
		token = "1\n请选择点数："
			 .. "\n666点"
			 .. "\n888点"
			 .. "\n1000点"
			 .. "\n2000点"
			 .. "\n3000点"
		lssproto.windows(talkerindex, "选择框", 8, num, char.getWorkInt( meindex, "对象"), token)
	elseif seqno >= 1 and seqno <= 7 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		if seqno > pkplayernum then
			return
		end
		local addpoint = {666,888,1000,2000,3000}
		if char.check(pkindex[seqno]) == 1 then
			sasql.setVipPoint(pkindex[seqno],sasql.getVipPoint(pkindex[seqno]) + addpoint[num])
			char.talkToAllServer("P|P|[温馨提示]热爱PK的玩家[" .. pkname[seqno] .. "]在[" .. map.getFloorName(char.getInt(talkerindex,"地图号")) .. "](" .. dx .. "." .. dy .. ")与对手交战中被幸运星砸中,获得金币[" .. addpoint[num] .. "],为鼓励大家PK不定时会在娱乐互动线医院投放PK幸运奖,下一个也许就是您哦！石器PK有您更精彩,快快呼唤朋友一起加入吧!","")
			announcetext = "P|P|[温馨提示]热爱PK的玩家[" .. pkname[seqno] .. "]在[" .. map.getFloorName(char.getInt(talkerindex,"地图号")) .. "](" .. dx .. "." .. dy .. ")与对手交战中被幸运星砸中,获得金币[" .. addpoint[num] .. "],为鼓励大家PK不定时会在娱乐互动线医院投放PK幸运奖,下一个也许就是您哦！石器PK有您更精彩,快快呼唤朋友一起加入吧!"
			announcecnt = 2
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
	char.setInt(npcindex, "循环事件时间", 5000)
	announcecnt = 0
	announcetext = ""
end

function main()
	Create("PK奖励", 16131, 777, 23, 12, 4)
	magic.addLUAListFunction("pkjiangli", "pkjiangli", "", 3, "测试专用命令")
end

