function getRideTime(meindex,rideno)
	if rideno < 1 or rideno > 96 then
		return 0
	end
	local sqltoken = "select * from `ridetime` where `cdkey`='" .. char.getChar(meindex,"ÕËºÅ") .. "'"
	local ret = sasql.query(sqltoken)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			local timedata =  other.atoi(sasql.data(rideno + 1))
			return timedata
		end
	end
	return 0
end

function setRideTime(meindex,rideno,timedata)
	if rideno < 1 or rideno > 96 then
		return 0
	end
	local sqltoken = "select * from `ridetime` where `cdkey`='" .. char.getChar(meindex,"ÕËºÅ") .. "'"
	local ret = sasql.query(sqltoken)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sqltoken = "update `ridetime` set `time" .. rideno .. "`=" .. timedata .. " where `cdkey`='" .. char.getChar(meindex,"ÕËºÅ") .. "'"
			sasql.query(sqltoken)
			return timedata
		else
			sqltoken = "insert into `ridetime` values ('" .. char.getChar(meindex,"ÕËºÅ") .. "'"
			for i=1,96 do
				if i == rideno then
					sqltoken = sqltoken .. "," .. timedata
				else
					sqltoken = sqltoken .. ",0"
				end
			end
			sqltoken = sqltoken .. ")"
			sasql.query(sqltoken)
			return timedata
		end
	end
	return 0
end

function FreeRideQuery(meindex)
	local ridepetnum = 0
	local token = ""
	for i=1,#ridepet do
		if CheckPetRide(meindex,ridepet[i]) > 0 then
			token = token .. "|"..petname[i].."|"..CheckPetRideByPetNo( meindex, ridepet[i],0).."|"..CheckPetRide(meindex,ridepet[i])
			ridepetnum = ridepetnum + 1
		end
	end
	token = ridepetnum .. token
	lssproto.NewSaMenu(char.getFd(meindex),3, token)
	return 1
end

function CheckPetRide( meindex,petNo)
	local playerid = getNOindex(char.getInt( meindex, "Ô­Í¼ÏñºÅ"))
	if char.getInt( meindex, "Í¼ÏñºÅ") == 101178 then
		if petNo == 101177 then
			return 101179
		end
	elseif char.getInt( meindex, "Í¼ÏñºÅ") == 101177 then
		if petNo == 101178 then
			return 101179
		end
	elseif playerid > 0 then
		for i = 1, #petlist do
			if petNo == petlist[i] then
				return NewRideNoList[playerid][i]
			end
		end
		
		for i = 1, #PlayerColor[1] do
			if PlayerColor[playerid][i] == char.getInt( meindex, "Ô­Í¼ÏñºÅ") or (char.getInt( meindex, "Ô­Í¼ÏñºÅ") >= 100700 and char.getInt( meindex, "Ô­Í¼ÏñºÅ") < 108400) then
				if petNo == CommonPetList[i] and CommonRideNoList[playerid][i] > -1 then
					return CommonRideNoList[playerid][i]
				end
			end
		end
		     
		for i = 1, #CommonPetList1 do
			if char.getInt( meindex, "Ô­Í¼ÏñºÅ") == CommonPetList1[i][2] and petNo == CommonPetList1[i][3] then
				return CommonPetList1[i][1]
			end
		end

		for i = 1, #Pointpetlist do
			if petNo == Pointpetlist[i][1] then
				if PointRideNoList[playerid][i] > -1 then
					return PointRideNoList[playerid][i]
				end
			end
		end
	end
	return 0
end

