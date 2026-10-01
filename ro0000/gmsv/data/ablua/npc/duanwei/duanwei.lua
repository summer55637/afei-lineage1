function copyfile(source,destination)

	sourcefile = io.open(source, "r")
	destinationfile = io.open(destination, "w")


    destinationfile:write(sourcefile:read("*all"))


	sourcefile:close()
	destinationfile:close()
end
function SaveDw1v1Log()
	local out = io.open("./data/ablua/npc/duanwei/1v1.bin", "wb+")
	
	for i = 1, math.min(table.getn(dw1v1data),50) do
		token = dw1v1data[i][1] .. "," .. dw1v1data[i][2] .. "," .. dw1v1data[i][3] .. "," .. dw1v1data[i][4] .. "\n"
		out:write(token)
	end
	
	out:close()
	copyfile("./data/ablua/npc/duanwei/1v1.bin","./data/ablua/npc/duanwei/1v1copy.bin")
end

function ReloadDw1v1Log()
	local inp = io.open("./data/ablua/npc/duanwei/1v1.bin", "rb")
	local token = inp:read("*all")
	dw1v1data = {}
	for i = 1, 50 do
		data = other.getString(token, "\n", i)
		if data == "" then
			break
		end
		table.insert(dw1v1data,{other.getString(data, ",", 1),other.getString(data, ",", 2),other.atoi(other.getString(data, ",", 3)),other.atoi(other.getString(data, ",", 4))})
	end
	inp:close()
end

function SaveDw5v5Log()
	local out = io.open("./data/ablua/npc/duanwei/5v5.bin", "wb+")
	
	for i = 1, math.min(table.getn(dw5v5data),50) do
		token = dw5v5data[i][1] .. "," .. dw5v5data[i][2] .. "," .. dw5v5data[i][3] .. "," .. dw5v5data[i][4] .. "\n"
		out:write(token)
	end
	
	out:close()
	copyfile("./data/ablua/npc/duanwei/5v5.bin","./data/ablua/npc/duanwei/5v5copy.bin")
end

function ReloadDw5v5Log()
	local inp = io.open("./data/ablua/npc/duanwei/5v5.bin", "rb")
	local token = inp:read("*all")
	dw5v5data = {}
	for i = 1, 50 do
		data = other.getString(token, "\n", i)
		if data == "" then
			break
		end
		table.insert(dw5v5data,{other.getString(data, ",", 1),other.getString(data, ",", 2),other.atoi(other.getString(data, ",", 3)),other.atoi(other.getString(data, ",", 4))})
	end
	inp:close()
end

function SaveDwPkLog()
	local out = io.open("./data/ablua/npc/duanwei/pk.bin", "wb+")
	
	for i = 1, table.getn(pkdwdata) do
		token = pkdwdata[i][1] .. "," .. pkdwdata[i][2] .. "," .. pkdwdata[i][3] .. "\n"
		out:write(token)
	end
	
	out:close()
end

function ReloadDwPkLog()
	local inp = io.open("./data/ablua/npc/duanwei/pk.bin", "rb")
	local token = inp:read("*all")
	pkdwdata = {}
	for i = 1, 10 do
		data = other.getString(token, "\n", i)
		if data == "" then
			break
		end
		table.insert(pkdwdata,{other.getString(data, ",", 1),other.getString(data, ",", 2),other.atoi(other.getString(data, ",", 3))})
	end
	inp:close()
end

function getDwType(charaindex)
	for i=1,table.getn(dwtitledata) do
		if char.getInt(charaindex,"段位积分") >= dwtitledata[i][2] and char.getInt(charaindex,"段位积分") <= dwtitledata[i][3] then
			return math.floor((i-1)/5) + 1
		end
	end
	return 0
end

function getDwData(charaindex)
	if char.getInt(charaindex,"段位积分") > 250 then
		for j=1,5 do
			if char.getChar(charaindex,"账号") == dw1v1data[j][1] and char.getChar(charaindex,"名字") == dw1v1data[j][2] then
				return 6
			end
		end
	end
	for i=1,table.getn(dwtitledata) do
		if char.getInt(charaindex,"段位积分") >= dwtitledata[i][2] and char.getInt(charaindex,"段位积分") <= dwtitledata[i][3] then
			return math.floor((i-1)/5) + 1
		end
	end
	return 0
end

function sortPointTimeDsc(a, b)
	if a[3] == b[3] then
		if a[4] == b[4] then
			return a[1] < b[1]
		else
			return a[4] < b[4]
		end
	else
		return a[3] > b[3]
	end
end

function UpdateDwPaiMing(cdkey,name,point,pktime,dwtype)
	if dwtype == 1 then
		ReloadDw1v1Log()
		local zhaotype = 0
		for i=1,table.getn(dw1v1data) do
			if dw1v1data[i][1] ~= "" then
				if dw1v1data[i][1] == cdkey then
					dw1v1data[i][2] = name
					dw1v1data[i][3] = point
					dw1v1data[i][4] = pktime
					zhaotype = 1
					break
				end
			else
				if point > 0 then
					dw1v1data[i][1] = cdkey
					dw1v1data[i][2] = name
					dw1v1data[i][3] = point
					dw1v1data[i][4] = pktime
					zhaotype = 1
				end
				break
			end
		end
		if zhaotype == 0 and point > 0 then
			table.insert(dw1v1data,{cdkey,name,point,pktime})
			zhaotype = 1
		end
		if zhaotype == 1 then
			table.sort(dw1v1data, sortPointTimeDsc)
			if point <= 0 then
				for i=1,table.getn(dw1v1data) do
					if dw1v1data[i][1] ~= "" then
						if dw1v1data[i][1] == cdkey then
							dw1v1data[i][1] = ""
							dw1v1data[i][2] = ""
							dw1v1data[i][3] = 0
							dw1v1data[i][4] = 0
							break
						end
					end
				end
			end
			SaveDw1v1Log()
		end
	elseif dwtype == 5 then
		ReloadDw5v5Log()
		local zhaotype = 0
		for i=1,table.getn(dw5v5data) do
			if dw5v5data[i][1] ~= "" then
				if dw5v5data[i][1] == cdkey then
					dw5v5data[i][2] = name
					dw5v5data[i][3] = point
					dw5v5data[i][4] = pktime
					zhaotype = 1
					break
				end
			else
				if point > 0 then
					dw5v5data[i][1] = cdkey
					dw5v5data[i][2] = name
					dw5v5data[i][3] = point
					dw5v5data[i][4] = pktime
					zhaotype = 1
				end
				break
			end
		end
		if zhaotype == 0 and point > 0 then
			table.insert(dw5v5data,{cdkey,name,point,pktime})
			zhaotype = 1
		end
		if zhaotype == 1 then
			table.sort(dw5v5data, sortPointTimeDsc)
			if point <= 0 then
				for i=1,table.getn(dw5v5data) do
					if dw5v5data[i][1] ~= "" then
						if dw5v5data[i][1] == cdkey then
							dw5v5data[i][1] = ""
							dw5v5data[i][2] = ""
							dw5v5data[i][3] = 0
							dw5v5data[i][4] = 0
							break
						end
					end
				end
			end
			SaveDw5v5Log()
		end
	end
end

function otherUpdateDwPaiMing(charaindex)
	if char.check(charaindex) == 1 then
		UpdateDwPaiMing(char.getChar(charaindex,"账号"),char.getChar(charaindex,"名字"),char.getInt(charaindex,"段位积分"),other.time(),char.getInt(charaindex,"段位模式"))
	end
	return 0
end

