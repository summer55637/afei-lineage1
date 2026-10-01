function FreeEvent(charaindex,eventid,eventid2)
	setevent(charaindex,eventid,eventid2,1)
end

function setevent(charaindex,eventid,eventid2,type)
	if char.getInt(charaindex,"新玩家旗标") == 100 then
		if eventid == 306 then
			--char.setInt(charaindex,"新玩家旗标",0)
		elseif eventid == 701 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,20})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,2})
			end
		elseif eventid == 301 then
			if eventid2 == 2 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,60})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,3})
			elseif eventid2 == 3 then
				if char.getWorkInt(charaindex,"战斗索引") > -1 then
					battle.Exit(charaindex,char.getWorkInt(charaindex,"战斗索引"))
				end
				local enemyid = {4555,4556,4557}
				local battleindex = battle.CreateVsEnemy(charaindex,npcindex,enemyid)
			elseif eventid2 == 4 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,80})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,4})
			elseif eventid2 == 5 then
				if char.getWorkInt(charaindex,"战斗索引") > -1 then
					battle.Exit(charaindex,char.getWorkInt(charaindex,"战斗索引"))
				end
				local enemyid = {4555,4556,4557}
				local battleindex = battle.CreateVsEnemy(charaindex,npcindex,enemyid)
			elseif eventid2 == 6 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,160})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,5})
			elseif eventid2 == 0 then
				if type == 1 then
					char.Additem(charaindex,1623)
					char.Additem(charaindex,20627)
					char.Additem(charaindex,22076)
					char.Additem(charaindex,28324)
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,240})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,6})
				other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,0})
			end
		elseif eventid == 302 then
			if eventid2 == 2 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,360})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,7})
			elseif eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,500})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,8})
			end
		elseif eventid == 303 then
			if eventid2 == 2 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,640})
				end
			elseif eventid2 == 3 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,800})
				end
			elseif eventid2 == 0 then
				if type == 1 then
					if char.getInt(charaindex,"等级") < 10 then
						char.setInt(charaindex,"技能点",char.getInt(charaindex,"技能点") + 3 * (10 - char.getInt(charaindex,"等级")))
						char.setInt(charaindex,"等级",10)
						char.sendStatusString(charaindex, "P")
						char.Skillupsend(charaindex)
					end
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,9})
			end
		elseif eventid == 308 then
			if eventid2 == 3 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,800})
				end
			elseif eventid2 == 4 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,1400})
				end
			elseif eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,2000})
				end
			end
		elseif eventid == 601 then--等级25级
			if eventid2 == 0 then
				if type == 1 then
					char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") + 8000)
					char.newMessageToCli(charaindex, -1, "获得8000石币", "白色")
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,11})
			end
		elseif eventid == 309 then
			if eventid2 == 2 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,6635})
				end
			elseif eventid2 == 3 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,7746})
				end
			elseif eventid2 == 4 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,8322})
				end
			elseif eventid2 == 5 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,9262})
				end
			elseif eventid2 == 6 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,10272})
				end
			elseif eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,11000})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,12})
			end
		elseif eventid == 4 then
			if eventid2 == 0 then
				if type == 1 then
					char.Additem(charaindex,21002)
					for i=1,4 do
						for j=1,12 do
							if char.getInt( charaindex, "原图像号") == MetamoList[i][j] then
								local petindex = char.AddPet(charaindex, MetamoList[i][13], 30)
								char.setInt(petindex,"可变AI",1000)
								char.newMessageToCli(charaindex, -1, "获得骑宠一只", "白色")
								break
							end
						end
					end
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,13})
			end
		elseif eventid == 305 then
			if npc.CheckEvent(charaindex,4) == 0 then
				return 0
			end
			if eventid2 == 2 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,20000})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,14})
			elseif eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,20000})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,15})
			end
		elseif eventid == 602 then
			if eventid2 == 0 then
				if type == 1 then
					char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") + 20000)
					char.newMessageToCli(charaindex, -1, "获得20000石币", "白色")
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,16})
			end
		elseif eventid == 304 then
			if npc.CheckEvent(charaindex,602) == 0 then
				return 0
			end
			if eventid2 == 1 then
				if type == 1 then
					npc.DelItem(charaindex,"28324")
					char.Additem(charaindex,28323)
				end
			elseif eventid2 == 2 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,50000})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,17})
			elseif eventid2 == 3 then
				if char.getWorkInt(charaindex,"战斗索引") > -1 then
					battle.Exit(charaindex,char.getWorkInt(charaindex,"战斗索引"))
				end
				char.DischargeParty(charaindex, 1)
				char.setInt(charaindex,"战宠",-1)
				local enemyid = {32}
				local battleindex = battle.CreateVsEnemy(charaindex,npcindex,enemyid)
			elseif eventid2 == 4 then
				if type == 1 then
					char.Additem(charaindex,28316)--给宠物经验戒指
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,18})
			elseif eventid2 == 6 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,60000})
				end
			elseif eventid2 == 0 then
				if type == 1 then
					char.Additem(charaindex,21004)
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,26})
			end
		elseif eventid == 616 then
			if eventid2 == 0 then
				if type == 1 then
					char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") + 20000)
					char.newMessageToCli(charaindex, -1, "获得20000石币", "白色")
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,27})
			end
		elseif eventid == 311 then
			if npc.CheckEvent(charaindex,616) == 0 then
				return 0
			end
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,220000})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,19})
			end
		elseif eventid == 603 then
			if eventid2 == 0 then
				if type == 1 then
					char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") + 20000)
					char.newMessageToCli(charaindex, -1, "获得20000石币", "白色")
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,20})
			end
		elseif eventid == 31 then
			if eventid2 == 0 then
				if type == 1 then
					char.Additem(charaindex,21004)
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,21})
				other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,0})
			end
		elseif eventid == 604 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,50000})
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,22})
			end
		elseif eventid == 310 then
			if npc.CheckEvent(charaindex,604) == 0 then
				return 0
			end
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,2000000})
				end
				--other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,23})
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,29})
			end
		elseif eventid == 312 then
			if eventid2 == 0 then
				if type == 1 then
					char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") + 300000)
					char.newMessageToCli(charaindex, -1, "获得300000石币", "白色")
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,23})
			end
		elseif eventid == 605 then
			if eventid2 == 0 then
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,24})
			end
		elseif eventid == 60 then
			if eventid2 == 0 then
				if type == 1 then
					char.Additem(charaindex,28326)
					char.Additem(charaindex,25006)
				end
				other.CallFunction("Talked","data/ablua/npc/laoyeye/laoyeye.lua",{charaindex,25})
				other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,0})
			end
		elseif eventid == 606 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,1000})
				end
			end
		elseif eventid == 607 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,1200})
				end
			end
		elseif eventid == 608 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,1400})
				end
			end
		elseif eventid == 609 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,1600})
				end
			end
		elseif eventid == 610 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,2000})
				end
			end
		elseif eventid == 611 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,5000})
				end
			end
		elseif eventid == 612 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,20000})
				end
			end
		elseif eventid == 613 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,50000})
				end
			end
		elseif eventid == 614 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,100000})
				end
			end
		elseif eventid == 615 then
			if eventid2 == 0 then
				if type == 1 then
					other.CallFunction("luaexpup","data/ablua/item/expup.lua",{charaindex,100000})
				end
			end
		end
	end
