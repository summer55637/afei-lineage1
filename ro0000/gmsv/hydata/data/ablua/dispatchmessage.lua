function FreeDispatchMessage(fd,func)
	local checksum = 0
	local checksumrecv = 0
	local checksumrecvtemp = 0
	if func == 822 then
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return 1
		end
		local cdkey = char.getChar(charaindex,"账号")
		local buffnum
		buffnum,checksum = lssproto.deint(fd,2)
		checksumrecvtemp,checksumrecv = lssproto.deint(fd,3)
		if checksum ~= checksumrecv then
			return 1
		end
		
		if string.len(char.getChar(charaindex,"账号")) <= 8 then
			local ack = string.sub(char.getChar(charaindex,"账号"),1,1)
			local nameBype = string.byte(ack)
			if net.getloginmark(fd) == 2 then
				if nameBype + 6 ~= buffnum then
					lssproto.mkbuffer(fd)
					checksum = lssproto.mkint(fd,buffnum)
					lssproto.mkint(fd,checksum)
					lssproto.SendMesg(fd,823)
					char.WarpToSpecificPoint(charaindex,117,289,168)
					net.endOne(fd)
					char.logou(charaindex)
					token = "insert into `speedlog` values ('" .. cdkey .. "',100,100,NOW())"
					sasql.query(token)
					return 1
				end
			elseif net.getloginmark(fd) == 4 then
				if nameBype + 15 ~= buffnum then
					lssproto.mkbuffer(fd)
					checksum = lssproto.mkint(fd,buffnum)
					lssproto.mkint(fd,checksum)
					lssproto.SendMesg(fd,823)
					char.WarpToSpecificPoint(charaindex,117,289,168)
					net.endOne(fd)
					char.logou(charaindex)
					token = "insert into `speedlog` values ('" .. cdkey .. "',200,200,NOW())"
					sasql.query(token)
					return 1
				end
			end
		end
		
		local tiaotime = other.time() - char.getWorkInt(charaindex,"心跳时间")
		
		if tiaotime < 26 then
			if char.getWorkInt(charaindex,"心跳次数") >= 4 then
				lssproto.mkbuffer(fd)
				checksum = lssproto.mkint(fd,buffnum)
				lssproto.mkint(fd,checksum)
				lssproto.SendMesg(fd,823)
				char.WarpToSpecificPoint(charaindex,117,289,168)
				net.endOne(fd)
				char.logou(charaindex)
				token = "insert into `speedlog` values ('" .. cdkey .. "'," .. tiaotime .. ",5,NOW())"
				sasql.query(token)
				return 1
			else
				char.setWorkInt(charaindex,"心跳次数",char.getWorkInt(charaindex,"心跳次数") + 1)
				char.setWorkInt(charaindex,"心跳时间",other.time())
				--token = "insert into `speedlog` values ('" .. cdkey .. "'," .. tiaotime .. "," .. char.getWorkInt(charaindex,"心跳次数") .. ",NOW())"
				--sasql.query(token)
			end
		else
			char.setWorkInt(charaindex,"心跳时间",other.time())
			char.setWorkInt(charaindex,"心跳次数",0)
		end
		lssproto.mkbuffer(fd)
		checksum = lssproto.mkint(fd,buffnum)
		lssproto.mkint(fd,checksum)
		lssproto.SendMesg(fd,823)
		return 1
	elseif func == 65 then
		return 1
	elseif func == 116 then
		return 1
	elseif func == 242 then
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return 1
		end
		local chartitleindex
		chartitleindex,checksum = lssproto.deint(fd,2)
		checksumrecvtemp,checksumrecv = lssproto.deint(fd,3)
		if checksum ~= checksumrecv then
			return 1
		end
		if char.getWorkInt(charaindex,"战斗索引") > -1 then
			return 1
		end
		other.CallFunction("playertitleuse","data/ablua/chartitle.lua",{charaindex,chartitleindex})
		return 1
	elseif func == 261 then
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return 1
		end
		GetGoldSend(charaindex)
		return 1
	elseif func == 824 then
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return 1
		end
		local flg1
		local flg2
		local checksum1 = 0
		flg1,checksum = lssproto.deint(fd,2)
		flg2,checksum1 = lssproto.deint(fd,3)
		checksum = checksum + checksum1
		checksumrecvtemp,checksumrecv = lssproto.deint(fd,4)
		if checksum ~= checksumrecv then
			return 1
		end
		if (flg1 < 601 or flg1 > 800) and (flg1 < 301 or flg1 > 400) then
			return 1
		end
		if flg2 <= 0 then
			npc.EvEnd(charaindex,flg1)
		else
			if npc.CheckEvent(charaindex,flg1) ~= 0 then
				return 1
			end
			npc.EvNow(charaindex,flg1)
			npc.EventID(charaindex,flg1 .. "-" .. flg2)
		end
		return 1
	elseif func == 71 or func == 151 then--PC登录(71)--手机登录(151)
		local checksumtemp = 0
		local recvcnt = 2
		local logintype = 1
		if func == 151 then
			logintype = 2
		end
		local cdkey,passwd,mac1,mac2,servid,logintime,md5buff,mactype
		local macbuff = ""
		cdkey,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		passwd,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		mactype,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		mac1,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		mac2,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		servid,checksumtemp = lssproto.deint(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		logintime,checksumtemp = lssproto.deint(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		md5buff,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		if logintype == 1 then
			macbuff,checksumtemp = lssproto.destring(fd,recvcnt)
			checksum = checksum + checksumtemp
			recvcnt = recvcnt + 1
		end
		checksumtemp = lssproto.deint(fd,recvcnt)
		print("[FreeDispatchMessage]151,checksumtemp:"..checksumtemp..":"..checksum.." mac2:"..mac2)
		if checksum ~= checksumtemp then
			lssproto.ClientLogin(fd,"cur ver is too old,please update you apk")
			net.setCloseRequest(fd,1)
			--net.endOne(fd)
			return 1
		end
		if cdkey == "" or passwd == "" then
			net.endOne(fd)
			return 1
		end
		if net.getState(fd) ~= 0 then
			net.endOne(fd)
			return 1
		end
		net.setState(fd,1)
		if other.checkString(cdkey) == 1 or other.checkString(passwd) == 1 then
			net.endOne(fd)
			return 1
		end
		if string.len(mac1) > 128 or string.len(mac2) > 128 then
			net.endOne(fd)
			return 1
		end
		if other.checkString(mac1) == 1 then
			mac1 = ""
		end
		if other.checkString(mac2) == 1 then
			mac2 = ""
		end
		-- if other.atoi(mac2) < 20190220 then
		-- 	lssproto.ClientLogin(fd, "cur ver is too old")
		-- 	net.setCloseRequest(fd,1)
		-- 	return 1
		-- end
		net.setCdkey(fd,cdkey)
		net.setPasswd(fd,passwd)
		net.setCtype(fd,2)
		net.setServid(fd,servid)
		net.setMAC1(fd,mac1)
		net.setMAC2(fd,mac2)
		net.setMAC3(fd,"")
		local ip = net.getIP(fd)
		print("login:" .. cdkey .. "\n")
		local locktype = other.CallFunction("FreeLock","data/ablua/lock.lua",{cdkey})
		
		if locktype == -1 then
			net.endOne(fd)
			return 1
		elseif locktype == 1 then
			lssproto.ClientLogin(fd,"您的账号被永久锁定")
			net.setCloseRequest(fd,1)
			return 1
		elseif locktype > 1 then
			lssproto.ClientLogin(fd,"您的账号被锁定至" .. os.date("%Y-%m-%d",locktype))
			net.setCloseRequest(fd,1)
			return 1
		end
		locktype = other.CallFunction("FreeLock","data/ablua/lock.lua",{ip})
		print("loginUser:" .. cdkey .. ",pass:"..passwd..",ret:"..locktype)
		if locktype == -1 then
			net.endOne(fd)
			return 1
		elseif locktype == 1 then
			lssproto.ClientLogin(fd,"您的IP被永久锁定")
			net.setCloseRequest(fd,1)
			return 1
		elseif locktype > 1 then
			lssproto.ClientLogin(fd,"您的IP被锁定至" .. os.date("%Y-%m-%d",locktype))
			net.setCloseRequest(fd,1)
			return 1
		end
		locktype = other.CallFunction("FreeLock","data/ablua/lock.lua",{mac1})
		if locktype == -1 then
			net.endOne(fd)
			return 1
		elseif locktype == 1 then
			lssproto.ClientLogin(fd,"您的IP被永久锁定")
			net.setCloseRequest(fd,1)
			return 1
		elseif locktype > 1 then
			lssproto.ClientLogin(fd,"您的IP被锁定至" .. os.date("%Y-%m-%d",locktype))
			net.setCloseRequest(fd,1)
			return 1
		end
		token = "select `PassWord` from `CSAlogin` where `Name`='" .. cdkey .. "'"
		ret = sasql.query(token)
		if ret ~= 1 then
			net.endOne(fd)
			return 1
		end
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			if sasql.data(1) == nil then
				lssproto.ClientLogin(fd,"您的密码错误")
				net.setCloseRequest(fd,1)
				return 1
			elseif sasql.data(1) ~= other.md5(passwd) and sasql.data(1) ~= passwd then
				lssproto.ClientLogin(fd,"您的密码错误")
				net.setCloseRequest(fd,1)
				return 1
			else
				if string.len(sasql.data(1)) < 32 then
					token = "update `CSAlogin` set `PassWord`='" .. other.md5(passwd) .. "' where `Name`='" .. cdkey .. "'"
					sasql.query(token)
				end
			end
		else
			if config.getServernumber() > 100 then
				if string.len(cdkey) < 6 or string.len(cdkey) > 8 then
					lssproto.ClientLogin(fd,"账号长度为(6-8)位")
					net.setCloseRequest(fd,1)
					return 1
				end
				token = "insert into `CSAlogin` (`Name`,`PassWord`,`RegIP`,`RegTime`,`NeiCe`,`TuiJianQQ`) values ('" .. cdkey .. "','" .. other.md5(passwd) .. "','" .. ip .. "','" .. os.date("%Y-%m-%d %H:%M:%S",os.time()) .. "','0','13800138000')"
				ret = sasql.query(token)
				if ret ~= 1 then
					lssproto.ClientLogin(fd,"您的账号尚未注册")
					net.setCloseRequest(fd,1)
					return 1
				end
			else
				lssproto.ClientLogin(fd,"您的账号尚未注册")
				net.setCloseRequest(fd,1)
				return 1
			end
		end
		if other.CallFunction("FreeLoginCheck","data/ablua/logincheck.lua",{fd,"a" .. cdkey, "a" .. passwd, ip, mac1 ,mac2,mactype,logintime,md5buff,macbuff,logintype}) == 0 then
			net.setCloseRequest(fd,1)
			saacproto.ACKick(cdkey,-1,1)
			return 1
		end
		lssproto.ClientLogin(fd,"ok")
		token = "update `CSAlogin` set `LoginTime`=NOW(),`IP`='" .. ip .. "',`MAC1`='" .. mac1 .. "',`MAC2`='" .. mac2 .. "',`MAC3`='" .. mactype .. "',`Online`=" .. config.getServernumber() .. " where `Name`='" .. cdkey .. "'"
		sasql.query(token)
		return 1
	elseif func == 801 then--渠道登录
		local checksumtemp = 0
		local recvcnt = 2
		local qdtype,uid,qdtoken,mac1,mac2,servid
		local mactype = ""
		qdtype,checksumtemp = lssproto.deint(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		uid,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		qdtoken,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		mac1,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		mac2,checksumtemp = lssproto.destring(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		if mac2 ~= ")(pi55" then--IOS商城
			mactype,checksumtemp = lssproto.destring(fd,recvcnt)
			checksum = checksum + checksumtemp
			recvcnt = recvcnt + 1
		end
		servid,checksumtemp = lssproto.deint(fd,recvcnt)
		checksum = checksum + checksumtemp
		recvcnt = recvcnt + 1
		checksumtemp = lssproto.deint(fd,recvcnt)
		if checksum ~= checksumtemp then
			lssproto.ClientLogin(fd,"您的版本过旧，请更新游戏")
			net.setCloseRequest(fd,1)
			--net.endOne(fd)
			return 1
		end
		if qdtype == nil or uid == nil or qdtoken == nil or mac1 == nil or mac2 == nil or servid == nil then
			net.endOne(fd)
			return 1
		end
		if uid == "" or qdtoken == "" then
			return 1
		end
		if net.getState(fd) ~= 0 then
			net.endOne(fd)
			return 1
		end
		net.setState(fd,1)
		if other.checkString(uid) == 1 then
			net.endOne(fd)
			return 1
		end
		if string.len(mac1) > 128 or string.len(mac2) > 128 then
			net.endOne(fd)
			return 1
		end
		if other.checkString(mac1) == 1 then
			mac1 = ""
		end
		if other.checkString(mac2) == 1 then
			mac2 = ""
		end
		if mac2 ~= ")(pi55" then--IOS商城
			if other.atoi(mac2) < 20190220 then
				lssproto.ClientLogin(fd, "您当前的版本太旧")
				net.setCloseRequest(fd,1)
				return 1
			end
		end
		if qdtype == 1 then
			uid = "vivo" .. uid
		elseif qdtype == 2 then
			uid = "oppo" .. uid
		elseif qdtype == 3 then
			uid = "U8-" .. uid
		elseif qdtype == 4 then
			uid = "MT-" .. uid
		elseif qdtype == 5 then
			uid = "A8-" .. uid
		end
		local cdkey = ""
		local passwd = ""
		token = "select `Name`,`PassWord`,`token` from `CSAlogin` where `uid`='" .. uid .. "'"
		ret = sasql.query(token)
		if ret ~= 1 then
			net.endOne(fd)
			return 1
		end
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			if sasql.data(1) == nil or sasql.data(2) == nil or sasql.data(3) == nil then
				net.endOne(fd)
				return 1
			end
			cdkey = sasql.data(1)
			passwd = sasql.data(2)
			if qdtoken ~= sasql.data(3) then
				lssproto.ClientLogin(fd,"登录验证失败")
				net.setCloseRequest(fd,1)
				return 1
			end
		else
			lssproto.ClientLogin(fd,"您的账号尚未注册")
			net.setCloseRequest(fd,1)
			return 1
		end
		if cdkey == "" or passwd == "" then
			net.endOne(fd)
			return 1
		end
		checksum = 0
		lssproto.mkbuffer(fd)
		checksum = lssproto.mkstring(fd,cdkey)
		lssproto.mkint(fd,checksum)
		lssproto.SendMesg(fd,802)
		net.setCdkey(fd,cdkey)
		net.setPasswd(fd,passwd)
		net.setCtype(fd,2)
		net.setServid(fd,servid)
		net.setMAC1(fd,mac1)
		net.setMAC2(fd,mac2)
		net.setMAC3(fd,"")
		local ip = net.getIP(fd)
		
		local locktype = other.CallFunction("FreeLock","data/ablua/lock.lua",{cdkey})
		print("loginUser:" .. cdkey .. ",pass:"..passwd..",ret:"..locktype)
		if locktype == -1 then
			net.endOne(fd)
			return 1
		elseif locktype == 1 then
			lssproto.ClientLogin(fd,"您的账号被永久锁定")
			net.setCloseRequest(fd,1)
			return 1
		elseif locktype > 1 then
			lssproto.ClientLogin(fd,"您的账号被锁定至" .. os.date("%Y-%m-%d",locktype))
			net.setCloseRequest(fd,1)
			return 1
		end
		locktype = other.CallFunction("FreeLock","data/ablua/lock.lua",{ip})
		if locktype == -1 then
			net.endOne(fd)
			return 1
		elseif locktype == 1 then
			lssproto.ClientLogin(fd,"您的IP被永久锁定")
			net.setCloseRequest(fd,1)
			return 1
		elseif locktype > 1 then
			lssproto.ClientLogin(fd,"您的IP被锁定至" .. os.date("%Y-%m-%d",locktype))
			net.setCloseRequest(fd,1)
			return 1
		end
		locktype = other.CallFunction("FreeLock","data/ablua/lock.lua",{mac1})
		if locktype == -1 then
			net.endOne(fd)
			return 1
		elseif locktype == 1 then
			lssproto.ClientLogin(fd,"您的IP被永久锁定")
			net.setCloseRequest(fd,1)
			return 1
		elseif locktype > 1 then
			lssproto.ClientLogin(fd,"您的IP被锁定至" .. os.date("%Y-%m-%d",locktype))
			net.setCloseRequest(fd,1)
			return 1
		end
		if other.CallFunction("FreeLoginCheck","data/ablua/logincheck.lua",{fd,"a" .. cdkey, "a" .. passwd, ip, mac1 ,mac2,mactype,0,"","",3}) == 0 then
			net.setCloseRequest(fd,1)
			saacproto.ACKick(cdkey,-1,1)
			return 1
		end
		lssproto.ClientLogin(fd,"ok")
		token = "update `CSAlogin` set `LoginTime`=NOW(),`IP`='" .. ip .. "',`MAC1`='" .. mac1 .. "',`MAC2`='" .. mac2 .. "',`MAC3`='" .. mactype .. "',`Online`=" .. config.getServernumber() .. " where `Name`='" .. cdkey .. "'"
		sasql.query(token)
		return 1
	elseif func == 9999 then
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return 1
		end
		local typebuff = ""
		if net.getloginmark(fd) == 2 then
			typebuff = "PC"
		else
			typebuff = "手机"
		end
		token = "insert into `LockLog` values ('" .. char.getChar(charaindex,"账号") .. "','" .. typebuff .. "',NOW())"
		sasql.query(token)
		return 1
	end
	
	return 0
end

function TitleSend(charaindex,data)
	if char.check(charaindex) ~= 1 then
		return 0
	end
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkstring(fd,data)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,243)
	return 0
end

function TotalbonusSend(charaindex,data)
	if char.check(charaindex) ~= 1 then
		return 0
	end
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkstring(fd,data)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,842)
	return 0
end

function HaloSend(charaindex,data)
	if char.check(charaindex) ~= 1 then
		return 0
	end
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkstring(fd,data)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,907)
	return 0
end

function GetGoldSend(charaindex)
	if char.check(charaindex) ~= 1 then
		return 0
	end
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkint(fd,char.getInt(charaindex,"石币"))
	checksum = checksum + lssproto.mkint(fd,sasql.getVipPoint(charaindex))
	checksum = checksum + lssproto.mkint(fd,math.floor(char.getInt(charaindex,"声望") / 100))
	checksum = checksum + lssproto.mkint(fd,char.getInt(charaindex,"活力"))
	local vigordata = char.getChar(charaindex,"活力时间")
	local vigornum = 0
	if vigordata ~= "" then
		if os.date("%Y%m%d",os.time()) == other.getString(vigordata,"|",1) then
			vigornum = other.atoi(other.getString(vigordata,"|",2))
		end
	end
	checksum = checksum + lssproto.mkint(fd,vigornum)
	checksum = checksum + lssproto.mkint(fd,sasql.getPetPoint(charaindex))
	checksum = checksum + lssproto.mkint(fd,sasql.getPayPoint(charaindex))
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,262)
	return 0
