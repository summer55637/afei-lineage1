function power(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			local data = item.getChar(itemindex, "字段")
			local itemlv = other.atoi(other.getString(data, "|", 1))
			local itemtype = other.atoi(other.getString(data, "|", 2))
			local str = char.getChar(toindex, "能力提升")
			local type = other.atoi(other.getString(str, "|", 1))
			local value = {0, 0, 0}
			value[1] = other.atoi(other.getString(str, "|", 2))
			value[2] = other.atoi(other.getString(str, "|", 3))
			value[3] = other.atoi(other.getString(str, "|", 4))
			local name = {"血", "攻", "防", "敏"}
			local rnd = math.random(100)
			if rnd < 5 then
				value[itemlv] = math.random(8, 10)
			elseif rnd < 15 then
				value[itemlv] = math.random(6, 9)
			elseif rnd < 30 then
				value[itemlv] = math.random(4, 8)
			elseif rnd < 50 then
				value[itemlv] = math.random(2, 7)
			else
				value[itemlv] = math.random(1, 6)
			end
			char.DelItem(charaindex, haveitemindex)
			char.setChar(toindex, "能力提升", itemtype .. "|" .. value[1] .. "|" .. value[2] .. "|" .. value[3])
			char.TalkToCli(charaindex, -1, "成功转换能力为" .. name[itemtype] .. ",提升" .. char.getChar(toindex, "名字") .. "能力" .. value[itemlv] ..",共+" .. value[1] + value[2] + value[3] .. ",1阶+" .. value[1] .. ";2阶+" .. value[2] .. ";3阶+" .. value[3] .."!", "随机色")
			char.complianceParameter(toindex)
			char.sendStatusString(charaindex, "K" .. i)
			return
		end
	end
	char.TalkToCli(charaindex, -1, "该物品只能给宠物使用！", "随机色")
end

function data()

end


function main()
	data()
	item.addLUAListFunction( "ITEM_POWERUP", "power", "")
end
