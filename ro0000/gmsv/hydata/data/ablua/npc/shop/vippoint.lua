function ShowList(talkerindex)
	other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	--(1、金币2、声望3、战点4、石币5、宝石)
	local type = 1
	local shoptype = 31
	token = type .. "|" .. shoptype .. "|" .. #itemid
	for i=1,#itemid do
		token = token .. "|" .. item.getSecretNameFromNumber(itemid[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid[i][1]) .. "|" .. itemid[i][2] .. "|" .. item.getItemInfoFromNumber(itemid[i][1])
	end
	--1034是观战
	lssproto.windows(talkerindex, 1017, 8, 0, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

function ShowList5(talkerindex)
	other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	--(1、金币2、声望3、战点4、石币5、宝石)
	local type = 5
	local shoptype = 31
	token = type .. "|" .. shoptype .. "|" .. #itemid5
	for i=1,#itemid5 do
		token = token .. "|" .. item.getSecretNameFromNumber(itemid5[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid5[i][1]) .. "|" .. itemid5[i][2] .. "|" .. item.getItemInfoFromNumber(itemid5[i][1])
	end
	lssproto.windows(talkerindex, 1017, 8, 0, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

function BuyItem(meindex, talkerindex, id, num,type)
	if num < 1 or num > 15 then
		return
	end
	if id < 1 or id > #itemid then
		return
	end
	--对话框中选择确定
	local mypetpoint = sasql.getPetPoint(talkerindex)
	local myvippoint = sasql.getVipPoint(talkerindex)
	local yuanpoint = myvippoint
	local cost = itemid[id][2];
	if type == 1 then
		if itemid[id][1] == 29007 then
			char.newMessageToCli(talkerindex, -1, "水晶道具只允许金币购买", 4)
			return
		end
		if mypetpoint >= cost * num then
			local peticost = 0
			local inum = 0
			for i = 1, num do
				itemindex = char.Additem(talkerindex, itemid[id][1])
				if itemindex > -1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
						local rideitembuff = item.getChar(itemindex,"字段")
						local ridefield = {"", "",""}
						ridefield[1] = other.getString(rideitembuff, "|", 1)
						ridefield[2] = other.getString(rideitembuff, "|", 2)
						if other.atoi(ridefield[2]) == -101 then
							ridefield[3] = other.getString(rideitembuff, "|", 3)
							local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
							item.setInt(itemindex,"物品时间",itemtime)
							item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
									.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
						end
					end
					item.setInt(itemindex, "颜色", 9)
					if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
						item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
					end
					item.UpdataItemOne(talkerindex, itemindex)
					mypetpoint = mypetpoint - cost
					sasql.setPetPoint(talkerindex, mypetpoint)
					peticost = peticost + cost
					inum = inum + 1
				else
					char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
					break
				end
			end
			char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "显示名"), "随机色")
			if peticost > 0 then
				char.newMessageToCli(talkerindex, -1, "扣除" .. peticost .. "水晶", "随机色")
			end
			--char.charSaveFromConnect(talkerindex)
			other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
		else
			char.newMessageToCli(talkerindex, -1, "水晶不足以购买" .. num .. "个", "随机色")
		end
	else
		if myvippoint >= cost * num then
			local vipicost = 0
			local inum = 0
			for i = 1, num do
				itemindex = char.Additem(talkerindex, itemid[id][1])
				if itemindex > -1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
						local rideitembuff = item.getChar(itemindex,"字段")
						local ridefield = {"", "",""}
						ridefield[1] = other.getString(rideitembuff, "|", 1)
						ridefield[2] = other.getString(rideitembuff, "|", 2)
						if other.atoi(ridefield[2]) == -101 then
							ridefield[3] = other.getString(rideitembuff, "|", 3)
							local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
							item.setInt(itemindex,"物品时间",itemtime)
							item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
									.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
						end
					end
					item.setInt(itemindex, "颜色", 9)
					if string.sub(item.getChar(itemindex,"名称"),1,1) == "*" then
						item.setChar(itemindex,"名称",string.sub(item.getChar(itemindex,"名称"),2))
					end
					item.UpdataItemOne(talkerindex, itemindex)
					myvippoint = myvippoint - cost
					sasql.setVipPoint(talkerindex, myvippoint)
					vipicost = vipicost + cost
					inum = inum + 1
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,cost})
				else
					char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
					break
				end
			end
			char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "名称"), "随机色")
			if vipicost > 0 then
				other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vipicost})
				char.newMessageToCli(talkerindex, -1, "扣除" .. vipicost .. "金币", "随机色")
			end


			token = "INSERT INTO `VipShop` ("
										.. "`cdkey` ,"
										.. "`name` ,"
										.. "`itemid` ,"
										.. "`itemname` ,"
										.. "`itemnum` ,"
										.. "`time`,"
										.. "`oldpoint`,"
										.. "`newpoint` "
										.. ")"
										.. "VALUES ("
										.. "'" 
										.. char.getChar(talkerindex, "账号")  .. "', '" 
										.. char.getChar(talkerindex, "名字") .. "', '" 
										.. itemid[id][1] .. "', '" 
										.. item.getChar(itemindex, "名称") .. "', '" 
										.. inum .. "'," 
										.. "NOW(),'"
										.. yuanpoint .. "','"
										.. sasql.getVipPoint(talkerindex) .. "');"
							
			ret = sasql.query(token)
			--char.charSaveFromConnect(talkerindex)
			other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
			if itemid[id][1] == 23801 or itemid[id][1] == 23803 or itemid[id][1] == 23804 then
				other.CallFunction("weixin","data/ablua/weixin.lua",{talkerindex,10,char.getChar(talkerindex,"名字")})
			end
		else
			char.newMessageToCli(talkerindex, -1, "金币不足以购买" .. num .. "个", "随机色")
		end
	end
