function CaptureCheckFunction( attackindex, defindex )
	for i=1, #NeedEnemy do
		if NeedEnemy[i][1] == char.getInt(defindex, "宠ID") then
			for j=1, #NeedEnemy[i][2] do
				if NeedEnemy[i][2][j] > -1 then
					if npc.Free(-1, attackindex, "ITEM=" .. NeedEnemy[i][2][j]) == 0 then
						char.TalkToCli(attackindex, -1, "【友情提示】由于您缺少[" .. item.getNameFromNumber(NeedEnemy[i][2][j]) .. "]导致无法捕捉成功[" .. char.getChar(defindex, "名字") .. "]。", "随机色")
						return 0
					end
				end
			end
			if NeedEnemy[i][3] > 0 then
				if char.getInt(attackindex,"声望") < NeedEnemy[i][3] * 100 then
					char.TalkToCli(attackindex, -1, "【友情提示】由于您声望不足" ..  NeedEnemy[i][3] .. "导致无法捕捉成功[" .. char.getChar(defindex, "名字") .. "]。", "随机色")
					return 0
				end
			end
			if NeedEnemy[i][4] > 0 then
				if char.getInt(attackindex,"活力") < NeedEnemy[i][4] then
					char.TalkToCli(attackindex, -1, "【友情提示】由于您活力不足" ..  NeedEnemy[i][4] .. "导致无法捕捉成功[" .. char.getChar(defindex, "名字") .. "]。", "随机色")
					return 0
				end
			end
		end
	end
	if char.getInt(attackindex,"地图号") ~= 41011 then
		if char.getInt(defindex,"等级") == 1 then
			if char.getChar(attackindex,"抓宠数据") ~= "" then
				local capdate = other.getString(char.getChar(attackindex,"抓宠数据"),"|",1)
				local capnum = other.getString(char.getChar(attackindex,"抓宠数据"),"|",2)
				if capnum == "" then
					char.setChar(attackindex,"抓宠数据",os.date("%Y%m%d",os.time()) .. "|0")
					return 1
				end
				if os.date("%Y%m%d",os.time()) == capdate then
					capnum = other.atoi(capnum)
					if capnum >= 10 then
						if char.getInt(attackindex,"活力") < 5 then
							char.newMessageToCli(attackindex, -1, "您活力不足", "白色")
							return 0
						end
					end
				else
					char.setChar(attackindex,"抓宠数据",os.date("%Y%m%d",os.time()) .. "|0")
				end
			end
		end
	end
	return 1
end

function CaptureOkFunction( attackindex, defindex )
	if char.getInt(attackindex,"等级") >= 50 then
		if char.getInt(defindex,"宠ID") == 63 then
			other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{attackindex,612,0})
		end
	end
	--if char.getInt(attackindex, "地图号") ~= 125 then
		for i=1, #NeedEnemy do
			if NeedEnemy[i][1] == char.getInt(defindex, "宠ID") then
				for j=1, #NeedEnemy[i][2] do
					if NeedEnemy[i][2][j] > -1 then
						npc.DelItem(attackindex, NeedEnemy[i][2][j] .. "*1")
					end
				end
				token = "【友情提示】成功捕捉[" .. char.getChar(defindex,"名字") .. "]"
				if NeedEnemy[i][3] > 0 then
					char.setInt(attackindex,"声望",char.getInt(attackindex,"声望") - NeedEnemy[i][3] * 100)
					token = token .. "，扣除声望" ..  NeedEnemy[i][3]
				end
				if NeedEnemy[i][4] > 0 then
					token = token .. "，扣除活力" ..  NeedEnemy[i][4]
					char.setInt(attackindex,"活力",char.getInt(attackindex,"活力") - NeedEnemy[i][4])
					char.setInt(attackindex,"气势",char.getInt(attackindex,"气势") + NeedEnemy[i][4] * 100)
					saacproto.ACFixFMData(attackindex,12,char.getInt(attackindex,"气势"),"")
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {attackindex,2,NeedEnemy[i][4]})
				end
				other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {attackindex,3,1})
				char.TalkToCli(attackindex, -1, token, "随机色")
				return
			end
		end
	--end
	
	if char.getInt(attackindex,"地图号") ~= 41011 then
		if char.getInt(defindex,"等级") == 1 then
			if char.getChar(attackindex,"抓宠数据") ~= "" then
				local capdate = other.getString(char.getChar(attackindex,"抓宠数据"),"|",1)
				local capnum = other.getString(char.getChar(attackindex,"抓宠数据"),"|",2)
				if capnum == "" then
					capnum = 0
				end
				if os.date("%Y%m%d",os.time()) == capdate then
					capnum = other.atoi(capnum) + 1
					char.setChar(attackindex,"抓宠数据",capdate .. "|" .. capnum)
					if capnum > 10 then
						if char.getInt(attackindex,"活力") >= 5 then
							char.setInt(attackindex,"活力",char.getInt(attackindex,"活力") - 5)
							char.setInt(attackindex,"气势",char.getInt(attackindex,"气势") + 5 * 100)
							saacproto.ACFixFMData(attackindex,12,char.getInt(attackindex,"气势"),"")
							other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {attackindex,2,5})
							char.newMessageToCli(attackindex, -1, "您进入抓捕1级宠物超过10次,扣除5活力", "白色")
						end
					end
				else
					char.setChar(attackindex,"抓宠数据",os.date("%Y%m%d",os.time()) .. "|1")
				end
			else
				char.setChar(attackindex,"抓宠数据",os.date("%Y%m%d",os.time()) .. "|1")
			end
		end
	end
	other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {attackindex,3,1})
