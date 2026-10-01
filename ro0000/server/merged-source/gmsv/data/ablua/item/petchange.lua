function getPetPoint(meindex,point,type)
	local nowdate = tonumber(os.date("%y%m%d%H%M",os.time()))
	if nowdate >= zhedate[1] and nowdate <= zhedate[2] and (type == 1 or type == 2) then
		point = math.ceil(point * 0.9)
	end
	local hlCount = char.getInt(meindex,"极品")
	if type ~= 2 then
		if hlCount > 250 then
			return math.ceil(point * 0.75)
		elseif hlCount > 150 then
			return math.ceil(point * 0.8)
		elseif hlCount > 100 then
			return math.ceil(point * 0.85)
		elseif hlCount > 50 then
			return math.ceil(point * 0.9)
		elseif hlCount > 20 then
			return math.ceil(point * 0.95)
		end
	end
	return point
end

function getdata(charaindex,data)
	local opType = other.getString(data,"|",1)	
	if opType=='O' then
		local opIndex = tonumber(other.getString(data,"|",2))
		local petindex = char.getCharPet(charaindex, opIndex)
		char.setWorkInt(charaindex, "NPC临时1", opIndex)
		char.setWorkInt(charaindex, "NPC临时2",char.getInt(char.getCharPet(charaindex,opIndex),"宠ID"))
		local petcost1,petcost2 = getpetcost(charaindex,petindex,1)	
		local petcost11,petcost22 = getpetcost(charaindex,petindex,10)

		local ret=petcost2.."|"..petcost22
		ret=ret.."|"..petcost1.."|"..petcost11
		ret=ret.."|"..char.getInt(petindex,"极品")		
		lssproto.NewSaMenu(char.getFd(charaindex),24,ret)	
	elseif opType=='R' then--
		local opIndex = tonumber(other.getString(data,"|",2))
		local opTimes=tonumber(other.getString(data,"|",3))--回炉次数
		local payType = tonumber(other.getString(data,"|",5))--支付方式
		local ret = performatReset(charaindex,opIndex,payType-1,opTimes)
		if ret ~= false and ret ~=nil then
			lssproto.NewSaMenu(char.getFd(charaindex),24,ret)
		end
	end
	
	--lssproto.windows(charaindex, 3, 8, 9, char.getWorkInt( npcindex, "对象"), "请选择宠物");
end

function getPetBuff(meindex,point)
	if char.getInt(meindex,"极品") > 250 then
		return "当前回炉次数>250 金币水晶可享7.5折！"
	elseif char.getInt(meindex,"极品") > 150 then
		return "当前回炉次数>150 金币水晶可享8折！"
	elseif char.getInt(meindex,"极品") > 100 then
		return "当前回炉次数>100 金币水晶可享8.5折！"
	elseif char.getInt(meindex,"极品") > 50 then
		return "当前回炉次数>50 金币水晶可享9折！"
	elseif char.getInt(meindex,"极品") > 20 then
		return "当前回炉次数>20 金币水晶可享9.5折！"
	end
	return "   确认请按[确定]        退出请按[取消]"
end

function get4VString(petindex)
	local TM_Ts = char.getInt(petindex, "转数")
	local TM_Lv = char.getInt(petindex, "等级")
	local TM_Vi = char.getInt(petindex, "体力")
	local TM_St = char.getInt(petindex, "腕力")
	local TM_To = char.getInt(petindex, "耐力")
	local TM_Dx = char.getInt(petindex, "速度")
	local TM_PetHP = math.floor((TM_Vi*4 + TM_St + TM_To + TM_Dx) * 0.01);
	local TM_PetStr = math.floor(TM_St*0.01 + TM_To*0.01*0.1 + TM_Vi*0.01*0.1 + TM_Dx*0.01*0.05);
	local TM_PetTough = math.floor(TM_To*0.01 + TM_St*0.01*0.1 + TM_Vi*0.01*0.1 + TM_Dx*0.01*0.05);
	local TM_PetDex = math.floor(TM_Dx*0.01);
	local ret = string.format("%d|%d|%d|%d|%d|%d",TM_Ts,TM_Lv,TM_PetHP,TM_PetStr,TM_PetTough,TM_PetDex)
	return ret
end

function InsertBackTimeLog(charaindex,petindex,old4v,new4v,cost)
	token = "INSERT INTO `backtime` ("
									.. "`cdkey` ,"
									.. "`name` ,"
									.. "`time` ,"
									.. "`petid` ,"
									.. "`petname` ,"
									.. "`old4v` , "
									.. "`new4v` ,"
									.. "`cost` "
									.. ")"
									.. "VALUES ("
									.. "'"
									.. char.getChar(charaindex, "账号")  .. "', '"
									.. char.getChar(charaindex, "名字") .. "', "
									.. "NOW(), '"
									.. char.getInt(petindex, "宠ID") .. "', '"
									.. char.getChar(petindex, "名字") .. "', '"
									.. old4v .. "', '"
									.. new4v .. "', '"
									.. cost .. "');"
