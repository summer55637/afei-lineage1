function getTeamData(talkerindex,page)
	if page < 1 or page > 100 then
		return 0
	end
	local partytype = 0
	for i=1,#floorid do
		if char.getInt(talkerindex,"地图号") == floorid[i] then
			partytype = 1
			break
		end
	end
	if partytype == 0 then
		char.newMessageToCli(talkerindex, -1, "该地图无法使用此功能", "白色")
		return 0
	end
	if char.getWorkInt(talkerindex,"组队") ~= 0 then
		char.newMessageToCli(talkerindex, -1, "您已经组队了", "白色")
		return 0
	end
	local myfloorid = char.getInt(talkerindex,"地图号")
	local playermaxnum = char.getPlayerMaxNum()
	teamdata = {}
	for i=0,playermaxnum - 1 do
		if char.check(i) == 1 then
			if i ~= talkerindex and char.getInt(i,"地图号") == myfloorid and char.getFlg(i,"组队") == 1 and char.getInt(i,"组队增强模式") == 0 and math.abs(char.getInt(talkerindex,"坐标X") - char.getInt(i,"坐标X")) <= 30 and math.abs(char.getInt(talkerindex,"坐标Y") - char.getInt(i,"坐标Y")) <= 30 then
				if char.getWorkInt(i,"组队") == 0 then
					teamdata[#teamdata + 1] = {i,char.getInt(i,"等级"),char.getChar(i,"名字"),1}
				elseif char.getWorkInt(i,"组队") == 1 then
					local teamnum = 0
					for j=1,5 do
						local teamindex = char.getWorkInt(i,"队员" .. j)
						if char.check(teamindex) == 1 then
							teamnum = teamnum + 1
						end
					end
					if teamnum < 5 then
						teamdata[#teamdata + 1] = {i,char.getInt(i,"等级"),char.getChar(i,"名字"),teamnum}
					end
				end
			end
		end
	end
	if #teamdata < (page - 1) * 10 + 1 then
		return 0
	end
	token = ""
	if page == 1 then
		token = "L|" .. math.ceil(#teamdata / 10) .. "|" .. math.min(#teamdata,10)
		for i=1,math.min(#teamdata,10) do
			token = token .. "|" .. teamdata[i][1] .. "|" .. teamdata[i][2] .. "|" .. teamdata[i][3] .. "|" .. teamdata[i][4]
		end
	else
		token = "G|" .. math.min(#teamdata - (page - 1) * 10,10)
		for i=(page - 1) * 10 + 1,(page - 1) * 10 + math.min(#teamdata - (page - 1) * 10,10) do
			token = token .. "|" .. teamdata[i][1] .. "|" .. teamdata[i][2] .. "|" .. teamdata[i][3] .. "|" .. teamdata[i][4]
		end
	end
	lssproto.windows(talkerindex, 1019, "取消", 0, char.getWorkInt( npcindex, "对象"), token)
	return 1
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 0 then
		if data == "" then
			return
		end
		local type = other.getString(data, "|", 1)
		if type == "G" then
			local nextpage = other.getString(data, "|", 2)
			if nextpage == "" then
				return
			end
			if char.getWorkInt(talkerindex,"组队") ~= 0 then
				char.newMessageToCli(talkerindex, -1, "您已经组队了", "白色")
				return
			end
			getTeamData(talkerindex,other.atoi(nextpage))
		elseif type == "J" then
			if char.getWorkInt(talkerindex,"组队") ~= 0 then
				char.newMessageToCli(talkerindex, -1, "您已经组队了", "白色")
				return
			end
			local teamindexbuff = other.getString(data, "|", 2)
			if teamindexbuff == "" then
				return
			end
			local teamindex = other.atoi(teamindexbuff)
			if char.check(teamindex) ~= 1 then
				char.newMessageToCli(talkerindex, -1, "对方已下线", "白色")
				return
			end
			if teamindex == talkerindex then
				return
			end
			if char.getInt(talkerindex,"地图号") ~= char.getInt(teamindex,"地图号") then
				char.newMessageToCli(talkerindex, -1, "对方已不在此地图", "白色")
				return
			end
			local partytype = 0
			for i=1,#floorid do
				if char.getInt(talkerindex,"地图号") == floorid[i] then
					partytype = 1
					break
				end
			end
			if partytype == 0 then
				char.newMessageToCli(talkerindex, -1, "该地图无法使用此功能", "白色")
				return
			end
			if math.abs(char.getInt(talkerindex,"坐标X") - char.getInt(teamindex,"坐标X")) > 30 or math.abs(char.getInt(talkerindex,"坐标Y") - char.getInt(teamindex,"坐标Y")) > 30 then
				char.newMessageToCli(talkerindex, -1, "对方已不在您的周围", "白色")
				return
			end
			if char.JoinParty(teamindex,talkerindex) == 1 then
				char.WarpToSpecificPoint(talkerindex,char.getInt(teamindex,"地图号"),char.getInt(teamindex,"坐标X"),char.getInt(teamindex,"坐标Y"))
			end
		end
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	floorid = {32018,32019,300,30203,11004}
end

function main()
	data()
	Create("远程组队", 100000, 777, 11, 5, 4)
	teamdata = {}
end