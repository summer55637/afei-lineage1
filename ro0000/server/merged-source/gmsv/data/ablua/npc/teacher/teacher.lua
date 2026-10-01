function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function checkbuff ( buff )
	if buff == "" then
		return 0
	end
	local q,n = string.find(buff,"'")
	if q ~= nil then
		return 0
	end
	return 1
end

function getTsType ( talkerindex )
	--返回值为-1失败，0为未拜师未收徒，1为师傅，2为徒弟（拜师未成功），3为徒弟（拜师成功）
	token = "select * from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			sasql.fetch_row()
			teachername = sasql.data(2)
			teacheruid = sasql.data(3)
			teacherfaceimage = other.atoi(sasql.data(4))
			teacherlevel = other.atoi(sasql.data(5))
			teacherfmname = sasql.data(6)
			if char.getInt(talkerindex,"转数") < 5 or char.getInt(talkerindex,"等级") < 135 or char.getChar(talkerindex,"UID") ~= teacheruid then
				token = "delete from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(token)
				token = "delete from `studentdata` where `teachercdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				if ret == 1 then
					return 0
				else
					return -1
				end
			end
			fmname = ""
			if char.getInt(talkerindex,"家族地位") == 1 or char.getInt(talkerindex,"家族地位") == 3 or char.getInt(talkerindex,"家族地位") == 4 then
				fmname = char.getChar(talkerindex,"家族")
			end
			if teachername ~= char.getChar(talkerindex,"名字") or char.getInt(talkerindex,"头像号") ~= teacherfaceimage or char.getInt(talkerindex,"等级") ~= teacherlevel or fmname ~= teacherfmname then
				token = "update `teacherdata` set `name`='" .. char.getChar(talkerindex,"名字") .. "',`faceimage`=" .. char.getInt(talkerindex,"头像号") .. ",`level`=" .. char.getInt(talkerindex,"等级") .. ",`fmname`='" .. fmname .."' where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				sasql.query(token)
			end
			return 1
		end
	end
	token = "select * from `studentdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			sasql.fetch_row()
			studentname = sasql.data(2)
			studentuid = sasql.data(3)
			studentfaceimage = other.atoi(sasql.data(4))
			studenttrans = other.atoi(sasql.data(5))
			studentlevel = other.atoi(sasql.data(6))
			studentcheck = other.atoi(sasql.data(9))
			if studentcheck == 0 then
				if char.getInt(talkerindex,"转数") > 1 or char.getChar(talkerindex,"UID") ~= studentuid then
					token = "delete from `studentdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					ret = sasql.query(token)
					if ret == 1 then
						return 0
					else
						return -1
					end
				end
			end
			if studentname ~= char.getChar(talkerindex,"名字") or char.getInt(talkerindex,"头像号") ~= studentfaceimage or char.getInt(talkerindex,"转数") ~= studenttrans or char.getInt(talkerindex,"等级") ~= studentlevel then
				token = "update `studentdata` set `name`='" .. char.getChar(talkerindex,"名字") .. "',`faceimage`=" .. char.getInt(talkerindex,"头像号") .. ",`trans`=" .. char.getInt(talkerindex,"转数") .. ",`level`=" .. char.getInt(talkerindex,"等级") .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				sasql.query(token)
			end
			if studentcheck == 0 then
				return 2
			else
				return 3
			end
		end
	end
	return 0
end

function NpcLoop(meindex)
	token = "delete from `studentdata` where `check`=0 and `time`<" .. other.time() - 3600 * 2
	sasql.query(token)
end