end

function BuyItem2(meindex, talkerindex, id, num)
	if num < 1 or num > 15 then
		return
	end
	if id < 1 or id > #itemid2 then
		return
	end
	--对话框中选择确定
	local mygold = char.getInt(talkerindex,"石币")
	local cost = itemid2[id][2];
	
	if mygold >= cost * num then
		local goldicost = 0
		local inum = 0
		for i = 1, num do
			itemindex = char.Additem(talkerindex, itemid2[id][1])
			if itemindex > -1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
					local rideitembuff = item.getChar(itemindex,"字段")
					local ridefield = {"", "",""}
					ridefield[1] = other.getString(rideitembuff, "|", 1)
					ridefield[2] = other.getString(rideitembuff, "|", 2)
					if other.atoi(ridefield[2]) == -101 then
						ridefield[3] = other.getString(rideitembuff, "|", 3)
						local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
						item.setInt(itemindex,"物品时间",itemtime)
						item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
								.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
					end
				end
				--item.setInt(itemindex, "颜色", 9)
				--if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
				--	item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
				--end
				if item.getChar(itemindex,"名称") == "豪华船生鱼片" then
					item.setChar(itemindex,"字段","体1000")
					item.setChar(itemindex,"说明",item.getChar(itemindex,"说明") .. "(功效翻倍)")
					item.setInt(itemindex,"合成",1)
				end
				item.UpdataItemOne(talkerindex, itemindex)
				mygold = mygold - cost
				char.setInt(talkerindex,"石币",mygold)
				goldicost = goldicost + cost
				inum = inum + 1
			else
				char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
				break
			end
		end
		char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "显示名"), "随机色")
		if goldicost > 0 then
			char.newMessageToCli(talkerindex, -1, "扣除" .. goldicost .. "石币", "随机色")
		end
		--char.charSaveFromConnect(talkerindex)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	else
		char.newMessageToCli(talkerindex, -1, "石币不足以购买" .. num .. "个", "随机色")
	end
end

function BuyItem3(meindex, talkerindex, id, num)
	if num < 1 or num > 15 then
		return
	end
	if id < 1 or id > #itemid3 then
		return
	end
	--对话框中选择确定
	local mygold = char.getInt(talkerindex,"族战积分")
	local cost = itemid3[id][2];
	
	if mygold >= cost * num then
		local goldicost = 0
		local inum = 0
		for i = 1, num do
			itemindex = char.Additem(talkerindex, itemid3[id][1])
			if itemindex > -1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
					local rideitembuff = item.getChar(itemindex,"字段")
					local ridefield = {"", "",""}
					ridefield[1] = other.getString(rideitembuff, "|", 1)
					ridefield[2] = other.getString(rideitembuff, "|", 2)
					if other.atoi(ridefield[2]) == -101 then
						ridefield[3] = other.getString(rideitembuff, "|", 3)
						local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
						item.setInt(itemindex,"物品时间",itemtime)
						item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
								.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
					end
				end
				--item.setInt(itemindex, "颜色", 9)
				--if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
				--	item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
				--end
				if item.getChar(itemindex,"名称") == "豪华船生鱼片" then
					item.setChar(itemindex,"字段","体1000")
					item.setChar(itemindex,"说明",item.getChar(itemindex,"说明") .. "(功效翻倍)")
					item.setInt(itemindex,"合成",1)
				end
				item.UpdataItemOne(talkerindex, itemindex)
				mygold = mygold - cost
				char.setInt(talkerindex,"族战积分",mygold)
				goldicost = goldicost + cost
				inum = inum + 1
			else
				char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
				break
			end
		end
		char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "显示名"), "随机色")
		if goldicost > 0 then
			char.newMessageToCli(talkerindex, -1, "扣除" .. goldicost .. "战点", "随机色")
		end
		--char.charSaveFromConnect(talkerindex)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	else
		char.newMessageToCli(talkerindex, -1, "石币不足以购买" .. num .. "个", "随机色")
	end
	char.sendStatusString(talkerindex,"P")
