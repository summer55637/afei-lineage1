local unlawthislogut={}
function checkPasswd( passwd )
	if string.len(passwd) > 6 then
		return 1
	end
	local lenInByte = #passwd
	local tempcurByte
	for i=1,lenInByte do
		local curByte = string.byte(passwd, i)
		if i == 1 then
			tempcurByte = curByte
		end
		if curByte ~= tempcurByte then
			return 1
		end
	end
	return 0
end
--此lua是登录后计算离线时间，点数最高限制，安全码锁定，机器码读取
function FreeCharLogin( charindex )
	
	for i = 1, #unlawthislogut do
		if char.getInt(charindex, "地图号") == unlawthislogut[i][1] then
			char.setInt(charindex, "地图号", unlawthislogut[i][2][1] )
			char.setInt(charindex, "坐标X", unlawthislogut[i][2][2] )
			char.setInt(charindex, "坐标Y", unlawthislogut[i][2][3] )
		end
	end
	
	if char.getInt(charindex, "地图号") == 60501 then
		if config.getGameservername() == "娱乐互动线" then
			char.WarpElderPosition(charindex)
		else
			local myx = char.getInt(charindex, "坐标X")
			local myy = char.getInt(charindex, "坐标Y")
			local maxplayer = char.getPlayerMaxNum()
			local findnum = 0
			for i=0,maxplayer - 1 do
				if char.check(i) == 1 and i ~= charindex then
					if char.getInt(i, "地图号") == 60501 and char.getInt(i, "坐标X") == myx and char.getInt(i, "坐标Y") == myy then
						findnum = findnum + 1
					end
				end
			end
			if findnum >= 2 then
				myx = math.random(18)
				myy = math.random(18)
				char.setInt(charindex, "坐标X", myx )
				char.setInt(charindex, "坐标Y", myy )
			end
		end
	elseif char.getInt(charindex, "地图号") == 41011 or char.getInt(charindex, "地图号") == 41012 then
		char.WarpElderPosition(charindex)
	end
	
	-- if char.getInt(charindex, "极品") ~=1 then
		-- local vital = char.getInt(charindex, "体力")
		-- local str = char.getInt(charindex, "腕力")
		-- local tgh = char.getInt(charindex, "耐力")
		-- local dex = char.getInt(charindex, "速度")
		-- local skillpoint = char.getInt(charindex, "技能点")
		-- local sum = vital + str + tgh + dex + skillpoint * 100
		-- if sum > 63700 then
			-- char.setInt(charindex, "体力", 1000)
			-- char.setInt(charindex, "腕力", 0)
			-- char.setInt(charindex, "耐力", 0)
			-- char.setInt(charindex, "速度", 0)
			-- char.setInt(charindex, "技能点", 627)
		-- end
	-- end
	
	for i=0,4 do
		petindex = char.getCharPet(charindex,i)
		if char.check(petindex) == 1 then
			if char.getInt(petindex,"等级") >= 120 then
				char.complianceParameter(petindex)
				local petparam = {charindex,petindex}
				other.CallFunction("UpdataPetBilling", "data/ablua/npc/petbilling/petbilling.lua", petparam)
				other.CallFunction("setPetTotalData", "data/ablua/npc/petbilling/petbilling.lua", petparam)
			end
			if char.getInt(petindex,"宠ID") == 739 then
				char.DelPet(charindex,petindex)
			end
			other.CallFunction("petattupdate", "data/ablua/npc/petatterrect/petatterrect.lua", {petindex})
		end
	end
	
	if string.len(char.getChar(charindex,"伤害BUFF")) > 1 then
		local damagebuff = char.getChar(charindex,"伤害BUFF")
		local damageup = other.atoi(other.getString(damagebuff,"-",1))
		local damagetime = other.atoi(other.getString(damagebuff,"-",2))
		if damagetime < other.time() then
			char.setChar(charindex,"伤害BUFF","")
			char.setInt(charindex,"文字称号",0)
			other.CallFunction("CleanCharNewTitle","data/ablua/chartitle.lua",{charindex,47})
		end
	end
	if os.date("%x", other.time()) ~= os.date("%x", char.getInt(charindex,"下线时间")) then
		char.setInt(charindex,"签到在线时间",0)
	end
	
	local ridepet = char.getInt(charindex,"骑宠")
	if ridepet > -1 then
		local ridepetindex = char.getCharPet(charindex, ridepet)
		if char.check(ridepetindex) == 1 then
			local parameter = {charindex,char.getInt(ridepetindex,"图像号"),1}
			local ridecheck = other.CallFunction("CheckPetRideByPetNo", "data/ablua/familyridefunction.lua", parameter)
			if ridecheck == 0 then
				char.setInt( charindex , "骑宠", -1 )
				char.setInt( charindex , "图像号" , char.getInt( charindex , "原图像号") )
				char.ToAroundChar( charindex)
				char.Updata( charindex , "骑宠")
			end
		end
	end
		
	token = "UPDATE CSAlogin set `Online` = " .. config.getServernumber() .. ", ServerName = '" .. config.getGameservername() .. "', ServerId = " .. char.getWorkInt(charindex, "服务器ID") + 1 .. " WHERE Name=BINARY'" .. char.getChar(charindex, "账号") .. "'"
	ret = sasql.query(token)
	char.setInt(charindex, "安全锁", -1)
	char.setWorkInt(charindex, "增加堆叠数", 100)
	if char.getInt(charindex,"段位时间") < 1513908000 then
		char.setInt(charindex,"段位时间",0)
		char.setInt(charindex,"段位积分",0)
		char.setInt(charindex,"段位模式",0)
	end
	if char.getInt(charindex,"文字称号") == 24 or char.getInt(charindex,"文字称号") > 300 then
		char.setInt(charindex,"文字称号",0)
	end
	local param = {charindex}
	other.CallFunction("login", "data/ablua/npc/wenming/wenming.lua", param)
	other.CallFunction("TitleListSend", "data/ablua/chartitle.lua", param)
	other.CallFunction("skinlogin", "data/ablua/item/skin.lua", param)
	other.CallFunction("SendBuyVigor", "data/ablua/npc/buyvigor/buyvigor.lua", param)
	-- other.CallFunction("NewMapBattleInfo", "data/ablua/warpmap.lua", {charindex,char.getInt(charindex,"地图号"),char.getInt(charindex,"坐标X"),char.getInt(charindex,"坐标Y")})
	if char.getInt(charindex,"离线时间") > 0 then
		local myexp = char.getInt(charindex,"离线经验")
		char.setInt(charindex,"离线经验",0)
		local battleexp = 0
		local rideexp = 0
		local battlepetindex = char.getInt(charindex,"战宠")
		if battlepetindex >= 0 and battlepetindex <= 4 then
			battlepetindex = char.getCharPet(charindex,battlepetindex)
			if char.check(battlepetindex) == 1 then
				battleexp = char.getInt(battlepetindex,"离线经验")
				char.setInt(battlepetindex,"离线经验",0)
			end
		end
		local ridepetindex = char.getInt(charindex,"骑宠")
		if ridepetindex >= 0 and ridepetindex <= 4 then
			ridepetindex = char.getCharPet(charindex,ridepetindex)
			if char.check(ridepetindex) == 1 then
				rideexp = char.getInt(ridepetindex,"离线经验")
				char.setInt(ridepetindex,"离线经验",0)
			end
		end
		lssproto.windows(charindex, 1018, 0, 0, -1, char.getInt(charindex,"离线时间") .. "|" .. myexp .. "|" .. rideexp .. "|" .. battleexp)
		char.setInt(charindex,"离线时间",0)
	end
	
	char.setWorkInt(charindex,"心跳时间",other.time())
	if char.getInt(charindex,"地图号") >= 40030 and char.getInt(charindex,"地图号") <= 40034 then
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charindex,1})
	else
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charindex,0})
	end
	lssproto.S(charindex,"T|" .. other.CallFunction("getruntime","data/ablua/npc/autopk/autopk.lua",{charindex}))
	
	other.CallFunction("RedPointSend","data/ablua/dispatchmessage.lua",{charindex,0})
	
	local mypaohuanbuff = other.CallFunction("getPaoHuanData","data/ablua/npc/paohuan/paohuan.lua",{charindex})
	local paohuandate = other.getString(mypaohuanbuff,"|",1)
	local paohuannum = other.atoi(other.getString(mypaohuanbuff,"|",2))
	local mypaohuanmaxnum = other.atoi(other.getString(mypaohuanbuff,"|",3))
	local paohuanflg = other.atoi(other.getString(mypaohuanbuff,"|",4))
	local paohuanstar = other.atoi(other.getString(mypaohuanbuff,"|",5))
	local paohuanrefreshnum = other.atoi(other.getString(mypaohuanbuff,"|",6))
	local mypaohuandata = other.getString(mypaohuanbuff,"|",7)
	if paohuanflg == 1 then
		npc.EvClr(charindex,900)
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{charindex,900,1})
		local mypaohuandatabuff1 = other.CallFunction("getPaoHuanDataBuff","data/ablua/npc/paohuan/paohuan.lua",{mypaohuandata,1})
		local mypaohuandatabuff2 = other.CallFunction("getPaoHuanDataBuff","data/ablua/npc/paohuan/paohuan.lua",{mypaohuandata,2})
		local mypaohuandatabuff3 = other.CallFunction("getPaoHuanDataBuff","data/ablua/npc/paohuan/paohuan.lua",{mypaohuandata,3})
		token = "900|2|[跑环任务]" .. paohuanstar .. "星跑环|前往:" .. mypaohuandatabuff1 .. ",需要宠物:" .. mypaohuandatabuff2 .. ",需要道具:" .. mypaohuandatabuff3 .. "|前往:" .. mypaohuandatabuff1 .. "|1|51522|" .. other.CallFunction("getPaoHuanDataJiang","data/ablua/npc/paohuan/paohuan.lua",{paohuanstar})
		other.CallFunction("Tasksend","data/ablua/dispatchmessage.lua",{charindex,token})
	else
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{charindex,900,0})
	end
end

function data()
	unlawthislogut = {{125, {2000, 69, 69}}
									 ,{126, {2000, 69, 69}}
									 ,{127, {2000, 69, 69}}
									 ,{128, {2000, 69, 69}}
									 ,{140, {141, 25, 17}}
									 ,{8190, {2000, 44, 67}}
	--								 ,{12345, {2000, 83, 80}}
									 ,{40001, {2005, 4, 27}}
									 ,{40002, {2005, 4, 38}}
									 ,{40003, {2005, 15, 27}}
									 ,{40004, {2005, 15, 38}}
									 ,{40005, {2005, 26, 27}}
									 ,{40006, {2005, 26, 38}}
	--								 ,{40007, {2000, 63, 52}}
									 ,{60502, {2005, 12, 20}}
									 ,{60503, {2005, 12, 20}}
									 ,{50001, {2000, 63, 52}}
									 ,{50002, {2000, 63, 52}}
									 ,{50003, {2000, 63, 52}}
									 ,{50004, {2000, 63, 52}}
									 ,{104, 	{2000, 63, 100}}
									 }
end

function main()
	data()
end
