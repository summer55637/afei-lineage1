function cimelia(itemindex, charaindex, toindex, haveitemindex)
	if item.getInt(itemindex, "攻") <= 0 then
		local fl = 2000

		local XandY = map.RandXAndY(fl)
		if XandY > -1 then
			local fx = map.getX(XandY)
			if fx < 100 then
				fx = 100
			end
			if fx > 600 then
				fx = 600
			end
			local fy = map.getY(XandY)
			
			if fy > 600 then
				fy = 600
			end
			
			if fy < 100 then
				fy = 100
			end
			item.setInt(itemindex, "攻", fl)
			item.setInt(itemindex, "防", fx)
			item.setInt(itemindex, "敏", fy)
			char.TalkToCli(charaindex, -1, "[宝藏快讯]宝藏位于地图" .. map.getFloorName(fl) .. ":坐标" .. fx .. "," .. fy, "随机色")

			item.setChar(itemindex, "说明", string.format("宝藏位于%-20s(%d,%d,%d)", map.getFloorName(fl), fl, fx, fy))

			item.UpdataItemOne(charaindex, itemindex)
		end
	else
		if item.getInt(itemindex, "攻") == char.getInt(charaindex, "地图号") and item.getInt(itemindex, "防") == char.getInt(charaindex, "坐标X")  and item.getInt(itemindex, "敏") == char.getInt(charaindex, "坐标Y") then
      --char.DelItem(charaindex, haveitemindex)
			char.TalkToCli(charaindex, -1, "[宝藏快讯]暂时还未开放！", "随机色")
		end
	end
end

function ItemOverlapFunction( charindex, fromitemindex, toitemindex )
	local fromitemid = item.getInt(fromitemindex,"序号")
	local toitemid = item.getInt(toitemindex,"序号")
	local flg = 0
	if fromitemid == 22426 then
		if toitemid == 22420 or toitemid == 22421 then
			flg = 1
		end
	elseif fromitemid == 22427 then
		if toitemid == 22422 or toitemid == 22423 then
			flg = 1
		end
	elseif fromitemid == 22428 then
		if toitemid == 22424 or toitemid == 22425 then
			flg = 1
		end
	end
		
	if flg == 1 then
		token = "\n    宝箱开启将有意外收获哟,同时每把钥匙只能够开启一个宝箱哟!请问你需要打开该宝箱吗??"
		lssproto.windows(charindex, "对话框", "确定|取消", "道具重叠", -1, token)
		return 0
	end
	
	return 1
end

