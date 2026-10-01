function luapetatt(talkerindex,data)
	if data == "" then
		return 0
	end
	local type = other.getString(data,"|",1)
	if type == "B" then--购买宠物特效
		local pethaveid = other.getString(data,"|",2)
		local petattid = other.getString(data,"|",3)
		if pethaveid == "" or petattid == "" then
			return 0
		end
		pethaveid = other.atoi(pethaveid)
		petattid = other.atoi(petattid)
		if pethaveid < 0 or pethaveid > 4 then
			return 0
		end
		if petattid < 1 or petattid > #petattackeffectdata then
			return 0
		end
		if petattackeffectdata[petattid][2] < 0 then
			char.newMessageToCli(talkerindex,-1,"该宠物特效无法购买","白色")
			return 0
		end
		local petindex = char.getCharPet(talkerindex,pethaveid)
		if char.check(petindex) ~= 1 then
			return 0
		end
		local atthaveid = 0
		if petattid <= 32 then
			atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠"),petattid - 1)
		elseif petattid <= 64 then
			atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠1"),petattid - 33)
		elseif petattid <= 96 then
			atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠2"),petattid - 65)
		else
			return 0
		end
		if atthaveid ~= 0 then
			char.newMessageToCli(talkerindex,-1,"该宠物已经拥有此特效","白色")
			return 0
		end
		local myvippoint = sasql.getVipPoint(talkerindex)
		if myvippoint < petattackeffectdata[petattid][2] then
			char.newMessageToCli(talkerindex,-1,"您的金币不足","白色")
			return 0
		end
		sasql.setVipPoint(talkerindex,myvippoint - petattackeffectdata[petattid][2])
		other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,petattackeffectdata[petattid][2]})
		other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,petattackeffectdata[petattid][2]})
		token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -petattackeffectdata[petattid][2] .. "," .. myvippoint .. "," .. myvippoint - petattackeffectdata[petattid][2] .. ",'购买宠物特效扣除" .. petattackeffectdata[petattid][2] .. "金币',NOW())"
		sasql.query(token)
		if petattid <= 32 then
			char.setInt(petindex,"证书骑宠",other.DataOrData(char.getInt(petindex,"证书骑宠"),petattid - 1))
		elseif petattid <= 64 then
			char.setInt(petindex,"证书骑宠1",other.DataOrData(char.getInt(petindex,"证书骑宠1"),petattid - 33))
		elseif petattid <= 96 then
			char.setInt(petindex,"证书骑宠2",other.DataOrData(char.getInt(petindex,"证书骑宠1"),petattid - 65))
		end
		char.sendStatusString(talkerindex,"K" .. pethaveid)
		lssproto.NewSaMenu(char.getFd(talkerindex),19,pethaveid)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
		char.newMessageToCli(talkerindex,-1,"购买特效成功，扣除" .. petattackeffectdata[petattid][2] .. "金币","白色")
	elseif type == "U" then--使用宠物特效
		local pethaveid = other.getString(data,"|",2)
		local petattid = other.getString(data,"|",3)
		if pethaveid == "" or petattid == "" then
			return 0
		end
		pethaveid = other.atoi(pethaveid)
		petattid = other.atoi(petattid)
		if pethaveid < 0 or pethaveid > 4 then
			return 0
		end
		if petattid < 1 or petattid > #petattackeffectdata then
			return 0
		end
		local petindex = char.getCharPet(talkerindex,pethaveid)
		if char.check(petindex) ~= 1 then
			return 0
		end
		local atthaveid = 0
		if petattid <= 32 then
			atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠"),petattid - 1)
		elseif petattid <= 64 then
			atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠1"),petattid - 33)
		elseif petattid <= 96 then
			atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠2"),petattid - 65)
		else
			return 0
		end
		if atthaveid == 0 then
			char.newMessageToCli(talkerindex,-1,"该宠物还没有拥有此特效","白色")
			return 0
		end
		char.setInt(petindex,"攻击特效",petattackeffectdata[petattid][1])
		char.newMessageToCli(talkerindex,-1,"设置特效成功.","白色")
		char.sendStatusString(talkerindex,"K" .. pethaveid)
	elseif type == "D" then--卸下宠物特效
		local pethaveid = other.getString(data,"|",2)
		if pethaveid == "" then
			return 0
		end
		pethaveid = other.atoi(pethaveid)
		local petindex = char.getCharPet(talkerindex,pethaveid)
		if char.check(petindex) ~= 1 then
			return 0
		end
		if char.getInt(petindex,"攻击特效") <= 0 then
			char.newMessageToCli(talkerindex,-1,"该宠物还没有使用特效","白色")
			return 0
		end
		char.setInt(petindex,"攻击特效",0)
		char.sendStatusString(talkerindex,"K" .. pethaveid)
	end
	return 0
