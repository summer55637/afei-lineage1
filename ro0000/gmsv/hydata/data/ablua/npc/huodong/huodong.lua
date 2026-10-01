function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		local petindex = char.getCharPet(charaindex, i)
		if char.check(petindex) ~= 1 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

--检查活动时间
function checkOverTime(timeStart,timeEnd)
	local curTime = other.time()
	return (timeStart + timeEnd == 0) or (curTime >= timeStart and curTime<=timeEnd)
end

 function setCostData(talkerindex,point)
	if other.time() >= 1550678400 and other.time() <= 1640962800 then
		sqltoken = "select * from `costdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sqltoken = "update `costdata` set `point`=`point` + " .. point .. ",`time`=NOW() where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				sasql.query(sqltoken)
			else
				sqltoken = "insert into `costdata` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. point .. ",NOW(),0,'" .. char.getChar(talkerindex,"名字") .. "')"
				sasql.query(sqltoken)
			end
		end
		sqltoken = "select `point` from `costdaydata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. os.date("%Y%m%d",os.time()) .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sqltoken = "update `costdaydata` set `point`=`point` + " .. point .. ",`time`=" .. other.time() .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. os.date("%Y%m%d",os.time()) .. "'"
				sasql.query(sqltoken)
			else
				sqltoken = "insert into `costdaydata` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. os.date("%Y%m%d",os.time()) .. "'," .. point .. "," .. other.time() .. ",0,0,'" .. char.getChar(talkerindex,"名字") .. "')"
				sasql.query(sqltoken)
			end
		end
	end
	return 0
end