function CheckPetRideByPetNo( meindex, petNo,type)
	local playerid = getNOindex(char.getInt( meindex, "Ô­Í¼ÏñºÅ"))

	if char.getInt( meindex, "Í¼ÏñºÅ") == 101178 then
		if petNo == 101177 then
			return 101179
		end
	elseif char.getInt( meindex, "Í¼ÏñºÅ") == 101177 then
		if petNo == 101178 then
			return 101179
		end
	elseif playerid > 0 then
		for i = 1, #petlist do
			if petNo == petlist[i] then
				if other.DataAndData(char.getInt(meindex, "Ö¤ÊéÆï³è"), i - 1) ~= 0 then
					if type == 0 then
						if char.getWorkInt(meindex,"ÆïÖ¤Ê±¼ä") > 0 and char.getWorkInt(meindex,"ÆïÖ¤Ê±¼ä") < other.time() then
							return 0
						end
					else
						local timedata = getRideTime(meindex,i)
						if timedata > 0 then
							if timedata < other.time() then
								setRideTime(meindex,i,0)
								char.setInt(meindex, "Ö¤ÊéÆï³è",other.DataNotData(char.getInt(meindex, "Ö¤ÊéÆï³è"), i - 1))
								return 0
							else
								char.setWorkInt(meindex,"ÆïÖ¤Ê±¼ä",timedata)
							end
						end
					end
					if NewRideNoList[playerid][i] == 0 then
						return 0
					else
						return 1
					end
				end
			end
		end

		for i = 1, #PlayerColor[1] do
			if PlayerColor[playerid][i] == char.getInt( meindex, "Ô­Í¼ÏñºÅ") or (char.getInt( meindex, "Ô­Í¼ÏñºÅ") >= 100700 and char.getInt( meindex, "Ô­Í¼ÏñºÅ") < 108400) then
				if petNo == CommonPetList[i] and CommonRideNoList[playerid][i] > -1 then
					return 1
				end
			end
		end

		for i = 1, #CommonPetList1 do
			if char.getInt( meindex, "Ô­Í¼ÏñºÅ") == CommonPetList1[i][2] and petNo == CommonPetList1[i][3] then
				return 1
			end
		end

		for i = 1, #Pointpetlist do
			if petNo == Pointpetlist[i][1] then
				local fmpointname = {"","","",""}
				for j=1,4 do
					fmpointname[j] = other.getString(family.ShowPointListArray(j - 1),"|",6)
				end
				fmname = char.getChar( meindex, "¼Ò×å")
				for j = 1, #fmpointname do
					if fmpointname[j] == fmname then
						if char.getInt( meindex, "¼Ò×åµØÎ»") > 0 and char.getInt( meindex, "¼Ò×åµØÎ»") ~= 2 then
							if PointRideNoList[playerid][i] > -1 then
								return 1
							end
						end
					end
				end
			end
		end

	end
	return 0

end

