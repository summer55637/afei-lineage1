function attributor(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "反" then
		tmp = char.getInt(charaindex, "地")
		char.setInt(charaindex, "地", char.getInt(charaindex, "火"))
		char.setInt(charaindex, "火", tmp)
		
		tmp = char.getInt(charaindex, "水")
		char.setInt(charaindex, "水", char.getInt(charaindex, "风"))
		char.setInt(charaindex, "风", tmp)
	else
		field = other.getString(data, "|", 1)
		value = other.atoi(other.getString(data, "|", 2)) * 10
		for i = 1, table.getn(atrributor) do
			if field == atrributor[i][1] then
				if char.getInt(charaindex, atrributor[i][1]) >= 100 then
					char.TalkToCli(charaindex, -1, "你的" .. atrributor[i][1] .. "属性已到达顶峰！", "随机色")
					return
				elseif char.getInt(charaindex, atrributor[i][2]) > 0 then
					char.TalkToCli(charaindex, -1, "当属性有" .. atrributor[i][1] .. "时，无法转换" .. atrributor[i][2] .. "属性！", "随机色")
					return
				elseif char.getInt(charaindex, atrributor[i][3]) > 0 then
					char.setInt(charaindex, atrributor[i][1], math.min(100, char.getInt(charaindex, atrributor[i][1]) + value ))
					char.setInt(charaindex, atrributor[i][3], math.max(0, char.getInt(charaindex, atrributor[i][3]) - value ))
					char.TalkToCli(charaindex, -1,  atrributor[i][1] .. "属性上升" .. value / 10 .. "," .. atrributor[i][3] .. "属性下降" .. value / 10, "随机色")
				elseif char.getInt(charaindex, atrributor[i][4]) > 0 then
					char.setInt(charaindex, atrributor[i][1], math.min(100, char.getInt(charaindex, atrributor[i][1]) + value ))
					char.setInt(charaindex, atrributor[i][4], math.max(0, char.getInt(charaindex, atrributor[i][4]) - value ))
					char.TalkToCli(charaindex, -1,  atrributor[i][1] .. "属性上升" .. value / 10 .. "," .. atrributor[i][4] .. "属性下降" .. value / 10, "随机色")
				end
			end
		end
	end
	
	
	char.complianceParameter(charaindex)
	char.Updata(charaindex, "地|水|火|风")
	char.DelItem(charaindex, haveitemindex)
	
end

function main()
	atrributor = {{"地", "火", "水", "风"}
								,{"水", "风", "地", "火"}
								,{"火", "地", "水", "风"}
								,{"风", "水", "地", "火"}
								}

	item.addLUAListFunction( "ITEM_ATTRIBUTOR", "attributor", "")
end

