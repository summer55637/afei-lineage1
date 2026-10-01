function getPetCost(talkerindex,petindex)
	levelcost = char.getInt(petindex,"等级") * char.getInt(petindex,"等级") * 10
	getlevel = char.getInt(petindex,"抓捕等级") * char.getInt(petindex,"抓捕等级") * 10
	if getlevel == 0 then
		getlevel = 1
	end
	if char.getInt(petindex,"转数") == 1 then
		getlevel = 10
	end
	cost = levelcost - getlevel + char.getInt(petindex,"等级") * 10
	petai = char.getWorkInt(petindex, "忠诚")
	charm = char.getInt(talkerindex, "魅力")
	charm = charm + petai
	if charm < 20 then
		charm = 20
	end
	if charm > 10000 then
		charm = 10000
	end
	charm = math.floor(charm / 2)
	cost = math.floor(cost * charm / 100)
	if cost > 1000000 then
		cost = 1000000
	end
	if cost < 0 then
		cost = 0
	end
	return cost
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = char.getChar(meindex,"名字") .. "||1|卖出宠物" 
		lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 1 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num == 1 then
			lssproto.windows(talkerindex, "宠物框", 8, 2, char.getWorkInt( meindex, "对象"), "")
		end
	elseif seqno == 2 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		local petindex = char.getCharPet(talkerindex,num - 1)
		if char.check(petindex) ~= 1 then
			return
		end
		if char.getInt(talkerindex,"转数") < 1 and char.getInt(talkerindex,"等级") < 50 then
		char.newMessageToCli(talkerindex,-1,"0转50级以下无法贩卖宠物","白色")
		return 0
	    end
		if char.getInt(petindex,"守护兽") == 1 then
			char.newMessageToCli(talkerindex, -1, "守护兽无法贩卖", "白色")
			return
		end
		if char.getInt(petindex,"安全锁") > 0 then
			char.newMessageToCli(talkerindex, -1, "绑定宠物无法贩卖", "白色")
			return
		end
		local petname = char.getChar(petindex,"名字")
		if string.sub(petname,1,1) == "*" then
			char.newMessageToCli(talkerindex, -1, "绑定宠物无法贩卖", "白色")
			return
		end
		if char.getInt(talkerindex,"骑宠") == num - 1 then
			char.newMessageToCli(talkerindex, -1, "骑乘中宠物无法贩卖", "白色")
			return
		end
		local petcost = getPetCost(talkerindex,petindex)
		token = "您确定要卖出[" .. char.getChar(petindex,"名字") .. "]吗?"
			 .. "卖出价格:" .. petcost .. "石币"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 10 + num, char.getWorkInt( meindex, "对象"), token)
	elseif seqno >= 11 and seqno <= 15 then
		if select ~= 1 then
			return
		end
		num = seqno - 10
		local petindex = char.getCharPet(talkerindex,num - 1)
		if char.check(petindex) ~= 1 then
			return
		end
		if char.getInt(petindex,"守护兽") == 1 then
			char.newMessageToCli(talkerindex, -1, "守护兽无法贩卖", "白色")
			return
		end
		if char.getInt(petindex,"安全锁") > 0 then
			char.newMessageToCli(talkerindex, -1, "绑定宠物无法贩卖", "白色")
			return
		end
		local petname = char.getChar(petindex,"名字")
		if string.sub(petname,1,1) == "*" then
			char.newMessageToCli(talkerindex, -1, "绑定宠物无法贩卖", "白色")
			return
		end
		if char.getInt(talkerindex,"骑宠") == num - 1 then
			char.newMessageToCli(talkerindex, -1, "骑乘中宠物无法贩卖", "白色")
			return
		end
		local petcost = getPetCost(talkerindex,petindex)
		if char.getInt(talkerindex,"石币") + petcost > char.getMaxHaveGold(talkerindex) then
			char.newMessageToCli(talkerindex, -1, "贩卖后石币超过最大上限", "白色")
			return
		end
		local petname = char.getChar(petindex,"名字")
		char.DelPet(talkerindex,petindex)
		char.setInt(talkerindex,"石币",char.getInt(talkerindex,"石币") + petcost)
		char.newMessageToCli(talkerindex, -1, "卖出宠物" .. petname, "白色")
		char.newMessageToCli(talkerindex, -1, "获得石币" .. petcost, "白色")
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	
end

function main()
	Create("宠物商店", 16017, 2003, 11, 12, 4)
	data()
end