--	print(token)
	ret = sasql.query(token)
end

--[[function Loop(meindex)
	if char.getInt(meindex, "原图像号") == char.getInt(meindex, "图像号") then
		char.setInt(meindex, "图像号", 101147)
		char.ToAroundChar(meindex)
		char.setInt(meindex, "循环事件时间", 500)
	else
		char.setInt(meindex, "图像号", char.getInt(meindex, "原图像号"))
		char.ToAroundChar(meindex)
		char.setInt(meindex, "循环事件时间", 0)
		char.setWorkInt(meindex, "捡起模式", 1)
		char.delFunctionPointer(meindex, "循环事件")
		char.TalkToRound(meindex, "亲爱的主人，我已经得到重生了，捡回我吧！", "随机色")
	end
end]]

function petchange(charaindex, toindex)
	if char.getInt(charaindex,"安全锁") > 0 then
		if char.getInt(charaindex,"安全锁") == 1 then
			token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
		elseif char.getInt(charaindex,"安全锁") == 2 then
			token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		else
			token = "由于您的密码过于简单，并且异地登录。\n例如：密码非常简单或者全包含于账号。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		end
		lssproto.windows(charaindex, "输入框", "确定|取消", "安全锁", -1, token)
		return
	end
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(charaindex, "骑宠") == i then
				char.TalkToCli(charaindex, -1, "骑乘中的宠物无法回炉!", "随机色")
				return
			end
			if char.getInt(toindex, "守护兽") == 1 then
				char.TalkToCli(charaindex, -1, "家族守护兽无法回炉!", "随机色")
				return
			end
			if char.getInt(toindex, "安全锁") > 0 then
				char.TalkToCli(charaindex, -1, "绑定的宠物无法回炉!", "随机色")
				return
			end
			local array = char.getInt(toindex, "宠ID")
			for j,v in ipairs(petchangelist) do				
				if v[1] == array then
					local value = math.floor(char.getWorkInt(toindex, "最大HP") / 4 + char.getWorkInt(toindex, "攻击") + char.getWorkInt(toindex, "防御") + char.getWorkInt(toindex, "敏捷"))
					local huilucnt = char.getInt(toindex,"极品")
					if huilucnt >= 300 then
						huilucnt = "300+"
					end
					token = "　　　　  「 石器时代自助回炉系统 」\n您想回炉这只["..char.getChar(toindex, "名字").."][评分：" .. value .. "]"
					local mypetpoint = sasql.getPetPoint(charaindex)
					if mypetpoint > 0 then
						if mypetpoint - getPetPoint(toindex,v[2],0) >= 0 then
							token = token .. "\n回炉这只宠物需消耗水晶[" .. getPetPoint(toindex,v[2],0) .. "]"
						else
							token = token .. "\n回炉这只宠物需消耗水晶[" .. mypetpoint .. "],金币[" .. getPetPoint(toindex,getPetPoint(toindex,v[2],0) - mypetpoint,2) .. "]"
						end
					else
						token = token .. "\n回炉这只宠物需消耗金币[" .. getPetPoint(toindex,v[2],1) .. "]"
					end
					if #v[3] > 0 then
						token = token .. "\n需要道具" .. item.getSecretNameFromNumber(v[3][1]) .. "*" .. v[3][2]
					end
					token = token .. "\n回炉次数：" .. huilucnt .. "\n回炉有风险 回炉后并不一定比原先更好\n请特别注意 回炉次数交易摆摊后会清空\n" .. getPetBuff(toindex,v[2])
					lssproto.windows(charaindex, "对话框", 12, i, char.getWorkInt( npcindex, "对象"), token)
					return
				end
			end
			char.TalkToCli(charaindex, -1, "您的["..char.getChar(toindex, "名字").."]不能进行回炉，请爱护它哦！", "随机色")
			return
		end
	end
end

--获取指定宠物的回炉费用
function getpetcost(charaindex,toindex,count)
	local array = char.getInt(toindex, "宠ID")
	if not count then
		count=1
	end
	for j,v in ipairs(petchangelist) do
		--print("[getpetcost]",v[1],array)
		if v[1] == array then
			print("[getpetcost]",v[1],array,v[2])
			-- local mypetpoint = sasql.getPetPoint(charaindex)
			-- local toCost = getPetPoint(toindex,v[2],0) * count
			-- if mypetpoint > 0 then
			-- 	if mypetpoint - toCost >= 0 then
			-- 		return toCost,0
			-- 	else
			-- 		return mypetpoint,getPetPoint(toindex,toCost - mypetpoint,2)
			-- 	end
			-- end
			-- return getPetPoint(toindex,v[2],1) * count
			--原价返回
			return v[2],v[2]
		end
	end	
	return 0,0
end