function DwAutoPkBattleFinish( charaindex )
	parameter = {charaindex}
	if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
		local koupoint = 2
		if char.getInt(charaindex,"段位模式") == 1 then
			if getDwType(charaindex) - char.getWorkInt(charaindex,"自动PK点") > 0 then
				koupoint = koupoint + (getDwType(charaindex) - char.getWorkInt(charaindex,"自动PK点"))
				char.setWorkInt(charaindex,"自动PK点",0)
			end
		end
		if getDwType(charaindex) == 1 then
			koupoint = 1
		end
		char.setInt(charaindex, "段位积分", char.getInt(charaindex, "段位积分") - koupoint)
		if char.getInt(charaindex,"段位积分") >= dwdata then
			char.setInt(charaindex, "族战积分", math.max(char.getInt(charaindex, "族战积分") - zdnum[char.getInt(charaindex,"段位模式")],0))
			if koupoint - 2 > 0 then
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛失败，由于您高对手[" .. koupoint - 2 .. "]个段位，段位积分-" .. koupoint .. " 战点-" .. zdnum[char.getInt(charaindex,"段位模式")] .. "", "随机色")
			else
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛失败，段位积分-" .. koupoint .. " 战点-" .. zdnum[char.getInt(charaindex,"段位模式")] .. "", "随机色")
			end
		else
			if koupoint - 2 > 0 then
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛失败，由于您高对手[" .. koupoint - 2 .. "]个段位，段位积分-" .. koupoint .. "", "随机色")
			else
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛失败，段位积分-" .. koupoint .. "", "随机色")
			end
		end
		char.setWorkInt(charaindex,"段位临时",0)
		char.setInt(charaindex,"段位时间",other.time())
		UpdateDwPaiMing(char.getChar(charaindex,"账号"),char.getChar(charaindex,"名字"),char.getInt(charaindex,"段位积分"),other.time(),char.getInt(charaindex,"段位模式"))
	else
		local jiapoint = 2
		if char.getInt(charaindex,"段位模式") == 1 then
			if char.getWorkInt(charaindex,"自动PK点") - getDwType(charaindex) > 0 then
				jiapoint = jiapoint + (char.getWorkInt(charaindex,"自动PK点") - getDwType(charaindex))
				char.setWorkInt(charaindex,"自动PK点",0)
			end
		end
		char.setInt(charaindex, "段位积分", char.getInt(charaindex, "段位积分") + jiapoint)
		if char.getInt(charaindex,"段位积分") >= dwdata then
			char.setInt(charaindex, "族战积分", char.getInt(charaindex, "族战积分") + zdnum[char.getInt(charaindex,"段位模式")])
			if jiapoint - 2 > 0 then
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛获胜，由于对手高您[" .. jiapoint - 2 .. "]个段位，段位积分+" .. jiapoint .. " 战点+" .. zdnum[char.getInt(charaindex,"段位模式")] .. "", "随机色")
			else
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛获胜，段位积分+" .. jiapoint .. " 战点+" .. zdnum[char.getInt(charaindex,"段位模式")] .. "", "随机色")
			end
		else
			if jiapoint - 2 > 0 then
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛获胜，由于对手高您[" .. jiapoint - 2 .. "]个段位，段位积分+" .. jiapoint .. "", "随机色")
			else
				char.TalkToCli(charaindex, -1, "[排位结果]您的本轮比赛获胜，段位积分+" .. jiapoint .. "", "随机色")
			end
		end
		if char.getWorkChar(charaindex,"NPC临时1") ~= "" then
			if table.getn(pkdwdata) >= 15 then
				table.remove(pkdwdata)
			end
			table.insert(pkdwdata,1,{char.getChar(charaindex,"名字"),char.getWorkChar(charaindex,"NPC临时1"),other.time()})
			SaveDwPkLog()
		end
		local wangtype = 0
		local newwangtype = 0
		if char.getInt(charaindex,"段位积分") > 250 then
			if char.getInt(charaindex,"段位模式") == 1 then
				for j=1,math.min(table.getn(dw1v1data),5) do
					if char.getChar(charaindex,"账号") == dw1v1data[j][1] and char.getChar(charaindex,"名字") == dw1v1data[j][2] then
						wangtype = 1
						break
					end
				end
			elseif char.getInt(charaindex,"段位模式") == 5 then
				for j=1,math.min(table.getn(dw5v5data),10) do
					if char.getChar(charaindex,"账号") == dw5v5data[j][1] and char.getChar(charaindex,"名字") == dw5v5data[j][2] then
						wangtype = 1
						break
					end
				end
			end
		end
		char.setWorkInt(charaindex,"段位临时",0)
		char.setInt(charaindex,"段位时间",other.time())
		UpdateDwPaiMing(char.getChar(charaindex,"账号"),char.getChar(charaindex,"名字"),char.getInt(charaindex,"段位积分"),other.time(),char.getInt(charaindex,"段位模式"))
		if char.getInt(charaindex,"段位积分") > 250 and wangtype == 0 then
			if char.getInt(charaindex,"段位模式") == 1 then
				for j=1,math.min(table.getn(dw1v1data),5) do
					if char.getChar(charaindex,"账号") == dw1v1data[j][1] and char.getChar(charaindex,"名字") == dw1v1data[j][2] then
						newwangtype = 1
						break
					end
				end
			elseif char.getInt(charaindex,"段位模式") == 5 then
				for j=1,math.min(table.getn(dw5v5data),10) do
					if char.getChar(charaindex,"账号") == dw5v5data[j][1] and char.getChar(charaindex,"名字") == dw5v5data[j][2] then
						newwangtype = 1
						break
					end
				end
			end
		end
		if newwangtype == 0 then
			for i=6,table.getn(dwtitledata),5 do
				if char.getInt(charaindex, "段位积分") >= dwtitledata[i][2] and char.getInt(charaindex, "段位积分") <= dwtitledata[i][3] and char.getInt(charaindex, "段位积分") - 2 < dwtitledata[i][2] then
					char.talkToServer(-1,"[大陆新闻]恭喜玩家[" .. char.getChar(charaindex,"名字") .. "]，晋段[" .. string.sub(dwtitledata[i][1],1,8) .. "]成功，实力选手诞生。","随机色")
					break
				end
			end
		else
			char.talkToServer(-1,"[大陆新闻]玩家[" .. char.getChar(charaindex,"名字") .. "]的实力已经突破天际，达成最强王者，全服都在他脚下颤抖。","随机色")
			char.talkToServer(-1,"[大陆新闻]玩家[" .. char.getChar(charaindex,"名字") .. "]的实力已经突破天际，达成最强王者，全服都在他脚下颤抖。","随机色")
			char.talkToServer(-1,"[大陆新闻]玩家[" .. char.getChar(charaindex,"名字") .. "]的实力已经突破天际，达成最强王者，全服都在他脚下颤抖。","随机色")
		end
	end
	
end

