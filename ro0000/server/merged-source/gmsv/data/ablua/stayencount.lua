function FreeStayEncount( charaindex )
	local i = 0
	local maxplayer = char.getPlayerMaxNum() - 1
	local playernum = 0
	local teamnum = 0
	if (char.getInt(charaindex,"地图号") == 500 and char.getInt(charaindex,"坐标X") >= 100 and char.getInt(charaindex,"坐标X") <= 300 and char.getInt(charaindex,"坐标Y") >= 250 and char.getInt(charaindex,"坐标Y") <= 355) or char.getInt(charaindex,"地图号") == 34567 then
		for i=0,maxplayer do
			if char.check(i) == 1 and i ~= charaindex then
				if char.getInt(charaindex,"地图号") == char.getInt(i,"地图号") and char.getInt(charaindex,"坐标X") == char.getInt(i,"坐标X") and char.getInt(charaindex,"坐标Y") == char.getInt(i,"坐标Y") then
					playernum = playernum + 1
					if char.getWorkInt(i,"组队") == 1 and char.getCharStayEncount(i) == 1 then
						teamnum = teamnum + 1
					end
					if playernum >= 3 then
						char.TalkToCli(charaindex, -1, "[温馨提示]您的当前坐标已经有超过" .. playernum .. "名玩家，无法建立新的原地遇敌，挪个屁股找另外个坑吧。", "随机色")
						return 0
					end
					if teamnum >= 2 then
						char.TalkToCli(charaindex, -1, "[温馨提示]您的当前坐标已经有好多人在原地遇敌了，请更换坐标进入原地状态。", "随机色")
						return 0
					end
				end
			end
		end
	end
	return 1
end

function data()

end

function main()
	data()
end
