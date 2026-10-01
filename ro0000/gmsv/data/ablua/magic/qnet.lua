function qnet(charaindex, data)
	local maxplayer = config.getFdnum() - 1
	local offlinenum = 0
	if data == nil then
		char.TalkToCli(charaindex, -1, "请输入MAC", "随机色")
		return
	end
	local maccnt = 0
	for i = 5, maxplayer do
			if net.getUse(i) == 1 then
				local fdmac = net.getMac(i)
				if fdmac == data then
					maccnt = maccnt + 1
					char.TalkToCli(charaindex, -1, "FD账号：" .. net.getCdkey(i) .. "，INDEX账号：" .. char.getChar(net.getCharaindex(i),"账号") .. "，数量：" .. maccnt .. "。", "随机色")
					if char.getChar(net.getCharaindex(i),"账号") == "" then
						net.endOne(i)
					end
				end
			end
	end
end

function main()
	magic.addLUAListFunction("qnet", "qnet", "", 1, "测试专用命令")
end

