function ShowList(meindex, talkerindex, page)
		token = char.getChar(meindex, "名字") .. "\n"
		for i = 1, 6 do
			num = (page - 1) * 6 + i
			if num > #eventlist  then
				break
			end

			if npc.Free(meindex, talkerindex, eventlist[num][3]) == 1 then
				token = token .. string.format("%s[已完成]\n", eventlist[num][1])
			elseif npc.Free(meindex, talkerindex, eventlist[num][2]) == 1 then
				token = token .. string.format("%s[进行中]\n", eventlist[num][1])
			else
				token = token ..string.format("%s[未进行]\n", eventlist[num][1])
			end
		end

		if maxpage == 1 then
			button = 8
		elseif page == 1 and page <= maxpage then
			button = 40
		elseif page > 1 and page <= maxpage then
			button = 56
		elseif page > maxpage  then
			button = 24
		end
		lssproto.windows(talkerindex, "选择框", button, page, char.getWorkInt( meindex, "对象"), token)
end

function QueryMissionTalked(talkerindex)
	ShowList(npcindex, talkerindex, 1)
	return 0
end

function NewQueryMissionTalked(talkerindex)
	local missiontable = {}
	local cnt = 1
	for i=1,#eventlist do
		for j=1,#eventlist[i][4] do
			if eventlist[i][4][j] > 0 then
				missiontable[cnt] = eventlist[i][4][j]
				cnt = cnt + 1
			end
		end
	end
	token = "100|" .. #missiontable
	for i=1,#missiontable do
		token = token .. "|" .. missiontable[i]
	end
	lssproto.windows(talkerindex, 1003, 0, 2000, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	ShowList(meindex, talkerindex, 1)
end

--NPC窗口事件(NPC索引)
function WindowTalked( meindex, talkerindex, seqno, select, data)
	--print("[querymission:WindowTalked]",seqno, select, data)
	if seqno > 1000 and seqno < 2000 then
		if select == 1 or select == 4 then
			if char.getInt(talkerindex,"活力") < 100 then
				char.newMessageToCli(talkerindex, -1, "您活力不足100", "随机色")
				lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
				return
			end
			id = seqno - 1000
			if npc.Free(meindex, talkerindex, eventlist[id][3]) ~= 1 and npc.Free(meindex, talkerindex, eventlist[id][2]) ~= 1 then
				char.newMessageToCli(talkerindex, -1, eventlist[id][1] .. "尚未开始", "随机色")
				return
			end
			if eventlist[id][4][1] == 0 then
				char.newMessageToCli(talkerindex, -1, "这个任务是不能帮你重置的", "随机色")
			else
				for i=1, #eventlist[id][4] do
					npc.EvClr(talkerindex, eventlist[id][4][i])
				end
				char.newMessageToCli(talkerindex, -1, "成功为您重置了" .. eventlist[id][1], "随机色")
				char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - 100)
				char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + 100 * 100)
				saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
				other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,100})
			end
		end
	elseif seqno == 2000 then
		if data == "" then
			return
		end
		local missionno = other.atoi(data)
		if missionno == 0 then
			return
		end
		if char.getInt(talkerindex,"活力") < 100 then
			char.newMessageToCli(talkerindex, -1, "您活力不足100", "随机色")
			lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
			return
		end		
		local zhaotype = 0
		for i=1,#eventlist do
			for j=1,#eventlist[i][4] do
				if missionno == eventlist[i][4][j] then
					if npc.Free(meindex, talkerindex, "ENDEV=" .. eventlist[i][4][j]) == 1 then
						zhaotype = i
						break
					end
				end
			end
			if zhaotype > 0 then
				break
			end
		end
		--print("[querymission:WindowTalked]zhaotype",zhaotype)
		if zhaotype > 0 then
			if eventlist[zhaotype][4][1] == 0 then
				char.newMessageToCli(talkerindex, -1, "这个任务是不能帮你重置的", "随机色")
				return
			end
			for i=1, #eventlist[zhaotype][4] do
				npc.EvClr(talkerindex, eventlist[zhaotype][4][i])
			end
			char.newMessageToCli(talkerindex, -1, "成功为您重置了" .. eventlist[zhaotype][1], "随机色")
			char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - 100)
			char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + 100 * 100)
			saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,100})
			local missiontable = {}
			local cnt = 1
			for i=1,#eventlist do
				for j=1,#eventlist[i][4] do
					if eventlist[i][4][j] > 0 then
						missiontable[cnt] = eventlist[i][4][j]
						cnt = cnt + 1
					end
				end
			end
			token = "100|" .. #missiontable
			for i=1,#missiontable do
				token = token .. "|" .. missiontable[i]
			end
			lssproto.windowsupdate(talkerindex, 1003, 0, 2000, char.getWorkInt( npcindex, "对象"), token)
		end
	else
		if select == 16 then
			ShowList(meindex, talkerindex, seqno - 1)
		elseif select == 32 then
			ShowList(meindex, talkerindex, seqno + 1)
		elseif select == 0 then
			num = (seqno - 1) * 6 + other.atoi(data)
			token = "请问您是否确定要重置这个任务\n\n「" .. eventlist[num][1] .. "」\n\n重置后可以重新开始这个任务。\n\nPS：重置该任务需要100活力手续费哦！"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 1000 + num, char.getWorkInt( meindex, "对象"), token)
		end
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)

	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	eventlist = {{"解救老爷爷", "NOWEV=1", "ENDEV=1", {1}}
							,{"送贝壳的故事", "NOWEV=2", "ENDEV=2", {2}}
							,{"亚姆的斧头(一)", "NOWEV=3", "ENDEV=3", {3}}
							,{"成人仪式", "NOWEV=4", "ENDEV=4", {4}}
							,{"亚姆的斧头(二)", "NOWEV=5", "ENDEV=5", {5}}
							,{"小猪的爱情故事", "NOWEV=6,NOWEV=7&ENDEV!=8,ENDEV=7&ENDEV!=8,NOWEV=8&ENDEV!=8", "ENDEV=8", {6,7,8}}
							,{"梦德洞窟", "NOWEV=9&ENDEV!=11,NOWEV=10&ENDEV!=11,NOWEV=11&ENDEV!=11,ENDEV=11&ENDEV!=10&ENDEV!=12,ENDEV=11&ENDEV=10&ENDEV=12&ENDEV=!9,NOWEV=9,NOWEV=12", "ENDEV=9", {9,10,11,12}}
							,{"强盗的洞穴", "NOWEV=13", "ENDEV=13", {13}}
							,{"恐龙博士(抓鲁尼帖斯)", "NOWEV=15", "ENDEV=15", {15,16}}
							,{"恐龙博士(抓贝鲁卡)", "NOWEV=16", "ENDEV=16", {15,16}}
							,{"龙洞任务", "NOWEV=17", "ENDEV=17", {17}}
							,{"造斧专家哈恩", "NOWEV=18&ENDEV!=18,NOWEV=19&ENDEV!=18,ENDEV=19&ENDEV!=18", "ENDEV=18", {18,19}}
							,{"造斧专家哈恩", "NOWEV=19", "ENDEV=19", {19}}
							,{"强恩一族洞窟", "NOWEV=20&ENDEV!=22,NOWEV=21&ENDEV!=22,NOWEV=22&ENDEV!=22", "ENDEV=22", {20,21,22}}
							,{"矿工的比赛", "NOWEV=27", "ENDEV=27", {27}}
							,{"五兄弟之谜", "NOWEV=28&ENDEV!=31,ENDEV=28&ENDEV!=31,NOWEV=31&ENDEV!=31", "ENDEV=31", {28,31}}
							,{"黄金羚羊之谜", "NOWEV=30&ENDEV!=54,NOWEV=54&ENDEV!=54,ENDEV=30&ENDEV!=54,NOWEV=29&ENDEV!=54,ENDEV=29&ENDEV!=54", "ENDEV=54", {29,30,54}}
							,{"梦幻洞窟三次", "NOWEV=32&ENDEV!=34,ENDEV=32&ENDEV!=34,NOWEV=33&ENDEV!=34,ENDEV=33&ENDEV!=34,NOWEV=34&ENDEV!=34", "ENDEV=34", {30,32,33,34}}
							,{"卡坦的愿望", "NOWEV=35", "ENDEV=35", {35}}
							,{"马祖任务", "NOWEV=37&ENDEV!=38,ENDEV=37&ENDEV!=38,NOWEV=38&ENDEV!=38", "ENDEV=38", {37,38}}
							,{"四宝玉之迷", "NOWEV=45", "ENDEV=45", {45}}
							,{"琉璃洞窟", "NOWEV=39", "ENDEV=39", {39}}
							,{"深红洞窟", "NOWEV=40", "ENDEV=40", {40}}
							,{"玄黄洞窟", "NOWEV=41&ENDEV!=42,NOWEV=42&ENDEV!=42,ENDEV=42&ENDEV!=42", "ENDEV=42", {41,42}}
							,{"碧青洞窟", "NOWEV=46", "ENDEV=46", {46}}
							,{"漆黑洞窟", "NOWEV=53", "ENDEV=53", {0}}
							,{"新小猪爱情故事", "NOWEV=24,NOWEV=23,ENDEV=24&NOWEV!=25&NOWEV!=26&ENDEV!=25&ENDEV!=26,ENDEV=23&NOWEV!=25&NOWEV!=26&ENDEV!=25&ENDEV!=26,ENDEV=23&NOWEV=25,ENDEV=24&NOWEV=25,ENDEV=23&NOWEV=26,ENDEV=24&NOWEV=26", "ENDEV=23&ENDEV=26,ENDEV=24&ENDEV=26,ENDEV=23&ENDEV=25,ENDEV=24&ENDEV=25", {23,24,25,26}}
							,{"英雄岛前传", "NOWEV=63", "ENDEV=63", {0}}
							,{"英雄岛后转", "NOWEV=64&ENDEV!=64,NOWEV=64&NOWEV=65&ENDEV!=64,NOWEV=64&ENDEV=65&ENDEV!=64,NOWEV=66&ENDEV!=64,NOWEV=55&ENDEV!=64,NOWEV=68&ENDEV!=64,NOWEV=57&ENDEV!=64,ENDEV=57&ENDEV!=64,NOWEV=67&ENDEV!=64,NOWEV=56&ENDEV!=64,ENDEV=56&ENDEV!=64", "ENDEV=64", {0}}
							,{"精灵王任务", "NOWEV=69&ENDEV!=72,ENDEV=69&ENDEV!=72,NOWEV=70&ENDEV!=72,ENDEV=70&ENDEV!=72,NOWEV=71&ENDEV!=72,ENDEV=71&ENDEV!=72", "ENDEV=72", {0}}
							}

	maxpage = math.ceil(#eventlist / 6) - 1
end

function main()
	--第一个商店内容
	--[[Create("任务查询系统", 41321, 1006, 15, 13, 4)
	Create("任务查询系统", 41321, 2006, 15, 12, 4)
	Create("任务查询系统", 41321, 3006, 17, 14, 4)
	Create("任务查询系统", 41212, 4006, 16, 30, 6)
	data()
	]]
	Create("任务查询系统", 41321, 777, 39, 10, 4)
	Create("任务查询系统", 41321, 777, 39, 11, 4)
	Create("任务查询系统", 41321, 777, 39, 12, 4)
	Create("任务查询系统", 41212, 777, 39, 13, 6)
	data()
	
end