function Loop(meindex)
	for listi=1,#huodongdata do
		if huodongdata[listi][1] == 23 then
			if #PayDayPaiMing_Data[4] > 0 then
				if checkOverTime(huodongdata[listi][4],huodongdata[listi][5])  then
					if (other.atoi(os.date("%H"),os.time()) == 0 and other.atoi(os.date("%M"),os.time()) > 5) or #PayDayPaiMing == 0 then
						local ydate = os.date("%Y%m%d",other.time() - 86400)
						local tdate = os.date("%Y%m%d",other.time() + 86400)
						if #PayDayPaiMing_Data[4] > 0 and os.date("%Y%m%d",other.time()) ~= PayDayPaiMing_Data[4][1] then
							local zhao = 0
							for j=1,#PayDayPaiMing_Data[4] do
								if ydate == PayDayPaiMing_Data[4][j] then
									zhao = j
									break
								end
							end
							if zhao == 0 then
								zhao = #PayDayPaiMing_Data[4]
							end
							local totalzhao = #PayDayPaiMing
							if zhao > totalzhao then
								for j=1,zhao - totalzhao do
									sqltoken = "select `cdkey` from `PayDayData` where `date`='" .. PayDayPaiMing_Data[4][totalzhao + j] .. "' order by `point` desc,`time` asc"
									ret = sasql.query(sqltoken)
									if ret == 1 then
										sasql.free_result()
										sasql.store_result()
										sqlnum = sasql.num_rows()
										if sqlnum > 0 then
											PayDayPaiMing[#PayDayPaiMing + 1] = {PayDayPaiMing_Data[4][totalzhao + j]}
											for k=1,math.min(sqlnum,3) do
												sasql.fetch_row()
												PayDayPaiMing[#PayDayPaiMing][k + 1] = {sasql.data(1)}
											end
											for k=2,#PayDayPaiMing[#PayDayPaiMing] do
												sqltoken = "select `OnlineName` from `csalogin` where `Name`='" .. PayDayPaiMing[#PayDayPaiMing][k][1] .. "'"
												ret = sasql.query(sqltoken)
												if ret == 1 then
													sasql.free_result()
													sasql.store_result()
													if sasql.num_rows() > 0 then
														sasql.fetch_row()
														PayDayPaiMing[#PayDayPaiMing][k][2] = sasql.data(1)
													end
												end
											end
										end
									end
								end
							end
						end
					end
				end
			end
		elseif huodongdata[listi][1] == 25 then
			if config.getGameservername() == "娱乐互动线" then
				if checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
					if today25 ~= os.date("%Y%m%d",os.time()) and other.atoi(os.date("%H",os.time())) >= 20 then
						today25 = os.date("%Y%m%d",os.time())
						local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
						sqltoken = "select `cdkey`,`flg" .. todaydate .. "` from `ItemShop2` where `flg" .. todaydate .. "`>=2"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							local today25num = 100 - sqlnum
							if today25num > 0 then
								sqltoken = "update `ItemShop2` set `flg" .. todaydate .. "`=2 where `flg" .. todaydate .. "`=1 order by `paytotal` desc limit " .. today25num
								sasql.query(sqltoken)
							end
						end
					end
				end
			end
		elseif huodongdata[listi][1] == 26 then
			if config.getGameservername() == "娱乐互动线" then
				if checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
					if today26 ~= os.date("%Y%m%d",os.time()) and other.atoi(os.date("%H",os.time())) >= 20 then
						today26 = os.date("%Y%m%d",os.time())
						local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
						sqltoken = "select `cdkey`,`flg" .. todaydate .. "` from `ItemShop` where `flg" .. todaydate .. "`>=2"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							sqltoken = "select `num` from `ItemShopNum` where `id`=" .. todaydate
							ret = sasql.query(sqltoken)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								if sasql.num_rows() > 0 then
									sasql.fetch_row()
									local today26num = other.atoi(sasql.data(1)) - sqlnum
									if today26num > 0 then
										sqltoken = "update `ItemShop` set `flg" .. todaydate .. "`=2 where `flg" .. todaydate .. "`=1 order by `paytotal` desc limit " .. today26num
										sasql.query(sqltoken)
									end
								end
							end
						end
					end
				end
			end
		elseif huodongdata[listi][1] == 27 then
			if config.getGameservername() == "娱乐互动线" then
				if checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
					if other.time() <= huodongdata[listi][6] then
						if today27 ~= os.date("%Y%m%d",os.time()) and other.atoi(os.date("%H",os.time())) >= 20 then
							today27 = os.date("%Y%m%d",os.time())
							local todaydate = os.date("%Y%m%d",os.time())
							sqltoken = "select * from `jibaobuydata` where `date`='" .. todaydate .. "' and `check`>=2"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								sqlnum = sasql.num_rows()
								if sqlnum <= 0 then
									sqltoken = "select `cdkey` from `jibaobuydata` where `check`>=2"
									ret = sasql.query(sqltoken)
									if ret == 1 then
										sasql.free_result()
										sasql.store_result()
										sqlnum = sasql.num_rows()
										sqltoken = "update `jibaobuydata` set `check`=2 where `date`='" .. todaydate .. "' and `check`=1"
										for i=1,sqlnum do
											sasql.fetch_row()
											sqltoken = sqltoken .. " and `cdkey`!='" .. sasql.data(1) .. "'"
										end
										sqltoken = sqltoken .. " order by `paytotal` desc limit 1"
										sasql.query(sqltoken)
									end
								end
							end
						end
					else
						if today27 ~= os.date("%Y%m%d",os.time()) then
							today27 = os.date("%Y%m%d",os.time())
							local todaydate = os.date("%Y%m%d",os.time())
							sqltoken = "select * from `jibaobuydata` where `date`='" .. todaydate .. "' and `check`>=2"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								sqlnum = sasql.num_rows()
								if sqlnum <= 0 then
									sqltoken = "select `cdkey`,`point` from `PayData` order by `point` desc,`time` asc"
									ret = sasql.query(sqltoken)
									if ret == 1 then
										sasql.free_result()
										sasql.store_result()
										sqlnum = sasql.num_rows()
										local jibaocdkey = {}
										local jibaoname = {}
										local jibaonpoint = {}
										for i=1,math.min(sqlnum,10) do
											sasql.fetch_row()
											jibaocdkey[i] = sasql.data(1)
											jibaonpoint[i] = other.atoi(sasql.data(2))
										end
										for i=1,#jibaocdkey do
											sqltoken = "select `OnlineName` from `csalogin` where `Name`='" .. jibaocdkey[i] .. "'"
											ret = sasql.query(sqltoken)
											if ret == 1 then
												sasql.free_result()
												sasql.store_result()
												if sasql.num_rows() > 0 then
													sasql.fetch_row()
													jibaoname[#jibaoname + 1] = sasql.data(1)
												end
											end
										end
										for i=1,#jibaoname do
											sqltoken = "replace into `jibaopaiming` values (" .. i .. ",'" .. jibaoname[i] .. "')"
											sasql.query(sqltoken)
										end
										if #jibaocdkey > 0 then
											sqltoken = "insert into `jibaobuydata` values ('" .. jibaocdkey[1] .. "','" .. todaydate .. "',0," .. jibaonpoint[1] .. ")"
											sasql.query(sqltoken)
										end
									end
								end
							end
						end
					end
				end
			end
		end
	end
	
end

function ShowList(meindex, talkerindex,id)
	local huodongnum = 0
	local firstpay = 0
	local xupay = 0
	token = ""
	for i=1,#huodongdata do		
		if checkOverTime(huodongdata[i][4],huodongdata[i][5]) then
			local showtype = 1
			if huodongdata[i][1] == 1 then
				ret = sasql.query("select * from `firstpayreward` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						showtype = 0
						firstpay = 1
					end
				end
			elseif huodongdata[i][1] == 16 then
				ret = sasql.query("select `QQ` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if sasql.data(1) ~= "10000" then
							showtype = 0
						end
					end
				end
			elseif huodongdata[i][1] == 30 then
				if firstpay == 0 then
					showtype = 0
				else
					local paychecknum = 0
					sqltoken = "select `check` from `paytotalData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						sqlnum = sasql.num_rows()
						if sqlnum > 0 then
							sasql.fetch_row()
							local paycheck = other.atoi(sasql.data(1))
							for j=1,#Pay_ItemId do
								if other.DataAndData(paycheck,j - 1) ~= 0 then
									paychecknum = paychecknum + 1
								end
							end
							if paychecknum >= #Pay_ItemId then
								showtype = 0
								xupay = 1
							end
						end
					end
				end
			end
			if showtype == 1 then
				huodongnum = huodongnum + 1
				token = token .. "|" .. huodongdata[i][3] .. "|" .. huodongdata[i][1] .. "|" .. huodongdata[i][2]
			end
		end
	end
	if id == 1 then
		if firstpay == 1 then
			if xupay == 1 then
				lssproto.windows(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "L|" .. huodongnum .. token .. "|" .. 0)
			else
				lssproto.windows(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "L|" .. huodongnum .. token .. "|" .. 30)
			end
		else
			lssproto.windows(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "L|" .. huodongnum .. token .. "|" .. id)
		end
	else
		lssproto.windows(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "L|" .. huodongnum .. token .. "|" .. id)
	end
	--lssproto.windows(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "L|" .. huodongnum .. token .. "|" .. id)
end

function ShowHuodong(talkerindex,id)
	ShowList(npcindex,talkerindex,id)
	return 0
end

function getHuoDongList( meindex, talkerindex, listindex)
	token = "X|" .. listindex
	for listi=1,#huodongdata do
		if huodongdata[listi][1] == listindex then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. listindex .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			
			if listindex == 27 then--首充奖励
				local payflg = 0
				local reward = 0
				sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if other.atoi(sasql.data(1)) >= 10 then
							payflg = 1
						end
					end
				end
				sqltoken = "select * from `firstpayreward` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						reward = 1
					end
				end
				token = token .. "|L|" .. payflg .. "|" .. reward .. "|" .. item.getgraNoFromITEMtabl(firstpayitemid[1]) .. "|" .. firstpayitemid[2] .. "|" .. item.getItemInfoFromNumber(firstpayitemid[1]) .. "|"
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
				return
			elseif listindex == 2 then--每日福利
				local reward = {0,0,0,0}
				if char.getInt(talkerindex,"签到时间") < tonumber(os.date("%Y%m%d",os.time())) then
					char.setInt(talkerindex,"签到次数",0)
				end
				local qiantime = {10,30,60,120}

				for i=1,4 do
					if char.getInt(talkerindex,"签到在线时间") >= qiantime[i] then
						if other.DataAndData(char.getInt(talkerindex,"签到次数"),i - 1) ~= 0 then
							reward[i] = 1
						else
							reward[i] = 0
						end
					end
				end
				local token = token .. "|L|" .. char.getInt(talkerindex,"签到在线时间") * 60
				for i=1,4 do
					token = token .. "|" .. reward[i] .. "|" .. item.getSecretNameFromNumber(dayrewarditemid[i][1]) .. "|" .. item.getgraNoFromITEMtabl(dayrewarditemid[i][1])
							.. "|" .. dayrewarditemid[i][2] .. "|耐久度：无限|" .. item.getItemInfoFromNumber(dayrewarditemid[i][1]) 
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
				return
			elseif listindex == 3 then--等级达成
				--0转140，1转120，3转135，5转140
				sqltoken = "select * from `Gift` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					local dataflg = {0,0,0,0,0}
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						for i=2,6 do
							dataflg[i-1] = other.atoi(sasql.data(i))
						end
					end
					token = token .. "|L|"..huodongdata[listi][5].."|"..char.getInt(talkerindex,"转数").."|"..char.getInt(talkerindex,"等级")
					for i=1,#levelitemid do
						token = token .. "|" .. dataflg[i] .. "|" .. item.getSecretNameFromNumber(levelitemid[i][1]) .. "|" .. item.getgraNoFromITEMtabl(levelitemid[i][1])
							 .. "|" .. levelitemid[i][2] .. "|耐久度：无限|" .. item.getItemInfoFromNumber(levelitemid[i][1]) 
					end
					lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
					return
				end
			elseif listindex == 5 then--每日签到
				local daydata = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
				local buqian = 0
				local buqiandata = 0
				sqltoken = "select * from `daysign` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if other.atoi(sasql.data(2)) ~= tonumber(os.date("%Y%m", os.time())) then
							sqltoken = "update `daysign` set `date`=" .. tonumber(os.date("%Y%m", os.time()))
									.. ",`1`=0,`2`=0,`3`=0,`4`=0,`5`=0,`6`=0,`7`=0,`8`=0,`9`=0,`10`=0"
									.. ",`11`=0,`12`=0,`13`=0,`14`=0,`15`=0,`16`=0,`17`=0,`18`=0,`19`=0,`20`=0"
									.. ",`21`=0,`22`=0,`23`=0,`24`=0,`25`=0,`26`=0,`27`=0,`28`=0,`Retroactive`=0"
									.. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
							ret = sasql.query(sqltoken)
							daydata[1] = tonumber(os.date("%Y%m", os.time()))
						else
							for i=2,32 do
								daydata[i-1] = other.atoi(sasql.data(i))
								if i > 3 then
									if buqiandata == 0 and daydata[i-1] == 0 then
										buqiandata = i-2
									end
								end
							end
							buqian = other.atoi(sasql.data(36))
						end
					else
						sqltoken = "insert into `daysign` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. tonumber(os.date("%Y%m", os.time()))							
								.. ",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)"
						ret = sasql.query(sqltoken)
						daydata[1] = tonumber(os.date("%Y%m", os.time()))
					end
				end
				local today = tonumber(os.date("%d", os.time()))
				if today > 28 then
					today = 28
				end
				if daydata[2] == tonumber(os.date("%Y%m%d", os.time())) and daydata[today + 2] == 0 and buqian < 5 then
					if buqiandata > 0 then
						daydata[buqiandata] = 2
					end
				end
				local tokentmp = ""
				if ret == 1 then
					for i=1,#daysignitem do				
						tokentmp = tokentmp .. "|" .. item.getSecretNameFromNumber(daysignitem[i][1]) .. "|" .. item.getgraNoFromITEMtabl(daysignitem[i][1]) .. "|" .. daysignitem[i][2].. "|" .. daydata[i+2]
					end
					token = token .. "|L|" .. char.getInt(talkerindex,"签到在线时间") * 60 .. tokentmp
					lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
				end
			elseif listindex == 4 then--CDKEY兑换
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 17 then--消费榜首
				local costdata = ""
				sqlnum = 0
				sqltoken = "select `name` from `costdata` order by `point` desc,`time` asc limit 10"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						for i=1,math.min(sqlnum,10) do 
							sasql.fetch_row()
							costdata = costdata .. "|" .. sasql.data(1)
						end
					end
				end
				token = token .. "|L|" .. huodongdata[listi][5] .. "|" .. sqlnum .. costdata
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 6 then--充值榜首
				local paydata = {"","","","","","","","","",""}
				sqlnum = 0
				sqltoken = "select `cdkey` from `PayData` order by `point` desc,`time` asc limit 10"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						for i=1,math.min(sqlnum,10) do 
							sasql.fetch_row()
							paydata[i] = sasql.data(1)
						end
					end
				end
				local paytoken = ""
				for i=1,10 do
					if paydata[i] ~= "" then
						sqltoken = "select `OnlineName` from `csalogin` where `Name`='" .. paydata[i] .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								paytoken = paytoken .. "|" .. sasql.data(1)
							end
						end
					end
				end
				token = token .. "|L|" .. huodongdata[listi][5] .. "|" .. sqlnum .. paytoken
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 21 then--充值达成
				local payresault = {}
				local point = 0
				for i=1,#Pay_Data do
					payresault[i] = 0
				end
				token = token .. "|L|" .. huodongdata[listi][4] .. "|" .. huodongdata[listi][5]
				sqltoken = "select `point`,`check` from `PayData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						local check = other.atoi(sasql.data(2))
						point = other.atoi(sasql.data(1))
						for i=1,#Pay_Data do
							if point >= Pay_Data[i][1] then
								payresault[i] = 1
							end
							if other.DataAndData(check,i - 1) ~= 0 then
								payresault[i] = 2
							end
						end
					end
				end
				token = token .. "|" .. point .. "|" .. #Pay_Data
				for i=1,#Pay_Data do
					token = token .. "|" .. item.getgraNoFromITEMtabl(Pay_Data[i][2]) .. "|" .. Pay_Data[i][3] .. "|" .. Pay_Data[i][1] .. "|" .. payresault[i] .. "|" .. i
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 28 then--消费达成
				local costresault = {}
				local point = 0
				for i=1,#Cost_Data do
					costresault[i] = 0
				end
				token = token .. "|L|" .. huodongdata[listi][3] .. "|" .. huodongdata[listi][6]
				sqltoken = "select `point`,`check` from `costdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						local check = other.atoi(sasql.data(2))
						point = other.atoi(sasql.data(1))
						for i=1,#Cost_Data do
							if point >= Cost_Data[i][1] then
								costresault[i] = 1
							end
							if other.DataAndData(check,i - 1) ~= 0 then
								costresault[i] = 2
							end
						end
					end
				end
				--token = token .. "|" .. point .. "|" .. #Cost_Data
				for i=1,#Cost_Data do
					token = token .. "|" .. costresault[i]
				end
				-- token = token .. "|" .. point .. "|" .. #Cost_Data
				-- for i=1,#Cost_Data do
				-- 	token = token .. "|" .. Cost_Data[i][1] .. "|" .. costresault[i] .. "|" .. i .. "|" .. #Cost_Data[i][2]
				-- 	for j=1,#Cost_Data[i][2] do
				-- 		token = token .. "|" .. item.getgraNoFromITEMtabl(Cost_Data[i][2][j][1]) .. "|" .. item.getSecretNameFromNumber(Cost_Data[i][2][j][1]) .. "|" .. Cost_Data[i][2][j][2] .. "|" .. j
				-- 	end
				-- end
				--print("[getHuoDongList]",token)
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 9 then--练宠活动
				sasql.query("select id,unicode from capturepet where name ='不要删'")
    			sasql.free_result();
    			sasql.store_result();
    			sasql.fetch_row();
    			petid = other.atoi(sasql.data(1))
				if petid<=0 then
					return
				end
				huodongdata[listi][6] = other.atoi(sasql.data(2))
				local arry = enemytemp.getEnemyTempArrayFromTempNo(petid)
				local petname = enemytemp.getChar( arry, "名字")
				local petimage = enemytemp.getInt( arry, "形象")
				local flg = {0,0,0}
				local flgtmp = 0
				token = token .. "|L|" .. huodongdata[listi][6] .. "|" .. other.time()
				local petplayername = ""
				sqlnum = 0
				sqltoken = "SELECT `sum`,`author`,`cdkey`,`check` "
						.. "FROM `capturepet` "
						.. "where `id` = " .. petid
						.. " AND `type` = 1 ORDER BY `sum` DESC , `hp` DESC"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						for i=1,math.min(sqlnum,10) do
							sasql.fetch_row()
							petplayername = petplayername .. "|" .. sasql.data(2) .. "|" .. sasql.data(1)
						end
					end
				end
				sqltoken = "SELECT `check` "
						.. "FROM `capturepet` "
						.. "where `id` = " .. petid
						.. " AND `type` = 1 and `cdkey` = '" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if other.atoi(sasql.data(1)) == 0 then
							flgtmp = 1
						else
							flgtmp = 2
						end
					end
				end
				token = token .. "|" .. flgtmp .. "|" .. petname .. "|" .. petimage .. "|" .. sqlnum .. petplayername
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 24 then--当日累充
				local point = 0
				local payresault = {}
				for i=1,#PayDay_Data do
					payresault[i] = 0
				end
				token = token .. "|L|" .. huodongdata[listi][4] .. "|" .. huodongdata[listi][5]
				sqltoken = "select `point`,`check` from `PayDayData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. os.date("%Y%m%d",os.time()) .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						point = other.atoi(sasql.data(1))
						local check = other.atoi(sasql.data(2))
						for i=1,#PayDay_Data do
							if point >= PayDay_Data[i][1] then
								payresault[i] = 1
							end
							if other.DataAndData(check,i - 1) ~= 0 then
								payresault[i] = 2
							end
						end
					end
				end
				token = token .. "|" .. point .. "|" .. #PayDay_Data
				for i=1,#PayDay_Data do
					token = token .. "|" .. item.getgraNoFromITEMtabl(PayDay_Data[i][2]) .. "|" .. PayDay_Data[i][3] .. "|" .. PayDay_Data[i][1] .. "|" .. payresault[i] .. "|" .. i
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 12 then--回炉礼包
				local daydata = 0
				for i=1,7 do
					if tonumber(os.date("%Y%m%d",os.time())) == petpointshop[i][4] then
						daydata = i
						break
					end
				end
				if daydata == 0 then
					return
				end
				local daytmp = 0
				sqltoken = "select `" .. daydata .. "` from `PetPointShop` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						daytmp = other.atoi(sasql.data(1))
					end
					
				end
				local itemnum = 0
				sqltoken = "select count(*) from `PetPointShop` where `" .. daydata .. "`=1"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sasql.fetch_row()
					itemnum = petpointshop[daydata][3] - other.atoi(sasql.data(1))
					if itemnum < 0 then
						itemnum = 0
					end
				end
				token = token .. "|L|" .. huodongdata[listi][5] .. "|" .. daydata .. "|" .. petpointshop[daydata][2] .. "|" .. item.getSecretNameFromNumber(petpointshop[daydata][1])
						.. "|" .. item.getgraNoFromITEMtabl(petpointshop[daydata][1]) .. "|" .. itemnum .. "|耐久度：无限|" .. item.getItemInfoFromNumber(petpointshop[daydata][1]) .. "|" .. daytmp
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 13 then--回炉礼包
				--1转140，2转140，3转140，4转140，5转140
				sqltoken = "select * from `achievement` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					local dataflg = {0,0,0,0,0}
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						for i=2,6 do
							dataflg[i-1] = other.atoi(sasql.data(i))
						end
					end
					for i=1,5 do
						if dataflg[i] == 0 then
							if char.getInt(talkerindex,"转数") ~= achievementdata[i][2] or char.getInt(talkerindex,"等级") ~= achievementdata[i][3] then
								dataflg[i] = -1
							end
						end
					end
					token = token .. "|L|" .. huodongdata[listi][5] .. "|5"
					for i=1,5 do
						token = token .. "|" .. achievementdata[i][2] .. "转" .. achievementdata[i][3] .. "级达成|" .. achievementdata[i][1] .. "|" .. achievementdata[i][5] .. "|" .. achievementdata[i][4] .. "|" .. dataflg[i] + 1
					end
					lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
					return
				end
			elseif listindex == 14 then--限时宠物
				local arry = enemytemp.getEnemyTempArrayFromTempNo( xianshipet[1])
				local petname = enemytemp.getChar( arry, "名字")
				local di = enemytemp.getInt( arry, "地")
				local shui = enemytemp.getInt( arry, "水")
				local huo = enemytemp.getInt( arry, "火")
				local feng = enemytemp.getInt( arry, "风")
				local petimage = enemytemp.getInt( arry, "形象")
				token = token .. "|L|" .. huodongdata[listi][5] .. "|" .. petname .. "|" .. petimage .. "|" .. di .. "|" .. shui .. "|" .. huo .. "|" .. feng
					 .. "|" .. xianshipet[2] .. "|" .. xianshipet[3] .. "|" .. xianshipet[4] .. "|" .. xianshipet[5] .. "|" .. xianshipet[6] .. "|" .. xianshipet[7]
                               
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
                                
			elseif listindex == 15 then--派派送
				token = token .. "|L|" .. char.getInt(talkerindex,"象卷数量") .. "|" .. char.getInt(talkerindex,"象卷幸运值") .. "|600"
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 16 then--手机绑定
				ret = sasql.query("select `QQ` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if sasql.data(1) ~= "10000" then
							return
						end
					end
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)			
			elseif listindex == 23 then--每日充值排行
				--L|开始时间|结束时间|领取截止时间|奖励日期|是否能领取(0未达成,1可领取,2已领取)|第一名特效NO|x偏移|y偏移|第二名特效NO|x偏移|y偏移|第三名特效NO|x偏移|y偏移|
				token = token .. "|L|" .. huodongdata[listi][4] .. "|" .. huodongdata[listi][6] .. "|" .. huodongdata[listi][5]
				local payresault = 0
				local jiangdate = ""
				for i=1,#PayDayPaiMing do
					for j=2,#PayDayPaiMing[i] do
						if char.getChar(talkerindex,"账号") == PayDayPaiMing[i][j][1] then
							sqltoken = "select `totalcheck` from `PayDayData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. PayDayPaiMing[i][1] .. "'"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								if sasql.num_rows() > 0 then
									sasql.fetch_row()
									if other.atoi(sasql.data(1)) == 1 then
										jiangdate = PayDayPaiMing[i][1]
										payresault = 2
									else
										jiangdate = PayDayPaiMing[i][1]
										payresault = 1
									end
								end
							end
						end
						if payresault == 1 then
							break
						end
					end
					if payresault == 1 then
						break
					end
				end
				token = token .. "|" .. jiangdate .. "|" .. payresault .. "|" .. PayDayPaiMing_Data[1][1] .. "|" .. PayDayPaiMing_Data[1][2] .. "|" .. PayDayPaiMing_Data[1][3] .. "|" .. PayDayPaiMing_Data[2][1] .. "|" .. PayDayPaiMing_Data[2][2] .. "|" .. PayDayPaiMing_Data[2][3] .. "|" .. PayDayPaiMing_Data[3][1] .. "|" .. PayDayPaiMing_Data[3][2] .. "|" .. PayDayPaiMing_Data[3][3]
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 1 then--每日限购机暴骑证
				local paycdkey = {}
				local payname = {}
				local todaydate = os.date("%Y%m%d",os.time())
				local buytype = 0
				local playertype = 0
				local buytime = 0
				local jiangtype = 0
				if os.time() <= huodongdata[listi][6] then
					sqltoken = "select * from `PayData` order by `point` desc,`time` asc"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						sqlnum = sasql.num_rows()
						if sqlnum > 0 then
							for i=1,math.min(10,sqlnum) do
								sasql.fetch_row()
								paycdkey[#paycdkey + 1] = sasql.data(1)
							end
						end
					end
					for i=1,#paycdkey do
						sqltoken = "select `OnlineName` from `csalogin` where `Name`='" .. paycdkey[i] .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								payname[#payname + 1] = sasql.data(1)
							end
						end
					end
					if other.atoi(os.date("%H",os.time())) == 19 then
						buytype = 1
						buytime = os.time({day=other.atoi(os.date("%d",os.time())), month=other.atoi(os.date("%m",os.time())), year=other.atoi(os.date("%Y",os.time())), hour=20, minute=0, second=0}) - os.time()
					elseif other.atoi(os.date("%H",os.time())) >= 20 then
						buytype = 2
					end
					if buytype > 0 then
						sqltoken = "select `check` from `jibaobuydata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. todaydate .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								if buytype == 1 then
									if other.atoi(sasql.data(1)) == 1 then
										playertype = 1
									end
								elseif buytype == 2 then
									if other.atoi(sasql.data(1)) > 1 then
										playertype = 1
									end
								end
							end
						end
					end
				else
					sqltoken = "select `name` from `jibaopaiming` order by `id` asc"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						sqlnum = sasql.num_rows()
						if sqlnum > 0 then
							for i=1,sqlnum do
								sasql.fetch_row()
								payname[i] = sasql.data(1)
							end
						end
					end
					sqltoken = "select `cdkey`,`check` from `jibaobuydata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. todaydate .. "'"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() > 0 then
							sasql.fetch_row()
							if char.getChar(talkerindex,"账号") == sasql.data(1) and other.atoi(sasql.data(2)) == 0 then
								jiangtype = 1
							end
						end
					end
				end
				token = token .. "|" .. buytype .. "|" .. playertype .. "|" .. buytime .. "|" .. huodongdata[listi][4] .. "|" .. huodongdata[listi][5] .. "|" .. jiangtype .. "|" .. item.getSecretNameFromNumber(23805) .. "|" .. item.getgraNoFromITEMtabl(23805) .. "|" .. item.getItemInfoFromNumber(23805)
				for i=1,#payname do
					token = token .. "|" .. payname[i]
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 25 then--祝福宝石
				local buytype = 0
				local playertype = 0
				local buytime = 0
				local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
				if todaydate < 1 or todaydate > 5 then
					return
				end
				if other.atoi(os.date("%H",os.time())) == 19 then
					buytype = 1
					buytime = os.time({day=other.atoi(os.date("%d",os.time())), month=other.atoi(os.date("%m",os.time())), year=other.atoi(os.date("%Y",os.time())), hour=20, minute=0, second=0}) - os.time()
				elseif other.atoi(os.date("%H",os.time())) >= 20 then
					buytype = 2
				end
				local buyitemid = 0
				local buyitemnum = 0
				sqltoken = "select `itemid`,`num`,`sellnum` from `ItemShopNum2` where `id`=" .. todaydate
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						buyitemid = other.atoi(sasql.data(1))
						buyitemnum = other.atoi(sasql.data(2)) - other.atoi(sasql.data(3))
						if buyitemnum < 0 then
							buyitemnum = 0
						end
					end
				end
				if buytype > 0 then
					sqltoken = "select `flg" .. todaydate .. "` from `ItemShop2` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() > 0 then
							sasql.fetch_row()
							if buytype == 1 then
								if other.atoi(sasql.data(1)) == 1 then
									playertype = 1
								end
							elseif buytype == 2 then
								if other.atoi(sasql.data(1)) > 1 then
									playertype = 1
								end
							end
						end
					end
				end
				
				token = token .. "|" .. buytype .. "|" .. playertype .. "|" .. buyitemnum .. "|" .. buytime .. "|" .. huodongdata[listi][4] .. "|" .. huodongdata[listi][5] .. "|" .. item.getSecretNameFromNumber(buyitemid) .. "|" .. item.getgraNoFromITEMtabl(buyitemid) .. "|" .. item.getItemInfoFromNumber(buyitemid)
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 26 then--特价商品
				local buytype = 0
				local playertype = 0
				local buytime = 0
				local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
				if todaydate < 1 or todaydate > 5 then
					return
				end
				if other.atoi(os.date("%H",os.time())) == 19 then
					buytype = 1
					buytime = os.time({day=other.atoi(os.date("%d",os.time())), month=other.atoi(os.date("%m",os.time())), year=other.atoi(os.date("%Y",os.time())), hour=20, minute=0, second=0}) - os.time()
				elseif other.atoi(os.date("%H",os.time())) >= 20 then
					buytype = 2
				end
				local buyitemid = {}
				local buyitemnum = {}
				local buypoint = {}
				sqltoken = "select `itemid`,`num`,`sellnum`,`price` from `ItemShopNum` order by `id` asc"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if todaydate > sqlnum then
						return
					end
					for i=1,sqlnum do
						sasql.fetch_row()
						buyitemid[i] = other.atoi(sasql.data(1))
						buyitemnum[i] = other.atoi(sasql.data(2)) - other.atoi(sasql.data(3))
						buypoint[i] = other.atoi(sasql.data(4))
						if buyitemnum[i] < 0 then
							buyitemnum[i] = 0
						end
					end
				end
				if buytype > 0 then
					sqltoken = "select `flg" .. todaydate .. "` from `ItemShop` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() > 0 then
							sasql.fetch_row()
							if buytype == 1 then
								if other.atoi(sasql.data(1)) == 1 then
									playertype = 1
								end
							elseif buytype == 2 then
								if other.atoi(sasql.data(1)) == 2 then
									playertype = 1
								elseif other.atoi(sasql.data(1)) == 3 then
									playertype = 2
								end
							end
						end
					end
				end
				
				token = token .. "|" .. buytype .. "|" .. playertype .. "|" .. buytime .. "|" .. huodongdata[listi][4] .. "|" .. huodongdata[listi][5] .. "|" .. todaydate
				for i=1,#buyitemid do
					token = token .. "|" .. buyitemnum[i] .. "|" .. item.getSecretNameFromNumber(buyitemid[i]) .. "|" .. item.getgraNoFromITEMtabl(buyitemid[i]) .. "|" .. item.getItemInfoFromNumber(buyitemid[i]) .. "|" .. buypoint[i]
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 29 then--当日消费排行
				local costresault = 0
				token = token .. "|L|" .. huodongdata[listi][4] .. "|" .. huodongdata[listi][6]
				sqltoken = "select `cdkey`,`check` from `CostDayData` where `date`='" .. os.date("%Y%m%d",os.time() - 86400) .. "' order by `point` desc,`time` asc"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					for i=1,math.min(sqlnum,3) do
						sasql.fetch_row()
						if sasql.data(1) == char.getChar(talkerindex,"账号") then
							if other.atoi(sasql.data(2)) ~= 0 then
								costresault = 2
							else
								costresault = 1
							end
							break
						end
					end
				end
				token = token .. "|" .. costresault .. "|" .. CostDayPaiMing_Data[1][1] .. "|" .. CostDayPaiMing_Data[1][2] .. "|" .. CostDayPaiMing_Data[1][3] .. "|" .. CostDayPaiMing_Data[2][1] .. "|" .. CostDayPaiMing_Data[2][2] .. "|" .. CostDayPaiMing_Data[2][3] .. "|" .. CostDayPaiMing_Data[3][1] .. "|" .. CostDayPaiMing_Data[3][2] .. "|" .. CostDayPaiMing_Data[3][3]
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif listindex == 30 then--充值奖励
				token = token .. "|L"
				local payresault = {}
				for i=1,#Pay_ItemId do
					payresault[i] = {}
					payresault[i][1] = 0
					payresault[i][2] = Pay_ItemId[i][1]
				end
				sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						local paytotalnum = other.atoi(sasql.data(1))
						for i=1,#Pay_ItemId do
							if paytotalnum >= Pay_ItemId[i][1] then
								payresault[i][1] = 1
								payresault[i][2] = 0
							else
								payresault[i][2] = Pay_ItemId[i][1] - paytotalnum
							end
						end
					end
				end
				sqltoken = "select `check` from `paytotalData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						local paycheck = other.atoi(sasql.data(1))
						for i=1,#Pay_ItemId do
							if other.DataAndData(paycheck,i - 1) ~= 0 then
								payresault[i][1] = 2
								payresault[i][2] = 0
							end
						end
					end
				end
				for i=1,#Pay_ItemId do
					token = token .. "|" .. item.getgraNoFromITEMtabl(Pay_ItemId[i][2]) .. "|" .. payresault[i][1] .. "|" .. payresault[i][2]
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			end
			return
		end
	end
end

function LuaWindowTalked ( talkerindex, select, data)
	WindowTalked(npcindex, talkerindex, 0, select, data)
	return 0
end

--NPC窗口事件(NPC索引)
function WindowTalked(meindex, talkerindex, seqno, select, data)
	print("[huodong:WindowTalked]",meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	if select == 0 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			local index = other.getString(data,"|",2)
			if index == "" then
				return
			end
			getHuoDongList(meindex,talkerindex,tonumber(index))
		end
	end
	listi = 0
	for i=1,#huodongdata do
		if select == huodongdata[i][1] then
			listi = i
			break
		end
	end
	print("[huodong:WindowTalked]listi",listi)
	if listi == 0 then
		return
	end
	
	if select == 27 then--首冲
		local type = other.getString(data,"|",1)
		if type == "G" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local payflg = 0
			local reward = 0
			sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					if other.atoi(sasql.data(1)) >= 10 then
						payflg = 1
					end
				end
			end
			sqltoken = "select * from `firstpayreward` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					reward = 1
				end
			end
			if payflg == 0 then
				char.newMessageToCli(talkerindex,-1,"您还没有充值过哦","白色")
				return
			end
			if reward == 1 then
				char.newMessageToCli(talkerindex,-1,"您已经领取过首充奖励了","白色")
				return
			end
			if checkEmptItemNum(talkerindex) < firstpayitemid[2] then
				char.newMessageToCli(talkerindex,-1,"您的道具栏位不足"..firstpayitemid[2],4)
				return
			end
			itemindex = char.Additem(talkerindex, firstpayitemid[1])
			for i=1,firstpayitemid[2] do
				char.Additem(talkerindex, firstpayitemid[1])
			end
			for i=9,23 do
				item.UpdataHaveItemOne(talkerindex,i)
			end
			if item.check(itemindex) == 1 then
				sqltoken = "insert into `firstpayreward` values ('" .. char.getChar(talkerindex,"账号") .. "',NOW())"
				ret = sasql.query(sqltoken)
				char.newMessageToCli(talkerindex,-1,"成功领取首充奖励","白色")
				other.CallFunction("RedPointSend","data/ablua/dispatchmessage.lua",{talkerindex,4})
				--getHuoDongList(meindex, talkerindex, select)
				return
			end
		end
	elseif select == 2 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local num = other.getString(data,"|",2)
			if num == "" then
				return
			end
			num = other.atoi(num)
			if num < 1 or num > 4 then
				return
			end
			local reward = {0,0,0,0}
			local qiantime = {10,30,60,120}
			if char.getInt(talkerindex,"签到在线时间") >= qiantime[num] then
				if other.DataAndData(char.getInt(talkerindex,"签到次数"),num - 1) ~= 0 then
					char.newMessageToCli(talkerindex,-1,"您已签到！","白色")
					return
				else
					reward[num] = 1
				end
			else
				char.newMessageToCli(talkerindex,-1,"您在线时间未到！","白色")
				return
			end
			if reward[num] == 1 then
				if checkEmptItemNum(talkerindex) < dayrewarditemid[num][2] then
					char.newMessageToCli(talkerindex,-1,"您的道具栏位不足","白色")
					return
				end
				local itemindex = char.Additem(talkerindex,dayrewarditemid[num][1])
				if item.check(itemindex) == 1 then
					char.newMessageToCli(talkerindex, -1, "获得 " .. item.getChar(itemindex,"显示名"), "白色")
				end
				-- if dayrewarditemid1[num][2] == 1 then
				-- 	char.setInt(talkerindex,"石币",char.getInt(talkerindex,"石币") + dayrewarditemid1[num][1])
				-- 	other.CallFunction("useStoneLog","data/ablua/useItemRecord.lua",{talkerindex,dayrewarditemid1[num][1],"活动2"})
				-- 	char.TalkToCli(talkerindex,-1,"获得石币" .. dayrewarditemid1[num][1],"白色")
				-- elseif dayrewarditemid1[num][2] == 2 then
				-- 	if char.getWorkInt(talkerindex,"经验加成") > dayrewarditemid1[num][1] then
				-- 		char.newMessageToCli(talkerindex,-1,"你身上有更高倍数的经验加成，无法领取","白色")
				-- 		return
				-- 	elseif  char.getWorkInt(talkerindex,"经验加成") == dayrewarditemid1[num][1] then
				-- 		char.setWorkInt(talkerindex,"经验时间",char.getWorkInt(talkerindex,"经验时间") + dayrewarditemid1[num][3])
				-- 	elseif  char.getWorkInt(talkerindex,"经验加成") < dayrewarditemid1[num][1] then
				-- 		char.setWorkInt(talkerindex,"经验加成",dayrewarditemid1[num][1])
				-- 		char.setWorkInt(talkerindex,"经验时间",char.getWorkInt(talkerindex,"经验时间") + dayrewarditemid1[num][3])
				-- 	end
				-- 	char.setInt(talkerindex,"经验加成",char.getWorkInt(talkerindex,"经验加成"))
				-- 	char.setInt(talkerindex,"经验时间",char.getWorkInt(talkerindex,"经验时间"))
				-- 	char.TalkToCli(talkerindex,-1,"双倍经验领取成功","白色")
				-- 	other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{talkerindex,0})
				-- elseif dayrewarditemid1[num][2] == 3 then
				-- 	local mytran = char.getInt(talkerindex,"转数")
				-- 	if char.getInt(talkerindex,"活力") + dayrewarditemid1[num][1] > 500 then
				-- 		char.newMessageToCli(talkerindex,-1,"你的活力超过上限，领取失败","白色")
				-- 		return
				-- 	end
				-- 	char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") + dayrewarditemid1[num][1])
				-- 	char.TalkToCli(talkerindex,-1,"获得活力" .. dayrewarditemid1[num][1],"白色")
				-- 	other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{talkerindex,0})
				-- end
			end 
			char.setInt(talkerindex,"签到次数",other.DataOrData(char.getInt(talkerindex,"签到次数"),num - 1))
			char.setInt(talkerindex,"签到时间",tonumber(os.date("%Y%m%d", os.time())))
			print("[hodong]","X|2|C|"..num.."|")			
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt(meindex,"对象"),"X|2|C|"..num.."|")
			char.newMessageToCli(talkerindex,-1,"成功领取每日福利","白色")			
		end
	elseif select == 3 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local levelflg = other.getString(data,"|",2)
			if levelflg == "" then
				return
			end
			if other.atoi(levelflg) < 1 or other.atoi(levelflg) > 5 then
				return
			end
			sqltoken = "select `data" .. levelflg .. "` from `Gift` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				local dataflg = 0
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					dataflg = other.atoi(sasql.data(1))
				else
					dataflg = -1
				end
				if dataflg <= 0 then
					if char.getInt(talkerindex,"转数") >= leveldata[other.atoi(levelflg)][1] and char.getInt(talkerindex,"等级") >= leveldata[other.atoi(levelflg)][2] then
						if dataflg == 0 then
							dataflg = 2
						else
							dataflg = 3
						end
					else
						dataflg = 0
					end
				end
				if dataflg == 1 then
					char.newMessageToCli(talkerindex,-1,"您已经领取该奖励","白色")
					return
				elseif dataflg == 0 then
					char.newMessageToCli(talkerindex,-1,"您未达到该奖励的要求","白色")
					return
				elseif dataflg == 2 or dataflg == 3 then
					if checkEmptItemNum(talkerindex) < levelitemid[other.atoi(levelflg)][2] then
						char.newMessageToCli(talkerindex,-1,"您的道具栏位不足","白色")
						return
					end
					for i=1,levelitemid[other.atoi(levelflg)][2] do
						char.Additem(talkerindex,levelitemid[other.atoi(levelflg)][1])
					end
					if dataflg == 2 then
						sqltoken = "update `Gift` set `data" .. other.atoi(levelflg) .. "`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					else
						local sqltmp = {0,0,0,0,0}
						sqltmp[other.atoi(levelflg)] = 1
						sqltoken = "insert into `Gift` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. sqltmp[1] .. "," .. sqltmp[2] .. "," .. sqltmp[3] .. "," .. sqltmp[4] .."," .. sqltmp[5] .. ")"
					end
					sasql.query(sqltoken)
					char.newMessageToCli(talkerindex,-1,"领取等级奖励成功","白色")
					if other.atoi(levelflg) == 1 then
						other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,601,2})
					end
					other.CallFunction("RedPointSend","data/ablua/dispatchmessage.lua",{talkerindex,2})
				end
				getHuoDongList ( meindex, talkerindex, select)
			end
		end
	elseif select == 5 then
		local type = other.getString(data,"|",1)
		if type == "G" or type == "S" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local daydata = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
			local buqian = 0
			local buqiandata = 0
			sqltoken = "select * from `daysign` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					if other.atoi(sasql.data(2)) ~= tonumber(os.date("%Y%m", os.time())) then
						sqltoken = "update `daysign` set `date`=" .. tonumber(os.date("%Y%m", os.time()))
								.. ",`1`=0,`2`=0,`3`=0,`4`=0,`5`=0,`6`=0,`7`=0,`8`=0,`9`=0,`10`=0"
								.. ",`11`=0,`12`=0,`13`=0,`14`=0,`15`=0,`16`=0,`17`=0,`18`=0,`19`=0,`20`=0"
								.. ",`21`=0,`22`=0,`23`=0,`24`=0,`25`=0,`26`=0,`27`=0,`28`=0,`Retroactive`=0"
								.. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						daydata[1] = tonumber(os.date("%Y%m", os.time()))
					else
						for i=2,31 do
							daydata[i-1] = other.atoi(sasql.data(i))
							if i > 3 then
								if buqiandata == 0 and daydata[i-1] == 0 then
									buqiandata = i-1
								end
							end
						end
						buqian = other.atoi(sasql.data(32))
					end
				else
					sqltoken = "insert into `daysign` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. tonumber(os.date("%Y%m", os.time()))
							.. ",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)"
					ret = sasql.query(sqltoken)
					daydata[1] = tonumber(os.date("%Y%m", os.time()))
				end
				local today = tonumber(os.date("%d", os.time()))
				if today > 28 then
					today = 28
				end
				if daydata[2] == tonumber(os.date("%Y%m%d", os.time())) then
					if daydata[today + 2] == 0 and buqian < 5 and buqiandata > 0 then
						if type == "G" then
							token = "X|" .. select .. "|W|" .. buqiandata - 2 .. "|" .. daysignpoint[buqian + 1]
							lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
						elseif type == "S"  then
							if sasql.getVipPoint(talkerindex) < daysignpoint[buqian + 1] then
								char.newMessageToCli(talkerindex,-1,"金币不足" .. daysignpoint[buqian + 1],"白色")
								return
							end
							if checkEmptItemNum(talkerindex) < daysignitem[buqiandata - 2][2] then
								char.newMessageToCli(talkerindex,-1,"您的道具栏位不足","白色")
								return
							end
							sqltoken = "update `daysign` set `today`=" .. tonumber(os.date("%Y%m%d", os.time())) .. ",`" .. buqiandata - 2 .. "`=1,`Retroactive`=" .. buqian + 1 .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								for j=1,daysignitem[buqiandata - 2][2] do
									local itemindex = char.Additem(talkerindex,daysignitem[buqiandata - 2][1])
									if item.check(itemindex) == 1 then
										if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
											item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
											if item.getInt(itemindex, "序号") == 30350 then
												item.setChar(itemindex,"说明","含有100水晶的球赛竞猜卡，可到族战互动线医院进行竞猜")
												item.setChar(itemindex,"字段",100)
												for n=9,23 do
													item.UpdataHaveItemOne(talkerindex,n)
												end
											end
										end
									end
								end
								local myvippoint = sasql.getVipPoint(talkerindex)
								sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - daysignpoint[buqian + 1])
								setCostData(talkerindex,daysignpoint[buqian + 1])
								other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,daysignpoint[buqian + 1]})
								token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -daysignpoint[buqian + 1] .. "," .. myvippoint .. "," .. myvippoint - daysignpoint[buqian + 1] .. ",'补签扣除" .. daysignpoint[buqian + 1] .. "金币',NOW())"
								sasql.query(token)
								char.newMessageToCli(talkerindex,-1,"补签成功","白色")
								char.newMessageToCli(talkerindex,-1,"扣除" .. daysignpoint[buqian + 1] .. "金币","白色")
								if buqiandata - 2 == #daysignitem then
									-- other.CallFunction("weixin","data/ablua/weixin.lua",{talkerindex,11,char.getChar(talkerindex,"名字")})
								end
							end
							getHuoDongList ( meindex, talkerindex, select)
						end
						--char.newMessageToCli(talkerindex,-1,"可以补签","白色")
						return
					else
						char.newMessageToCli(talkerindex,-1,"您今日已经签到过了","白色")
						return
					end
				end
				if tonumber(os.date("%H", os.time())) < 1 then
					char.newMessageToCli(talkerindex,-1,"在线时间不足","白色")
					return
				end
				local dayweixin = 0
				for i=3,#daydata do
					if daydata[i] == 0 then
						if checkEmptItemNum(talkerindex) < daysignitem[i - 2][2] then
							char.newMessageToCli(talkerindex,-1,"您的道具栏位不足","白色")
							return
						end
						
						sqltoken = "update `daysign` set `today`=" .. tonumber(os.date("%Y%m%d", os.time())) .. ",`" .. i - 2 .. "`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							for j=1,daysignitem[i - 2][2] do
								local itemindex = char.Additem(talkerindex,daysignitem[i - 2][1])
								if item.check(itemindex) == 1 then
									if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
										item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
										if item.getInt(itemindex, "序号") == 30350 then
											item.setChar(itemindex,"说明","含有100水晶的球赛竞猜卡，可到族战互动线医院进行竞猜")
											item.setChar(itemindex,"字段",100)
											for n=9,23 do
												item.UpdataHaveItemOne(talkerindex,n)
											end
										end
									end
								end
							end
							char.newMessageToCli(talkerindex,-1,"每日签到成功","白色")
							other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,614,0})
							if i - 2 == #daysignitem then
								dayweixin = 1
							end
							other.CallFunction("RedPointSend","data/ablua/dispatchmessage.lua",{talkerindex,3})
						end
						getHuoDongList(meindex, talkerindex, select)
						break
					end
				end
				if dayweixin == 1 then
					-- other.CallFunction("weixin","data/ablua/weixin.lua",{talkerindex,11,char.getChar(talkerindex,"名字")})
				end
			end
		end
	elseif select == 17 then
	elseif select == 6 then
	elseif select == 21 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local payflg = other.getString(data,"|",2)
			if payflg == "" then
				return
			end
			payflg = other.atoi(payflg)
			if payflg < 1 or payflg > #Pay_Data then
				return
			end
			local payresault = 0
			local check = 0
			sqltoken = "select `point`,`check` from `PayData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					if other.atoi(sasql.data(1)) >= Pay_Data[payflg][1] then
						payresault = 1
					end
					check = other.atoi(sasql.data(2))
					if other.DataAndData(check,payflg - 1) ~= 0 then
						payresault = 2
					end
				end
			end
			if payresault == 0 then
				char.newMessageToCli(talkerindex,-1,"您没达到领取条件","白色")
				return
			elseif payresault == 2 then
				char.newMessageToCli(talkerindex,-1,"您已经领取过该奖励了","白色")
				return
			else
				if checkEmptItemNum(talkerindex) < Pay_Data[payflg][3] then
					char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
					return
				end
				sqltoken = "update `PayData` set `check`=" .. other.DataOrData(check,payflg - 1) .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					for i=1,Pay_Data[payflg][3] do
						local itemindex = char.Additem(talkerindex,Pay_Data[payflg][2])
						if item.check(itemindex) == 1 then
							char.newMessageToCli(talkerindex, -1, "获得 " .. item.getChar(itemindex,"显示名"), "白色")
						end
					end
					lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "X|" .. select .. "|C|" .. payflg .. "|" .. 2)
				end
			end
		elseif type == "I" then
			local payflg = other.getString(data,"|",2)
			if payflg == "" then
				return
			end
			payflg = other.atoi(payflg)
			if payflg < 1 or payflg > #Pay_Data then
				return
			end
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "X|" .. select .. "|I|" .. payflg .. "|" .. item.getSecretNameFromNumber(Pay_Data[payflg][2]) .. "|" .. item.getItemInfoFromNumber(Pay_Data[payflg][2]))
		end
	elseif select == 28 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local costflg = other.getString(data,"|",2)
			if costflg == "" then
				char.newMessageToCli(talkerindex,-1,"无效请求1.","白色")
				return
			end
			costflg = other.atoi(costflg)
			if costflg < 1 or costflg > #Cost_Data then
				char.newMessageToCli(talkerindex,-1,"无效请求2.","白色")
				return
			end
			local costflg2 = other.getString(data,"|",3)
			if costflg2 == "" then
				char.newMessageToCli(talkerindex,-1,"无效请求3.","白色")
				return
			end
			costflg2 = other.atoi(costflg2)
			if costflg2 < 1 or costflg2 > #Cost_Data[costflg][2] then
				char.newMessageToCli(talkerindex,-1,"无效请求4.","白色")
				return
			end
			local costresault = 0
			local check = 0
			sqltoken = "select `point`,`check` from `costdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					if other.atoi(sasql.data(1)) >= Cost_Data[costflg][1] then
						costresault = 1
					end
					check = other.atoi(sasql.data(2))
					if other.DataAndData(check,costflg - 1) ~= 0 then
						costresault = 2
					end
				end
			end
			if costresault == 0 then
				char.newMessageToCli(talkerindex,-1,"您没达到领取条件","白色")
				return
			elseif costresault == 2 then
				char.newMessageToCli(talkerindex,-1,"您已经领取过该奖励了","白色")
				return
			else
				poolpetnum = 10
				if costflg == 1 and costflg2 == 3 then
					ret = sasql.query("select `petnum` from `pooldata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
					if ret ~= 1 then
						return
					end
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						poolpetnum = other.atoi(sasql.data(1))
					else
						sasql.query("insert into `pooldata` values ('" .. char.getChar(talkerindex,"账号") .. "',10,15)")
					end
					if poolpetnum >= 30 then
						char.newMessageToCli(talkerindex, -1, "您的仓库数量已满", "白色")
						return
					end
				else
					if checkEmptItemNum(talkerindex) < Cost_Data[costflg][2][costflg2][2] then
						char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
						return
					end
				end
				sqltoken = "update `costdata` set `check`=" .. other.DataOrData(check,costflg - 1) .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					if costflg == 1 and costflg2 == 3 then
						sasql.query("update `pooldata` set `petnum`=" .. poolpetnum + 1 .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
						char.newMessageToCli(talkerindex, -1, "增加宠物仓库数量成功", "白色")
					else
						for i=1,Cost_Data[costflg][2][costflg2][2] do
							local itemindex = char.Additem(talkerindex,Cost_Data[costflg][2][costflg2][1])
							if item.check(itemindex) == 1 then
								char.newMessageToCli(talkerindex, -1, "获得 " .. item.getChar(itemindex,"显示名"), "白色")
							end
						end
					end
					lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "X|" .. select .. "|C|" .. costflg .. "|" .. 2)
				end
			end
		elseif type == "I" then
			local costflg = other.getString(data,"|",2)
			if costflg == "" then
				return
			end
			costflg = other.atoi(costflg)
			if costflg < 1 or costflg > #Cost_Data then
				return
			end
			local costflg2 = other.getString(data,"|",3)
			if costflg2 == "" then
				return
			end
			costflg2 = other.atoi(costflg2)
			if costflg2 < 1 or costflg2 > #Cost_Data[costflg][2] then
				return
			end
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "X|" .. select .. "|I|" .. costflg .. "|" .. costflg2 .. "|" .. item.getItemInfoFromNumber(Cost_Data[costflg][2][costflg2][1]))
		end
	elseif select == 9 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			if other.time() > huodongdata[listi][6] then
				local mypet = {0,""}
				if sasql.query("select unicode,cdkey,check from capturepet order by sum desc limit 0,10") == 1 then
                	sasql.free_result()
                	sasql.store_result()
                	if sasql.num_rows() > 0 then
                        for i=1, 10 do
                            sasql.fetch_row()
                            if sasql.data(2) == char.getChar(talkerindex,"账号") then
								if other.atoi(sasql.data(3)) == 0 then
                            		mypet[1],mypet[2] = i,sasql.data(1)
								end
                            	break
                            end
                        end
                    end
                end
                if mypet[1] > 0 then
                	if checkEmptItemNum(talkerindex) > 0 then
                		npc.AddItem(talkerindex, petprize[mypet[1]][math.random(#petprize[mypet[1]])])
                		sasql.query("UPDATE `capturepet` SET `check` = 1 WHERE `unicode` ='"..mypet[2].. "' and cdkey ='"..char.getChar(talkerindex,"账号").."'")
						getHuoDongList(meindex, talkerindex, select)
						return
                	else
						char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
						return
					end
				end
			end
		elseif type == "T" then
			local arry = enemytemp.getEnemyTempArrayFromTempNo( petid)
			local petname = enemytemp.getChar( arry, "名字")
			local petselect = other.getString(data,"|",2)
			if petselect == "" then
				return
			end
			if other.atoi(petselect) < 0 or other.atoi(petselect) > 4 then
				return
			end
			if other.time() > huodongdata[listi][6] then
				char.newMessageToCli(talkerindex, -1, "活动已经结束", "白色")
				return
			end
			local petindex = char.getCharPet(talkerindex, other.atoi(petselect))
			if char.check(petindex) == 1 then
				if petid ~= char.getInt(petindex, "宠ID") then
					char.newMessageToCli(talkerindex, -1, "本期活动请正确的提交" ..  petname, "白色")
					return
				end
				if char.getChar(petindex,"称号") ~= "" then
					char.newMessageToCli(talkerindex, -1, "祝福过的宠物无法提交", "白色")
					return
				end
				if char.getInt(petindex,"转数") ~= 1 or char.getInt(petindex,"等级") < 140 then
					char.newMessageToCli(talkerindex, -1, "1转140级的宠物才可以提交哦", "白色")
					return
				end
				sqltoken = "SELECT * "
						.. "FROM `capturepet` "
						.. "where `unicode` = '" .. char.getChar(petindex,"唯一编号").. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						char.newMessageToCli(talkerindex, -1, "该宠物已经提交过了,请不要重复提交", "白色")
						return
					else
						sqltoken = "REPLACE INTO `capturepet` SET "
								.. "`unicode` = '"..char.getChar(petindex,"唯一编号").."', "
								.. "`id` = '"..petid.."', "
								.. "`type` = '1', "
								.. "`name` = '"..char.getChar(petindex, "名字").."', "
								.. "`lv` = '"..char.getInt(petindex, "等级").."', "
								.. "`hp` = '"..char.getWorkInt(petindex, "最大HP").."', "
								.. "`attack` = '"..char.getWorkInt(petindex, "攻击力").."', "
								.. "`def` = '"..char.getWorkInt(petindex, "防御力").."', "
								.. "`quick` = '"..char.getWorkInt(petindex, "敏捷力").."', "
								.. "`sum` = '"..( char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击力") + char.getWorkInt(petindex, "防御力") + char.getWorkInt(petindex, "敏捷力")).."', "
								.. "`author` = '"..char.getChar(talkerindex, "名字").."', "
								.. "`cdkey` = '"..char.getChar(talkerindex, "账号").."', "
								.. "`inserttime` = NOW();"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							char.DelPet(talkerindex,petindex)
						end
						char.newMessageToCli(talkerindex, -1, "宠物提交成功", "白色")
						getHuoDongList ( meindex, talkerindex, select)
					end
				end
			end
		end
	-- elseif select == 24 then
	-- 	local type = other.getString(data,"|",1)
	-- 	if type == "G" then
	-- 		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
	-- 			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
	-- 			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
	-- 			return
	-- 		end
	-- 		local payflg = other.getString(data,"|",2)
	-- 		if payflg == "" then
	-- 			return
	-- 		end
	-- 		payflg = other.atoi(payflg)
	-- 		if payflg < 1 or payflg > #PayDay_Data then
	-- 			return
	-- 		end
	-- 		local payresault = 0
	-- 		local check = 0
	-- 		sqltoken = "select `point`,`check` from `PayDayData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. os.date("%Y%m%d",os.time()) .. "'"
	-- 		ret = sasql.query(sqltoken)
	-- 		if ret == 1 then
	-- 			sasql.free_result()
	-- 			sasql.store_result()
	-- 			sqlnum = sasql.num_rows()
	-- 			if sqlnum > 0 then
	-- 				sasql.fetch_row()
	-- 				if other.atoi(sasql.data(1)) >= PayDay_Data[payflg][1] then
	-- 					payresault = 1
	-- 				end
	-- 				check = other.atoi(sasql.data(2))
	-- 				if other.DataAndData(check,payflg - 1) ~= 0 then
	-- 					payresault = 2
	-- 				end
	-- 			end
	-- 		end
	-- 		if payresault == 0 then
	-- 			char.newMessageToCli(talkerindex,-1,"您没达到领取条件","白色")
	-- 			return
	-- 		elseif payresault == 2 then
	-- 			char.newMessageToCli(talkerindex,-1,"您已经领取过该奖励了","白色")
	-- 			return
	-- 		else
	-- 			if checkEmptItemNum(talkerindex) < PayDay_Data[payflg][3] then
	-- 				char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
	-- 				return
	-- 			end
	-- 			sqltoken = "update `PayDayData` set `check`=" .. other.DataOrData(check,payflg - 1) .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
	-- 			ret = sasql.query(sqltoken)
	-- 			if ret == 1 then
	-- 				for i=1,PayDay_Data[payflg][3] do
	-- 					local itemindex = char.Additem(talkerindex,PayDay_Data[payflg][2])
	-- 					if item.check(itemindex) == 1 then
	-- 						char.newMessageToCli(talkerindex, -1, "获得 " .. item.getChar(itemindex,"显示名"), "白色")
	-- 					end
	-- 				end
	-- 				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "X|" .. select .. "|C|" .. payflg .. "|" .. 2)
	-- 			end
	-- 		end
	-- 	elseif type == "I" then
	-- 		local payflg = other.getString(data,"|",2)
	-- 		if payflg == "" then
	-- 			return
	-- 		end
	-- 		payflg = other.atoi(payflg)
	-- 		if payflg < 1 or payflg > #PayDay_Data then
	-- 			return
	-- 		end
	-- 		lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "X|" .. select .. "|I|" .. payflg .. "|" .. item.getSecretNameFromNumber(PayDay_Data[payflg][2]) .. "|" .. item.getItemInfoFromNumber(PayDay_Data[payflg][2]))
	-- 	end
	elseif select == 12 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local daydata = 0
			for i=1,7 do
				if tonumber(os.date("%Y%m%d",os.time())) == petpointshop[i][4] then
					daydata = i
					break
				end
			end
			if daydata == 0 then
				return
			end
			local daytmp = 0
			sqlnum = 0
			sqltoken = "select `" .. daydata .. "` from `PetPointShop` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					daytmp = other.atoi(sasql.data(1))
				end
				
			end
			local itemnum = 0
			sqltoken = "select count(*) from `PetPointShop` where `" .. daydata .. "`=1"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sasql.fetch_row()
				itemnum = petpointshop[daydata][3] - other.atoi(sasql.data(1))
				if itemnum < 0 then
					itemnum = 0
				end
			end
			if daytmp == 1 then
				char.newMessageToCli(talkerindex, -1, "您已经购买过该礼包", "白色")
				return
			end
			if itemnum == 0 then
				char.newMessageToCli(talkerindex, -1, "该礼包已售罄", "白色")
				return
			end
			if sasql.getVipPoint(talkerindex) < petpointshop[daydata][2] then
				char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
				return
			end
			if checkEmptItemNum(talkerindex) == 0 then
				char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
				return
			end
			if sqlnum == 0 then
				local petpointtmp = {0,0,0,0,0,0,0}
				petpointtmp[daydata] = 1
				sqltoken = "insert into `PetPointShop` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. petpointtmp[1] .. "," .. petpointtmp[2] .. "," .. petpointtmp[3] .. ","
						.. petpointtmp[4] .. "," .. petpointtmp[5] .. "," .. petpointtmp[6] .. "," .. petpointtmp[7] .. ")"
			else
				sqltoken = "update `PetPointShop` set `" .. daydata .. "`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			end
			ret = sasql.query(sqltoken)
			if ret == 1 then
				local myvippoint = sasql.getVipPoint(talkerindex)
				sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - petpointshop[daydata][2])
				setCostData(talkerindex,petpointshop[daydata][2])
				other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,petpointshop[daydata][2]})
				char.Additem(talkerindex, petpointshop[daydata][1])
				token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -petpointshop[daydata][2] .. "," .. myvippoint .. "," .. myvippoint - petpointshop[daydata][2].. ",'购买水晶礼包扣除" .. petpointshop[daydata][2] .. "金币',NOW())"
				sasql.query(token)
				char.newMessageToCli(talkerindex, -1, "购买礼包成功", "白色")
				getHuoDongList ( meindex, talkerindex, select)
			end
		end
	elseif select == 13 then
		local type = other.getString(data,"|",1)
		if type == "G" then
			if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
				char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
				return
			end
			local jiangflg = other.getString(data,"|",2)
			if jiangflg == "" then
				return
			end
			if other.atoi(jiangflg) < 1 or other.atoi(jiangflg) > 5 then
				return
			end
			--1转140，2转140，3转140，4转140，5转140
			sqlnum = 0
			sqltoken = "select * from `achievement` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				local dataflg = {0,0,0,0,0}
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					for i=2,6 do
						dataflg[i-1] = other.atoi(sasql.data(i))
					end
				end
				for i=1,5 do
					if dataflg[i] == 0 then
						if char.getInt(talkerindex,"转数") ~= achievementdata[i][2] or char.getInt(talkerindex,"等级") ~= achievementdata[i][3] then
							dataflg[i] = -1
						end
					end
				end
				if dataflg[other.atoi(jiangflg)] == 1 then
					char.newMessageToCli(talkerindex,-1,"您已经领取过该奖励","白色")
					return
				elseif dataflg[other.atoi(jiangflg)] == -1 then
					char.newMessageToCli(talkerindex,-1,"您没有达到当前要求","白色")
					return
				elseif dataflg[other.atoi(jiangflg)] == 0 then
					if sqlnum == 0 then
						dataflg = {0,0,0,0,0}
						dataflg[other.atoi(jiangflg)] = 1
						sqltoken = "insert into `achievement` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. dataflg[1] .. "," .. dataflg[2] .. "," .. dataflg[3] .. "," .. dataflg[4] .. "," .. dataflg[5] .. ")"
					else
						sqltoken = "update `achievement` set `data" .. other.atoi(jiangflg) .. "`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					end
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.setPetPoint(talkerindex,sasql.getPetPoint(talkerindex) + achievementdata[other.atoi(jiangflg)][4])
						char.newMessageToCli(talkerindex, -1, "领取奖励成功", "白色")
						getHuoDongList ( meindex, talkerindex, select)
					end
				end
			end
		end
	elseif select == 15 then--派派送
		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "S" then
			local ppnum = other.getString(data,"|",2)
			if ppnum == "" then
				return
			end
			ppnum = other.atoi(ppnum)
			if ppnum < 1 or ppnum > 10 then
				return
			end
			if char.getInt(talkerindex,"象卷数量") < ppnum then
				char.newMessageToCli(talkerindex,-1,"您的象卷数量不足","白色")
				return
			end
			if checkEmptItemNum(talkerindex) < 1 then
				char.newMessageToCli(talkerindex,-1,"道具栏必须留一格空位","白色")
				return
			end
			ret = sasql.query("select * from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum + ppnum > 100 then
					char.newMessageToCli(talkerindex,-1,"您的派派送仓库已满","白色")
					return
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "X|" .. select .. "|S|" .. ppnum)
			end
		elseif type == "E" then
			local ppnum = other.getString(data,"|",2)
			if ppnum == "" then
				return
			end
			ppnum = other.atoi(ppnum)
			if ppnum < 1 or ppnum > 10 then
				return
			end
			if char.getInt(talkerindex,"象卷数量") < ppnum then
				char.newMessageToCli(talkerindex,-1,"您的象卷数量不足","白色")
				return
			end
			if checkEmptItemNum(talkerindex) < 1 then
				char.newMessageToCli(talkerindex,-1,"您道具栏空位不足","白色")
				return
			end
			ret = sasql.query("select * from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum + ppnum > 100 then
					char.newMessageToCli(talkerindex,-1,"您的派派送仓库已满","白色")
					return
				end
			end
			char.setInt(talkerindex,"象卷数量",char.getInt(talkerindex,"象卷数量") - ppnum)
			local ppitemid = {}
			for i=1,ppnum do
				if char.getInt(talkerindex,"象卷幸运值") + 1 >= 350 then
					itemid = itemLucky
					char.setInt(talkerindex,"象卷幸运值",0)
					giveLuckItemLog(talkerindex)
				else
					if math.random(600) == 300 then
						itemid = itemLucky
						char.setInt(talkerindex,"象卷幸运值",0)
						giveLuckItemLog(talkerindex)
						--char.talkToAllServer(string.format("P|P|恭喜 <%s> 玩家 通过欢乐派派送获得了[%s]",char.getChar(talkerindex,"名字"),item.getNameFromNumber(itemid)),"");
					else
						itemid,level = getItemId(talkerindex);
						giveItemLog(talkerindex,level,itemid)
						char.setInt(talkerindex,"象卷幸运值",char.getInt(talkerindex,"象卷幸运值")+1)
					end
				end
				local itemindex = char.Additem(talkerindex,itemid)
				if item.check(itemindex) == 1 then
					for j=1,#AllServerItemList do
						if item.getInt(itemindex,"序号") == AllServerItemList[j] then
							char.talkToAllServer("P|P|恭喜[" .. char.getChar(talkerindex,"名字") .. "]派派送获得[" .. item.getChar(itemindex,"显示名") .. "]","")
							break
						end
					end
					token = "insert into `paipaisongpoolitem` VALUES ('" .. char.getChar(talkerindex,"账号") .. "'," .. item.getInt(itemindex,"序号") .. ","
							.. item.getInt(itemindex,"次数")
							.. "," .. item.getInt(itemindex,"堆叠") .. "," .. item.getInt(itemindex,"最小度") .. "," .. item.getInt(itemindex,"最大度") .. "," .. item.getInt(itemindex,"伤")
							.. "," .. item.getInt(itemindex,"吸") .. "," .. item.getInt(itemindex,"最小攻击") .. "," .. item.getInt(itemindex,"最大攻击") .. "," .. item.getInt(itemindex,"攻")
							.. "," .. item.getInt(itemindex,"防") .. "," .. item.getInt(itemindex,"敏") .. "," .. item.getInt(itemindex,"HP") .. "," .. item.getInt(itemindex,"MP")
							.. "," .. item.getInt(itemindex,"运气") .. "," .. item.getInt(itemindex,"魅力") .. "," .. item.getInt(itemindex,"回避") .. "," .. item.getInt(itemindex,"属性")
							.. "," .. item.getInt(itemindex,"属性比例") .. "," .. item.getInt(itemindex,"格档") .. "," .. item.getInt(itemindex,"次序") .. "," .. item.getInt(itemindex,"负重")
							.. "," .. item.getInt(itemindex,"命中") .. "," .. item.getInt(itemindex,"忽防") .. "," .. item.getInt(itemindex,"毒耐") .. "," .. item.getInt(itemindex,"麻耐")
							.. "," .. item.getInt(itemindex,"睡耐") .. "," .. item.getInt(itemindex,"石耐") .. "," .. item.getInt(itemindex,"酒耐") .. "," .. item.getInt(itemindex,"混耐")
							.. "," .. item.getInt(itemindex,"会心") .. "," .. item.getInt(itemindex,"颜色") .. "," .. item.getInt(itemindex,"合成") .. ",'" .. item.getChar(itemindex,"名称")
							.. "','" .. item.getChar(itemindex,"显示名") .. "','" .. item.getChar(itemindex,"说明") .. "','" .. item.getChar(itemindex,"字段") .. "','" .. item.getChar(itemindex,"编码") .. "'," .. item.getInt(itemindex,"图号") .. ",''," .. item.getInt(itemindex,"安全锁") .. "," .. item.getInt(itemindex,"物品时间") .. ")"
					ret = sasql.query(token)
					if ret == 1 then
						for j=9,23 do
							local itemindextemp = char.getItemIndex(talkerindex,j)
							if itemindextemp == itemindex then
								char.DelItem(talkerindex,j)
								break
							end
						end
					end
				end
				ppitemid[#ppitemid + 1] = itemid
			end
			token = "X|" .. select .. "|E|" .. char.getInt(talkerindex,"象卷数量") .. "|" .. char.getInt(talkerindex,"象卷幸运值") .. "|" .. #ppitemid
			for i=1,#ppitemid do
				token = token .. "|" .. item.getNameFromNumber(ppitemid[i]) .. "|" .. item.getgraNoFromITEMtabl(ppitemid[i])
			end
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
		elseif type == "A" then
			local buynum = other.getString(data,"|",2)
			if buynum == "" then
				return
			end
			buynum = other.atoi(buynum)
			if buynum < 1 or buynum > 1000 then
				return
			end
			local myvippoint = sasql.getVipPoint(talkerindex)
			if myvippoint < 601 * buynum then
				char.newMessageToCli(talkerindex,-1,"您的金币不足","白色")
				return
			end
			char.setInt(talkerindex,"象卷数量",char.getInt(talkerindex,"象卷数量") + buynum)
			sasql.setVipPoint(talkerindex,myvippoint - 600 * buynum)
			setCostData(talkerindex,600 * buynum)
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,600 * buynum})
			token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -600 * buynum .. "," .. myvippoint .. "," .. myvippoint - 600 * buynum .. ",'购买象卷扣除" .. 600 * buynum .. "金币',NOW())"
			sasql.query(token)
			char.newMessageToCli(talkerindex,-1,"购买象卷成功","白色")
			getHuoDongList ( meindex, talkerindex, select)
		elseif type == "B" then
			ret = sasql.query("select * from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
			if ret == 1 then
				token = "X|" .. select .. "|B|0|"
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					token = "X|" .. select .. "|B|" .. sqlnum
					for i=1,sqlnum do
						sasql.fetch_row()
						local image = other.atoi(sasql.data(40))
						if image == -1 then
							image = item.getgraNoFromITEMtabl(other.atoi(sasql.data(2)))
						end
						local itemtype = item.getIntItemtabl(other.atoi(sasql.data(2)),"类型")
						if (itemtype >= 0 and itemtype <= 15) or (itemtype >= 17 and itemtype <= 19) then
							itemtype = 0
						else
							itemtype = 1
						end
						token = token .. "|" .. image .. "|" .. sasql.data(4) .. "|" .. sasql.data(39) .. "|" .. itemtype--道具形像|叠加数|仓库道具索引|道具类型
					end
				end
				lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
			end
		elseif type == "Q" then
			local itemuid = other.getString(data,"|",2)
			if itemuid == "" then
				return
			end
			ret = sasql.query("select * from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `ITEM_UNIQUECODE`='" .. itemuid .. "'")
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					local ITEM_SECRETNAME = sasql.data(36)
					local ITEM_EFFECTSTRING = sasql.data(37)
					token = "X|" .. select .. "|Q|" .. itemuid .. "|" .. ITEM_SECRETNAME .. "|" .. ITEM_EFFECTSTRING
					lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif type == "D" then
			local itemuid = other.getString(data,"|",2)
			if itemuid == "" then
				return
			end
			ret = sasql.query("select * from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `ITEM_UNIQUECODE`='" .. itemuid .. "'")
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					if checkEmptItemNum(talkerindex) == 0 then
						char.newMessageToCli(talkerindex,-1,"道具栏无空位，无法取回道具","白色")
						return
					end
					sasql.fetch_row()
					local itemid = other.atoi(sasql.data(2))
					local ITEM_DAMAGEBREAK = other.atoi(sasql.data(3))
					local ITEM_USEPILENUMS = other.atoi(sasql.data(4))
					local ITEM_DAMAGECRUSHE = other.atoi(sasql.data(5))
					local ITEM_MAXDAMAGECRUSHE = other.atoi(sasql.data(6))
					local ITEM_OTHERDAMAGE = other.atoi(sasql.data(7))
					local ITEM_OTHERDEFC = other.atoi(sasql.data(8))
					local ITEM_ATTACKNUM_MIN = other.atoi(sasql.data(9))
					local ITEM_ATTACKNUM_MAX = other.atoi(sasql.data(10))
					local ITEM_MODIFYATTACK = other.atoi(sasql.data(11))
					local ITEM_MODIFYDEFENCE = other.atoi(sasql.data(12))
					local ITEM_MODIFYQUICK = other.atoi(sasql.data(13))
					local ITEM_MODIFYHP = other.atoi(sasql.data(14))
					local ITEM_MODIFYMP = other.atoi(sasql.data(15))
					local ITEM_MODIFYLUCK = other.atoi(sasql.data(16))
					local ITEM_MODIFYCHARM = other.atoi(sasql.data(17))
					local ITEM_MODIFYAVOID = other.atoi(sasql.data(18))
					local ITEM_MODIFYATTRIB = other.atoi(sasql.data(19))
					local ITEM_MODIFYATTRIBVALUE = other.atoi(sasql.data(20))
					local ITEM_MODIFYARRANGE = other.atoi(sasql.data(21))
					local ITEM_MODIFYSEQUENCE = other.atoi(sasql.data(22))
					local ITEM_ATTACHPILE = other.atoi(sasql.data(23))
					local ITEM_HITRIGHT = other.atoi(sasql.data(24))
					local ITEM_NEGLECTGUARD = other.atoi(sasql.data(25))
					local ITEM_POISON = other.atoi(sasql.data(26))
					local ITEM_PARALYSIS = other.atoi(sasql.data(27))
					local ITEM_SLEEP = other.atoi(sasql.data(28))
					local ITEM_STONE = other.atoi(sasql.data(29))
					local ITEM_DRUNK = other.atoi(sasql.data(30))
					local ITEM_CONFUSION = other.atoi(sasql.data(31))
					local ITEM_CRITICAL = other.atoi(sasql.data(32))
					local ITEM_COLOER = other.atoi(sasql.data(33))
					local ITEM_MERGEFLG = other.atoi(sasql.data(34))
					local ITEM_NAME = sasql.data(35)
					local ITEM_SECRETNAME = sasql.data(36)
					local ITEM_EFFECTSTRING = sasql.data(37)
					local ITEM_ARGUMENT = sasql.data(38)
					local ITEM_UNIQUECODE = sasql.data(39)
					local ITEM_BASEIMAGENUMBER = other.atoi(sasql.data(40))
					local PLAYER_UID = sasql.data(41)
					local ITEM_LOCKED = other.atoi(sasql.data(42))
					local ITEM_USETIME = other.atoi(sasql.data(43))
					ret = sasql.query("delete from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `ITEM_UNIQUECODE`='" .. itemuid .. "'")
					if ret == 1 then
						if ITEM_USETIME <= 0 or ITEM_USETIME > other.time() then
							itemindex = char.Additem(talkerindex,itemid)
							if item.check(itemindex) == 1 then
								item.setInt(itemindex,"次数",ITEM_DAMAGEBREAK)
								item.setInt(itemindex,"堆叠",ITEM_USEPILENUMS)
								item.setInt(itemindex,"最小度",ITEM_DAMAGECRUSHE)
								item.setInt(itemindex,"最大度",ITEM_MAXDAMAGECRUSHE)
								item.setInt(itemindex,"伤",ITEM_OTHERDAMAGE)
								item.setInt(itemindex,"吸",ITEM_OTHERDEFC)
								item.setInt(itemindex,"最小攻击",ITEM_ATTACKNUM_MIN)
								item.setInt(itemindex,"最大攻击",ITEM_ATTACKNUM_MAX)
								item.setInt(itemindex,"攻",ITEM_MODIFYATTACK)
								item.setInt(itemindex,"防",ITEM_MODIFYDEFENCE)
								item.setInt(itemindex,"敏",ITEM_MODIFYQUICK)
								item.setInt(itemindex,"HP",ITEM_MODIFYHP)
								item.setInt(itemindex,"MP",ITEM_MODIFYMP)
								item.setInt(itemindex,"运气",ITEM_MODIFYLUCK)
								item.setInt(itemindex,"魅力",ITEM_MODIFYCHARM)
								item.setInt(itemindex,"回避",ITEM_MODIFYAVOID)
								item.setInt(itemindex,"属性",ITEM_MODIFYATTRIB)
								item.setInt(itemindex,"属性比例",ITEM_MODIFYATTRIBVALUE)
								item.setInt(itemindex,"格档",ITEM_MODIFYARRANGE)
								item.setInt(itemindex,"次序",ITEM_MODIFYSEQUENCE)
								item.setInt(itemindex,"负重",ITEM_ATTACHPILE)
								item.setInt(itemindex,"命中",ITEM_HITRIGHT)
								item.setInt(itemindex,"忽防",ITEM_NEGLECTGUARD)
								item.setInt(itemindex,"毒耐",ITEM_POISON)
								item.setInt(itemindex,"麻耐",ITEM_PARALYSIS)
								item.setInt(itemindex,"睡耐",ITEM_SLEEP)
								item.setInt(itemindex,"石耐",ITEM_STONE)
								item.setInt(itemindex,"酒耐",ITEM_DRUNK)
								item.setInt(itemindex,"混耐",ITEM_CONFUSION)
								item.setInt(itemindex,"会心",ITEM_CRITICAL)
								item.setInt(itemindex,"颜色",ITEM_COLOER)
								item.setInt(itemindex,"合成",ITEM_MERGEFLG)
								item.setInt(itemindex,"安全锁",ITEM_LOCKED)
								item.setChar(itemindex,"名称",ITEM_NAME)
								item.setChar(itemindex,"显示名",ITEM_SECRETNAME)
								item.setChar(itemindex,"说明",ITEM_EFFECTSTRING)
								item.setChar(itemindex,"字段",ITEM_ARGUMENT)
								if ITEM_BASEIMAGENUMBER ~= -1 then
									item.setInt(itemindex,"图号",ITEM_BASEIMAGENUMBER)
								end
								if ITEM_USETIME > 0 then
									item.setInt(itemindex,"物品时间",ITEM_USETIME)
								end
							end
							for i=9,23 do
								item.UpdataHaveItemOne(talkerindex,i)
							end
							--char.charSaveFromConnect(talkerindex)
						else
							char.newMessageToCli(talkerindex,-1,"您的道具已经到期","白色")
						end
						char.newMessageToCli(talkerindex,-1,"您的道具已取回","白色")
						ret = sasql.query("select * from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
						if ret == 1 then
							token = "X|" .. select .. "|B|0|"
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum > 0 then
								token = "X|" .. select .. "|B|" .. sqlnum
								for i=1,sqlnum do
									sasql.fetch_row()
									local image = other.atoi(sasql.data(40))
									if image == -1 then
										image = item.getgraNoFromITEMtabl(other.atoi(sasql.data(2)))
									end
									local itemtype = item.getIntItemtabl(other.atoi(sasql.data(2)),"类型")
									if (itemtype >= 0 and itemtype <= 15) or (itemtype >= 17 and itemtype <= 19) then
										itemtype = 0
									else
										itemtype = 1
									end
									token = token .. "|" .. image .. "|" .. sasql.data(4) .. "|" .. sasql.data(39) .. "|" .. itemtype--道具形像|叠加数|仓库道具索引|道具类型
																											
								end
							end
							lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
						end
					end
				end
			end
		elseif type == "P" then
			--print("[fuck]")
			local itemuid = other.getString(data,"|",3)
			if itemuid == "" then
				return
			end
			ret = sasql.query("delete from `paipaisongpoolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `ITEM_UNIQUECODE`='" .. itemuid .. "'")
			if ret ~= 1 then
				char.newMessageToCli(talkerindex,-1,"道具不存在,请刷新数据.","白色")
				return
			end
			token = "X|" .. select .. "|D|"..itemuid.."|"
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
		end
	elseif select == 16 then--手机绑定
		--[[local phone = other.getString(data,"|",1)
		local code = other.getString(data,"|",2)
		if phone == "" or code == "" then
			return
		end
		ret = sasql.query("select `TuiJianQQ` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if sasql.data(1) ~= "13800138000" then
					return
				end
			end
		end
		ret = sasql.query("select * from `getPhoneCode` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if other.atoi(sasql.data(4)) < other.time() then
					sasql.query("delete from `getPhoneCode` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
					char.newMessageToCli(talkerindex,-1,"您的验证码已过期","白色")
					return
				end
				if sasql.data(2) ~= phone then
					char.newMessageToCli(talkerindex,-1,"手机号码错误","白色")
					return
				end
				if sasql.data(3) ~= code then
					char.newMessageToCli(talkerindex,-1,"验证码错误","白色")
					return
				end
				ret = sasql.query("update `csalogin` set `TuiJianQQ`='" .. phone .. "' where `Name`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.query("delete from `getPhoneCode` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
					sasql.setPetPoint(talkerindex,sasql.getPetPoint(talkerindex) + 1000)
					char.newMessageToCli(talkerindex,-1,"绑定手机号码成功,获得1000水晶","白色")
				end
			else
				char.newMessageToCli(talkerindex,-1,"请先获取验证码","白色")
			end
		end]]
		local phone = other.getString(data,"|",1)
		local qq = other.getString(data,"|",2)
		if phone == "" or qq == "" then
			return
		end
		if qq == "10000" then
			return
		end
		if char.getInt(talkerindex,"等级") < 80 then
			char.newMessageToCli(talkerindex,-1,"80级以下无法绑定","白色")
			return
		end
		ret = sasql.query("select `QQ` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if sasql.data(1) == "10000" then
					ret = sasql.query("update `csalogin` set `QQ`='" .. qq .. "',`TuiJianQQ`='" .. phone .. "' where `Name`='" .. char.getChar(talkerindex,"账号") .. "'")
					if ret == 1 then
						sasql.query("delete from `getPhoneCode` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
						sasql.setPetPoint(talkerindex,sasql.getPetPoint(talkerindex) + 200)
						char.newMessageToCli(talkerindex,-1,"绑定手机号码成功,获得200水晶","白色")
					end
				end
			end
		end
	elseif select == 4 then--CDKEY兑换
		other.CallFunction("LUAWindowTalked", "data/ablua/npc/tuiguang/tuiguangnpc.lua", {talkerindex,data})
	elseif select == 24 then--每日充值排行
		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "I" then
			--I|数量|时间|第一名|第二名|第三名|..时间N|第一名|第二名|第三名|
			token = "X|" .. select .. "|I|" .. #PayDayPaiMing
			for i=1,#PayDayPaiMing do
				token = token .. "|" .. PayDayPaiMing[i][1]
				for j=2,4 do
					if PayDayPaiMing[i][j] ~= nil then
						token = token .. "|" .. PayDayPaiMing[i][j][2]
					else
						token = token .. "|"
					end
				end
			end
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
		elseif type == "G" then
			local payresault = 0
			local jiangdate = ""
			local paiming = 0
			for i=1,#PayDayPaiMing do
				for j=2,#PayDayPaiMing[i] do
					if char.getChar(talkerindex,"账号") == PayDayPaiMing[i][j][1] then
						sqltoken = "select `totalcheck` from `PayDayData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. PayDayPaiMing[i][1] .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(1)) == 1 then
									jiangdate = PayDayPaiMing[i][1]
									payresault = 2
								else
									jiangdate = PayDayPaiMing[i][1]
									paiming = j - 1
									payresault = 1
								end
							end
						end
					end
					if payresault == 1 then
						break
					end
				end
				if payresault == 1 then
					break
				end
			end
			if payresault == 1 then
				if checkEmptItemNum(talkerindex) < 1 then
					char.newMessageToCli(talkerindex,-1,"您的道具栏位不足","白色")
					return
				end
				sqltoken = "update `PayDayData` set `totalcheck`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. jiangdate .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					itemindex = char.Additem(talkerindex,PayDayPaiMing_Data[paiming][4])
					if item.check(itemindex) == 1 then
						char.newMessageToCli(talkerindex,-1,"获得" .. jiangdate .. "单日充值第" .. paiming .. "名奖励","白色")
					end
					payresault = 0
					jiangdate = ""
					paiming = 0
					for i=1,#PayDayPaiMing do
						for j=2,#PayDayPaiMing[i] do
							if char.getChar(talkerindex,"账号") == PayDayPaiMing[i][j][1] then
								sqltoken = "select `totalcheck` from `PayDayData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. PayDayPaiMing[i][1] .. "'"
								ret = sasql.query(sqltoken)
								if ret == 1 then
									sasql.free_result()
									sasql.store_result()
									if sasql.num_rows() > 0 then
										sasql.fetch_row()
										if other.atoi(sasql.data(1)) == 1 then
											jiangdate = PayDayPaiMing[i][1]
											payresault = 2
										else
											jiangdate = PayDayPaiMing[i][1]
											paiming = j - 1
											payresault = 1
										end
									end
								end
							end
							if payresault == 1 then
								break
							end
						end
						if payresault == 1 then
							break
						end
					end
					token = "X|" .. select .. "|C|" .. payresault
					lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), token)
				end
			end
		end
	elseif select == 1 then--每日限购机暴骑证
		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "B" then
			if other.time() > huodongdata[listi][6] then
				return
			end
			local buytype = 0
			local playertype = 0
			local todaydate = os.date("%Y%m%d",os.time())
			if other.atoi(os.date("%H",os.time())) == 19 then
				buytype = 1
			end
			if buytype == 1 then
				if sasql.getVipPoint(talkerindex) < 128888 then
					char.newMessageToCli(talkerindex, -1, "您的金币不足，无法报名", "白色")
					return
				end
				sqltoken = "select `check` from `jibaobuydata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. todaydate .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() <= 0 then
						local mypaytotal = 0
						sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								mypaytotal = other.atoi(sasql.data(1))
							end
						end
						sqltoken = "insert into `jibaobuydata` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. todaydate .. "',1," .. mypaytotal .. ")"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							char.newMessageToCli(talkerindex, -1, "报名成功", "白色")
							getHuoDongList ( meindex, talkerindex, select)
							return
						end
					end
				end
			end
		elseif type == "H" then
			if other.time() > huodongdata[listi][6] then
				return
			end
			local buytype = 0
			local todaydate = os.date("%Y%m%d",os.time())
			if other.atoi(os.date("%H",os.time())) >= 20 then
				buytype = 2
			end
			if buytype == 2 then
				sqltoken = "select `check` from `jibaobuydata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. todaydate .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if other.atoi(sasql.data(1)) == 2 then
							local myvippoint = sasql.getVipPoint(talkerindex)
							if myvippoint < 128888 then
								char.newMessageToCli(talkerindex, -1, "您的金币不足，无法购买", "白色")
								return
							end
							if checkEmptItemNum(talkerindex) == 0 then
								char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
								return
							end
							sasql.setVipPoint(talkerindex,myvippoint - 128888)
							setCostData(talkerindex,128888)
							other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,128888})
							sqltoken = "update `jibaobuydata` set `check`=3 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. todaydate .. "'"
							sasql.query(sqltoken)
							char.Additem(talkerindex, 23805)
							token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -128888 .. "," .. myvippoint .. "," .. myvippoint - 128888 .. ",'购买机暴骑证扣除" .. 128888 .. "金币',NOW())"
							sasql.query(token)
							char.newMessageToCli(talkerindex, -1, "购买机暴骑证成功", "白色")
							getHuoDongList ( meindex, talkerindex, select)
							return
						end
					end
				end
			end
		elseif type == "G" then
			if other.time() > huodongdata[listi][6] then
				local todaydate = os.date("%Y%m%d",os.time())
				sqltoken = "select `check` from `jibaobuydata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. todaydate .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if other.atoi(sasql.data(1)) == 0 then
							if checkEmptItemNum(talkerindex) == 0 then
								char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
								return
							end
							sqltoken = "update `jibaobuydata` set `check`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. todaydate .. "'"
							sasql.query(sqltoken)
							char.Additem(talkerindex, 23805)
							char.newMessageToCli(talkerindex, -1, "领取机暴骑证成功", "白色")
							getHuoDongList ( meindex, talkerindex, select)
							return
						else
							char.newMessageToCli(talkerindex, -1, "您已经领取过奖励了", "白色")
							return
						end
					end
				end
			end
		end
	elseif select == 25 then
		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "B" then
			local buytype = 0
			local playertype = 0
			local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
			if todaydate < 1 or todaydate > 5 then
				return
			end
			if other.atoi(os.date("%H",os.time())) == 19 then
				buytype = 1
			end
			if buytype == 1 then
				sqltoken = "select `flg" .. todaydate .. "` from `ItemShop2` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if other.atoi(sasql.data(1)) == 0 then
							local mypaytotal = 0
							sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								if sasql.num_rows() > 0 then
									sasql.fetch_row()
									mypaytotal = other.atoi(sasql.data(1))
								end
							end
							sqltoken = "update `ItemShop2` set `flg" .. todaydate .. "`=1,`paytotal`=" .. mypaytotal .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								char.newMessageToCli(talkerindex, -1, "报名成功", "白色")
								getHuoDongList ( meindex, talkerindex, select)
								return
							end
						end
					else
						local mypaytotal = 0
						sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								mypaytotal = other.atoi(sasql.data(1))
							end
						end
						sqltoken = "insert into `ItemShop2` values ('" .. char.getChar(talkerindex,"账号") .. "'"
						for i=1,5 do
							if i == todaydate then
								sqltoken = sqltoken .. ",1"
							else
								sqltoken = sqltoken .. ",0"
							end
						end
						sqltoken = sqltoken .. "," .. mypaytotal .. ")"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							char.newMessageToCli(talkerindex, -1, "报名成功", "白色")
							getHuoDongList ( meindex, talkerindex, select)
							return
						end
					end
				end
			end
		elseif type == "G" then
			local buytype = 0
			local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
			if todaydate < 1 or todaydate > 5 then
				return
			end
			if other.atoi(os.date("%H",os.time())) >= 20 then
				buytype = 2
			end
			if buytype == 2 then
				local buyitemid = 0
				local buyitemnum = 0
				local buypoint = 0
				sqltoken = "select `itemid`,`num`,`sellnum`,`price` from `ItemShopNum2` where `id`=" .. todaydate
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						buyitemid = other.atoi(sasql.data(1))
						buyitemnum = other.atoi(sasql.data(2)) - other.atoi(sasql.data(3))
						buypoint = other.atoi(sasql.data(4))
						if buyitemnum <= 0 then
							char.newMessageToCli(talkerindex, -1, "该礼包已售罄", "白色")
							return
						end
						sqltoken = "select `flg" .. todaydate .. "` from `ItemShop2` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(1)) == 2 then
									if checkEmptItemNum(talkerindex) == 0 then
										char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
										return
									end
									local myvippoint = sasql.getVipPoint(talkerindex)
									if myvippoint < buypoint then
										char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
										return
									end
									sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - buypoint)
									setCostData(talkerindex,buypoint)
									other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,buypoint})
									sqltoken = "update `ItemShopNum2` set `sellnum`=`sellnum`+1 where `id`=" .. todaydate
									sasql.query(sqltoken)
									char.Additem(talkerindex, buyitemid)
									token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -buypoint .. "," .. myvippoint .. "," .. myvippoint - buypoint .. ",'购买祝福宝石扣除" .. buypoint .. "金币',NOW())"
									sasql.query(token)
									char.newMessageToCli(talkerindex, -1, "购买祝福宝石成功", "白色")
									getHuoDongList ( meindex, talkerindex, select)
								end
							end
						end
					end
				end
			end
		end
	elseif select == 26 then--特价商品
		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "B" then
			local buytype = 0
			local playertype = 0
			local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
			if todaydate < 1 or todaydate > 5 then
				return
			end
			if other.atoi(os.date("%H",os.time())) == 19 then
				buytype = 1
			end
			if buytype == 1 then
				sqltoken = "select `flg" .. todaydate .. "` from `ItemShop` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						if other.atoi(sasql.data(1)) == 0 then
							local mypaytotal = 0
							sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								if sasql.num_rows() > 0 then
									sasql.fetch_row()
									mypaytotal = other.atoi(sasql.data(1))
								end
							end
							sqltoken = "update `ItemShop` set `flg" .. todaydate .. "`=1,`paytotal`=" .. mypaytotal .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
							ret = sasql.query(sqltoken)
							if ret == 1 then
								char.newMessageToCli(talkerindex, -1, "报名成功", "白色")
								getHuoDongList ( meindex, talkerindex, select)
								return
							end
						end
					else
						local mypaytotal = 0
						sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								mypaytotal = other.atoi(sasql.data(1))
							end
						end
						sqltoken = "insert into `ItemShop` values ('" .. char.getChar(talkerindex,"账号") .. "'"
						for i=1,5 do
							if i == todaydate then
								sqltoken = sqltoken .. ",1"
							else
								sqltoken = sqltoken .. ",0"
							end
						end
						sqltoken = sqltoken .. "," .. mypaytotal .. ")"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							char.newMessageToCli(talkerindex, -1, "报名成功", "白色")
							getHuoDongList ( meindex, talkerindex, select)
							return
						end
					end
				end
			end
		elseif type == "G" then
			local buytype = 0
			local todaydate = math.ceil((os.time() - huodongdata[listi][4]) / 86400)
			if todaydate < 1 or todaydate > 5 then
				return
			end
			if other.atoi(os.date("%H",os.time())) >= 20 then
				buytype = 2
			end
			if buytype == 2 then
				local buyitemid = 0
				local buyitemnum = 0
				local buypoint = 0
				sqltoken = "select `itemid`,`num`,`sellnum`,`price` from `ItemShopNum` where `id`=" .. todaydate
				ret = sasql.query(sqltoken)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						buyitemid = other.atoi(sasql.data(1))
						buyitemnum = other.atoi(sasql.data(2)) - other.atoi(sasql.data(3))
						buypoint = other.atoi(sasql.data(4))
						if buyitemnum <= 0 then
							char.newMessageToCli(talkerindex, -1, "该礼包已售罄", "白色")
							return
						end
						sqltoken = "select `flg" .. todaydate .. "` from `ItemShop` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(sqltoken)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(1)) == 3 then
									char.newMessageToCli(talkerindex, -1, "您已经购买过该礼包", "白色")
									return
								elseif other.atoi(sasql.data(1)) == 2 then
									if checkEmptItemNum(talkerindex) == 0 then
										char.newMessageToCli(talkerindex, -1, "物品已满，请道具栏留有足够的空位！", "白色")
										return
									end
									local myvippoint = sasql.getVipPoint(talkerindex)
									if myvippoint < buypoint then
										char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
										return
									end
									sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - buypoint)
									setCostData(talkerindex,buypoint)
									other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,buypoint})
									sqltoken = "update `ItemShopNum` set `sellnum`=`sellnum`+1 where `id`=" .. todaydate
									sasql.query(sqltoken)
									char.Additem(talkerindex, buyitemid)
									sqltoken = "update `ItemShop` set `flg" .. todaydate .. "`=3 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
									sasql.query(sqltoken)
									token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -buypoint .. "," .. myvippoint .. "," .. myvippoint - buypoint .. ",'购买" .. item.getSecretNameFromNumber(buyitemid) .. "扣除" .. buypoint .. "金币',NOW())"
									sasql.query(token)
									char.newMessageToCli(talkerindex, -1, "购买" .. item.getSecretNameFromNumber(buyitemid) .. "成功", "白色")
									getHuoDongList ( meindex, talkerindex, select)
								end
							end
						end
					end
				end
			end
		end
	elseif select == 29 then--每日消费排行
		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "G" then
			local costresault = 0
			local costtype = 0
			sqltoken = "select `cdkey`,`check` from `CostDayData` where `date`='" .. os.date("%Y%m%d",os.time() - 86400) .. "' order by `point` desc,`time` asc"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				for i=1,math.min(sqlnum,3) do
					sasql.fetch_row()
					if sasql.data(1) == char.getChar(talkerindex,"账号") then
						if other.atoi(sasql.data(2)) ~= 0 then
							costresault = 2
						else
							costresault = 1
						end
						costtype = i
						break
					end
				end
			end
			if costresault == 1 then
				if checkEmptItemNum(talkerindex) < 1 then
					char.newMessageToCli(talkerindex,-1,"您的道具栏位不足","白色")
					return
				end
				sqltoken = "update `CostDayData` set `check`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `date`='" .. os.date("%Y%m%d",os.time() - 86400) .. "'"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					itemindex = char.Additem(talkerindex,CostDayPaiMing_Data[costtype][4])
					if item.check(itemindex) == 1 then
						char.newMessageToCli(talkerindex,-1,"获得单日消费第" .. paiming .. "名奖励","白色")
					end
					getHuoDongList ( meindex, talkerindex, select)
				end
			elseif costresault == 2 then
				char.newMessageToCli(talkerindex,-1,"您已经领取过奖励了","白色")
				return
			end
		end
	elseif select == 30 then--三挡充值奖励
		if not checkOverTime(huodongdata[listi][4],huodongdata[listi][5]) then
			lssproto.windowsupdate(talkerindex, 1100, 0, 0, char.getWorkInt( meindex, "对象"), "D|" .. select .. "|")
			char.newMessageToCli(talkerindex,-1,"该活动已结束","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "G" then
			local payid = other.getString(data,"|",2)
			if payid == "" then
				return
			end
			payid = other.atoi(payid)
			if payid < 1 or payid > #Pay_ItemId then
				return
			end
			local payresault = 0
			sqltoken = "select `paytotal` from `csalogin` where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					local paytotalnum = other.atoi(sasql.data(1))
					if paytotalnum >= Pay_ItemId[payid][1] then
						payresault = 1
					end
				end
			end
			local paycheck = 0
			sqltoken = "select `check` from `paytotalData` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					paycheck = other.atoi(sasql.data(1))
					if other.DataAndData(paycheck,payid - 1) ~= 0 then
						payresault = 2
					end
				end
			end
			if payresault == 1 then
				if checkEmptItemNum(talkerindex) < 1 then
					char.newMessageToCli(talkerindex,-1,"您的道具栏位不足","白色")
					return
				end
				sqltoken = "replace into `paytotalData` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. other.DataOrData(paycheck,payid - 1) .. ")"
				ret = sasql.query(sqltoken)
				if ret == 1 then
					itemindex = char.Additem(talkerindex,Pay_ItemId[payid][2])
					if item.check(itemindex) == 1 then
						char.newMessageToCli(talkerindex,-1,"获得" .. Pay_ItemId[payid][1] .. "元充值奖励","白色")
					end
					other.CallFunction("RedPointSend","data/ablua/dispatchmessage.lua",{talkerindex,0})
					getHuoDongList ( meindex, talkerindex, select)
				end
			end
		end
	end