function FamilyRideFunction( meindex, petindex,pethaveindex)
	local playerid = getNOindex(char.getInt( meindex, "Ô­Í¼ÏñºÅ"))
	local petNo = char.getInt( petindex, "Ô­Í¼ÏñºÅ")
	if char.getInt( meindex, "Í¼ÏñºÅ") == 101178 then
		if petNo == 101177 then
			return 101179
		end
	elseif char.getInt( meindex, "Í¼ÏñºÅ") == 101177 then
		if petNo == 101178 then
			return 101179
		end
	elseif playerid > 0 then
		for i = 1, #petlist do
			if petNo == petlist[i] then
				if other.DataAndData(char.getInt(meindex, "Ö¤ÊéÆï³è"), i - 1) ~= 0 then
					local timedata = getRideTime(meindex,i)
					if timedata > 0 then
						if timedata < other.time() then
							setRideTime(meindex,i,0)
							char.setInt(meindex, "Ö¤ÊéÆï³è",other.DataNotData(char.getInt(meindex, "Ö¤ÊéÆï³è"), i - 1))
							break
						else
							char.setWorkInt(meindex,"ÆïÖ¤Ê±¼ä",timedata)
						end
					end
					local skindata = other.CallFunction("rideskin", "data/ablua/item/skin.lua", {meindex})
					if skindata > 0 then
						return skindata
					else
						return NewRideNoList[playerid][i]
					end
				end
				break
			end
		end
		
		for i = 1, #PlayerColor[1] do
			if PlayerColor[playerid][i] == char.getInt( meindex, "Ô­Í¼ÏñºÅ") or (char.getInt( meindex, "Ô­Í¼ÏñºÅ") >= 100700 and char.getInt( meindex, "Ô­Í¼ÏñºÅ") < 108400) then
				if petNo == CommonPetList[i] and CommonRideNoList[playerid][i] > -1 then
					local skindata = other.CallFunction("rideskin", "data/ablua/item/skin.lua", {meindex})
					if skindata > 0 then
						return skindata
					else
						return CommonRideNoList[playerid][i]
					end
				end
			end
		end
		     
		for i = 1, #CommonPetList1 do
			if char.getInt( meindex, "Ô­Í¼ÏñºÅ") == CommonPetList1[i][2] and petNo == CommonPetList1[i][3] then
				local skindata = other.CallFunction("rideskin", "data/ablua/item/skin.lua", {meindex})
				if skindata > 0 then
					return skindata
				else
					return CommonPetList1[i][1]
				end
			end
		end

		for i = 1, #Pointpetlist do
			if petNo == Pointpetlist[i][1] then
				local fmpointname = {"","","",""}
				for j=1,4 do
					fmpointname[j] = other.getString(family.ShowPointListArray(j - 1),"|",6)
				end
				fmname = char.getChar( meindex, "¼Ò×å")
				for j = 1, #fmpointname do
					if fmpointname[j] == fmname then
						if char.getInt( meindex, "¼Ò×åµØÎ»") > 0 and char.getInt( meindex, "¼Ò×åµØÎ»") ~= 2 then
							if PointRideNoList[playerid][i] > -1 then
								local skindata = other.CallFunction("rideskin", "data/ablua/item/skin.lua", {meindex})
								if skindata > 0 then
									return skindata
								else
									return PointRideNoList[playerid][i]
								end
							end
						end
					end
				end
			end
		end
	end
	return 0
end

function ComFamilyRideFunction( meindex, petindex )
	local playerid = getNOindex(char.getInt( meindex, "Ô­Í¼ÏñºÅ"))
	local petNo = char.getInt( petindex, "Ô­Í¼ÏñºÅ")
	if char.getInt( meindex, "Í¼ÏñºÅ") == 101179 then 
		return 101179
	elseif char.getInt( meindex, "Í¼ÏñºÅ") == 101178 then
		if petNo == 101177 then
			
			return 101179
		end
	elseif char.getInt( meindex, "Í¼ÏñºÅ") == 101177 then
		if petNo == 101178 then
			return 101179
		end
	elseif playerid > 0 then
		for i = 1, #petlist do
			if petNo == petlist[i] then
				if other.DataAndData(char.getInt(meindex, "Ö¤ÊéÆï³è"), i - 1) ~= 0 then
					return NewRideNoList[playerid][i]
				end
			end
		end
		
		for i = 1, #PlayerColor[1] do
			if PlayerColor[playerid][i] == char.getInt( meindex, "Ô­Í¼ÏñºÅ") or (char.getInt( meindex, "Ô­Í¼ÏñºÅ") >= 100700 and char.getInt( meindex, "Ô­Í¼ÏñºÅ") < 108400) then
				if petNo == CommonPetList[i] then
					return CommonRideNoList[playerid][i]
				end
			end
		end
		     
		for i = 1, #CommonPetList1 do
			if char.getInt( meindex, "Ô­Í¼ÏñºÅ") == CommonPetList1[i][2] and petNo == CommonPetList1[i][3] then
				return CommonPetList1[i][1]
			end
		end

	
		for i = 1, #Pointpetlist do
			if petNo == Pointpetlist[i][1] then
				for j = 1, #Pointpetlist[i][2] do
					if Pointpetlist[i][2][j] == floorid then
						if PointRideNoList[playerid][i] > -1 then
							return PointRideNoList[playerid][i]
						end
					end
				end
			end
		end
		for i = 1, #EquipagePetlist do
			if petNo == EquipagePetlist[i][1] then
				for j = 0, 5 do
					itemindex = char.getItemIndex(meindex, j)
					if itemindex > -1 then
						if item.getChar(itemindex, "ÀàÐÍ´úÂë") == "INSLAY" or other.getString(item.getChar(itemindex, "ÀàÐÍ´úÂë"), " ", 1) == "INSLAY"  then
							local field = {"", "", "", "", ""}
							local data = item.getChar(itemindex, "ÏâÇ¶´úÂë")
							
							field[1] = other.getString(data, "|", 1)
							field[2] = other.getString(data, "|", 2)
							field[3] = other.getString(data, "|", 3)
							field[4] = other.getString(data, "|", 4)
							field[5] = other.getString(data, "|", 5)
							for k = 1, #field do
								if field[k] == EquipagePetlist[i][2] then
									return EquipageRideNoList[playerid][i]
								end
							end
						end
					end
				end
			end
		end
	end
	return 0
