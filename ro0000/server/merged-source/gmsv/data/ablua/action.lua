
function FreeAction(charaindex, x, y, actionno)
		
	if actionno == 0 then
		if char.getInt(charaindex, "地图号") == 130 then
			return
		end
		local itemindex = char.getItemIndex(charaindex,2)
		if item.getInt(itemindex, "类型" ) == 4 or item.getInt(itemindex, "类型" ) == 17 or item.getInt(itemindex, "类型" ) == 18 or item.getInt(itemindex, "类型" ) == 19 then
			distance = 5
		else
			distance = 1
		end
		if char.getInt(charaindex, "地图号") == 60502 or char.getInt(charaindex, "地图号") == 60503 then
			if char.getInt(charaindex, "地图号") == 60503 then
				if char.getInt(charaindex,"计时器") < other.time() then
					char.setInt(charaindex,"计时器",other.time())
					char.setInt(charaindex,"计数器",1)
				else
					if char.getInt(charaindex,"计数器") < 2 then
						char.setInt(charaindex,"计数器",char.getInt(charaindex,"计数器") + 1)
					else
						return
					end
				end
			end
			local toindex = map.getCharaindex(charaindex, distance, 51)
			if char.check(toindex) == 1 then
				local hptemp = math.random(playerdamage[1],playerdamage[2])
				local petname = other.getString(char.getChar(toindex, "名字"),"L",1)
				if char.getInt(toindex,"HP") - hptemp > 0 then
					char.setInt(toindex,"HP",char.getInt(toindex,"HP") - hptemp)
					if char.getInt(charaindex, "地图号") == 60502 then
						char.TalkToCli(charaindex, -1, "[捕鱼达人][" .. petname .. "]被您击中头部 扣血[" .. hptemp .. "] 目前血量[" .. char.getInt(toindex,"HP") .. "/" .. char.getWorkInt(toindex,"最大HP") .. "] 击杀此鱼有几率获得" .. fishgold[char.getWorkInt(toindex,"NPC临时1")][1] .. "-" .. fishgold[char.getWorkInt(toindex,"NPC临时1")][2] .. "石币", "9")
					else
						char.TalkToCli(charaindex, -1, "[捕鱼达人][" .. petname .. "]被您击中头部 扣血[" .. hptemp .. "] 目前血量[" .. char.getInt(toindex,"HP") .. "/" .. char.getWorkInt(toindex,"最大HP") .. "] 击杀此鱼获得" .. fishpoint[char.getWorkInt(toindex,"NPC临时1")].. "捕鱼点", "9")
					end
					if math.random(100) <= fanji[char.getWorkInt(toindex,"NPC临时1")] then
						hptemp = math.random(fishdamage[char.getWorkInt(toindex,"NPC临时1")][1],fishdamage[char.getWorkInt(toindex,"NPC临时1")][2])
						if char.getInt(charaindex, "地图号") == 60503 then
							hptemp = hptemp * 2
						end
						char.TalkToCli(charaindex, -1, "[捕鱼达人][" .. petname .. "]对你进行了猛烈反击 扣血[" .. hptemp .. "] 目前你的血量[" .. math.max(char.getInt(charaindex,"HP") - hptemp,0) .. "/" .. char.getWorkInt(charaindex,"最大HP") .. "]", "18")
						hptemp = char.getInt(charaindex,"HP") - hptemp
						if hptemp < 1 then
							hptemp = 1
							if char.getInt(charaindex, "地图号") == 60502 then
								char.WarpToSpecificPoint(charaindex, 60502, 24, 49)
							else
								char.WarpToSpecificPoint(charaindex, 60503, 24, 49)
							end
							char.TalkToCli(charaindex, -1, "[捕鱼达人]您因体力透支被传送到了入口进行恢复。", "20")
						end
						char.setInt(charaindex,"HP",hptemp)
						char.sendStatusString(charaindex,"P")
						char.sendAction(toindex, 0, 0)
					end
				else
					if char.getInt(charaindex, "地图号") == 60502 then
						local getgold = math.random(fishgold[char.getWorkInt(toindex,"NPC临时1")][1],fishgold[char.getWorkInt(toindex,"NPC临时1")][2])
						char.TalkToCli(charaindex, -1, "[捕鱼达人]恭喜您成功击杀 ≡ " .. char.getWorkInt(toindex,"NPC临时1") .. "级鱼类-" .. petname .. " ≡ 获得石币[" .. getgold .. "]", "1")
						char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") + getgold)
						char.Updata(charaindex,"石币")
						if char.getInt(charaindex,"等级") >= 60 then
							other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{charaindex,613,0})
						end
					else
						local getpoint = fishpoint[char.getWorkInt(toindex,"NPC临时1")]
						char.TalkToCli(charaindex, -1, "[捕鱼达人]恭喜您成功击杀 ≡ " .. char.getWorkInt(toindex,"NPC临时1") .. "级鱼类-" .. petname .. " ≡ 获得捕鱼点数[" .. getpoint .. "]", "1")
						local fishparameter = {char.getChar(charaindex,"账号"),getpoint}
						other.CallFunction("fishPaiMing", "data/ablua/npc/fish/fish.lua", fishparameter)
					end
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,6,1})
					local fishflg = char.getWorkInt(toindex,"NPC临时1")
					if fishflg == 1 then
						if math.random(100) <= buzhua[fishflg] then
							local enemyid = {319}
							battle.CreateVsEnemy(charaindex,toindex,enemyid)
							char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(319) .. "]！","随机色")
						end
						if math.random(100) <= daoju[fishflg] then
							local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
							if fishitemindex > -1 then
								char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
							end
						end
					elseif fishflg == 2 then
						if math.random(100) <= buzhua[fishflg] then
							local enemyid = {320}
							battle.CreateVsEnemy(charaindex,toindex,enemyid)
							char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(320) .. "]！","随机色")
						end
						if math.random(100) <= daoju[fishflg] then
							local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
							if fishitemindex > -1 then
								char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
							end
						end
					elseif fishflg == 3 then
						if math.random(100) <= buzhua[fishflg] then
							local enemyid = {321}
							battle.CreateVsEnemy(charaindex,toindex,enemyid)
							char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(321) .. "]！","随机色")
						end
						if math.random(100) <= daoju[fishflg] then
							local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
							if fishitemindex > -1 then
								char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
							end
						end
					elseif fishflg == 4 then
						if math.random(100) <= buzhua[fishflg] then
							local enemyid = {322}
							battle.CreateVsEnemy(charaindex,toindex,enemyid)
							char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(322) .. "]！","随机色")
						end
						if math.random(100) <= daoju[fishflg] then
							local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
							if fishitemindex > -1 then
								char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
							end
						end
					elseif fishflg == 5 then
						if char.getInt(charaindex, "地图号") == 60502 then
							if math.random(100) <= buzhua[fishflg] then
								local enemyid = {321}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(321) .. "]！","随机色")
							end
						else
							if math.random(100) <= buzhua2[fishflg] then
								local enemyid = {1617}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToServer(-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(1617) .. "]！","随机色")
							end
						end
						if math.random(100) <= daoju[fishflg] then
							local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
							if fishitemindex > -1 then
								char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
							end
						end
					elseif fishflg == 6 then
						if char.getInt(charaindex, "地图号") == 60502 then
							if math.random(100) <= buzhua[fishflg] then
								local enemyid = {320}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(320) .. "]！","随机色")
							end
						else
							if math.random(100) <= buzhua2[fishflg] then
								local enemyid = {1618}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToServer(-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(1618) .. "]！","随机色")
							end
						end
						if math.random(100) <= daoju[fishflg] then
							local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
							if fishitemindex > -1 then
								char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
							end
						end
					elseif fishflg == 7 then
						if char.getInt(charaindex, "地图号") == 60502 then
							if math.random(100) <= buzhua[fishflg] then
								local enemyid = {319}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(319) .. "]！","随机色")
							end
						else
							if math.random(100) <= buzhua2[fishflg] then
								local enemyid = {1619}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToServer(-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(1619) .. "]！","随机色")
							end
						end
						if math.random(100) <= daoju[fishflg] then
							local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
							if fishitemindex > -1 then
								char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
							end
						end
					elseif fishflg == 8 then
						if char.getInt(charaindex, "地图号") == 60502 then
							if math.random(100) <= buzhua[fishflg] then
								local enemyid = {319,320,321,322}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToFloor(60502,-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(319) .. "、" .. enemytemp.getEnemyTempNameFromEnemyID(320) .. "、" .. enemytemp.getEnemyTempNameFromEnemyID(321) .. "、" .. enemytemp.getEnemyTempNameFromEnemyID(322) .. "]！","随机色")
							end
						else
							if math.random(100) <= buzhua2[fishflg] then
								local enemyid = {1620}
								battle.CreateVsEnemy(charaindex,toindex,enemyid)
								char.talkToServer(-1,"[捕鱼快讯]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]触发了捕鱼抓捕，正在捕捉1级的[" .. enemytemp.getEnemyTempNameFromEnemyID(1620) .. "]！","随机色")
							end
						end
						--if math.random(100) <= daoju[fishflg] then
						--	local fishitemindex = char.Additem(charaindex,fishitemid[math.random(#fishitemid)])
						--	if fishitemindex > -1 then
						--		char.talkToServer(-1,"[江湖传闻]玩家[" .. char.getChar(charaindex,"名字") .. "]在娱乐捕鱼场打鱼时不小心捡到一个[" .. item.getChar(fishitemindex,"名称") .. "]，好像有神奇的作用哦。","随机色")
						--	end
						--end
					end
					local parameter = {toindex}
					other.CallFunction("DelFish", "data/ablua/npc/fish/fish.lua", parameter)
				end
			end
		elseif char.getInt(charaindex, "地图号") ~= 130 then
			local toindex = map.getCharaindex(charaindex, distance, 1)
			if char.check(toindex) == 1 then
				if char.getWorkInt(toindex, "战斗") == 0 and char.getWorkInt(toindex, "摆摊") == -1 then
					--char.sendAction(toindex, 1, 1)
					--char.TalkToCli(charaindex, -1, "把" .. char.getChar(toindex, "名字") .. "痛打一顿！", "黄色")
					--char.TalkToCli(toindex, -1, "受到" .. char.getChar(charaindex, "名字") .. "的攻击，导致受伤！", "红色")
					--opt = {101133}
					--char.sendWatchEvent(char.getWorkInt(toindex, "对象"), 40, opt[1], opt)
					--lssproto.effect(toindex, opt[1])
					local hp = math.random(10)
					lssproto.MagiccardDamage(charaindex,0,hp,char.getInt(toindex, "坐标X") - 18,char.getInt(toindex, "坐标Y") - 13)
					--lssproto.MagiccardDamage(toindex,0,hp,char.getInt(toindex, "坐标X") - 18,char.getInt(toindex, "坐标Y") - 13)
				end
			end
		end	
	end
end


function data()
	playerdamage = {5,10}
	fishdamage = {{1,5}
					,{5,10}
					,{10,20}
					,{20,40}
					,{30,70}
					,{60,120}
					,{100,180}
					,{150,300}}
	fishgold = {{1000,3000}
					,{2000,5000}
					,{3000,8000}
					,{5000,15000}
					,{8000,30000}
					,{20000,80000}
					,{40000,150000}
					,{80000,300000}}
	fishpoint = {1,2,3,5,10,12,20,30}
					
	fanji = {5,5,5,8,10,12,13,15}
	buzhua = {3,5,7,9,15,20,25,50}
	buzhua2 = {3,5,7,9,10,15,20,20}
	daoju = {1,2,4,6,8,12,16,20}
	--fishitemid = {21096}--没有蛇宠 取消此物品
end

function main()
	data()
end

