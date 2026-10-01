function queryskin(charaindex)
	local skinindexdata = 0
	local flg1 = 0
	local flg2 = 0
	local skintimedata = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
	local delindex = {}
	local ret = sasql.query("select * from `skin` where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			skinindexdata = other.atoi(sasql.data(2))
			flg1 = other.atoi(sasql.data(3))
			flg2 = other.atoi(sasql.data(4))
			for i=1,64 do
				skintimedata[i] = other.atoi(sasql.data(4 + i))
				if skintimedata[i] > 0 and skintimedata[i] <= other.time() then
					delindex[#delindex + 1] = i
					skintimedata[i] = 0
				end
			end
			if #delindex > 0 then
				for i=1,#delindex do
					if delindex[i] <= 32 then
						flg1 = other.DataNotData(flg1,delindex[i] - 1)
					else
						flg2 = other.DataNotData(flg2,delindex[i] - 1)
					end
				end
				token = "update `skin` set `flg1`=" .. flg1 .. ",`flg2`=" .. flg2
				for i=1,#delindex do
					token = token .. ",`time" .. delindex[i] .. "`=0"
				end
				token = token .. " where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'"
				sasql.query(token)
			end
			if skinindexdata > 0 then
				if skinindexdata <= 32 then
					if other.DataAndData(flg1,skinindexdata - 1) == 0 then
						skinindexdata = 0
						updateuseskin(charaindex,skinindexdata)
					end
				elseif skinindexdata <= 64 then
					if other.DataAndData(flg2,skinindexdata - 32 - 1) == 0 then
						skinindexdata = 0
						updateuseskin(charaindex,skinindexdata)
					end
				end
			end
		end
	end
	return skinindexdata,flg1,flg2,skintimedata
end

function updateskin(charaindex,skinindex,flg1,flg2,type,skintime)
	local ret = sasql.query("select * from `skin` where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.query("update `skin` set `index`=" .. skinindex .. ",`flg1`=" .. flg1 .. ",`flg2`=" .. flg2 .. ",`time" .. type .. "`=" .. skintime .. " where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
		else
			sasql.query("insert into `skin` (`cdkey`) values ('" .. char.getChar(charaindex,"ÕËºÅ") .. "')")
			sasql.query("update `skin` set `index`=" .. skinindex .. ",`flg1`=" .. flg1 .. ",`flg2`=" .. flg2 .. ",`time" .. type .. "`=" .. skintime .. " where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
		end
		return 1
	end
	return 0
end

function updateuseskin(charaindex,skinindex)
	sasql.query("update `skin` set `index`=" .. skinindex .. " where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
end

function userskin(charaindex,useskindindex)
	if useskindindex < 1 or useskindindex > 64 then
		return 0
	end
	local myhaveskinindex = 0
	local skinindexdata,flg1,flg2,skintimedata = queryskin(charaindex)
	local skinhavedata = {}
	for i=1,32 do
		if other.DataAndData(flg1,i - 1) ~= 0 then
			skinhavedata[#skinhavedata + 1] = i
		end
	end
	for i=33,64 do
		if other.DataAndData(flg2,i - 32 - 1) ~= 0 then
			skinhavedata[#skinhavedata + 1] = i
		end
	end
	if useskindindex > #skinhavedata then
		return 0
	end
	myhaveskinindex = skinhavedata[useskindindex]
	if myhaveskinindex > 0 then
		if skindata[myhaveskinindex] > 0 then
			if char.getInt(charaindex,"Í¼ÏñºÅ") ~= skindata[myhaveskinindex] then
				if char.getInt(charaindex,"Æï³è") < 0 then
					char.newMessageToCli(charaindex, -1, "Æï³èºó²Å¿ÉÒÔÊ¹ÓÃÆ¤·ô", "°×É«")
					return 0
				end
				sasql.query("update `skin` set `index`=" .. myhaveskinindex .. " where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
				char.setInt(charaindex,"Í¼ÏñºÅ",skindata[myhaveskinindex])
				char.newMessageToCli(charaindex, -1, "¸ü»»Æ¤·ô³É¹¦", "°×É«")
				token = "Q|A|" .. useskindindex
				lssproto.S(charaindex,token)
				char.setInt(charaindex,"Æï³èÃû×ÖÄ£Ê½",1)
			else
				local ridepet = char.getInt(charaindex,"Æï³è")
				local petindex = char.getCharPet(charaindex,ridepet)
				if char.check(petindex) == 1 then
					local petno = other.CallFunction("CheckPetRide", "data/ablua/familyridefunction.lua", {charaindex,char.getInt(petindex,"Í¼ÏñºÅ")})
					if petno > 0 then
						char.setInt(charaindex,"Í¼ÏñºÅ",petno)
					else
						char.setInt(charaindex,"Í¼ÏñºÅ",char.getInt(charaindex,"Ô­Í¼ÏñºÅ"))
					end
				else
					char.setInt(charaindex,"Í¼ÏñºÅ",char.getInt(charaindex,"Ô­Í¼ÏñºÅ"))
				end
				char.newMessageToCli(charaindex, -1, "Ğ¶ÔØÆ¤·ô³É¹¦", "°×É«")
				skinindexdata = 0
				sasql.query("update `skin` set `index`=" .. skinindexdata .. " where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
				token = "Q|A|0"
				lssproto.S(charaindex,token)
				char.setInt(charaindex,"Æï³èÃû×ÖÄ£Ê½",0)
			end
			char.sendStatusString(charaindex,"P")
			char.ToAroundChar(charaindex)
		end
	end
	return 0
end

function noskin(charaindex)
	local skinindexdata,flg1,flg2,skintimedata = queryskin(charaindex)
	if skinindexdata > 0 then
		sasql.query("update `skin` set `index`=0 where `cdkey`='" .. char.getChar(charaindex,"ÕËºÅ") .. "'")
		token = "Q|A|0"
		lssproto.S(charaindex,token)
		char.sendStatusString(charaindex,"P")
		char.ToAroundChar(charaindex)
		char.setInt(charaindex,"Æï³èÃû×ÖÄ£Ê½",0)
	end
	return 0
end

function skinlogin(charaindex)
	local skinindexdata,flg1,flg2,skintimedata = queryskin(charaindex)
	local skinhavedata = {}
	local useskindindex = 0
	--print("[skin:skinlogin]",skinindexdata,flg1,flg2)
	for i=1,32 do
		if other.DataAndData(flg1,i - 1) ~= 0 then
			skinhavedata[#skinhavedata + 1] = i
			if skinindexdata == i then
				useskindindex = #skinhavedata
			end
		end
	end
	for i=33,64 do
		if other.DataAndData(flg2,i - 32 - 1) ~= 0 then
			skinhavedata[#skinhavedata + 1] = i
			if skinindexdata == i then
				useskindindex = #skinhavedata
			end
		end
	end
	token = "Q|I|" .. #skinhavedata
	for i=1,#skinhavedata do
		token = token .. "|" .. skinnamedata[skinhavedata[i]] .. "|" .. skindata[skinhavedata[i]] .. "|" .. skintimedata[skinhavedata[i]] .. "|" .. i
	end
	lssproto.S(charaindex,token)
	if skinindexdata > 0 then
		if skindata[skinindexdata] > 0 then
			local ridepet = char.getInt(charaindex,"Æï³è")
			local petindex = char.getCharPet(charaindex,ridepet)
			if char.check(petindex) == 1 then
				if char.getInt(charaindex,"Í¼ÏñºÅ") ~= skindata[skinindexdata] then
					char.setInt(charaindex,"Í¼ÏñºÅ",skindata[skinindexdata])
				end
			else
				updateuseskin(charaindex,0)
				skinindexdata = 0
				char.setInt(charaindex,"Í¼ÏñºÅ",char.getInt(charaindex,"Ô­Í¼ÏñºÅ"))
			end
		else
			updateuseskin(charaindex,0)
			skinindexdata = 0
			char.setInt(charaindex,"Í¼ÏñºÅ",char.getInt(charaindex,"Ô­Í¼ÏñºÅ"))
		end
	else
		local ridepet = char.getInt(charaindex,"Æï³è")
		local petindex = char.getCharPet(charaindex,ridepet)
		if char.check(petindex) == 1 then
			local petno = other.CallFunction("CheckPetRide", "data/ablua/familyridefunction.lua", {charaindex,char.getInt(petindex,"Í¼ÏñºÅ")})
			if petno > 0 then
				char.setInt(charaindex,"Í¼ÏñºÅ",petno)
			else
				char.setInt(charaindex,"Í¼ÏñºÅ",char.getInt(charaindex,"Ô­Í¼ÏñºÅ"))
			end
		else
			char.setInt(charaindex,"Í¼ÏñºÅ",char.getInt(charaindex,"Ô­Í¼ÏñºÅ"))
		end
	end
	token = "Q|A|" .. useskindindex
	lssproto.S(charaindex,token)
	return 0
end

function rideskin(charaindex)
	local skinindexdata,flg1,flg2,skintimedata = queryskin(charaindex)
	local skinhavedata = {}
	for i=1,32 do
		if other.DataAndData(flg1,i - 1) ~= 0 then
			skinhavedata[#skinhavedata + 1] = i
		end
	end
	for i=33,64 do
		if other.DataAndData(flg2,i - 32 - 1) ~= 0 then
			skinhavedata[#skinhavedata + 1] = i
		end
	end
	if skinindexdata > 0 then
		if skindata[skinindexdata] > 0 then
			return skindata[skinindexdata]
		end
	end
	return 0
end

function skin(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "×Ö¶Î")
	if data == "" then
		return
	end
	local skinindex = other.getString(data,"|",1)
	if skinindex == "" then
		return
	end
	skinindex = other.atoi(skinindex)
	if skinindex < 1 or skinindex > 64 then
		return
	end
	if skindata[skinindex] == 0 then
		return
	end
	local skintime = other.getString(data,"|",2)
	if skintime == "" then
		return
	end
	skintime = other.atoi(skintime)
	if skintime < 0 then
		skintime = 0
	end
	local skinindexdata,flg1,flg2,skintimedata = queryskin(charaindex)
	if skinindex <= 32 then
		if other.DataAndData(flg1,skinindex - 1) ~= 0 then
			char.newMessageToCli(charaindex,-1,"ÄúÒÑ¾­ÓĞ´ËÆ¤·ôÁË","°×É«")
			return
		end
		flg1 = other.DataOrData(flg1,skinindex - 1)
	else
		if other.DataAndData(flg2,skinindex - 32 - 1) ~= 0 then
			char.newMessageToCli(charaindex,-1,"ÄúÒÑ¾­ÓĞ´ËÆ¤·ôÁË","°×É«")
			return
		end
		flg2 = other.DataOrData(flg2,skinindex - 32 - 1)
	end
	if skintime > 0 then
		skintimedata[skinindex] = other.time() + skintime
	else
		skintimedata[skinindex] = 0
	end
	if updateskin(charaindex,skinindexdata,flg1,flg2,skinindex,skintimedata[skinindex]) == 1 then
		char.DelItem(charaindex, haveitemindex)
		char.newMessageToCli(charaindex,-1,"»ñµÃĞÂÆ¤·ô","°×É«")
		token = "Q|H|1|" .. skinnamedata[skinindex] .. "|" .. skindata[skinindex] .. "|" .. skintimedata[skinindex] .. "|" .. skinindex
		lssproto.S(charaindex,token)
	end
end


function GetCharNewskinMode(charaindex,id)
	if char.check(charaindex)~=1 then
		return -1
	end
	if id < 1 or id > #skindata then
		return -1
	end
	local skinindexdata,flg1,flg2,flg3,skintimedata = queryskin(charaindex)
	if id <= 32 then
		if other.DataAndData(flg1,id - 1) ~= 0 then
			return 1
		end
	elseif id <= 64 then
		if other.DataAndData(flg2,id - 32 - 1) ~= 0 then
			return 1
		end
	elseif id <= 96 then
		if other.DataAndData(flg3,id - 64 - 1) ~= 0 then
			return 1
		end
	end

	return 0
end

function data()
	skindata = {105073,105074,105075,132052,132053,105105,105106,105113,108455,105085
			   ,102199,102669,108374,104511,108508,104301,120116,120117,120119,120136
			   ,109000,109001,109002,109003,109004,101530,109008,109006,105089,105103
			   ,109007,109009,109010,109011,109012,109013,109014,109015,109016,109017
			   ,109018,109019,109020,109021,109022,100425,109033,109032,109034,109031
			   ,109030,103006,103009,0,0,0,0,0,0,0
			   ,0,0,0,0}
 
	skinnamedata = {"¹âÖ®ÈĞ½£","Ä§Ö®ÈĞ½£","Âê¿¨ÀöË¿","Í¸±©ÈüÑÇÈËÆ¤·ô","Í¸±©Ã±×ÓÃÃÆ¤·ô","ÑòÍÕ·¢¼ĞÃÃÆ¤·ô","ÑòÍÕ¶¹¶¡Æ¤·ô","ÂÌÈËÁú¶¹¶¡Æ¤·ô","Ë®ÓãĞÜÆ¤ÃÃÆ¤·ô","ÎÚ±¦ÒÀ¶¹¶¡Æ¤·ô"
			   ,"ºÚ±©Ã±×ÓÅ®Æ¤·ô","ÂÌ±©Ğ¡¶¹¶¡Æ¤·ô","À¶ÌøÌøÎò¿ÕÆ¤·ô","·É±©ÈüÑÇÈËÆ¤·ô","À¶»¢Ğ¡¶¹¶¡Æ¤·ô","ÂÌ»¢Ğ¡¶¹¶¡Æ¤·ô","À¶ÏóĞÜÆ¤ÄĞÆ¤·ô","À¶Ïó±È»ùÃÃÆ¤·ô","½ğ±©Ğ¡¶¹¶¡Æ¤·ô","½ğĞÉĞÜÆ¤ÃÃÆ¤·ô"
			   ,"ºÚ°ï½Ì¸¸A","ºÚ°ï½Ì¸¸B","ºÚ°ï½Ì¸¸C","ºÚ°ï½Ì¸¸D","ºÚ°ï½Ì¸¸E","ÔãÀÏÍ·","ºÚ°ßÈüÑÇÈË","½ğÇ¹ÓãĞÜÆ¤ÄĞ","ÍşÍşĞ¡¶¹¶¡","À¶¼×ÈüÑÇÈË"
			   ,"½£³İ»¢Ğ¡¶¹¶¡","ÇéÈË½ÚÆ¤·ô[ÄĞ]","ÇéÈË½ÚÆ¤·ô[Å®]","ÅåÂ¶ÏÄ-Ğ¡¶¹¶¡","ÅåÂ¶ÏÄ-ÈüÑÇÈË","ÅåÂ¶ÏÄ-±è×ÓÄĞ","ÅåÂ¶ÏÄ-¿á¸ç","ÅåÂ¶ÏÄ-ĞÜÆ¤ÄĞ","ÅåÂ¶ÏÄ-´ó¸ö","ÅåÂ¶ÏÄ-¶¹¶¡ÃÃ"
			   ,"ÅåÂ¶ÏÄ-ĞÜÆ¤ÃÃ","ÅåÂ¶ÏÄ-Ã±×ÓÃÃ","ÅåÂ¶ÏÄ-·¢¼ĞÃÃ ","ÅåÂ¶ÏÄ-ÊÖÌ×ÃÃ","ÅåÂ¶ÏÄ-À±ÃÃ","ºìÍõÈüÑÇÈË","ìÅ²ÊÈüÑÇÈË","ìÅ²Ê±È»ùÃÃ","·Û»¢ÈüÑÇÈË","³È»¢Ğ¡¶¹¶¡"
			   ,"À¶»¢¿á¸ç","ÇéÈË½Ú°µ±©ÄĞ","ÇéÈË½Ú°µ±©Å®","","","","","","",""
			   ,"","","",""}
end

function main()
	data()
	item.addLUAListFunction( "ITEM_SKIN", "skin", "")
end