end

function petattupdate(petindex)
	if char.getInt(petindex,"攻击特效") > 0 then
		if char.getInt(petindex,"证书骑宠") == 0 and char.getInt(petindex,"证书骑宠1") == 0 and char.getInt(petindex,"证书骑宠2") == 0 then
			for i=1,#petattackeffectdata do
				if char.getInt(petindex,"攻击特效") == petattackeffectdata[i][1] then
					if i <= 32 then
						char.setInt(petindex,"证书骑宠",other.DataOrData(char.getInt(petindex,"证书骑宠"),i - 1))
					elseif i <= 64 then
						char.setInt(petindex,"证书骑宠1",other.DataOrData(char.getInt(petindex,"证书骑宠1"),i - 33))
					elseif i <= 96 then
						char.setInt(petindex,"证书骑宠2",other.DataOrData(char.getInt(petindex,"证书骑宠1"),i - 65))
					end
				end
			end
		end
	end
	return 0
end

function petattuse(talkerindex,petindex,attno)
	local petattid = 0
	--print("[petatterrect:petattuse]",talkerindex,petindex,attno)
	for i=1,#petattackeffectdata do
		if attno == petattackeffectdata[i][1] then
			petattid = i
			break
		end
	end
	--print("[petatterrect:petattuse]petattid",petattid)
	if petattid == 0 then
		char.newMessageToCli(talkerindex,-1,"不支持该属性.","白色")
		return 0
	end
	local atthaveid = 0
	if petattid <= 32 then
		atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠"),petattid - 1)
	elseif petattid <= 64 then
		atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠1"),petattid - 33)
	elseif petattid <= 96 then
		atthaveid = other.DataAndData(char.getInt(petindex,"证书骑宠2"),petattid - 65)
	else
		char.newMessageToCli(talkerindex,-1,"不支持该属性.","白色")
		return 0
	end
	if atthaveid ~= 0 then
		char.newMessageToCli(talkerindex,-1,"该宠物已经拥有此特效","白色")
		return 0
	end
	if petattid <= 32 then
		char.setInt(petindex,"证书骑宠",other.DataOrData(char.getInt(petindex,"证书骑宠"),petattid - 1))
	elseif petattid <= 64 then
		char.setInt(petindex,"证书骑宠1",other.DataOrData(char.getInt(petindex,"证书骑宠1"),petattid - 33))
	elseif petattid <= 96 then
		char.setInt(petindex,"证书骑宠2",other.DataOrData(char.getInt(petindex,"证书骑宠1"),petattid - 65))
	end
	return 1
end