end

function EmailRedSend(charaindex,flg)
	if char.check(charaindex) ~= 1 then
		return 0
	end
    local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end

	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = checksum + lssproto.mkint(fd,flg)
	lssproto.mkint(fd,checksum)
    lssproto.SendMesg(fd,831)
	return 0
end

function RedPointSend(charaindex,type)
	--每日福利(目前在线时间 0已领取)|等级达成(位移 是否领取)|每日签到(目前在线时间 0已领取)|首冲礼包(是否领取 0已领取,1可以领,2未充值)|当前活动活跃度|活跃度奖励领取位移|
	if char.check(charaindex) ~= 1 then
		return 0
	end
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local token = ""
	local reward = 0
	if type == 0 then
		if char.getInt(charaindex,"签到时间") == tonumber(os.date("%Y%m%d", os.time())) then
			reward = 1
		end
		if reward == 1 then
			token = "0"
		else
			token = char.getInt(charaindex,"签到在线时间") * 60
		end
		local dataflg = {0,0,0,0}
		sqltoken = "select * from `Gift` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				for i=2,5 do
					dataflg[i-1] = other.atoi(sasql.data(i))
				end
			end
		end
		reward = 0
		for i=1,4 do
			if dataflg[i] == 1 then
				reward = other.DataOrData(reward,i - 1)
			end
		end
		token = token .. "|" .. reward
		reward = 0
		-- sqltoken = "select `today` from `DaySign` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
		sqltoken = "select `date` from `daysign` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if other.atoi(sasql.data(1)) == tonumber(os.date("%Y%m%d", os.time())) then
					reward = 1
				end
			end
		end
		if reward == 1 then
			token = token .. "|0"
		else
			token = token .. "|" .. char.getInt(charaindex,"签到在线时间") * 60
		end
		reward = 2
		sqltoken = "select `PayTotal` from `CSAlogin` where `Name`='" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if other.atoi(sasql.data(1)) >= 10 then
					reward = 0
					sqltoken = "select * from `FirstPayReward` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() <= 0 then
							reward = 1
						end
					end
				end
			end
		end
		token = token .. "|" .. reward
		token = token .. "|" .. other.CallFunction("queryHuoyueLua","data/ablua/npc/huoyue/huoyue.lua",{charaindex,1})
		token = token .. "|" .. other.CallFunction("queryHuoyueLua","data/ablua/npc/huoyue/huoyue.lua",{charaindex,2})
	elseif type == 1 then
		if char.getInt(charaindex,"签到时间") == tonumber(os.date("%Y%m%d", os.time())) then
			reward = 1
		end
		if reward == 1 then
			token = "0"
		else
			token = char.getInt(charaindex,"签到在线时间") * 60
		end
	elseif type == 2 then
		local dataflg = {0,0,0,0}
		sqltoken = "select * from `Gift` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				for i=2,5 do
					dataflg[i-1] = other.atoi(sasql.data(i))
				end
			end
		end
		for i=1,4 do
			if dataflg[i] == 1 then
				reward = other.DataOrData(reward,i - 1)
			end
		end
		token = reward
	elseif type == 3 then
		sqltoken = "select `today` from `DaySign` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if other.atoi(sasql.data(1)) == tonumber(os.date("%Y%m%d", os.time())) then
					reward = 1
				end
			end
		end
		if reward == 1 then
			token = "0"
		else
			token = char.getInt(charaindex,"签到在线时间") * 60
		end
	elseif type == 4 then
		reward = 2
		sqltoken = "select `PayTotal` from `CSAlogin` where `Name`='" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if other.atoi(sasql.data(1)) >= 10 then
					reward = 0
					sqltoken = "select * from `FirstPayReward` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() <= 0 then
							reward = 1
						end
					end
				end
			end
		end
		token = reward
	elseif type == 5 then
		token = other.CallFunction("queryHuoyueLua","data/ablua/npc/huoyue/huoyue.lua",{charaindex,1})
	elseif type == 6 then
		token = other.CallFunction("queryHuoyueLua","data/ablua/npc/huoyue/huoyue.lua",{charaindex,2})
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkint(fd,type)
	checksum = checksum + lssproto.mkstring(fd,token)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,825)
	return 1
