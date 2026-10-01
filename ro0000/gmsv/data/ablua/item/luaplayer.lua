--NPC循环事件(NPC索引)
function Loop(meindex)
	if char.getWorkInt(meindex, "战斗") == 0 then
    --战斗宠物数组，设置战斗的宠物ID,最大10只
    local enemytable = {0, 0, 0, 0, 0, 0, 0, 0, 0 }
    --建立一场战斗(玩家索引，自己引索，战斗宠物数组)返回一个战斗索引
    battleindex = battle.CreateVsEnemy(meindex, -1, enemytable)
  end
end


--建立函数Npc_test_Create()
function Create(fl, x, y, lv)
	--第一个假人。。。。
	--CreateSpecialNpc(人物名, 图像号, 地图号, X, Y, 方向, 宠编号)
	npcindex1 = npc.CreateSpecialNpc("三陪小美眉", 101095, fl, x, y, 0, 1610, 140)

	char.setFlg(npcindex1, "组队", 1)
	char.setInt(npcindex1, "转数", 0)

	char.setInt(npcindex1, "循环事件时间", 1000)
	char.setWorkInt(npcindex1, "离线", 1)
	char.setInt(npcindex1, "等级", 140)
	char.setInt(npcindex1, "循环事件时间", 1000)
	char.setInt(npcindex1, "战宠", -1);
	char.Additem(npcindex1,18557)
  --第二个假人。。。。
	npcindex2 = npc.CreateSpecialNpc("三陪小美眉", 101095, fl, x, y+1, 0, 1610, 140)
	char.setWorkInt(npcindex2, "离线", 1);
	char.setFlg(npcindex2, "组队", 0)
	char.setInt(npcindex2, "转数", 0)
  char.setInt(npcindex2, "等级", 140)
	pindex = char.createPet(307, 94)

	char.setInt(npcindex2, "战宠", -1)
	--第二个假人加入第一个人队伍
	char.JoinParty(npcindex1, npcindex2)

	char.ToAroundChar(npcindex1)
	char.ToAroundChar(npcindex2)
	
	char.setFunctionPointer(npcindex1, "循环事件", "Loop", "")

	return npcindex1
end

function playerlua(itemindex, charaindex, toindex, haveitemindex)

npcindex = Create(char.getInt(charaindex, "地图号"), char.getInt(charaindex, "坐标X"), char.getInt(charaindex, "坐标Y"), char.getInt(charaindex, "等级") - 1)
end

function main()
	item.addLUAListFunction( "ITEM_PLAYERLUA", "playerlua", "")
end