end


function getNOindex( baseNo)
	if baseNo >= 100000 and baseNo < 100240 then
		metamo = baseNo - 100000
		for i = 1, 12 do
			if metamo >=  (i-2) * 20 and metamo <  i * 20 then
				return i;
			end
		end
	elseif baseNo >= 100700 and baseNo < 100820 then
		metamo = baseNo - 100700
		for i = 1, 12 do
			if metamo >=  (i-2) * 10 and metamo <  i * 10 then
				return i;
			end
		end
	end
	return -1
end

function data()
	ridepet = {100329,100327,100330,100328,100351,100352,100353,100354,100396,100372,100373,100374,100362,100288,100283,100279,100346,101532,101576,120112,120135,101875,100274,103000}
	petname = {"¸ñÂ³Î÷Ë¹","±´Â³¿¨","½ð¸ñÈø±´Â³","±´Â³ÒÁ¿¨","²¼Âå¶àË¹","²¼ÁÖÌûË¹","²¼À­Ææ¶àË¹","Ë¹Ìì¶àË¹","°î¶÷¶àË¹","×óµÏÂåË¹", "°Í¶äÀ¼¶÷", "ÌûÀ­ËùÒÁ¶ä", "¶äÀ­±ÈË¹", "ÑïÆæÂåË¹", "¿¨´ïÂ³¿¨Ë¹","À­ÆæÂ³¸ç","¿¨¿¨½ð±¦","Ê·¿¨Â³","ÂÞ¶à¿ËÀ×","ÌûÂ³Î÷¿¨","ÌûÀ­¶àÆæË¹","»³ÎÖ·ò","Ê¯¹ê","ÌûÀ­°µÒÁ¶ä"}
	     --   , »ú±©00, ½ð·É01,À¶ÈËÁú02,´©É½¼×03,ºì¹·04,ºìÍÜ05,·ÉÓã06,·ÉÀ×07,»úÐµ»¢08,»úÀ×09,ºì±©10,ÎÖ·ò11,Ê¯¹ê12,°µ»ú±©13
	petlist = {100374, 100362, 100288,100283,100279,100346,101532,101576 ,120112,120135,100373,101875,100274,103000}

			--ËµÃ÷ÐÐ, »ú±©00, ½ð·É01,À¶ÈËÁú02,´©É½¼×03,ºì¹·04,ºìÍÜ05,·ÉÓã06,·ÉÀ×07,»úÐµ»¢08,»úÀ×09,ºì±©10,ÎÖ·ò11,Ê¯¹ê12,°µ»ú±©13
	NewRideNoList = {{101181, 101183, 101185, 101186,101184,101187,101978,101989,120100,120123,101009,110601,110501,103001}	--Ð¡°«×Ó
					,{101189, 101191, 101193, 101194,101192,101195,101978,101989,120101,120124,101019,110602,110502,103002}	--ÈüÑÇÈË
					,{101197, 101199, 101201, 101202,101200,101203,101978,101989,120102,120125,101029,110603,110503,103003}	--±è×ÓÄÐº¢
					,{101205, 101207, 101209, 101210,101208,101211,101978,101989,120103,120126,101039,110604,110504,103004}	--¿á¸ç
					,{101213, 101215, 101217, 101218,101216,101219,101978,101989,120104,120127,101049,110605,110505,103013}	--ÐÜÆ¤ÄÐ
					,{101221, 101223, 101225, 101226,101224,101227,101978,101989,120105,120128,101059,110606,110506,103006}	--´ó¸ö
					,{101229, 101231, 101233, 101234,101232,101235,101983,101971,120106,120129,101069,110607,110507,103014}	--Ð¡°«ÃÃ
					,{101237, 101239, 101241, 101242,101240,101243,101983,101971,120107,120130,101079,110608,110508,103008}	--ÐÜÆ¤ÃÃ
					,{101245, 101247, 101249, 101250,101248,101251,101983,101971,120108,120131,101089,110609,110509,103009}	--Ã±×ÓÃÃ
					,{101253, 101255, 101257, 101258,101256,101259,101983,101971,120109,120132,101099,110610,110510,103010}	--¶Ì·¨·¢¼ÐÃÃ
					,{101261, 101263, 101265, 101266,101264,101267,101983,101971,120110,120133,101109,110611,110511,103011}	--ÊÖÌ×Å®
					,{101269, 101271, 101273, 101274,101272,101275,101983,101971,120111,120134,101119,110612,110512,103012}	--À±ÃÃ
					}
					
								--  ºì»¢,   ÂÌ»¢,   ½ð»¢,   »Æ»¢
	PlayerColor = {{ 100000, 100005, 100010, 100015}	--Ð¡°«×Ó       
								,{ 100025, 100030, 100035, 100020}	--ÈüÑÇÈË       
								,{ 100055, 100050, 100045, 100040}	--±è×ÓÄÐº¢     
								,{ 100060, 100065, 100070, 100075}	--¿á¸ç         
								,{ 100095, 100085, 100090, 100080}	--ÐÜÆ¤ÄÐ       
								,{ 100100, 100115, 100110, 100105}	--´ó¸ö         
								,{ 100135, 100120, 100125, 100130}	--Ð¡°«ÃÃ       
								,{ 100145, 100140, 100150, 100155}	--ÐÜÆ¤ÃÃ       
								,{ 100165, 100170, 100160, 100175}	--Ã±×ÓÃÃ       
								,{ 100190, 100195, 100185, 100180}	--¶Ì·¨·¢¼ÐÃÃ   
								,{ 100200, 100210, 100215, 100205}	--ÊÖÌ×Å®       
								,{ 100230, 100225, 100220, 100235}	--À±ÃÃ                  
								}
									
									
	CommonPetList   =   {100329, 100327, 100330, 100328}	--  ºì»¢,   ÂÌ»¢,   ½ð»¢,   »Æ»¢
	CommonRideNoList = {{101004, 101005, 101006, 101007}	--Ð¡°«×Ó              
										 ,{101015, 101016, 101017, 101014}	--ÈüÑÇÈË     
										 ,{101027, 101026, 101025, 101024}	--±è×ÓÄÐº¢         
										 ,{101034, 101035, 101036, 101037}	--¿á¸ç       
										 ,{101047, 101045, 101046, 101044}	--ÐÜÆ¤ÄÐ          
										 ,{101054, 101057, 101056, 101055}	--´ó¸ö        
										 ,{101067, 101064, 101065, 101066}	--Ð¡°«ÃÃ        
										 ,{101075, 101074, 101076, 101077}	--ÐÜÆ¤ÃÃ        
										 ,{101085, 101086, 101084, 101087}	--Ã±×ÓÃÃ    
										 ,{101096, 101097, 101095, 101094}	--¶Ì·¨·¢¼ÐÃÃ        
										 ,{101104, 101106, 101107, 101105}	--ÊÖÌ×Å®        
										 ,{101116, 101115, 101114, 101117}	--À±ÃÃ										         
										 }
										 
										                         
	CommonPetList1  = {{ 101002, 100000, 100352}
										,{ 101002, 100005, 100352}
										,{ 101002, 100010, 100352}
										,{ 101002, 100015, 100352}
										,{ 101002, 100700, 100352}
										,{ 101002, 100705, 100352}

										,{ 101013, 100020, 100396}
										,{ 101013, 100025, 100396}
										,{ 101013, 100030, 100396}
										,{ 101013, 100035, 100396}
										,{ 101013, 100710, 100396}
										,{ 101013, 100715, 100396}

										,{ 101021, 100040, 100351}
										,{ 101021, 100045, 100351}
										,{ 101021, 100050, 100351}
										,{ 101021, 100055, 100351}
										,{ 101021, 100720, 100351}
										,{ 101021, 100725, 100351}
																		
										,{ 101030, 100060, 100353}
										,{ 101030, 100065, 100353}
										,{ 101030, 100070, 100353}
										,{ 101030, 100075, 100353}
										,{ 101030, 100730, 100353}
										,{ 101030, 100735, 100353}
															
										,{ 101042, 100080, 100396}
										,{ 101042, 100085, 100396}
										,{ 101042, 100090, 100396}
										,{ 101042, 100095, 100396}
										,{ 101042, 100740, 100396}
										,{ 101042, 100745, 100396}
										
										,{ 101052, 100100, 100353}
										,{ 101052, 100105, 100353}
										,{ 101052, 100110, 100353}
										,{ 101052, 100115, 100353}
										,{ 101052, 100750, 100353}
										,{ 101052, 100755, 100353}
										
										,{ 101060, 100120, 100354}
										,{ 101060, 100125, 100354}
										,{ 101060, 100130, 100354}
										,{ 101060, 100135, 100354}
										,{ 101060, 100760, 100354}
										,{ 101060, 100765, 100354}
																				
										,{ 101070, 100140, 100354}
										,{ 101070, 100145, 100354}
										,{ 101070, 100150, 100354}
										,{ 101070, 100155, 100354}
										,{ 101070, 100770, 100354}
										,{ 101070, 100775, 100354}
										
										,{ 101080, 100160, 100352}
										,{ 101080, 100165, 100352}
										,{ 101080, 100170, 100352}
										,{ 101080, 100175, 100352}
										,{ 101080, 100780, 100352}
										,{ 101080, 100785, 100352}
										
										,{ 101092, 100180, 100351}
										,{ 101092, 100185, 100351}
										,{ 101092, 100190, 100351}
										,{ 101092, 100195, 100351}
										,{ 101092, 100790, 100351}
										,{ 101092, 100795, 100351}
										
										,{ 101103, 100200, 100353}
										,{ 101103, 100205, 100353}
										,{ 101103, 100210, 100353}
										,{ 101103, 100215, 100353}
										,{ 101103, 100800, 100353}
										,{ 101103, 100805, 100353}
										
										,{ 101110, 100220, 100396}
										,{ 101110, 100225, 100396}
										,{ 101110, 100230, 100396}
										,{ 101110, 100235, 100396}
										,{ 101110, 100810, 100396}
										,{ 101110, 100815, 100396}
										}
										
	Pointpetlist = {--À¶±©
								 {100372, {1041, 2031, 3031, 4031}}
								  --ºì±©
								,{100373, {1041, 2031, 3031, 4031}}
								}
	                  --À¶±©,  --ºì±©--
	PointRideNoList = {{101008, 101009,101187,}	--Ð¡°«×Ó
					  				,{101018, 101019,101195}	--ÈüÑÇÈË
					  				,{101028, 101029,101203}	--±è×ÓÄÐº¢
					  				,{101038, 101039,101211}	--¿á¸ç
					  				,{101048, 101049,101219}	--ÐÜÆ¤ÄÐ
					  				,{101058, 101059,101227}	--´ó¸ö
					  				,{101068, 101069,101235}	--Ð¡°«ÃÃ
					  				,{101078, 101079,101243}	--ÐÜÆ¤ÃÃ
					  				,{101088, 101089,101251}	--Ã±×ÓÃÃ
					  				,{101098, 101099,101259}	--¶Ì·¨·¢¼ÐÃÃ
					  				,{101108, 101109,101267}	--ÊÖÌ×Å®
					  				,{101118, 101119,101275}	--À±ÃÃ
										}
																	
end

function main()
	data()
end