end

function EvEntSend(charaindex,eventid,enentid2)
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkint(fd,eventid)
	checksum = checksum + lssproto.mkint(fd,enentid2)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,826)
	return 0
end

function ShowPaySend(charaindex,orderid,url)
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkstring(fd,orderid)
	checksum = checksum + lssproto.mkstring(fd,url)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,827)
	return 0
end

function SAsend(charaindex,type)
	if char.check(charaindex) ~= 1 then
		return 0
	end
	local wenmingendtime = 0
	if type == 1 then
		wenmingendtime = other.CallFunction("getEndTime","data/ablua/npc/wenming/wenming.lua",{charaindex})
	end
	local expbase = 1
	if char.getInt(charaindex,"转数") >= 1 or type == 2 then
		expbase = 4
	elseif char.getInt(charaindex,"等级") >= 120 then
		expbase = 4
	elseif char.getInt(charaindex,"等级") >= 80 then
		expbase = 2
	elseif char.getInt(charaindex,"等级") >= 10 then
		expbase = 2
	end
	-- local token = "A|" .. expbase * 100 .. "|" .. config.getBattleexptime() .. "|" .. (100 + char.getInt(charaindex,"经验加成"))
	local token = "A|" .. expbase * 100 .. "|" .. 0 .. "|" .. (100 + char.getInt(charaindex,"经验加成"))
	token=token.. "|" .. char.getInt(charaindex,"经验时间") .. "|" .. (char.getInt(charaindex,"遇敌几率倍数") + 1) * 100 .. "|" 
	token=token.. char.getInt(charaindex,"遇敌几率时间") .. "|" .. wenmingendtime
	lssproto.S(charaindex,token)
	return 0
end

function Tasksend(charaindex,data)
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	checksum = lssproto.mkstring(fd,data)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,828)
	return 0
end

function battleflysend(charaindex)
	local fd = char.getFd(charaindex)
	if fd == -1 then
		return 0
	end
	local checksum = 0
	lssproto.mkbuffer(fd)
	lssproto.mkint(fd,checksum)
	lssproto.SendMesg(fd,829)
	return 0
end

function data()
	
end

function main()
	data()
end