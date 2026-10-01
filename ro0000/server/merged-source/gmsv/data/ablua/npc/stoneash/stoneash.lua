--石灰之约
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
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

--把非绑定的道具名字改为绑定的给前端展示用
function getBdName(id)

	local newName = item.getNameFromNumber(id)
	if string.sub(newName, 1, 1) ~= "*" then
		newName = "*"..newName
	end
	return newName
end

--[[			
			
查询徽章奖励详情(上部)
客户端请求:O|
服务端返回:O|石灰积分数量(int)|徽章积分奖励个数(int)|[是否领取(int)|需要积分(int)|奖励名1(str)|奖励图1(int)|奖励介绍1(str)|奖励数量]


]]
function StoneAshMessage(charaindex,index,data,callbackfunc)
	local type = other.getString(data,"|",1)
	local token = ""
	if type == "Q" then 	
		token = "Q|"..isValidTime()
	elseif type == "O" then
		local userinfo = getStoneAshUserInfo(charaindex)
		token = "O|"..userinfo.ashpoint.."|"..#AshPoint_Prize.."|"
		for i = 1,#AshPoint_Prize do 
			token = token..userinfo[i].prizeflg.."|"..AshPoint_Prize[i].point.."|"
			.. item.getNameFromNumber(AshPoint_Prize[i].itemid).."|"
			.. item.getgraNoFromITEMtabl(AshPoint_Prize[i].itemid).."|"
			.. item.getItemInfoFromNumber(AshPoint_Prize[i].itemid).."|"
			.. AshPoint_Prize[i].itemcount.."|"
		end
	
	
	--[[
查询某日活动详情（用于展示活动界面内容(下部)）
客户端请求:L|天数ID(0为查询当天详情，1~7为查询指定天的详情)
服务端返回:L|活动总体剩余时间(int 剩余秒)|石灰积分数量(int)|当前第几天(int)|今日特惠礼包剩余购买时间(int 剩余秒)|特惠礼包是否购买(int)|
			特惠礼包名字(str)|特惠礼包图号(int)|特惠礼包描述(str)|特惠礼包原价(int)|特惠礼包现价(int)|特惠礼包折扣(str)|今日任务个数(int)|
			[是否领取(int)|任务类型(int)|任务描述(str)|需求数量(int)|达成数量(int)|完成可得徽章数量(int)|奖励名字(str)|奖励描述(str)|奖励图号(int)|奖励数量(int)]
	
	]]
	elseif type == "L" then 
		local id = other.atoi(other.getString(data,"|",2))
		if id <= 0 or id > 7 then
			id = getWhichDay(charaindex)
			if id <= 0 or id > #StoneAsh_Data then
				id = 1
			end
		end
		local userinfo = getStoneAshUserInfo(charaindex)
		local eventinfo = getStoneAshEventInfo(charaindex)
		
		local targetstr
		--石灰之约 2020-12-15 23:59:59 之前创建的号 特惠礼包特殊处理
		if char.getInt(charaindex,"任务计时") <= TIME then
			targetstr = os.date("%Y%m%d",char.getInt(charaindex,"任务计时")+(id+1)*86400)
		else
			targetstr = os.date("%Y%m%d",char.getInt(charaindex,"任务计时")+(id-1)*86400)
		end
		local todaystr =  os.date("%Y%m%d",other.time())
		local dayid = getWhichDay(charaindex)
		
		local lefttime = getLeftTime()
		if targetstr ~= todaystr then 
			lefttime = 0
		end
		token = "L|"..math.max(0,ENDTIME - other.time()).."|"..userinfo.ashpoint.."|"..id.."|"..getWhichDay(charaindex).."|"..lefttime.."|"..userinfo[id].buyflg.."|".. item.getNameFromNumber(AshBuy_Data[id].itemid).."|"
			.. item.getgraNoFromITEMtabl(AshBuy_Data[id].itemid).."|"
			.. item.getItemInfoFromNumber(AshBuy_Data[id].itemid).."|"..AshBuy_Data[id].point.."|"..math.floor(AshBuy_Data[id].point*AshBuy_Data[id].discount).."|"..AshBuy_Data[id].discount.."|"..#StoneAsh_Data[id].."|"
		for i = 1,#StoneAsh_Data[id] do 
			token = token..eventinfo[StoneAsh_Data[id][i].type].prizeflg .."|"
			..StoneAsh_Data[id][i].type.."|"
			..string.format(AshMissionType[StoneAsh_Data[id][i].type].info,StoneAsh_Data[id][i].needcount).."|"
			..StoneAsh_Data[id][i].needcount.."|"
			..eventinfo[StoneAsh_Data[id][i].type].count.."|"
			..StoneAsh_Data[id][i].ashpoint.."|"
			-- .. item.getNameFromNumber(StoneAsh_Data[id][i].itemid1).."|"
			.. getBdName(StoneAsh_Data[id][i].itemid1).."|"
			.. item.getItemInfoFromNumber(StoneAsh_Data[id][i].itemid1).."|"
			.. item.getgraNoFromITEMtabl(StoneAsh_Data[id][i].itemid1).."|"
			.. StoneAsh_Data[id][i].itemcount1.."|"
		end
		
	elseif type == "GP" then --领取某天某任务奖励
		local id = other.atoi(other.getString(data,"|",2))
		if id <= 0 or id > 7 then 
			char.newMessageToCli(charaindex,-1,"奖励选择有误","白色")
			return 0
		end
		local index = other.atoi(other.getString(data,"|",3))
		if index < 1 or index > #StoneAsh_Data[id] then 
			char.newMessageToCli(charaindex,-1,"奖励领取错误","白色")
			return 0
		end
		local targetstr = os.date("%Y%m%d",char.getInt(charaindex,"任务计时")+(id-1)*86400)
		local todaystr =  os.date("%Y%m%d",other.time())
		-- if targetstr ~= todaystr then 
		-- 	char.newMessageToCli(charaindex,-1,"只能领取今日奖励","白色")
		-- 	return 0
		-- end
		if checkEmptItemNum(charaindex) < StoneAsh_Data[id][index].itemcount1 then 
			char.newMessageToCli(charaindex,-1,"道具栏不足","白色")
			return 0
		end
		local userinfo = getStoneAshUserInfo(charaindex)
		local eventinfo = getStoneAshEventInfo(charaindex)
		--是否达到领奖条件
		if eventinfo[StoneAsh_Data[id][index].type].count < StoneAsh_Data[id][index].needcount then
			char.newMessageToCli(charaindex,-1,"未达到领取条件","白色")
			return 0
		end
		--判断某天某任务奖励是否已领取
		if other.DataAndData(eventinfo[StoneAsh_Data[id][index].type].prizeflg, index - 1) ~= 0 then
			char.newMessageToCli(charaindex,-1,"您已经领取过了","白色")
			return 0
		end
		for i = 1,StoneAsh_Data[id][index].itemcount1 do 
			local itemindex = char.Additem(charaindex,StoneAsh_Data[id][index].itemid1, debug.getinfo(1).source, debug.getinfo(1).currentline)
			if itemindex > -1 then
				if StoneAsh_Data[id][index].bind1 == 1 then
					--道具需要绑定
					if string.sub(item.getChar(itemindex, "名称"), 1, 1) ~= "*" then
						item.setChar(itemindex, "名称", "*"..item.getChar(itemindex, "名称"))
					end
				elseif StoneAsh_Data[id][index].bind1 == 0 then
					--道具需要解除绑定
					if string.sub(item.getChar(itemindex, "名称"), 1, 1) == "*" then
						item.setChar(itemindex, "名称", string.sub(item.getChar(itemindex, "名称"), 2))
					end
				end
			end
			item.UpdataItemOne(charaindex, itemindex)
		end
		sqltoken = "update `stoneash_user` set `ashpoint` = `ashpoint` + "..StoneAsh_Data[id][index].ashpoint.." where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		--print(ret,sqltoken)
		-- 更新prizeflg标识
		local tmpprizeflg = 0
		tmpprizeflg = other.DataOrData(eventinfo[StoneAsh_Data[id][index].type].prizeflg, index - 1)

		-- sqltoken = "update `stoneash_event` set `prizeflg"..StoneAsh_Data[id][index].type.."` = `prizeflg"..StoneAsh_Data[id][index].type.."` + 1 where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "' and `date`='"..todaystr.."'"
		sqltoken = "update `stoneash_event` set `prizeflg"..StoneAsh_Data[id][index].type.."` = "..tmpprizeflg.." where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		--print(ret,sqltoken)
		
		char.newMessageToCli(charaindex,-1,"领奖成功！","白色")
		token = "GP|"..id.."|"..index.."|1|"..(userinfo.ashpoint+StoneAsh_Data[id][index].ashpoint)
		
	elseif type == "GS" then --领取徽章积分奖励
		local index = other.atoi(other.getString(data,"|",2))
		if index < 1 or index > #AshPoint_Prize then 
			char.newMessageToCli(charaindex,-1,"奖励选择错误","白色")
			return 0
		end
		local userinfo = getStoneAshUserInfo(charaindex)
		if userinfo.ashpoint < AshPoint_Prize[index].point then 
			char.newMessageToCli(charaindex,-1,"徽章积分不足","白色")
			return 0
		end
		if checkEmptItemNum(charaindex) < AshPoint_Prize[index].itemcount then 
			char.newMessageToCli(charaindex,-1,"道具栏不足","白色")
			return 0
		end
		if userinfo[index].prizeflg > 0 then 
			char.newMessageToCli(charaindex,-1,"您已经领取过了","白色")
			return 0
		end
		for i = 1, AshPoint_Prize[index].itemcount do
			char.Additem(charaindex,AshPoint_Prize[index].itemid, debug.getinfo(1).source, debug.getinfo(1).currentline)
		end
		char.newMessageToCli(charaindex,-1,"领奖成功！","白色")
		sqltoken = "update `stoneash_user` set `prizeflg"..index.."` = 1 where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		--print(ret,sqltoken)
		token = "GS|"..index.."|1"
	
	elseif type == "BP" then --购买特惠礼包
		local id = other.atoi(other.getString(data,"|",2))
		if id < 1 or id > #AshBuy_Data then 
			char.newMessageToCli(charaindex,-1,"商品购买选择错误","白色")
			return 0
		end
		
		local dayid = getWhichDay(charaindex)
		if dayid ~= id then 
			char.newMessageToCli(charaindex,-1,"只能购买今日礼包","白色")
			return 0		
		end
		if checkEmptItemNum(charaindex) < 1 then 
			char.newMessageToCli(charaindex,-1,"道具栏不足","白色")
			return 0
		end
		if char.getInt(charaindex,"石币") < AshBuy_Data[id].point*AshBuy_Data[id].discount then 
			char.newMessageToCli(charaindex,-1,"石币不足","白色")
			return 0
		end
		
		local userinfo = getStoneAshUserInfo(charaindex)
		if userinfo[id].buyflg > 0 then 
			char.newMessageToCli(charaindex,-1,"您已购买过。","白色")
			return 0
		end
		char.setInt(charaindex,"石币", char.getInt(charaindex,"石币") - AshBuy_Data[id].point*AshBuy_Data[id].discount)
		other.CallFunction("useStoneLog","data/ablua/useItemRecord.lua",{charaindex,-AshBuy_Data[id].point*AshBuy_Data[id].discount,"石灰之约"})
		char.Additem(charaindex,AshBuy_Data[id].itemid, debug.getinfo(1).source, debug.getinfo(1).currentline)
		char.Updata(charaindex,"石币")
		
		sqltoken = "update `stoneash_user` set `buyflg"..id.."` = 1 where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(sqltoken)
		--print(ret,sqltoken)
		
		char.newMessageToCli(charaindex,-1,"领奖成功！","白色")
		token = "BP|"..id.."|1"
	end
	
	if token ~= "" then 
		--print(token)
		lssproto.NewSaMenu2(char.getFd(charaindex), index, token,callbackfunc)
	end
	return 0
