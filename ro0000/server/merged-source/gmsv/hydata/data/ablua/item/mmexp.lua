function NetLoopFunction()
end

function showmmexp(charaindex)
	for j=9,23 do
		local itemindex = char.getItemIndex(charaindex, j)
		if item.check(itemindex) == 1 then
			if item.getChar(itemindex,"使用函数名") == "ITEM_MMEXP" and char.getWorkChar(charaindex,"MM道具") == item.getChar(itemindex,"编码") then
				local itemdata = item.getChar(itemindex,"字段")
				local itemnum = 0
				local itemquick = 0
				local itemvigor = 0
				if itemdata ~= "" then
					itemnum = other.atoi(other.getString(itemdata,"|",1))
					itemquick = other.atoi(other.getString(itemdata,"|",2))
					itemvigor = other.atoi(other.getString(itemdata,"|",3))
					local z,x = math.modf(itemnum / maxnum)
					token = "L|" .. math.floor(x * 100) .. "|" .. char.getInt(charaindex,"活力") .. "|" .. itemvigor
					lssproto.sendNewMapBattleInfo(char.getFd(charaindex),3,token)
				end
				return 0
			end
		end
	end
	token = "L|-1|" .. char.getInt(charaindex,"活力") .. "|0"
	lssproto.sendNewMapBattleInfo(char.getFd(charaindex),3,token)
	return 0
end

function addmm(charaindex,data)
	local type = other.atoi(data)
	if type == 1 then
		if char.getWorkChar(charaindex,"MM道具") ~= "" then
			return 0
		end
		lssproto.windows(charaindex,1025,0,0,char.getWorkInt(npcindex,"对象"),"1")
	elseif type == 2 then
		for j=9,23 do
			local itemindex = char.getItemIndex(charaindex, j)
			if item.check(itemindex) == 1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_MMEXP" and char.getWorkChar(charaindex,"MM道具") == item.getChar(itemindex,"编码") then
					local itemdata = item.getChar(itemindex,"字段")
					local itemnum = 0
					local itemquick = 0
					local itemvigor = 0
					if itemdata ~= "" then
						itemnum = other.atoi(other.getString(itemdata,"|",1))
						itemquick = other.atoi(other.getString(itemdata,"|",2))
						itemvigor = other.atoi(other.getString(itemdata,"|",3))
						lssproto.windows(charaindex,1036,0,0,char.getWorkInt(npcindex,"对象"),itemquick)
					end
					return 0
				end
			end
		end
	end
	return 0
end