end

function loginsetevent(charaindex)
	if char.getInt(charaindex,"新玩家旗标") == 100 then
		for i=1,table.getn(loginevent2) do
			if npc.CheckEvent(charaindex,loginevent2[i][1]) ~= 0 and npc.CheckNowEvent(charaindex,loginevent2[i][2]) == 0 then
				setevent(charaindex,loginevent2[i][1],0,0)
				return 0
			end
		end
		for i=1,table.getn(loginevent) do
			if npc.CheckEvent(charaindex,loginevent[i][1]) == 0 then
				if npc.CheckNowEvent(charaindex,loginevent[i][1]) ~= 0 then
					local eventidbuff = char.getChar(charaindex,"任务小标")
					if eventidbuff ~= "" then
						j = 1
						while other.getString(eventidbuff,"|",j) ~= "" do
							tmpeventidbuff = other.getString(eventidbuff,"|",j)
							eventid1 = other.getString(tmpeventidbuff,"-",1)
							eventid2 = other.getString(tmpeventidbuff,"-",2)
							if eventid1 ~= "" and eventid2 ~= "" then
								if other.atoi(eventid1) == loginevent[i][1] then
									if other.atoi(eventid2) <= loginevent[i][2] then
										setevent(charaindex,loginevent[i][1],other.atoi(eventid2),0)
									end
									return 0
								end
							end
							j = j + 1
						end
					end
				end
			end
		end
	else
		for i=1,table.getn(enentendid) do
			if npc.CheckEvent(charaindex,enentendid[i]) == 0 then
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{charaindex,enentendid[i],0})
			end
		end
		for i=606,615 do
			if npc.CheckEvent(charaindex,i) == 0 then
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{charaindex,i,0})
			end
		end
	end
	return 0
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")

	--char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	MetamoList={
		  --{ 小矮子   赛亚人  辫子男孩  酷哥   熊皮男   大个    小矮妹  熊皮妹  帽子妹  短发夹妹  手套女   辣妹    虎}, 此行为说明行
			{ 100000, 100025, 100055, 100060, 100095, 100100, 100135, 100145, 100165, 100190, 100200, 100230, 2483},	--红
			{ 100005, 100030, 100050, 100065, 100085, 100115, 100120, 100140, 100170, 100195, 100210, 100225, 2481},	--绿
			{ 100010, 100035, 100045, 100070, 100090, 100110, 100125, 100150, 100160, 100185, 100215, 100220, 2484},	--金
			{ 100015, 100020, 100040, 100075, 100080, 100105, 100130, 100155, 100175, 100180, 100205, 100235, 2482}	--黄
		}
		
	loginevent = {{301,7},{302,3},{303,1},{308,4},{309,6},{305,3},{304,6},{311,1},{312,1}
				}
				
	loginevent2 = {{701,301},{301,302},{302,303},{303,308},{601,309},{4,305},{602,304},{616,311},{604,310},{310,312}}
	
	enentendid = {306,701,301,302,303,601,702,305,602,616,603,304,604,605,308,309,310,311}
end

function main()
	Create("新手旗标",100000,777,26,34,6)
	data()
end

