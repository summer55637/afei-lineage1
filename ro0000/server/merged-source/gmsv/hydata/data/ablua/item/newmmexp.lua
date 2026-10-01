function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function getmmexp(charaindex)
	local mmtime = {0,0,0}
	local jiatime ={0,0,0}
	local mmhour = {0,0,0}
	local mmitemuid ={0,0,0}
	local guatype ={0,0,0}
	local jiatype = {0,0,0}
    local qutype = {0,0,0}
    local lockState = {1,0,0}
	sqltoken = "select * from `mmexp` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
	ret = sasql.query(sqltoken)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
           
            sasql.fetch_row()
            for i = 1 , 3 do
                mmtime[i] = other.atoi(sasql.data(2+(i-1)*4))
                mmhour[i] = other.atoi(sasql.data(3+(i-1)*4))
                mmitemuid[i] = sasql.data(4+(i-1)*4)
                lockState[i] = sasql.data(5+(i-1)*4)
            end
		end
    end
    for i = 1 , 3 do
        if mmtime[i] == 0 then
            guatype[i]  = 1
        elseif mmtime[i]  <= other.time() then
            qutype[i]  = 1
        else
            jiatype[i]  = 1
        end
    end
	return mmtime[1],mmhour[1],mmitemuid[1],guatype[1],jiatype[1],qutype[1],lockState[1],mmtime[2],mmhour[2],mmitemuid[2],guatype[2],jiatype[2],qutype[2],lockState[2],mmtime[3],mmhour[3],mmitemuid[3],guatype[3],jiatype[3],qutype[3],lockState[3]
end

function showmmexp(charaindex,showtype)
	--L|MM道具名字|需要活力1|小时1|需要活力2|小时2|需要活力3|小时3|加速水晶1|小时1|加速水晶2|小时2|加速水晶3|小时3|加速水晶4|小时4|完成时间戳（0没有MM）|挂机按钮状态(0不可点，1可点)|加速按钮状态(0不可点，1可点)|取出按钮状态(0不可点，1可点)
    local mmtime1,mmhour1,mmitemuid1,guatype1,jiatype1,qutype1,lockState1,mmtime2,mmhour2,mmitemuid2,guatype2,jiatype2,qutype2,lockState2, mmtime3,mmhour3,mmitemuid3,guatype3,jiatype3,qutype3,lockState3= getmmexp(charaindex)
	--print("[newmmexp:showmmexp]",charaindex,showtype)
    token = "L|"
    for j = 1 , 3 do
        token = token  .. item.getSecretNameFromNumber(mmitemid)
        for i=1,#mmdata do
            token = token .. "|" .. mmdata[i][1] .. "|" .. mmdata[i][2]
        end
        for i=1,#jiadata do
            token = token .. "|" .. jiadata[i][1] .. "|" .. jiadata[i][2]
        end
        if  j == 1 then
            token = token .. "|" .. mmtime1 .. "|" .. guatype1 .. "|" .. jiatype1 .. "|" .. qutype1.. "|"..lockState1.."|"
        elseif  j == 2 then
            token = token .. "|" .. mmtime2 .. "|" .. guatype2 .. "|" .. jiatype2 .. "|" .. qutype2.. "|"..lockState2.."|"
        elseif j == 3 then
            token = token .. "|" .. mmtime3 .. "|" .. guatype3 .. "|" .. jiatype3 .. "|" .. qutype3.. "|"..lockState3
        end
    end
	if showtype == 1 then
		lssproto.windows(charaindex,1024,0,0,char.getWorkInt(npcindex,"对象"),token)
	else
		lssproto.windowsupdate(charaindex,1024,0,0,char.getWorkInt(npcindex,"对象"),token)
	end
	return 0
end

function newmmexp(itemindex, charaindex, toindex, haveitemindex)
	local itemdata = item.getChar(itemindex,"字段")
	if itemdata == "" then
		return
	end
	itemdata = other.atoi(itemdata)
	if itemdata < 24 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您的ＭＭ玩偶还没搜集到了100%的经验，无法使用哦！", "随机色")
		return
	end
	local petindex = toindex
	if char.check(petindex) ~= 1 then
		return
	end
	local petid = char.getInt(petindex,"宠ID")
	if petid ~= 718 and petid ~= 401 then
		char.TalkToCli(charaindex, -1, "[温馨提示]ＭＭ玩偶只能对不满79级的ＭＭ使用哦！", "随机色")
		return
	end
	
	if char.getInt(petindex,"等级") >= 79 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您的ＭＭ已经79级了哦，不需要使用玩偶升级了！", "随机色")
		return
    end
	local pethaveid = 0
	for i=1,5 do
		if char.getCharPet(charaindex,i - 1) == petindex then
			pethaveid = i
			break
		end
	end
	lssproto.windows(charaindex,1025,0,0,char.getWorkInt(npcindex,"对象"),haveitemindex .. "|" .. pethaveid)
