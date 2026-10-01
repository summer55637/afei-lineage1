function ItemOverlapFunction( charindex, fromitemindex, toitemindex )
	local fromitemid = item.getInt(fromitemindex,"序号")
	local toitemid = item.getInt(toitemindex,"序号")
	if fromitemid == 22512 then
		for i = 1 , table.getn(itemtype) do
			if item.getInt(toitemindex, "类型") == itemtype[i] then
				if item.getInt(toitemindex, "物品等级") >= 0 and item.getInt(toitemindex, "物品等级") < 20 then
					token = "\n    你是否要将[" .. item.getChar(toitemindex, "名称") .. "]进行升级？如需进行升级，请注意，使用后将自动把装备进行绑定，绑定后不能丢充不能交易，每升级成功都都累计+1，最高级为+20级，失败则不发生变化！"
					lssproto.windows(charindex, "对话框", "确定|取消", "道具重叠", -1, token)
					return 0
				else
					char.TalkToCli(charindex, -1, item.getChar(toitemindex, "名称") .. "的等级不符合升级条件，无法进行升级！", "随机色")
					return 0
				end
			end
		end
	end
	return 1
end

function ItemOverlapedFunction( charindex, fromitemindex, fromid, toitemindex, toid)
	local fromitemid = item.getInt(fromitemindex,"序号")
	local toitemid = item.getInt(toitemindex,"序号")
	
	if fromitemid == 22512 then
		for i = 1 , table.getn(itemtype) do
			if item.getInt(toitemindex, "类型") == itemtype[i] then
				if item.getInt(toitemindex, "物品等级") >= 0 and item.getInt(toitemindex, "物品等级") < 20 then
					str, len = string.gsub(item.getChar(toitemindex, "名称") , "*", "")
					if len == 0 then
						item.setChar(toitemindex, "名称", "*" .. item.getChar(toitemindex, "名称"))
					end
					item.setInt(toitemindex, "物品等级", item.getInt(toitemindex, "物品等级") + 1)
					item.setChar(toitemindex, "显示名", item.getChar(toitemindex, "名称") .. " [+" .. item.getInt(toitemindex, "物品等级") .. "]")
					item.UpdataItemOne(charindex, toitemindex)
					char.TalkToCli(charindex, -1, item.getChar(toitemindex, "名称") .. "升级成功，当前等级为+" .. item.getInt(toitemindex, "物品等级"), "随机色")
					char.DelItem(charindex, fromid)
				end
			end
		end
	end
end

function main()
	itemtype = {0, 1, 2, 3, 4, 5, 6, 7, 17, 18, 19}
end


