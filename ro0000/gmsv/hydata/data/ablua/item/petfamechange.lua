function Loop(meindex)
	if char.getInt(meindex, "原图像号") == char.getInt(meindex, "图像号") then
		char.setInt(meindex, "图像号", 100608)
		char.ToAroundChar(meindex)
		char.setInt(meindex, "循环事件时间", 520)
	else
		char.setInt(meindex, "图像号", char.getInt(meindex, "原图像号"))
		char.ToAroundChar(meindex)
		char.setInt(meindex, "循环事件时间", 0)
		char.setWorkInt(meindex, "捡起模式", 1)
		char.delFunctionPointer(meindex, "循环事件")
		char.TalkToRound(meindex, "亲爱的主人，我已经得到重生了，捡回我吧！", "随机色")
	end
end

function petfamechange(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(charaindex,"安全锁") > 0 then
		if char.getInt(charaindex,"安全锁") == 1 then
			token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
		elseif char.getInt(charaindex,"安全锁") == 2 then
			token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		else
			token = "由于您的密码过于简单，并且异地登录。\n例如：密码非常简单或者全包含于账号。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		end
		lssproto.windows(charaindex, "输入框", "确定|取消", "安全锁", -1, token)
		return
	end
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(charaindex, "骑宠") == i then
				char.TalkToCli(charaindex, -1, "[错误提示]骑乘中的宠物无法回炉!", "随机色")
				return
			end
			local array = char.getInt(toindex, "宠ID")
			for j,v in ipairs(petchangelist) do
				if v[1] == array then
					token = "　　　　   　 「 原始守卫战自助回炉系统 」\n\n请问您是对这只["..char.getChar(toindex, "名字").."]不满意么？\n回炉系统可以帮您把它恢复到1级初始的状态\n当然，想回炉这只宠物需要交纳["..v[2].."]声望。\n\n   确认请按[确定]        退出请按[取消]"
					lssproto.windows(charaindex, "对话框", 12, i, char.getWorkInt( npcindex, "对象"), token)
					return
				end
			end
			char.TalkToCli(charaindex, -1, "[错误提示]：您的["..char.getChar(toindex, "名字").."]不能进行回炉，请爱护它哦！", "随机色")
			return
		end
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno < 0 or seqno > 4 then
		return
	end
	if select == 1 or select == 4 then
		local petindex = char.getCharPet(talkerindex, seqno)
		if char.getInt(talkerindex, "骑宠") == seqno then
			char.TalkToCli(talkerindex, -1, "[错误提示]骑乘中的宠物无法回炉，请下骑后再试。", "随机色")
			return
		end
		local array = char.getInt(petindex, "宠ID")
		for j,v in ipairs(petchangelist) do
			if v[1] == array then
				if char.getInt(talkerindex,"声望") >= v[2] * 100 then
					local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
					if tempno > -1 then
						if char.getInt(petindex, "进化") == 9 then
							char.setInt(petindex, "地", enemytemp.getInt(tempno, "地"))
							char.setInt(petindex, "水", enemytemp.getInt(tempno, "水"))
							char.setInt(petindex, "火", enemytemp.getInt(tempno, "火"))
							char.setInt(petindex, "风", enemytemp.getInt(tempno, "风"))
							char.setInt(petindex, "进化",0)
						end
						local abi = {0, 0, 0, 0}
						local vital = enemytemp.getInt(tempno, "体力") + math.random(0, 2)
						local str = enemytemp.getInt(tempno, "腕力") + math.random(0, 2)
						local tgh = enemytemp.getInt(tempno, "耐力") + math.random(0, 2)
						local dex = enemytemp.getInt(tempno, "速度") + math.random(0, 2)
						if math.random(4) == 1 then 
							vital = vital - 1
						end
						if math.random(5) == 1 then 
							str = str - 1
						end
						if math.random(4) == 1 then 
							tgh = tgh - 1
						end
						if math.random(4) == 1 then 
							dex = dex - 1
						end
				
						initnum = enemytemp.getInt(tempno, "初始值")
						ability = {0, 0, 0, 0}
									
						for i=1, 10 do
							rnd = math.random(1,4)
							ability[rnd] = ability[rnd] + 1
						end
				
						char.setInt(petindex, "能力值", char.getLiftTo8(vital, 1) + char.getLiftTo8(str, 2) + char.getLiftTo8(tgh, 3) + char.getLiftTo8(dex, 4))

						char.setInt(petindex, "体力", (vital + ability[1]) * initnum)
						char.setInt(petindex, "腕力", (str + ability[2]) * initnum)
						char.setInt(petindex, "耐力", (tgh + ability[3]) * initnum)
						char.setInt(petindex, "速度", (dex + ability[4]) * initnum)

						char.setInt(petindex, "等级", 1)
						char.setInt(petindex, "经验", 0)

						char.complianceParameter(petindex)

						char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))

						char.setInt(petindex, "等级", 1)
						char.setInt(petindex, "经验", 0)
						char.setInt(petindex, "转数", 0)
						char.setInt(petindex, "提升值", 0)
						char.setChar(petindex, "称号", "")

						char.complianceParameter(petindex)

						char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))

						char.dropPetFollow(talkerindex, seqno)
						char.setWorkInt(petindex, "捡起模式", 3)
						char.setFunctionPointer(petindex, "循环事件", "Loop", "")
						char.setInt(petindex, "循环事件时间", 1000)
						char.delFunctionPointer(petindex, "对话事件")
						char.delFunctionPointer(petindex, "窗口事件")
						delnum = npc.DelItemNum(talkerindex, "20836,1")
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望")-v[2]*100)
						char.TalkToCli(talkerindex, -1, "[温馨提示]：您的["..char.getChar(petindex,"名字").."]已回炉成功，回炉资费 "..v[2].." 金币已扣除，祝您好运。", "随机色")
						--char.charSaveFromConnect(talkerindex)
						char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
						return
					end
				else
					char.TalkToCli(talkerindex, -1, "[错误提示]：您的声望不足，无法回炉["..v[2].."]，再接再厉哦！", "随机色")
					return
				end
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
	petchangelist={{901,8000}--年兽
					,{902,8000}--年兽
					,{903,8000}--年兽
					,{904,8000}--年兽
					,{3001,10000}--2D人龙
					,{3002,10000}--2D人龙
					,{3003,10000}--2D人龙
					,{3004,10000}--2D人龙
					,{3005,10000}--2D人龙
					,{755,3000}--杨格斯
					,{3006,10000}--2D老虎
					,{3007,10000}--2D老虎
					,{3008,10000}--2D老虎
					,{3009,10000}--2D老虎
					,{3025,10000}--2D威威
					,{3026,10000}--2D威威
					,{3027,10000}--2D威威
					,{3028,10000}--2D威威
					,{3018,3500}--兔子
					,{3019,3500}--兔子
					,{3021,3500}--兔子
					,{3010,2000}--乌龟
					,{3011,2000}--乌龟
					,{3012,2000}--乌龟
					,{3013,2000}--乌龟
					,{191,30}--老虎
					,{192,30}--老虎
					,{193,30}--老虎
					,{194,1000}--金虎
					,{291,30}--小鸡
					,{292,30}--小鸡
					,{293,30}--小鸡
					,{294,30}--小鸡
					,{301,30}--绿暴
					,{302,300}--左迪洛斯
					,{303,300}--巴朵兰恩
					,{304,1000}--机暴
					,{251,30}--布洛多斯
					,{252,30}--布林帖斯
					,{253,30}--布拉奇多斯
					,{254,500}--斯天多斯
					,{255,30}--邦恩多斯
					,{271,30}--帖拉格恩
					,{272,30}--洛卡伦恩
					,{273,30}--加宝格恩
					,{274,30}--朵拉比斯
					,{275,30}--朵拉比斯
					,{221,30}--克邦凯斯
					,{222,30}--加克拉
					,{223,30}--加格
					,{224,30}--邦恩吉
					,{231,30}--奇卡洛斯
					,{232,30}--奇娜
					,{233,30}--奇卡宝斯
					,{234,30}--卡卡金宝
					,{791,30}--里昂蛙
					,{91,30}--利则诺顿
					,{92,30}--扬奇洛斯
					,{93,100}--邦浦洛斯
					,{94,30}--邦奇诺
					,{95,200}--布鲁顿
					,{141,30}--格尔顿
					,{142,30}--奇拉顿
					,{143,30}--齐尔格尔顿
					,{144,30}--格尔格
					,{31,30}--乌宝宝
					,{32,30}--威威
					,{33,30}--乌卡鲁
					,{34,30}--威伯
					,{261,30}--玛恩摩
					,{262,30}--恩摩摩
					,{263,30}--玛摩那斯
					,{264,30}--玛恩摩洛斯
					,{61,30}--阿哥亚
					,{62,30}--尼可斯
					,{63,30}--特洛昆
					,{64,30}--达克尔
					,{65,30}--柏克尔
					}
end


function main()
	Create("回炉声望大师", 101156, 777, 15, 14, 4)
	data()
	item.addLUAListFunction( "ITEM_PETFAMECHANGE", "petfamechange", "")
end