end

function getItemId(talkerindex)
	local b;
	local rnd;
	local pro = math.random(1000);
	for i=1,#itemData do
		if pro <= itemData[i][3] then
			if itemData[i][2] == true then
				if noItemFlag == true then
					noItemNum = noItemNum + 1;
					if noItemNum >= noItemTatal then
						noItemFlag = false;
						noItemNum =0;
						noItemNum =0;
					end
					rnd = other.RandItemId(itemData[i][1]);
					--if index == 5 then
					--	char.talkToAllServer(string.format("P|P|恭喜 <%s> 玩家 通过欢乐派派送获得了[%s]",char.getChar(talkerindex,"名字"),item.getNameFromNumber(rnd)));
					--end
					return rnd,i;
				end
			else
				rnd = other.RandItemId(itemData[i][1]);
				--if index == 5 then
				--	char.talkToAllServer(string.format("P|P|恭喜 <%s> 玩家 通过欢乐派派送获得了[%s]",char.getChar(talkerindex,"名字"),item.getNameFromNumber(rnd)));
				--end
				return rnd,i;
			end
		end
	end
end

function giveItemLog(charaindex,level,itemid)
	local token = "INSERT INTO `paipaisongLog` "
						.. "SET `cdkey` = '" .. char.getChar(charaindex, "账号")
						.. "', `name` = '" .. char.getChar(charaindex, "名字")
						.. "', `itemId` = " .. itemid
						.. ", `itemName` = '" .. item.getNameFromNumber(itemid)
						.. "', `itemLevel` = " .. level
						.. ", `LuckPoin` = " .. char.getInt(charaindex,"象卷幸运值")
						.. ", `time` = NOW()"
	sasql.query(token);
