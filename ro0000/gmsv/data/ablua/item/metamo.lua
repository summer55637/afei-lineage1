function CharMetamo(itemindex, charaindex, toindex, haveitemindex)
	if charaindex ~= toindex then
		return
	end

	local id = other.atoi(item.getChar(itemindex, "字段"))

	if id <= 12 then
		local rand = math.random(4)
		metamo = metamolist[id][rand]
		metamohao = metamohaolist[id][rand]
	elseif id <= 14 then
		local rand = math.random(2)
		metamo = metamolist[id][rand]
		metamohao = metamohaolist[id][rand]
	else
		local rand = math.random(4)
		metamo = metamolist[id][rand]
		metamohao = metamohaolist[id][rand]
	end

	char.setInt(charaindex, "图像号", metamo)
	char.setInt(charaindex, "原图像号", metamo)
	char.setInt(charaindex, 3, metamohao)
	char.ToAroundChar( charaindex )
	char.TalkToCli(charaindex, -1, "使用成功，请原登后查看新形象！", "红色")
	char.DelItem(charaindex, haveitemindex)
end

function ColorMetamo(itemindex, charaindex, toindex, haveitemindex)
	if charaindex ~= toindex then
		return
	end
	local idbuff = {"红","绿","黄","灰"}
	local tempid = item.getChar(itemindex, "字段")
	if string.len(tempid) < 1 then
		return
	end
	local id = 0
	for i=1,4 do
		if tempid == idbuff[i] then
			id = i
			break
		end
	end
	if id == 0 then
		return
	end
	local playerid = getNOindex(char.getInt( charaindex, "原图像号"))

	if playerid > 0 then
		local metamo = metamolist[playerid][id]
		--local metamohao = metamohaolist[playerid][id]
		char.setInt(charaindex, "图像号", metamo)
		char.setInt(charaindex, "原图像号", metamo)
        --char.setInt(charaindex, 3, metamohao)
		char.ToAroundChar( charaindex )

		char.DelItem(charaindex, haveitemindex)

		char.TalkToCli(charaindex, -1, "恭喜你成功变成" .. color[id], "红色")
	else
		char.TalkToCli(charaindex, -1, "该角色无法使用颜色戒指！", "红色")
	end
end

function getNOindex( baseNo)
	if baseNo >= 100000 and baseNo < 100240 then
		metamo = baseNo - 100000
		for i = 1, 12 do
			if metamo >=  (i-1) * 20 and metamo <  i * 20 then
				return i;
			end
		end
	elseif baseNo >= 100700 and baseNo < 100820 then
		metamo = baseNo - 100700
		for i = 1, 12 do
			if metamo >=  (i-1) * 10 and metamo <  i * 10 then
				return i;
			end
		end
	elseif baseNo >= 102003 and baseNo <= 102128 then
		metamo = baseNo - 102003
		for i = 1, 6 do
			if metamo >=  (i-1) * 20 and metamo <  i * 20 then
				return i+12;
			end
		end
	end
	return -1
end

function data()
					 		 --{   红  ,   绿  ,   黄  ,   灰  ,   白  ,   黑  }, --此行为说明行*/
	metamolist = { { 100000, 100005, 100010, 100015, 100700, 100705}	--小矮子
								,{ 100025, 100030, 100035, 100020, 100710, 100715}	--赛亚人
								,{ 100055, 100050, 100045, 100040, 100720, 100725}	--辫子男孩
								,{ 100060, 100065, 100070, 100075, 100730, 100735}	--酷哥
								,{ 100095, 100085, 100090, 100080, 100740, 100745}	--熊皮男
								,{ 100100, 100115, 100110, 100105, 100750, 100755}	--大个
								,{ 100135, 100120, 100125, 100130, 100760, 100765}	--小矮妹
								,{ 100145, 100140, 100150, 100155, 100770, 100775}	--熊皮妹
								,{ 100165, 100170, 100160, 100175, 100780, 100785}	--帽子妹
								,{ 100190, 100195, 100185, 100180, 100790, 100795}	--短发夹妹
								,{ 100200, 100210, 100215, 100205, 100800, 100805}	--手套女
								,{ 100230, 100225, 100220, 100235, 100810, 100815}	--辣妹
								,{ 102003, 102008, 102013, 102018}	--狮子男
								,{ 102023, 102028, 102033, 102038}	--狐狸女
								,{ 102043, 102048, 102053, 102058}	--面具女
								,{ 102063, 102068, 102073, 102078}	--面具男
								,{ 100405, 100405}	--近藏
								,{ 100431, 100436}	--村长
								}
		metamohaolist = { { 30000, 30025, 30050, 30075, 30000, 30000}	--小矮子
								,{ 30125, 30125, 30150, 30175, 30100, 30175}	--赛亚人
								,{ 30275, 30250, 30225, 30200, 30275, 30275}	--辫子男孩
								,{ 30350, 30300, 30325, 30375, 30375, 30375}	--酷哥
								,{ 30400, 30425, 30450, 30475, 30475, 30475}	--熊皮男
								,{ 30575, 30500, 30550, 30525, 30525, 30575}	--大个
								,{ 30675, 30600, 30625, 30650, 30675, 30675}	--小矮妹
								,{ 30775, 30750, 30725, 30700, 30775, 30775}	--熊皮妹
								,{ 30875, 30825, 30850, 30875, 30800, 30875}	--帽子妹
								,{ 30900, 30975, 30925, 30950, 30975, 30975}	--短发夹妹
								,{ 31000, 31075, 31025, 31050, 31075, 31075}	--手套女
								,{ 31150, 31125, 31100, 31175, 31175, 31175}	--辣妹
								,{ 54500,54525,54550,54575}	--狮子男
								,{ 54600,54625,54650,54675}	--狐狸女
								,{ 54700,54725,54750,54775}	--面具女
								,{ 54800,54825,54850,54875}	--面具男
								,{ 54900, 54925, 54950, 54975}	--近藏
								,{ 55000, 55025, 55050, 55075}	--村长
								}

	color = {"红色", "绿色", "黄色", "灰色", "白色", "黑色"}
end

function main()
	item.addLUAListFunction( "ITEM_CHARMETAMO", "CharMetamo", "")
	item.addLUAListFunction( "ITEM_COLORMETAMO", "ColorMetamo", "")
	data()
end
