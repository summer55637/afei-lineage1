function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function FreeEmailGetHd(charaindex)
	local cdkey = char.getChar(charaindex,"账号")
	local Email_sendtime = {}
	local Email_enditem = {}
	local Email_check = {}
	local Email_delemail = {}
	ret = sasql.query("select `sendtime`,`endtime`,`check`,`deleamill` from `maildata` where `cdkey`='" .. cdkey .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			for i=1,sqlnum do
				sasql.fetch_row()
				Email_sendtime[i] = other.atoi(sasql.data(1))
				Email_enditem[i] = other.atoi(sasql.data(2))
				Email_check[i] = other.atoi(sasql.data(3))
				Email_delemail[i] = other.atoi(sasql.data(4))
				if Email_check[i] == 0 and Email_delemail[i] == 0 and other.time() <= Email_enditem[i] then
					other.CallFunction("EmailRedSend", "data/ablua/dispatchmessage.lua", {charaindex,1})--告诉前端显示红点
					return 1
				end
			end
		end
	end
	return 0
end
--邮件类型，账号，标题，内容，道具，创建时间，结束时间，是否领取（0可领取，1已领取），删除邮件，出处【必填否则认为非法操作】
function FreeEmailGetData(type,charaindex,title,content,itemid,sendtime,endtime,check,deleamill,Buff3)
    local cdkey = char.getChar(charaindex,"账号")
    other.CallFunction("EmailRedSend", "data/ablua/dispatchmessage.lua", {charaindex,1})
    sqltoken = "insert into `maildata` values (NULL," .. type .. ",'" .. cdkey .. "','" .. title .. "','" .. content .. "'," .. itemid .. "," .. sendtime .. "," .. endtime .. "," .. check .. "," .. deleamill .. ",'".. Buff3 .."')"
	sasql.query(sqltoken)
	return 1
end
--邮件类型，账号，标题，内容，道具，创建时间，结束时间，是否领取（0可领取，1已领取），删除邮件，出处【必填否则认为非法操作】
function FreeEmailGetDataA(type,cdkey,title,content,itemid,sendtime,endtime,check,deleamill,Buff3)
    sqltoken = "insert into `maildata` values (NULL," .. type .. ",'" .. cdkey .. "','" .. title .. "','" .. content .. "'," .. itemid .. "," .. sendtime .. "," .. endtime .. "," .. check .. "," .. deleamill .. ",'".. Buff3 .."')"
	sasql.query(sqltoken)
	return 1
end

function ShowHead(talkerindex,numtype)
    --print("11111111111111")
	local sqlnum = 0
	local Email_id = {}
	local Email_type = {}
	local Email_Buff = {}
	local Email_Buff2 = {}
	local Email_Data = {}
	local Email_sendtime = {}
	local Email_enditem = {}
	local Email_check = {}
	local Email_delemail = {}
	ret = sasql.query("select `id`,`type`,`buff1`,`buff2`,`data`,`sendtime`,`endtime`,`check`,`deleamill` from `maildata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `type`=" .. numtype)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			for i=1,sqlnum do
				sasql.fetch_row()
				Email_id[i] = other.atoi(sasql.data(1))
				Email_type[i] = other.atoi(sasql.data(2))
				Email_Buff[i] = sasql.data(3)
				Email_Buff2[i] = sasql.data(4)
				Email_Data[i] = other.atoi(sasql.data(5))
				Email_sendtime[i] = other.atoi(sasql.data(6))
				Email_enditem[i] = other.atoi(sasql.data(7))
				Email_check[i] = other.atoi(sasql.data(8))
				Email_delemail[i] = other.atoi(sasql.data(9))
			end
		end
	end
	
	if sqlnum <= 0 then
		token = "L|" .. sqlnum
	else
		local tmp = 0
		token = ""
		for i =1 ,sqlnum do
			if Email_check[i] == 0 and Email_delemail[i] == 0 and other.time() <= Email_enditem[i] then
				tmp = tmp + 1
				token = token .. "|" .. Email_type[i] .. "|" .. Email_id[i] .. "|" .. item.getSecretNameFromNumber(Email_Data[i]) .. "|" .. item.getgraNoFromITEMtabl(Email_Data[i]) .. "|" .. item.getItemInfoFromNumber(Email_Data[i]) .. "|" .. Email_Buff[i] .. "|" ..Email_Buff2[i] .. "|" .. Email_sendtime[i] .. "|" .. Email_enditem[i] 
			end
		end
		token = "L|" .. tmp .. token
    end
	lssproto.windows(talkerindex, 1026, 8, 0, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)--领取R|Emaill_id 删除D|Emaill_id
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		if type == "R" then
			local Emailid = other.getString(data,"|",2)
			local typeid = other.getString(data,"|",3)
			if Emailid == "" then
				return
			end
			local Email_Data = 0
			local Email_sendtime = 0
			local Email_enditem = 0
			local Email_check = 0
			local Email_delemail = 0
			local Email_Buff = ""
			local Email_Buff3 = ""
			ret = sasql.query("select `data`,`sendtime`,`endtime`,`check`,`deleamill`,`buff1`,`buff3` from `maildata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `id`=" .. Emailid .. " and `type`=" .. typeid)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					Email_Data = other.atoi(sasql.data(1))
					Email_sendtime = other.atoi(sasql.data(2))
					Email_enditem = other.atoi(sasql.data(3))
					Email_check = other.atoi(sasql.data(4))
					Email_delemail = other.atoi(sasql.data(5))
					Email_Buff = sasql.data(6)
					Email_Buff3 = sasql.data(7)
					
					if checkEmptItemNum(talkerindex) < 1 then
						char.newMessageToCli(talkerindex,-1,"您的道具栏空位不足","白色")
						return
					end
					
					if Email_check == 1 then
						char.newMessageToCli(talkerindex,-1,"您已经领取过邮件，无法领取","白色")
						return
					end
					
					if Email_delemail == 1 then
						char.newMessageToCli(talkerindex,-1,"邮件已删除无法领取","白色")
						return
					end

					if other.time() >= Email_enditem then
						char.newMessageToCli(talkerindex,-1,"邮件已经过期，无法领取","白色")
						return
					end
					
					if Email_Buff3 == "" then
						char.newMessageToCli(talkerindex,-1,"未知错误，无法领取","白色")
						return
					end
					
					-- local itemindex = char.Additem(talkerindex,Email_Data)

					-- if item.check(itemindex) == 1 then
					-- 	if item.getInt(itemindex,"序号") < 25100 or item.getInt(itemindex,"序号") > 25134 then
					-- 		if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
					-- 			item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
					-- 			item.UpdataItemOne(talkerindex, itemindex)
					-- 		end
					-- 	end
					-- 	char.TalkToCli(talkerindex, -1, "成功领取 [".. Email_Buff .."] 道具：" .. item.getChar(itemindex,"显示名"), "红色")
					-- 	sqltoken = "update `maildata` set `check`=`check`+1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `id`=" .. Emailid
					-- 	sasql.query(sqltoken)
					-- 	token = "S"
					-- 	lssproto.windowsupdate(talkerindex, 1026, 8, 0, char.getWorkInt( npcindex, "对象"), token)
					-- end
				end
			else
				return
			end
		elseif type == "D" then	
			local Emailid = other.getString(data,"|",2)
			if Emailid == "" then
				return
			end
			local typeid = other.getString(data,"|",3)
			local Email_Data = 0
			local Email_sendtime = 0
			local Email_enditem = 0
			local Email_check = 0
			local Email_delemail = 0
			local Email_Buff = ""
			local ret = sasql.query("select `data`,`sendtime`,`endtime`,`check`,`deleamill`,`buff1` from `maildata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `id`=" .. Emailid .. " and `type`=" .. typeid)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					Email_Data = other.atoi(sasql.data(1))
					Email_sendtime = other.atoi(sasql.data(2))
					Email_enditem = other.atoi(sasql.data(3))
					Email_check = other.atoi(sasql.data(4))
					Email_delemail = other.atoi(sasql.data(5))
					
					sqltoken = "update `maildata` set `deleamill`=`deleamill`+1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `id`=" .. Emailid
					sasql.query(sqltoken)
					char.newMessageToCli(talkerindex,-1,"删除邮件成功无法恢复","白色")
					ShowHead(talkerindex,typeid)
				end
			else
				return
			end
		elseif type == "T" then	
			local typeid = other.getString(data,"|",2)
			ShowHead(talkerindex,typeid)
		end
	end
end

function addEmail(charaindex, data)--GM测试给自己创建邮件
	if data == nil then
		return
	end
	local typeid = other.getString(data," ",1)--类型默认1
	local title = other.getString(data," ",2)--标题
	local content = other.getString(data," ",3)--内容
	local itemid = other.getString(data," ",4)--邮件道具id
	local sendtime = other.time()--创建时间
	local endtime = other.time() + other.getString(data," ",5) * 24 * 3600
	local check = 0
	local deleamill = 0
	local Buff3 = "gm命令创建测试指令"
	FreeEmailGetData(typeid,charaindex,title,content,itemid,sendtime,endtime,check,deleamill,Buff3)
end
function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()

end

function main()
	data()
	Create("邮件系统", 16014, 777, 35, 35, 4)
	magic.addLUAListFunction("addEmail", "addEmail", "", 3, "测试专用命令")
end
