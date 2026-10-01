function petablility(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			LevelUpPoint = char.getInt(toindex, "能力值")
			
			vital = char.getRightTo8(LevelUpPoint, 1)
			str = char.getRightTo8(LevelUpPoint, 2)
			tgh = char.getRightTo8(LevelUpPoint, 3)
			dex = char.getRightTo8(LevelUpPoint, 4)
			
	    sum = vital + str + tgh + dex
	
	    petrank = char.getInt(toindex, "成长区间") + 1
			if petrank < 1 or petrank > 6 then
				petrank = 1;
			end
	
			hp = 0
			atk = 0
			def = 0
			quick = 0
			for j=1, 140 do
				ability = {0, 0, 0, 0}
				for j=1, 10 do
					rnd = math.random(4)
					ability[rnd] = ability[rnd] + 1
				end
				
				ivital = vital
				istr = str
				itgh = tgh
				idex = dex
	
				ivital = (ivital * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[1] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100
				istr = (istr * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[2] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100
				itgh = (itgh * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[3] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100
				idex = (idex * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[4] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100
		
			  ihp = (ivital * 4 + istr + itgh + idex) * 0.01
			  iatk = (istr * 0.01 + itgh * 0.001 + ivital * 0.001 + idex * 0.0005)
			  idef = (itgh* 0.01 + istr * 0.001 + ivital * 0.001 + idex * 0.0005)
			  iquick = idex * 0.01
			  
			  hp = hp + ihp
			  atk = atk + iatk
			  def = def + idef
			  quick = quick + iquick
			end
			
			hp = hp / 140
			atk = atk / 140
			def = def / 140
			quick = quick / 140

			token = char.getChar(toindex, "名字") .. " Lv" .. char.getInt(toindex, "等级") .. " 的四围成长值如下：\n"
						.. "\n　体力：" .. hp 
						.. "\n　腕力：" .. atk 
						.. "\n　耐力：" .. def 
						.. "\n　速度：" .. quick 
						.. "\n　总成长：".. atk + def + quick 
						.. "\nPS：以上只属参考，稍有偏差,请按实际为准"
			lssproto.windows(charaindex, "对话框", "确定", -1, -1, token)
			char.DelItem(charaindex, haveitemindex)
			return
		end
	end
	
	char.TalkToCli(charaindex, -1, "该物品只能给宠物使用！", "随机色")
end
function data()

end
function main()
	item.addLUAListFunction( "ITEM_PETABLILITY", "petablility", "")
  RankRandTbl = {
					{ 450, 500 },
					{ 470, 520 },
					{ 490, 540 },
					{ 510, 560 },
					{ 530, 580 },
					{ 550, 600 },
				}
end
