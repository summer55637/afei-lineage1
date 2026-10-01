function getint(charaindex, data)
	local maxplayer = char.getPlayerMaxNum() - 1
	local offlinenum = 0
	if data == nil then
		char.TalkToCli(charaindex, -1, "请输入账号", "随机色")
		return
	end
	local cdkey = other.getString(data, " ", 1)
	local ming = other.getString(data, " ", 2)
	if cdkey == "" or ming == "" then
		return
	end
	for i = 0, maxplayer do
		if char.check(i) == 1 then
			if char.getChar(i,"账号") == cdkey then
				local datanum = char.getInt(i,ming)
				char.TalkToCli(charaindex, -1, ming .. "：" .. datanum, "随机色")
				return
			end
		end
	end
end


function main()
	magic.addLUAListFunction("getint", "getint", "", 3, "测试专用命令")
end

