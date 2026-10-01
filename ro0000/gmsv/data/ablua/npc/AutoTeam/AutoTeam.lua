function teamsort(a,b)
	if a[6] == b[6] then
		return a[1] < b[1]
	else
		return a[6] < b[6]
	end
end

function queryTeam(id,toname)
	teamdata[id] = {}
	local maxplayer = char.getPlayerMaxNum() - 1
	for i=0,maxplayer do
		if char.check(i) == 1 then
			if char.getInt(i,"地图号") == mappointdata[id][2] and char.getWorkInt(i,"组队") == 1 and char.getFlg(i,"组队") == 1 and char.getInt(i,"组队增强模式") == 0 then
				local zhao = 0
				if toname == "" then
					zhao = 1
				else
					if char.getChar(i,"名字") == toname then
						zhao = 1
					end
				end
				if zhao == 1 then
					local teamnum = 0
					local partyindex = -1
					for j=1,5 do
						partyindex = char.getWorkInt(i,"队员" .. j)
						if char.check(partyindex) == 1 then
							teamnum = teamnum + 1
						end
					end
					if teamnum < 5 then
						teamdata[id][#teamdata[id] + 1] = {i,char.getChar(i,"名字"),char.getInt(i,"等级"),char.getInt(i,"头像号"),teamnum,other.Random(1,100000)}
					end
				end
			end
		end
	end
	if #teamdata[id] > 1 then
		table.sort(teamdata[id],teamsort)
	end
end

function ShowHead(talkerindex)
	if char.getWorkInt(talkerindex,"组队") ~= 0 then
		char.newMessageToCli(talkerindex,-1,"您已在队伍中","白色")
		return 0
	end
	token = "L|" .. #mappointdata
	for i=1,#mappointdata do
		token = token .. "|" .. mappointdata[i][1]
	end
	lssproto.windows(talkerindex, 1014, 8, 0, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--char.TalkToCli(talkerindex, -1, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	if data == "" then
		return
	end
	if char.getWorkInt(talkerindex,"组队") ~= 0 then
		char.newMessageToCli(talkerindex,-1,"您已在队伍中","白色")
		return
	end
	local type = other.getString(data,"|",1)
	if type == "G" then
		local listindex = other.getString(data,"|",2)
		if listindex == "" then
			return
		end
		listindex = other.atoi(listindex)
		if listindex < 1 or listindex > #mappointdata then
			return
		end
		
		queryTeam(listindex,"")
		token = "I|" .. listindex .. "|" .. math.min(#teamdata[listindex],10)
		for i=1,math.min(#teamdata[listindex],10) do
			local face = teamdata[listindex][i][4]
			local CharGraNo = other.NumAndNum(face,0xff0000)/0x10000;
			local CharMouthNo = other.NumAndNum(face,0xff00)/0x100;
			local CharEyeNo = other.NumAndNum(face,0xff);
			token = token .. "|" .. teamdata[listindex][i][2] .. "|" .. CharGraNo .. "|" .. CharMouthNo .. "|" .. CharEyeNo .. "|" .. teamdata[listindex][i][3] .. "|" .. teamdata[listindex][i][5] .. "|" .. teamdata[listindex][i][1]
		end
		lssproto.windowsupdate(talkerindex, 1014, 8, 0, char.getWorkInt( meindex, "对象"), token)
	elseif type == "F" then
		local listindex = other.getString(data,"|",2)
		if listindex == "" then
			return
		end
		listindex = other.atoi(listindex)
		local toname = other.getString(data,"|",3)
		if toname == "" then
			return
		end
		queryTeam(listindex,toname)
		if #teamdata[listindex] == 0 then
			char.newMessageToCli(talkerindex,-1,"该练级区域无此玩家","白色")
			return
		end
		token = "I|" .. listindex .. "|" .. math.min(#teamdata[listindex],10)
		for i=1,math.min(#teamdata[listindex],10) do
			local face = teamdata[listindex][i][4]
			local CharGraNo = other.NumAndNum(face,0xff0000)/0x10000;
			local CharMouthNo = other.NumAndNum(face,0xff00)/0x100;
			local CharEyeNo = other.NumAndNum(face,0xff);
			token = token .. "|" .. teamdata[listindex][i][2] .. "|" .. CharGraNo .. "|" .. CharMouthNo .. "|" .. CharEyeNo .. "|" .. teamdata[listindex][i][3] .. "|" .. teamdata[listindex][i][5] .. "|" .. teamdata[listindex][i][1]
		end
		lssproto.windowsupdate(talkerindex, 1014, 8, 0, char.getWorkInt( meindex, "对象"), token)
	elseif type == "J" then
		local listindex = other.getString(data,"|",2)
		if listindex == "" then
			return
		end
		listindex = other.atoi(listindex)
		if listindex < 1 or listindex > #mappointdata then
			return
		end
		local teamindex = other.getString(data,"|",3)
		if teamindex == "" then
			return
		end
		teamindex = other.atoi(teamindex)
		if mappointdata[listindex][3] > -1 then
			if char.getInt(talkerindex,"等级") < mappointdata[listindex][3] then
				char.newMessageToCli(talkerindex,-1,"您的等级不足" .. mappointdata[listindex][3] .. ",无法传送","白色")
				return
			end
		end
		queryTeam(listindex,"")
		for i=1,#teamdata[listindex] do
			if teamindex == teamdata[listindex][i][1] then
				local WarpRand = math.random(1,8)
				local WarpX = char.getInt(teamindex,"坐标X")
				local WarpY = char.getInt(teamindex,"坐标Y")
				if WarpRand == 1 then
					WarpX = WarpX + 1 
				end
				if WarpRand == 2 then
					WarpY = WarpY + 1
				end
				if WarpRand == 3 then
					WarpX = WarpX - 1
				end
				if WarpRand == 4 then
					WarpY = WarpY - 1
				end
				if WarpRand == 5 then
					WarpX = WarpX + 1
					WarpY = WarpY + 1
				end
				if WarpRand == 6 then
					WarpX = WarpX - 1
					WarpY = WarpY - 1
				end
				if WarpRand == 7 then
					WarpX = WarpX + 1
					WarpY = WarpY - 1
				end
				if WarpRand == 8 then
					WarpX = WarpX - 1
					WarpY = WarpY + 1
				end
				char.WarpToSpecificPoint(talkerindex, char.getInt(teamindex,"地图号"), WarpX, WarpY)
				if char.JoinParty(teamindex,talkerindex) == 1 then
					char.newMessageToCli(talkerindex,-1,"快捷组队成功","白色")
				else
					char.newMessageToCli(talkerindex,-1,"快捷组队失败","白色")
				end
				return
			end
		end
		char.newMessageToCli(talkerindex,-1,"该队伍不存在或已满员","白色")
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end


function data()
	
	mappointdata = {{"[10-25]级",10001,10}
					,{"[25-45]级",31401,25}
					,{"[45-60]级",31701,45}
					,{"[60-85]级",30301,60}
					,{"[80-110]级",32018,80}
					,{"[110-130]级",500,110}
					,{"[130]级",34567,130}}
end

function main()
	data()
	Create("快捷组队", 16130, 777, 11, 11, 6)
	teamdata = {}
end