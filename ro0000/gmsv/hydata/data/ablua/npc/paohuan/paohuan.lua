function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function getPaoHuanData(talkerindex)
	--日期|环数|是否完成（0，未接，1，已接，2完成）|星级|本环刷新次数|任务类型
	local mypaohuanbuff = ""
	mypaohuanbuff = char.getChar(talkerindex,"跑环数据")
	if string.len(mypaohuanbuff) < 1 then
		local paohuandate = os.date("%Y%m%d",os.time())
		local paohuannum = 1
		local paohuanflg = 0
		local paohuanstar = 1
		local starrand = math.random(100)
		if starrand <= 60 then
			paohuanstar = 1
		elseif starrand <= 80 then
			paohuanstar = 2
		elseif starrand <= 92 then
			paohuanstar = 3
		elseif starrand <= 98 then
			paohuanstar = 4
		else
			paohuanstar = 5
		end
		local paohuanrefreshnum = 1
		local mypaohuandata = ""
		local npctype = math.random(#npcdata)
		local paotype = math.random(3)
		if npc.CheckEvent(talkerindex,612) == 0 then
			npctype = 40
			paotype = 2
		end
		mypaohuandata = paotype .. "," .. npctype
		if paotype == 1 then
			local temppao = math.random(#paohuandata[paotype])
			local temppaolv = math.random(paohuandata[paotype][temppao][2],paohuandata[paotype][temppao][3])
			mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][temppao][1] .. "," .. temppaolv
		elseif paotype == 2 then
			if npc.CheckEvent(talkerindex,612) == 0 then
				mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][59]
			else
				mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][math.random(#paohuandata[paotype])]
			end
		end
		mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. paohuanmaxnum[1] .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|0|0"
		char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
	else
		local paohuandate = other.getString(mypaohuanbuff,"|",1)
		local paohuannum = other.atoi(other.getString(mypaohuanbuff,"|",2))
		local mypaohuanmaxnum = other.atoi(other.getString(mypaohuanbuff,"|",3))
		local paohuanflg = other.atoi(other.getString(mypaohuanbuff,"|",4))
		local paohuanstar = other.atoi(other.getString(mypaohuanbuff,"|",5))
		local paohuanrefreshnum = other.atoi(other.getString(mypaohuanbuff,"|",6))
		local mypaohuandata = other.getString(mypaohuanbuff,"|",7)
		local paohuanmaxstar = other.getString(mypaohuanbuff,"|",8)
		local paohuanmaxstarjiang = other.getString(mypaohuanbuff,"|",9)
		if paohuanmaxstar == "" then
			paohuanmaxstar = 0
		else
			paohuanmaxstar = other.atoi(paohuanmaxstar)
		end
		if paohuanmaxstarjiang == "" then
			paohuanmaxstarjiang = 0
		else
			paohuanmaxstarjiang = other.atoi(paohuanmaxstarjiang)
		end
		if paohuandate ~= os.date("%Y%m%d",os.time()) then
			paohuandate = os.date("%Y%m%d",os.time())
			paohuannum = 1
			paohuanflg = 0
			paohuanstar = 1
			local starrand = math.random(100)
			if starrand <= 60 then
				paohuanstar = 1
			elseif starrand <= 80 then
				paohuanstar = 2
			elseif starrand <= 92 then
				paohuanstar = 3
			elseif starrand <= 98 then
				paohuanstar = 4
			else
				paohuanstar = 5
			end
			paohuanrefreshnum = 1
			mypaohuandata = ""
			local npctype = math.random(#npcdata)
			local paotype = math.random(3)
			if npc.CheckEvent(talkerindex,612) == 0 then
				npctype = 40
				paotype = 2
			end
			mypaohuandata = paotype .. "," .. npctype
			if paotype == 1 then
				local temppao = math.random(#paohuandata[paotype])
				local temppaolv = math.random(paohuandata[paotype][temppao][2],paohuandata[paotype][temppao][3])
				mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][temppao][1] .. "," .. temppaolv
			elseif paotype == 2 then
				if npc.CheckEvent(talkerindex,612) == 0 then
					mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][59]
				else
					mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][math.random(#paohuandata[paotype])]
				end
			end
			mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. paohuanmaxnum[1] .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|0|0"
			char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
		elseif paohuanflg == 2 and paohuannum < paohuanmaxnum[2] then
			paohuanflg = 0
			paohuannum = paohuannum + 1
			paohuanstar = 1
			local starrand = math.random(100)
			if starrand <= 60 then
				paohuanstar = 1
			elseif starrand <= 80 then
				paohuanstar = 2
			elseif starrand <= 92 then
				paohuanstar = 3
			elseif starrand <= 98 then
				paohuanstar = 4
			else
				paohuanstar = 5
			end
			paohuanrefreshnum = 1
			mypaohuandata = ""
			local npctype = math.random(#npcdata)
			local paotype = math.random(3)
			if npc.CheckEvent(talkerindex,612) == 0 then
				npctype = 40
				paotype = 2
			end
			mypaohuandata = mypaohuandata .. paotype .. "," .. npctype
			if paotype == 1 then
				local temppao = math.random(#paohuandata[paotype])
				local temppaolv = math.random(paohuandata[paotype][temppao][2],paohuandata[paotype][temppao][3])
				mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][temppao][1] .. "," .. temppaolv .. "," .. temppaolv
			elseif paotype == 2 then
				if npc.CheckEvent(talkerindex,612) == 0 then
					mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][59]
				else
					mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][math.random(#paohuandata[paotype])]
				end
			end
			mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|" .. paohuanmaxstar .. "|" .. paohuanmaxstarjiang
			char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
		end
	end
	return mypaohuanbuff
end

function getPaoHuanDataBuff(mypaohuandata,type)
	local paotype = other.atoi(other.getString(mypaohuandata,",",1))
	local npctype = other.atoi(other.getString(mypaohuandata,",",2))
	if npctype > #npcdata then
		return
	end
	local mypaohuandatabuff1 = map.getFloorName(npcdata[npctype][1]) .. "(" .. npcdata[npctype][2] .. "." .. npcdata[npctype][3] .. ")"
	local mypaohuandatabuff2 = "无"
	local mypaohuandatabuff3 = "无"
	if paotype == 1 then
		local temppao = other.atoi(other.getString(mypaohuandata,",",3))
		local temppaolv = other.atoi(other.getString(mypaohuandata,",",4))
		local arry = enemytemp.getEnemyTempArrayFromTempNo( temppao)
		local petname = enemytemp.getChar( arry, "名字")
		mypaohuandatabuff2 = petname .. " Lv：" .. temppaolv
	elseif paotype == 2 then
		local itemid = other.atoi(other.getString(mypaohuandata,",",3))	
		mypaohuandatabuff3 = item.getSecretNameFromNumber(itemid) 
	end
	if type == 1 then
		return mypaohuandatabuff1
	elseif type == 2 then
		return mypaohuandatabuff2
	elseif type == 3 then
		return mypaohuandatabuff3
	end
	return ""
end

function getPaoHuanDataJiang(paohuanstar)
	if paohuanstar < 1 or paohuanstar > 5 then
		return ""
	end
	return famelist[paohuanstar][1] .. "-" .. famelist[paohuanstar][2] .. "声望"
end

function ShowMyPaoHuan(meindex,talkerindex,mypaohuanbuff,flg)
	if string.len(mypaohuanbuff) < 1 then
		return
	end
	local paohuandate = other.getString(mypaohuanbuff,"|",1)
	local paohuannum = other.atoi(other.getString(mypaohuanbuff,"|",2))
	local mypaohuanmaxnum = other.atoi(other.getString(mypaohuanbuff,"|",3))
	local paohuanflg = other.atoi(other.getString(mypaohuanbuff,"|",4))
	local paohuanstar = other.atoi(other.getString(mypaohuanbuff,"|",5))
	local paohuanrefreshnum = other.atoi(other.getString(mypaohuanbuff,"|",6))
	local mypaohuandata = other.getString(mypaohuanbuff,"|",7)
	local goumai = 0
	if mypaohuanmaxnum < paohuanmaxnum[2] then
		goumai = 1
	end
	local paotype = other.atoi(other.getString(mypaohuandata,",",1))
	local npctype = other.atoi(other.getString(mypaohuandata,",",2))
	if npctype > #npcdata then
		return
	end
	local mypaohuandatabuff1 = map.getFloorName(npcdata[npctype][1]) .. "(" .. npcdata[npctype][2] .. "." .. npcdata[npctype][3] .. ")"
	local mypaohuandatabuff2 = "无"
	local mypaohuandatabuff3 = "无"
	if paotype == 1 then
		local temppao = other.atoi(other.getString(mypaohuandata,",",3))
		local temppaolv = other.atoi(other.getString(mypaohuandata,",",4))
		local arry = enemytemp.getEnemyTempArrayFromTempNo( temppao)
		local petname = enemytemp.getChar( arry, "名字")
		mypaohuandatabuff2 = petname .. " Lv：" .. temppaolv
	elseif paotype == 2 then
		local itemid = other.atoi(other.getString(mypaohuandata,",",3))	
		mypaohuandatabuff3 = item.getSecretNameFromNumber(itemid) 
	end
	local revippoint = 0
	for i=1,#repaohuan do
		if paohuanrefreshnum <= repaohuan[i][1] then
			revippoint = repaohuan[i][2]
			break
		end
	end
	token = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. goumai .. "|" .. paohuanstar .. "|" .. mypaohuandatabuff1 .. "|" .. mypaohuandatabuff2
			.. "|" .. mypaohuandatabuff3 .. "|" .. revippoint .. "|" .. buypaohua
	if flg == 0 then
		lssproto.windows(talkerindex, 1101, 0, 0, char.getWorkInt( meindex, "对象"), token)
	else
		lssproto.windowsupdate(talkerindex, 1101, 0, 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function ShowHead(talkerindex)
	local mypaohuanbuff = getPaoHuanData(talkerindex)
	ShowMyPaoHuan(npcindex,talkerindex,mypaohuanbuff,0)
	return 0
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToChara(talkerindex, meindex,1) == 1 then 
		ShowHead(talkerindex)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	if char.getInt(talkerindex,"转数") < 5 or char.getInt(talkerindex,"等级") < 141 then
		char.newMessageToCli(talkerindex, -1, "5转140级以下无法使用", "白色")
		return
	end
	local type = other.getString(data,"|",1)
	if type == "G" then
		local mypaohuanbuff = ""
		mypaohuanbuff = char.getChar(talkerindex,"跑环数据")
		if string.len(mypaohuanbuff) < 1 then
			return
		end
		local paohuandate = other.getString(mypaohuanbuff,"|",1)
		local paohuannum = other.atoi(other.getString(mypaohuanbuff,"|",2))
		local mypaohuanmaxnum = other.atoi(other.getString(mypaohuanbuff,"|",3))
		local paohuanflg = other.atoi(other.getString(mypaohuanbuff,"|",4))
		local paohuanstar = other.atoi(other.getString(mypaohuanbuff,"|",5))
		local paohuanrefreshnum = other.atoi(other.getString(mypaohuanbuff,"|",6))
		local mypaohuandata = other.getString(mypaohuanbuff,"|",7)
		local paohuanmaxstar = other.getString(mypaohuanbuff,"|",8)
		local paohuanmaxstarjiang = other.getString(mypaohuanbuff,"|",9)
		if paohuanmaxstar == "" then
			paohuanmaxstar = 0
		else
			paohuanmaxstar = other.atoi(paohuanmaxstar)
		end
		if paohuanmaxstarjiang == "" then
			paohuanmaxstarjiang = 0
		else
			paohuanmaxstarjiang = other.atoi(paohuanmaxstarjiang)
		end
		if paohuandate ~= os.date("%Y%m%d",os.time()) then
			return
		end
		if other.getString(data,"|",2) == "" then
			return
		end
		local index = other.atoi(other.getString(data,"|",2))
		if index == 1 then
			if paohuanflg ~= 0 then
				return
			end
			if paohuannum > mypaohuanmaxnum then
				return
			end
			if char.getInt(talkerindex,"活力") < 50 then
				char.newMessageToCli(talkerindex, -1, "活力不足50", "白色")
				lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
				return
			end
			paohuanflg = 1
			mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|" .. paohuanmaxstar .. "|" .. paohuanmaxstarjiang
			char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
			char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - 50)
			char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + 15 * 100)
			saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,15})
			char.newMessageToCli(talkerindex, -1, "成功领取跑环任务", "白色")
			char.newMessageToCli(talkerindex, -1, "扣除50活力", "白色")
			ShowMyPaoHuan(meindex,talkerindex,mypaohuanbuff,1)
			npc.EvClr(talkerindex,900)
			other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,900,1})
			local mypaohuandatabuff1 = getPaoHuanDataBuff(mypaohuandata,1)
			local mypaohuandatabuff2 = getPaoHuanDataBuff(mypaohuandata,2)
			local mypaohuandatabuff3 = getPaoHuanDataBuff(mypaohuandata,3)
			token = "900|2|[跑环任务]" .. paohuanstar .. "星跑环|前往:" .. mypaohuandatabuff1 .. ",需要宠物:" .. mypaohuandatabuff2 .. ",需要道具:" .. mypaohuandatabuff3 .. "|前往:" .. mypaohuandatabuff1 .. "|1|51522|" .. getPaoHuanDataJiang(paohuanstar)
			other.CallFunction("Tasksend","data/ablua/dispatchmessage.lua",{talkerindex,token})
		elseif index == 2 then
			if paohuanflg == 2 then
				return
			end
			if paohuannum > mypaohuanmaxnum then
				return
			end
			for i=1,#repaohuan do
				if paohuanrefreshnum <= repaohuan[i][1] then
					if sasql.getVipPoint(talkerindex) < repaohuan[i][2] then
						char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
						return
					end
					local myvippoint = sasql.getVipPoint(talkerindex)
					sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - repaohuan[i][2])
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,repaohuan[i][2]})
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,repaohuan[i][2]})
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -repaohuan[i][2] .. "," .. myvippoint .. "," .. myvippoint - repaohuan[i][2].. ",'刷新跑环扣除" .. repaohuan[i][2] .. "金币',NOW())"
					sasql.query(token)
					char.newMessageToCli(talkerindex, -1, "扣除金币" .. repaohuan[i][2], "白色")
					break
				end
			end
			if paohuanstar < 5 then
				local starrand = math.random(100)
				if starrand > 60 and starrand <= 80 then
					paohuanstar = paohuanstar + 1
				elseif starrand > 80 then
					paohuanstar = paohuanstar + 2
				end
			end
			if paohuanstar > 5 then
				paohuanstar = 5
			end
			paohuanrefreshnum = paohuanrefreshnum + 1
			local npctype = math.random(#npcdata)
			local paotype = math.random(3)
			mypaohuandata = paotype .. "," .. npctype
			if paotype == 1 then
				local temppao = math.random(#paohuandata[paotype])
				local temppaolv = math.random(paohuandata[paotype][temppao][2],paohuandata[paotype][temppao][3])
				mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][temppao][1] .. "," .. temppaolv .. "," .. temppaolv
			elseif paotype == 2 then
				mypaohuandata = mypaohuandata .. "," .. paohuandata[paotype][math.random(#paohuandata[paotype])]
			end
			mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|" .. paohuanmaxstar .. "|" .. paohuanmaxstarjiang
			char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
			char.newMessageToCli(talkerindex, -1, "刷新任务成功", "白色")
			ShowMyPaoHuan(meindex,talkerindex,mypaohuanbuff,1)
			if paohuanflg == 1 then
				local mypaohuandatabuff1 = getPaoHuanDataBuff(mypaohuandata,1)
				local mypaohuandatabuff2 = getPaoHuanDataBuff(mypaohuandata,2)
				local mypaohuandatabuff3 = getPaoHuanDataBuff(mypaohuandata,3)
				token = "900|2|[跑环任务]" .. paohuanstar .. "星跑环|前往:" .. mypaohuandatabuff1 .. ",需要宠物:" .. mypaohuandatabuff2 .. ",需要道具:" .. mypaohuandatabuff3 .. "|前往:" .. mypaohuandatabuff1 .. "|1|51522|" .. getPaoHuanDataJiang(paohuanstar)
				other.CallFunction("Tasksend","data/ablua/dispatchmessage.lua",{talkerindex,token})
			end
		elseif index == 3 then
			if mypaohuanmaxnum >= paohuanmaxnum[2] then
				return
			end
			if sasql.getVipPoint(talkerindex) < buypaohua then
				char.newMessageToCli(talkerindex, -1, "您的金币不足", "白色")
				return
			end
			local myvippoint = sasql.getVipPoint(talkerindex)
			sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - buypaohua)
			other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,buypaohua})
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,buypaohua})
			char.newMessageToCli(talkerindex, -1, "扣除金币" .. buypaohua, "白色")
			token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -buypaohua .. "," .. myvippoint .. "," .. myvippoint - buypaohua .. ",'购买跑环次数扣除" .. buypaohua .. "金币',NOW())"
			sasql.query(token)
			mypaohuanmaxnum = mypaohuanmaxnum + 1
			mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|" .. paohuanmaxstar .. "|" .. paohuanmaxstarjiang
			char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
			char.newMessageToCli(talkerindex, -1, "购买跑环次数成功", "白色")
			ShowMyPaoHuan(meindex,talkerindex,mypaohuanbuff,1)
		end
	end
