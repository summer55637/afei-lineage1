function NewPlayerJiang( charaindex,flg)
	--[[if char.check(charaindex) == 1 then
		if char.getInt(charaindex,"新玩家旗标") == 2 then
			for i=1,table.getn(newplayerdata) do
				if flg == newplayerdata[i][1] then
					local mylevel = char.getInt(charaindex,"等级")
					if newplayerdata[i][3][2] == 1 then
						if mylevel < newplayerdata[i][3][1] then
							char.setInt(charaindex,"等级",newplayerdata[i][3][1])
							char.setInt(charaindex,"技能点",char.getInt(charaindex,"技能点") + 3 * (newplayerdata[i][3][1] - mylevel))
							char.Skillupsend(charaindex)
							char.newMessageToCli(charaindex, -1, "升级到" .. newplayerdata[i][3][1] .. "级", "白色")
						end
					elseif newplayerdata[i][3][2] == 2 then
						local levelup = newplayerdata[i][3][1]
						if mylevel + levelup > 40 then
							levelup = 40 - mylevel
						end
						if levelup > 0 then
							char.setInt(charaindex,"等级",char.getInt(charaindex,"等级") + levelup)
							char.setInt(charaindex,"技能点",char.getInt(charaindex,"技能点") + 3 * levelup)
							char.Skillupsend(charaindex)
							char.newMessageToCli(charaindex, -1, "升级到" .. char.getInt(charaindex,"等级") .. "级", "白色")
						end
					end
					char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") + newplayerdata[i][2])
					char.sendStatusString(charaindex,"P")
					char.newMessageToCli(charaindex, -1, "获得" .. newplayerdata[i][2] .. "石币", "白色")
					break
				end
			end
		end
	end]]
	return 0
end

function FreeNewPlayer( charaindex)
	if char.getInt(charaindex,"新玩家旗标") == 100 and npc.CheckNowEvent(charaindex,306) == 0 then
		lssproto.windows(charaindex, 1005, 0, 0, char.getWorkInt( npcindex, "对象"), "")
		--other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,1})
	else
		other.CallFunction("loginsetevent","data/ablua/event.lua",{charaindex})
	end
end

function FreeNewPlayerFlg( charaindex,flg1,flg2)
	
end

