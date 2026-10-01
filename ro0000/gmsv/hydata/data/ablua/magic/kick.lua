function kick(charaindex, data)
	local maxplayer = char.getPlayerMaxNum() - 1
	local offlinenum = 0
	if data == nil then
		char.TalkToCli(talkerindex, -1, "请输入账号", "随机色")
		return
	end
	for i = 0, maxplayer do
		if char.check(i) == 1 then
			if char.getChar(i,"账号") == data then
				fd = char.getFd(i)
				char.logou(i)
				if fd > -1 then
					net.endOne(fd)
				end
				return
			end
		end
	end
end

function ackick(charaindex, data)
	if data == nil then
		char.TalkToCli(talkerindex, -1, "请输入MAC", "随机色")
		return
	end
	local maxplayer = char.getPlayerMaxNum() - 1
	for i = 0, maxplayer do
		if char.check(i) == 1 then
			if char.getWorkChar(i,"MAC") ~= "" then
				a,b = string.find(char.getWorkChar(i,"MAC"),data)
				if a ~= nil then
					fd = char.getFd(i)
						char.logou(i)
					if fd > -1 then
						net.endOne(fd)
					end
				end
			end
		end
	end
end

function main()
	magic.addLUAListFunction("kick", "kick", "", 1, "测试专用命令")
	magic.addLUAListFunction("ackick", "ackick", "", 1, "测试专用命令")
end

