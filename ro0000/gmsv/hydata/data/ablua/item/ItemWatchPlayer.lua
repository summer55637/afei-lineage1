function trim(s) 
	local ts = string.gsub(s, "^%s*(.-)%s*$", "%1")
	ts = string.gsub(ts, "    ", " ")
	ts = string.gsub(ts, "　　", " ")
	ts = string.gsub(ts, "　", " ")
	ts = string.gsub(ts, "    ", " ")
	ts = string.gsub(ts, "  ", " ")
	return ts
end 
function WatchPlayer(itemindex, charaindex, toindex, haveitemindex)
	for i=1,6 do
		char.setWorkInt(charaindex,"NPC临时" .. i,0)
	end
	--[[if char.getInt(charaindex,"地图号") == 1042 or char.getInt(charaindex,"地图号") == 2032 or char.getInt(charaindex,"地图号") == 3032 or char.getInt(charaindex,"地图号") == 4032 or char.getInt(charaindex,"地图号") == 5032 then
		char.TalkToCli(charaindex, -1, "[温馨提示]族战中允许使用该道具。", "随机色")
		return
	end]]
	local dx,dy,watchindex
	dx = char.getCoordinationDir(char.getInt(charaindex,"方向"),char.getInt(charaindex,"坐标X"),char.getInt(charaindex,"坐标Y"),1,1)
	dy = char.getCoordinationDir(char.getInt(charaindex,"方向"),char.getInt(charaindex,"坐标X"),char.getInt(charaindex,"坐标Y"),1,2)
	local playernum = char.getSameCoordinateObjects(char.getInt(charaindex,"地图号"),dx,dy,1)
	if playernum <= 0 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您的前方没有玩家！请对准后透视哦！", "随机色")
		return
	end
	local objbuf = char.getSameCoordinateObjects(char.getInt(charaindex,"地图号"),dx,dy,2)
	if playernum == 1 then
		watchindex = obj.getIndex(other.atoi(objbuf))
		if char.getInt(watchindex,"类型") ~= 1 then
			char.TalkToCli(charaindex, -1, "[温馨提示]您的前方没有玩家！请对准后透视哦！", "随机色")
			return
		end
		char.setWorkInt(charaindex,"NPC临时1",watchindex)
		token = "\n\n真的要使用真视之镜来透视 [" .. char.getChar(watchindex,"名字") .. "] 的装备吗？"
		lssproto.windows(charaindex, "对话框", "确定|取消", 1, char.getWorkInt( npcindex, "对象"), token)
	else
		token = "1 对面不止一人哟，请选择您要透视的玩家：\n"
		local j = 0
		for i=1,math.min(playernum,6) do
			watchindex = obj.getIndex(other.atoi(other.getString(objbuf,"|",i)))
			if char.getInt(watchindex,"类型") == 1 then
				j = j + 1
				token = token .. char.getChar(watchindex,"名字") .. "\n"
				char.setWorkInt(charaindex,"NPC临时" .. j,watchindex)
			end
		end
		lssproto.windows(charaindex, "选择框", "取消", 0, char.getWorkInt( npcindex, "对象"), token)
	end
	char.setWorkInt(charaindex,"计时器",itemindex)
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 then
		return
	end
	if seqno == 0 then
		num = other.atoi(data)
		if num < 1 or num > 6 then
			return
		end
		local watchindex = char.getWorkInt(talkerindex,"NPC临时" .. num)
		if char.check(watchindex) == 1 then
			if char.getInt(watchindex,"类型") == 1 then
				char.setWorkInt(talkerindex,"NPC临时1",watchindex)
				token = "\n\n真的要使用真视之镜来透视 [" .. char.getChar(watchindex,"名字") .. "] 的装备吗？"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
			end
		end
	elseif seqno == 1 then
		local watchindex = char.getWorkInt(talkerindex,"NPC临时1")
		if char.check(watchindex) == 1 then
			if char.getInt(watchindex,"类型") == 1 then
				local itemindex = char.getWorkInt(talkerindex,"计时器")
				if item.check(itemindex) == 0 then
					return
				end
				local j = -1
				for i=9,23 do
					if char.getItemIndex(talkerindex,i-1) == itemindex then
						j = i - 1
						break
					end
				end
				if j == -1 then
					return
				end
				local TM_equipname = {"此位置没有穿戴装备 ]","此位置没有穿戴装备 ]","此位置没有穿戴装备 ]","此位置没有穿戴装备 ]","此位置没有穿戴装备 ]"}
				for i = 1, 5 do
					local TempItemIndex = char.getItemIndex( watchindex, i - 1);
					if TempItemIndex > 0 then
						TM_equipname[i] = item.getChar(TempItemIndex, "名称")
						if string.sub(TM_equipname[i],1,1) == "*" then
							TM_equipname[i] = string.sub(TM_equipname[i],2,string.len(TM_equipname[i]))
						end
						TM_equipname[i] = TM_equipname[i] .. " ]——[ " .. trim(item.getChar(TempItemIndex, "说明")) .. " ]"
						TM_equipname[i] = string.gsub(TM_equipname[i], "地]", "Ｘ]")
						TM_equipname[i] = string.gsub(TM_equipname[i], "水]", "Ｘ]")
						TM_equipname[i] = string.gsub(TM_equipname[i], "火]", "Ｘ]")
						TM_equipname[i] = string.gsub(TM_equipname[i], "风]", "Ｘ]")
						--[[TM_magicid = item.getInt(TempItemIndex, "精灵")
						if TM_magicid > 0 then
							TM_equipname[i] = TM_equipname[i] .. "[精灵：" .. magic.getChar(TM_magicid,"名字") .. "]"
						end]]
					end
				end
				token = "透视结果出来咯！玩家 [" .. char.getChar(watchindex,"名字") .. "] 当前的装备如下："
				char.TalkToCli(talkerindex, -1, token, "随机色")
				token = "[头部]——[ "..TM_equipname[1]
				char.TalkToCli(talkerindex, -1, token, "随机色")
				token = "[身体]——[ "..TM_equipname[2]
				char.TalkToCli(talkerindex, -1, token, "随机色")
				token = "[武器]——[ "..TM_equipname[3]
				char.TalkToCli(talkerindex, -1, token, "随机色")
				token = "[右饰]——[ "..TM_equipname[4]
				char.TalkToCli(talkerindex, -1, token, "随机色")
				token = "[左饰]——[ "..TM_equipname[5]
				char.TalkToCli(talkerindex, -1, token, "随机色")
				char.DelItem(talkerindex, j)
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
	Create("真实之境", 101156, 777, 15, 13, 4)
	data()
	item.addLUAListFunction( "ITEM_WATCH_PLAYER", "WatchPlayer", "")
end