end

function BuyItem4(meindex, talkerindex, id, num)
	if num < 1 or num > 15 then
		return
	end
	if id < 1 or id > #itemid4 then
		return
	end
	--对话框中选择确定
	local mygold = char.getInt(talkerindex,"声望")
	local yuanpoint = mygold
	local cost = itemid4[id][2];
	print("[vippoint:BuyItem2]",mygold,cost)
	if mygold >= cost * num * 100 then
		local goldicost = 0
		local inum = 0
		for i = 1, num do
			itemindex = char.Additem(talkerindex, itemid4[id][1])
			if itemindex > -1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
					local rideitembuff = item.getChar(itemindex,"字段")
					local ridefield = {"", "",""}
					ridefield[1] = other.getString(rideitembuff, "|", 1)
					ridefield[2] = other.getString(rideitembuff, "|", 2)
					if other.atoi(ridefield[2]) == -101 then
						ridefield[3] = other.getString(rideitembuff, "|", 3)
						local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
						item.setInt(itemindex,"物品时间",itemtime)
						item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
								.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
					end
				end
				--item.setInt(itemindex, "颜色", 9)
				--if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
				--	item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
				--end
				if item.getChar(itemindex,"名称") == "豪华船生鱼片" then
					item.setChar(itemindex,"字段","体1000")
					item.setChar(itemindex,"说明",item.getChar(itemindex,"说明") .. "(功效翻倍)")
					item.setInt(itemindex,"合成",1)
				end
				item.UpdataItemOne(talkerindex, itemindex)
				mygold = mygold - cost * 100
				char.setInt(talkerindex,"声望",mygold)
				goldicost = goldicost + cost
				inum = inum + 1
			else
				char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
				break
			end
		end
		char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "显示名"), "随机色")
		if goldicost > 0 then
			char.newMessageToCli(talkerindex, -1, "扣除" .. goldicost .. "声望", "随机色")
		end
		token = "INSERT INTO `FameShop` ("
										.. "`cdkey` ,"
										.. "`name` ,"
										.. "`itemid` ,"
										.. "`itemname` ,"
										.. "`itemnum` ,"
										.. "`time`,"
										.. "`oldpoint`,"
										.. "`newpoint` "
										.. ")"
										.. "VALUES ("
										.. "'" 
										.. char.getChar(talkerindex, "账号")  .. "', '" 
										.. char.getChar(talkerindex, "名字") .. "', '" 
										.. itemid4[id][1] .. "', '" 
										.. item.getChar(itemindex, "名称") .. "', '" 
										.. inum .. "'," 
										.. "NOW(),'"
										.. yuanpoint .. "','"
										.. char.getInt(talkerindex,"声望") .. "');"
							
		ret = sasql.query(token)
		--char.charSaveFromConnect(talkerindex)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	else
		char.newMessageToCli(talkerindex, -1, "石币不足以购买" .. num .. "个", "随机色")
	end
end

