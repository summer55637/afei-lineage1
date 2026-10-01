function Loop(meindex)
	if char.getWorkInt(meindex, "组队") == 0 then
		char.DischargeParty(meindex, 1)
		npc.DelNpc(meindex)
	else
		local partyindex = char.getWorkInt(meindex,"队员1")
		if char.Finditem(partyindex,22078) > 0 then
			if char.getInt(partyindex,"等级") > char.getInt(meindex,"等级") then
				local levelup = char.getInt(partyindex,"等级") - char.getInt(meindex,"等级")
				for i=1,levelup do
					char.PetLevelUp(meindex)
				end
			end
		elseif char.getInt(partyindex,"等级") >= 121 or char.getInt(partyindex,"转数") > 0 then
			char.DischargeParty(meindex, 1)
			npc.DelNpc(meindex)
		else
			if char.getInt(partyindex,"等级") > char.getInt(meindex,"等级") then
				local levelup = char.getInt(partyindex,"等级") - char.getInt(meindex,"等级")
				for i=1,levelup do
					char.PetLevelUp(meindex)
				end
			end
		end
	end
end

--建立函数Npc_test_Create()
function Create(index, fl, x, y, lv)
	--第一个假人。。。。
	metamo = 101000 + math.random(0, 11) * 10 + math.random(0, 7)

	npcindex1 = npc.CreateSpecialNpc("金牌陪练", metamo, fl, x, y, 0, 352, lv)
	
	char.setFlg(npcindex1, "组队", 1)
	char.setWorkInt(npcindex1, "离线", 1)
	char.setInt(npcindex1, "等级", lv)
	char.copyChar(index, npcindex1)
	char.setInt(npcindex1, "体力",char.getInt(npcindex1, "体力") + math.random(1000, 2000))
	char.setInt(npcindex1, "腕力",char.getInt(npcindex1, "腕力") + math.random(1000, 2000))
	if fl == 10001 then
		char.setInt(npcindex1, "腕力",char.getInt(npcindex1, "腕力") + math.random(5000, 6000))
	end
	char.setInt(npcindex1, "耐力",char.getInt(npcindex1, "耐力") + math.random(4000, 5000))
	char.setInt(npcindex1,"地",100)
	char.setInt(npcindex1,"水",0)
	char.setInt(npcindex1,"火",0)
	char.setInt(npcindex1,"风",0)
	char.complianceParameter(npcindex1)
	char.setInt(npcindex1, "HP", char.getWorkInt(npcindex1, "最大HP"))
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
				char.setInt(pindex, "体力",char.getInt(pindex, "体力") + math.random(1000, 2000))
				if fl == 10001 then
					char.setInt(pindex, "腕力",char.getInt(pindex, "腕力") + math.random(5000, 6000))
				end
				char.setInt(pindex, "腕力",char.getInt(pindex, "腕力") + math.random(1000, 2000))
				char.setInt(pindex, "耐力",char.getInt(pindex, "耐力") + math.random(4000, 5000))
				char.setInt(pindex,"地",100)
				char.setInt(pindex,"水",0)
				char.setInt(pindex,"火",0)
				char.setInt(pindex,"风",0)
				char.complianceParameter(pindex)
				char.setInt(pindex, "HP", char.getWorkInt(pindex, "最大HP"))
			end
		end
	end

	petindex = char.getCharPet(index, char.getInt(index, "骑宠"))
	if char.check(petindex) == 1 then
		pindex = char.createPet(310, 1)
		if char.check(pindex) == 1 then
			petid = char.setCharPet(npcindex1, pindex)
			if petid > -1 then
				char.setChar(pindex, "名字", "陪练专用骑宠")
				char.setInt(pindex, "类型", "帮宠")
				char.setInt(npcindex1, "骑宠", petid)
				char.copyChar(petindex, pindex)
				char.setInt(pindex, "体力",char.getInt(pindex, "体力") + math.random(1000, 2000))
				char.setInt(pindex, "腕力",char.getInt(pindex, "腕力") + math.random(1000, 2000))
				if fl == 10001 then
					char.setInt(pindex, "腕力",char.getInt(pindex, "腕力") + math.random(5000, 6000))
				end
				char.setInt(pindex, "耐力",char.getInt(pindex, "耐力") + math.random(4000, 5000))
				char.setInt(pindex,"地",100)
				char.setInt(pindex,"水",0)
				char.setInt(pindex,"火",0)
				char.setInt(pindex,"风",0)
				char.complianceParameter(pindex)
				char.setInt(pindex, "HP", char.getWorkInt(pindex, "最大HP"))
			end
		end
	else
		char.setInt(npcindex1, "骑宠", -1)
	end


	char.setInt(npcindex1, "循环事件时间", 10000)
	char.setFunctionPointer(npcindex1, "循环事件", "Loop", "")
	char.ToAroundChar(npcindex1)


	return npcindex1
