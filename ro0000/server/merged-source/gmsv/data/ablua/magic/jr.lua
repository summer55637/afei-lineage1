--NPC循环事件(NPC索引)
function Loop(meindex)
    print("TEST")
	if char.getWorkInt(meindex, "战斗") == 0 then
    --战斗宠物数组，设置战斗的宠物ID,最大10只
    enemytable = {0, 0, 0, 0, 0, 0, 0, 0, 0 }
    --建立一场战斗(玩家索引，自己引索，战斗宠物数组)返回一个战斗索引
    battleindex = battle.CreateVsEnemy(meindex, -1, enemytable)
	print(meindex)
  	end
end

function getFamilyData()
	local a = 0
	while(a <= 10)
	do
		a = a + 1
		math.randomseed(other.gettimeofday())
		fmrnd = math.random(11,280)
		oldfmrnd = fmrnd
		ShowFamilyList = family.ShowFamilyList(fmrnd)
		if ShowFamilyList ~= "" then
			leaderid = other.getString(ShowFamilyList," ",9)
			sqlstr = "select `LoginTime` from `CSAlogin` where `Name`='" .. leaderid .. "'"
			ret = sasql.query(sqlstr)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				num = sasql.num_rows()
				if num > 0 then
					sasql.fetch_row(0)
					logintime = sasql.data(1)
					sqlstr = "Select UNIX_TIMESTAMP('" .. logintime .. "')"
					ret = sasql.query(sqlstr)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						num = sasql.num_rows()
						if num > 0 then
							sasql.fetch_row(0)
							loginunixtime = sasql.data(1)
							if other.time() - loginunixtime >= 15 * 86400 then
								family.ACShowMemberList(fmrnd)
								ShowMemberListNum = family.ShowMemberListNum(fmrnd)
								if ShowMemberListNum > 1 then
									ShowFamilyList = family.ShowFamilyList(fmrnd)
									ShowMemberListData = family.ShowMemberListData(fmrnd,math.random(2,ShowMemberListNum))
									return fmrnd,other.getString(ShowFamilyList," ",2),other.getString(ShowMemberListData,"|",2)
								end
							end
						end
					end
				end
			end
		end
	end
	return 0,"",""
end

