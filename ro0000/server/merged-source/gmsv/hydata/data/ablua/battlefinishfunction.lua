function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function BattleFinishFunction( charaindex, battletime, battleturn, win )
	
	if char.getInt(charaindex, "类型") == 1 then
		local partynum = 5
		local nWeekDay = tonumber(os.date("%w",  os.time()))
		if win == 1 then
			for i=1,#fmpkpoint do
				if char.getInt(charaindex, "地图号") == fmpkpoint[i] and char.getWorkInt(charaindex,"族战积分标识") == 0 then
					char.setInt(charaindex,"族战积分",char.getInt(charaindex,"族战积分") + 3)
					char.TalkToCli(charaindex, -1, "[温馨提示]恭喜您战胜对手，奖励战点[3]", "随机色")
				end
			end
		end
		other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,7,1})
	end
end

function battleinfo(charaindex, data)
	char.talkToAllServer("P|P|[PK互动快讯]" .. data .. "在("..  config.getGameservername()  .. ")" .. map.getFloorName(2000) .. "PK幸运获得50点活力","")
end

function data()
						--连胜次数, 连败次数, 转机
	message = {{50, -1,  0,  "「最强王者」"}
						,{40, -1,  1,  "「大师你懂么」"}
						,{40, -1,  0,  "「超凡大师」"}
						,{30, -1,  1,  "「传奇陨落」"}
						,{30, -1,  0,  "「璀璨钻石」"}
						,{20, -1,  1,  "「阴沟翻船」"}
						,{20, -1,  0,  "「华贵铂金」"}
						,{10, -1,  1,  "「荣耀黄金」"}
						,{-1,  5,  0,  "「俺是来打酱油的」"}
						,{-1, 10,  1,  "「咸鱼翻身」"}
						,{-1, 20,  0,  "「不屈白银」"}
						,{-1, 30,  0,  "「英勇青铜」"}
						}
	fmpkpoint = {1042, 2032, 3032, 4032, 5032}
end

function main()
	data()
	magic.addLUAListFunction("battleinfo", "battleinfo", "", 3, "测试专用命令")
end