function BuyItem5(meindex, talkerindex, id, num)
	if num < 1 or num > 15 then
		return
	end
	if id < 1 or id > #itemid5 then
		return
	end
	--对话框中选择确定
	local mygold = 0
	for i=9,23 do
		itemindex = char.getItemIndex(talkerindex,i)
		if item.check(itemindex) == 1 then
			if item.getInt(itemindex,"序号") == 22061 then
				if item.getInt(itemindex,"堆叠") > 1 then
					mygold = mygold + item.getInt(itemindex,"堆叠")
				else
					mygold = mygold + 1
				end
			end
		end
	end
	local cost = itemid5[id][2];
	
	if mygold >= cost * num then
		local goldicost = 0
		local inum = 0
		for i = 1, num do
			itemindex = char.Additem(talkerindex, itemid5[id][1])
			if itemindex > -1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
					local rideitembuff = item.getChar(itemindex,"字段")
					local ridefield = {"", "",""}
					ridefield[1] = other.getString(rideitembuff, "|", 1)
					ridefield[2] = other.getString(rideitembuff, "|", 2)
					if other.atoi(ridefield[2]) == -101 then
						ridefield[3] = other.getString(rideitembuff, "|", 3)
						local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
						item.setInt(itemindex,"物品时间",itemtime)
						item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
								.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
					end
				end
				item.UpdataItemOne(talkerindex, itemindex)
				npc.DelItem(talkerindex,"22061*" .. cost)
				goldicost = goldicost + cost
				inum = inum + 1
			else
				char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
				break
			end
		end
		char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "显示名"), "随机色")
		--char.charSaveFromConnect(talkerindex)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	else
		char.newMessageToCli(talkerindex, -1, "宝石不足以购买" .. num .. "个", "随机色")
	end
end

function BuyItem6(meindex, talkerindex, id, num)
	if num < 1 or num > 15 then
		return
	end
	if id < 1 or id > #itemid6 then
		return
	end
	--对话框中选择确定
	local mygold = sasql.getPayPoint(talkerindex)
	local cost = itemid6[id][2];
	
	if mygold >= cost * num then
		local goldicost = 0
		local inum = 0
		for i = 1, num do
			itemindex = char.Additem(talkerindex, itemid6[id][1])
			if itemindex > -1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
					local rideitembuff = item.getChar(itemindex,"字段")
					local ridefield = {"", "",""}
					ridefield[1] = other.getString(rideitembuff, "|", 1)
					ridefield[2] = other.getString(rideitembuff, "|", 2)
					if other.atoi(ridefield[2]) == -101 then
						ridefield[3] = other.getString(rideitembuff, "|", 3)
						local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
						item.setInt(itemindex,"物品时间",itemtime)
						item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
								.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
					end
				end
				
				item.UpdataItemOne(talkerindex, itemindex)
				mygold = mygold - cost
				sasql.setPayPoint(talkerindex,mygold)
				goldicost = goldicost + cost
				inum = inum + 1
			else
				char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
				break
			end
		end
		char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "显示名"), "随机色")
		if goldicost > 0 then
			char.newMessageToCli(talkerindex, -1, "扣除" .. goldicost .. "积分", "随机色")
		end
		--char.charSaveFromConnect(talkerindex)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	else
		char.newMessageToCli(talkerindex, -1, "积分不足以购买" .. num .. "个", "随机色")
	end
end

