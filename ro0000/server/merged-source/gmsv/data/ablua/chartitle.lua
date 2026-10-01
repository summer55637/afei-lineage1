function titleuse(itemindex, charaindex, toindex, haveitemindex)
	local id = other.atoi(item.getChar(itemindex, "字段"))
	local gettitlemode = GetCharNewTitleMode(charaindex,id)
	if gettitlemode < 0 then
		return
	elseif gettitlemode == 1 then
		char.TalkToCli(charaindex, -1, "您已拥有该称号！", "黄色")
		return
	end
	local titlename = item.getChar(itemindex,"显示名")
	char.DelItem(charaindex, haveitemindex)
	SetCharNewTitle(charaindex,id)
	char.newMessageToCli(charaindex, -1, "恭喜你获得新称号"..titlename.."！", "黄色")
	token = "A|" .. titleinfo[id][2] .. "|" .. id .. "|" .. titleinfo[id][3].. "|" .. titleinfo[id][4]
	other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	other.CallFunction("updateTotalbonus", "data/ablua/complianceparameter.lua", {charaindex})
end

function getnewtitle(charaindex,id)
	if char.getInt(charaindex,"转数") == 5 and char.getInt(charaindex,"等级") == 140 then
		local gettitlemode = GetCharNewTitleMode(charaindex,id)
		if gettitlemode < 0 then
			return 0
		elseif gettitlemode == 1 then
			return 0
		end
		SetCharNewTitle(charaindex,id)
		token = "A|" .. titleinfo[id][2] .. "|" .. id .. "|" .. titleinfo[id][3].. "|" .. titleinfo[id][4]
		other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	end
	return 0
end

function othertitleuse(charaindex,id)
	local gettitlemode = GetCharNewTitleMode(charaindex,id)
	if gettitlemode < 0 then
		return 0
	elseif gettitlemode == 1 then
		char.TalkToCli(charaindex, -1, "您已拥有该称号！", "黄色")
		return 0
	end
	SetCharNewTitle(charaindex,id)
	token = "A|" .. titleinfo[id][2] .. "|" .. id .. "|" .. titleinfo[id][3].. "|" .. titleinfo[id][4]
	other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	other.CallFunction("updateTotalbonus", "data/ablua/complianceparameter.lua", {charaindex})
	return 0
end

function playertitleuse(charaindex,id)
	--print("playertitleuse",charaindex,id)
	if id > 0 then
		local gettitlemode = GetCharNewTitleMode(charaindex,id)
		if gettitlemode ~= 1 then
			return 0
		end
		char.setInt(charaindex,"文字称号",id)
		char.setInt(charaindex,"称号类型",titleinfo[id][2])
		
		char.newMessageToCli(charaindex, -1, "更换称号成功", "白色")
		token = "N|" .. titleinfo[id][2] .. "|" .. id
		lssproto.CA_send(char.getFd(charaindex),char.getInt(charaindex,"坐标X").."|"..char.getInt(charaindex,"坐标Y").."|45|"..char.getInt(charaindex,"方向"))
	else
		char.setInt(charaindex,"文字称号",0)
		char.setInt(charaindex,"称号类型",0)
		token = "D"
		other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})			
		-- char.ToAroundChar(charaindex)
		-- char.WarpToSpecificPoint(charaindex,char.getInt(charaindex,"地图号"),char.getInt(charaindex,"坐标X"),char.getInt(charaindex,"坐标Y"))
		token = "N|0|0"
		lssproto.CA_send(char.getFd(charaindex),token)
		char.newMessageToCli(charaindex, -1, "卸载称号成功", "白色")
	end
	--243包
	other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	--C包
	char.upchar(charaindex)
	other.CallFunction("updateTotalbonus", "data/ablua/complianceparameter.lua", {charaindex})
	return 1
end

function GetCharNewTitleMode(charaindex,id)
	if char.check(charaindex)~=1 then
		return -1
	end
	if id < 1 or id > #titleinfo then
		return -1
	end
	if id <= 32 then
		if other.DataAndData(char.getInt(charaindex,"称号状态1"),id - 1)~= 0 then
			return 1
		end
	elseif id <= 64 then
		if other.DataAndData(char.getInt(charaindex,"称号状态2"),id - 33)~= 0 then
			return 1
		end
	elseif id <= 96 then
		if other.DataAndData(char.getInt(charaindex,"称号状态3"),id - 65)~= 0 then
			return 1
		end
	end
	return 0
end

function SetCharNewTitle(charaindex,id)
	if char.check(charaindex)~=1 then
		return
	end
	if id < 1 or id > #titleinfo then
		return
	end
	if id <= 32 then
		char.setInt(charaindex,"称号状态1",other.DataOrData(char.getInt(charaindex,"称号状态1"),id - 1))
	elseif id <= 64 then
		char.setInt(charaindex,"称号状态2",other.DataOrData(char.getInt(charaindex,"称号状态2"),id - 33))
	elseif id <= 96 then
		char.setInt(charaindex,"称号状态3",other.DataOrData(char.getInt(charaindex,"称号状态3"),id - 65))
	end
end

function CleanCharNewTitle(charaindex,id)
	if char.check(charaindex)~=1 then
		return
	end
	if id < 1 or id > #titleinfo then
		return
	end
	if id <= 32 then
		char.setInt(charaindex,"称号状态1",other.DataNotData(char.getInt(charaindex,"称号状态1"),id - 1))
	elseif id <= 64 then
		char.setInt(charaindex,"称号状态2",other.DataNotData(char.getInt(charaindex,"称号状态2"),id - 33))
	elseif id <= 96 then
		char.setInt(charaindex,"称号状态3",other.DataNotData(char.getInt(charaindex,"称号状态3"),id - 65))
	end
