--NPC循环事件(NPC索引)
function Loop(meindex)
	if char.getWorkInt(meindex, "离线") > 0 then
		if char.getWorkInt(meindex, "战斗") == 0 then
		--战斗宠物数组，设置战斗的宠物ID,最大10只
			local enemytable = {0, 0, 0, 0, 0, 0, 0, 0, 0 }
		--建立一场战斗(玩家索引，自己引索，战斗宠物数组)返回一个战斗索引
			--if other.time() >= char.getWorkInt(meindex,"计时器") + 5 then
				battleindex = battle.CreateVsEnemy(meindex, -1, enemytable)
			--end
		end
		char.setInt(meindex,"离线时间",char.getInt(meindex,"离线时间") + 4)
		if char.getInt(meindex, "活力") <= 0 then
			char.logou(meindex)
		end
	else
		other.setLuaPLayerNum(other.getLuaPLayerNum()-1)
		char.delFunctionPointer(meindex,"循环事件")
		char.setInt(meindex, "循环事件时间", 0)
	end
end

function pLoop(meindex)
	if char.getWorkInt(meindex, "离线") > 0 then
		char.setInt(meindex,"离线时间",char.getInt(meindex,"离线时间") + 4)
		if char.getInt(meindex, "活力") <= 0 then
			char.logou(meindex)
		end
	else
		other.setLuaPLayerNum(other.getLuaPLayerNum()-1)
		char.delFunctionPointer(meindex,"循环事件")
		char.setInt(meindex, "循环事件时间", 0)
	end
end

function OffLine(charaindex)
	if char.getInt(charaindex, "活力") <= 0 then
		char.newMessageToCli(charaindex, -1, "你当前没有活力！", "随机色")
		return 0
	end
	if config.getGameservername() == "娱乐线" then
		char.newMessageToCli(charaindex, -1, "该线路禁止离线", "随机色")
		return 0
	end
	local floorid = char.getInt(charaindex, "地图号")
	
	--[[
	if floorid ~= 500 and floorid ~= 34567 then
		char.TalkToCli(charaindex, -1, "离线挂机只能在［" .. map.getFloorName(500) .. "、" .. map.getFloorName(34567) .. "］上使用", "随机色")
		return 0
	else
		if char.getWorkInt(charaindex,"组队") == 1 then
			char.TalkToCli(charaindex, -1, "队长无法进入离线状态，请转移队长后再尝试离线。", "随机色")
			return 0
		elseif char.getWorkInt(charaindex,"组队") == 0 then
			char.TalkToCli(charaindex, -1, "单人练级过于危险，不支持离线挂机，请组队后进行离线操作。", "随机色")
			return 0
		end
	end]]
	for i=1,#noofflinemap do
		if floorid == noofflinemap[i] then
			char.newMessageToCli(charaindex, -1, "该地图无法离线", "随机色")
			return 0
		end
	end
	local streetnum = 0
	local othernum = 0
	local streetmaxnum = 4
	local othermaxnum = 999
	local maxplayer = char.getPlayerMaxNum()
	local mac = char.getWorkChar(charaindex, "MAC")
	local mac2 = char.getWorkChar(charaindex, "MAC2")

	
	for i = 0, maxplayer - 1 do
		if char.check(i) == 1 then
			if char.getWorkInt(i, "离线") == 1 then
				if mac == char.getWorkChar(i, "MAC") and mac2 == char.getWorkChar(i, "MAC2") then
					othernum = othernum + 1
					if othernum >= othermaxnum then
						char.newMessageToCli(charaindex, -1, "离线数量过多", "随机色")
						return 0
					end
				end
			end
		end
	end
	char.StopEncounter(charaindex)
	char.newMessageToCli(charaindex, -1, "您已离线成功", "随机色")

	
	
	char.setWorkInt(charaindex, "登陆时间", other.time())
	char.setInt(charaindex, "下线时间", other.time())
	char.setWorkInt(charaindex, "离线", 1)
	char.setWorkInt(charaindex, "NPC临时1", other.time())
	char.setWorkInt(charaindex,"计时器",0)
	sql = "update `CSAlogin` set `Offline`=1 where `Name`='" .. char.getChar(charaindex,"账号") .. "'"
	sasql.query(sql)
	fd = char.getFd(charaindex)
	lssproto.sendOfflineReturn(fd)
	net.setCloseRequest(fd,1)
	other.setLuaPLayerNum(other.getLuaPLayerNum()+1)
	if char.getWorkInt(charaindex, "组队") ~= 2 then
		char.setFunctionPointer(charaindex, "循环事件", "Loop", "")
		char.setInt(charaindex, "循环事件时间", 4000)
	else
		char.setFunctionPointer(charaindex, "循环事件", "pLoop", "")
		char.setInt(charaindex, "循环事件时间", 4000)
	end
	return 1
end

function itemoffline(itemindex, charaindex, toindex, haveitemindex)
	OffLine(charaindex)
end

function data()
	noofflinemap = {1042,2032,3032,4032,1005,3005,4005,40030,40031,40032,40033,40034}
end

function main()
	data()
	item.addLUAListFunction( "ITEM_OFFLINE", "itemoffline", "")
end
