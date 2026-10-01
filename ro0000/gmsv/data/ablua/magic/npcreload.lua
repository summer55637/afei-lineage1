function npcreload(charaindex, data)
	local npcstartnum = char.getPlayerMaxNum() + char.getPetMaxNum()
	local npcendnum = char.getCharNum() - 1
	for i=npcstartnum,npcendnum do
		if char.check(i) == 1 then
			if data ~= "" then 
				if char.getChar(i,"名字") == data then
					print("\nfloor1=".. char.getInt(i,"地图号") .. ",floor2=" .. obj.getFloor(char.getWorkInt(i,"对象")))
					char.WarpToSpecificPoint(i,char.getInt(i,"地图号"),char.getInt(i,"坐标X"),char.getInt(i,"坐标Y"))
				end
			else
				if char.getInt(i,"地图号") ~= obj.getFloor(char.getWorkInt(i,"对象")) then
					char.WarpToSpecificPoint(i,char.getInt(i,"地图号"),char.getInt(i,"坐标X"),char.getInt(i,"坐标Y"))
				end
			end
		end
	end
end


function main()
	magic.addLUAListFunction("npcreload", "npcreload", "", 3, "测试专用命令")
end