end

function getLeftTime()
	local now_date = os.date("*t", other.time()) 
	return os.time({year=now_date.year, month=now_date.month, day=now_date.day, hour=23,min=59,sec = 59}) - other.time()
end

function getWhichDay(charaindex)
	local start_date = os.date("*t", char.getInt(charaindex,"任务计时"))
	local timediv = other.time() - os.time({year=start_date.year, month=start_date.month, day=start_date.day, hour=0,min=0,sec = 0})
	--石灰之约 2020-12-15 23:59:59 之前创建的号 活动往后推
	if char.getInt(charaindex,"任务计时") <= TIME then
		return math.floor((other.time() - os.time({year=start_date.year, month=start_date.month, day=start_date.day, hour=0,min=0,sec = 0}))/86400 ) - 1
	end

	if timediv % 86400 == 0 then
		return math.floor((other.time() - os.time({year=start_date.year, month=start_date.month, day=start_date.day, hour=0,min=0,sec = 0}))/86400 )
	else
		return math.floor((other.time() - os.time({year=start_date.year, month=start_date.month, day=start_date.day, hour=0,min=0,sec = 0}))/86400 ) + 1
	end
end

function isValidTime()
	if other.time()>=STARTTIME and other.time()<= ENDTIME then 
		return 1
	else 
		return 0
	end