function StartDwPk(PkType,DwType)
	local tempi = {}
	if PkType == 1 then
		for i=1,10 do
			if char.check(pkindex[i][DwType]) == 1 then
				if char.getInt(pkindex[i][DwType],"地图号") == pkfloorid and char.getChar(pkindex[i][DwType],"名字") == pkcharname[i][DwType] and char.getWorkInt(pkindex[i][DwType],"组队") == 0 and char.getWorkInt(pkindex[i][DwType], "战斗") == 0 and char.getInt(pkindex[i][DwType], "段位积分") > -5 and char.getWorkInt(pkindex[i][DwType],"段位临时") == 2 then
					if DwType == 2 and char.getInt(pkindex[i][DwType],"族战积分") < zdnum[PkType] then
						pkindex[i][DwType] = -1
						pkcharname[i][DwType] = ""
					else
						table.insert(tempi,i)
					end
				else
					if char.getWorkInt(pkindex[i][DwType],"段位临时") == 2 then
						char.setWorkInt(pkindex[i][DwType],"段位临时",0)
					end
					pkindex[i][DwType] = -1
					pkcharname[i][DwType] = ""
				end
			end
		end
		if table.getn(tempi) > 1 then
			for i=1,math.floor(table.getn(tempi)/2) do
				char.setWorkInt(pkindex[tempi[i]][DwType],"段位临时",1)
				char.setWorkInt(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"段位临时",1)
				local tempx = math.random(3,12)
				local tempy = math.random(6,18)
				char.WarpToSpecificPoint(pkindex[tempi[i]][DwType],2005,tempx,tempy)
				char.WarpToSpecificPoint(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],2005,tempx,tempy + 1)
				battleindex = battle.CreateVsPlayer(pkindex[tempi[i]][DwType], pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType])
				if battleindex > -1 then
					char.setWorkChar(pkindex[tempi[i]][DwType],"NPC临时1",char.getChar(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"名字"))
					char.setWorkChar(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"NPC临时1",char.getChar(pkindex[tempi[i]][DwType],"名字"))
					char.setWorkInt(pkindex[tempi[i]][DwType],"自动PK点",getDwType(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType]))
					char.setWorkInt(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"自动PK点",getDwType(pkindex[tempi[i]][DwType]))
					dwname1 = ""
					dwname2 = ""
					for j=1,table.getn(dwtitledata) do
						if char.getInt(pkindex[tempi[i]][DwType],"段位积分") >= dwtitledata[j][2] and char.getInt(pkindex[tempi[i]][DwType],"段位积分") <= dwtitledata[j][3] then
							dwname1 = dwtitledata[j][1]
							break
						end
					end
					for j=1,table.getn(dwtitledata) do
						if char.getInt(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"段位积分") >= dwtitledata[j][2] and char.getInt(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"段位积分") <= dwtitledata[j][3] then
							dwname2 = dwtitledata[j][1]
							break
						end
					end
					
					char.TalkToCli(pkindex[tempi[i]][DwType], -1, "[温馨提示]您本轮排位比赛已经开始，对手是[" .. char.getChar(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"名字") .. "][" .. dwname2 .. "]，碾碎他！", "随机色")
					char.TalkToCli(pkindex[tempi[i]][DwType], -1, "[友情提示]如未能进入战斗画面，请登出游戏后重新进入游戏即可重连比赛。", "随机色")
					char.TalkToCli(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType], -1, "[温馨提示]您本轮排位比赛已经开始，对手是[" .. char.getChar(pkindex[tempi[i]][DwType],"名字") .. "][" .. dwname1 .. "]，碾碎他！", "随机色")
					char.TalkToCli(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType], -1, "[友情提示]如未能进入战斗画面，请登出游戏后重新进入游戏即可重连比赛。", "随机色")
					local tempbuff = {"普通","高端"}
					char.talkToServer(-1, "[" .. tempbuff[DwType] .. "匹配]段位比赛[1v1]模式 [ " .. char.getChar(pkindex[tempi[i]][DwType],"名字") .. " vs " .. char.getChar(pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType],"名字") .. " ] 正在医院[" .. tempx .. "." .. tempy .. "]进行中，快来围观吧。", "随机色")
					pkindex[tempi[i]][DwType] = -1
					pkcharname[tempi[i]][DwType] = ""
					pkindex[tempi[table.getn(tempi) - (i - 1)]][DwType] = -1
					pkcharname[tempi[table.getn(tempi) - (i - 1)]][DwType] = ""
					battle.setLUAFunctionPointer(battleindex, "结束事件", "DwAutoPkBattleFinish", "")
				end
			end
			if table.getn(tempi)%2 ~= 0 then
				char.TalkToCli(pkindex[tempi[math.floor(table.getn(tempi)/2 + 1)]][DwType], -1, "[温馨提示]您在本轮排位匹配单数轮空，已自动将您列入下轮匹配，请耐心等待或取消匹配。", "随机色")
			end
		elseif table.getn(tempi) == 1 then
			char.TalkToCli(pkindex[tempi[1]][DwType], -1, "[温馨提示]本轮排位匹配超时，已自动将您列入下轮匹配，请耐心等待或取消匹配。", "随机色")
		end
		looptime[PkType][DwType] = other.time()
		looptimecnt[PkType][DwType] = 180
	elseif PkType == 5 then
		for i=1,10 do
			local qingtype = 0
			for j=1,5 do
				if char.check(pkindex5[i][DwType][j]) ~= 1 then
					for jj=1,5 do
						if char.check(pkindex5[i][DwType][jj]) == 1 then
							char.setWorkInt(pkindex5[i][DwType][jj],"段位临时",0)
						end
					end
					pkindex5[i][DwType] = {-1,-1,-1,-1,-1}
					pkcharname5[i][DwType] = {"","","","",""}
					qingtype = 1
					break
				else
					if char.getInt(pkindex5[i][DwType][j],"地图号") ~= pkfloorid or char.getChar(pkindex5[i][DwType][j],"名字") ~= pkcharname5[i][DwType][j] or char.getWorkInt(pkindex5[i][DwType][j],"组队") == 0 or char.getWorkInt(pkindex5[i][DwType][j], "战斗") ~= 0 or char.getInt(pkindex5[i][DwType][j], "段位积分") <= -5 or char.getWorkInt(pkindex5[i][DwType][j],"段位临时") ~= 2 then
						for jj=1,5 do
							if char.check(pkindex5[i][DwType][jj]) == 1 then
								char.setWorkInt(pkindex5[i][DwType][jj],"段位临时",0)
							end
						end
						pkindex5[i][DwType] = {-1,-1,-1,-1,-1}
						pkcharname5[i][DwType] = {"","","","",""}
						qingtype = 1
						break
					else
						if DwType == 2 and char.getInt(pkindex5[i][DwType][j],"族战积分") < zdnum[PkType] then
							for jj=1,5 do
								if char.check(pkindex5[i][DwType][jj]) == 1 then
									char.setWorkInt(pkindex5[i][DwType][jj],"段位临时",0)
								end
							end
							pkindex5[i][DwType] = {-1,-1,-1,-1,-1}
							pkcharname5[i][DwType] = {"","","","",""}
							qingtype = 1
							break
						end
					end
				end
			end
			if qingtype == 0 then
				table.insert(tempi,i)
			end
		end
		if table.getn(tempi) > 1 then
			for i=1,math.floor(table.getn(tempi)/2) do
				local tempxa = {-1,-1,-1,-1,-1}
				local tempya = {-1,-1,-1,-1,-1}
				local tempxb = {-1,-1,-1,-1,-1}
				local tempyb = {-1,-1,-1,-1,-1}
				if math.random(100) <= 50 then
					local ty = math.random(4,14)
					tempxa = {16,17,18,19,20}
					tempya = {ty,ty,ty,ty,ty}
					tempxb = {16,17,18,19,20}
					tempyb = {ty + 1,ty + 1,ty + 1,ty + 1,ty + 1}
				else
					local tx = math.random(22,26)
					local ty = 8
					if math.random(50) > 25 then
						ty = 13
					end
					tempxa = {tx,tx,tx,tx,tx}
					tempya = {ty,ty - 1,ty - 2,ty - 3,ty - 4}
					tempxb = {tx - 1,tx - 1,tx - 1,tx - 1,tx - 1}
					tempyb = {ty,ty - 1,ty - 2,ty - 3,ty - 4}
				end
				for j=1,5 do
					char.setWorkInt(pkindex5[tempi[i]][DwType][j],"段位临时",1)
					char.setWorkInt(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][j],"段位临时",1)
					char.setWorkChar(pkindex5[tempi[i]][DwType][j],"NPC临时1","")
					char.setWorkChar(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][j],"NPC临时1","")
					char.WarpToSpecificPoint(pkindex5[tempi[i]][DwType][j],2005,tempxa[j],tempya[j])
					char.WarpToSpecificPoint(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][j],2005,tempxb[j],tempyb[j])
				end
				battleindex = battle.CreateVsPlayer(pkindex5[tempi[i]][DwType][1], pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][1])
				if battleindex > -1 then
					char.setWorkChar(pkindex5[tempi[i]][DwType][1],"NPC临时1",char.getChar( pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][1],"名字"))
					char.setWorkChar(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][1],"NPC临时1",char.getChar(pkindex5[tempi[i]][DwType][1],"名字"))
					dwname1 = ""
					dwname2 = ""
					for j=1,table.getn(dwtitledata) do
						if char.getInt(pkindex5[tempi[i]][DwType][1],"段位积分") >= dwtitledata[j][2] and char.getInt(pkindex5[tempi[i]][DwType][1],"段位积分") <= dwtitledata[j][3] then
							dwname1 = dwtitledata[j][1]
							break
						end
					end
					for j=1,table.getn(dwtitledata) do
						if char.getInt(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][1],"段位积分") >= dwtitledata[j][2] and char.getInt(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][1],"段位积分") <= dwtitledata[j][3] then
							dwname2 = dwtitledata[j][1]
							break
						end
					end
					for j=1,5 do
						char.TalkToCli(pkindex5[tempi[i]][DwType][j], -1, "[温馨提示]您本轮排位比赛已经开始，对手是[" .. char.getChar(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][1],"名字") .. "][" .. dwname2 .. "]，碾碎他！", "随机色")
						char.TalkToCli(pkindex5[tempi[i]][DwType][j], -1, "[友情提示]如未能进入战斗画面，请登出游戏后重新进入游戏即可重连比赛。", "随机色")
						char.TalkToCli(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][j], -1, "[温馨提示]您本轮排位比赛已经开始，对手是[" .. char.getChar(pkindex5[tempi[i]][DwType][1],"名字") .. "][" .. dwname1 .. "]，碾碎他！", "随机色")
						char.TalkToCli(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][j], -1, "[友情提示]如未能进入战斗画面，请登出游戏后重新进入游戏即可重连比赛。", "随机色")
					end
					local tempbuff = {"普通","高端"}
					char.talkToServer(-1, "[" .. tempbuff[DwType] .. "匹配]段位比赛[5v5]模式 [ " .. char.getChar(pkindex5[tempi[i]][DwType][1],"名字") .. " vs " .. char.getChar(pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType][1],"名字") .. " ] 正在医院[" .. tempxa[1] .. "." .. tempya[2] .. "]进行中，快来围观吧。", "随机色")
					pkindex5[tempi[i]][DwType] = {-1,-1,-1,-1,-1}
					pkcharname5[tempi[i]][DwType] = {"","","","",""}
					pkindex5[tempi[table.getn(tempi) - (i - 1)]][DwType] = {-1,-1,-1,-1,-1}
					pkcharname5[tempi[table.getn(tempi) - (i - 1)]][DwType] = {"","","","",""}
					battle.setLUAFunctionPointer(battleindex, "结束事件", "DwAutoPkBattleFinish", "")
				end
			end
			if table.getn(tempi)%2 ~= 0 then
				for j=1,5 do
					char.TalkToCli(pkindex5[tempi[math.floor(table.getn(tempi)/2 + 1)]][DwType][j], -1, "[温馨提示]您在本轮排位匹配单数轮空，已自动将您列入下轮匹配，请耐心等待或取消匹配。", "随机色")
				end
			end
		elseif table.getn(tempi) == 1 then
			for j=1,5 do
				char.TalkToCli(pkindex5[tempi[1]][DwType][j], -1, "[温馨提示]本轮排位匹配超时，已自动将您列入下轮匹配，请耐心等待或取消匹配。", "随机色")
			end
		end
		looptime[PkType - 3][DwType] = other.time()
		looptimecnt[PkType - 3][DwType] = 180
	end
end

