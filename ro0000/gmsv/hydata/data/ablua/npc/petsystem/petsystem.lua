function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 1, 5 do
		if char.getCharPet(charaindex, i - 1) == -1 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = char.getChar(meindex, "名字") .. "|选择您要兑换的宠物|"
		local petnum = #petlist
		token = token .. petnum
		for i=1,petnum do
			token = token .. "|" .. petlist[i][1]
		end
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > #petlist then
				return
			end
			token = char.getChar(meindex, "名字") .. "|选择您要兑换的宠物|"
			local petnum = #petlist[num][2]
			token = token .. petnum
			
			for i=1,petnum do
				if petlist[num][2][i][1] == 22000 then
					token = token .. "|" .. item.getSecretNameFromNumber(petlist[num][2][i][1])
				else
					local arry = enemytemp.getEnemyTempArrayFromTempNo( petlist[num][2][i][1])
					local petname = enemytemp.getChar( arry, "名字")
					token = token .. "|" .. petname
				end
			end
			lssproto.windows(talkerindex, "新选择框", 8, num, char.getWorkInt( meindex, "对象"), token)
		elseif seqno >= 1 and seqno <= #petlist then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > #petlist[seqno][2] then
				return
			end
			if petlist[seqno][2][num][1] == 22000 then
				local petname = item.getSecretNameFromNumber(petlist[seqno][2][num][1])
				token = "兑换[" .. petname .. "]需要以下材料\n"
			else
				local arry = enemytemp.getEnemyTempArrayFromTempNo( petlist[seqno][2][num][1])
				local petname = enemytemp.getChar( arry, "名字")
				token = "兑换[" .. petname .. "]需要以下材料\n"
			end
			if petlist[seqno][2][num][2] > -1 then
				local arry2 = enemytemp.getEnemyTempArrayFromTempNo( petlist[seqno][2][num][2])
				local petname2 = enemytemp.getChar( arry2, "名字")
				if petlist[seqno][2][num][1] == 22000 then
					token = token .. "宠物：" .. petname2 .. " 评分需要：1300以上\n"
				else
					token = token .. "宠物：" .. petname2 .. "\n"
				end
			end
			if petlist[seqno][2][num][3] > 0 then
				token = token .. "宠物碎片 * " .. petlist[seqno][2][num][3] .. "\n"
			end
			if petlist[seqno][2][num][6] > 0 then
				token = token .. petlist[seqno][2][num][7] .. "玩偶 * " .. petlist[seqno][2][num][6] .. "\n"
			end
			if petlist[seqno][2][num][1] == 22000 then
				token = token .. "宠物碎片 * 8 \n"
			end
			if petlist[seqno][2][num][4] > 0 then
				token = token .. "声望 * " .. petlist[seqno][2][num][4] .. "\n"
			end
			if petlist[seqno][2][num][5] > 0 then
				token = token .. "活力 * " .. petlist[seqno][2][num][5] .. "\n"
			end
			token = token .. "您确定要兑换吗？"
			lssproto.windows(talkerindex, "对话框", "确定|取消", seqno * 100 + num, char.getWorkInt( meindex, "对象"), token)
		elseif seqno > 100 and seqno < (#petlist + 1) * 100 then
			num = seqno % 100
			seqno = math.floor(seqno/100)
			if seqno == 0 then
				return
			end
			if num < 1 or num > #petlist[seqno][2] then
				return
			end
			if checkEmptPetNum(talkerindex) == 0 then
				char.newMessageToCli(talkerindex, -1, "您的宠物已满", "白色")
				return
			end
			local delpet = -1
			local delitem1 = -1
			local delitem2 = -1
			local delitem3 = -1
			local delitem4 = -1
			if petlist[seqno][2][num][2] > -1 then
				local arry2 = enemytemp.getEnemyTempArrayFromTempNo( petlist[seqno][2][num][2])
				local petname2 = enemytemp.getChar( arry2, "名字")
				for i=1,5 do
					petindex = char.getCharPet(talkerindex,i - 1)
					if char.check(petindex) == 1 then
						if char.getInt(petindex,"宠ID") == petlist[seqno][2][num][2] then
							if math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "修正腕力") + char.getWorkInt(petindex, "修正耐力") + char.getWorkInt(petindex, "修正速度")) >= 1300 then
								delpet = i
								break
							end
						end
					end
				end
			end
			if petlist[seqno][2][num][3] > 0 then
				delitem1 = 0
				if npc.Free(meindex, talkerindex, "ITEM=21113*" .. petlist[seqno][2][num][3]) ~= 1 then
					char.TalkToCli(talkerindex, meindex, "您的宠物碎片不足", "黄色")
					return
				end
				delitem1 = 1
			end
			if petlist[seqno][2][num][4] > 0 then
				delitem2 = 0
				if char.getInt(talkerindex, "声望") < petlist[seqno][2][num][4] * 100 then
					char.TalkToCli(talkerindex, meindex, "您的声望不足", "黄色")
					lssproto.windows(talkerindex, 1038, 0, -1, -1, "3")
					return
				end
				delitem2 = 1
			end
			if petlist[seqno][2][num][5] > 0 then
				delitem3 = 0
				if char.getInt(talkerindex, "活力") < petlist[seqno][2][num][5] then
					char.TalkToCli(talkerindex, meindex, "您的活力不足", "黄色")
					lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
					return
				end
				delitem3 = 1
			end
			
			if petlist[seqno][2][num][6] > 0 then
				delitem4 = 0
				if npc.Free(meindex, talkerindex, "ITEM=29062*" .. petlist[seqno][2][num][6]) ~= 1 then
					char.TalkToCli(talkerindex, meindex, "您的"..petlist[seqno][2][num][7].."玩偶不足", "黄色")
					return
				end
				delitem4 = 1
			end
			
			if petlist[seqno][2][num][1] == 22000 then
				if npc.Free(meindex, talkerindex, "ITEM=21113*8") ~= 1 then
					char.newMessageToCli(talkerindex, -1, "您的宠物碎片不足", "白色")
					return
				end
			end
			
			ret = sasql.query("select * from `petsystem` where `petid`=" .. petlist[seqno][2][num][1])
			if ret ~= 1 then
				return
			end
			local petsystemtype = 0
			local petsystemnum = 1
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				petsystemtype = 1
				petsystemnum = other.atoi(sasql.data(3)) - other.atoi(sasql.data(2))
			end
			if petsystemnum <= 0 then
				char.newMessageToCli(talkerindex, -1, "您要兑换的宠物已换完", "白色")
				return
			end
			if petlist[seqno][2][num][1] == 22000 then
				if delpet > -1 then
					petindex = char.getCharPet(talkerindex,delpet - 1)
					char.newMessageToCli(talkerindex, -1, "交出" .. char.getChar(petindex,"名字"), "白色")
					char.TalkToCli(talkerindex, meindex, "交出" .. char.getChar(petindex,"名字"), "黄色")
					char.DelPet(talkerindex,petindex)
				else
					char.TalkToCli(talkerindex, meindex, "你得宠物不足1300战力或身上没此宠物", "黄色")
					return
				end
			end
			if delitem1 == 1 then
				npc.DelItem(talkerindex,"21113*" .. petlist[seqno][2][num][3])--宠物碎片
				char.newMessageToCli(talkerindex, -1, "交出宠物碎片" .. petlist[seqno][2][num][3] .. "个", "白色")
			end
			
			if delitem2 == 1 then
				char.setInt(talkerindex, "声望", char.getInt(talkerindex, "声望") - petlist[seqno][2][num][4] * 100)--需要2种提示
				char.newMessageToCli(talkerindex, -1, "扣除" .. petlist[seqno][2][num][4] .. "声望", "白色")
				char.TalkToCli(talkerindex, meindex, "扣除".. petlist[seqno][2][num][4] .. "声望", "黄色")
			end
			if delitem3 == 1 then
				char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - petlist[seqno][2][num][5])--需要2种提示
				char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + petlist[seqno][2][num][5] * 100)
				saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
				char.newMessageToCli(talkerindex, -1, "扣除" .. petlist[seqno][2][num][5] .. "活力", "白色")
				char.TalkToCli(talkerindex, meindex, "扣除".. petlist[seqno][2][num][5] .. "活力", "黄色")
			end
			
			if delitem4 == 1 then
				npc.DelItem(talkerindex,"29062*" .. petlist[seqno][2][num][6])--宠物碎片
				char.newMessageToCli(talkerindex, -1, "交出" .. petlist[seqno][2][num][7] .. "玩偶" .. petlist[seqno][2][num][6] .. "个", "白色")
			end
			if petlist[seqno][2][num][1] == 22000 then
				npc.DelItem(talkerindex,"21113*8")--时空碎片
				char.newMessageToCli(talkerindex, -1, "交出" .. petlist[seqno][2][num][7] .. "8个", "白色")
			end
			
			if petlist[seqno][2][num][1] == 22000 then--时空碎片
				char.Additem(talkerindex,petlist[seqno][2][num][1])
				char.newMessageToCli(talkerindex, -1, "获得" .. item.getSecretNameFromNumber(petlist[seqno][2][num][1]), "白色")
				if petsystemtype == 1 then
						sasql.query("update `petsystem` set `num`=`num` + 1 where `petid`=" .. petlist[seqno][2][num][1])
				end
			else
				petindex = char.AddPetTempNo(talkerindex,petlist[seqno][2][num][1],1)
				if char.check(petindex) == 1 then
					char.newMessageToCli(talkerindex, -1, "获得" .. char.getChar(petindex,"名字") .. "一只", "白色")
					if petsystemtype == 1 then
						sasql.query("update `petsystem` set `num`=`num` + 1 where `petid`=" .. petlist[seqno][2][num][1])
					end
				end
			end
			--char.charSaveFromConnect(talkerindex)
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
	petlist = {--长编号，宠物，碎片，声望，活力，特效
				--[[{"人龙系",
				{{91,-1,10,0,0,-1}
				,{92,-1,10,0,0,-1}
				,{93,-1,10,0,0,-1}
				,{94,-1,10,0,0,-1}
				,{95,-1,10,0,0,-1}}}]]
				--{"暴龙系",
				--{{3057,-1,20,6666,0,-1}
				--,{3052,-1,20,6666,0,-1}
				--,{3038,-1,20,6666,0,-1}
				--,{3037,-1,20,6666,0,-1}}
				--}
				--{"马年系",
				--{{901,-1,25,15,5}
				--,{902,-1,25,15,5}
				--,{903,-1,25,15,5}
				--,{904,-1,25,15,5}}
				--},
				--[[,{"狗年系",
				{{3029,-1,33,18,9,-1}
				,{3030,-1,33,18,9,-1}
				,{3031,-1,33,18,9,-1}
				,{3032,-1,33,18,9,-1}}}]]
				--{"圣兽系",
				--{
				--{777,-1,66,25,15,102253}}
				--{3000,-1,66,25,15,102250}}
				--{3033,-1,66,25,15,102250}}
				--{3034,-1,66,25,15,102250}}
				--}
				--[[,{"特殊系",
				{{965,-1,35,20,10,-1}
				,{977,-1,25,15,8,-1}
				,{3048,-1,30,20,3,-1}
				,{3020,-1,88,55,25,102238}}}]]
				{"特殊系",
				{{4540,-1,8,2888,0,10,"机械"},
				{4547,-1,8,2888,0,10,"机械"},
				{3040,-1,28,8888,2000,-1,""},
				{4559,-1,20,6666,1000,-1,"机年"},
				{4560,-1,20,6666,1000,-1,"机年"},
				{4561,-1,20,6666,1000,-1,"机年"},
				{4562,-1,20,6666,1000,-1,"机年"},
				{22000,304,-1,1888,0,-1,"宠物碎片"}}
				},
				--{"新二代系",
				--{{3018,-1,5,2000,1000,-1,""},
				--{3019,-1,5,2000,1000,-1,""},
				--{3020,768,20,4000,4000,-1,""},
				--{3021,-1,5,2000,1000,-1,""},
				--{3126,755,5,1000,1000,-1,""},
				--{766,-1,5,1000,1000,-1,""},
				--{767,-1,5,1000,1000,-1,""},
				--{768,-1,5,1000,1000,-1,""}}	
				
				--},
				--{"魔兽系",
				--{{1047,-1,28,8888,0,-1,""},
				--{985,-1,28,8888,0,-1,""},
				--{986,-1,28,8888,0,-1,""},
				--{1048,-1,28,8888,0,-1,""}}
				--},
				{"三头蛇",
				{{3042,-1,15,6666,1000,-1,""},
				{3043,-1,15,6666,1000,-1,""},
				{3041,-1,15,6666,1000,-1,""},
				{3044,-1,15,6666,1000,-1,""}}
				}
			   }
end

function main()
	data()
	Create("宠物领养", 101153, 2005, 22, 14, 6)
end