function NewPlayerFlg( charaindex,flg1,flg2)
	if (flg1 < 601 or flg1 > 800) and (flg1 < 301 or flg1 > 400) and flg1 ~= 900 then
		return 0
	end
	if char.check(charaindex) ~= 1 then
		return 0
	end
	if flg2 <= 0 then
		if npc.CheckEvent(charaindex,flg1) ~= 0 then
			return 0
		end
		npc.EvEnd(charaindex,flg1)
	else
		if npc.CheckEvent(charaindex,flg1) ~= 0 then
			return 0
		end
		local eventidbuff = char.getChar(charaindex,"任务小标")
		if eventidbuff ~= "" then
			i = 1
			while other.getString(eventidbuff,"|",i) ~= "" do
				tmpeventidbuff = other.getString(eventidbuff,"|",i)
				eventid1 = other.getString(tmpeventidbuff,"-",1)
				eventid2 = other.getString(tmpeventidbuff,"-",2)
				if eventid1 ~= "" and eventid2 ~= "" then
					if other.atoi(eventid1) == flg1 then
						if other.atoi(eventid2) > flg2 then
							return 0
						end
						break
					end
				end
				i = i + 1
			end
		end
		npc.EvNow(charaindex,flg1)
		npc.EventID(charaindex,flg1 .. "-" .. flg2)
	end
	return 0
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	if seqno == 0 then
		if data == "" then
			return
		end
		if char.getInt(talkerindex,"新玩家旗标") == 100 and npc.CheckNowEvent(talkerindex,306) == 0 then
			if data == "1" then--新手指引
				--token = "确认使用新手指引，请根据系统指引完成相关新手任务，可获得丰富奖励，120级前切勿丢弃新手装备、出生宠和新手战宠，会导致部分任务无法进行。"
				--lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{talkerindex,1})
			elseif data == "0" then--老手
				--token = "确认跳过新手指引，将获得完美棒子、新手的铠甲、新手的帽子、出生宠、新手战宠、陪练雕像、新手称号、经验倍数初始1倍，根据等级提升10级5倍，80级10倍，120级15倍。"
				--lssproto.windows(talkerindex, "对话框", "确定|取消", 2, char.getWorkInt( meindex, "对象"), token)
				char.setInt(talkerindex,"新玩家旗标",0)
				char.Additem(talkerindex,28319)
				char.Additem(talkerindex,20627)
				char.Additem(talkerindex,1623)
				char.Additem(talkerindex,22076)
				char.Additem(talkerindex,25006)
				char.AddPet(talkerindex, char.getInt(talkerindex,"出生地") + 1, 1)
				for i=1,4 do
					for j=1,12 do
						if char.getInt( talkerindex, "原图像号") == MetamoList[i][j] then
							local petindex = char.AddPet(talkerindex, MetamoList[i][13], 1)
							char.setInt(petindex,"可变AI",1000)
							break
						end
					end
				end
				other.CallFunction("loginsetevent","data/ablua/event.lua",{talkerindex})
			end
		end
	elseif seqno == 1 then
		if select ~= 1 then
			lssproto.windows(talkerindex, 1005, 0, 0, char.getWorkInt( meindex, "对象"), "")
			return
		end
		if char.getInt(talkerindex,"新玩家旗标") == 100 and npc.CheckNowEvent(talkerindex,306) == 0 then
			other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{talkerindex,1})
		end
	elseif seqno == 2 then
		if select ~= 1 then
			lssproto.windows(talkerindex, 1005, 0, 0, char.getWorkInt( meindex, "对象"), "")
			return
		end
		if char.getInt(talkerindex,"新玩家旗标") == 100 and npc.CheckNowEvent(talkerindex,306) == 0 then
			char.setInt(talkerindex,"新玩家旗标",0)
			char.Additem(talkerindex,28319)
			char.Additem(talkerindex,20627)
			char.Additem(talkerindex,1623)
			char.Additem(talkerindex,22076)
			char.Additem(talkerindex,25006)
			char.AddPet(talkerindex, char.getInt(talkerindex,"出生地") + 1, 1)
			for i=1,4 do
				for j=1,12 do
					if char.getInt( talkerindex, "原图像号") == MetamoList[i][j] then
						local petindex = char.AddPet(talkerindex, MetamoList[i][13], 1)
						char.setInt(petindex,"可变AI",1000)
						break
					end
				end
			end
			other.CallFunction("loginsetevent","data/ablua/event.lua",{talkerindex})
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	newplayerdata = {{301,5000,{2,1}}
					,{302,5000,{3,1}}
					,{310,5000,{4,1}}
					,{305,5000,{5,1}}
					,{309,5000,{6,1}}
					,{312,5000,{1,2}}
					,{401,5000,{7,1}}
					,{402,5000,{8,1}}
					,{306,5000,{9,1}}
					,{307,5000,{1,2}}
					,{308,5000,{5,2}}}
					
	MetamoList={
		  --{ 小矮子   赛亚人  辫子男孩  酷哥   熊皮男   大个    小矮妹  熊皮妹  帽子妹  短发夹妹  手套女   辣妹    虎}, 此行为说明行
			{ 100000, 100025, 100055, 100060, 100095, 100100, 100135, 100145, 100165, 100190, 100200, 100230, 2483},	--红
			{ 100005, 100030, 100050, 100065, 100085, 100115, 100120, 100140, 100170, 100195, 100210, 100225, 2481},	--绿
			{ 100010, 100035, 100045, 100070, 100090, 100110, 100125, 100150, 100160, 100185, 100215, 100220, 2484},	--金
			{ 100015, 100020, 100040, 100075, 100080, 100105, 100130, 100155, 100175, 100180, 100205, 100235, 2482}	--黄
		}
end

function main()
	data()
	Create("新手指引", 100000, 777, 13, 21, 4)
end
