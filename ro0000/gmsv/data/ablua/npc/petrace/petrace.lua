function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function petracejiang(talkerindex)
	token = "select * from `petracedata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()--释放内存
		sasql.store_result()--释放query内存
		sqlnum = sasql.num_rows()--返回结果集中行的数目
		if sqlnum > 0 then
			sasql.fetch_row()
			if other.atoi(sasql.data(6)) ~= 0 then
				return 0
			end
			if sasql.data(4) ~= sasql.data(5) then
				return 0
			end
			if checkEmptItemNum(talkerindex) == 0 then
				return 0
			end
			local petraceid = sasql.data(1)
			token = "update `petracedata` set `jiang`=1 where `id`='" .. petraceid .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				char.Additem(talkerindex,itemdata[math.random(#itemdata)])
			end
		end
	end
	return 1
end

function Loop(meindex)
	token = "delete from `petracedata` where `time`<" .. other.time() - 86400 * 2
	sasql.query(token)
end

function showpetrace(talkerindex)
	--if char.getInt(talkerindex,"活力") >= 150 then
	--	char.newMessageToCli(talkerindex, -1, "你的活力已经够多了哦", "白色")
	--	return
	--end
	token = "select * from `petracedata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc"
	ret = sasql.query(token)
	if ret == 1 then
		petracetime = 0
		petracelogpage = 0
		petracelognum = 0
		sasql.free_result()--释放内存
		sasql.store_result()--释放query内存
		sqlnum = sasql.num_rows()--返回结果集中行的数目
		if sqlnum > 0 then
			petracelogpage = math.ceil(sqlnum / 10)
			for i=1,math.min(sqlnum,10) do
				sasql.fetch_row()
				if i == 1 then
					if char.getInt(talkerindex,"转数") > 5 then
						return 0
					end
					petracetime = other.atoi(sasql.data(3)) + petracetimedata[char.getInt(talkerindex,"转数") + 1] * 3600 - other.time()
					if petracetime < 0 then
						petracetime = 0
					end
					token = "L|" .. petracetime .. "|" .. petracelogpage .. "|" .. math.min(sqlnum,10)
				end
				token = token .. "|" .. other.atoi(sasql.data(3)) .. "|" .. sasql.data(4) .. "|" .. sasql.data(5)
			end
		else
			token = "L|0|0|0"
		end
		lssproto.windows(talkerindex, 1018, "取消", 0, char.getWorkInt( npcindex, "对象"), token)
	end
	return 1
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		showpetrace(talkerindex)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "D" then
		local playerselect = other.getString(data,"|",2)
		if playerselect == "" then
			return
		end
		if other.atoi(playerselect) < 1 or other.atoi(playerselect) > 5 then
			return
		end
		if checkEmptItemNum(talkerindex) == 0 then
			char.newMessageToCli(talkerindex, -1, "道具栏已满无法下注", "白色")
			return
		end
		if char.getInt(talkerindex,"转数") > 5 then
			return
		end
		token = "select * from `petracedata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc"
		ret = sasql.query(token)
		if ret == 1 then
			petracetime = 0
			sasql.free_result()--释放内存
			sasql.store_result()--释放query内存
			sqlnum = sasql.num_rows()--返回结果集中行的数目
			if sqlnum > 0 then
				sasql.fetch_row()
				petracetime = other.atoi(sasql.data(3)) + petracetimedata[char.getInt(talkerindex,"转数") + 1] * 3600 - other.time()
				if petracetime > 0 then
					char.newMessageToCli(talkerindex, -1, petracetimedata[char.getInt(talkerindex,"转数") + 1] .. "个小时才可以下注一次", "白色")
					return
				end
			end
			local resultdata = {
								{id=1,result=other.Random(1,10000)}
								,{id=2,result=other.Random(1,10000)}
								,{id=3,result=other.Random(1,10000)}
								,{id=4,result=other.Random(1,10000)}
								,{id=5,result=other.Random(1,10000)}
								}
			table.sort(resultdata,function(a,b) return a.result>=b.result end )
			local petraceid = os.date("%Y%m%d%H%M%S",os.time()) .. char.getChar(talkerindex,"账号")
			token = "insert into `petracedata` values ('" .. petraceid .. "','" .. char.getChar(talkerindex,"账号") .. "'," .. other.time() .. "," .. other.atoi(playerselect) .. "," .. resultdata[1].id .. ",0)"
			ret = sasql.query(token)
			if ret == 1 then
				for i=1,5 do
					resultdata[i].result=i
				end
				table.sort(resultdata,function(a,b) return a.id<b.id end )
				token = "S|" .. petraceid .. "|" .. resultdata[1].result .. "|" .. resultdata[2].result .. "|" .. resultdata[3].result .. "|" .. resultdata[4].result .. "|" .. resultdata[5].result
				lssproto.windowsupdate(talkerindex, 1018, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,12,1})
				if char.getInt(talkerindex,"等级") >= 10 then
					other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,606,0})
				end
			end
		end
	elseif type == "E" then
		local petraceid = other.getString(data,"|",2)
		if petraceid == "" then
			return
		end
		token = "select * from `petracedata` where `id`='" .. petraceid .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()--释放内存
			sasql.store_result()--释放query内存
			sqlnum = sasql.num_rows()--返回结果集中行的数目
			if sqlnum > 0 then
				sasql.fetch_row()
				if char.getChar(talkerindex,"账号") ~= sasql.data(2) then
					return
				end
				if other.atoi(sasql.data(6)) ~= 0 then
					char.newMessageToCli(talkerindex, -1, "已领取奖励", "白色")
					return
				end
				if sasql.data(4) ~= sasql.data(5) then
					token = "E|2"
					lssproto.windowsupdate(talkerindex, 1018, "取消", 0, char.getWorkInt( meindex, "对象"), token)
					return
				end
				if checkEmptItemNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex, -1, "道具栏已满无法领奖", "白色")
					return
				end
				token = "update `petracedata` set `jiang`=1 where `id`='" .. petraceid .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					local itemindex = char.Additem(talkerindex,itemdata[math.random(#itemdata)])
					if item.check(itemindex) == 1 then
						token = "E|1|" .. item.getInt(itemindex,"图号") .. "|" .. item.getChar(itemindex,"显示名")
						lssproto.windowsupdate(talkerindex, 1018, "取消", 0, char.getWorkInt( meindex, "对象"), token)
					end
				end
			end
		end
	elseif type == "H" then
		if char.getInt(talkerindex,"转数") > 5 then
			return
		end
		token = "select * from `petracedata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc"
		ret = sasql.query(token)
		if ret == 1 then
			petracetime = 0
			petracelogpage = 0
			petracelognum = 0
			sasql.free_result()--释放内存
			sasql.store_result()--释放query内存
			sqlnum = sasql.num_rows()--返回结果集中行的数目
			if sqlnum > 0 then
				petracelogpage = math.ceil(sqlnum / 10)
				for i=1,math.min(sqlnum,10) do
					sasql.fetch_row()
					if i == 1 then
						petracetime = other.atoi(sasql.data(3)) + petracetimedata[char.getInt(talkerindex,"转数") + 1] * 3600 - other.time()
						if petracetime < 0 then
							petracetime = 0
						end
						token = "L|" .. petracetime .. "|" .. petracelogpage .. "|" .. math.min(sqlnum,10)
					end
					token = token .. "|" .. other.atoi(sasql.data(3)) .. "|" .. sasql.data(4) .. "|" .. sasql.data(5)
				end
			else
				token = "L|0|0|0"
			end
			lssproto.windowsupdate(talkerindex, 1018, "取消", 0, char.getWorkInt( meindex, "对象"), token)
		end
	elseif type == "G" then
		local petracepage = other.getString(data,"|",2)
		if petracepage == "" then
			return
		end
		if other.atoi(petracepage) < 2 or other.atoi(petracepage) > 1000 then
			return
		end
		token = "select * from `petracedata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc limit " .. (other.atoi(petracepage) - 1) * 10 .. ",10"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()--释放内存
			sasql.store_result()--释放query内存
			sqlnum = sasql.num_rows()--返回结果集中行的数目
			if sqlnum > 0 then
				for i=1,math.min(sqlnum,10) do
					sasql.fetch_row()
					if i == 1 then
						token = "O|" .. math.min(sqlnum,10)
					end
					token = token .. "|" .. other.atoi(sasql.data(3)) .. "|" .. sasql.data(4) .. "|" .. sasql.data(5)
				end
			else
				token = "O|0"
			end
			lssproto.windowsupdate(talkerindex, 1018, "取消", 0, char.getWorkInt( meindex, "对象"), token)
		end
	end
end


function Create(name, metamo, floorid, x, y,dir)
	npcindex = npc.CreateNpc(name, metamo, floorid, x, y, dir)
	if char.check(npcindex) == 1 then
		char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
		char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
		char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
		char.setInt(npcindex, "循环事件时间", 60000)
		return npcindex
	end
	return -1
end

function data()
	itemdata = {26032}
	petracetimedata = {8,7,6,5,4,3}
end

function main()
	data()
	Create("小猪赛跑",100000,777,13,16,6)
end