end

function giveLuckItemLog(charaindex)
	local token = "INSERT INTO `paipaisongLuckLog` "
						.. "SET `cdkey` = '" .. char.getChar(charaindex, "账号")
						.. "', `name` = '" .. char.getChar(charaindex, "名字")
						.. "', `time` = NOW()"
	sasql.query(token);
end

function LC(charaindex, data)
	if data == "" then
		return
	end
	if petid ~= other.atoi(data) then
    	sasql.query("delete from capturepet where lv =140")
		petid = other.atoi(other.getString(data, " ", 1))
		huodongdata[7][6] = tonumber(other.getString(data, " ", 2))
    	local arry = enemytemp.getEnemyTempArrayFromTempNo(petid)
    	local petname = enemytemp.getChar(arry, "名字")
		sasql.query("update capturepet set unicode = '"..huodongdata[7][6].."',id = "..petid.." where name ='不要删'")
		char.talkToServer(-1,"[练宠活动]练宠活动开始了，本期宠物为〖"..petname.."〗，请大家加油吧！",4);
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
	char.setInt(npcindex, "循环事件时间", 60000)
end
--20829,20832,20828,20836,21100,21008,21009,21021,20810,20833,20624,21015,21018-21019,21020,19014,19695,21016,21017
--0,     0,    0,     0,     10,   20, 100, 999,   100,   555,200,   888,  300,        1888  1888  1888 ,3333,9999
function data()
	huodongdata = {					
		{1,"1","抢购机暴骑证",0,1640102400,1640102400}--开始时间,购买结束时间,领奖结束时间
		,{2,"2","每日福利",0,1640962800,1640962800}
		,{3,"3","等级达成",0,1640962800,1640962800}					
		,{4,"4","CDKEY兑换",0,1640962800,1640962800}
		,{5,"5","每日签到",0,1640962800,1640962800}		
		,{6,"6","充值榜首",0,0,0}
		,{9,"9","练宠活动",0,1640627548,1640627548}--开始时间，领奖时间，结束时间
		,{15,"15","派派送",0,1640962800,1640962800}
		,{16,"16","手机福利",0,1640962800,1640962800}
		,{17,"17","消费榜首",0,0,0}		
		-- ,{26,"26","特价商品",1550678400,1551110399,1551110399}--1545739200,,
		-- ,{25,"25","祝福宝石",1551110400,1551542399,1551542399}--1545737400,,
		,{21,"21","累计充值",0,0,0}
		,{24,"24","每日充值",0,0,0}
		,{27,"27","首充奖励",0,0,0}
		,{28,"28","累积消费",0,0,1640962800}--
		,{29,"29","每日消费",0,0,0}-- 开始时间，界面显示结束时间，结束时间		
		-- ,{12,"12","回炉礼包",0,0,0}
		-- ,{13,"13","公测礼包",0,0,0}
		-- ,{14,"14","限时宠物",0,0,0}		
	}
					
	firstpayitemid = {22040,1}--首充奖励
	
	--待设置道具
    dayrewarditemid = {{28420,1},{21008,2},{28422,1},{28421,1}}--等级奖励 {道具展示}
    --dayrewarditemid1 = {{100,2,3600},{40,3},{100,2,7200},{40,3}}--等级奖励 {数量,类型(1 石币 2 经验果 3 活力),经验果长}
					
	levelitemid = {{26052,1},{26053,1},{26054,1},{26055,1}}--等级奖励
	leveldata = {{0,80},{1,100},{3,110},{5,120}}
					
	daysignitem = {{28474,1}--月签到
					,{28420,1}
					,{21008,1}					
					,{28422,1}
					,{28421,1}
					,{27019,1}
					,{20900,1}
					,{22042,1}
					,{26034,1}
					,{21008,1} --10
					,{27019,1}
					,{26057,1}
					,{20900,1}
					,{26007,1}
					,{26068,1}
					,{26035,1}
					,{21008,1}
					,{20900,1}
					,{22524,1}
					,{20900,1} --20
					,{29180,1}
					,{26067,1}
					,{26036,1}
					,{21008,1}
					,{20900,2}
					,{26056,1}
					,{29180,1}
					,{28478,1}}
					
	daysignpoint = {500,1000,2000,4000,6000}
					
	petid = 92 --练宠活动PETID
	
	PayDay_Data = {{100,27039,1}
                  ,{500,26029,1}
				  ,{1000,28478,1}
	              ,{2000,29008,1}--当日充值奖励
				  ,{3000,23819,1}
				  ,{5000,22000,1}
				  ,{15000,29500,1}
				  }
	
	--充值达成奖励
	Pay_Data = {
					{300,28410,1},
					{500,28411,1},
					{1000,29037,1},
					{3000,29038,1},
					{5000,29510,1},
					{10000,29040,1},
					{15000,28404,1},
					{30000,29512,1},
					{50000,23842,1}
					}
				
	--消费达成奖励
	Cost_Data = {
					{3000,{{28446,1},{28452,1},{28462,1}}},
					{5000,{{28447,1},{28453,1},{28458,1}}},
					{10000,{{28448,1},{28454,1},{28459,1}}},
					{50000,{{28449,1},{28455,1},{23800,1}}},
					{100000,{{28450,1},{28456,1},{21113,1}}},
					{980000,{{28451,1},{28415,1},{23805,1}}}
					}

				
	petprize ={{22064},
				{29063},
				{28469},
				{29007},
				{29007},
				{28359},
				{28359},
				{28411},
				{27020},
				{27020}} 
	
	petpointshop = {{1,500,99,20170825}
					,{1,500,99,20170826}
					,{1,500,99,20170827}
					,{1,500,99,20170828}
					,{1,500,99,20170829}
					,{1,500,99,20170830}
					,{1,500,99,20170831}}
					
	achievementdata = {{1,1,140,200,1},{2,2,140,500,1},{3,3,140,800,1},{4,4,140,1000,1},{5,5,140,1500,1}}
	
	xianshipet = {777,0,0,150,200000,300,30000}
	
	--派派送
	itemData = {{"20900,26074,21100,27024,22008,27022,20810,21018,21019,27025,22032,22026,22505,14721-14780,14121-14150,14421-14450,15021-15080,15321-15380,15621-15680,15921-15980,16221-16280,14721-14780,14121-14150,14421-14450",false,500}   ---出18-20级武器
						 ,{"20900,26074,21100,27024,22008,27022,20810,21018,21019,27026,22032,22026,22505,17201-17207,17211-17217,17221-17227,17231-17237,17701-17800,17201-17300,16521,16521-16580,16821-16880,16527,16533,16539,16545,16551,17701-17800,17201-17300,16521,16521-16580,16821-16880",false,700}   ---出17-19级装备
						 ,{"18076-18078,18079-18090,22050,22051",false,750}    ---出环9-10
						 ,{"18061-18063,18064-18075,22050",false,800}    ---出环8
						 ,{"25101,25111,25121,25131,28458",false,900}    ---出1级光环
						 ,{"20900,26074,21100,27024,22008,27022,20810,21018,21019,27025,27026,22032,22026,22505,22051,22050",false,930}    ---出杂货--22008下次维护修改为不绑定
						 ,{"26042-26045,15381-15410,15411-15440,15981-16010,16011-16040,16281-16310,16311-16340,17851-17860",false,960}       --声望
						 ,{"25100,22407,22050,22051,20846,20841,14781-14810,14811-14840,22063,15081-15140,29172,17301-17310,23805,23840,29507,17351-17400",false,970}       --神级物品2
						 ,{"21021,21020,20833,22062,22506,29118,29150,29502,23800,29153,29119,29502,22499,22402,22052,22060,28355,28354,16581-16610,16611-16640",false,980}       --新神级物品
						 ,{"26073,26028,26027,29166,29067,29068,29069,28496,28425,28433,29140,29512,29167,29163,28359,28360,28350,28360,29118,29119,26061,29082,28356,28357,28425",false,985}       --新神级物品
						 ,{"18076-18078,18079-18090,26028",false,990}		   -- 环九
						 ,{"21113",false,1000}    --体验骑证
						 }
	itemLucky = 22061 --幸运道具的ID
	AllServerItemList = {21020,21021,21113,22061,23800,18076,18077,26027,29140,29512,28496,28425,28433,29502,29067,29068,29069,29502,16581,16582,29172,23805,23840,22063,16583,16584,16586,17351,17359,17360,17309,17310,16611,16612,16613,16614,16616,18078,28350,22402,26028,22052,22060,26028,28355,28354,22050,22499,22051,18079,18080,18081,29118,29119,18082,18083,18084,18085,18086,18087,18088,18089,18090,28359,28356,28357,28425}
	
	--每日充值排行奖励
	PayDayPaiMing_Data = {{32580,-5,-100,22492},{32581,-5,-100,22493},{32583,-5,-100,22495},{"20190126","20190127","20190128","20190129","20190130","20190131","20190201","20190202","20190203","20190204","20190205","20190206","20190207","20190208","20190209"}
						}
	--每日消费排行奖励
	CostDayPaiMing_Data = {{109023,-5,-110,28353},{109024,-5,-100,28355},{109025,-5,-100,28354}}
    sasql.query("select id,unicode from capturepet where name ='不要删'")
    sasql.free_result();
    sasql.store_result();
    sasql.fetch_row();
    petid = other.atoi(sasql.data(1))
	
	if #huodongdata>=7 and huodongdata[7][1]==9 then
		huodongdata[7][6] = other.atoi(sasql.data(2))
	end
    
end
function main()
	--第一个商店内容
	data()
	PayDayPaiMing = {}--{"日期",第一名，第二名，第三名}
	today25 = ""
	today26 = ""
	today27 = ""
	Create("活动NPC", 100000, 777, 25, 39, 4)
    magic.addLUAListFunction("lianchong", "LC", "", 3, "[lianchong emenybase编号 天数]");
end