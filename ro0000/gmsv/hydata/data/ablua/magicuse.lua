function FreeMagicUse( charaindex,toindex, magicid,mp )
	if char.getInt(charaindex,"地图号") == 60502 or char.getInt(charaindex,"地图号") == 60503 then
		return 0
	elseif char.getInt(charaindex,"地图号") >= 40030 and char.getInt(charaindex,"地图号") <= 40034 then
		if mp == 0 then
			char.newMessageToCli(charaindex,-1,"免气精灵在副本中禁止使用","白色")
			return 0
		end
		if magicid == 260 or magicid == 261 or magicid == 263 or magicid == 265 or magicid == 266 or magicid == 267 or magicid == 250 or magicid == 251 or magicid == 252 or magicid == 253 or magicid == 255 or magicid == 256 or magicid == 257 or magicid == 270 or magicid == 271 or magicid == 272 or magicid == 273 or magicid == 280 or magicid == 281 or magicid == 290 or magicid == 300 then
			char.newMessageToCli(charaindex,-1,"光镜精灵在副本中禁止使用","白色")
			return 0
		end
	end
	local magictype = magic.getInt(magicid,"字段")
	local battleindex = char.getWorkInt(charaindex,"战斗索引")
	if magictype == 1 then
		if battle.checkindex(battleindex) ~= 1 then
			char.newMessageToCli(charaindex,-1,"该精灵无法在平时状态下使用","白色")
			return 0
		end
	elseif magictype == 2 then
		if battle.checkindex(battleindex) == 1 then
			char.newMessageToCli(charaindex,-1,"该精灵无法在战斗状态下使用","白色")
			return 0
		end
	end
	if (magicid == 12 or magicid == 17 or magicid == 26) and mp == 0 then
		if battle.checkindex(battleindex) == 1 then
			if battle.getType(battleindex) == 2 then
				char.newMessageToCli(charaindex,-1,"该精灵无法在PVP中使用","白色")
				return 0
			end
		end
	end
	if char.getInt(charaindex,"类型") == 1 and char.getInt(toindex,"类型") == 1 then
		if char.getWorkInt(charaindex,"战斗") == 0 and char.getWorkInt(toindex,"战斗") ~= 0 then
			return 0
		end
	end
	return 1
end

function data()
	
end

function main()
	data()
end
