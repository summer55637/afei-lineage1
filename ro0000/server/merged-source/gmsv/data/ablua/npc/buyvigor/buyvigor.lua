function ShowBuyVigor(talkerindex)
	local myvigordata = char.getInt(talkerindex,"购买活力数据")
	local vigornum = 0
	if myvigordata == 0 then
		myvigordata = other.atoi(os.date("%Y%m%d",os.time()) .. "00")
		char.setInt(talkerindex,"购买活力数据",myvigordata)
	else
		local vigordate = math.floor(myvigordata / 100)
		if vigordate == other.atoi(os.date("%Y%m%d",os.time())) then
			vigornum = myvigordata % 100
		else
			vigordate = other.atoi(os.date("%Y%m%d",os.time()))
			myvigordata = other.atoi(vigordate .. "00")
			char.setInt(talkerindex,"购买活力数据",myvigordata)
		end
	end
	if vigornum >= 15 then
		token = "您今日已经购买了15次活力，无法购买了"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		return 0
	end
	if vigornum < 15 then
		token = "今日第" .. vigornum + 1 .. "次购买60活力，需要" .. vigorvippoint[vigornum + 1] .. "金币，您确定要购买吗"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( npcindex, "对象"), token)
	end
	return 0
end

function SendBuyVigor(talkerindex)
	local myvigordata = char.getInt(talkerindex,"购买活力数据")
	local vigornum = 0
	if myvigordata == 0 then
		myvigordata = other.atoi(os.date("%Y%m%d",os.time()) .. "00")
		char.setInt(talkerindex,"购买活力数据",myvigordata)
	else
		local vigordate = math.floor(myvigordata / 100)
		if vigordate == other.atoi(os.date("%Y%m%d",os.time())) then
			vigornum = myvigordata % 100
		else
			vigordate = other.atoi(os.date("%Y%m%d",os.time()))
			myvigordata = other.atoi(vigordate .. "00")
			char.setInt(talkerindex,"购买活力数据",myvigordata)
		end
	end
	if vigornum >= 15 then
		lssproto.sendBuyVigor(char.getFd(talkerindex), 1, "当日活力购买到达上限")
		return 0
	end
	if vigornum < 15 then
		token = "[" .. vigornum + 1 .. "/15]此次购买活力需" .. vigorvippoint[vigornum + 1] .. "金币,您是否购买"
		lssproto.sendBuyVigor(char.getFd(talkerindex), 0, token)
	end
	return 0
end

function SaMenuBuyVigor(talkerindex)
	local myvigordata = char.getInt(talkerindex,"购买活力数据")
	local vigornum = 0
	if myvigordata == 0 then
		myvigordata = other.atoi(os.date("%Y%m%d",os.time()) .. "00")
		char.setInt(talkerindex,"购买活力数据",myvigordata)
	else
		local vigordate = math.floor(myvigordata / 100)
		if vigordate == other.atoi(os.date("%Y%m%d",os.time())) then
			vigornum = myvigordata % 100
		else
			vigordate = other.atoi(os.date("%Y%m%d",os.time()))
			myvigordata = other.atoi(vigordate .. "00")
			char.setInt(talkerindex,"购买活力数据",myvigordata)
		end
	end
	if vigornum >= 15 then
		char.newMessageToCli(talkerindex,-1,"当日活力购买到达上限","白色")
		return 0
	end
	if sasql.getVipPoint(talkerindex) < vigorvippoint[vigornum + 1] then
		char.newMessageToCli(talkerindex,-1,"您的金币不足，无法购买","白色")
		lssproto.windows(talkerindex, 1038, 0, -1, -1, "2")
		return 0
	end
	local myvippoint = sasql.getVipPoint(talkerindex)
	sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - vigorvippoint[vigornum + 1])
	other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vigorvippoint[vigornum + 1]})
	other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,vigorvippoint[vigornum + 1]})
	token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -vigorvippoint[vigornum + 1] .. "," .. myvippoint .. "," .. myvippoint - vigorvippoint[vigornum + 1] .. ",'购买活力扣除" .. vigorvippoint[vigornum + 1] .. "金币',NOW())"
	sasql.query(token)
	char.newMessageToCli(talkerindex,-1,"扣除金币" .. vigorvippoint[vigornum + 1],"白色")
	char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") + 60)
	char.setInt(talkerindex,"购买活力数据",other.atoi(string.format(os.date("%Y%m%d",os.time()) .. "%02d",vigornum + 1)))
	char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + 60 * 10 * 100)
	saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
	char.newMessageToCli(talkerindex,-1,"购买60活力成功","白色")
	other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	SendBuyVigor(talkerindex)
	return 0
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	ShowBuyVigor(talkerindex)
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if select == 1 then
			local myvigordata = char.getInt(talkerindex,"购买活力数据")
			local vigornum = 0
			if myvigordata == 0 then
				myvigordata = other.atoi(os.date("%Y%m%d",os.time()) .. "00")
				char.setInt(talkerindex,"购买活力数据",myvigordata)
			else
				local vigordate = math.floor(myvigordata / 100)
				if vigordate == other.atoi(os.date("%Y%m%d",os.time())) then
					vigornum = myvigordata % 100
				else
					vigordate = other.atoi(os.date("%Y%m%d",os.time()))
					myvigordata = other.atoi(vigordate .. "00")
					char.setInt(talkerindex,"购买活力数据",myvigordata)
				end
			end
			if vigornum >= 15 then
				token = "您今日已经购买了15次活力，无法购买了"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				return
			end
			if sasql.getVipPoint(talkerindex) < vigorvippoint[vigornum + 1] then
				char.newMessageToCli(talkerindex,-1,"您的金币不足，无法购买","白色")
				lssproto.windows(talkerindex, 1038, 0, -1, -1, "2")
				return
			end
			local myvippoint = sasql.getVipPoint(talkerindex)
			sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - vigorvippoint[vigornum + 1])
			other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vigorvippoint[vigornum + 1]})
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,vigorvippoint[vigornum + 1]})
			token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -vigorvippoint[vigornum + 1] .. "," .. myvippoint .. "," .. myvippoint - vigorvippoint[vigornum + 1] .. ",'购买活力扣除" .. vigorvippoint[vigornum + 1] .. "金币',NOW())"
			sasql.query(token)
			char.newMessageToCli(talkerindex,-1,"扣除金币" .. vigorvippoint[vigornum + 1],"白色")
			char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") + 60)
			char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + 60 * 10 * 100)
			saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
			char.setInt(talkerindex,"购买活力数据",other.atoi(string.format(os.date("%Y%m%d",os.time()) .. "%02d",vigornum + 1)))
			char.newMessageToCli(talkerindex,-1,"购买60活力成功","白色")
			other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
			SendBuyVigor(talkerindex)
		end
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	vigorvippoint = {200,200,200,500,500,500,500,500,500,500,1500,1500,1500,1500,1500}
end
function main()
	--第一个商店内容
	Create("购买活力", 100000, 777, 15, 13, 4)
	data()
end