end

function TitleListSend(charaindex)
	if char.check(charaindex)~=1 then
		return 0
	end
	token = ""
	titlelistnum = 0
	for i=1,#titleinfo do
		if GetCharNewTitleMode(charaindex,i) == 1 then
			token = token .. "|" .. titleinfo[i][2] .. "|" .. i .. "|" .. titleinfo[i][3] .. "|" .. titleinfo[i][4]
			titlelistnum = titlelistnum + 1
		end
	end
	token = "S|" .. titlelistnum .. token
	other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	local mytitleindex = char.getInt(charaindex,"文字称号")
	if mytitleindex >= 1 and mytitleindex <= #titleinfo then
		token = "N|" .. titleinfo[mytitleindex][2] .. "|" .. mytitleindex
		other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	end
	return 0
end

function data()
	titleinfo =	{	--描述 类型 使用加成 拥有加成
                 {"2022福",1,"0,0,0","0"}
				,{"暗夜伯爵",1,"0,0,0","0"}
				,{"比翼双飞",1,"0,0,0","0"}
				,{"冰川时代",1,"0,0,0","0"}
				,{"村霸",1,"0,0,0","0"}
				,{"单挑王",1,"0,0,0","0"}
				,{"但求一败",1,"0,0,0","0"}
				,{"倒霉蛋",1,"0,0,0","0"}
				,{"缔造传奇",1,"0,0,0","0"}
				,{"复活节彩蛋",1,"0,0,0","0"}
				,{"合成达人",1,"0,0,0","0"}
				,{"回炉上头",1,"0,0,0","0"}
				,{"火鸡终结者",1,"0,0,0","0"}
				,{"家满月圆",1,"0,0,0","0"}
				,{"狼神传说",1,"0,0,0","0"}
				,{"乐于助人",1,"0,0,0","0"}
				,{"练级达人",1,"0,0,0","0"}
				,{"轮回巅峰",1,"0,0,0","0"}
				,{"尼斯大陆英雄",1,"0,0,0","0"}
				,{"你好骚",1,"0,0,0","0"}
				,{"年兽传说",1,"0,0,0","0"}
				,{"佩露夏之怒",1,"0,0,0","0"}
				,{"倾家荡产",1,"0,0,0","0"}
				,{"烧烧烧",1,"0,0,0","0"}
				,{"妹子认证",1,"0,0,0","0"}
				,{"荣耀一生",1,"0,0,0","0"}
				,{"商界大享",1,"0,0,0","0"}
				,{"神豪",1,"0,0,0","0"}
				,{"圣诞快乐",1,"0,0,0","0"}
				,{"圣诞来袭",1,"0,0,0","0"}
				,{"弑神者",1,"0,0,0","0"}
				,{"鼠你最强（绿色）",1,"0,0,0","0"}
				,{"鼠你最强（金色）",1,"0,0,0","0"}
				,{"鼠你最强（红色）",1,"0,0,0","0"}
				,{"鼠你最强（蓝色）",1,"0,0,0","0"}
				,{"双蛋狂欢",1,"0,0,0","0"}
				,{"谁敢拦我",1,"0,0,0","0"}
				,{"饲养达人",1,"0,0,0","0"}
				,{"糖果恶作剧",1,"0,0,0","0"}
				,{"天使之星",1,"0,0,0","0"}
				,{"屠龙者荣耀",1,"0,0,0","0"}
				,{"土豪",1,"0,0,0","0"}
				,{"邪恶南瓜",1,"0,0,0","0"}
				,{"先圣先师",1,"0,0,0","0"}
				,{"秀操作",1,"0,0,0","0"}
				,{"阎罗霸主",1,"0,0,0","0"}
				,{"勇士归来",1,"0,0,0","0"}
				,{"悠闲假期",1,"0,0,0","0"}
				,{"又剁手了",1,"0,0,0","0"}
				,{"元素精灵",1,"0,0,0","0"}
				,{"元宵节",1,"0,0,0","0"}
				,{"族战狂人",1,"0,0,0","0"}
				,{"族战首轮王",1,"0,0,0","0"}
				,{"一起上石器",1,"0,0,0","0"}
				,{"童心未泯",1,"0,0,0","0"}
				,{"粽横尼斯",1,"0,0,0","0"}
				,{"抽奖狂魔",1,"0,0,0","0"}
				,{"执着一世",1,"0,0,0","0"}
				-- {"豆丁幸运者",1,"0,0,0","0"}
				--,{"我是萌新",1,"0,0,0","0"}
				--,{"我是石灰",1,"0,0,0","0"}
				--,{"先锋使者",1,"0,0,0","0"}
				--,{"阎罗霸主",1,"0,0,0","0"}
				--,{"豆丁历险记",1,"0,0,0","0"}
				--,{"满月福星",1,"0,0,0","0"}
				--,{"恭喜发财",1,"0,0,0","0"}
				--,{"逗你玩儿",1,"0,0,0","0"}
				--,{"红包拿来",1,"0,0,0","0"}
				--,{"风云再起",1,"0,0,0","0"}
				--,{"单身汪",1,"0,0,0","0"}
				--,{"情圣",1,"0,0,0","0"}
				--,{"买买买",1,"0,0,0","0"}
				--,{"征服者",1,"0,0,0","0"}
				--,{"汤圆达人",1,"0,0,0","0"}
				}

end

function main()
	data()
	item.addLUAListFunction( "ITEM_TITLE", "titleuse", "")
end