function petchangenum(charaindex, toindex)
	if char.getInt(charaindex,"安全锁") > 0 then
		if char.getInt(charaindex,"安全锁") == 1 then
			token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
		elseif char.getInt(charaindex,"安全锁") == 2 then
			token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		else
			token = "由于您的密码过于简单，并且异地登录。\n例如：密码非常简单或者全包含于账号。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		end
		lssproto.windows(charaindex, "输入框", "确定|取消", "安全锁", -1, token)
		return
	end
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(charaindex, "骑宠") == i then
				char.TalkToCli(charaindex, -1, "骑乘中的宠物无法回炉!", "随机色")
				return
			end
			if char.getInt(toindex, "守护兽") == 1 then
				char.TalkToCli(charaindex, -1, "家族守护兽无法回炉!", "随机色")
				return
			end
			if char.getInt(toindex, "安全锁") > 0 then
				char.TalkToCli(charaindex, -1, "绑定的宠物无法回炉!", "随机色")
				return
			end
			local array = char.getInt(toindex, "宠ID")
			for j,v in ipairs(petchangelist) do
				if v[1] == array then
					local value = math.floor(char.getWorkInt(toindex, "最大HP") / 4 + char.getWorkInt(toindex, "攻击") + char.getWorkInt(toindex, "防御") + char.getWorkInt(toindex, "敏捷"))
					local huilucnt = char.getInt(toindex,"极品")
					if huilucnt >= 300 then
						huilucnt = "300+"
					end
					token = "　　　　  「 石器时代自助回炉系统 」\n您想回炉[style c=6]10[/style]次["..char.getChar(toindex, "名字").."][评分：" .. value .. "]"
					local mypetpoint = sasql.getPetPoint(charaindex)
					if mypetpoint > 0 then
						if mypetpoint - getPetPoint(toindex,v[2],0) * 10 >= 0 then
							token = token .. "\n回炉10次宠物需消耗水晶[" .. getPetPoint(toindex,v[2],0) * 10 .. "]"
						else
							token = token .. "\n回炉10次宠物需消耗水晶[" .. mypetpoint .. "],金币[" .. getPetPoint(toindex,getPetPoint(toindex,v[2],0) * 10 - mypetpoint,2) .. "]"
						end
					else
						token = token .. "\n回炉10次宠物需消耗金币[" .. getPetPoint(toindex,v[2],1) * 10 .. "]"
					end
					token = token .. "\n回炉次数：" .. huilucnt .. "\n回炉有风险 回炉后并不一定比原先更好\n请特别注意 回炉次数交易摆摊后会清空\n" .. getPetBuff(toindex,v[2])
					lssproto.windows(charaindex, "对话框", 12, i, char.getWorkInt( npcindexnum, "对象"), token)
					return
				end
			end
			char.TalkToCli(charaindex, -1, "您的["..char.getChar(toindex, "名字").."]不能进行回炉，请爱护它哦！", "随机色")
			return
		end
	end
end

