

function fmpkbug(charaindex, data)
	message = other.getString(data, " ", 1)
	for i = 0, char.getPlayerMaxNum()-1 do
		if char.check(i) == 1 then
			if char.getInt(i, "地图号") == other.atoi(message) then
				char.setWorkInt(i,"战斗模式",1)
				char.TalkToCli(charaindex, -1, "已成功重置账号:" .. char.getChar(i,"账号"), "随机色")
			end
		end
	end
end

function main()
	magic.addLUAListFunction("fmpkbug", "fmpkbug", "", 1, "[fmpkbug 家族PK地图号]")
end