end

function CapturePer( attackindex, defindex, per )
	if char.getInt(attackindex,"转数") == 0 and npc.CheckEvent(attackindex,304) == 0 and npc.CheckNowEvent(attackindex,304) ~= 0 and char.getInt(defindex,"宠ID") == 41 then
		return 100
	end
	return per
end

function data()
								--地图,道具,抓宠所需道具, 宠物列表
	--rarepetid1 = {{125, 19641, {{-1, -1}}}
	--							,{126, 19642,{{-1,-1}}}
	--							,{127, 19643, {{1794,23102}, {1795,23103}, {1796,23104}, {1797,23105}}}
	--							,{128, 19644, {{1794,23102}, {1795,23103}, {1796,23104}, {1797,23105}}}
	--							}

								
								--宠物ID,抓宠物删除道具编号
	NeedEnemy = {{ 524,	{ 2456},0,0 }--卡特利奴/加特利奴喜爱的食物
								,{ 961,	{20219},0,0 }--艾蜜/玛丽娜丝庄园旅游指南
								,{ 953,	{20223},0,0 }--雷诛/布伊比的牙
								,{ 962,	{20222},0,0 }--讦谯龙/收据
								,{ 777,	{20253},0,0 }--佩露夏/魔法钻戒[水LV3-1]
								,{ 796,	{20247},0,0 }--嘎吱拉/魔法钻戒[地LV3-1]
								,{ 812,	{20259},0,0 }--斑尼迪克/魔法钻戒[火LV3-1]
								,{ 1105,	{1690, 1691, 1692},0,0 }--夏普德/海蓝之棒，海蓝之兜，海蓝之铠
								,{ 3901,	{21096},0,0 }--动物园抓宠=龙蛇
								,{ 3902,	{21096},0,0 }--动物园抓宠=龙蛇
								,{ 3903,	{21096},0,0 }--动物园抓宠=龙蛇
								,{ 3904,	{21096},0,0 }--动物园抓宠=龙蛇
								,{ 3010,	{21027},0,0 }--动物园抓宠=地乌龟
								,{ 3011,	{21027},0,0 }--动物园抓宠=水乌龟
								,{ 3012,	{21027},0,0 }--动物园抓宠=火乌龟
								,{ 3013,	{21027},0,0 }--动物园抓宠=风乌龟
								,{ 3018,	{21028,21029},0,0 }--动物园抓宠=兔子-地兔子
								,{ 3019,	{21028,21029},0,0 }--动物园抓宠=兔子-火兔子
								,{ 3020,	{21030},0,0 }--动物园抓宠=兔子-白兔子【限时开放】
								,{ 3021,	{21028,21029},0,0 }--动物园抓宠=兔子-风兔
								,{ 969,	{21097},0,0 }--动物园抓宠=橙虎
								,{ 3120,	{21107},0,0 }--动物园抓宠=橙虎
								,{ 3121,	{21107},0,0 }--动物园抓宠=蓝虎
								--,{ 3062,	{-1},88888,88888 }--新鲨鱼
								--,{ 3063,	{-1},6000,6000 }--新猩猩
								--,{ 3072,	{23627},66666,0 }--新猩猩
																
							}

	enemylist = {{223, {{0,1}, {8, 10}, {0, 0}, {0, 1}}}
							}
	ranktbl = {100, 95, 90, 85, 80, 0}
	--maxrarepetid1 = #rarepetid1
end

function main()
	data()
end