function ShowTalked(talkerindex,petno)
	if char.check(talkerindex) ~= 1 then
		return 0
	end
	local petindex = char.getCharPet(talkerindex,petno - 1)
	if char.check(petindex) ~= 1 then
		return 0
	end
	--玩家身上的金币|第几只宠购买(0-4,指玩家身上的宠物)|玩家拥有特效动画编号(没则0)|特效数量|特效1|价格1..特效N|价格N
	token = "L|" .. sasql.getVipPoint(talkerindex) .. "|" .. petno - 1 .. "|" .. char.getInt(petindex,"攻击特效") .. "|" .. #attackeffectdata
	for i=1,#attackeffectdata do
		token = token .. "|" .. attackeffectdata[i][1] .. "|" .. attackeffectdata[i][2]
	end
	lssproto.windows(talkerindex, 1002, 0, 0, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "G" then
		if other.getString(data,"|",2) ~= "" and other.getString(data,"|",3) ~= "" then
			local buyeffectindex = other.atoi(other.getString(data,"|",2))
			local petnum = other.atoi(other.getString(data,"|",3))
			if buyeffectindex < 1 or buyeffectindex > #attackeffectdata then
				return
			end
			if petnum < 0 or petnum > 4 then
				return
			end
			local petindex = char.getCharPet(talkerindex,petnum)
			if char.check(petindex) ~= 1 then
				return
			end
			if char.getInt(petindex,"攻击特效") == attackeffectdata[buyeffectindex][1] then
				char.newMessageToCli(talkerindex,-1,"您已经拥有该特效","白色")
				return
			end
			if sasql.getVipPoint(talkerindex) < attackeffectdata[buyeffectindex][2] then
				char.newMessageToCli(talkerindex,-1,"金币不足" .. attackeffectdata[buyeffectindex][2],"白色")
				return
			end
			char.setInt(petindex,"攻击特效",attackeffectdata[buyeffectindex][1])
			local myvippoint = sasql.getVipPoint(talkerindex)
			sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - attackeffectdata[buyeffectindex][2])
			other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,attackeffectdata[buyeffectindex][2]})
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,attackeffectdata[buyeffectindex][2]})
			token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -attackeffectdata[buyeffectindex][2] .. "," .. myvippoint .. "," .. myvippoint - attackeffectdata[buyeffectindex][2] .. ",'购买宠物特效扣除" .. attackeffectdata[buyeffectindex][2] .. "金币',NOW())"
			sasql.query(token)
			char.newMessageToCli(talkerindex,-1,"购买特效成功，扣除" .. attackeffectdata[buyeffectindex][2] .. "金币","白色")
			token = "L|" .. sasql.getVipPoint(talkerindex) .. "|" .. petnum .. "|" .. char.getInt(petindex,"攻击特效") .. "|" .. #attackeffectdata
			for i=1,#attackeffectdata do
				token = token .. "|" .. attackeffectdata[i][1] .. "|" .. attackeffectdata[i][2]
			end
			lssproto.windowsupdate(talkerindex, 1002, 0, 0, char.getWorkInt( npcindex, "对象"), token)
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
	attackeffectdata = {
		{102245,88888}
		,{102218,15000}
		,{102252,15000}
		,{102255,25000}
		,{102208,10000}
	}
						
	petattackeffectdata = {
		{102245,88888}
		,{102218,15000}
		,{102252,15000}
		,{102255,25000}
		,{102208,10000}
		,{102251,-1}
		,{102250,-1}
		,{102249,-1}
		,{125061,-1}
		,{102226,-1}
		,{125065,-1}
		,{125073,-1}
		,{125074,-1}
		,{109500,-1}
		,{109511,-1}
		,{125068,-1}
		,{109502,-1}
		,{109503,-1}
		,{109508,-1}
		,{109506,-1}
		,{109505,-1}
		,{109504,-1}
		,{109501,-1}
		,{109507,-1}
		,{109509,-1}
		,{109512,-1}
		,{109513,-1}
		,{109515,-1}
		,{109514,-1}
		,{125079,-1}
		,{125081,-1}
		,{125091,-1}	
	}
end
function main()
	--第一个商店内容
	Create("宠物攻击NPC", 100000, 777, 27, 39, 4)
	data()
end