function performatReset(talkerindex,petId,payType, nResetNum)
	local ranktbl = {
		{ 100, 2.5},
    	{ 95, 2.0},
    	{ 90, 1.5},
    	{ 85, 1.0},
    	{ 80, 0.5},
    	{ 0, 0.0}
	}
	nResetNum=nResetNum or 1--默认1次
	local petindex = char.getCharPet(talkerindex, petId)
	if char.getInt(talkerindex, "骑宠") == petId then
		char.newMessageToCli(talkerindex, -1, "骑乘中的宠物无法回炉，请下骑后再试。", "白色")
		return false
	end
	if char.getInt(petindex, "守护兽") == 1 then
		char.newMessageToCli(talkerindex, -1, "家族守护兽无法回炉!", "白色")
		return false
	end
	local array = char.getInt(petindex, "宠ID")
	local mypetpoint = sasql.getPetPoint(talkerindex)
	local myvippoint = sasql.getVipPoint(talkerindex)
	local costPetPt=0
	local costVipPt=0	
    for j,v in ipairs(petchangelist) do
        if v[1] == array then
			
			--检查是否钱够
			if payType==1 then--水晶		
				costPetPt = getPetPoint(petindex,v[2],0) * nResetNum
				if mypetpoint < costPetPt then
					char.newMessageToCli(talkerindex, -1, "您的水晶不足[" .. getPetPoint(petindex,v[2],0) * 10 .."]，无法回炉["..char.getChar(petindex,"名字").."]，再接再厉哦！", "白色")
					return false
				end
			elseif payType==0 then--金币
				costVipPt = getPetPoint(petindex,v[2],1) * nResetNum
				if myvippoint < costVipPt then
					char.newMessageToCli(talkerindex, -1, "您的金币不足[" .. getPetPoint(petindex,v[2],1) * 10 .."]，无法回炉["..char.getChar(petindex,"名字").."]，再接再厉哦！", "白色")
					return false
				end
			else
				costTotal=getPetPoint(petindex,v[2],1) * nResetNum
				local needVipPt=mypetpoint-costTotal
				costPetPt = getPetPoint(petindex,v[2],0) * nResetNum
				if (mypetpoint < costPetPt) then 
					costVipPt = getPetPoint(petindex,needVipPt,2)
				else
					costVipPt=0
				end		
				if myvippoint < (costVipPt) then
					char.newMessageToCli(talkerindex, -1, "您的金币+水晶不足[" .. getPetPoint(petindex,v[2],1) * 10 .."]，无法回炉["..char.getChar(petindex,"名字").."]，再接再厉哦！", "白色")
					return false
				end
			end

			local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
			if tempno > -1 then
				if #v[3] > 0 then
					if npc.Free(-1, talkerindex, "ITEM=" .. v[3][1] .. "*" .. v[3][2] * 10) ~= 1 then
						char.newMessageToCli(talkerindex, -1, "您没有" .. item.getSecretNameFromNumber(v[3][1]) .. "*" .. v[3][2] * 10 .. "，无法回炉["..char.getChar(petindex,"名字").."]，再接再厉哦！", "白色")
						return false
					end
				end
				local old4v = get4VString(petindex)
				if char.getInt(petindex, "进化") == 9 then
					char.setInt(petindex, "地", enemytemp.getInt(tempno, "地"))
					char.setInt(petindex, "水", enemytemp.getInt(tempno, "水"))
					char.setInt(petindex, "火", enemytemp.getInt(tempno, "火"))
					char.setInt(petindex, "风", enemytemp.getInt(tempno, "风"))
					char.setInt(petindex, "进化",0)
				end
				local totalnum = {0,0,0,0,0,0,0,0,0,0}
				local haonum = 0
				local vital = 0
				local str = 0
				local tgh = 0
				local dex = 0
				local nengli = 0
				local myrank = 0
				local initnum = enemytemp.getInt(tempno, "初始值")
				--初始化数据
				local petUnicode=char.getChar(petindex,"唯一编号")
				petchangedata[petUnicode] = {}
				for i=1,nResetNum do
					local vitaltemp = enemytemp.getInt(tempno, "体力")
					local strtemp = enemytemp.getInt(tempno, "腕力")
					local tghtemp = enemytemp.getInt(tempno, "耐力")
					local dextemp = enemytemp.getInt(tempno, "速度")
					if char.getInt(petindex,"极品") > 500 then
						vitaltemp = vitaltemp + other.Random(1, 2)
						strtemp = strtemp + other.Random(1, 2)
						tghtemp = tghtemp + other.Random(1, 2)
						dextemp = dextemp + other.Random(1, 2)
					else
						vitaltemp = vitaltemp + other.Random(0, 2)
						strtemp = strtemp + other.Random(0, 2)
						tghtemp = tghtemp + other.Random(0, 2)
						dextemp = dextemp + other.Random(0, 2)
					end
					local nenglitmp = 0
					local myranktmp = 0
					if other.Random(1,4) == 1 then 
						vitaltemp = vitaltemp - 1
					end
					if other.Random(1,4) == 1 then 
						strtemp = strtemp - 1
					end
					if other.Random(1,4) == 1 then 
						tghtemp = tghtemp - 1
					end
					if other.Random(1,4) == 1 then 
						dextemp = dextemp - 1
					end
					
					ability = {0, 0, 0, 0}
								
					for j=1, 10 do
						rnd = math.random(1,4)
						ability[rnd] = ability[rnd] + 1
					end
					local workrank = enemytemp.getInt(tempno, "体力") + enemytemp.getInt(tempno, "腕力") + enemytemp.getInt(tempno, "耐力") + enemytemp.getInt(tempno, "速度")
				
					for j=1,#ranktbl do
						if workrank >= ranktbl[j][1] then
							myranktmp = j - 1
							break
						end
					end
					nenglitmp = char.getLiftTo8(vitaltemp, 1) + char.getLiftTo8(strtemp, 2) + char.getLiftTo8(tghtemp, 3) + char.getLiftTo8(dextemp, 4)
					vitaltemp = (vitaltemp + ability[1]) * initnum
					strtemp = (strtemp + ability[2]) * initnum
					tghtemp = (tghtemp + ability[3]) * initnum
					dextemp = (dextemp + ability[4]) * initnum
					vitaltempfix = math.floor((vitaltemp * 4 + strtemp + tghtemp + dextemp) * 0.01)
					strtempfix = math.floor(strtemp * 0.01 + tghtemp * 0.01 * 0.1 + vitaltemp * 0.01 * 0.1 + dextemp * 0.01 * 0.05)
					tghtempfix = math.floor(tghtemp * 0.01 + strtemp * 0.01 * 0.1 + vitaltemp * 0.01 * 0.1 + dextemp * 0.01 * 0.05)
					dextempfix = math.floor(dextemp * 0.01)
					totalnum[i] = vitaltempfix/4 + strtempfix + tghtempfix + dextempfix
					if i == 1 then
						haonum = i
						vital = vitaltemp
						str = strtemp
						tgh = tghtemp
						dex = dextemp
						nengli = nenglitmp
						myrank = myranktmp														
						petchangedata[petUnicode][i] = {vital,str,tgh,dex,nengli,myrank}
					else
						if totalnum[i] > totalnum[haonum] then
							haonum = i
							vital = vitaltemp
							str = strtemp
							tgh = tghtemp
							dex = dextemp
							nengli = nenglitmp
							myrank = myranktmp
						end
						petchangedata[petUnicode][i] = {vitaltemp,strtemp,tghtemp,dextemp,nenglitmp,myranktmp}
					end
				end
		
				char.setInt(petindex, "能力值", nengli)
				char.setInt(petindex, "成长区间", myrank)
				char.setInt(petindex, "体力", vital)
				char.setInt(petindex, "腕力", str)
				char.setInt(petindex, "耐力", tgh)
				char.setInt(petindex, "速度", dex)


				char.setInt(petindex, "等级", 1)
				char.setInt(petindex, "经验", 0)
				char.setInt(petindex, "转数", 0)
				char.setInt(petindex, "提升值", 0)
				char.setChar(petindex, "称号", "")
				local nHLCount = char.getInt(petindex, "极品")+nResetNum
				char.setInt(petindex, "极品",  nHLCount)
				--char.setChar(petindex, "名字",enemytemp.getChar(tempno, "名字"))
				--char.setChar(petindex, "昵称",enemytemp.getChar(tempno, "名字"))
				if char.getInt(petindex,"安全锁") == 2 then
					char.setInt(petindex,"安全锁",0)
				end
				if char.getInt(petindex,"图像号") == 101428 then
					local temppetbaseno = enemytemp.getInt(enemytemp.getEnemyTempArrayFromTempNo(char.getInt(petindex,"宠ID")),"形象")
					char.setInt(petindex,"图像号",temppetbaseno)
					char.setInt(petindex,"原图像号",temppetbaseno)
				end
				char.complianceParameter(petindex)

				char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))
				char.setChar(petindex,"宠物四围",char.getWorkInt(petindex, "最大HP") .. "|" .. char.getWorkInt(petindex, "修正腕力") .. "|" .. char.getWorkInt(petindex, "修正耐力") .. "|" .. char.getWorkInt(petindex, "修正速度"))
				--[[char.dropPetFollow(talkerindex, petId)
				char.setWorkInt(petindex, "捡起模式", 3)
				char.setFunctionPointer(petindex, "循环事件", "Loop", "")
				char.setInt(petindex, "循环事件时间", 500)
				char.delFunctionPointer(petindex, "对话事件")
				char.delFunctionPointer(petindex, "窗口事件")]]
				--delnum = npc.DelItemNum(talkerindex, "20828,1")
				if #v[3] > 0 then
					npc.DelItem(talkerindex,v[3][1] .. "*" .. v[3][2] * 10)
				end
				local tipText = "您的["..char.getChar(petindex,"名字").."]已回炉成功，回炉资费 "
				if costPetPt >0 then
					sasql.setPetPoint(talkerindex,mypetpoint-costPetPt)
					tipText=tipText..costPetPt .." 水晶已扣除,"
				end	
				if costVipPt >0 then
					sasql.setVipPoint(talkerindex,myvippoint-costVipPt)
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,costVipPt})
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -costVipPt .. "," .. myvippoint .. "," .. (myvippoint - costVipPt) .. ",'回炉[" .. char.getChar(petindex,"名字") .. "]扣除" .. costVipPt .. "金币',NOW())"
					sasql.query(token)
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,costVipPt})
					tipText=tipText..costVipPt .." 金币已扣除,"
					char.updateGold(talkerindex,4)
				end
				tipText=tipText.."请注意!"
				char.newMessageToCli(talkerindex, -1, tipText, "白色");
				char.sendStatusString(talkerindex, "K" .. petId)
				local new4v = get4VString(petindex)
				InsertBackTimeLog(talkerindex,petindex,old4v,new4v,getPetPoint(petindex,v[2],1) * 10)
				char.charSaveFromConnect(talkerindex)
				token = nHLCount .. "|" .. haonum
				for i=1,nResetNum do
					vitaltempfix = math.floor((petchangedata[petUnicode][i][1] * 4 + petchangedata[petUnicode][i][2] + petchangedata[petUnicode][i][3] + petchangedata[petUnicode][i][4]) * 0.01)
					strtempfix = math.floor(petchangedata[petUnicode][i][2] * 0.01 + petchangedata[petUnicode][i][3] * 0.01 * 0.1 + petchangedata[petUnicode][i][1] * 0.01 * 0.1 + petchangedata[petUnicode][i][4] * 0.01 * 0.05)
					tghtempfix = math.floor(petchangedata[petUnicode][i][3] * 0.01 + petchangedata[petUnicode][i][2] * 0.01 * 0.1 + petchangedata[petUnicode][i][1] * 0.01 * 0.1 + petchangedata[petUnicode][i][4] * 0.01 * 0.05)
					dextempfix = math.floor(petchangedata[petUnicode][i][4] * 0.01)
					--"|" .. vitaltempfix/4 + strtempfix + tghtempfix + dextempfix ..
					token = token ..  "|" .. vitaltempfix .. "|" .. strtempfix .. "|" .. tghtempfix .. "|" .. dextempfix
				end				
				--lssproto.windows(talkerindex, 1003, 12, petId + 10, char.getWorkInt( meindex, "对象"), token)
				--char.newMessageToCli (talkerindex, -1, "系统自动为您存档!", "白色");
				return token      
            end
        end
    end
    return false
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 8 then
		return
	end
	if seqno == 9 then
		char.setWorkInt(talkerindex, "NPC临时1",data-1)
		char.setWorkInt(talkerindex, "NPC临时2",char.getInt(char.getCharPet(talkerindex,data-1),"宠ID"))
		--lssproto.windows(talkerindex, 2000, 8, 10, char.getWorkInt( meindex, "对象"), char.getInt(char.getCharPet(talkerindex,data-1), "图像号"))
		
	elseif seqno == 10 then
		if char.getWorkInt(talkerindex, "NPC临时2") == char.getInt(char.getCharPet(talkerindex,char.getWorkInt(talkerindex, "NPC临时1")),"宠ID") then
			if data == "one" then
				petchange(talkerindex,char.getCharPet(talkerindex,char.getWorkInt(talkerindex, "NPC临时1")))
			elseif data == "ten" then
				petchangenum(talkerindex,char.getCharPet(talkerindex,char.getWorkInt(talkerindex, "NPC临时1")))
			end
		end
	elseif seqno >= 0 and seqno < 5 then
		performatReset(talkerindex,seqno,2,1)
	end
