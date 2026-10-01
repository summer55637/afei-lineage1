function FreeBattleJoin(charaindex, battleindex)
	--[[if char.getInt(charaindex,"地图号") == 12222 and char.getInt(charaindex,"类型") == 1 then
		for i=0, 19 do
			local enemyindex = battle.getCharOne(battleindex, i, 1)
			if char.check(enemyindex) == 1 then
				if char.getInt(enemyindex,"宠ID") >= 4501 and char.getInt(enemyindex,"宠ID") <= 4503 then
					if char.getInt(charaindex,"活动积分") < 2 then
						char.TalkToCli(charaindex, -1, "非常遗憾，您的龙域积分少于2，无法挑战世界BOSS[烈焰神龙]。", "随机色")
						char.DischargeParty(charaindex,1)
						return 0
					end
					char.setInt(charaindex,"活动积分",char.getInt(charaindex,"活动积分") - 2)
					char.TalkToCli(charaindex, -1, "由于您挑战世界BOSS[烈焰神龙]，扣除您2点的龙域积分。", "随机色")
					break
				end
			end
		end
	end]]
	return 1
end