function JoinDwPk(meindex,talkerindex,type)
	if type == 1 then
		if char.getWorkInt(talkerindex,"组队") > 0 then
			char.TalkToCli(talkerindex, -1, "[温馨提示]组队模式下不能进行1V1匹配，请解散组队后找我。", "随机色")
			return
		end
		if char.getInt(talkerindex,"段位模式") > 1 then
			char.TalkToCli(talkerindex, -1, "[温馨提示]您的段位PK模式是5V5，不能进行1V1匹配，请组队后找我。", "随机色")
			return
		end
		if char.getInt(talkerindex,"段位积分") <= -5 then
			char.TalkToCli(talkerindex, -1, "[温馨提示]您的段位积分低于-5分，不能进行段位比赛，医院娱乐2-4小时可增加1点积分。", "随机色")
			return
		end
		if char.getInt(talkerindex,"段位积分") >= dwdata then
			if char.getInt(talkerindex, "族战积分") < zdnum[type] then
				char.TalkToCli(talkerindex, -1, "[温馨提示]您的战点不足" .. zdnum[type] .. "点，无法参加黄金以上排位，请积极参加族战哦！", "随机色")
				return
			end
		end
		if table.getn(deldwdata) > 0 then
			local qingdata = {}
			for ii=1,table.getn(deldwdata) do
				if deldwdata[ii][2] + 5 * 60 < other.time() then
					table.insert(qingdata,1,ii)
				end
			end
			if table.getn(qingdata) > 0 then
				for ii=1,table.getn(qingdata) do
					table.remove(deldwdata,qingdata[ii])
				end
			end
		end
		if table.getn(deldwdata) > 0 then
			for ii=1,table.getn(deldwdata) do
				if deldwdata[ii][2] + 5 * 60 >= other.time() and char.getChar(talkerindex,"账号") == deldwdata[ii][1] then
					local delbuff = "由于您刚取消了排位比赛，暂时不能进行排位比赛，剩余时间："
					local deltime = deldwdata[ii][2] + 5 * 60 - other.time()
					if deltime >= 60 then
						delbuff = delbuff .. math.floor(deltime/60) .. "分" .. deltime % 60 .. "秒。"
					else
						delbuff = delbuff .. deltime .. "秒。"
					end
					char.TalkToCli(talkerindex, -1, delbuff, "随机色")
					return
				end
			end
		end
			
		local zhaoj = {0,0}
		local ren = {0,0}
		for j=1,10 do
			for i=1,2 do
				if char.check(pkindex[j][i]) ~= 1 then
					pkindex[j][i] = -1
					pkcharname[j][i] = ""
					if zhaoj[i] == 0 then
						zhaoj[i] = j
					end
				else
					if char.getInt(pkindex[j][i],"地图号") ~= pkfloorid or char.getChar(pkindex[j][i],"名字") ~= pkcharname[j][i] or char.getWorkInt(pkindex[j][i],"组队") > 0 or char.getWorkInt(pkindex[j][i], "战斗") ~= 0 or char.getInt(pkindex[j][i],"段位积分") <= -5 or char.getWorkInt(pkindex[j][i],"段位临时") ~= 2 then
						if char.getWorkInt(pkindex[j][i],"段位临时") == 2 then
							char.setWorkInt(pkindex[j][i],"段位临时",0)
						end
						pkindex[j][i] = -1
						pkcharname[j][i] = ""
						if zhaoj[i] == 0 then
							zhaoj[i] = j
						end
					else
						ren[i] = ren[i] + 1
						if pkindex[j][i] == talkerindex then
							--char.TalkToCli(talkerindex, -1, "友情提示：目前正在进行匹配，请耐心等待。", "随机色")
							return
						end
					end
				end
			end
		end
		local pktype = 1
		if char.getInt(talkerindex,"段位积分") >= dwdata then
			pktype = 2
		end
		if zhaoj[pktype] > 0 then
			pkindex[zhaoj[pktype]][pktype] = talkerindex
			pkcharname[zhaoj[pktype]][pktype] = char.getChar(talkerindex,"名字")
			ren[pktype] = ren[pktype] + 1
			char.setInt(talkerindex,"段位模式",1)
			char.setWorkInt(talkerindex,"段位临时",2)
			if pktype == 1 then
				char.talkToServer(-1, "[普通匹配]正在进行黄金以下[1v1]排位/目前参赛选手[" .. ren[pktype] .. "]名/要参与匹配请移步医院[13.12]", "随机色")
			else
				char.talkToServer(-1, "[高端匹配]正在进行黄金以上[1v1]排位/目前参赛选手[" .. ren[pktype] .. "]名/要参与匹配请移步医院[13.12]", "随机色")
			end
			if ren[pktype] == 2 then
				looptime[1][pktype] = other.time()
				looptimecnt[1][pktype] = math.random(20,40)
			elseif ren[pktype] == 4 then
				looptime[1][pktype] = other.time()
				looptimecnt[1][pktype] = math.random(15,30)
			elseif ren[pktype] == 6 then
				looptime[1][pktype] = other.time()
				looptimecnt[1][pktype] = math.random(10,20)
			elseif ren[pktype] == 8 then
				looptime[1][pktype] = other.time()
				looptimecnt[1][pktype] = math.random(5,10)
			elseif ren[pktype] == 3 or ren[pktype] == 5 or ren[pktype] == 7 or ren[pktype] == 9 then
				looptimecnt[1][pktype] = looptimecnt[1][pktype] + 15
			elseif ren[pktype] == 10 then
				StartDwPk(1,pktype)
			end
		else
			StartDwPk(1,pktype)
			zhaoj = {0,0}
			ren = {0,0}
			for j=1,10 do
				for i=1,2 do
					if char.check(pkindex[j][i]) ~= 1 then
						pkindex[j][i] = -1
						pkcharname[j][i] = ""
						if zhaoj[i] == 0 then
							zhaoj[i] = j
						end
					else
						if char.getInt(pkindex[j][i],"地图号") ~= pkfloorid or char.getChar(pkindex[j][i],"名字") ~= pkcharname[j][i] or char.getWorkInt(pkindex[j][i],"组队") > 0 or char.getWorkInt(pkindex[j][i], "战斗") ~= 0 or char.getInt(pkindex[j][i],"段位积分") <= -5 or char.getWorkInt(pkindex[j][i],"段位临时") ~= 2 then
							if char.getWorkInt(pkindex[j][i],"段位临时") == 2 then
								char.setWorkInt(pkindex[j][i],"段位临时",0)
							end
							pkindex[j][i] = -1
							pkcharname[j][i] = ""
							if zhaoj[i] == 0 then
								zhaoj[i] = j
							end
						else
							ren[i] = ren[i] + 1
							if pkindex[j][i] == talkerindex then
								--char.TalkToCli(talkerindex, -1, "友情提示：目前正在进行匹配，请耐心等待。", "随机色")
								return
							end
						end
					end
				end
			end
			pkindex[zhaoj[pktype]][pktype] = talkerindex
			pkcharname[zhaoj[pktype]][pktype] = char.getChar(talkerindex,"名字")
			ren[pktype] = ren[pktype] + 1
			char.setInt(talkerindex,"段位模式",1)
			char.setWorkInt(talkerindex,"段位临时",2)
			if pktype == 1 then
				char.talkToServer(-1, "[普通匹配]正在进行黄金以下[1v1]排位/目前参赛选手[" .. ren[pktype] .. "]名/要参与匹配请移步医院[13.12]", "随机色")
			else
				char.talkToServer(-1, "[高端匹配]正在进行黄金以上[1v1]排位/目前参赛选手[" .. ren[pktype] .. "]名/要参与匹配请移步医院[13.12]", "随机色")
			end
		end
	elseif type == 5 then
		if char.getWorkInt(talkerindex,"组队") ~= 1 then
			char.TalkToCli(talkerindex, -1, "单人和队员不能进行5V5匹配。", "随机色")
			return
		end
		local pktype = 1
		if char.getInt(talkerindex,"段位积分") >= dwdata then
			pktype = 2
		end
		for i=1,5 do
			tempindex = char.getWorkInt(talkerindex,"队员" .. i)
			if char.check(tempindex) ~= 1 then
				char.TalkToCli(talkerindex, -1, "您的队伍不满5人，不能进行5V5匹配。", "随机色")
				return
			end
			if char.getInt(tempindex,"段位模式") ~= 0 and char.getInt(tempindex,"段位模式") ~= 5 then
				char.TalkToCli(talkerindex, -1, "您的队伍中有队员段位PK模式是1V1，不能进行5V5匹配。", "随机色")
				return
			end
			if char.getInt(tempindex,"段位模式") == 0 then
				char.TalkToCli(talkerindex, -1, "您的队伍中有队员还没有报名5V5段位比赛，不能进行5V5匹配。", "随机色")
				return
			end
			if pktype == 1 then
				if char.getInt(tempindex,"段位积分") <= -5 then
					char.TalkToCli(talkerindex, -1, "您的队伍中有人的段位积分过低，不能进行5V5匹配。", "随机色")
					return
				end
				if char.getInt(tempindex,"段位积分") >= dwdata then
					char.TalkToCli(talkerindex, -1, "您的队伍中有人的段位太高，不能进行5V5匹配。", "随机色")
					return
				end
			else
				if char.getInt(tempindex,"段位积分") < dwdata then
					char.TalkToCli(talkerindex, -1, "您的队伍中有人的段位太低，不能进行5V5匹配。", "随机色")
					return
				end
				if char.getInt(tempindex,"族战积分") < zdnum[type] then
					if char.getWorkInt(tempindex,"组队") == 1 then
						char.TalkToCli(talkerindex, -1, "[温馨提示]您的战点不足" .. zdnum[type] .. "点，无法参加黄金以上排位，请积极参加族战哦！", "随机色")
					else
						char.TalkToCli(talkerindex, -1, "[温馨提示]您队伍中的[" .. char.getChar(tempindex,"名字") .. "]战点不足" .. zdnum[type] .. "点，无法参加黄金以上排位，请积极参加族战哦！", "随机色")
					end
					return
				end
			end
		end
		if table.getn(deldwdata) > 0 then
			local qingdata = {}
			for ii=1,table.getn(deldwdata) do
				if deldwdata[ii][2] + 5 * 60 < other.time() then
					table.insert(qingdata,1,ii)
				end
			end
			if table.getn(qingdata) > 0 then
				for ii=1,table.getn(qingdata) do
					table.remove(deldwdata,qingdata[ii])
				end
			end
		end
		if table.getn(deldwdata) > 0 then
			for ii=1,table.getn(deldwdata) do
				if deldwdata[ii][2] + 5 * 60 >= other.time() and char.getChar(talkerindex,"账号") == deldwdata[ii][1] then
					local delbuff = "由于您刚取消了排位比赛，暂时不能进行排位比赛，剩余时间："
					local deltime = deldwdata[ii][2] + 5 * 60 - other.time()
					if deltime >= 60 then
						delbuff = delbuff .. math.floor(deltime/60) .. "分" .. deltime % 60 .. "秒。"
					else
						delbuff = delbuff .. deltime .. "秒。"
					end
					char.TalkToCli(talkerindex, -1, delbuff, "随机色")
					return
				end
			end
		end
		local zhaoj = {0,0}
		local ren = {0,0}
		for k=1,10 do
			for i=1,2 do
				local jishu = 0
				for j=1,5 do
					if char.check(pkindex5[k][i][j]) ~= 1 then
						for jj=1,5 do
							if char.check(pkindex5[k][i][jj]) == 1 then
								char.setWorkInt(pkindex5[k][i][jj],"段位临时",0)
							end
						end
						pkindex5[k][i] = {-1,-1,-1,-1,-1}
						pkcharname5[k][i] = {"","","","",""}
						if zhaoj[i] == 0 then
							zhaoj[i] = k
						end
						break
					else
						if char.getInt(pkindex5[k][i][j],"地图号") ~= pkfloorid or char.getChar(pkindex5[k][i][j],"名字") ~= pkcharname5[k][i][j] or char.getWorkInt(pkindex5[k][i][j],"组队") == 0 or char.getWorkInt(pkindex5[k][i][j], "战斗") ~= 0 or char.getInt(pkindex5[k][i][j],"段位积分") <= -5 or char.getWorkInt(pkindex5[k][i][j],"段位临时") ~= 2 then
							for jj=1,5 do
								if char.check(pkindex5[k][i][jj]) == 1 then
									char.setWorkInt(pkindex5[k][i][jj],"段位临时",0)
								end
							end
							pkindex5[k][i] = {-1,-1,-1,-1,-1}
							pkcharname5[k][i] = {"","","","",""}
							if zhaoj[i] == 0 then
								zhaoj[i] = k
							end
							break
						else
							if jishu == 0 then
								ren[i] = ren[i] + 1
								jishu = 1
							end
							if pkindex5[k][i][1] == talkerindex then
								--char.TalkToCli(talkerindex, -1, "友情提示：目前正在进行匹配，请耐心等待。", "随机色")
								return
							end
						end
					end
				end
			end
		end
		if zhaoj[pktype] > 0 then
			for i=1,5 do
				pkindex5[zhaoj[pktype]][pktype][i] = char.getWorkInt(talkerindex,"队员" .. i)
				pkcharname5[zhaoj[pktype]][pktype][i] = char.getChar(pkindex5[zhaoj[pktype]][pktype][i],"名字")
				char.setInt(pkindex5[zhaoj[pktype]][pktype][i],"段位模式",5)
				char.setWorkInt(pkindex5[zhaoj[pktype]][pktype][i],"段位临时",2)
			end
			ren[pktype] = ren[pktype] + 1
			if pktype == 1 then
				char.talkToServer(-1, "[普通匹配]正在进行黄金以下[5v5]排位/目前参赛选手[" .. ren[pktype] .. "]队/要参与匹配请移步医院[13.12]", "随机色")
			else
				char.talkToServer(-1, "[高端匹配]正在进行黄金以上[5v5]排位/目前参赛选手[" .. ren[pktype] .. "]队/要参与匹配请移步医院[13.12]", "随机色")
			end
			if ren[pktype] == 2 then
				looptime[2][pktype] = other.time()
				looptimecnt[2][pktype] = math.random(20,40)
			elseif ren[pktype] == 4 then
				looptime[2][pktype] = other.time()
				looptimecnt[2][pktype] = math.random(15,30)
			elseif ren[pktype] == 6 then
				looptime[2][pktype] = other.time()
				looptimecnt[2][pktype] = math.random(10,20)
			elseif ren[pktype] == 8 then
				looptime[2][pktype] = other.time()
				looptimecnt[2][pktype] = math.random(5,10)
			elseif ren[pktype] == 3 or ren[pktype] == 5 or ren[pktype] == 7 or ren[pktype] == 9 then
				looptimecnt[2][pktype] = looptimecnt[2][pktype] + 15
			elseif ren[pktype] == 10 then
				StartDwPk(5,pktype)
			end
		else
			StartDwPk(5,pktype)
			zhaoj = {0,0}
			ren = {0,0}
			for k=1,10 do
				for i=1,2 do
					local jishu = 0
					for j=1,5 do
						if char.check(pkindex5[k][i][j]) ~= 1 then
							for jj=1,5 do
								if char.check(pkindex5[k][i][jj]) == 1 then
									char.setWorkInt(pkindex5[k][i][jj],"段位临时",0)
								end
							end
							pkindex5[k][i] = {-1,-1,-1,-1,-1}
							pkcharname5[k][i] = {"","","","",""}
							if zhaoj[i] == 0 then
								zhaoj[i] = k
							end
							break
						else
							if char.getInt(pkindex5[k][i][j],"地图号") ~= pkfloorid or char.getChar(pkindex5[k][i][j],"名字") ~= pkcharname5[k][i][j] or char.getWorkInt(pkindex5[k][i][j],"组队") == 0 or char.getWorkInt(pkindex5[k][i][j], "战斗") ~= 0 or char.getInt(pkindex5[k][i][j],"段位积分") <= -5 or char.getWorkInt(pkindex5[k][i][j],"段位临时") ~= 2 then
								for jj=1,5 do
									if char.check(pkindex5[k][i][jj]) == 1 then
										char.setWorkInt(pkindex5[k][i][jj],"段位临时",0)
									end
								end
								pkindex5[k][i] = {-1,-1,-1,-1,-1}
								pkcharname5[k][i] = {"","","","",""}
								if zhaoj[i] == 0 then
									zhaoj[i] = k
								end
								break
							else
								if jishu == 0 then
									ren[i] = ren[i] + 1
									jishu = 1
								end
								if pkindex5[k][i][1] == talkerindex then
									--char.TalkToCli(talkerindex, -1, "友情提示：目前正在进行匹配，请耐心等待。", "随机色")
									return
								end
							end
						end
					end
				end
			end
			for i=1,5 do
				pkindex5[zhaoj[pktype]][pktype][i] = char.getWorkInt(talkerindex,"队员" .. i)
				pkcharname5[zhaoj[pktype]][pktype][i] = char.getChar(pkindex5[zhaoj[pktype]][pktype][i],"名字")
				char.setInt(pkindex5[zhaoj[pktype]][pktype][i],"段位模式",5)
				char.setWorkInt(pkindex5[zhaoj[pktype]][pktype][i],"段位临时",2)
			end
			ren[pktype] = ren[pktype] + 1
			if pktype == 1 then
				char.talkToServer(-1, "[普通匹配]正在进行黄金以下[5v5]排位/目前参赛选手[" .. ren[pktype] .. "]队/要参与匹配请移步医院[13.12]", "随机色")
			else
				char.talkToServer(-1, "[高端匹配]正在进行黄金以上[5v5]排位/目前参赛选手[" .. ren[pktype] .. "]队/要参与匹配请移步医院[13.12]", "随机色")
			end
		end
	end