end

function WindowTalkedNum( meindex, talkerindex, seqno, select, data)
	local ranktbl = {
		{ 100, 2.5},
    	{ 95, 2.0},
    	{ 90, 1.5},
    	{ 85, 1.0},
    	{ 80, 0.5},
    	{ 0, 0.0}}
	if seqno >= 0 and seqno <= 4 then
		performatReset(meindex, talkerindex,seqno,2,10)
	elseif seqno >= 10 and seqno <= 14 then
		if data == "" then
			return
		end
		local petindex = char.getCharPet(talkerindex, seqno - 10)
		if char.check(petindex) == 1 then
			if char.getInt(talkerindex, "骑宠") == seqno - 10 then
				char.TalkToCli(talkerindex, -1, "骑乘中的宠物无法回炉，请下骑后再试。", "随机色")
				return
			end
			if char.getInt(petindex, "守护兽") == 1 then
				char.TalkToCli(talkerindex, -1, "家族守护兽无法回炉!", "随机色")
				return
			end
			if char.getInt(petindex, "等级") ~= 1 then
				return
			end
			local petuid = other.getString(data,"|",1)
			local selectno = other.getString(data,"|",2)
			if petuid == "" or selectno == "" then
				return
			end
			if other.atoi(selectno) < 1 or other.atoi(selectno) > 10 then
				return
			end
			local petUnicode=char.getChar(petindex,"唯一编号")
			if petchangedata[petUnicode] ~= nil then
				char.setInt(petindex, "能力值", petchangedata[petUnicode][other.atoi(selectno)][5])
				char.setInt(petindex, "成长区间", petchangedata[petUnicode][other.atoi(selectno)][6])
				char.setInt(petindex, "体力", petchangedata[petUnicode][other.atoi(selectno)][1])
				char.setInt(petindex, "腕力", petchangedata[petUnicode][other.atoi(selectno)][2])
				char.setInt(petindex, "耐力", petchangedata[petUnicode][other.atoi(selectno)][3])
				char.setInt(petindex, "速度", petchangedata[petUnicode][other.atoi(selectno)][4])
				char.complianceParameter(petindex)
				char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))
				char.setChar(petindex,"宠物四围",char.getWorkInt(petindex, "最大HP") .. "|" .. char.getWorkInt(petindex, "修正腕力") .. "|" .. char.getWorkInt(petindex, "修正耐力") .. "|" .. char.getWorkInt(petindex, "修正速度"))
				char.sendStatusString(talkerindex, "K" .. seqno - 10)
				petchangedata[petUnicode] = nil
				token = "回炉宠物成功"
					 .. "\n当前宠物评分[" .. char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "修正腕力") + char.getWorkInt(petindex, "修正耐力") + char.getWorkInt(petindex, "修正速度") .. "]"
					 .. "\n血：" .. char.getWorkInt(petindex, "最大HP")
					 .. "\n攻：" .. char.getWorkInt(petindex, "修正腕力")
					 .. "\n防：" .. char.getWorkInt(petindex, "修正耐力")
					 .. "\n敏：" .. char.getWorkInt(petindex, "修正速度")
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				char.charSaveFromConnect(talkerindex)
			end
		end
	end