end

function WindowTalked(meindex, talkerindex, seqno, select, data)
	print("[newmmexp:WindowTalked]",meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
    local mmtime1,mmhour1,mmitemuid1,guatype1,jiatype1,qutype1,lockState1,mmtime2,mmhour2,mmitemuid2,guatype2,jiatype2,qutype2,lockState2, mmtime3,mmhour3,mmitemuid3,guatype3,jiatype3,qutype3,lockState3= getmmexp(talkerindex)
    local jiatype = {jiatype1,jiatype2,jiatype3}
    local mmtime = {mmtime1,mmtime2,mmtime3}
    local qutype = {qutype1,qutype2,qutype3}
    local mmhour = {mmhour1,mmhour2,mmhour3}
    local mmitemuid = {mmitemuid1,mmitemuid2,mmitemuid3}
    local guatype = {guatype1,guatype2,guatype3}
    local type = other.getString(data,"|",1)
    if type == "A" then
		local addtype = other.getString(data,"|",2)
		if addtype == "" then
			return
		end
		addtype = other.atoi(addtype)
		if addtype < 1 or addtype > #mmdata then
			return
        end
		-- if mmtime > 0 then
		-- 	return
		-- end
		local mmitemhaveid = other.getString(data,"|",3)
		if mmitemhaveid == "" then
			return
		end
		mmitemhaveid = other.atoi(mmitemhaveid)
		if mmitemhaveid < 9 or mmitemhaveid > 23 then
			return
        end
        local mmindex = other.getString(data,"|",4)
        if mmindex == "" then
			return
        end
        mmindex = other.atoi(mmindex)
        if mmindex < 1 or mmindex > 3 then
            return
        end
		local mmitemindex = char.getItemIndex(talkerindex,mmitemhaveid)		
		if item.check(mmitemindex) == 1 then
			local funcName =item.getChar(mmitemindex,"使用函数名")
			print("[newmmexp:WindowTalked]funcname",funcName)
			if funcName == "ITEM_NEWMMEXP" or funcName== "ITEM_MMEXP"then
				local itemdata = item.getChar(mmitemindex,"字段")
				if itemdata == "" then
					return
				end
				itemdata = other.atoi(itemdata)
				if itemdata >= 24 then
					char.newMessageToCli(talkerindex, -1, "您的MM玩偶已经满级了", "白色")
					return
				end
				if char.getInt(talkerindex,"活力") < mmdata[addtype][1] then
					char.newMessageToCli(talkerindex, -1, "您的活力不足", "白色")
					return
				end
				itemdata = itemdata + mmdata[addtype][2]
				if itemdata > 24 then
					itemdata = 24
                end
                sqltoken = "select `lockState" .. mmindex .."` from `mmexp` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
                ret = sasql.query(sqltoken)
                if ret == 1 then
                    sasql.free_result()
                    sasql.store_result()
                    if sasql.num_rows() > 0 then
                        sqltoken = "update `mmexp` set `time" .. mmindex .."` = " .. other.time() + mmdata[addtype][2] * 3600 .. ",`hour" .. mmindex .."` = " .. itemdata .. " ,`itemuid" .. mmindex .."` = '" .. item.getChar(mmitemindex,"编码") .. "' ,`lockState" .. mmindex .."` =" .. 1 .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
                        ret = sasql.query(sqltoken)
                    else
                        if mmindex == 1 then
                            sqltoken = "insert into `mmexp` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. other.time() + mmdata[addtype][2] * 3600 .. "," .. itemdata .. ",'" .. item.getChar(mmitemindex,"编码") .. "',1,0,0,0,0,0,0,0,0)"
                            ret = sasql.query(sqltoken)
                        elseif mmindex == 2 then
                            sqltoken = "insert into `mmexp` values ('" .. char.getChar(talkerindex,"账号") .. "',0,0,0,1," .. other.time() + mmdata[addtype][2] * 3600 .. "," .. itemdata .. ",'" .. item.getChar(mmitemindex,"编码") .. "',1,0,0,0,0)"
                            ret = sasql.query(sqltoken)
                        end
                    end
                    char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - mmdata[addtype][1])
                    --日常任务 消耗活力
					other.CallFunction("OnDailyEvent", "data/ablua/npc/daily/daily.lua", {talkerindex, 10, mmdata[addtype][1]})
					--豆丁狩猎卷每日任务(消耗活力)
					other.CallFunction("updateDayTaskPlan", "data/ablua/npc/huodong1/15.lua", {talkerindex, 10, mmdata[addtype][1]})
                    char.DelItem(talkerindex, mmitemhaveid)
                    char.newMessageToCli(talkerindex, -1, "扣除" .. mmdata[addtype][1] .. "活力，提交成功", "白色")
                    showmmexp(talkerindex,2)
                end
			end
		end
	elseif type == "J" then
		local jtype = other.getString(data,"|",2)
		if jtype == "" then
			return
		end
		jtype = other.atoi(jtype)
		if jtype < 1 or jtype > #jiadata then
			return
        end
        local mmindex = other.getString(data,"|",3)
        if mmindex == "" then
            return
        end
        mmindex = other.atoi(mmindex)
		if mmindex < 1 or mmindex > 3 then
			return 
		end
		if jiatype[mmindex] == 1 then
			if sasql.getVipPoint(talkerindex) < jiadata[jtype][1] then
				char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
				return
			end
			mmtime[mmindex] = mmtime[mmindex] - jiadata[jtype][2] * 3600
			if mmtime[mmindex] < other.time() then
				mmtime[mmindex] = other.time()
			end
			sqltoken = "update `mmexp` set `time" .. mmindex .."`=" .. mmtime[mmindex] .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				-- sasql.setPetPoint(talkerindex,sasql.getPetPoint(talkerindex) - jiadata[jtype][1])
                -- char.newMessageToCli(talkerindex, -1, "扣除" .. jiadata[jtype][1] .. "水晶，加速成功", "白色")
                
                local myvippoint = sasql.getVipPoint(talkerindex)
                sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - jiadata[jtype][1])
                token = "insert into `vippointlog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -jiadata[jtype][1] .. "," .. myvippoint .. "," .. myvippoint - jiadata[jtype][1].. ",'解锁MM托管" .. jiadata[jtype][1] .. "金币',NOW())"
                sasql.query(token)
                char.newMessageToCli(talkerindex, -1, "扣除" .. jiadata[jtype][1].."金币，加速成功", "白色")
				showmmexp(talkerindex,2)
			end
		end
    elseif type == "Q" then
        local mmindex = other.getString(data,"|",2)
        if mmindex == "" then
            return
        end
        mmindex = other.atoi(mmindex)
		if mmindex < 1 or mmindex > 3 then
			return 
        end
		if qutype[mmindex] == 1 then
			if checkEmptItemNum(talkerindex) < 1 then
				char.newMessageToCli(talkerindex, -1, "您的道具栏空位不足", "白色")
				return
			end
            -- sqltoken = "delete from `mmexp` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
            sqltoken = "update `mmexp` set `time" .. mmindex .."` = 0,`hour" .. mmindex .."` = 0 ,`itemuid" .. mmindex .."` = '0' ,`lockState" .. mmindex .."` = 1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
            ret = sasql.query(sqltoken)
			if ret == 1 then
				local mmitemindex = char.Additem(talkerindex,mmitemid, debug.getinfo(1).source, debug.getinfo(1).currentline)
				if item.check(mmitemindex) == 1 then
					item.setChar(mmitemindex,"字段",mmhour[mmindex])
					local itemname = item.getChar(mmitemindex,"名称")
					if string.sub(itemname,1,1) == "*" then
						itemname = string.sub(itemname,2,-1)
                    end
					mmhour[mmindex] = math.floor(mmhour[mmindex] / 24 * 100)
					item.setChar(mmitemindex,"显示名",itemname .. "[" .. mmhour[mmindex] .. "%]")
					item.setChar(mmitemindex,"编码",mmitemuid[mmindex])
					item.UpdataItemOne(talkerindex, mmitemindex)
					char.newMessageToCli(talkerindex, -1, "取出成功", "白色")
					showmmexp(talkerindex,2)
				end
            end
        end
    elseif type == "K" then
        local locktype = other.getString(data,"|",2)
        if locktype == "" then
            return
        end
        locktype = other.atoi(locktype)
		if locktype < 1 or locktype > 3 then
			return 
		end
        if sasql.getVipPoint(talkerindex) < unlockCoin[locktype] then
            char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
            return
        end
        sqltoken = "select `lockState" .. locktype .."` from `mmexp` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
                sqltoken = "update `mmexp` set `lockState" .. locktype .."` =" .. 1 .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
                ret = sasql.query(sqltoken)
            else
                sqltoken = "insert into `mmexp` values ('" .. char.getChar(talkerindex,"账号") .. "',0,0,'0',1,0,0,'0',1,0,0,'0',0)"
                ret = sasql.query(sqltoken)
			end
			 local myvippoint = sasql.getVipPoint(talkerindex)
            sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - unlockCoin[locktype])
            token = "insert into `vippointlog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -unlockCoin[locktype] .. "," .. myvippoint .. "," .. myvippoint - unlockCoin[locktype].. ",'解锁MM托管" .. unlockCoin[locktype] .. "金币',NOW())"
            sasql.query(token)
            char.newMessageToCli(talkerindex, -1, "扣除金币" .. unlockCoin[locktype], "白色")
            showmmexp(talkerindex,2)
		end
	elseif type == "U" then
		local mmitemhaveid = other.getString(data,"|",2)
		if mmitemhaveid == "" then
			return
		end
		mmitemhaveid = other.atoi(mmitemhaveid)
		if mmitemhaveid < 9 or mmitemhaveid > 23 then
			return
		end
		local mmhaveid = other.getString(data,"|",3)
		if mmhaveid == "" then
			return
		end
		mmhaveid = other.atoi(mmhaveid)
		if mmhaveid < 1 or mmhaveid > 5 then
			return
		end
		local vital = other.getString(data,"|",4)
		local str = other.getString(data,"|",5)
		local vgh = other.getString(data,"|",6)
		local dex = other.getString(data,"|",7)
		if vital == "" or str == "" or vgh == "" or dex == "" then
			return
		end
		vital = other.atoi(vital)
		str = other.atoi(str)
		vgh = other.atoi(vgh)
		dex = other.atoi(dex)
		if vital < 0 or vital > 50 then
			return
		end
		if str < 0 or str > 50 then
			return
		end
		if vgh < 0 or vgh > 50 then
			return
		end
		if dex < 0 or dex > 50 then
			return
		end
		local mmitemindex = char.getItemIndex(talkerindex,mmitemhaveid)
		if item.check(mmitemindex) == 1 then
			if item.getChar(mmitemindex,"使用函数名") == "ITEM_NEWMMEXP" then
				local itemdata = item.getChar(mmitemindex,"字段")
				if itemdata == "" then
					return
				end
				itemdata = other.atoi(itemdata)
				if itemdata < 24 then
					char.newMessageToCli(talkerindex, -1, "您的MM玩偶没有满级哦", "白色")
					return
				end
			end
		end
		local petindex = char.getCharPet(talkerindex,mmhaveid - 1)
		if char.check(petindex) == 1 then
			local petid = char.getInt(petindex,"宠ID")
			if petid ~= 718 and petid ~= 401 then
				char.TalkToCli(talkerindex, -1, "[温馨提示]ＭＭ玩偶只能对不满79级的ＭＭ使用哦！", "随机色")
				return
			end
			if char.getInt(petindex,"等级") >= 79 then
				char.TalkToCli(talkerindex, -1, "[温馨提示]您的ＭＭ已经79级了哦，不需要使用玩偶升级了！", "随机色")
				return
			end
			local MAXVARIABLEAI = 100*100
			local MINVARIABLEAI = -100*100
			local LevelUpPoint = 0
			local iWork = 0
			while(char.getInt(petindex, "等级")<79) do
				LevelUpPoint = other.NumLeftToNum(vital,24) + other.NumLeftToNum(str,16) + other.NumLeftToNum(vgh,8) + other.NumLeftToNum(dex,0)
				char.setInt(petindex, "能力值", LevelUpPoint)
				char.PetLevelUp(petindex)
				iWork = char.getInt(petindex,"可变AI") + 500
				iWork = math.min(MAXVARIABLEAI,iWork)
				iWork = math.max(MINVARIABLEAI,iWork)
				char.setInt(petindex,"可变AI",iWork)
				char.setInt(petindex, "等级", char.getInt(petindex, "等级") + 1)
			end
			char.setInt(petindex,"可变AI",10000)
			char.complianceParameter(petindex)
			char.setInt( petindex, "HP", char.getWorkInt( petindex, "最大HP" ))
			j = -1
			for i=1,5 do
				if petindex == char.getCharPet(talkerindex,i - 1) then
					j = i
					break
				end
			end
			char.sendStatusString(talkerindex, "K" .. j - 1)
			char.DelItem(talkerindex, mmitemhaveid)
			char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜您的MM已经升到79级！", "随机色")
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	mmdata = {{80,8}
				,{160,16}
				,{240,24}
				}
				
	jiadata = {{400,4}
				,{800,8}
				,{1200,12}
				,{2400,24}
				}
				
				
    mmitemid = 22034--25048
	
	-- mmitemid = {25048,25049}
    unlockCoin = {0,3000,5000}
end


function main()
	data()
	Create("MM新升级丹", 101156, 777, 22, 23, 4)
	item.addLUAListFunction( "ITEM_NEWMMEXP", "newmmexp", "")
end