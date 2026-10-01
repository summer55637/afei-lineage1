function FreeBattleDie( battleindex, charaindex, no)
	if char.getInt(charaindex,"图像号") == 120113 then
		local array = enemytemp.getEnemyArrayFromId(4550)
		if array == -1 then
			return
		end
		local level = enemytemp.enemygetInt(array,"最大等级")
		local newindex = enemytemp.createEnemy(array,level)
		if newindex == -1 then
			return
		end
		char.setWorkInt(newindex,"复活动画",120115)
		if no > 10 then
			char.setWorkInt(newindex,"战斗边",1)
		else
			char.setWorkInt(newindex,"战斗边",0)
		end
		char.setWorkInt(newindex,"战斗状态标识",char.getWorkInt(charaindex,"战斗状态标识"))
		battle.setBattleEntryCharaindex(battleindex,char.getWorkInt(newindex,"战斗边"),no,newindex)
		battle.ExitOne(charaindex,battleindex)
	end
end

function data()
	
end

function main()
	data()
end