function ShowTeacherWin ( talkerindex )
	showbtn = 0
	local tstype = getTsType(talkerindex)
	if tstype == 0 then
		if char.getInt(talkerindex,"转数") < 2 then
			showbtn = other.NumLeftToNum(1,4)
		elseif char.getInt(talkerindex,"转数") == 5 and char.getInt(talkerindex,"等级") >= 135 then
			showbtn = other.NumLeftToNum(1,5)
		end
	elseif tstype == 1 then
		showbtn = other.NumLeftToNum(1,0)
		showbtn = other.DataOrData(showbtn,2)
		showbtn = other.DataOrData(showbtn,3)
		showbtn = other.DataOrData(showbtn,5)
	elseif tstype == 3 then
		if char.getInt(talkerindex,"转数") < 5 or char.getInt(talkerindex,"等级") < 135 then
			showbtn = other.NumLeftToNum(1,2)
		else
			showbtn = other.NumLeftToNum(1,1)
		end
	end
	lssproto.windows(talkerindex, 1015, "取消", 0, char.getWorkInt( npcindex, "对象"), "K|" .. showbtn)
	return 0
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 0 then
		--print("\ndata=" .. data)
		if data == "" then
			return
		end
		local tstype = getTsType(talkerindex)
		local type = other.getString(data,"|",1)
		if type == "C" then
			if tstype == 0 then
				--QQ|在线开始时间|在线结束时间|简介说明
				token = "L||0|24|在此输入您的简介说明"
				lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( npcindex, "对象"), token)
			elseif tstype == 1 then
				token = "select * from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						teacherqq = sasql.data(9)
						starttime = other.atoi(sasql.data(11))
						endtime = other.atoi(sasql.data(12))
						teacherbuff = sasql.data(14)
						token = "L|" .. teacherqq .. "|" .. starttime .. "|" .. endtime .. "|" .. teacherbuff
						lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
					end
				end
			end
		elseif type == "L" then
			local Ltype = other.getString(data,"|",2)
			if Ltype == "" then
				return
			end
			if other.atoi(Ltype) == 1 then
				token = "select `check` from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						teachercheck = other.atoi(sasql.data(1))
						if teachercheck == 1 then
							token = "update `teacherdata` set `check`=0 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
							sasql.query(token)
							char.newMessageToCli(talkerindex,-1,"师傅信息撤下成功","白色")
						end
					end
				end
			elseif other.atoi(Ltype) == 2 then
				--L|2|QQ号|开始时间（00）|结束时间（24）|简介
				teacherqq = other.getString(data,"|",3)
				starttimebuff = other.getString(data,"|",4)
				endtimebuff = other.getString(data,"|",5)
				teacherbuff = other.getString(data,"|",6)
				if teacherqq == "" or starttimebuff == "" or endtimebuff == "" or teacherbuff == "" then
					return
				end
				starttime = other.atoi(starttimebuff)
				endtime = other.atoi(endtimebuff)
				if starttime < 0 or starttime > 24 then
					return
				end
				if endtime < 0 or endtime > 24 then
					return
				end
				if starttime == endtime then
					return
				end
				if other.atoi(teacherqq) < 10000 then
					return
				end
				if tstype == 0 then
					if char.getInt(talkerindex,"转数") < 5 or char.getInt(talkerindex,"等级") < 135 then
						char.newMessageToCli(talkerindex,-1,"能力太低，不能收徒","白色")
						return
					end
					fmname = ""
					if char.getInt(talkerindex,"家族地位") == 1 or char.getInt(talkerindex,"家族地位") == 3 or char.getInt(talkerindex,"家族地位") == 4 then
						fmname = char.getChar(talkerindex,"家族")
					end
					if checkbuff(teacherbuff) == 0 then
						return
					end
					token = "insert into `teacherdata` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. char.getChar(talkerindex,"名字") .. "','" .. char.getChar(talkerindex,"UID") .. "'," .. char.getInt(talkerindex,"头像号") .. "," .. char.getInt(talkerindex,"等级") .. ",'" .. fmname .. "',0,0,'" .. other.atoi(teacherqq) .. "',0," .. starttime .. "," .. endtime .. ",0,'" .. teacherbuff .. "',1,0,0)"
					sasql.query(token)
					char.newMessageToCli(talkerindex,-1,"师傅信息提交成功","白色")
				elseif tstype == 1 then
					fmname = ""
					if char.getInt(talkerindex,"家族地位") == 1 or char.getInt(talkerindex,"家族地位") == 3 or char.getInt(talkerindex,"家族地位") == 4 then
						fmname = char.getChar(talkerindex,"家族")
					end
					if checkbuff(teacherbuff) == 0 then
						return
					end
					token = "update `teacherdata` set `level`=" .. char.getInt(talkerindex,"等级") .. ",`fmname`='" .. fmname .. "',`qq`='" .. other.atoi(teacherqq) .. "',`starttime`=" .. starttime .. ",`endtime`=" .. endtime .. ",`buff`='" .. teacherbuff .. "',`check`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					sasql.query(token)
					char.newMessageToCli(talkerindex,-1,"师傅信息提交成功","白色")
				end
			end
		elseif type == "G" then
			--总数量|总页数|师傅索引|头像|转生|等级|名字|是否在线|好评|差评|...N师傅索引|头像|转生|等级|名字|是否在线|好评|差评|
			if char.getInt(talkerindex,"转数") > 1 then
				return
			end
			if tstype ~= 0 then
				return
			end
			token = "select `cdkey`,`name`,`uid`,`faceimage`,`level`,`good`,`bad` from `teacherdata` where `check`=1 order by `endnum` desc"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					teachernum = math.min(sqlnum,10)
					teacherpage = math.ceil(sqlnum / 10)
					teacherdata = {}
					for i=1,teachernum do
						sasql.fetch_row()
						teacherdata[i] = {sasql.data(1),sasql.data(2),sasql.data(3),other.atoi(sasql.data(4)),other.atoi(sasql.data(5)),other.atoi(sasql.data(6)),other.atoi(sasql.data(7)),0}
					end
					for i=1,table.getn(teacherdata) do
						token = "select `Online`,`Offline` from `CSAlogin` where `Name`='" .. teacherdata[i][1] .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(1)) > 0 and other.atoi(sasql.data(2)) == 0 then
									teacherdata[i][8] = 1
								end
							end
						end
					end
					token = "B|" .. teachernum .. "|" .. teacherpage
					for i=1,table.getn(teacherdata) do
						token = token .. "|" .. teacherdata[i][3] .. "|" .. teacherdata[i][4] .. "|5|" .. teacherdata[i][5] .. "|" .. teacherdata[i][2] .. "|" .. teacherdata[i][8] .. "|" .. teacherdata[i][6] .. "|" .. teacherdata[i][7]
					end
					lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				else
					token = "B|0|0"
					lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif type == "D" then
			--总数量|师傅索引|头像|转生|等级|名字|是否在线|好评|差评|...N师傅索引|头像|转生|等级|名字|是否在线|好评|差评|
			if char.getInt(talkerindex,"转数") > 1 then
				return
			end
			if tstype ~= 0 then
				return
			end
			teacherpage = other.getString(data,"|",2)
			if teacherpage == "" then
				return
			end
			token = "select `cdkey`,`name`,`uid`,`faceimage`,`level`,`good`,`bad` from `teacherdata` where `check`=1 order by `endnum` desc limit " .. (other.atoi(teacherpage) - 1) * 10 .. ",10"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					teachernum = math.min(sqlnum,10)
					teacherdata = {}
					for i=1,teachernum do
						sasql.fetch_row()
						teacherdata[i] = {sasql.data(1),sasql.data(2),sasql.data(3),other.atoi(sasql.data(4)),other.atoi(sasql.data(5)),other.atoi(sasql.data(6)),other.atoi(sasql.data(7)),0}
					end
					for i=1,table.getn(teacherdata) do
						token = "select `Online`,`Offline` from `CSAlogin` where `Name`='" .. teacherdata[i][1] .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(1)) > 0 and other.atoi(sasql.data(2)) == 0 then
									teacherdata[i][8] = 1
								end
							end
						end
					end
					token = "D|" .. teachernum
					for i=1,table.getn(teacherdata) do
						token = token .. "|" .. teacherdata[i][3] .. "|" .. teacherdata[i][4] .. "|5|" .. teacherdata[i][5] .. "|" .. teacherdata[i][2] .. "|" .. teacherdata[i][8] .. "|" .. teacherdata[i][6] .. "|" .. teacherdata[i][7]
					end
					lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif type == "B" then
			if char.getInt(talkerindex,"转数") > 1 then
				char.newMessageToCli(talkerindex,-1,"你的能力已经很高了","白色")
				return
			end
			local BType = other.getString(data,"|",2)
			if BType == "" then
				return
			end
			if other.atoi(BType) == 1 then
				if tstype == -1 then
					char.newMessageToCli(talkerindex,-1,"拜师失败","白色")
					return
				elseif tstype == 1 then
					char.newMessageToCli(talkerindex,-1,"你已经是师傅了","白色")
					return
				elseif tstype == 2 or tstype == 3 then
					char.newMessageToCli(talkerindex,-1,"你已经拜师了","白色")
					return
				end
				teacheruid = other.getString(data,"|",3)
				teacherbuff = other.getString(data,"|",4)
				if teacheruid == "" or teacherbuff == "" then
					return
				end
				if checkbuff(teacherbuff) == 0 then
					return
				end
				token = "select * from `teacherdata` where `uid`='" .. teacheruid .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						teachercdkey = sasql.data(1)
						token = "select * from `studentdata` where `teachercdkey`='" .. teachercdkey .. "' and `check`=1"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum >= 2 then
								char.newMessageToCli(talkerindex,-1,"该师傅已经有2个徒弟了","白色")
								return
							end
							token = "insert into `studentdata` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. char.getChar(talkerindex,"名字") .. "','" .. char.getChar(talkerindex,"UID") .. "'," .. char.getInt(talkerindex,"头像号") .. "," .. char.getInt(talkerindex,"转数") .. "," .. char.getInt(talkerindex,"等级") .. ",'" .. teacherbuff .. "','" .. teachercdkey .. "',0," .. other.time() .. ")"
							sasql.query(token)
							char.newMessageToCli(talkerindex,-1,"拜师成功","白色")
							if char.getInt(talkerindex,"等级") >= 20 then
								other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,610,0})
							end
						end
					else
						char.newMessageToCli(talkerindex,-1,"此人还不是师傅","白色")
						return
					end
				end
			elseif other.atoi(BType) == 2 then
				if tstype ~= 0 then
					return
				end
				teacheruid = other.getString(data,"|",3)
				if teacheruid == "" then
					return
				end
				token = "select * from `teacherdata` where `uid`='" .. teacheruid .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						--头像|转生|等级|名字|家族名|好评|差评|QQ|徒弟数量|出师数量|在线时间|简介|
						teacherdata = {sasql.data(4),5,sasql.data(5),sasql.data(2),sasql.data(6),sasql.data(7),sasql.data(8),sasql.data(9),0,sasql.data(13),sasql.data(11) .. ":00-" .. sasql.data(12) .. ":00",sasql.data(14)}
						token = "select * from `studentdata` where `teachercdkey`='" .. sasql.data(1) .. "' and `check`=1"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							teacherdata[9] = sqlnum
						end
						token = "M|" .. teacherdata[1] .. "|" .. teacherdata[2] .. "|" .. teacherdata[3] .. "|" .. teacherdata[4] .. "|" .. teacherdata[5] .. "|" .. teacherdata[6] .. "|" .. teacherdata[7] .. "|" .. teacherdata[8] .. "|" .. teacherdata[9] .. "|" .. teacherdata[10] .. "|" .. teacherdata[11] .. "|" .. teacherdata[12]
						lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
					end
				end
			end
		elseif type == "A" then --S|4|1|0|1|140|测试名字测试名字|0|介绍说明介绍说明介绍说明|1|0|5|140|测试名字测试名字|1|介绍说明介绍说明|1|0|5|140|测试名字测试名字|1|介绍说明介绍说明|1|0|5|140|测试名字测试名字|1|介绍说明介绍说明|1|0|5|140|测试名字测试名字|1|介绍说明介绍说明|
			if tstype ~= 1 then
				return
			end
			token = "select * from `studentdata` where `teachercdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					studentdata = {}
					studentnum = sqlnum
					for i=1,sqlnum do
						sasql.fetch_row()
						studentdata[i] = {sasql.data(1),sasql.data(3),other.atoi(sasql.data(4)),other.atoi(sasql.data(5)),other.atoi(sasql.data(6)),sasql.data(2),0,sasql.data(7)}
					end
					for i=1,table.getn(studentdata) do
						token = "select `Online`,`Offline` from `CSAlogin` where `Name`='" .. studentdata[i][1] .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(1)) > 0 and other.atoi(sasql.data(2)) == 0 then
									studentdata[i][7] = 1
								end
							end
						end
					end
					token = "S|" .. studentnum
					for i=1,table.getn(studentdata) do
						token = token .. "|" .. studentdata[i][2] .. "|" .. studentdata[i][3] .. "|" .. studentdata[i][4] .. "|" .. studentdata[i][5] .. "|" .. studentdata[i][6] .. "|" .. studentdata[i][7] .. "|" .. studentdata[i][8]
					end
					lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				else
					token = "S|0"
					lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif type == "S" then
			if tstype ~= 1 then
				return
			end
			local SType = other.getString(data,"|",2)
			if SType == "" then
				return
			end
			if other.atoi(SType) == 1 then
				studentuid = other.getString(data,"|",3)
				if studentuid == "" then
					return
				end
				token = "select `teachercdkey` from `studentdata` where `uid`='" .. studentuid .. "' and `check`=0"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						if sasql.data(1) ~= char.getChar(talkerindex,"账号") then
							return
						end
						token = "select * from `studentdata` where `teachercdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=1"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum >= 2 then
								char.newMessageToCli(talkerindex,-1,"您的徒弟数量已达上限","白色")
								return
							end
							token = "select `kicktime` from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
							ret = sasql.query(token)
							if ret == 1 then
								sasql.free_result()
								sasql.store_result()
								sqlnum = sasql.num_rows()
								if sqlnum > 0 then
									sasql.fetch_row()
									if other.atoi(sasql.data(1)) + 86400 * 3 > other.time() then
										char.newMessageToCli(talkerindex,-1,"逐出徒弟后3天不能收徒","白色")
										return
									end
									token = "update `studentdata` set `check`=1 where `uid`='" .. studentuid .. "'"
									sasql.query(token)
									token = "select * from `studentdata` where `teachercdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=1"
									ret = sasql.query(token)
									if ret == 1 then
										sasql.free_result()
										sasql.store_result()
										sqlnum = sasql.num_rows()
										if sqlnum >= 2 then
											token = "delete from `studentdata` where `teachercdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0"
											sasql.query(token)
										end
									end
									char.newMessageToCli(talkerindex,-1,"收徒成功","白色")
								end
							end
						end
					end
				end
			elseif other.atoi(SType) == 2 then
				studentuid = other.getString(data,"|",3)
				if studentuid == "" then
					return
				end
				token = "select `teachercdkey` from `studentdata` where `uid`='" .. studentuid .. "' and `check`=0"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						if sasql.data(1) ~= char.getChar(talkerindex,"账号") then
							return
						end
						token = "delete from `studentdata` where `uid`='" .. studentuid .. "'"
						sasql.query(token)
						char.newMessageToCli(talkerindex,-1,"删除信息成功","白色")
					end
				end
			end
		elseif type == "O" then
			--师徒管理窗口数据
			--第一个一定是师傅,第二个第三个一定是徒弟,一个师傅只能收两个徒弟
			--对象所属索引(1、师傅 2\3为徒弟,如果玩家是师傅,则可以对徒弟逐出师门,如果为徒弟,则指向那个是徒弟)
			--对象所属索引|数量|形象|等级|名字|是否在线中|QQ号|..N形象|等级|名字|是否在线中|QQ号|UID|
			if tstype ~= 1 and tstype ~= 3 then
				return
			end
			if tstype == 1 then
				token = "select `qq` from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						tsnum = 1
						studentdata = {}
						sasql.fetch_row()
						teacherqq = sasql.data(1)
						token = "select `cdkey`,`name`,`uid`,`faceimage`,`level` from `studentdata` where `teachercdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=1"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum > 0 then
								tsnum = tsnum + sqlnum
								for i=1,sqlnum do
									sasql.fetch_row()
									studentdata[i] = {sasql.data(1),other.atoi(sasql.data(4)),other.atoi(sasql.data(5)),sasql.data(2),0,sasql.data(3)}
								end
								for i=1,table.getn(studentdata) do
									token = "select `Online`,`Offline` from `CSAlogin` where `Name`='" .. studentdata[i][1] .. "'"
									ret = sasql.query(token)
									if ret == 1 then
										sasql.free_result()
										sasql.store_result()
										sqlnum = sasql.num_rows()
										if sqlnum > 0 then
											sasql.fetch_row()
											if other.atoi(sasql.data(1)) > 0 and other.atoi(sasql.data(2)) == 0 then
												studentdata[i][5] = 1
											end
										end
									end
								end
							end
						end
						token = "O|1|" .. tsnum .. "|" .. char.getInt(talkerindex,"头像号") .. "|" .. char.getInt(talkerindex,"等级") .. "|" .. char.getChar(talkerindex,"名字") .. "|1|" .. teacherqq .. "|" .. char.getChar(talkerindex,"UID")
						for i=1,table.getn(studentdata) do
							token = token .. "|" .. studentdata[i][2] .. "|" .. studentdata[i][3] .. "|" .. studentdata[i][4] .. "|" .. studentdata[i][5] .. "||" .. studentdata[i][6]
						end
						lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
					end
				end
			elseif tstype == 3 then
				token = "select `teachercdkey` from `studentdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						teachercdkey = sasql.data(1)
						token = "select `name`,`uid`,`faceimage`,`level`,`qq` from `teacherdata` where `cdkey`='" .. teachercdkey .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							sqlnum = sasql.num_rows()
							if sqlnum > 0 then
								sasql.fetch_row()
								teacherdata = {other.atoi(sasql.data(3)),other.atoi(sasql.data(4)),sasql.data(1),0,other.atoi(sasql.data(5)),sasql.data(2)}
								token = "select `Online`,`Offline` from `CSAlogin` where `Name`='" .. teachercdkey .. "'"
								ret = sasql.query(token)
								if ret == 1 then
									sasql.free_result()
									sasql.store_result()
									sqlnum = sasql.num_rows()
									if sqlnum > 0 then
										sasql.fetch_row()
										if other.atoi(sasql.data(1)) > 0 and other.atoi(sasql.data(2)) == 0 then
											teacherdata[4] = 1
										end
									end
								end
								tsnum = 1
								mynum = 0
								token = "select `cdkey`,`name`,`uid`,`faceimage`,`level` from `studentdata` where `teachercdkey`='" .. teachercdkey .. "' and `check`=1"
								ret = sasql.query(token)
								if ret == 1 then
									sasql.free_result()
									sasql.store_result()
									sqlnum = sasql.num_rows()
									if sqlnum > 0 then
										tsnum = tsnum + sqlnum
										for i=1,sqlnum do
											sasql.fetch_row()
											if mynum == 0 and char.getChar(talkerindex,"UID") == sasql.data(3) then
												mynum = i + 1
												studentdata[i] = {char.getChar(talkerindex,"账号"),char.getInt(talkerindex,"头像号"),char.getInt(talkerindex,"等级"),char.getChar(talkerindex,"名字"),0,char.getChar(talkerindex,"UID")}
											else
												studentdata[i] = {sasql.data(1),other.atoi(sasql.data(4)),other.atoi(sasql.data(5)),sasql.data(2),0,sasql.data(3)}
											end
										end
										for i=1,table.getn(studentdata) do
											token = "select `Online`,`Offline` from `CSAlogin` where `Name`='" .. studentdata[i][1] .. "'"
											ret = sasql.query(token)
											if ret == 1 then
												sasql.free_result()
												sasql.store_result()
												sqlnum = sasql.num_rows()
												if sqlnum > 0 then
													sasql.fetch_row()
													if other.atoi(sasql.data(1)) > 0 and other.atoi(sasql.data(2)) == 0 then
														studentdata[i][5] = 1
													end
												end
											end
										end
									end
								end
								if mynum > 0 then
									token = "O|" .. mynum .. "|" .. tsnum .. "|" .. teacherdata[1] .. "|" .. teacherdata[2] .. "|" .. teacherdata[3] .. "|" .. teacherdata[4] .. "|" .. teacherdata[5] .. "|" .. teacherdata[6]
									for i=1,table.getn(studentdata) do
										token = token .. "|" .. studentdata[i][2] .. "|" .. studentdata[i][3] .. "|" .. studentdata[i][4] .. "|" .. studentdata[i][5] .. "||" .. studentdata[i][6]
									end
									lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
								end
							end
						end
					end
				end
			end
		elseif type == "J" then
			local JType = other.getString(data,"|",2)
			if JType == "" then
				return
			end
			if other.atoi(JType) == 1 then
				token = "delete from `studentdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					char.newMessageToCli(talkerindex,-1,"成功退出师门","白色")
				end
			elseif other.atoi(JType) == 2 then
				if tstype ~= 1 then
					return
				end
				studentuid = other.getString(data,"|",3)
				if studentuid == "" then
					return
				end
				token = "select `teachercdkey` from `studentdata` where `uid`='" .. studentuid .. "' and `check`=1"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						if char.getChar(talkerindex,"账号") ~= sasql.data(1) then
							return
						end
						token = "delete from `studentdata` where `uid`='" .. studentuid .. "'"
						sasql.query(token)
						token = "update `teacherdata` set `kicktime`=" .. other.time() .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
						sasql.query(token)
						char.newMessageToCli(talkerindex,-1,"将徒弟逐出师门","白色")
					end
				end
			end
		elseif type == "E" then
			local EType = other.getString(data,"|",2)
			if EType == "" then
				return
			end
			if other.atoi(EType) < 0 then
				EType = "0"
			elseif other.atoi(EType) > 5 then
				EType = "5"
			end
			if tstype ~= 3 then
				return
			end
			if char.getInt(talkerindex,"转数") < 5 or char.getInt(talkerindex,"等级") < 135 then
				return
			end
			if math.floor(char.getInt(talkerindex,"体力") / 100) + math.floor(char.getInt(talkerindex,"腕力") / 100) + math.floor(char.getInt(talkerindex,"耐力") / 100) + math.floor(char.getInt(talkerindex,"速度") / 100) + char.getInt(talkerindex,"技能点") < 600 then
				char.newMessageToCli(talkerindex,-1,"您的能力太低，无法出师","白色")
				return
			end
			token = "select `teachercdkey` from `studentdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					teachercdkey = sasql.data(1)
					token = "delete from `studentdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
					ret = sasql.query(token)
					if ret == 1 then
						if other.atoi(EType) >= 3 then
							token = "update `teacherdata` set `good`=`good`+1,`endnum`=`endnum`+1 where `cdkey`='" .. teachercdkey .. "'"
						else
							token = "update `teacherdata` set `bad`=`bad`+1,`endnum`=`endnum`+1 where `cdkey`='" .. teachercdkey .. "'"
						end
						sasql.query(token)
						char.newMessageToCli(talkerindex,-1,"出师成功","白色")
					end
				end
			end
		elseif type == "F" then
			if tstype ~= 1 then
				return
			end--是否领取(0未达成,1可领取|2领取了)|第一个称号|达成说明|达成奖励数量|道具形象|道具名|奖励数量|..道具形像N|道具名N|奖励数量N|...是否领取|第六个称号|达成说明|达成奖励数量|道具形象|道具名|..道具形像N|道具名N|
			token = "select `endnum`,`jiang` from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					endnum = other.atoi(sasql.data(1))
					jiangnum = other.atoi(sasql.data(2))
					jiangtype = {other.DataAndData(jiangnum,0),other.DataAndData(jiangnum,1),other.DataAndData(jiangnum,2),other.DataAndData(jiangnum,3),other.DataAndData(jiangnum,4),other.DataAndData(jiangnum,5)}
					token = "R"
					for i=1,table.getn(teacherjiang) do
						if jiangtype[i] ~= 0 then
							jiangtype[i] = 2
						elseif jiangtype[i] == 0 then
							if endnum >= teacherjiang[i][4] then
								jiangtype[i] = 1
							end
						end
						token = token .. "|" .. jiangtype[i] .."|" .. teacherjiang[i][2] .. "|" .. teacherjiang[i][3] .. "|" .. table.getn(teacherjiang[i][5])
						for j=1,table.getn(teacherjiang[i][5]) do
							token = token .. "|" .. item.getgraNoFromITEMtabl(teacherjiang[i][5][j][1]) .. "|" .. item.getSecretNameFromNumber(teacherjiang[i][5][j][1]) .. "|" .. teacherjiang[i][5][j][2]
						end
					end
					lssproto.windowsupdate(talkerindex, 1015, "取消", 0, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif type == "H" then
			if tstype ~= 1 then
				return
			end
			local HType = other.getString(data,"|",2)
			if HType == "" then
				return
			end
			if other.atoi(HType) < 1 or other.atoi(HType) > 6 then
				return
			end
			token = "select `endnum`,`jiang` from `teacherdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				if sqlnum > 0 then
					sasql.fetch_row()
					endnum = other.atoi(sasql.data(1))
					jiangnum = other.atoi(sasql.data(2))
					jiangtype = {other.DataAndData(jiangnum,0),other.DataAndData(jiangnum,1),other.DataAndData(jiangnum,2),other.DataAndData(jiangnum,3),other.DataAndData(jiangnum,4),other.DataAndData(jiangnum,5)}
					for i=1,table.getn(teacherjiang) do
						if jiangtype[i] ~= 0 then
							jiangtype[i] = 2
						elseif jiangtype[i] == 0 then
							if endnum >= teacherjiang[i][4] then
								jiangtype[i] = 1
							end
						end
					end
					if jiangtype[other.atoi(HType)] == 1 then
						itemnum = 0
						for i=1,table.getn(teacherjiang[other.atoi(HType)][5]) do
							itemnum = itemnum + teacherjiang[other.atoi(HType)][5][i][2]
						end
						if checkEmptItemNum(talkerindex) < itemnum then
							char.newMessageToCli(talkerindex,-1,"道具栏位不足","白色")
							return
						end
						token = "update `teacherdata` set `jiang`=" .. other.DataOrData(jiangnum,other.atoi(HType) - 1)  .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							for i=1,table.getn(teacherjiang[other.atoi(HType)][5]) do
								for j=1,teacherjiang[other.atoi(HType)][5][i][2] do
									local itemindex = char.Additem(talkerindex,teacherjiang[other.atoi(HType)][5][i][1])
									if item.check(itemindex) == 1 then
										if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
											item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
										end
									end
								end
							end
							other.CallFunction("othertitleuse","data/ablua/chartitle.lua",{talkerindex,teacherjiang[other.atoi(HType)][1]})
							char.newMessageToCli(talkerindex,-1,"成功领取奖励","白色")
							token = other.atoi(HType) .. "|" .. char.getChar(talkerindex,"名字") .. "|" .. endnum
							other.CallFunction("weixin","data/ablua/weixin.lua",{talkerindex,2,token})
						end
					end
				end
			end
		end
	end
end

function TeacherExt ( talkerindex,toindex )
	local touid = char.getChar(toindex,"UID")
	if touid == "" then
		return 1
	end
	WindowTalked(npcindex,talkerindex,0,0,"B|1|" .. touid .. "|我是" .. char.getChar(talkerindex,"名字"))
	return 1
end


function Create(name, metamo, floorid, x, y)
	npcindex = npc.CreateNpc(name, metamo, floorid, x, y, 6)
	if char.check(npcindex) == 1 then
		--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
		char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
		char.setFunctionPointer(npcindex, "循环事件", "NpcLoop", "")
		char.setInt(npcindex, "循环事件时间", 600000)
		return npcindex
	end
	return -1
end

function data()
	teacherjiang = {
					{11,"良师益友","亲传弟子2人",2,{{22037,3}}}
					,{12,"诲人不倦","亲传弟子6人",6,{{22037,3},{26027,3}}}
					,{13,"春风化雨","亲传弟子12人",12,{{26028,3},{21113,2}}}
					,{14,"匠心树人","亲传弟子20人",20,{{27020,3},{21113,2}}}
					,{15,"桃李满门","亲传弟子30人",30,{{26073,3},{21113,3}}}
					,{16,"先圣先师","亲传弟子50人",50,{{22601,1}}}
					}
end

function main()
	data()
	Create("师徒系统",100000,777,18,16)
end