end

function getDwPk(talkerindex,type)
	if type == 1 then
		local zhaoj = {0,0}
		for j=1,10 do
			for i=1,2 do
				if char.check(pkindex[j][i]) == 1 then
					if pkindex[j][i] == talkerindex and char.getChar(pkindex[j][i],"名字") == char.getChar(talkerindex,"名字") and char.getChar(pkindex[j][i],"账号") == char.getChar(talkerindex,"账号") then
						return 1
					end
				end
			end
		end
		return 0
	elseif type == 5 then
		local pktype = 1
		if char.getInt(talkerindex,"段位积分") >= dwdata then
			pktype = 2
		end
		local zhaoj = {0,0}
		for k=1,10 do
			for i=1,2 do
				if char.check(pkindex5[k][i][1]) == 1 then
					if pkindex5[k][i][1] == talkerindex and char.getChar(pkindex5[k][i][1],"名字") == char.getChar(talkerindex,"名字") and char.getChar(pkindex5[k][i][1],"账号") == char.getChar(talkerindex,"账号") then
						return 1
					end
				end
			end
		end
		return 0
	end
end

function setDwPk(talkerindex,type)
	if type == 1 then
		local zhaoj = {0,0}
		for j=1,10 do
			for i=1,2 do
				if char.check(pkindex[j][i]) == 1 then
					if pkindex[j][i] == talkerindex and char.getChar(pkindex[j][i],"名字") == char.getChar(talkerindex,"名字") and char.getChar(pkindex[j][i],"账号") == char.getChar(talkerindex,"账号") then
						char.setWorkInt(talkerindex,"段位临时",0)
						pkindex[j][i] = -1
						pkcharname[j][i] = ""
						char.TalkToCli(talkerindex, -1, "[温馨提示]取消排位匹配成功，五分钟内无法进行匹配哦！", "随机色")
						if table.getn(deldwdata) > 0 then
							local qingdata = {}
							for ii=1,table.getn(deldwdata) do
								if deldwdata[ii][2] + 5 * 60 < other.time() then
									table.insert(qingdata,1,ii)
								end
							end
							if table.getn(qingdata) > 0 then
								for ii=1,table.getn(qingdata) do
									table.remove(deldwdata,qingdata[ii])
								end
							end
						else
							table.insert(deldwdata,{char.getChar(talkerindex,"账号"),other.time()})
						end
						return
					end
				end
			end
		end
	elseif type == 5 then
		local pktype = 1
		if char.getInt(talkerindex,"段位积分") >= dwdata then
			pktype = 2
		end
		local zhaoj = {0,0}
		for k=1,10 do
			for i=1,2 do
				if char.check(pkindex5[k][i][1]) == 1 then
					if pkindex5[k][i][1] == talkerindex and char.getChar(pkindex5[k][i][1],"名字") == char.getChar(talkerindex,"名字") and char.getChar(pkindex5[k][i][1],"账号") == char.getChar(talkerindex,"账号") then
						for jj=1,5 do
							if char.check(pkindex5[k][i][jj]) == 1 then
								char.setWorkInt(pkindex5[k][i][jj],"段位临时",0)
							end
						end
						pkindex5[k][i] = {-1,-1,-1,-1,-1}
						pkcharname5[k][i] = {"","","","",""}
						char.TalkToCli(talkerindex, -1, "[温馨提示]取消排位匹配成功，五分钟内无法进行匹配哦！", "随机色")
						if table.getn(deldwdata) > 0 then
							local qingdata = {}
							for ii=1,table.getn(deldwdata) do
								if deldwdata[ii][2] + 5 * 60 < other.time() then
									table.insert(qingdata,1,ii)
								end
							end
							if table.getn(qingdata) > 0 then
								for ii=1,table.getn(qingdata) do
									table.remove(deldwdata,qingdata[ii])
								end
							end
						else
							table.insert(deldwdata,{char.getChar(talkerindex,"账号"),other.time()})
						end
						return
					end
				end
			end
		end
	end