function Talked2(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
		--(1、金币2、声望3、战点4、石币5、宝石)
		local type = 6
		local shoptype = 32
		token = type .. "|" .. shoptype .. "|" .. #itemid6
		for i=1,#itemid6 do
			token = token .. "|" .. item.getSecretNameFromNumber(itemid6[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid6[i][1]) .. "|" .. itemid6[i][2] .. "|" .. item.getItemInfoFromNumber(itemid6[i][1])
		end
		lssproto.windows(talkerindex, 1017, 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "T" then
		local shoptype = other.getString(data,"|",2)
		if shoptype == "" then
			return
		end
		shoptype = other.atoi(shoptype)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
		--(1、金币2、声望3、战点4、石币)->(1、金币2、石币3、战点4、声望)
		if shoptype == 1 then
			token = shoptype .. "|" .. 31 .. "|" .. #itemid
			for i=1,#itemid do
				token = token .. "|" .. item.getSecretNameFromNumber(itemid[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid[i][1]) .. "|" .. itemid[i][2] .. "|" .. item.getItemInfoFromNumber(itemid[i][1])
			end
			lssproto.windowsupdate(talkerindex, 1017, 8, 0, char.getWorkInt( meindex, "对象"), token)
		elseif shoptype == 2 then
			token = shoptype .. "|" .. 31 .. "|" .. #itemid2
			for i=1,#itemid2 do
				token = token .. "|" .. item.getSecretNameFromNumber(itemid2[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid2[i][1]) .. "|" .. itemid2[i][2] .. "|" .. item.getItemInfoFromNumber(itemid2[i][1])
			end
			lssproto.windowsupdate(talkerindex, 1017, 8, 0, char.getWorkInt( meindex, "对象"), token)
		elseif shoptype == 3 then
			token = shoptype .. "|" .. 31 .. "|" .. #itemid3
			for i=1,#itemid3 do
				token = token .. "|" .. item.getSecretNameFromNumber(itemid3[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid3[i][1]) .. "|" .. itemid3[i][2] .. "|" .. item.getItemInfoFromNumber(itemid3[i][1])
			end
			lssproto.windowsupdate(talkerindex, 1017, 8, 0, char.getWorkInt( meindex, "对象"), token)
		elseif shoptype == 4 then--客户端的4是宝石
		-- 	token = shoptype .. "|" .. 31 .. "|" .. #itemid4
		-- 	for i=1,#itemid4 do
		-- 		token = token .. "|" .. item.getSecretNameFromNumber(itemid4[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid4[i][1]) .. "|" .. itemid4[i][2] .. "|" .. item.getItemInfoFromNumber(itemid4[i][1])
		-- 	end
		-- 	lssproto.windowsupdate(talkerindex, 1017, 8, 0, char.getWorkInt( meindex, "对象"), token)		
		-- elseif shoptype == 5 then
			token = shoptype .. "|" .. 31 .. "|" .. #itemid5
			for i=1,#itemid5 do
				token = token .. "|" .. item.getSecretNameFromNumber(itemid5[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid5[i][1]) .. "|" .. itemid5[i][2] .. "|" .. item.getItemInfoFromNumber(itemid5[i][1])
			end
			lssproto.windowsupdate(talkerindex, 1017, 8, 0, char.getWorkInt( meindex, "对象"), token)
		end
	elseif type == "B" then
		local shoptype = other.getString(data,"|",2)
		if shoptype == "" then
			return
		end
		shoptype = other.atoi(shoptype)
		local itemlist = other.getString(data,"|",3)
		if itemlist == "" then
			return
		end
		itemlist = other.atoi(itemlist)
		local buynum = other.getString(data,"|",4)
		if buynum == "" then
			return
		end
		buynum = other.atoi(buynum)
		if shoptype == 1 then
			local buytype = other.getString(data,"|",5)
			if buytype == "" then
				return
			end
			buytype = other.atoi(buytype)
			BuyItem(meindex, talkerindex, itemlist, buynum,buytype)
		elseif shoptype == 2 then
			BuyItem2(meindex, talkerindex, itemlist, buynum)
		elseif shoptype == 3 then
			BuyItem3(meindex, talkerindex, itemlist, buynum)
		elseif shoptype == 4 then
			--BuyItem4(meindex, talkerindex, itemlist, buynum)
			BuyItem5(meindex, talkerindex, itemlist, buynum)
		elseif shoptype == 5 then
			
		end
	end
end

function WindowTalked2 ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "B" then
		local shoptype = other.getString(data,"|",2)
		if shoptype == "" then
			return
		end
		shoptype = other.atoi(shoptype)
		local itemlist = other.getString(data,"|",3)
		if itemlist == "" then
			return
		end
		itemlist = other.atoi(itemlist)
		local buynum = other.getString(data,"|",4)
		if buynum == "" then
			return
		end
		buynum = other.atoi(buynum)
		BuyItem6(meindex, talkerindex, itemlist, buynum)
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function Create2(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex2 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex2, "对话事件", "Talked2", "")
	char.setFunctionPointer(npcindex2, "窗口事件", "WindowTalked2", "")
end
--20829,20832,20828,20836,21100,21008,21009,21021,20810,20833,20624,21015,21018-21019,21020,19014,19695,21016,21017
--0,     0,    0,     0,     10,   20, 100, 999,   100,   555,200,   888,  300,        1888  1888  1888 ,3333,9999
function data()
	--道具ID，金币--
	itemid = {	 {30505,0}
	            ,{22077,500}
				--,{29063,0}--内测蛋
				--,{22070,0}--内测蛋
				--,{29500,0}--内测蛋
				--,{22064,0}--内测蛋
				--,{21100,60}
				--,{23015,200}
				--,{22045,100}
				,{28476,600}
				,{20810,600}
                ,{21100,100}--石币
				--,{29007,0}--水晶50元
				,{21106,15888}--
				,{22003,500}--1级丹
                ,{22004,1000}--131级丹
				,{20833,1200}--79MM
				,{20837,1500}--定制MM
				,{22005,1500}--140级等丹
				,{20900,150}
				,{22058,800}--任务封印卷
				,{22059,600}--任务封印卷
				--,{22035,400}--
				--,{22041,300}--
				--,{20777,3888}
				--,{20778,3888}
				,{25100,600}
				,{21020,500}
				--,{29062,800}
				,{22029,150}
				,{21021,2880}
								
				,{22506,1000}		
				,{22510,1000}
				,{22514,1000}
				,{22518,1000}		
				,{22522,1000}
				,{22500,3500}
				,{22501,3500}
				,{22502,3500}
				,{22503,3500}
				,{22039,2588}
				,{20713,50}
				,{20714,50}
				,{20715,50}
				,{20716,50}
				,{29021,100}
				,{29022,100}
				,{29023,100}
				,{29024,100}
				--,{29160,3088}--魔兽药
				--,{29161,3088}--魔兽药
				--,{28327,200}
				--,{28328,300}
				,{28329,150}
				--,{28330,700}
				,{28331,300}
				,{28332,500}
				,{21018,100}
				,{21019,100}
				,{28300,1500}
				,{28301,1500}
				,{28463,2000}
				,{28464,2000}
	}
	itemid2 = {	 {30505,1000}
				,{1512,1000}--气瓶
				,{1531,1000}--复活药
				,{2400,1000}--阿布水
				,{12808,1000}--鱼片
				,{1275,1000}--鱼片
				,{1276,1000}--鱼片
				,{1277,1000}--鱼片
				,{11710,1000}--
				,{11715,1000}--
	}
	itemid3 = {	 {20210,6}--
				,{20211,6}--
				,{20212,6}--
				,{20213,6}--
				,{20900,20}
				,{26067,10}--
				,{26068,10}--
				,{20810,30}--
				,{22044,10}--
				,{22046,10}--
				,{22474,10}--
				,{22456,100}--
				,{22457,200}--
				,{22460,200}--
				,{22491,288}
				,{29138,500}
				--,{25101,30}--
				--,{25111,30}--
				--,{25121,30}--
				--,{25131,30}--
				,{21113,200}
	}
	itemid4 = {	{20773,888}--改色戒指红
				,{21002,30}--双倍智慧果
				,{22026,150}
				,{20774,888}--改色戒指绿
				,{20210,50}--体力果实
				,{20775,888}--改色戒指金
				,{20211,50}--碗力果实
				,{20776,888}--改色戒指黄
				,{20212,50}--耐力果实
				,{22034,20}--MM玩偶
				,{20213,50}--速度果实
				,{22032,200}
				--,{20840,0}--鱼片
				--,{22036,99}--地狱通行证
				,{2419,50}--霍特尔的保护石
				--,{22000,5000}--马年蛋蛋
				,{22055,10}--梦德标签				
				,{29159,500}--1级守护
				--,{29160,16888}
				--,{29161,16888}
				--,{28300,9999}
				--,{28301,9999}
				
				
				}
							
	itemid5 = { 
	            {29001,2}
				,{29003,2}
				,{29004,2}
				,{29019,2}
				,{29124,2}
				,{29125,2}
				 ,{28435,2}
				,{28437,2}
				,{29005,2}
				,{29006,2}
				,{22407,1}
				--,{22401,1}
				--,{23610,2}
				--,{21096,2}
					}		

	itemid6 = { {22005,800}
	           ,{29062,1000}
	           ,{29028,100}
	           ,{29029,100}			   
	           ,{29030,100}
	           ,{29031,100}
	           ,{29032,100}
	           ,{29033,100}
			   ,{22493,500}			   
	           ,{1229,200}
	           ,{29048,100}
	           ,{29049,100}
	           ,{27022,50}
			   ,{23800,999}
			   ,{22483,999}
			   ,{22484,999}
			   ,{28306,200}
	           ,{28308,200}
	           ,{28310,200}
			   ,{28303,588}
			   ,{28304,588}
			   ,{29167,3000}
			   ,{29070,5000}
			   ,{29224,5999}
			   ,{29225,5999}
			   ,{29226,4999}
			   ,{29227,6999}
			   ,{29228,3999}
			   ,{29229,3999}			   
			   ,{22492,10000}
               ,{22497,10000}
			   ,{22498,50000}
			}
end
function main()
	--第一个商店内容
	Create("金币商城", 100000, 777, 25, 5, 4)
	Create2("积分商城", 41189, 2005, 22, 11, 6)
	data()
end