end

function Accompany(charaindex)
	if config.getGameservername() == "娱乐互动线" then
		char.newMessageToCli(charaindex,-1,"该线路无法使用陪练","白色")
		return 0
	end
	--[[if char.getInt(charaindex, "地图号") ~= 1000 and char.getInt(charaindex, "地图号") ~= 2000 and char.getInt(charaindex, "地图号") ~= 3000 and char.getInt(charaindex, "地图号") ~= 4000 and char.getInt(charaindex, "地图号") ~= 5510 and char.getInt(charaindex, "地图号") ~= 500 then
		char.TalkToCli(charaindex, -1, "只能在［" .. map.getFloorName(2000) .. "］、［" .. map.getFloorName(5510) .. "］、［" .. map.getFloorName(500) .. "］或上呼唤金牌陪练哦", "随机色")
		return 0
	end]]
	if char.getWorkInt(charaindex,"组队") == 2 then
		char.newMessageToCli(charaindex, -1, "队员不允许使用陪练系统！", "随机色")
		return 0
	end
	pnum = 0
	for i = 1, 5 do
		pindex = char.getWorkInt(charaindex, "队员" .. i)
		if char.check(pindex) == 0 then
			break
		end
		pnum = pnum + 1
	end
	--if config.getGameservername() == "石器时代1线" then
		if pnum < 3 then
			npcindex = Create(charaindex, char.getInt(charaindex, "地图号"), char.getInt(charaindex, "坐标X"), char.getInt(charaindex, "坐标Y"), math.max(char.getInt(charaindex, "等级"), 120))
			if char.check(npcindex) == 0 then
				return 0
			end
			char.JoinParty(charaindex,npcindex)
			return 0
		else
			char.newMessageToCli(charaindex, -1, "只能招2个金牌陪练帮你哦", "随机色")
			return 0
		end
	--end
	if pnum < 4 then
		npcindex = Create(charaindex, char.getInt(charaindex, "地图号"), char.getInt(charaindex, "坐标X"), char.getInt(charaindex, "坐标Y"), math.max(char.getInt(charaindex, "等级"), 120))
		if char.check(npcindex) == 0 then
			return 0
		end
		char.JoinParty(charaindex,npcindex)
	else
		char.newMessageToCli(charaindex, -1, "你的队伍足够人数练级了,无需金牌陪练帮你咯", "随机色")
	end
	return 0
end

function accompany(itemindex, charaindex, toindex, haveitemindex)
	if item.getInt(itemindex,"序号") == 22078 then
		if item.getChar(itemindex,"字段") == "" then
			local endtime = os.time() +259200
			item.setChar(itemindex,"字段", endtime)
			item.setChar(itemindex,"说明","金牌陪练将于"..os.date("%m",endtime).."月"..os.date("%d",endtime).."日"..os.date("%H",endtime).."时"..os.date("%M",endtime).."分到期")
			item.UpdataHaveItemOne(charaindex,haveitemindex)
		elseif item.getChar(itemindex,"字段")*1 < os.time() then
			char.DelItem(charaindex,haveitemindex)
			char.newMessageToCli(charaindex, -1, "金牌陪练已到期", 4)
			return
		end
	elseif char.getInt(charaindex,"等级") >= 121 or char.getInt(charaindex,"转数") > 0 then
		char.DelItem(charaindex,haveitemindex)
		char.newMessageToCli(charaindex, -1, "等级已到达121级", 4)
		return
	end
	Accompany(charaindex)
end

function data()
	offlinetime = 36000
end
function main()
	data()
	item.addLUAListFunction( "ITEM_ACCOMPANY", "accompany", "")
end
