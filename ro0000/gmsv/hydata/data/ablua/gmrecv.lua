function FreeGmRecv(data,ip)
	if data == "" or ip == "" then
		return
	end
	local checkip = 0
	for i=1,table.getn(safeip) do
		if ip == safeip[i] then
			checkip = 1
			break
		end
	end
	if checkip == 0 then
		return
	end
	if other.getString(data,"|",1) == "yiqishiqib" then
		local gmdata = other.getString(data,"|",2)
		if gmdata == "" then
			return
		end
		if gmdata == "showstart" then
			local showbuff = other.getString(data,"|",3)
			if showbuff == "" then
				return
			end
			local maxplayer = char.getPlayerMaxNum() - 1
			i = 4
			while(other.getString(data,"|",i) ~= "")
			do
				for j=0,maxplayer do
					if char.check(j) == 1 then
						if char.getChar(j,"账号") == other.getString(data,"|",i) then
							char.newMessageToCli(j,-1,showbuff,"白色")
							break
						end
					end
				end
				i = i + 1
			end
		elseif gmdata == "showpay" then
			local cdkey = other.getString(data,"|",3)
			local paypoint = other.getString(data,"|",4)
			if cdkey == "" or paypoint == "" then
				return
			end
			paypoint = other.atoi(paypoint)
			local maxplayer = char.getPlayerMaxNum() - 1
			for i=0,maxplayer do
				if char.check(i) == 1 then
					if char.getChar(i,"账号") == cdkey then
						char.newMessageToCli(i,-1,"成功花费" .. paypoint .. "金币打赏主播","白色")
						return
					end
				end
			end
		end
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	safeip = {"47.99.136.134"}
end

function main()
	data()
	Create("外部指令", 100000, 777, 25, 9, 4)
end