end

function getStoneAshUserInfo(charaindex)
	local info = {ashpoint=0}
	for i = 1,#AshPoint_Prize do 
		info[i] = {}
		info[i].prizeflg = 0
		info[i].buyflg = 0
	end

		
	sqltoken = "SELECT * FROM `stoneash_user` WHERE `cdkey`='"..char.getChar(charaindex,"账号").."'"
	ret = sasql.query(sqltoken)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()		
			info.ashpoint = other.atoi(sasql.data(2))
			for i = 1,#AshPoint_Prize do 
				info[i].prizeflg = other.atoi(sasql.data(2+i))
			end
	
			for i = 1,#StoneAsh_Data do 
				info[i].buyflg = other.atoi(sasql.data(12+i))
			end
		else 
			sqltoken = "INSERT INTO `stoneash_user` SET `cdkey`='"..char.getChar(charaindex,"账号").."'"
			ret = sasql.query(sqltoken)
		end
	end 
	return info
end

function getStoneAshEventInfo(charaindex)
	local info = {}
	for i = 1,#AshMissionType do 
		info[i] = {}
		info[i].count = 0
		info[i].prizeflg = 0
	end		
	sqltoken = "SELECT * FROM `stoneash_event` WHERE `cdkey`='"..char.getChar(charaindex,"账号").."'"
	ret = sasql.query(sqltoken)
	--print(ret,sqltoken)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()		
			info.buyflg = other.atoi(sasql.data(3))
			--根据type类型取count数据
			for i = 1,#AshMissionType do 
				info[i].count = other.atoi(sasql.data(1+i))
				info[i].prizeflg = other.atoi(sasql.data(41+i))
			end
		else 
			sqltoken = "INSERT INTO `stoneash_event` SET `cdkey`='"..char.getChar(charaindex,"账号").."'"
			ret = sasql.query(sqltoken)
		end
	end 
	return info