function mmexp(itemindex, charaindex, toindex, haveitemindex)
	print("[mmexp:mmexp]",itemindex, charaindex, toindex, haveitemindex)
	local itemdata = item.getChar(itemindex,"字段")
	local itemnum = 0
	local itemquick = 0
	if itemdata == "" then
		return
	end
	local itemnum = other.atoi(other.getString(itemdata,"|",1))
	if itemnum < maxnum then
		print("[mmexp:mmexp]num/max:",itemnum,maxnum)
		char.TalkToCli(charaindex, -1, "[温馨提示]您的ＭＭ玩偶还没搜集到了100%的经验，无法使用哦！", "随机色")
		return
	end
	petindex = toindex
	if char.check(petindex) ~= 1 then
		return
	end
	local petid = char.getInt(petindex,"宠ID")
	if petid ~= 718 then
		char.TalkToCli(charaindex, -1, "[温馨提示]ＭＭ玩偶只能对不满79级的ＭＭ使用哦！", "随机色")
		return
	end
	if char.getInt(petindex,"等级") >= 79 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您的ＭＭ已经79级了哦，不需要使用玩偶升级了！", "随机色")
		return
	end
	local MAXVARIABLEAI = 100*100
	local MINVARIABLEAI = -100*100
	local LevelUpPoint = 0
	local iWork = 0
	while(char.getInt(petindex, "等级")<79) do
		LevelUpPoint = other.NumLeftToNum(50,24) + other.NumLeftToNum(50,16) + other.NumLeftToNum(50,8) + other.NumLeftToNum(50,0)
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
		if petindex == char.getCharPet(charaindex,i - 1) then
			j = i
			break
		end
	end
	char.sendStatusString(charaindex, "K" .. j - 1)
	char.DelItem(charaindex, haveitemindex)
	char.TalkToCli(charaindex, -1, "[温馨提示]恭喜您的MM已经升到79级！", "随机色")
	--[[char.setWorkInt(charaindex,"NPC临时1",itemindex)
	lssproto.windows(charaindex, "宠物框", "取消", 0, char.getWorkInt(npcindex,"对象"), token)]]
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	print("[mmexp:WindowTalked]",meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	if data == "A" then
		for j=9,23 do
			local itemindex = char.getItemIndex(talkerindex, j)
			if item.check(itemindex) == 1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_MMEXP" and char.getWorkChar(talkerindex,"MM道具") == item.getChar(itemindex,"编码") then
					local itemdata = item.getChar(itemindex,"字段")
					local itemnum = 0
					local itemquick = 0
					local itemvigor = 0
					if itemdata ~= "" then
						itemnum = other.atoi(other.getString(itemdata,"|",1))
						itemquick = other.atoi(other.getString(itemdata,"|",2))
						itemvigor = other.atoi(other.getString(itemdata,"|",3))
						if itemquick == 1 then
							char.newMessageToCli(talkerindex, -1, "该MM玩偶已经加速了", "白色")
							return
						end
						local myvippoint = sasql.getVipPoint(talkerindex)
						if myvippoint < 1000 then
							char.newMessageToCli(talkerindex, -1, "您的金币不足1000", "白色")
							lssproto.windows(talkerindex, 1038, 0, -1, -1, "2")
							return
						end
						
						sasql.setVipPoint(talkerindex,myvippoint - 1000)
						other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,1000})
						other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,1000})
						token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -1000 .. "," .. myvippoint .. "," .. myvippoint - 1000 .. ",'MM加速球扣除1000金币',NOW())"
						sasql.query(token)
						itemquick = 1
						item.setChar(itemindex,"字段",itemnum .. "|" .. itemquick .. "|" .. itemvigor)
						char.newMessageToCli(talkerindex, -1, "扣除1000金币", "白色")
						char.newMessageToCli(talkerindex, -1, "MM玩偶加速成功", "白色")
					end
					return
				end
			end
		end
	else
		local haveitemid = other.atoi(data)
		if haveitemid < 9 or haveitemid > 23 then
			return
		end
		if char.getWorkChar(talkerindex,"MM道具") ~= "" then
			return
		end
		local itemindex = char.getItemIndex(talkerindex,haveitemid)
		if item.check(itemindex) == 1 then
			if item.getChar(itemindex,"使用函数名") == "ITEM_MMEXP" then
				local itemdata = item.getChar(itemindex,"字段")
				local itemnum = 0
				local itemquick = 0
				local itemvigor = 0
				if itemdata ~= "" then
					itemnum = other.atoi(other.getString(itemdata,"|",1))
					itemquick = other.atoi(other.getString(itemdata,"|",2))
					itemvigor = other.atoi(other.getString(itemdata,"|",3))
					local z,x = math.modf(itemnum / maxnum)
					token = "U|" .. math.floor(x * 100) .. "|" .. char.getInt(talkerindex,"活力") .. "|" .. itemvigor
					lssproto.sendNewMapBattleInfo(char.getFd(talkerindex),3,token)
					char.setWorkChar(talkerindex,"MM道具",item.getChar(itemindex,"编码"))
				end
			end
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
	maxnum = 1440
end


function main()
	data()
	Create("MM升级丹", 101156, 777, 17, 17, 4)
	item.addLUAListFunction( "ITEM_MMEXP", "mmexp", "")
end