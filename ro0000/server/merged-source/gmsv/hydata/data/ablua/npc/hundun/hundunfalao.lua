function BattleOver(meindex, battleindex, iswin)
	for i=0, 4 do
		charaindex = battle.getCharOne(battleindex, i, 0)
		if char.check(charaindex) == 1 then
			if iswin == 1 then
				--char.DischargeParty(charaindex, 1)
				--char.WarpToSpecificPoint(charaindex, 12102,6,3)
				--npc.DelItem(charaindex,"23603")
				npc.AddItem(charaindex,"23608*1")
				char.TalkToCli(charaindex, meindex, "人类，品尝我的愤怒吧！！", "随机色")
				pktime = other.time() + 7200
			end
		end
	end
	battleing = 0
end


--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if npc.Free(meindex, talkerindex, "ENDEV=222") == 1 then
			token = "你真的战胜了我，这不可能，这不可能。"
			lssproto.windows(talkerindex, "对话框", 8, 0, -1, token)
			return
		end
		if npc.Free(meindex, talkerindex, "NOWEV=222") ~= 1 then
			token = "你是谁？干嘛打扰我睡午觉！"
			lssproto.windows(talkerindex, "对话框", 8, 0, -1, token)
			return
		end
		
		if npc.Free(meindex, talkerindex, "ITEM=23605") ~= 1 then
			token = "你身上没有元素搜集书的味道，我就不杀你了！"
			lssproto.windows(talkerindex, "对话框", 8, 0, -1, token)
			return
		end
		
		if battleing == 1 then
			token = "别着急送死，一个一个来！"
			lssproto.windows(talkerindex, "对话框", 8, 0, -1, token)
			return
		end
		
		if pktime > other.time() then
			token = "我还在重新凝聚，还需" .. pktime - other.time() .. "秒才能恢复力量，等着品尝我的怒火吧！"
			lssproto.windows(talkerindex, "对话框", 8, 0, -1, token)
			return
		end
		
		token = "我是混沌火灵，不是人类可以战胜的！"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 1 then
			if select == 1 or select == 4 then
				local TM_TeamNum = 0
				if char.getWorkInt(talkerindex, "组队") ~= 0 then
					local TempIndex = {-1,-1,-1,-1,-1}
					for i=1,5 do
						TempIndex[i] = char.getWorkInt(talkerindex, "队员"..i)
						if char.check(TempIndex[i]) == 1 then
							TM_TeamNum = TM_TeamNum+1
						end
					end
				else
					TM_TeamNum = 1
				end
				local MonsterID = {4522,4523,4524,4525,4526,4523,4524,4525,4526,4526}
				local MonsterLV = {160,155,155,155,155,150,150,150,150,150}
				if TM_TeamNum == 1 then
					MonsterID = {4522,4523,-1,-1,-1,-1,-1,-1,-1,-1}
					MonsterLV = {160,155,-1,-1,-1,-1,-1,-1,-1,-1}
				elseif 	TM_TeamNum == 2 then
					if char.getWorkChar(talkerindex,"MAC") == char.getWorkChar(char.getWorkInt(talkerindex, "队员2"),"MAC") then
						MonsterID = {4522,4523,4524,4525,4526,-1,-1,-1,-1,-1}
						MonsterLV = {160,155,155,155,155,-1,-1,-1,-1,-1}
					else
						MonsterID = {4522,4523,4524,4525,-1,-1,-1,-1,-1,-1}
						MonsterLV = {160,155,155,155,-1,-1,-1,-1,-1,-1}
					end
				elseif 	TM_TeamNum == 3 then
					MonsterID = {4522,4523,4524,4525,4526,4523,-1,-1,-1,-1}
					MonsterLV = {160,155,155,155,155,150,-1,-1,-1,-1}
				elseif 	TM_TeamNum == 4 then
					MonsterID = {4522,4523,4524,4525,4526,4523,4524,4525,-1,-1}
					MonsterLV = {160,155,155,155,155,150,150,150,-1,-1}
				end
				local LvStr = ""
				local IdStr = ""
				for i=1,10 do
					if i < 10 then
						LvStr = LvStr .. MonsterLV[i] .. ","
						IdStr = IdStr .. MonsterID[i] .. ","
					else
						LvStr = LvStr .. MonsterLV[i]
						IdStr = IdStr .. MonsterID[i]
					end
				end
				
				battleindex = battle.CreateVsEnemyLv(talkerindex, meindex, IdStr, LvStr)
				char.TalkToCli(talkerindex, meindex, "找死的就来吧...", "随机色")
				battleing = 1
				
				TempIndex = battle.getCharOne(battleindex, 0, 1)
				if char.check(TempIndex) == 1 then
					TypeOne = math.random(1,4)
					TypeTwo = math.random(1,4)
					Type = {0,0,0,0}
					if TypeOne+2 == TypeTwo or TypeOne-2 == TypeTwo then
						if math.random(1,2) == 1 then
							TypeTwo = TypeOne+1
						else
							TypeTwo = TypeOne-1
						end
						if TypeTwo == 0 then
							TypeTwo = 4
						elseif TypeTwo == 5 then
							TypeTwo = 1
						end
					end
					if TypeOne == TypeTwo then
						Type[TypeOne] = 100									
					else
						Type[TypeOne] = math.random(1,2) * 10
						Type[TypeTwo] = 100 - Type[TypeOne]
					end
					char.setInt(TempIndex,"地",Type[1])
					char.setInt(TempIndex,"水",Type[2])
					char.setInt(TempIndex,"火",Type[3])
					char.setInt(TempIndex,"风",Type[4])
				end
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir, flg, lv)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local index = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(index, "对话事件", "Talked", "")
	char.setFunctionPointer(index, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(index, "战后事件", "BattleOver", "")
	pktime = other.time() + 7200
end


function data()
	
end

function main()
	battleing = 0
	--Create("混沌火灵", 105009, 12101, 44, 18, 6, 0, 140)
	data()
end