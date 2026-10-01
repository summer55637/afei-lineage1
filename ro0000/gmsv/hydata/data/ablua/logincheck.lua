--登录过程读取和验证
function getQQnum( cdkey )
	token = "SELECT `QQ` FROM `CSAlogin` "
				.. " WHERE `Name` = '" .. cdkey .. "'"
	ret = sasql.query(token)
	QQ = ""
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			QQ = sasql.data(1)
		end
	end
	if QQ ~= "" then
		token = "SELECT count(*) FROM `CSAlogin` "
				.. " WHERE `Online` = '" .. config.getServernumber() .. "' and `Offline` = '0' and `QQ` = '" .. QQ .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			num = sasql.num_rows()
			if num > 0 then
				sasql.fetch_row(0)
				return other.atoi(sasql.data(1))
			end
		end
	end
	return 0
end
function FreeLoginCheck( fd,cdkey, passwd, ip, mac1 ,mac2,mac3,logintime,md5buff,macbuff,logintype)
	local mun = 0
	local maxnum = 0
	local maxplayer = config.getFdnum() - 1
	local mac = net.getMac(fd)
	local mac2 = net.getMac2(fd)
	local ip = net.getIP(fd)
	local tmpcdkey = "1"
	local ipnum = 0
	local qqnum = 0
	local test_type = 0
	cdkey = string.sub(cdkey,2,-1)
	passwd = string.sub(passwd,2,-1)
	if config.getServernumber() > 100 then
		test_type = 1
	end
	if mac1 == "" then
		mac = cdkey
	end
	local idkey = 0
	print("[FreeLoginCheck]"..mac2..","..mac3)
	if mac2 == ")(pi55" then--IOS商城
		idkey=4
	else
		-- if other.atoi(mac2) < 20190220 then
		-- 	lssproto.ClientLogin(fd, "您当前的版本太旧")
		-- 	return 0
		-- end
		if mac3 == "win" then--PC
			idkey=2
		elseif mac3 == "android" then--Android
			idkey=4
		elseif mac3 == "ios" then--IOS
			idkey=4
		elseif mac3 == "iosshop" then--IOS
			idkey=4
		end
	end
	if test_type == 1 then
		if mac2 == "i9nhy6" then--Android白包
			idkey=4
		end
	end
	if idkey==0 then
		lssproto.ClientLogin(fd, "您当前的版本太旧")
		return 0
	end
	if logintype == 1 then--PC
		if idkey ~= 2 then
			lssproto.ClientLogin(fd, "非法登陆")
			return 0
		end
		if logintime < other.time() - 300 or logintime > other.time() + 300 then
			lssproto.ClientLogin(fd, "您设备的日期和时间不正确,请调整后连接")
			return 0
		end
		--if other.md5(cdkey .. passwd .. logintime .. "7b36fa67c2f982245c94675e45bcc15c") ~= md5buff then
		if other.md5(cdkey .. passwd .. logintime .. "5416d7cd6ef195a0f7622a9c56b55e84") ~= md5buff then
			lssproto.ClientLogin(fd, "登陆验证失败1")
			return 0
		end
	elseif logintype == 2 then--手机
		if idkey ~= 4 then
			lssproto.ClientLogin(fd, "非法登陆")
			return 0
		end
		if logintime < other.time() - 300 or logintime > other.time() + 300 then
			lssproto.ClientLogin(fd, "您设备的日期和时间不正确,请调整后连接")
			return 0
		end
		local md5Token = other.md5(logintime .. cdkey .. passwd .. "5416d7cd6ef195a0f7622a9c56b55e84")
		--print("[FreeLoginCheck]md5:"..md5Token..":"..md5buff)
		if md5Token ~= md5buff then
			lssproto.ClientLogin(fd, "登陆验证失败2")
			return 0
		end
	elseif logintype == 3 then--渠道
		if idkey ~= 4 and idkey ~= 5 then
			lssproto.ClientLogin(fd, "非法登陆")
			return 0
		end
	else
		lssproto.ClientLogin(fd, "非法登陆")
		return 0
	end
	maxnum = 20
	
	token = "SELECT `Online` FROM `CSAlogin` ".. " WHERE `Name` = '" .. cdkey .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			if other.atoi(sasql.data(1)) ~= config.getServernumber() then
				token = "SELECT * FROM `CSAlogin` "
							.. " WHERE `Online` = '" .. config.getServernumber() .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					num = sasql.num_rows()
					if config.getGameservername() == "娱乐互动线" then
						if num >= 800 then
							lssproto.ClientLogin(fd, "当前线路人数已满")
							return 0
						end
					else
						if num >= char.getPlayerMaxNum() - 50 then
							lssproto.ClientLogin(fd, "当前线路人数已满")
							return 0
						end
					end
				end
			end
		end
	end
	
	token = "SELECT * FROM `CSAlogin` "
				.. " WHERE `Online` = '" .. config.getServernumber() .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			QQ = sasql.data(1)
		end
	end
	--设备标识 PC:1 IOS:2 MAC：3 Android：4
	net.setloginmark(fd,idkey);
	
	local manrentype = 0
	for i = 5, maxplayer do
		if fd ~= i then
			if net.getUse(i) == 1 then
				if net.getCdkey(i) == net.getCdkey(fd) and net.getSocketType(i) ~= 2 then
					lssproto.ClientLogin(fd, "不能重复登陆同一账号！")
					net.endOne(i)
					return 0
				end
				local fdmac = net.getMac(i)
				local fdmac2 = net.getMac2(i)
				if mac == fdmac and mac2 == fdmac2 and net.getCdkey(i) ~= net.getCdkey(fd) and char.getWorkInt(net.getCharaindex(i),"离线") < 1 then
					if tmpcdkey ~= net.getCdkey(i) then
						mun = mun + 1
						tmpcdkey = net.getCdkey(i)
					end
					if mun >= maxnum then
						--lssproto.ClientLogin(fd, "您在当前线路登录数量已满，请尝试登录其他线路。")
						--return 0
						manrentype = 1
						break
					end
				end
				--if config.getGameservername() == "石器时代1线"  or config.getGameservername() == "石器时代222" then
				if maxnum < 10 then
					if config.checkIp(ip) == 0 then
						if net.getIP(i) == ip then
							ipnum = ipnum + 1
							if ipnum >= 20 then
								lssproto.ClientLogin(fd, "您在当前线路登录数量已满，请尝试登录其他线路")
								return 0
							end
						end
					end
				end
				--end
			end
		end
	end
	
	if manrentype == 1 then
		for i = 5, maxplayer do
			if net.getUse(i) == 1 then
				local fdmac = net.getMac(i)
				if fdmac == mac and i ~= fd then
					if char.getChar(net.getCharaindex(i),"账号") == "" then
						net.endOne(i)
					end
				end
			end
		end
		lssproto.ClientLogin(fd, "您在当前线路登录数量已满，请尝试登录其他线路。")
		return 0
	end
	
	token = "SELECT `Online`,`MAC1`,`MAC2`,`MAC3` FROM `CSAlogin` "
				.. " WHERE `Name` = '" .. cdkey .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			if other.atoi(sasql.data(1)) < 1 then
				token = "SELECT count(*) FROM `CSAlogin` "
					.. " WHERE `MAC1` = '" .. mac .. "' and `Online` > 0 and `Offline` = 0"
				ret = sasql.query(token)
				local totalnum = 6
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					num = sasql.num_rows()
					if num > 0 then
						sasql.fetch_row(0)
						onlinenum = other.atoi(sasql.data(1))
						if onlinenum >= totalnum then
							lssproto.ClientLogin(fd, "您的游戏登录账号数量已达上限")
							return 0
						end
					end
				end
			else
				onlineflg = other.atoi(sasql.data(1))
				if onlineflg ~= config.getServernumber() then
					onlinename = "测试线"
					if onlineflg == 1 then
						onlinename = "一线"
					elseif onlineflg == 2 then
						onlinename = "二线"
					elseif onlineflg == 3 then
						onlinename = "三线"
					elseif onlineflg == 4 then
						onlinename = "四线"
					elseif onlineflg == 5 then
						onlinename = "五线"
					elseif onlineflg == 6 then
						onlinename = "六线"
					elseif onlineflg == 7 then
						onlinename = "七线"
					elseif onlineflg == 8 then
						onlinename = "八线"
					elseif onlineflg == 9 then
						onlinename = "九线"
					elseif onlineflg == 10 then
						onlinename = "十线"
					elseif onlineflg == 11 then
						onlinename = "十一线"
					elseif onlineflg == 12 then
						onlinename = "十二线"
					elseif onlineflg == 13 then
						onlinename = "十三线"
					elseif onlineflg == 14 then
						onlinename = "十四线"
					elseif onlineflg == 99 then
						onlinename = "娱乐互动线"
					end
					lssproto.ClientLogin(fd, "请登陆" .. onlinename .. "或再次尝试登陆本线")
					return 0
				end
			end
		end
	end
	
	
	--[[token = "SELECT `SafePasswd` FROM `CSAlogin` "
				.. " WHERE `Name` = '" .. cdkey .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			if sasql.data(1) == "caonimacaoni" then
				lssproto.ClientLogin(fd, "为了您的安全，您的账号已被客服上锁，请联系客服修改密码后解锁。")
				return 0
			end
		end
	end]]
	return 1
end

function data()
	
end

function main()
	data()
end