end

--事件回调
function OnEventFinish(charaindex,type,data)
	--石灰之约 2020-12-31 14:0:0 之后创建的号不再有石灰之约
	if char.getInt(charaindex,"任务计时") > LIIMT_TIME then
		return 0
	end
	-- print("OnEventFinish",charaindex,type,data,other.time(),ENDTIME)
	if other.time()> STARTTIME and other.time()<ENDTIME then 
		-- print("石灰之约不会进来了！！！！！！")
		local dayid = getWhichDay(charaindex)
		-- print("dayid="..dayid)
		if dayid > 0 and dayid <= #StoneAsh_Data  then 
			if type > 0 and type <=#AshMissionType then 
				if isEventAvailableNow(charaindex,type,dayid) == 1 then
					local eventinfo = getStoneAshEventInfo(charaindex)
					local todaystr =  os.date("%Y%m%d",other.time())
					if AshMissionType[type].arg == "add" then 
						--登陆检测预处理特
						local counter = other.atoi(data)
						local sw_i,sw_j = string.find(data,"登陆")
						if sw_i ~= nil and sw_j ~= nil then
							counter = other.atoi(string.sub(data,sw_j + 1,-1))
							sqltoken = "update `stoneash_event` set `count"..type.."` = "..counter.." where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
						else
							if data == "" then 
								counter = 1
							end
							sqltoken = "update `stoneash_event` set `count"..type.."` = `count"..type.."` + "..counter.." where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
						end
						ret = sasql.query(sqltoken)
						--print(ret,sqltoken)
						
					elseif AshMissionType[type].arg == "max" then
						if eventinfo[type].count <= other.atoi(data) then
							local por = 1
							-- sqltoken = "update `stoneash_event` set `count"..type.."` = "..other.atoi(data).." where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
							sqltoken = "update `stoneash_event` set `count"..type.."` = "..por.." where `cdkey`= '" .. char.getChar(charaindex,"账号") .. "'"
							ret = sasql.query(sqltoken)
							--print(ret,sqltoken)
						end
						
					end
				end
			end
		end
	else 
		--print("时间不符")
	end
	return 0