end

function Talked2(meindex, talkerindex, szMes, color )
	if npc.isFaceToChara(talkerindex, meindex,1) == 1 then 
		if char.getWorkInt(meindex,"NPC临时1") < 1 or char.getWorkInt(meindex,"NPC临时1") > #npcdata then
			return
		end
		if char.getInt(meindex,"地图号") ~= npcdata[char.getWorkInt(meindex,"NPC临时1")][1] then
			char.WarpToSpecificPoint(meindex,npcdata[char.getWorkInt(meindex,"NPC临时1")][1],npcdata[char.getWorkInt(meindex,"NPC临时1")][2],npcdata[char.getWorkInt(meindex,"NPC临时1")][3])
		end
		local mypaohuanbuff = ""
		mypaohuanbuff = char.getChar(talkerindex,"跑环数据")
		if string.len(mypaohuanbuff) < 1 then
			char.newMessageToCli(talkerindex, -1, "您今天还没有领取跑环任务", "白色")
			return
		end
		local paohuandate = other.getString(mypaohuanbuff,"|",1)
		local paohuannum = other.atoi(other.getString(mypaohuanbuff,"|",2))
		local mypaohuanmaxnum = other.atoi(other.getString(mypaohuanbuff,"|",3))
		local paohuanflg = other.atoi(other.getString(mypaohuanbuff,"|",4))
		local paohuanstar = other.atoi(other.getString(mypaohuanbuff,"|",5))
		local paohuanrefreshnum = other.atoi(other.getString(mypaohuanbuff,"|",6))
		local mypaohuandata = other.getString(mypaohuanbuff,"|",7)
		local paohuanmaxstar = other.getString(mypaohuanbuff,"|",8)
		local paohuanmaxstarjiang = other.getString(mypaohuanbuff,"|",9)
		if paohuanmaxstar == "" then
			paohuanmaxstar = 0
		else
			paohuanmaxstar = other.atoi(paohuanmaxstar)
		end
		if paohuanmaxstarjiang == "" then
			paohuanmaxstarjiang = 0
		else
			paohuanmaxstarjiang = other.atoi(paohuanmaxstarjiang)
		end
		if paohuandate ~= os.date("%Y%m%d",os.time()) then
			char.newMessageToCli(talkerindex, -1, "您今天还没有领取跑环任务", "白色")
			return
		end
		if paohuanflg == 0 then
			char.newMessageToCli(talkerindex, -1, "您还没有领取跑环任务", "白色")
			return
		elseif paohuanflg == 2 then
			char.newMessageToCli(talkerindex, -1, "您当前跑环任务已完成", "白色")
			return
		end
		local paotype = other.atoi(other.getString(mypaohuandata,",",1))
		local npctype = other.atoi(other.getString(mypaohuandata,",",2))
		if npctype ~= char.getWorkInt(meindex,"NPC临时1") then
			char.newMessageToCli(talkerindex, -1, "你找错人了哦", "白色")
			return
		end
		if checkEmptItemNum(talkerindex) < 2 then
			char.newMessageToCli(talkerindex, -1, "道具栏请留两个以上空位", "白色")
			return
		end
		if paotype == 1 then
			local temppao = other.atoi(other.getString(mypaohuandata,",",3))
			local temppaolv = other.atoi(other.getString(mypaohuandata,",",4))
			for i=0,4 do
				local petindex = char.getCharPet(talkerindex,i)
				if char.check(petindex) == 1 then
					if char.getInt(petindex,"宠ID") == temppao and char.getInt(petindex,"等级") == temppaolv then
						char.newMessageToCli(talkerindex, -1, "交出" .. char.getChar(petindex,"名字"), "白色")
						char.DelPet(talkerindex,petindex)
						paohuanflg = 2
						paohuanmaxstar = paohuanmaxstar + paohuanstar
						if paohuanmaxstar >= 50 then
							if paohuanmaxstarjiang == 0 then
								char.Additem(talkerindex,28461)
								paohuanmaxstarjiang = 1
							else
								if paohuanstar >= 5 then
									if math.random(100) <= 10 then
										char.Additem(talkerindex,28461)
									end
								elseif paohuanstar >= 4 then
									if math.random(100) <= 5 then
										char.Additem(talkerindex,28461)
									end
								end
							end
						elseif paohuanmaxstar >= 35 then
							if paohuanstar >= 5 then
								if math.random(100) <= 10 then
									char.Additem(talkerindex,28461)
								end
							elseif paohuanstar >= 4 then
								if math.random(100) <= 5 then
									char.Additem(talkerindex,28461)
								end
							end
						end
						mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|" .. paohuanmaxstar .. "|" .. paohuanmaxstarjiang
						char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
						local jiangtmp = math.random(famelist[paohuanstar][1],famelist[paohuanstar][2])
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + jiangtmp * 100)
						char.newMessageToCli(talkerindex, -1, "获得" .. jiangtmp .. "声望", "白色")
						char.newMessageToCli(talkerindex, -1, "当前总星数:" .. paohuanmaxstar, "白色")
						other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,1,1})
						if paohuanstar >= 4 or paohuannum >= 10 then
							other.CallFunction("weixin","data/ablua/weixin.lua",{talkerindex,6,char.getChar(talkerindex,"名字")})
						end
						other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,900,0})
						return
					end
				end
			end
			char.newMessageToCli(talkerindex, -1, "您身上没有符合条件的宠物", "白色")
		elseif paotype == 2 then
			local itemid = other.atoi(other.getString(mypaohuandata,",",3))	
			for i=9,23 do
				local itemindex = char.getItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getInt(itemindex,"序号") == itemid then
						char.newMessageToCli(talkerindex, -1, "交出" .. item.getChar(itemindex,"显示名"), "白色")
						char.DelItem(talkerindex,i)
						paohuanflg = 2
						paohuanmaxstar = paohuanmaxstar + paohuanstar
						if paohuanmaxstar >= 50 then
							if paohuanmaxstarjiang == 0 then
								char.Additem(talkerindex,28461)
								paohuanmaxstarjiang = 1
							else
								if paohuanstar >= 5 then
									if math.random(100) <= 10 then
										char.Additem(talkerindex,28461)
									end
								elseif paohuanstar >= 4 then
									if math.random(100) <= 5 then
										char.Additem(talkerindex,28461)
									end
								end
							end
						elseif paohuanmaxstar >= 35 then
							if paohuanstar >= 5 then
								if math.random(100) <= 10 then
									char.Additem(talkerindex,28461)
								end
							elseif paohuanstar >= 4 then
								if math.random(100) <= 5 then
									char.Additem(talkerindex,28461)
								end
							end
						end
						mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|" .. paohuanmaxstar .. "|" .. paohuanmaxstarjiang
						char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
						local jiangtmp = math.random(famelist[paohuanstar][1],famelist[paohuanstar][2])
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + jiangtmp * 100)
						char.newMessageToCli(talkerindex, -1, "获得" .. jiangtmp .. "声望", "白色")
						char.newMessageToCli(talkerindex, -1, "当前总星数:" .. paohuanmaxstar, "白色")
						other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,1,1})
						if paohuanstar >= 4 or paohuannum >= 10 then
							other.CallFunction("weixin","data/ablua/weixin.lua",{talkerindex,6,char.getChar(talkerindex,"名字")})
						end
						other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,900,0})
						return
					end
				end
			end
			char.newMessageToCli(talkerindex, -1, "您身上没有符合条件的道具", "白色")
		elseif paotype == 3 then
			paohuanflg = 2
			paohuanmaxstar = paohuanmaxstar + paohuanstar
			if paohuanmaxstar >= 50 then
				if paohuanmaxstarjiang == 0 then
					char.Additem(talkerindex,28461)
					paohuanmaxstarjiang = 1
				else
					if paohuanstar >= 5 then
						if math.random(100) <= 10 then
							char.Additem(talkerindex,28461)
						end
					elseif paohuanstar >= 4 then
						if math.random(100) <= 5 then
							char.Additem(talkerindex,28461)
						end
					end
				end
			elseif paohuanmaxstar >= 35 then
				if paohuanstar >= 5 then
					if math.random(100) <= 10 then
						char.Additem(talkerindex,28461)
					end
				elseif paohuanstar >= 4 then
					if math.random(100) <= 5 then
						char.Additem(talkerindex,28461)
					end
				end
			end
			mypaohuanbuff = paohuandate .. "|" .. paohuannum .. "|" .. mypaohuanmaxnum .. "|" .. paohuanflg .. "|" .. paohuanstar .. "|" .. paohuanrefreshnum .. "|" .. mypaohuandata .. "|" .. paohuanmaxstar .. "|" .. paohuanmaxstarjiang
			char.setChar(talkerindex,"跑环数据",mypaohuanbuff)
			local jiangtmp = math.random(famelist[paohuanstar][1],famelist[paohuanstar][2])
			char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + jiangtmp * 100)
			char.newMessageToCli(talkerindex, -1, "获得" .. jiangtmp .. "声望", "白色")
			char.newMessageToCli(talkerindex, -1, "当前总星数:" .. paohuanmaxstar, "白色")
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,1,1})
			if paohuanstar >= 4 or paohuannum >= 10 then
				other.CallFunction("weixin","data/ablua/weixin.lua",{talkerindex,6,char.getChar(talkerindex,"名字")})
			end
			other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,900,0})
		end
	end