end

function DwPkLoop(meindex)
	if tonumber(os.date("%H",other.time())) < 12 and config.getGameservername() ~= "一起玩石器测试线" then
		pkindex = {{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1}}
		pkindex5 = {{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}}}
		pkcharname = {{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""}}
		pkcharname5 = {{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}}}
	else
		for i=1,2 do
			for j=1,2 do
				if looptime[i][j] + looptimecnt[i][j] <= other.time() then
					if i == 1 then
						StartDwPk(1,j)
					else
						StartDwPk(5,j)
					end
				end
			end
		end
	end
end

function ShowDwReadMe( meindex, talkerindex, page)
		token = "" .. DwReadMe[page]
		
		if maxpage <= 1 then
			button = 8
		elseif page == 1 and page < maxpage then
			button = 40
		elseif page > 1 and page < maxpage then
			button = 56
		elseif page == maxpage then
			button = 24
		end
		lssproto.windows(talkerindex, "宽对话框", button, 1000 + page, char.getWorkInt( meindex, "对象"), token)
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if char.getInt(talkerindex,"段位积分") < 0 then
			char.setInt(talkerindex,"段位积分",0)
		end
		if char.getInt(talkerindex,"段位模式") == 0 then
			token = char.getChar(meindex, "名字") .. "|目前开放1V1排位赛详情\n请看段位比赛说明|3|参加段位比赛|查看段位排名|段位比赛说明"
			lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
		elseif char.getInt(talkerindex,"段位模式") == 1 or char.getInt(talkerindex,"段位模式") == 5 then
			token = char.getChar(meindex, "名字") .. "||5"
			if getDwPk(talkerindex,char.getInt(talkerindex,"段位模式")) == 1 then
				if char.getInt(talkerindex,"段位模式") == 1 then
					token = token .. "|取消单Ｐ匹配"
				else
					token = token .. "|取消团Ｐ匹配"
				end
			else
				if char.getInt(talkerindex,"段位模式") == 1 then
					token = token .. "|进行单Ｐ匹配"
				else
					token = token .. "|进行团Ｐ匹配"
				end
			end
			token = token .."|查看段位排名"
				  .."|查看段位积分"
				  .."|清空段位积分"
				  .."|段位比赛说明"
			lssproto.windows(talkerindex, "新选择框", "取消", 3, char.getWorkInt( meindex, "对象"), token)
		end
	end
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if data == "" then
				return
			end
			local num = other.atoi(data)
			if num < 1 or num > 3 then
				return
			end
			if char.getInt(talkerindex,"段位模式") > 0 then
				return
			end
			if num == 1 then
				token = char.getChar(meindex, "名字") .. "||1|参加 1V1 比赛"
				lssproto.windows(talkerindex, "新选择框", "取消", 1, char.getWorkInt( meindex, "对象"), token)
			elseif num == 2 then
				token = char.getChar(meindex, "名字") .. "||3|查看单Ｐ排名|查看团Ｐ排名|查看比赛战绩"
				lssproto.windows(talkerindex, "新选择框", "取消", 2, char.getWorkInt( meindex, "对象"), token)
			elseif num == 3 then
				ShowDwReadMe(meindex, talkerindex, 1)
			end
		elseif seqno == 1 then
			if data == "" then
				return
			end
			local num = other.atoi(data)
			--if num < 1 or num > 2 then
			--	return
			--end
			if num == 1 then
				if tonumber(os.date("%H", os.time())) < 1 or tonumber(os.date("%H", os.time())) >= 10 then
					token = "您确定要参加1v1段位比赛吗？\n\n1、参加1v1比赛后本赛季均为参加1v1比赛。\n2、如果想切换比赛模式需要清空段位积分。\n3、请谨慎选择比赛模式，切勿选错了哦！\n\n确定选择1v1模式请输入验证码（"
					local rndnum = math.random(101,999)
					token = token .. rndnum .. "）"
					char.setWorkInt(talkerindex,"NPC临时1",rndnum)
					lssproto.windows(talkerindex, "输入框", "确定|取消", 10, char.getWorkInt( meindex, "对象"), token)
				else
					char.TalkToCli(talkerindex, -1, "段位比赛开放时间为每日10:00-1:00。", "随机色")
				end
			--elseif num == 2 then
			--	token = "您确定要参加5v5段位比赛吗？\n\n1、参加5v5比赛后本赛季均为参加1v1比赛。\n2、如果想切换比赛模式需要清空段位积分。\n3、请谨慎选择比赛模式，切勿选错了哦！\n\n确定选择5v5模式请输入验证码（"
			--	local rndnum = math.random(101,999)
			--	token = token .. rndnum .. "）"
			--	char.setWorkInt(talkerindex,"NPC临时1",rndnum)
			--	lssproto.windows(talkerindex, "输入框", "确定|取消", 50, char.getWorkInt( meindex, "对象"), token)
			end
		elseif seqno == 2 then
			if data == "" then
				return
			end
			local num = other.atoi(data)
			if num < 1 or num > 3 then
				return
			end
			if num == 1 then
				if table.getn(dw1v1data) == 0 then
					char.TalkToCli(talkerindex, -1, "暂无排名。", "随机色")
					return
				else
					token = " \n                 「 1v1模式全服段位排名 」\n\n\n"
						 .. "『全服排名』   『玩家名字』     『目前段位』  『段位积分』\n"
					for i=1,math.min(table.getn(dw1v1data),10) do
						if dw1v1data[i][1] ~= "" then
							dwname = ""
							if dw1v1data[i][3] > 250 and i <= 5 then
								dwname = "最强王者"
							else
								for j=1,table.getn(dwtitledata) do
									if dw1v1data[i][3] >= dwtitledata[j][2] and dw1v1data[i][3] <= dwtitledata[j][3] then
										dwname = dwtitledata[j][1]
										break
									end
								end
							end
							tempname = dw1v1data[i][2]
							tempnamelen = math.floor((16 - string.len(tempname))/2)
							tempnamelen2 = (16 - string.len(tempname))%2
							if tempnamelen > 0 then
								for j=1,tempnamelen do
									tempname = " " .. tempname .. " "
								end
							end
							if tempnamelen2 > 0 then
								tempname = tempname .. " "
							end
							token = token .. "\n     " .. string.format("%02d",i) .. "      " .. tempname .. "    " .. dwname .. "       " .. dw1v1data[i][3]
						else
							break
						end
					end
					if table.getn(dw1v1data) > 10 then
						lssproto.windows(talkerindex, "宽对话框", "取消|下一页", 11, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽对话框", "取消", 11, char.getWorkInt( meindex, "对象"), token)
					end
				end
			elseif num == 2 then
				if table.getn(dw5v5data) == 0 then
					char.TalkToCli(talkerindex, -1, "暂无排名。", "随机色")
					return
				else
					token = " \n                 「 5v5模式全服段位排名 」\n\n\n"
						 .. "『全服排名』   『玩家名字』     『目前段位』  『段位积分』\n"
					for i=1,math.min(table.getn(dw5v5data),10) do
						if dw5v5data[i][1] ~= "" then
							dwname = ""
							if dw5v5data[i][3] > 250 then
								dwname = "最强王者"
							else
								for j=1,table.getn(dwtitledata) do
									if dw5v5data[i][3] >= dwtitledata[j][2] and dw5v5data[i][3] <= dwtitledata[j][3] then
										dwname = dwtitledata[j][1]
										break
									end
								end
							end
							tempname = dw5v5data[i][2]
							tempnamelen = math.floor((16 - string.len(tempname))/2)
							tempnamelen2 = (16 - string.len(tempname))%2
							if tempnamelen > 0 then
								for j=1,tempnamelen do
									tempname = " " .. tempname .. " "
								end
							end
							if tempnamelen2 > 0 then
								tempname = tempname .. " "
							end
							token = token .. "\n     " .. string.format("%02d",i) .. "      " .. tempname .. "    " .. dwname .. "       " .. dw5v5data[i][3]
						else
							break
						end
					end
					if table.getn(dw5v5data) > 10 then
						lssproto.windows(talkerindex, "宽对话框", "取消|下一页", 21, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽对话框", "取消", 21, char.getWorkInt( meindex, "对象"), token)
					end
				end
			elseif num == 3 then
				token = "                    「 近十场段位比赛胜负情况 」\n\n"
				if table.getn(pkdwdata) == 0 then
					token = token .. "\n\n\n目前暂无比赛战绩可查询"
				else
					token = token .. "\n  『比赛时间』    『胜利选手』      --      『失败选手』\n\n"
					for i=1,table.getn(pkdwdata) do
						playername1 = pkdwdata[i][1]
						playername2 = pkdwdata[i][2]
						timebuff = os.date("     %H:%M  ",pkdwdata[i][3])
						playername1len = math.floor((16 - string.len(playername1))/2)
						playername2len = math.floor((16 - string.len(playername2))/2)
						playername1len2 = (16 - string.len(playername1))%2
						playername2len2 = (16 - string.len(playername2))%2
						if playername1len > 0 then
							for j=1,playername1len do
								playername1 = " " .. playername1 .. " "
							end
						end
						if playername1len2 > 0 then
							playername1 = playername1 .. " "
						end
						if playername2len > 0 then
							for j=1,playername2len do
								playername2 = " " .. playername2 .. " "
							end
						end
						if playername2len2 > 0 then
							playername2 = playername2 .. " "
						end
						token = token .. timebuff .. "    " .. playername1 .. "    Ko    " .. playername2 .. "\n"
					end
				end
				lssproto.windows(talkerindex, "宽对话框", "取消", 0, -1, token)
			end
		elseif seqno == 3 then
			if data == "" then
				return
			end
			local num = other.atoi(data)
			if num < 1 or num > 5 then
				return
			end
			if num == 1 then
				if tonumber(os.date("%H",other.time())) < 12 and config.getGameservername() ~= "一起玩石器测试线" then
					char.TalkToCli(talkerindex, -1, "[温馨提示]段位比赛匹配时间为12:00-24:00，其余时间休息哦！", "随机色")
					return
				end
				if getDwPk(talkerindex,char.getInt(talkerindex,"段位模式")) == 1 then
					setDwPk(talkerindex,char.getInt(talkerindex,"段位模式"))
				else
					JoinDwPk(meindex,talkerindex,char.getInt(talkerindex,"段位模式"))
				end
			elseif num == 2 then
				token = char.getChar(meindex, "名字") .. "||3|查看单Ｐ排名|查看团Ｐ排名|查看比赛战绩"
				lssproto.windows(talkerindex, "新选择框", "取消", 2, char.getWorkInt( meindex, "对象"), token)
			elseif num == 3 then
				token = "\n                「 自身段位查询 」\n\n"
				if char.getInt(talkerindex,"段位积分") < 10 then
					token = token .. "Ps:您的积分小于10 医院娱乐2-4小时增加1点\n\n"
				end	
				token = token .. "          您目前的段位积分：" .. char.getInt(talkerindex,"段位积分")
					 .. "\n          您目前的段位模式：" .. char.getInt(talkerindex,"段位模式") .. "v" .. char.getInt(talkerindex,"段位模式")
				local newwangtype = 0
				if char.getInt(talkerindex,"段位积分") > 250 then
					if char.getInt(talkerindex,"段位模式") == 1 then
						for j=1,math.min(table.getn(dw1v1data),5) do
							if char.getChar(talkerindex,"账号") == dw1v1data[j][1] and char.getChar(talkerindex,"名字") == dw1v1data[j][2] then
								newwangtype = 1
								break
							end
						end
					elseif char.getInt(talkerindex,"段位模式") == 5 then
						for j=1,math.min(table.getn(dw5v5data),10) do
							if char.getChar(talkerindex,"账号") == dw5v5data[j][1] and char.getChar(talkerindex,"名字") == dw5v5data[j][2] then
								newwangtype = 1
								break
							end
						end
					end
				end
				if newwangtype == 0 then
					for j=1,table.getn(dwtitledata) do
						if char.getInt(talkerindex,"段位积分") >= dwtitledata[j][2] and char.getInt(talkerindex,"段位积分") <= dwtitledata[j][3] then
							dwname = dwtitledata[j][1]
							token = token .. "\n          您目前的段位称号：" .. dwname
						end
					end
				else
					token = token .. "\n          您目前的段位称号：最强王者"
				end
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			elseif num == 4 then
				token = "此操作非常危险，您确定要清空段位积分吗？\n\n1、清空段位积分后可重新选择匹配模式。\n2、段位积分小于10分不得清空积分的哟。\n3、清空段位积分后积分归零重新比赛。\n\n如果确定操作请输入验证码（"
				local rndnum = math.random(101,999)
				token = token .. rndnum .. "）"
				char.setWorkInt(talkerindex,"NPC临时1",rndnum)
				lssproto.windows(talkerindex, "输入框", "确定|取消", 4, char.getWorkInt( meindex, "对象"), token)
			elseif num == 5 then
				ShowDwReadMe(meindex, talkerindex, 1)
			end
		elseif seqno == 4 then
			if select ~= 1 then
				return
			end
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 101 or num > 999 then
				return
			end
			if num ~= char.getWorkInt(talkerindex,"NPC临时1") then
				char.TalkToCli(talkerindex, -1, "验证码输入错误。", "随机色")
				return
			end
			if char.getInt(talkerindex,"段位积分") < 10 then
				char.TalkToCli(talkerindex, -1, "您的段位积分过低，无法清空哦。", "随机色")
				return
			end
			if char.getWorkInt(talkerindex,"段位临时") == 2 then
				char.TalkToCli(talkerindex, -1, "您还在段位比赛匹配中，请先取消匹配再来清空哦。", "随机色")
				return
			end
			UpdateDwPaiMing(char.getChar(talkerindex,"账号"),char.getChar(talkerindex,"名字"),0,0,char.getInt(talkerindex,"段位模式"))
			char.setInt(talkerindex,"段位模式",0)
			char.setInt(talkerindex,"段位积分",0)
			char.TalkToCli(talkerindex, -1, "[温馨提示]您的段位积分已经清除成功，可以重新选择比赛模式。", "随机色")
		elseif seqno == 10 or seqno == 50 then
			if select ~= 1 then
				return
			end
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 101 or num > 999 then
				return
			end
			if num ~= char.getWorkInt(talkerindex,"NPC临时1") then
				char.TalkToCli(talkerindex, -1, "验证码输入错误。", "随机色")
				return
			end
			if char.getInt(talkerindex,"转数") ~= 5 or char.getInt(talkerindex,"等级") ~= 140 then
				char.TalkToCli(talkerindex, -1, "[温馨提示]只有人物达到5转140才可以参加段位比赛哦。", "随机色")
				return
			end
			if char.getInt(talkerindex,"段位模式") == 0 then
				char.setInt(talkerindex,"段位模式",seqno/10)
				char.setInt(talkerindex,"段位积分",1)
				char.setInt(talkerindex,"段位时间",other.time())
				UpdateDwPaiMing(char.getChar(talkerindex,"账号"),char.getChar(talkerindex,"名字"),1,other.time(),seqno/10)
				char.TalkToCli(talkerindex, -1, "[温馨提示]您已经成功报名" .. seqno/10 .. "v" .. seqno/10 .. "段位比赛，快来试试吧。", "随机色")
			end
		elseif seqno >= 11 and seqno <= 12 then
			if select == 16 then
				if seqno == 11 then
					return
				end
				if table.getn(dw1v1data) == 0 then
					char.TalkToCli(talkerindex, -1, "暂无排名。", "随机色")
					return
				else
					token = " \n                 「 1v1模式全服段位排名 」\n\n\n"
						 .. "『全服排名』   『玩家名字』     『目前段位』  『段位积分』\n"
					for i=1,math.min(table.getn(dw1v1data),10) do
						if dw1v1data[i][1] ~= "" then
							dwname = ""
							if dw1v1data[i][3] > 250 and i <= 5 then
								dwname = "最强王者"
							else
								for j=1,table.getn(dwtitledata) do
									if dw1v1data[i][3] >= dwtitledata[j][2] and dw1v1data[i][3] <= dwtitledata[j][3] then
										dwname = dwtitledata[j][1]
										break
									end
								end
							end
							tempname = dw1v1data[i][2]
							tempnamelen = math.floor((16 - string.len(tempname))/2)
							tempnamelen2 = (16 - string.len(tempname))%2
							if tempnamelen > 0 then
								for j=1,tempnamelen do
									tempname = " " .. tempname .. " "
								end
							end
							if tempnamelen2 > 0 then
								tempname = tempname .. " "
							end
							token = token .. "\n     " .. string.format("%02d",i) .. "      " .. tempname .. "    " .. dwname .. "       " .. dw1v1data[i][3]
						else
							break
						end
					end
					if table.getn(dw1v1data) > 10 then
						lssproto.windows(talkerindex, "宽对话框", "取消|下一页", 11, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽对话框", "取消", 11, char.getWorkInt( meindex, "对象"), token)
					end
				end
			elseif select == 32 then
				if seqno == 12 then
					return
				end
				if table.getn(dw1v1data) < 11 then
					char.TalkToCli(talkerindex, -1, "暂无排名。", "随机色")
					return
				else
					token = " \n                 「 1v1模式全服段位排名 」\n\n\n"
						 .. "『全服排名』   『玩家名字』     『目前段位』  『段位积分』\n"
					for i=11,math.min(table.getn(dw1v1data),20) do
						if dw1v1data[i][1] ~= "" then
							dwname = ""
							for j=1,table.getn(dwtitledata) do
								if dw1v1data[i][3] >= dwtitledata[j][2] and dw1v1data[i][3] <= dwtitledata[j][3] then
									dwname = dwtitledata[j][1]
									break
								end
							end
							tempname = dw1v1data[i][2]
							tempnamelen = math.floor((16 - string.len(tempname))/2)
							tempnamelen2 = (16 - string.len(tempname))%2
							if tempnamelen > 0 then
								for j=1,tempnamelen do
									tempname = " " .. tempname .. " "
								end
							end
							if tempnamelen2 > 0 then
								tempname = tempname .. " "
							end
							token = token .. "\n     " .. string.format("%02d",i) .. "      " .. tempname .. "    " .. dwname .. "       " .. dw1v1data[i][3]
						else
							break
						end
					end
					if table.getn(dw1v1data) > 0 then
						lssproto.windows(talkerindex, "宽对话框", "取消|上一页", 12, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽对话框", "取消", 12, char.getWorkInt( meindex, "对象"), token)
					end
				end
			end
		elseif seqno >= 21 and seqno <= 22 then
			if select == 16 then
				if seqno == 21 then
					return
				end
				if table.getn(dw5v5data) == "" then
					char.TalkToCli(talkerindex, -1, "暂无排名。", "随机色")
					return
				else
					token = " \n                 「 5v5模式全服段位排名 」\n\n\n"
						 .. "『全服排名』   『玩家名字』     『目前段位』  『段位积分』\n"
					for i=1,math.min(table.getn(dw5v5data),10) do
						if dw5v5data[i][1] ~= "" then
							dwname = ""
							if dw5v5data[i][3] > 250 then
								dwname = "最强王者"
							else
								for j=1,table.getn(dwtitledata) do
									if dw5v5data[i][3] >= dwtitledata[j][2] and dw5v5data[i][3] <= dwtitledata[j][3] then
										dwname = dwtitledata[j][1]
										break
									end
								end
							end
							tempname = dw5v5data[i][2]
							tempnamelen = math.floor((16 - string.len(tempname))/2)
							tempnamelen2 = (16 - string.len(tempname))%2
							if tempnamelen > 0 then
								for j=1,tempnamelen do
									tempname = " " .. tempname .. " "
								end
							end
							if tempnamelen2 > 0 then
								tempname = tempname .. " "
							end
							token = token .. "\n     " .. string.format("%02d",i) .. "      " .. tempname .. "    " .. dwname .. "       " .. dw5v5data[i][3]
						else
							break
						end
					end
					if table.getn(dw5v5data) > 10 then
						lssproto.windows(talkerindex, "宽对话框", "取消|下一页", 21, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽对话框", "取消", 21, char.getWorkInt( meindex, "对象"), token)
					end
				end
			elseif select == 32 then
				if seqno == 22 then
					return
				end
				if table.getn(dw5v5data) < 11 then
					char.TalkToCli(talkerindex, -1, "暂无排名。", "随机色")
					return
				else
					token = " \n                 「 5v5模式全服段位排名 」\n\n\n"
						 .. "『全服排名』   『玩家名字』     『目前段位』  『段位积分』\n"
					for i=11,math.min(table.getn(dw5v5data),20) do
						if dw5v5data[i][1] ~= "" then
							dwname = ""
							for j=1,table.getn(dwtitledata) do
								if dw5v5data[i][3] >= dwtitledata[j][2] and dw5v5data[i][3] <= dwtitledata[j][3] then
									dwname = dwtitledata[j][1]
									break
								end
							end
							tempname = dw5v5data[i][2]
							tempnamelen = math.floor((16 - string.len(tempname))/2)
							tempnamelen2 = (16 - string.len(tempname))%2
							if tempnamelen > 0 then
								for j=1,tempnamelen do
									tempname = " " .. tempname .. " "
								end
							end
							if tempnamelen2 > 0 then
								tempname = tempname .. " "
							end
							token = token .. "\n     " .. string.format("%02d",i) .. "      " .. tempname .. "    " .. dwname .. "       " .. dw5v5data[i][3]
						else
							break
						end
					end
					if table.getn(dw5v5data) > 0 then
						lssproto.windows(talkerindex, "宽对话框", "取消|上一页", 22, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽对话框", "取消", 22, char.getWorkInt( meindex, "对象"), token)
					end
				end
			end
		elseif seqno >= 1001 and seqno <= 1099 then
			num = seqno - 1000
			if select == 16 then
				if num <= 1 then
					return
				end
				ShowDwReadMe(meindex, talkerindex, num - 1)
			elseif select == 32 then
				if num >= table.getn(DwReadMe) then
					return
				end
				ShowDwReadMe(meindex, talkerindex, num + 1)
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "DwPkLoop", "")
	char.setInt(npcindex, "循环事件时间", 1000)
end

function data()
	dwtitledata = {{"英勇青铜Ⅴ",-10,10},{"英勇青铜Ⅳ",11,20},{"英勇青铜Ⅲ",21,30},{"英勇青铜Ⅱ",31,40},{"英勇青铜Ⅰ",41,50}
				,{"不屈白银Ⅴ",51,60},{"不屈白银Ⅳ",61,70},{"不屈白银Ⅲ",71,80},{"不屈白银Ⅱ",81,90},{"不屈白银Ⅰ",91,100}
				,{"荣耀黄金Ⅴ",101,110},{"荣耀黄金Ⅳ",111,120},{"荣耀黄金Ⅲ",121,130},{"荣耀黄金Ⅱ",131,140},{"荣耀黄金Ⅰ",141,150}
				,{"华贵铂金Ⅴ",151,160},{"华贵铂金Ⅳ",161,170},{"华贵铂金Ⅲ",171,180},{"华贵铂金Ⅱ",181,190},{"华贵铂金Ⅰ",191,200}
				,{"璀璨钻石Ⅴ",201,210},{"璀璨钻石Ⅳ",211,220},{"璀璨钻石Ⅲ",221,230},{"璀璨钻石Ⅱ",231,240},{"璀璨钻石Ⅰ",241,90000000}}
	pkfloorid = 2005
	dwdata = 1000
	zdnum = {5,0,0,0,2}
	DwReadMe = {"                   「 段位比赛规则介绍 」\n\n目前段位系统正在测试中，完成后会开启赛季，六个月一个赛季。\n\n每位5转140级玩家可以选择一个比赛类型进行排位(1v1)或(5v5)\n选择后本赛季只能参加该项比赛，退出需要清空段位积分。\n每赢一场比赛获得段位积分2-4点，输一场扣除段位积分2-4点。\n积分小于10点不得清空积分，在医院娱乐2-4小时增加1点积分。\n参加段位比赛后得到专属的段位称号 黄金以上享有专属光环。\n\n每天开启段位比赛的时间为[12:00-24:00] 其余时间休息。\n报名参赛后系统会自动匹配对手，循环时间为大约3分钟。\n如遇单数选手参加，轮空者将自动进入下一轮匹配，请耐心等待。\n黄金以上选手与黄金以上选手匹配，黄金以下与黄金以下匹配。\n黄金以上匹配中还会要求敌我双方有2-5战点为赌注，胜者获得。\n段位比赛中不得中途离场，不得切换线路，不得换号登陆等等。","                   「 段位积分分段排名列表 」\n\n                 英勇青铜 Ⅴ Ⅳ Ⅲ ⅡⅠ （0-50）\n                 不屈白银 Ⅴ Ⅳ Ⅲ ⅡⅠ （51-100）\n                 荣耀黄金 Ⅴ Ⅳ Ⅲ ⅡⅠ （101-150）\n                 华贵铂金 Ⅴ Ⅳ Ⅲ ⅡⅠ （151-200）\n                 璀璨钻石 Ⅴ Ⅳ Ⅲ ⅡⅠ （201-max）\n                 最强王者 积分>250 [1v1前5、5v5前10]\n\n\n                   「 段位排名特权特效说明 」\n\n                 1、专属段位称号 实力证明 逼格极高\n                 2、高段位自带炫彩脚底光环 [待添加]\n                 3、高段位赛季结束后结算丰厚奖励\n                 4、更多特权尽情期待中 ＼(^o^)／","                   「 段位比赛细节补充 」\n\nA、匹配后不要离开医院地图，否则无法正常匹配。\nB、匹配可以自己取消，但是取消后五分钟无法再次匹配。\nC、段位积分小于10分时，在娱乐互动线医院2-4小时增加1积分。\nD、段位比赛过程中不得离场、逃跑、登出、系统强制完成比赛。\nE、段位积分小于0分时，自动恢复到0，医院娱乐也可补充积分。\nF、要切换匹配模式必须清空段位积分，积分小于10分不得清空。\nG、自动记录全服前20的段位排名并实时展示，实力证明！\nH、段位查询中也可查询近10场比赛的胜负结果，要加油哦！\nI、黄金以上段位比赛中，必须要求双方有一定战点才能参加。\n   1v1比赛-[5点]  5v5比赛-[2点] 战点扣除后归胜利方所有。\nJ、黄金以下只能匹配到黄金以下的对手、黄金以上匹配同理。\nK、匹配为报名、循环排赛模式，匹配后需要等待1-3分钟。\n   如无相应的对手或轮空则自动进入下一轮，耐心等待哦！"}
	maxpage = table.getn(DwReadMe)
	looptimecnt = {{180,180},{180,180}}
	--ReloadDw1v1Log()
	--ReloadDw5v5Log()
	--ReloadDwPkLog()
end

function main()
	data()
	if config.getGameservername() == "娱乐互动线" then
		Create("段位管理员", 26728, 2005, 13, 12, 6)
	end
	looptime = {{other.time(),other.time()},{other.time(),other.time()}}
	looptimecnt = {{180,180},{180,180}}
	pkindex = {{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1},{-1,-1}}
	pkindex5 = {{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}},{{-1,-1,-1,-1,-1},{-1,-1,-1,-1,-1}}}
	pkcharname = {{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""},{"",""}}
	pkcharname5 = {{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}},{{"","","","",""},{"","","","",""}}}
	dw1v1data = {}
				
	dw5v5data = {}
	deldwdata = {}			
	pkdwdata = {}
				
	ReloadDw1v1Log()
	ReloadDw5v5Log()
	ReloadDwPkLog()
end