function ItemOverlapedFunction( charindex, fromitemindex, fromid, toitemindex, toid)
	local fromitemid = item.getInt(fromitemindex,"序号")
	local toitemid = item.getInt(toitemindex,"序号")
	
	if fromitemid ~= 22426 and fromitemid ~= 22427 and fromitemid ~= 22428 then
		return
	end
	
	if toitemid ~= 22420 and toitemid ~= 22421 and toitemid ~= 22422 and toitemid ~= 22423 and toitemid ~= 22424 and toitemid ~= 22425 then
		return
	end
	
	local itemid = -1
	if fromitemid == 22426 then
		if toitemid == 22420 or toitemid == 22421 then
			if toitemid == 22420 then
				if char.getInt(charindex, "声望") < 1000 then
					char.TalkToCli(charindex, -1, "[宝藏快讯]你的声望小于10点,无法开启该宝箱！", "随机色")
					return
				end
				npc.DelFame(charindex, 10)
			end
			local rnd = math.random(30)
			if rnd <= 1 then
				--念珠
				itemid = math.random(22205, 22208)
			elseif rnd <= 3 then
				--金钥匙
				itemid = 22428
			elseif rnd <= 4 then
				--银钥匙
				itemid = 22427
			elseif rnd <= 6 then
				--木钥匙
				itemid = 22426
			elseif rnd <= 10 then
				--粉末
				itemid = math.random(20863, 20867)
			elseif rnd <= 13 then
				--玛蕾菲雅
				itemid = math.random(20816, 20829)
			elseif rnd <= 18 then
				--石币
				itemid = math.random(20807, 20809)
			elseif rnd <= 25 then
				--人龙蛋
				itemid = math.random(22236, 22241)
			end
		end
	elseif fromitemid == 22427 then
		if toitemid == 22422 or toitemid == 22423 then
			if toitemid == 22422 then
				if char.getInt(charindex, "声望") < 2000 then
					char.TalkToCli(charindex, -1, "[宝藏快讯]你的声望小于20点,无法开启该宝箱！", "随机色")
					return
				end
				npc.DelFame(charindex, 20)
			end
			local rnd = math.random(30)
			if rnd <= 1 then
				--稀有宠
				itemid = math.random(22268, 22274)
			elseif rnd <= 3 then
				--金钥匙
				itemid = 22428
			elseif rnd <= 6 then
				--银钥匙
				itemid = 22427
			elseif rnd <= 13 then
				--VIP宠物
				itemid = math.random(20836, 20861)
			elseif rnd <= 18 then
				--玛蕾菲雅
				itemid = math.random(20816, 20829)
			elseif rnd <= 20 then
				--石币
				itemid = math.random(20807, 20809)
			elseif rnd <= 25 then
				--人龙蛋
				itemid = math.random(22236, 22241)
			end
		end
	elseif fromitemid == 22428 then
		if toitemid == 22424 or toitemid == 22425 then
			if toitemid == 22424 then
				if char.getInt(charindex, "声望") < 5000 then
					char.TalkToCli(charindex, -1, "[宝藏快讯]你的声望小于50点,无法开启该宝箱！", "随机色")
					return
				end
				npc.DelFame(charindex, 50)
			end
			local rnd = math.random(150)
			if rnd <= 1 then
				--VIP稀有宠
				itemid = math.random(20811, 20815)
			elseif rnd <= 2 then
				--VIP稀有宠
				itemid = math.random(22253, 22257)
			elseif rnd <= 3 then
				--VIP稀有宠
				itemid = 22299
			elseif rnd <= 4 then
				--VIP稀有宠
				itemid = math.random(22343, 22345)
			elseif rnd <= 10 then
				--稀有宠
				itemid = math.random(22268, 22274)
			elseif rnd <= 20 then
				--金钥匙
				itemid = 22428
			elseif rnd <= 30 then
				--银钥匙
				itemid = 22427
			elseif rnd <= 50 then
				--VIP宠物
				itemid = math.random(20836, 20861)
			elseif rnd <= 80 then
				--玛蕾菲雅
				itemid = math.random(20816, 20829)
			elseif rnd <= 130 then
				--石币
				itemid = math.random(20807, 20809)
			end
		end
	end

	if itemid > -1 then
		char.talkToServer(-1, "[宝藏快讯]" .. char.getChar(charindex, "名字") .. "开启" .. item.getChar(toitemindex,"名称") .. "，获得" .. item.getNameFromNumber(itemid), "随机色")
		npc.AddItem(charindex, itemid)
	else
		char.TalkToCli(charindex, -1, "[宝藏快讯]原来是一个空宝箱", "随机色")
	end
	 char.DelItem(charindex, fromid)
	 char.DelItem(charindex, toid)
end

function adcimelia(itemindex, charaindex, toindex, haveitemindex)
	if item.getInt(itemindex, "攻") <= 0 then
		local fl = 17000

		local XandY = map.RandXAndY(fl)
		if XandY > -1 then
			fx = map.getX(XandY)
			fy = map.getY(XandY)
			item.setInt(itemindex, "攻", fl)
			item.setInt(itemindex, "防", fx)
			item.setInt(itemindex, "敏", fy)
			char.TalkToCli(charaindex, -1, "[宝藏快讯]宝藏位于地图" .. map.getFloorName(fl) .. ":坐标" .. fx .. "," .. fy, "随机色")
			
			item.setChar(itemindex, "说明", string.format("高级宝藏位于%-16s(%d,%d,%d)", map.getFloorName(fl), fl, fx, fy))

			item.UpdataItemOne(charaindex, itemindex)
		end
	else
		if item.getInt(itemindex, "攻") == char.getInt(charaindex, "地图号") and item.getInt(itemindex, "防") == char.getInt(charaindex, "坐标X")  and item.getInt(itemindex, "敏") == char.getInt(charaindex, "坐标Y") then
           --char.DelItem(charaindex, haveitemindex)
			char.TalkToCli(charaindex, -1, "[宝藏快讯]暂时还未开放！", "随机色")
		end
	end
end

function main()
	item.addLUAListFunction( "ITEM_CIMELIA", "cimelia", "")
	item.addLUAListFunction( "ITEM_ADCIMELIA", "adcimelia", "")
end