end

function isEventAvailableNow(charaindex,eventid,dayid)
	for i = 1,#StoneAsh_Data do 
		for j = 1,#StoneAsh_Data[i] do 
			if StoneAsh_Data[i][j].type == eventid then 
				if dayid >= i then 
					return 1
				end
			end
		end
	end 
	
	return 0
end 

function data()
	STARTTIME = 0
	ENDTIME = 9908739199	--活动开关 石灰之约真正的控制是 任务计时
	LIIMT_TIME = 1609394400	--2020-12-31 14:0:0 之后创建的号不再有石灰之约
	TIME = 1608047999	-- 2020-12-15 23:59:59
	
	--积分礼物
	AshPoint_Prize = {
						{itemid=23870,itemcount=1,point=40},
						{itemid=23871,itemcount=1,point=80},
						{itemid=23872,itemcount=1,point=120},
						{itemid=23882,itemcount=1,point=160},
						{itemid=23884,itemcount=1,point=200},
						{itemid=23887,itemcount=1,point=240},
						{itemid=22547,itemcount=1,point=280},
						}
	
	--AshBuy
	AshBuy_Data = {
						{itemid=20811,point=200000,discount= 0.5},	--2倍智慧果6小时
						{itemid=20817,point=300000,discount= 0.5},	--3倍智慧果6小时
						{itemid=20817,point=300000,discount= 0.5},	--3倍智慧果6小时
						{itemid=23914,point=8888888,discount= 0.5},	--绑定石币1000W
						{itemid=23875,point=2000000,discount= 0.5},	--宠物技能突破石
						{itemid=23935,point=5000000,discount= 0.5},	--训练书包(初、中、高)
						{itemid=24611,point=888888,discount= 0.5},	--888声望
	
						}
	
	AshMissionType = {
						{type=1,info="捕捉%d次",arg="add"},
						{type=2,info="组队战斗%d次",arg="add"},
						{type=3,info="连续登陆%d天",arg="add"},	
						{type=4,info="合成(料理)%d次",arg="add"},
						{type=5,info="角色转生%d次",arg="add"},
						{type=6,info="宠物转生%d次",arg="add"},
						{type=7,info="参与贝洛金转盘%d次",arg="add"},
						{type=8,info="累计消耗石币%d",arg="add"},
						{type=9,info="累计获得%d声望",arg="add"},
						{type=10,info="回炉%d次",arg="add"},
						{type=11,info="刷楼%d次",arg="add"},
						{type=12,info="累计消耗2倍智慧果%d小时",arg="add"},
						{type=13,info="累计消耗3倍智慧果%d小时",arg="add"},
						{type=14,info="累计消耗5倍智慧果%d小时",arg="add"},
						
						{type=15,info="人物达到120级",arg="max"},
						{type=16,info="宠物达到120级",arg="max"},
						{type=17,info="完成黑蛙王任务%d次",arg="add"},
						{type=18,info="任意宠物技能达到%d级",arg="add"},--废弃占位 已有该类型
						{type=19,info="成功替换技能%d次",arg="add"},
						{type=20,info="累计学习%d个技能",arg="add"},
						{type=21,info="任意%d个技能升级到3级",arg="add"},
						{type=22,info="任意%d个技能升级到4级",arg="add"},
						{type=23,info="任意%d个技能升级到5级",arg="add"},
						{type=24,info="成功训练宠物%d次",arg="add"},
						{type=25,info="消耗初级训练书%d个",arg="add"},
						{type=26,info="消耗中级训练书%d个",arg="add"},
						{type=27,info="消耗高级训练书%d个",arg="add"},
						{type=28,info="%d只宠物训练次数达到10次",arg="add"},
						{type=29,info="重置%d次宠物训练",arg="add"},
						{type=30,info="转宠%d次",arg="add"},			--废弃占位 已有该类型
						{type=31,info="寄售月卡%d张",arg="add"},
						{type=32,info="购买限时等级礼包%d次",arg="add"},
						{type=33,info="转生%d次",arg="add"},			--废弃占位 已有该类型
						{type=34,info="等级达到1转131级以上",arg="max"},
						{type=35,info="骑乘机暴%d次",arg="add"},
						{type=36,info="加入家族%d次",arg="add"},
						{type=37,info="消耗%d张石币抵扣券升级技能",arg="add"},
						{type=38,info="任意%d个技能升级到1级",arg="add"},
						{type=39,info="任意%d个技能升级到2级",arg="add"},
				
						}
		
	--每日任务
	StoneAsh_Data = {
						{
							{type=3,needcount=2,ashpoint=5,itemid1=24228,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--1W石币
							{type=3,needcount=4,ashpoint=5,itemid1=23920,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5W石币
							{type=3,needcount=6,ashpoint=5,itemid1=23909,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--10W石币
							{type=4,needcount=1,ashpoint=5,itemid1=20806,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--2倍智慧果1小时
							{type=4,needcount=5,ashpoint=5,itemid1=20806,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--2倍智慧果1小时
							{type=4,needcount=10,ashpoint=5,itemid1=24401,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--体力20
							{type=4,needcount=20,ashpoint=5,itemid1=24413,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--体力30
							{type=4,needcount=50,ashpoint=5,itemid1=23870,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--邮票10
						},{
												
							{type=7,needcount=10,ashpoint=5,itemid1=20824,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5倍智慧果1小时
							{type=7,needcount=50,ashpoint=5,itemid1=23871,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--邮票20
							{type=7,needcount=100,ashpoint=5,itemid1=23872,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--邮票30
							{type=7,needcount=200,ashpoint=5,itemid1=23873,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--邮票40
							{type=7,needcount=500,ashpoint=5,itemid1=25044,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--永久恩泽之枪
							{type=8,needcount=1000000,ashpoint=5,itemid1=23924,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--30W石币
							{type=8,needcount=2000000,ashpoint=5,itemid1=23911,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--100W石币
							{type=8,needcount=10000000,ashpoint=5,itemid1=23875,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--宠物技能突破石
						},{
												
							{type=12,needcount=1,ashpoint=5,itemid1=20806,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--2倍智慧果1小时
							{type=12,needcount=3,ashpoint=5,itemid1=20812,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--3倍智慧果1小时
							{type=12,needcount=24,ashpoint=5,itemid1=20812,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--3倍智慧果1小时
							{type=13,needcount=1,ashpoint=5,itemid1=20812,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--3倍智慧果1小时
							{type=13,needcount=6,ashpoint=5,itemid1=20817,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--3倍智慧果6小时
							{type=13,needcount=12,ashpoint=5,itemid1=23845,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--初级训练书
							{type=14,needcount=6,ashpoint=5,itemid1=20824,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5倍智慧果1小时
							{type=14,needcount=24,ashpoint=5,itemid1=23846,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--中级训练书
						},{
												
							{type=38,needcount=1,ashpoint=5,itemid1=24229,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--3W石币
							{type=39,needcount=1,ashpoint=5,itemid1=23920,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5W石币
							{type=21,needcount=1,ashpoint=5,itemid1=23875,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--宠物技能突破石
							{type=22,needcount=1,ashpoint=5,itemid1=23875,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--宠物技能突破石
							{type=23,needcount=1,ashpoint=5,itemid1=24607,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--声望30
							{type=15,needcount=1,ashpoint=5,itemid1=23865,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--经验收集丹(只能对宠物用)
							{type=16,needcount=1,ashpoint=5,itemid1=25063,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--1级MM礼盒
							{type=17,needcount=1,ashpoint=5,itemid1=25063,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--1级MM礼盒
						},{
												
							{type=36,needcount=1,ashpoint=5,itemid1=20824,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5倍智慧果1小时
							{type=19,needcount=1,ashpoint=5,itemid1=24228,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--1W石币
							{type=19,needcount=3,ashpoint=5,itemid1=23920,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5W石币
							{type=20,needcount=3,ashpoint=5,itemid1=24228,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--1W石币
							{type=20,needcount=8,ashpoint=5,itemid1=23920,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5W石币
							{type=21,needcount=3,ashpoint=5,itemid1=23845,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--初级训练书
							{type=22,needcount=2,ashpoint=5,itemid1=23846,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--中级训练书
							{type=23,needcount=1,ashpoint=5,itemid1=23846,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--中级训练书
						},{
												
							{type=24,needcount=1,ashpoint=5,itemid1=23845,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--初级训练书
							{type=24,needcount=5,ashpoint=5,itemid1=23845,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--初级训练书
							{type=24,needcount=10,ashpoint=5,itemid1=23846,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--中级训练书
							{type=25,needcount=3,ashpoint=5,itemid1=23845,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--初级训练书
							{type=26,needcount=3,ashpoint=5,itemid1=23846,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--中级训练书
							{type=27,needcount=3,ashpoint=5,itemid1=23847,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--高级训练书
							{type=28,needcount=1,ashpoint=5,itemid1=23914,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--1000W石币
							{type=29,needcount=1,ashpoint=5,itemid1=23848,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--特级训练书
						},{
							{type=6,needcount=1,ashpoint=5,itemid1=25133,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--满级MM礼盒
							{type=31,needcount=1,ashpoint=5,itemid1=23924,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--30W石币
							{type=9,needcount=1000,ashpoint=5,itemid1=23909,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--10W石币
							{type=32,needcount=1,ashpoint=5,itemid1=20824,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5倍智慧果1小时
							{type=34,needcount=1,ashpoint=5,itemid1=24605,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--声望20
							{type=35,needcount=1,ashpoint=5,itemid1=24605,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--声望20
							{type=32,needcount=2,ashpoint=5,itemid1=24607,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--声望30
							{type=5,needcount=1,ashpoint=5,itemid1=20824,itemcount1=1,bind1=1,itemid2=-1,itemcount2=1},--5倍智慧果1小时
						},
					}
end


function main()
	data()
end