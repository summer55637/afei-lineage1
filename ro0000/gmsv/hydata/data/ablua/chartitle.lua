function titleuse(itemindex, charaindex, toindex, haveitemindex)
	local id = other.atoi(item.getChar(itemindex, "×Ö¶Î"))
	local gettitlemode = GetCharNewTitleMode(charaindex,id)
	if gettitlemode < 0 then
		return
	elseif gettitlemode == 1 then
		char.TalkToCli(charaindex, -1, "ÄúÒÑÓµÓĞ¸Ã³ÆºÅ£¡", "»ÆÉ«")
		return
	end
	local titlename = item.getChar(itemindex,"ÏÔÊ¾Ãû")
	char.DelItem(charaindex, haveitemindex)
	SetCharNewTitle(charaindex,id)
	char.newMessageToCli(charaindex, -1, "¹§Ï²Äã»ñµÃĞÂ³ÆºÅ"..titlename.."£¡", "»ÆÉ«")
	token = "A|" .. titleinfo[id][2] .. "|" .. id .. "|" .. titleinfo[id][3].. "|" .. titleinfo[id][4]
	other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	other.CallFunction("updateTotalbonus", "data/ablua/complianceparameter.lua", {charaindex})
end

function getnewtitle(charaindex,id)
	if char.getInt(charaindex,"×ªÊı") == 5 and char.getInt(charaindex,"µÈ¼¶") == 140 then
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
		char.TalkToCli(charaindex, -1, "ÄúÒÑÓµÓĞ¸Ã³ÆºÅ£¡", "»ÆÉ«")
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
		char.setInt(charaindex,"ÎÄ×Ö³ÆºÅ",id)
		char.setInt(charaindex,"³ÆºÅÀàĞÍ",titleinfo[id][2])
		
		char.newMessageToCli(charaindex, -1, "¸ü»»³ÆºÅ³É¹¦", "°×É«")
		token = "N|" .. titleinfo[id][2] .. "|" .. id
		lssproto.CA_send(char.getFd(charaindex),char.getInt(charaindex,"×ø±êX").."|"..char.getInt(charaindex,"×ø±êY").."|45|"..char.getInt(charaindex,"·½Ïò"))
	else
		char.setInt(charaindex,"ÎÄ×Ö³ÆºÅ",0)
		char.setInt(charaindex,"³ÆºÅÀàĞÍ",0)
		token = "D"
		other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})			
		-- char.ToAroundChar(charaindex)
		-- char.WarpToSpecificPoint(charaindex,char.getInt(charaindex,"µØÍ¼ºÅ"),char.getInt(charaindex,"×ø±êX"),char.getInt(charaindex,"×ø±êY"))
		token = "N|0|0"
		--lssproto.CA_send(char.getFd(charaindex),token)
		char.newMessageToCli(charaindex, -1, "Ğ¶ÔØ³ÆºÅ³É¹¦", "°×É«")
	end
	--243°ü
	other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	--C°ü
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
		if other.DataAndData(char.getInt(charaindex,"³ÆºÅ×´Ì¬1"),id - 1)~= 0 then
			return 1
		end
	elseif id <= 64 then
		if other.DataAndData(char.getInt(charaindex,"³ÆºÅ×´Ì¬2"),id - 33)~= 0 then
			return 1
		end
	elseif id <= 96 then
		if other.DataAndData(char.getInt(charaindex,"³ÆºÅ×´Ì¬3"),id - 65)~= 0 then
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
		char.setInt(charaindex,"³ÆºÅ×´Ì¬1",other.DataOrData(char.getInt(charaindex,"³ÆºÅ×´Ì¬1"),id - 1))
	elseif id <= 64 then
		char.setInt(charaindex,"³ÆºÅ×´Ì¬2",other.DataOrData(char.getInt(charaindex,"³ÆºÅ×´Ì¬2"),id - 33))
	elseif id <= 96 then
		char.setInt(charaindex,"³ÆºÅ×´Ì¬3",other.DataOrData(char.getInt(charaindex,"³ÆºÅ×´Ì¬3"),id - 65))
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
		char.setInt(charaindex,"³ÆºÅ×´Ì¬1",other.DataNotData(char.getInt(charaindex,"³ÆºÅ×´Ì¬1"),id - 1))
	elseif id <= 64 then
		char.setInt(charaindex,"³ÆºÅ×´Ì¬2",other.DataNotData(char.getInt(charaindex,"³ÆºÅ×´Ì¬2"),id - 33))
	elseif id <= 96 then
		char.setInt(charaindex,"³ÆºÅ×´Ì¬3",other.DataNotData(char.getInt(charaindex,"³ÆºÅ×´Ì¬3"),id - 65))
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
	local mytitleindex = char.getInt(charaindex,"ÎÄ×Ö³ÆºÅ")
	if mytitleindex >= 1 and mytitleindex <= #titleinfo then
		token = "N|" .. titleinfo[mytitleindex][2] .. "|" .. mytitleindex
		other.CallFunction("TitleSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	end
	return 0
end

function data()
	titleinfo =	{	--ÃèÊö ÀàĞÍ Ê¹ÓÃ¼Ó³É ÓµÓĞ¼Ó³É
				 {"¶¹¶¡ĞÒÔËÕß",1,"0,0,0","0"}
				,{"ÎÒÊÇÃÈĞÂ",1,"0,0,0","0"}
				,{"ÎÒÊÇÊ¯»Ò",1,"0,0,0","0"}
				,{"ÏÈ·æÊ¹Õß",1,"0,0,0","0"}
				,{"ÑÖÂŞ°ÔÖ÷",1,"0,0,0","0"}
				,{"¶¹¶¡ÀúÏÕ¼Ç",1,"0,0,0","0"}
				,{"ÂúÔÂ¸£ĞÇ",1,"0,0,0","0"}
				,{"¹§Ï²·¢²Æ",1,"0,0,0","0"}
				,{"¶ºÄãÍæ¶ù",1,"0,0,0","0"}
				,{"ºì°üÄÃÀ´",1,"0,0,0","0"}
				,{"·çÔÆÔÙÆğ",1,"0,0,0","0"}
				,{"µ¥ÉíÍô",1,"0,0,0","0"}
				,{"ÇéÊ¥",1,"0,0,0","0"}
				,{"ÂòÂòÂò",1,"0,0,0","0"}
				,{"Õ÷·şÕß",1,"0,0,0","0"}
				,{"ÌÀÔ²´ïÈË",1,"0,0,0","0"}
				}

end

function main()
	data()
	item.addLUAListFunction( "ITEM_TITLE", "titleuse", "")
end
