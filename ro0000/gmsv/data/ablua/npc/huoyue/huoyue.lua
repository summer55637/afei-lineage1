function queryHuoyue(talkerindex)
	local huoyuedate = os.date("%Y%m%d",os.time())
	local huoyuenum = 0
	local flg = 0
	local flg2 = 0
	local datalist = {0,0,0,0,0,0,0,0,0,0,0,0}
	local ret = sasql.query("select * from `huoyue` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			if sasql.data(2) ~= os.date("%Y%m%d",os.time()) then
				sasql.query("update `huoyue` set `date`='" .. os.date("%Y%m%d",os.time()) .. "',`num`=0,`flg`=0,`flg2`=0,`data1`=0,`data2`=0,`data3`=0,`data4`=0,`data5`=0,`data6`=0,`data7`=0,`data8`=0,`data9`=0,`data10`=0,`data11`=0,`data12`=0 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
			else
				huoyuedate = sasql.data(2)
				huoyuenum = other.atoi(sasql.data(3))
				flg = other.atoi(sasql.data(4))
				flg2 = other.atoi(sasql.data(5))
				datalist[1] = other.atoi(sasql.data(6))
				datalist[2] = other.atoi(sasql.data(7))
				datalist[3] = other.atoi(sasql.data(8))
				datalist[4] = other.atoi(sasql.data(9))
				datalist[5] = other.atoi(sasql.data(10))
				datalist[6] = other.atoi(sasql.data(11))
				datalist[7] = other.atoi(sasql.data(12))
				datalist[8] = other.atoi(sasql.data(13))
				datalist[9] = other.atoi(sasql.data(14))
				datalist[10] = other.atoi(sasql.data(15))
				datalist[11] = other.atoi(sasql.data(16))
				datalist[12] = other.atoi(sasql.data(17))
			end
		else
			sasql.query("insert into `huoyue` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. huoyuedate .. "',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)")
		end
	end
	return huoyuedate,huoyuenum,flg,flg2,datalist
end

function queryHuoyueLua(talkerindex,type)
	local huoyuedate,huoyuenum,flg,flg2,datalist = queryHuoyue(talkerindex)
	if type == 1 then
		return huoyuenum
	elseif type == 2 then
		return flg
	end
	return 0
end

function queryHuoyueType(talkerindex,datatype)
	local huoyuedate = os.date("%Y%m%d",os.time())
	local ret = sasql.query("select `date`,`data" .. datatype .. "` from `huoyue` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			if sasql.data(1) ~= os.date("%Y%m%d",os.time()) then
				sasql.query("update `huoyue` set `date`='" .. os.date("%Y%m%d",os.time()) .. "',`num`=0,`flg`=0,`flg2`=0,`data1`=0,`data2`=0,`data3`=0,`data4`=0,`data5`=0,`data6`=0,`data7`=0,`data8`=0,`data9`=0,`data10`=0,`data11`=0,`data12`=0 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				return 0
			else
				return other.atoi(sasql.data(2))
			end
		else
			sasql.query("insert into `huoyue` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. huoyuedate .. "',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)")
			return 0
		end
	end
	return 0
end

function updateHuoyue(talkerindex,datatype,datanum)
	local huoyuedate,huoyuenum,flg,flg2,datalist = queryHuoyue(talkerindex)
	local datatypetemp = 0
	for i=1,#huoyuedata do
		if huoyuedata[i][1] == datatype then
			datatypetemp = i
		end
	end
	if datatypetemp == 0 then
		return 0
	end
	if datalist[datatype] >= huoyuedata[datatypetemp][6] then
		return 0
	end
	datalist[datatype] = datalist[datatype] + datanum
	if datalist[datatype] >= huoyuedata[datatypetemp][6] then
		datalist[datatype] = huoyuedata[datatypetemp][6]
		huoyuenum = huoyuenum + huoyuedata[datatypetemp][7]
		flg2 = other.DataOrData(flg2,datatype - 1)
	end
	sasql.query("update `huoyue` set `num`=" .. huoyuenum .. ",`flg2`=" .. flg2 .. ",`data" .. datatype .. "`=" .. datalist[datatype] .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
	other.CallFunction("RedPointSend","data/ablua/dispatchmessage.lua",{talkerindex,5})
	return datalist[datatype]
end

function ShowList(talkerindex,showdata)
--L|当前活跃度|1道具奖励是否领取(0未领,1领取)|道具形像|...5道具奖励是否领取(0未领,1领取)|道具形像|活动总数量|是否推荐(1推荐)|形像|标题|当前次数|总次数(为0时,不限制活动次数)|是否完成获得活跃度|完成获得活跃度(0时,则没有活跃度)|活动传送编号|活动索引|活动类型(1日常2特色3限时)|...N是否推荐(1推荐)|形像|标题|当前次数|总次数(为0时,不限制活动次数)|是否完成获得活跃度|完成获得活跃度(0时,则没有活跃度)|活动传送编号|活动索引|活动类型(1日常2特色3限时)|
	local huoyuedate,huoyuenum,flg,flg2,datalist = queryHuoyue(talkerindex)
	token = "L|" .. huoyuenum
	for i=1,5 do
		token = token .. "|" .. other.DataAndData(flg,i - 1) .. "|" .. jianglidata[i][4]
	end
	token = token .. "|" .. #huoyuedata
	for i=1,#huoyuedata do
		if datalist[huoyuedata[i][1]] == nil then
			datalist[huoyuedata[i][1]] = 0
		end
		token = token .. "|" .. huoyuedata[i][2] .. "|" .. huoyuedata[i][3] .. "|" .. huoyuedata[i][4] .. "|" .. datalist[huoyuedata[i][1]] .. "|" .. huoyuedata[i][6] .. "|" .. huoyuedata[i][7] .. "|" .. huoyuedata[i][7] .. "|" .. huoyuedata[i][8] .. "|" .. huoyuedata[i][1] .. "|" .. huoyuedata[i][9]
	end
	lssproto.windows(talkerindex, 1013, 0, 0, char.getWorkInt( npcindex, "对象"), token)
	if showdata ~= 1 then
		lssproto.windowsupdate(talkerindex, 1013, 0, 0, char.getWorkInt( npcindex, "对象"), "O|" .. showdata)
	end
	return 0
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "I" then
		local jiangliindex = other.getString(data,"|",2)
		if jiangliindex == "" then
			return
		end
		jiangliindex = other.atoi(jiangliindex)
		if jiangliindex < 1 or jiangliindex > #jianglidata then
			return
		end
		--I|道具索引(1-5)|名字|损耗|说明|
		token = "I|" .. jiangliindex .. "|" .. jianglidata[jiangliindex][1] .. "|" .. jianglidata[jiangliindex][3] .. "|" .. jianglidata[jiangliindex][2]
		lssproto.windowsupdate(talkerindex, 1013, 0, 0, char.getWorkInt( meindex, "对象"), token)
	elseif type == "G" then
		local huoyuedate,huoyuenum,flg,flg2,datalist = queryHuoyue(talkerindex)
		local jiangliindex = other.getString(data,"|",2)
		if jiangliindex == "" then
			return
		end
		jiangliindex = other.atoi(jiangliindex)
		if jiangliindex < 1 or jiangliindex > #jianglidata then
			return
		end 
		if other.DataAndData(flg,jiangliindex - 1) ~= 0 then
			char.newMessageToCli(talkerindex,-1,"您已经领取过了","白色")
			return
		end
		if huoyuenum < jianglidata[jiangliindex][6] then
			char.newMessageToCli(talkerindex,-1,"您活跃度不够","白色")
			return
		end
		flg = other.DataOrData(flg,jiangliindex - 1)
		local ret = sasql.query("update `huoyue` set `flg`=" .. flg .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + jianglidata[jiangliindex][5] * 100)
			char.newMessageToCli(talkerindex,-1,"领取奖励成功,获得" .. jianglidata[jiangliindex][5] .. "声望","白色")
			other.CallFunction("RedPointSend","data/ablua/dispatchmessage.lua",{talkerindex,6})
			if char.getInt(talkerindex,"等级") >= 10 then
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,608,0})
			end
		end
	elseif type == "F" then
		--H|活动索引|活动时间|人数|等级|描述|奖励道具数量|道具形像|...道具形像N|
		local huoyuelist = other.getString(data,"|",2)
		if huoyuelist == "" then
			return
		end
		huoyuelist = other.atoi(huoyuelist)
		for i=1,#huoyuedata do
			if huoyuedata[i][1] == huoyuelist then
				token = "H|" .. huoyuelist .. "|" .. huoyuedata[i][10] .. "|" .. huoyuedata[i][11] .. "|" .. huoyuedata[i][12] .. "|" .. huoyuedata[i][5] .. "|" .. #huoyuedata[i][13]
				for j=1,#huoyuedata[i][13] do
					token = token .. "|" .. huoyuedata[i][13][j][4]
				end
				lssproto.windowsupdate(talkerindex, 1013, 0, 0, char.getWorkInt( meindex, "对象"), token)
				return
			end
		end
	elseif type == "H" then
		--S|活动索引|活动道具索引(当前活动奖励数量中的索引,1-总数量)|名字|损耗|说明|
		local huoyuelist = other.getString(data,"|",2)
		if huoyuelist == "" then
			return
		end
		huoyuelist = other.atoi(huoyuelist)
		local itemlist = other.getString(data,"|",3)
		if itemlist == "" then
			return
		end
		itemlist = other.atoi(itemlist)
		for i=1,#huoyuedata do
			if huoyuedata[i][1] == huoyuelist then
				if itemlist < 1 or itemlist > #huoyuedata[i][13] then
					return
				end
				token = "S|" .. huoyuelist .. "|" .. itemlist .. "|" .. huoyuedata[i][13][itemlist][1] .. "|" .. huoyuedata[i][13][itemlist][3] .. "|" .. huoyuedata[i][13][itemlist][2]
				lssproto.windowsupdate(talkerindex, 1013, 0, 0, char.getWorkInt( meindex, "对象"), token)
				return
			end
		end
	elseif type == "V" then
		local huoyuetype = other.getString(data,"|",2)
		if huoyuetype == "" then
			return
		end
		huoyuetype = other.atoi(huoyuetype)
		if huoyuetype == -2 then
			other.CallFunction("ShowHead", "data/ablua/npc/playerquestion/playerquestion.lua", {talkerindex})
		elseif huoyuetype == -3 then
			other.CallFunction("showpetrace", "data/ablua/npc/petrace/petrace.lua", {talkerindex})
		elseif huoyuetype == -4 then
			-- other.CallFunction("weixin", "data/ablua/weixin.lua", {talkerindex,other.Random(19,27),char.getChar(talkerindex,"名字")})
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	jianglidata = {{"5声望","可获得5声望","无",61156,5,20},{"8声望","可获得8声望","无",61156,8,40},{"10声望","可获得10声望","无",61156,10,60},{"15声望","可获得15声望","无",61156,15,80},{"20声望","可获得20声望","无",61156,20,100}}
	--活动索引|是否推荐(1推荐)|形像|标题|描述|总次数(为0时,不限制活动次数)|完成获得活跃度(0时,则没有活跃度)|活动传送编号|活动类型(1日常2特色3限时)|{道具名字|道具说明|道具损耗|道具形像|...道具形像N|}
	
	huoyuedata = {{1,0,61191,"每日跑环","完成一次跑环可获得活跃",1,10,1001,1,"全天","单人","每转110级以上，0转除外",{}}
				,{2,0,61192,"每日活力","消耗50活力可获得活跃",50,10,-1,1,"全天","单人","所有等级",{}}
				,{3,1,61164,"每日抓宠","每天抓捕1次宠物可获得活跃",1,10,-1,1,"全天","无限制","所有等级",{}}
				,{4,1,61165,"每日金币","每天消耗99金币可获得活跃",99,15,-1,1,"全天","单人","所有等级",{}}
				,{5,1,61157,"每日答题","每日完成10轮答题可获得活跃",10,10,-2,1,"全天","单人","所有等级",{}}
				,{6,0,61193,"每日捕鱼","捕鱼场成功击杀1次鱼类可获得活跃",1,10,1004,1,"全天","单人","所有等级",{}}
				,{7,1,61155,"每日战斗","每日野外战斗10次可获得活跃",10,10,-1,1,"全天","无限制","所有等级",{}}
				,{8,1,61153,"每日分享","每日分享可获得活跃",1,10,-4,1,"全天","单人","所有等级",{}}
				,{9,0,61195,"每日加工","玩家合成或料理任意10次可获得活跃",10,10,-1,1,"全天","单人","所有等级",{}}
				,{11,0,61197,"每日刷楼","每日参与1次刷楼可获得活跃",1,15,1002,1,"全天","无限制","所有等级",{}}
				,{12,0,61159,"每日竞猜","每日参与竞猜1次可获得活跃",1,10,-3,1,"全天","单人","所有等级",{}}
				,{14,0,61193,"娱乐捕鱼","捕鱼场击杀鱼类可获得石币",0,0,1004,2,"全天","1人","不限等级",{{"石币","主要流通货币之一","",24052}}}
				,{15,0,61197,"阎罗十殿","挑战各层阎王难度较大建议组队挑战 战胜阎王可获得丰富奖励",0,0,1002,2,"全天","1-5人","建议120级以上",{{"宠物碎片","集齐一定数量的宠物碎片可以兑换稀有宠物","",56188},{"装备","13-17等级武器防具,6到9级环类装备","",20033},{"石币","可用于购买素材、装备、传送羽毛、使用贴心传送等","",24052},{"商城物品","经验果实、诱敌香、属性酒等等","",61153}}}--{"","","",}
				,{16,0,61191,"每日跑环","玩家每天可完成10次跑环，还可额外购买5次 可获得声望",0,0,1001,2,"全天","1人","每转110级除0转",{{"声望","可以在声望商店兑换物品","",51522}}}
				,{17,0,61157,"每日答题","玩家每日完成10次答题答对可获得活力",0,0,-2,2,"全天","1人","所有等级",{{"活力","主要消耗型货币","",51521}}}
				,{18,0,61158,"段位排位赛","玩家之间实时匹配的段位排行赛，会根据玩家当前段位匹配进行PK，有称号奖励",0,0,1005,2,"12-24点","1人","5转140级",{{"称号","可以佩戴多种字样称号","",23155}}}
				,{19,0,61159,"小猪竞猜","玩家每天可参加小猪竞猜，每转竞猜时间间隔不同，竞猜第一名可获得活力奖励",0,0,-3,2,"全天","1人","无限制",{{"活力","主要消耗型货币","",51521}}}
				,{20,0,61160,"乱舞PK","比赛场内由NPC根据报名人数进行随机匹配\n限制单号IP进场，进场禁止组队\n胜利方可获得1-2点PK积分，失败则传出比赛地图",0,0,1003,3,"每周五晚8点开启，12点结束","1人","每转120级，0转不可参加",{{"声望","可以在声望商店兑换物品","",61156},{"水晶","主要流通货币之一，用于购买金币商城物品和宠物回炉","",50031}}}
				 ,{22,0,61162,"龙域副本","玩家可前往娱乐互动线渔村医院与龙域接引人对话参与活动，活动可获得光环奖励",0,0,1006,3,"每周二、五晚上18点-20点","1-5人","所有等级",{{"能量结晶","用于合成守护光环的重要物品","",23330},{"守护光环","可为角色额外增加属性的物品","",23793}}}
				 ,{23,0,61198,"合成比赛","玩家前往活动地图合成枪10提交给NPC可获得比赛积分 比赛积分可换声望",0,0,1007,3,"每周1/3/5/7日晚上7点开启-8点结束","1人","所有等级",{{"声望","可在声望商城购买物品","",61156}}}
				 ,{24,0,61164,"抓宠比赛","玩家前往活动地图抓捕专用活动宠提交NPC可获得比赛积分 比赛积分可换声望",0,0,1007,3,"每周2/4/6/7日晚上7点开启-8点结束","1人","所有等级",{{"声望","可在声望商城购买物品","",61156}}}
				,{25,0,61193,"激情捕鱼","玩家可在活动时间进入激情捕鱼场，参与击杀各种鱼类，可获得金币奖励",0,0,1004,3,"每周3/6日 晚上7点开启-7点30分结束","1人","所有等级",{{"金币","可在金币商城购买物品或宠物回炉","",23341}}}
				,{26,0,61163,"守庄奖励","守庄7天可获得稀有皮肤7天*3\n守庄15天可获得年兽蛋*1\n守庄30天可获骑机暴证（永久）",0,0,1008,2,"累计守庄第8天、16天、31天12点-18点","1人","无限制",{{"时效时装","可获取7天透暴赛亚人皮肤","",23629},{"马年蛋","可获取任意年兽一只","",23834},{"机暴证","可获取机暴骑证一张","",23630}}}
				,{27,0,61163,"失落的文明","挑战副本中各种关卡和BOSS获得最后的胜利，并有各种丰富奖励",0,0,1011,2,"每天","5人","130级以上 0转除外",{{"宝箱","宝箱内含各种奖励","",23834}}}
				--,{3,,,,,,,,,,,,}
				}
end
function main()
	--第一个商店内容
	Create("活跃NPC", 100000, 777, 26, 39, 4)
	data()
end