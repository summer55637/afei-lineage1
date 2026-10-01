function LUALoop(meindex)
	if char.getWorkInt(meindex, "组队") == 0 then
		char.DischargeParty(meindex, 1)
  	npc.DelNpc(meindex)
  	other.setLuaPLayerNum(math.max(other.getLuaPLayerNum() - 1, 0))
  end
end

--建立函数Npc_test_Create()
function LUACreate(index, fl, x, y)
	--第一个假人。。。。
	metamo = 101000 + math.random(0, 11) * 10 + math.random(0, 7)

	npcindex1 = npc.CreateSpecialNpc("三陪小人物", metamo, fl, x, y, 0, 352, 1)
	
	char.setFlg(npcindex1, "组队", 1)
	
	char.setWorkInt(npcindex1, "离线", 1)
	char.copyChar(index, npcindex1)
	char.setInt(npcindex1, "转数", char.getInt(index, "转数"))
	
	petindex = char.getCharPet(index, char.getInt(index, "战宠"))
	if char.check(petindex) == 1 then
		pindex = char.createPet(57, 1)
		if char.check(pindex) == 1 then
			char.setWorkInt(pindex, "离线", 1)
			petid = char.setCharPet(npcindex1, pindex)
			if petid > -1 then
				char.setInt(pindex, "类型", "帮宠")
				char.setInt(npcindex1, "战宠", petid)
				char.copyChar(petindex, pindex)
			end
		end
	end

	petindex = char.getCharPet(index, char.getInt(index, "骑宠"))
	if char.check(petindex) == 1 then
		pindex = char.createPet(310, 1)
		if char.check(pindex) == 1 then
			petid = char.setCharPet(npcindex1, pindex)
			if petid > -1 then
				char.setChar(pindex, "名字", "三陪专用骑宠")
				char.setInt(pindex, "类型", "帮宠")
				char.setInt(npcindex1, "骑宠", petid)
				char.copyChar(petindex, pindex)
			end
		end
	end


	char.setInt(npcindex1, "循环事件时间", 60000)
	char.setWorkInt(npcindex1, "NPC临时11", other.time())
	char.setFunctionPointer(npcindex1, "循环事件", "LUALoop", "")
	char.ToAroundChar(npcindex1)


	return npcindex1
end

--NPC循环事件(NPC索引)
function Loop(meindex)
	if char.getWorkInt(meindex, "战斗") == 0 then
    --战斗宠物数组，设置战斗的宠物ID,最大10只
    local enemytable = {0, 0, 0, 0, 0, 0, 0, 0, 0 }
    --建立一场战斗(玩家索引，自己引索，战斗宠物数组)返回一个战斗索引
    battleindex = battle.CreateVsEnemy(meindex, -1, enemytable)
  end
end

function pLoop(meindex)

end

function superoffline(itemindex, charaindex, toindex, haveitemindex)

	if char.getInt(charaindex, "等级") == 1 then
		lv = math.random(10) * 4 + 90
		point = lv * 3
		vi = math.min(math.random(50) + 50, point)
		point = point - vi
		tgh = math.min(math.random(50), point)
		point = point - tgh
		dex = point
		char.setInt(charaindex, "技能点", 0 )
		char.setInt(charaindex, "等级", lv)
		char.setInt(charaindex, "体力", vi * 100)
		char.setInt(charaindex, "腕力", 0)
		char.setInt(charaindex, "耐力", tgh * 100)
		char.setInt(charaindex, "速度", dex * 100)
		char.complianceParameter(charaindex)
		char.sendStatusString(charaindex, "P")
		char.Skillupsend(charaindex)
		
		char.setInt(charaindex, "HP", char.getWorkInt(charaindex, "最大HP"))
		char.setInt(charaindex, "转数", math.random(0, 5))
		char.setInt(charaindex, "声望", math.random(20000) + 10000)
		for i = 0, 4 do
			toindex = char.getCharPet(charaindex, i)
			if char.check(toindex) == 1 then
				if char.getInt(toindex, "等级") == 1 then
					for j = char.getInt(toindex, "等级") + 1, lv do
						char.PetLevelUp(toindex)
					end
		
					char.setInt(toindex, "等级", lv)
					char.complianceParameter(toindex)
		
					char.setInt(toindex, "HP", char.getWorkInt(toindex, "最大HP"))
					char.sendStatusString(charaindex, "K" .. i)
				end
			end
		end

		return
	end
	
		
	if char.getWorkInt(charaindex, "组队") == 0 then
		pnum = 2
		for i = 1, 5 do
			pindex = char.getWorkInt(charaindex, "队员" .. i)
			if char.check(pindex) == 0 then
				break
			end
			pnum = pnum + 1
		end
		for i = pnum, 5 do
			npcindex = LUACreate(charaindex, char.getInt(charaindex, "地图号"), char.getInt(charaindex, "坐标X"), char.getInt(charaindex, "坐标Y"))
			char.JoinParty(charaindex,npcindex)
			other.setLuaPLayerNum(other.getLuaPLayerNum() + 1)
		end
		
		return
	end

	if char.getInt(charaindex, "地图号") ~= 2000 then
		if char.getWorkInt(charaindex, "组队") ~= 2 then
			char.setFunctionPointer(charaindex, "循环事件", "Loop", "")
			char.setInt(charaindex, "循环事件时间", 2000)
		else
			char.setFunctionPointer(charaindex, "循环事件", "pLoop", "")
			char.setInt(charaindex, "循环事件时间", 2000)
		end
	end
	
	char.setWorkInt(charaindex, "登陆时间", other.time())
	char.setWorkInt(charaindex, "离线", 1)

	fd = char.getFd(charaindex)
	net.endOne(fd)
end

function data()
end

function main()
	data()
	item.addLUAListFunction( "ITEM_SUPEROFFLINE", "superoffline", "")
end