end



function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	npcindexnum = npc.CreateNpc(name, metamo, floor, x + 1, y + 1, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindexnum, "窗口事件", "WindowTalkedNum", "")
end

function data()
	petchangelist={{777,3888,{}}--白虎
					,{3000,3888,{}}--朱雀
					,{3033,3888,{}}--玄武
					,{3034,3888,{}}--青龙
					,{4400,1888,{}}--暗机暴
					,{3068,3288,{}}--幽灵
					,{3069,3288,{}}--幽灵
					,{901,1800,{}}--年兽
					,{902,1800,{}}--年兽
					,{903,1800,{}}--年兽
					,{904,1800,{}}--年兽
					,{3041,1866,{}}--三头蛇
					,{3042,1866,{}}--三头蛇
					,{3043,1866,{}}--三头蛇
					,{3044,1866,{}}--三头蛇
					,{3001,1888,{}}--2D人龙
					,{3002,1888,{}}--2D人龙
					,{3003,1888,{}}--2D人龙
					,{3004,1888,{}}--2D人龙
					,{3005,1888,{}}--2D人龙
					,{755,1000,{}}--杨格斯
					,{754,1000,{}}--粉人龙
					,{739,800,{}}--新舌头
					,{740,800,{}}--新舌头
					,{741,800,{}}--新舌头
					,{742,800,{}}--新舌头
					,{3126,1200,{}}--水蓝龙
					,{3006,1800,{}}--2D老虎
					,{3007,1800,{}}--2D老虎
					,{3008,1800,{}}--2D老虎
					,{3009,1800,{}}--2D老虎
					,{3025,1500,{}}--2D威威
					,{3026,1500,{}}--2D威威
					,{3027,1500,{}}--2D威威
					,{3028,1500,{}}--2D威威
					,{3127,800,{}} -- 狗狗
					,{3128,800,{}} -- 狗狗
					,{3129,800,{}} -- 狗狗
					,{4527,2000,{}} -- 梅花鹿
					,{969,1000,{}}
					,{3901,1000,{}} --龙蛇
					,{3902,1000,{}} --龙蛇
					,{3904,1000,{}} --龙蛇
					,{3903,1000,{}} --龙蛇
					,{3018,800,{}}--兔子
					,{3019,800,{}}--兔子
					,{3020,2300,{}}--白兔子
					,{3035,3000,{}}--机械猩猩
					,{3036,3000,{}}--稀有老虎
					,{3058,3000,{}}--机械鸡
					,{3037,3288,{}}--金暴
					,{3038,3288,{}}--黑暴
					,{3052,3288,{}}--水暴
					,{3053,3000,{}}--人狼
					,{3054,3000,{}}--人狼
					,{3055,3000,{}}--人狼
					,{3056,3000,{}}--人狼
					,{3057,3288,{}}--土暴
					,{3021,1000,{}}--兔子
					,{3010,1000,{}}--乌龟
					,{3011,1000,{}}--乌龟
					,{3012,1000,{}}--乌龟
					,{3013,1000,{}}--乌龟
					,{81,200,{}}--穿山甲
					,{82,200,{}}--穿山甲
					,{83,200,{}}--穿山甲
					,{84,200,{}}--穿山甲
					,{85,200,{}}--穿山甲
					,{191,300,{}}--老虎
					,{192,300,{}}--老虎
					,{193,300,{}}--老虎
					,{194,400,{}}--金虎
					,{291,150,{}}--小鸡
					,{292,150,{}}--小鸡
					,{293,150,{}}--小鸡
					,{294,150,{}}--小鸡
					,{808,250,{}}--小鸡
					,{301,200,{}}--绿暴
					,{302,500,{}}--左迪洛斯
					,{303,500,{}}--巴朵兰恩
					,{304,800,{}}--机暴
					,{3045,1000,{}}--机龙
					,{251,300,{}}--布洛多斯
					,{252,300,{}}--布林帖斯
					,{253,300,{}}--布拉奇多斯
					,{254,500,{}}--斯天多斯
					,{255,300,{}}--邦恩多斯
					,{271,200,{}}--帖拉格恩
					,{272,200,{}}--洛卡伦恩
					,{273,200,{}}--加宝格恩
					,{274,300,{}}--朵拉比斯
					,{275,300,{}}--朵拉比斯
					,{3124,800,{}}--水飞
					,{221,200,{}}--克邦凯斯
					,{222,200,{}}--加克拉
					,{223,200,{}}--加格
					,{224,200,{}}--邦恩吉
					,{231,300,{}}--奇卡洛斯
					,{232,300,{}}--奇娜
					,{233,300,{}}--奇卡宝斯
					,{234,300,{}}--卡卡金宝
					,{791,300,{}}--里昂蛙
					,{91,200,{}}--利则诺顿
					,{92,200,{}}--扬奇洛斯
					,{93,200,{}}--邦浦洛斯
					,{94,200,{}}--邦奇诺
					,{95,200,{}}--布鲁顿
					,{141,200,{}}--格尔顿
					,{142,200,{}}--奇拉顿
					,{143,200,{}}--齐尔格尔顿
					,{144,200,{}}--格尔格
					,{765,800,{}}
					,{766,800,{}}--新猩猩
					,{767,800,{}}--新猩猩
					,{768,800,{}}--新猩猩
					,{784,800,{}}--新鲨鱼
					,{785,800,{}}--
					,{786,800,{}}--
					,{787,800,{}}--
					,{31,50,{}}--乌宝宝
					,{32,50,{}}--威威
					,{33,50,{}}--乌卡鲁
					,{34,50,{}}--威伯
					,{261,150,{}}--玛恩摩
					,{262,150,{}}--恩摩摩
					,{263,150,{}}--玛摩那斯
					,{264,150,{}}--玛恩摩洛斯
					,{61,200,{}}--阿哥亚
					,{62,200,{}}--尼可斯
					,{63,200,{}}--特洛昆
					,{64,200,{}}--达克尔
					,{65,200,{}}--柏克尔
					,{51,100,{}}--乌龟
					,{52,100,{}}--乌龟
					,{53,500,{}}--乌龟
					,{54,100,{}}--乌龟
					,{21,100,{}}--乌龟
					,{22,100,{}}--乌龟
					,{23,100,{}}--乌龟
					,{24,100,{}}--乌龟
					,{181,100,{}}--巴克
					,{182,100,{}}--巴克
					,{183,100,{}}--巴克
					,{184,100,{}}--巴克
					,{35,1980,{}}--蝎子
					,{36,1980,{}}--
					,{37,1980,{}}--
					,{38,1980,{}}--
					,{117,1980,{}}--狮王
					,{118,1980,{}}--
					,{119,1980,{}}--
					,{120,1980,{}}--
					,{3029,1500,{}}--狗狗
					,{3030,1500,{}}--狗狗
					,{3032,1500,{}}--狗狗
					,{3031,1500,{}}--狗狗
					,{3120,2000,{}}--新虎
					,{3121,2000,{}}--新虎
					,{71,200,{}}--t跳跳
					,{72,200,{}}--t跳跳
					,{73,200,{}}--t跳跳
					,{74,200,{}}--t跳跳
					,{41,200,{}}--贝洛恩
					,{42,200,{}}--贝洛洛克
					,{43,200,{}}--贝洛宝克尔
					,{44,200,{}}--贝洛宝利
					,{3046,2666,{}}--双头狼
					,{3047,2666,{}}--双头狼
					,{3048,2666,{}}--双头狼
					,{3049,2666,{}}--双头狼
					,{3050,2666,{}}--双头狼
					,{3051,2666,{}}--双头狼
					,{243,200,{}}--海主人
					,{3062,2999,{}}--新鲨鱼
					,{3066,3666,{}}--牛骑宠
					,{3067,3666,{}}--牛骑宠
					,{3063,2888,{}}--新战宠
					,{3064,3888,{}}--新战宠
					,{3065,3888,{}}--新战宠
					,{3068,3999,{}}--异形
					,{3069,3999,{}}--异形
					,{3070,3999,{}}--异形
					,{3071,3999,{}}--异形
					,{3072,3000,{}}--哞哞
					,{3073,3888,{}}--莱恩奇夫
					,{4540,1500,{}}--帖鲁西卡
					,{11,300,{}}--布比(练宠比赛)
					,{1110,833,{}}
					,{1095,833,{}}
					,{4547,1833,{}}--机雷
					,{1047,3877,{}}--魔兽
					,{4548,1000,{}}
					,{3040,3377,{}}--机猫
					,{985,3877,{}}--魔兽					
					,{986,3877,{}}--魔兽
					,{1048,3877,{}}--魔兽
					,{957,1700,{}}--端午兽
					,{958,1700,{}}
					,{959,1700,{}}
					,{960,1700,{}}--端午兽
					,{725,2000,{}}
					,{4559,2866,{}}
					,{4560,2866,{}}
					,{4561,2866,{}}
					,{4562,2866,{}}
					,{212,100,{}}
					,{908,800,{}}--小水怪
					,{910,600,{}}
					,{965,1000,{}}
					,{3074,1000,{}}--吉鲁
					,{3130,400,{}}--小雷尔
					,{3131,400,{}}--小忍者
					,{3132,400,{}}--小海盗
					}
					
	zhedate = {1901251459,1902102359}
end


function main()
	Create("回炉大师", 101156, 777, 15, 12, 4)
	data()
	petchangedata = {}
	item.addLUAListFunction( "ITEM_PETCHANGE", "petchange", "")
	item.addLUAListFunction( "ITEM_PETCHANGENUM", "petchangenum", "")
end