--建立函数Npc_test_Create()
function jr(charaindex,trn,pettrn,lv,nameflg, fl, x, y, dir)
	oldfmrnd = 0
	--print(name, trn, lv, fl, x, y, dir)
	flg = math.random(1,#ridepet)
	nametmp = playername[math.random(1,#playername)]
	playernotmp = playerno[math.random(1,#playerno)]
	jrfmindex = 0
	jrfmname = ""
	ridepettype = 0
	if nameflg == 0 then
		name = nametmp
		trn = math.random(1,4)
	elseif nameflg == 1 then 
		name = nametmp .. playernotmp[1]
		trn = math.random(1,4)
	elseif nameflg == 2 then 
		trn = math.random(0,5)
		lv = math.random(120,135)
		if math.random(1,100) <= 30 then
			jrfmindex,jrfmname,name = getFamilyData()
			if jrfmindex == 0 then
				name = nametmp
				char.TalkToCli(charaindex, -1, "创建家族人物失败。", "黄色")
			else
				if math.random(1000) > 300 then
					name = nametmp
				end
			end
		else
			name = nametmp
		end
	elseif nameflg == 3 then
		trn = math.random(0,5)
		lv = math.random(120,135)
		jrfmindex,jrfmname,name = getFamilyData()
		if jrfmindex == 0 then
			name = nametmp
			char.TalkToCli(charaindex, -1, "创建家族人物失败。", "黄色")
		end
	elseif nameflg == 4 then
		trn = math.random(0,5)
		lv = math.random(120,135)
		jrfmindex = 0
		if math.random(1,100) <= 50 then
			jrfmindex,jrfmname,name = getFamilyData()
			if jrfmindex == 0 then
				name = nametmp
				char.TalkToCli(charaindex, -1, "创建家族人物失败。", "黄色")
			end
		else
			namernd = math.random(1,100)
			if namernd <= 60 then
				name = nametmp
			else
				name = nametmp .. playernotmp[1]
			end
		end
	elseif nameflg == 5 then
		jrfmindex = 0
		if math.random(1,100) <= 60 then
			jrfmindex,jrfmname,name = getFamilyData()
			if jrfmindex == 0 then
				name = nametmp
				char.TalkToCli(charaindex, -1, "创建家族人物失败。", "黄色")
			end
		else
			namernd = math.random(1,100)
			if namernd <= 60 then
				name = nametmp
			else
				name = nametmp .. playernotmp[1]
			end
		end
	end
	petenemyid = attpet[math.random(1,#attpet)]
	playerlv = math.random(lv-1,lv+1)
	if playerlv < 1 then
		playerlv = 1
	elseif playerlv > 140 then
		playerlv = 140
	end
	ridepetlv = math.random(playerlv-5-1,playerlv-5+1)
	if ridepetlv < 1 then
		ridepetlv = 1
	elseif ridepetlv > 139 then
		ridepetlv = 139;
	end
	if nameflg == 5 then
		ridepetlv = math.random(playerlv-4,playerlv-2)
		if ridepetlv < 1 then
			ridepetlv = 1
		elseif ridepetlv > 139 then
			ridepetlv = 139
		end
		if playerlv == 140 then
			ridepetlv = 139
		end
	end
	attpetlv = playerlv
	if attpetlv < 1 then
		attpetlv = 1
	elseif attpetlv > 139 then
		attpetlv = 139
	end
	if nameflg == 5 then
		if math.random(101,200) < 160 or playerlv == 1 then
			jrfmindex = 0
			ridepettype = 1
			namernd = math.random(1,100)
			if namernd <= 60 then
				name = nametmp
			else
				name = nametmp .. playernotmp[1]
			end
			local jrno
			if trn == 0 then
				local tempjrno = {100000,100002,100005,100007,100010,100012,100015,100017,100020,100022,100025,100027,100030,100032,100035,100037,100040,100042,100045,100047,100050,
								100052,100055,100057,100060,100062,100065,100067,100070,100072,100075,100077,100080,100082,100085,100087,100090,100092,100095,100097,100100,100102,
								100105,100107,100110,100112,100115,100117,100120,100122,100125,100127,100130,100132,100135,100137,100140,100142,100145,100147,100150,100152,100155,
								100157,100160,100162,100165,100167,100170,100172,100175,100177,100180,100182,100185,100187,100190,100192,100195,100197,100200,100202,100205,100207,
								100210,100212,100215,100217,100220,100222,100225,100227,100230,100232,100235,100237}
				jrno = tempjrno[math.random(#tempjrno)]
			else
				--jrno = math.random(100000,100239)
				jrno =tempjrno[math.random(#tempjrno)]
				if math.random(201,300) < 270 then
					--jrno = math.random(102003,102082)
				jrno =tempjrno[math.random(#tempjrno)]
				end
			end
			npcindex = npc.CreateSpecialNpc(name, jrno, fl, x + position[dir+1][2][1], y + position[dir+1][2][2], position[dir+1][1], luaplayid[math.random(1,20)], playerlv)
		else
			flg = math.random(1,#ridepet)
			npcindex = npc.CreateSpecialNpc(name, ridepet[flg][1], fl, x + position[dir+1][2][1], y + position[dir+1][2][2], position[dir+1][1], luaplayid[math.random(1,20)], playerlv)
		end
	else
		npcindex = npc.CreateSpecialNpc(name, ridepet[flg][1], fl, x + position[dir+1][2][1], y + position[dir+1][2][2], position[dir+1][1], luaplayid[math.random(1,20)], playerlv)
	end
	local color = math.random(100)
	if color <= 50 then
		color = 0
	elseif color <= 60 then
		color = 1
	elseif color <= 70 then
		color = 4
	elseif color <= 76 then
		color = 5
	elseif color <= 80 then
		color = 6
	elseif color <= 85 then
		color = 9
	elseif color <= 90 then
		color = 10
	elseif color <= 95 then
		color = 20
	else
		color = 11
	end
	char.setInt(npcindex,"人物显示颜色",color)
	char.setFlg(npcindex, "组队", 0)
	char.setInt(npcindex, "转数", trn)
	char.setInt(npcindex, "等级", playerlv)
	char.setWorkInt(npcindex, "离线", 1)
	char.setWorkInt(npcindex, "NPC临时2", 1)
	if jrfmindex > 0 then
		char.setInt(npcindex, "家族索引", jrfmindex)
		char.setChar(npcindex, "家族", jrfmname)
		char.setWorkInt(npcindex, "家族临时索引", jrfmindex - 1)
	end
	pindex = char.createPet(petenemyid, attpetlv)
	if char.check(pindex) == 1 then
		if nameflg == 2 then
			if math.random(50) <= 25 then
				char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 9 * 1000)
			else
				char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 1 * 1000)
			end
		else
			char.setInt(pindex, "体力", char.getInt(pindex, "体力") + pettrn * 1000)
		end
		char.complianceParameter(pindex)
		char.setWorkInt(pindex, "离线", 1)
		--char.setChar(pindex, "名字", attpet[id][1])
		petid = char.setCharPet(npcindex, pindex)
		if petid > -1 then
			char.setInt(pindex, "类型", "帮宠")
			char.setInt(npcindex, "战宠", petid)
		end
	end
	
	if ridepettype == 1 then
		char.setInt(npcindex, "骑宠", -1)
	else
		pindex = char.createPet(ridepet[flg][2], ridepetlv)
		if char.check(pindex) == 1 then
			if nameflg == 2 then
				if math.random(50) <= 25 then
					char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 9 * 1000)
				else
					char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 1 * 1000)
				end
			else
				char.setInt(pindex, "体力", char.getInt(pindex, "体力") + pettrn * 1000)
			end
			char.complianceParameter(pindex)
			char.setWorkInt(pindex, "离线", 1)
			if nameflg == 5 and trn == 0 then
				char.setChar(pindex, "名字", "新手" .. char.getChar(pindex,"名字"))
			end
			--char.setChar(pindex, "名字", ridepet[flg][2])
			petid = char.setCharPet(npcindex, pindex)
			if petid > -1 then
				char.setInt(pindex, "类型", "帮宠")
				char.setInt(npcindex, "骑宠", petid)
			end
		end
	end
	
	char.ToAroundChar(npcindex)
	
	if nameflg ~= 5 then
		for i = 2, 5 do
		  jrfmindex = 0
		  if nameflg == 1 then 
			name = nametmp .. playernotmp[i]
			elseif nameflg == 2 then 
			flg = math.random(1,#ridepet)
			math.randomseed(other.gettimeofday())
			if math.random(1,100) <= 30 then
				jrfmindex,jrfmname,name = getFamilyData()
				if jrfmindex == 0 then
					name = playername[math.random(1,#playername)]
					char.TalkToCli(charaindex, -1, "创建家族人物失败。", "黄色")
				else
					if math.random(1000) > 300 then
						name = playername[math.random(1,#playername)]
					end
				end
			else
				name = playername[math.random(1,#playername)]
			end
			petenemyid = attpet[math.random(1,#attpet)]
			trn = math.random(0,5)
			lv = math.random(120,135)
		  elseif nameflg == 3 then
			jrfmindex = oldfmrnd
			--petenemyid = attpet[math.random(1,#attpet)]
			--trn = math.random(0,5)
			--lv = math.random(120,135)
		  elseif nameflg == 4 then
			jrfmindex = oldfmrnd
			if jrfmindex == 0 then
				if namernd > 60 then
					name = nametmp .. playernotmp[i]
				end
			end
			--petenemyid = attpet[math.random(1,#attpet)]
		  end
		  --第二个假人。。。。
		  playerlv = math.random(lv-1,lv+1)
		  if playerlv < 1 then
			playerlv = 1
		  elseif playerlv > 140 then
			playerlv = 140;
		  end
		  ridepetlv = math.random(playerlv-5-1,playerlv-5+1)
		  if ridepetlv < 1 then
			ridepetlv = 1
		  elseif ridepetlv > 139 then
			ridepetlv = 139;
		  end
		  attpetlv = playerlv
		  if attpetlv < 1 then
			attpetlv = 1
		  elseif attpetlv > 139 then
			attpetlv = 139
		  end
			if nameflg == 2 or nameflg == 4 then
				local WarpRand = math.random(1,8)
				local WarpX = char.getInt(npcindex,"坐标X")
				local WarpY = char.getInt(npcindex,"坐标Y")
				local WarpDir = 0
				if WarpRand == 1 then
					WarpX = WarpX + 1 
					WarpDir = 6
				end
				if WarpRand == 2 then
					WarpY = WarpY + 1
					WarpDir = 0
				end
				if WarpRand == 3 then
					WarpX = WarpX - 1
					WarpDir = 2
				end
				if WarpRand == 4 then
					WarpY = WarpY - 1
					WarpDir = 4
				end
				if WarpRand == 5 then
					WarpX = WarpX + 1
					WarpY = WarpY + 1
					WarpDir = 7
				end
				if WarpRand == 6 then
					WarpX = WarpX - 1
					WarpY = WarpY - 1
					WarpDir = 3
				end
				if WarpRand == 7 then
					WarpX = WarpX + 1
					WarpY = WarpY - 1
					WarpDir = 5
				end
				if WarpRand == 8 then
					WarpX = WarpX - 1
					WarpY = WarpY + 1
					WarpDir = 1
				end
				pnpcindex = npc.CreateSpecialNpc(name, ridepet[flg][1], fl, WarpX, WarpY, WarpDir, luaplayid[math.random(1,20)], playerlv)
			else
				pnpcindex = npc.CreateSpecialNpc(name, ridepet[flg][1], fl, x + position[dir+1][i+1][1], y + position[dir+1][i+1][2], position[dir+1][1], luaplayid[math.random(1,20)], playerlv)
			end
			char.setWorkInt(pnpcindex, "离线", 1)
			char.setFlg(pnpcindex, "组队", 0)
			char.setInt(pnpcindex, "转数", trn)
			char.setInt(pnpcindex, "等级", playerlv)
			color = math.random(100)
			if color <= 50 then
				color = 0
			elseif color <= 60 then
				color = 1
			elseif color <= 70 then
				color = 4
			elseif color <= 76 then
				color = 5
			elseif color <= 80 then
				color = 6
			elseif color <= 85 then
				color = 9
			elseif color <= 90 then
				color = 10
			elseif color <= 95 then
				color = 20
			else
				color = 11
			end
			char.setInt(pnpcindex,"人物显示颜色",color)
			if jrfmindex > 0 then
				char.setInt(pnpcindex, "家族索引", jrfmindex)
				char.setChar(pnpcindex, "家族", jrfmname)
				char.setWorkInt(pnpcindex, "家族临时索引", jrfmindex - 1)
			end
			id = math.random(5)
			pindex = char.createPet(petenemyid, attpetlv)
			if char.check(pindex) == 1 then
				if nameflg == 2 then
					if math.random(50) <= 25 then
						char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 9 * 1000)
					else
						char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 1 * 1000)
					end
				else
					char.setInt(pindex, "体力", char.getInt(pindex, "体力") + pettrn * 1000)
				end
				char.complianceParameter(pindex)
				char.setWorkInt(pindex, "离线", 1)
				--char.setChar(pindex, "名字", attpet[id][1])
				petid = char.setCharPet(pnpcindex, pindex)
				if petid > -1 then
					char.setInt(pindex, "类型", "帮宠")
					char.setInt(pnpcindex, "战宠", petid)
				end
			end
			
			pindex = char.createPet(ridepet[flg][2], ridepetlv)
			if char.check(pindex) == 1 then
				if nameflg == 2 then
					if math.random(50) <= 25 then
						char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 9 * 1000)
					else
						char.setInt(pindex, "体力", char.getInt(pindex, "体力") + 1 * 1000)
					end
				else
					char.setInt(pindex, "体力", char.getInt(pindex, "体力") + pettrn * 1000)
				end
				char.complianceParameter(pindex)
				char.setWorkInt(pindex, "离线", 1)
				--char.setChar(pindex, "名字", ridepet[flg][2])
				petid = char.setCharPet(pnpcindex, pindex)
				if petid > -1 then
					char.setInt(pindex, "类型", "帮宠")
					char.setInt(pnpcindex, "骑宠", petid)
				end
			end

			char.JoinParty(npcindex, pnpcindex)
			char.ToAroundChar(pnpcindex)
		end

		char.setInt(npcindex, "循环事件时间", 4000)
	  --设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
		char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
	end
	other.setLuaPLayerNum(other.getLuaPLayerNum() + 5)
end



function abcd(charaindex, data)
	local trn = other.getString(data, " ", 1)
	local pettrn = other.getString(data, " ", 2)
	local lv = other.getString(data, " ", 3)
	local nameflg = other.atoi(other.getString(data, " ", 4))
	if nameflg < 0 then
		nameflg = 0
	elseif nameflg > 4 then
		nameflg = 0
	end
	if nameflg == 0 then
		if math.random(100) <= 50 then
			nameflg = 0
		else
			nameflg = 1
		end
	elseif nameflg == 1 then
		nameflg = 3
	elseif nameflg == 3 then
		nameflg = 4
	elseif nameflg == 4 then
		nameflg = 5
	end
	jr(charaindex,trn,pettrn,lv,nameflg,char.getInt(charaindex, "地图号"), char.getInt(charaindex, "坐标X"), char.getInt(charaindex, "坐标Y"), char.getInt(charaindex, "方向"))
end



function data()
	position={{4,{0,-1},{0,-2},{0,-3},{0,-4},{0,-5}}
					 ,{5,{1,1},{2,2},{3,3},{4,4},{5,5}}
					 ,{6,{1,0},{2,0},{3,0},{4,0},{5,0}}
					 ,{7,{1,1},{2,2},{3,3},{4,4},{5,5}}
					 ,{0,{0,1},{0,2},{0,3},{0,4},{0,5}}
					 ,{1,{-1,1},{-2,2},{-3,3},{-4,4},{-5,5}}
					 ,{2,{-1,0},{-2,0},{-3,0},{-4,0},{-5,0}}
					 ,{3,{-1,-1},{-2,-2},{-3,-3},{-4,-4},{-5,-5}}
					 }
	ridepet = {{101016, 307}
						,{101057, 307}
						,{101097, 307}
						,{101106, 307}
						
						,{101015, 309}
						,{101104, 309}
						,{101075, 309}
						,{101047, 309}
						
						,{101006, 310}
						,{101065, 310}
						,{101114, 310}
						,{101036, 310}

						,{101007, 308}
						,{101044, 308}
						,{101055, 308}
						,{101094, 308}						
						
						,{101002, 331}
						
						,{101052, 332}
						,{101030, 332}
						
						,{101060, 333}
						,{101070, 333}
						
						,{101110, 483}

						}
						
	attpet = {54,55,56,54,54,54,54,57,57,57,54,54,54,55,56,57,57,57,57,57,63,75,194,325,320,321,321,321,321,321,346,347,75,75,75,348,349,352,350,350,350,350,352,352,352,347,347,347,347,372,341,4,42,42,44,45,32,33,325,351}
	luaplayid = {346,347,348,349,350,351,352,353,54,55,56,57,28,29,30,31,307,308,309,310}
	
	playerno = {{"1","2","3","4","5"},
				{"1","2","3","4","5"},
			    {"1","2","3","4","5"},
				{"①","②","③","④","⑤"},
				{"①","②","③","④","⑤"},
				{"⒈","⒉","⒊","⒋","⒌"},
				{"Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"},
				{"Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"},
				{"a","b","c","d","e"},
				{"A","B","C","D","E"},
				{"⑴","⑵","⑶","⑷","⑸"}}
	playername = {"天冷致病","天冷致病","爱你好深","爱你好真","时光无晴","谎颜无心","夏日の伤","秋末の美","亡海溺蓝","单旅寂人","简简单单","弃者不留","不良少年","生老病死","心碎一地",
				  "‘ 为她毁城","禽兽不如","劳资不给二情","回村的诱惑","※曾经恋人","萌货你好","勃大茎深","孤久溺霾","空手劈榴莲","一曲独奏ヽ","拼未来i","爷へ缺爱","不良少年","伤己及人",
				  "触及底线","放荡不急","萌面超人","归于平淡","温润如玉","何患无妻","甲乙丙丁","偏执怪人","无妻徒刑","难拥友","亡校之生","石榴裙下装bi","凤凰重生","再次前往","效仿、孤单",
				  "凉心骚年","半醉半醒","成王败寇","玩命的温柔","凉心ミ少年","奇葩骚年","造梦先生丶","△本末倒置▽","痴心患者。","且行且珍惜","囚鸟不知海","找不到方向","想冒险地飞","暖身不暖心",
				  "久撸不射","私奔到月球","往回忆里躲","白衣无言殇","虚度的年华","孤寂中消亡","走心别走嘴","游戏是我命i","褪色的诺言丶","屌丝最快乐","你把我灌醉","吻得太逼真","红颜红过她",
				  "蹦嚓蹦擦擦","萌妞优酸乳","执迷离°","违心话太多丶","小爷求来电。","朕封你为皇后","你爹临死前","一个人的菊花","奥奥奥特曼","丅一站、守候","霸气不露犯贱","曲终人未散",
				  "Tiny","Alone","wanan","BOOM","Kellen","Believe","Dream丶","Melony","Dreams▼","Cry︶寂寞","Haert","染血Heart","Sunshine","Lemon青柠","Superme","迷失lost","SupermAn",
				  "Ionelyの殇","Smile丶凉城","Initia","Moment","Fantastic","Superman","Review","Armani","Traveler过客","亡魂复苏","゜Rhythm","Promise丶陌","Pride","Grieved丶","Britney",
				  "Lonesome","Pursue丶","genius","Promise","Juvenile、","TroubleMaker","Detained","Monologue","Edinburgh°","Eleanor丶","Cowardice。","Meditation丶","Passerby","Proven▼",
				  "卖萌不是罪","Emyorii丶","爆破男","破阵子","飙车E族","夜丨木槿","亡者为胜","【妖王】","╰血舞゜","瑶冰魄。","佣兵一夏","烽火战国か","王者、巅峰","天使の眼泪","狂飙的蜗牛",
				  "极炫ャ罪恶","〖夜神鈅〗","反恐、精英","凡尘陌颜々","☆冷※无情★","夺掵書珄","爵士少年","Strong","★HOLER╮","Mrsandaman","寡人无疾","孤独酒香","航母会飞","流苏如画",
				  "记忆尘封","孤冢清风","孤君独战","醉寻新欢","酒醒天寒","久伴别酒伴","一寸离人憔","醉酒饮天下","倦了轻狂少年","十秒多重性格","夜已暗寒风起","国际美男つ","帅得好烦躁",
				  "万能男神经","惊、天地无波","谁伴我闯荡丶","胡逼扯扯的","知己一人足。","一炮到天明","夜微凉","东哥引领社会","Dath","HulkGuNs","dream°","incomplete","Nefertari","mIsS",
				  "Emotiona°","Exaggerate","unqler〃","香烟羙酒","stranger","Vanish、","maTahari","Queen","killing","pompous","Apologize","Timeless","madness","Return。","Ｅmpress",
				  "丶厌世","Superficial","Edinburgh","Stranger、","流年碎","撸神","重炮","资深情兽","娘的小火柴","九级车震","板砖猛抽脸","为欲而生ノ","半枝烟飘香","只对你丶骚","炽热旳缠绵",
				  "手不毒人不服","转身、遇见鬼","死八开切、","呆到自然萌","很有粪量的人","直到舒服为止","坟场蹦迪","牛魔王等红杏","迩妈好吗","猪是的念来过倒","一朵死゜亡花","入殓师","日后再说",
				  "、奢侈闆","九夏光年","赠我空欢","积木城池","小雏菊、","Hasana","Canty茶妞","Fog","ONLY、me","Hero丶卡门","Fate轮回","Janice王者","Akoasm【幻听】","Juliet"}
end



function main()
	data()
	magic.addLUAListFunction("abcd", "abcd", "", 3, "测试专用命令")
end