end

function WindowTalked2 ( meindex, talkerindex, seqno, select, data)
	
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function Create2(name, metamo, floor, x, y, dir,flg)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local npcindextemp = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindextemp, "对话事件", "Talked2", "")

	--char.setFunctionPointer(npcindextemp, "窗口事件", "WindowTalked2", "")
	
	char.setWorkInt(npcindextemp,"NPC临时1",flg)
end

function data()
	paohuanmaxnum = {10,15}
	repaohuan = {{2,200},{4,300},{6,400},{99999999,500}}
	buypaohua = 500
	--跑环数据：日期|环数|任务类型（类型,NPC编号,需要材料）|是否完成
	--日期|环数|总环数|是否完成（0，未接，1，已接，2完成）|星级|本环刷新次数|任务类型
	paohuandata = {{{1,64,66},{91,61,63},{141,40,44},{14,53,53},{182,12,18},{181,12,18},{293,27,32},{92,25,28},{2,27,32},{193,111,115},{193,98,104},{92,93,96},{223,19,25},{34,23,27},{72,15,18},{63,20,25},{65,54,60},{41,20,27},{42,24,28},{293,25,29},{91,50,54},{181,53,58},{88,86,90},{33,4,10},{172,12,18},{2,20,30},{91,10,15},{43,13,19},{81,10,15},{82,12,17},{94,93,97},{191,56,59},{111,57,59},{21,60,65},{61,57,62},{193,58,64},{212,55,60},{181,60,62},{31,54,58},{24,56,62},{51,57,62},{114,60,65},{192,65,70},{293,10,15},{94,1,1},{141,1,1}} --宠物
					,{12505,12505,12902,12902,12912,12907,12662,12662,12742,12703,12682,12664,12799,12704,12719,12796,12719,12919,12525,12715,12560,12591,12872,12779,12746,12750,12864,12703,12811,12573,12686,12670,12577,12572,12879,12688,12546,12808,12657,12761,12627,12623,12729,12735,12736,12617,12739,12860,12735,1213,1360,1363,50,320,230,842,1020,1111,2347,1202,1250,1257,1264,1200,1251,1258,1265,1203,1253,1260,1267,18546,764,1211,1368,1254,11977,11967,11897,11896,12007,12153,12165,12161,12181,12189,12141,12213,12097,11879,11878,1210,1210,1372,11977,1025,780,12005,1144,11935,1041}} --道具
	
	npcmetamo = {41263,41264,41265,41267,41269,41274,41276,41278,41279,41280,41281,41282,41283,41284,41285,41286,41287,41288,41289,41290,41296,41297,41298,41299,41300,41301,41302,41303,41304,41305,41306,41307,41308,41309,41310,41311,41312,41313,41315,41316,41317,41318,41319,41320,41321,41322,41323,41324,41325,41326,41327,41328,41329,41330,41331,41344,41345,41346,41347,41348,41349,41350,41351,41352,41353,41354,41355,41356,41357,41360,41361,60101,60103,60105,60112,60114,60116,60118,60120,60122,60124,60127,60131,60133,60135,60139,60141,60167,60169,60171,60175,60180,60184,60186,60188,60190,60192,60194,60204,60206,60208,60210}
	npcdata = {{1200,59,41}
				,{1200,43,66}
				,{100,638,400}
				,{100,646,351}
				,{100,627,282}
				,{100,600,132}
				,{100,470,134}
				,{100,352,165}
				,{100,308,34}
				,{100,86,487}
				,{100,178,443}
				,{100,165,356}
				,{100,273,451}
				,{100,327,526}
				,{100,292,609}
				,{100,149,622}
				,{100,304,454}
				,{100,369,431}
				,{100,394,510}
				,{100,424,543}
				,{100,382,654}
				,{100,574,607}
				,{100,646,638}
				,{100,660,673}
				,{200,634,385}
				,{200,638,440}
				,{200,420,179}		
				,{200,603,504}
				,{200,654,479}
				,{200,625,389}
				,{200,287,498}
				,{5003,25,15}
				,{1000,122,87}
				,{1009,20,41}
				,{1000,121,70}
				,{1000,63,44}
				,{130,37,20}
				,{1004,14,14}
				,{1001,15,14}
				,{3006,23,15}
				,{3001,16,17}
				,{3002,15,17}
				,{4001,16,15}
				,{4003,16,15}
				,{4005,17,9}
				,{4002,16,15}
				,{4006,16,22}
				,{4000,54,103}
				,{4009,20,45}
				,{3404,16,15}
				,{3409,13,12}
				,{3403,16,12}
				,{5105,18,9}
				,{5100,37,29}
				,{3105,16,16}
				,{3104,16,14}
				,{3109,18,14}
				,{3110,13,14}
				,{3100,70,30}
				,{1106,25,13}
				,{1104,18,15}
				,{1112,17,16}
				,{1103,17,15}
				,{1101,16,14}
				,{1100,43,31}
				,{1404,14,15}
				,{1406,20,21}
				,{1405,24,15}
				,{3305,16,16}
				,{3306,13,15}
				,{3309,18,13}
				,{100,551,618}
				,{1303,16,15}
				,{1301,17,15}
				,{1304,16,12}
				,{1300,43,77}
				,{1306,19,13}
				,{3209,20,14}
				,{3203,15,16}
				,{3206,15,21}
				,{3204,16,14}
				,{3200,77,49}		
				,{200,318,377}
				,{200,366,304}
				,{200,269,269}
				,{200,351,521}
				,{200,411,601}	
				,{200,496,787}
				,{200,312,913}
				,{200,195,862}
				,{200,104,861}
				,{3100,61,36}
				,{200,529,269}
				,{200,635,252}
				,{300,186,230}	
				,{300,158,148}
				,{300,172,84}
				,{300,220,65}
				,{300,160,324}				
				,{300,143,341}		
				,{300,364,347}
				,{300,445,323}
				,{300,424,244}
				,{300,252,62}
				,{300,135,42}
				,{300,162,294}
				,{300,83,238}
				,{300,478,499}
				,{400,27,69}
				,{400,130,106}
				,{400,63,19}
				,{400,113,48}
				,{5543,43,17}    -- 奇努伊村 飞过来的 米兰达飞机场
				,{5540,450,674} -- 奇努伊村 飞过来的 波拉岛
				,{5540,333,633} -- 奇努伊村 飞过来的 波拉岛
				,{5541,30,16}  -- 波拉岛 450.391 进入 泰坦洞穴
				,{31101,39,7} -- 吉鲁岛 448.405 进入 美鲁娜的洞窟
				,{31101,38,34} -- 吉鲁岛 448.405 进入 美鲁娜的洞窟
				,{11001,24,37} -- 萨伊纳斯 328.633 进入 科奥山的小洞穴
				,{10201,19,9} -- 柯奥村 95.62 进入 海底通路地下1楼
				,{201,11,28}  -- 加鲁卡 328.660 进入 卡鲁它那牧场事务所
				,{20901,18,14} -- 加鲁卡 336.653 进入 卡鲁它那的洞穴1楼
				,{20301,41,33} -- 加鲁卡 420.577 进入 拉布拉多回廊
				,{20301,68,109} -- 加鲁卡 420.577 进入 拉布拉多回廊
				,{20301,250,34} -- 加鲁卡 420.577 进入 拉布拉多回廊
				,{20301,115,15} -- 加鲁卡 420.577 进入 拉布拉多回廊
				,{10701,52,11} -- 萨伊纳斯 132.421 进入盗贼洞穴
				,{10702,32,39} -- 萨伊纳斯 132.421 进入盗贼洞穴
				,{10703,56,24} -- 萨伊纳斯 132.421 进入盗贼洞穴
				,{10704,39,43} -- 萨伊纳斯 132.421 进入盗贼洞穴
				,{101,14,17}   -- 萨伊纳斯 184.339 阿布的独栋房屋
				,{10002,21,12} -- 萨伊纳斯 191.365 进入阿布洞穴
				,{10004,17,16} -- 萨伊纳斯 191.365 进入阿布洞穴
				,{10006,35,8} -- 萨伊纳斯 191.365 进入阿布洞穴
				,{10007,29,34} -- 萨伊纳斯 191.365 进入阿布洞穴
				,{32008,50,14} -- 吉鲁岛 102.228 进入 漆黑洞穴
				,{32005,50,8} -- 吉鲁岛 102.228 进入 漆黑洞穴
				,{31705,35,15} -- 吉鲁岛 342.191 进入 五兄弟的山寨洞穴
				,{21008,15,21} -- 加鲁卡 359.672 进入 琉璃洞穴
				,{21004,49,41} -- 加鲁卡 359.672 进入 琉璃洞穴
				,{200,53,686}
				,{200,78,1150}
				,{200,113,862}
				,{200,340,822}
				,{21208,37,33} -- 加鲁卡 73.697 进入碧青洞穴
				,{11207,50,47} -- 萨伊纳斯 278.326 进入玄黄洞穴
				,{10101,14,13}  -- 五十年前波拉岛 599.469 进入水坝南方洞穴 再进入水坝洞窟底层 
				,{1200,91,112}  -- 五十年前波拉岛 599.469 进入水坝南方洞穴
				,{30011,52,17} -- 深红洞窟买羽毛进入
				,{30008,77,49} -- 深红洞窟买羽毛进入
				,{20801,12,10} -- 加鲁卡 433.743 进入龙的洞穴
				,{20803,11,40} -- 加鲁卡 433.743 进入龙的洞穴
				,{20401,29,22} -- 加鲁卡 98.426 进入 哥亚山洞穴1楼
				,{20405,38,36} -- 加鲁卡 98.426 进入 哥亚山洞穴1楼
				,{31202,8,22}  -- 吉鲁岛 444.494 进入 没落的矿坑
				,{30600,17,14}  -- 吉鲁岛 267.294 进入 库依爷的家
				,{10601,28,15} -- 萨伊纳斯 411.339 进入 东柯尔克的坑道
				,{10603,17,17} -- 萨伊纳斯 411.339 进入 东柯尔克的坑道
				,{100,765,468}
				,{100,595,407}
				,{100,542,201}
				,{1000,105,32}
				,{30205,13,24} -- 吉鲁岛 272 134 进入 被北吉鲁的通路地下1层
				,{30203,72,49} -- 吉鲁岛 272 134 进入 被北吉鲁的通路地下1层
				,{31902,6,4}   -- 吉鲁岛 238.98 进入 吉鲁采石场
				,{31908,32,28} -- 吉鲁岛 238.98 进入 吉鲁采石场
				,{31909,7,12}  -- 吉鲁岛 238.98 进入 吉鲁采石场
				,{3209,18,26}
				,{3009,19,47}
				,{110,22,26}
				,{116,6,19}  --  聊天室 36.4 进入 长毛象大厅 
						}
				
	famelist = {{3,5}
				,{5,8}
				,{8,10}
				,{10,15}
				,{15,20}}

end

function main()
	data()
	Create("跑环接待", 41142, 2005, 18, 16, 6)
	for i=1,#npcdata do
		Create2("跑环使者",npcmetamo[math.random(#npcmetamo)],npcdata[i][1],npcdata[i][2],npcdata[i][3],6,i)
	end
end