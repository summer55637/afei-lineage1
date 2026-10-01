function ShowPay(talkerindex)
	--0:维护，1：微信，2：支付宝，3：支付宝和微信
	local paytype = 3
	lssproto.windows(talkerindex, 106, "确定", 0, char.getWorkInt( npcindex, "对象"), "O|" .. paytype)
	return 0
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	ShowPay(talkerindex)
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "Q" then--渠道
		local qdtype = other.getString(data,"|",2)
		if qdtype == "" then
			return
		end
		local buyflg = other.getString(data,"|",3)
		if buyflg == "" then
			return
		end
		if other.atoi(qdtype) == 3 then
			if other.atoi(buyflg) < 1 or other.atoi(buyflg) > 6 then
				return
			end
			lssproto.windows(talkerindex, 106, 0, 0, char.getWorkInt( meindex, "对象"), "H|" .. androiddata[other.atoi(buyflg)] .. "|" .. "https://www.51boshao.com/kk5hyj?/requ8.php")
		elseif other.atoi(qdtype) == 4 then
			if other.atoi(buyflg) < 1 or other.atoi(buyflg) > 6 then
				return
			end
			lssproto.windows(talkerindex, 106, 0, 0, char.getWorkInt( meindex, "对象"), "H|" .. androiddata[other.atoi(buyflg)] .. "|" .. "https://www.51boshao.com/kk5hyj?/reqmt.php")
		elseif other.atoi(qdtype) == 5 then
			if other.atoi(buyflg) < 1 or other.atoi(buyflg) > 5 then
				return
			end
			lssproto.windows(talkerindex, 106, 0, 0, char.getWorkInt( meindex, "对象"), "H|" .. appleu8[other.atoi(buyflg)] .. "|" .. "https://www.51boshao.com/kk5hyj?/reqa8.php")
		end
	elseif type == "I" then--IOS
		local buyflg = other.getString(data,"|",2)
		if buyflg == "" then
			return
		end
		if other.atoi(buyflg) < 1 or other.atoi(buyflg) > 6 then
			return
		end
		--char.newMessageToCli(talkerindex, -1, "充值通道维护，请联系客服", "白色")
		--lssproto.windows(talkerindex, 106, 0, 0, char.getWorkInt( meindex, "对象"), "I|" .. iosdata[other.atoi(buyflg)] .. "|")
		lssproto.windows(talkerindex, 106, 0, 0, char.getWorkInt( meindex, "对象"), "I|" .. iosdata[1] .. "|")
	elseif type == "A" then--安卓
		local buyflg = other.getString(data,"|",2)
		local payflg = other.getString(data,"|",3)
		if buyflg == "" or payflg == "" then
			return
		end
		if other.atoi(buyflg) < 1 or other.atoi(buyflg) > 6 then
			return
		end
		if other.atoi(payflg) < 1 or other.atoi(payflg) > 2 then
			return
		end
		if other.atoi(payflg) == 1 then
			payflg = "5"
		end
		local orderid = os.date("%Y%m%d%H%M%S",os.time()) .. math.random(1000,9999) .. char.getChar(talkerindex,"账号")
		--token = "INSERT INTO `PayLog` ("
		--							.. "`id` ,"
		--							.. "`cdkey` ,"
		--							.. "`rmb` ,"
		--							.. "`time` ,"
		--							.. "`check`"
		--							.. ")"
		--							.. "VALUES ("
		--							.. "'" 
		--							.. orderid  .. "', '" 
		--							.. char.getChar(talkerindex, "账号") .. "', "
		--							.. androiddata[other.atoi(buyflg)] .. ","
		--							.. "NOW(),0);"
		--ret = sasql.query(token)
		--if ret == 1 then
			lssproto.windows(talkerindex, 106, 0, 0, char.getWorkInt( meindex, "对象"), "A|" .. other.atoi(buyflg) .. "|" .. other.atoi(payflg) .. "|" .. orderid .. "|https://www.51boshao.com/?25server/pay/req.php")
		--end
	end
	--[[if seqno == 0 then
		if data == "" then
			return
		end
		local num = other.atoi(data)
		if num < 1 or num > 6 then
			return
		end
		local rmb = {10,50,100,200,500,1000}
		local point = { 1000, 5300, 11000, 23000, 60000, 130000 }
		local orderid = os.date("%Y%m%d%H%M%S",os.time()) .. math.random(1000,9999)
		local url = "http://www.51boshao.com/182server/pay/return.php"
		token = "INSERT INTO `PayQQ` ("
									.. "`id` ,"
									.. "`cdkey` ,"
									.. "`point` ,"
									.. "`time` ,"
									.. "`check`"
									.. ")"
									.. "VALUES ("
									.. "'" 
									.. orderid  .. "', '" 
									.. char.getChar(talkerindex, "账号") .. "', "
									.. rmb[num] .. ","
									.. "NOW(),0);"				
		ret = sasql.query(token)
		if ret == 1 then
			token = orderid .. "\n" .. rmb[num] .. "\n石器时代[" .. rmb[num] .. "]元充值\n充值金额:" .. rmb[num] .. "元，可获得金币" .. point[num] .. "\n" .. url
			print("\ntoken=" .. token)
			lssproto.windows(talkerindex, 106, "确定", 1, char.getWorkInt( meindex, "对象"), token)
		end
	end]]
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	iosdata = {18,25,30,40,50,68}
	androiddata = {10,50,100,200,500,1000}
	appleu8 = {1,6,18,30,60}
end
function main()
	--第一个商店内容
	Create("充值", 100000, 777, 14, 13, 4)
	data()
end