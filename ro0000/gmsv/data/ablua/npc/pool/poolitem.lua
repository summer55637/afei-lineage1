function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function ShowTalked(meindex, talkerindex, showtype )
	if char.getInt(talkerindex,"地图号") == 41011 or char.getInt(talkerindex,"地图号") == 41012 then
		char.newMessageToCli(talkerindex,-1,"此地图不可以使用仓库","白色")
		return 0
	end
	poolitemnum = 15
	ret = sasql.query("select `itemnum` from `pooldata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			sasql.fetch_row()
			poolitemnum = other.atoi(sasql.data(1))
		else
			sasql.query("insert into `pooldata` values ('" .. char.getChar(talkerindex,"账号") .. "',10,15)")
		end
		ret = sasql.query("select * from `poolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `uid`!='' and `uid`!='" .. char.getChar(talkerindex,"UID") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				sasql.query("delete from `poolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `uid`!='' and `uid`!='" .. char.getChar(talkerindex,"UID") .. "'")
			end
		end
		ret = sasql.query("select * from `poolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and (`uid`='' or `uid`='" .. char.getChar(talkerindex,"UID") .. "')")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				token = "L|" .. sqlnum .. "|" .. poolitemnum .. "|" .. vippoint[poolitemnum - 15 + 1] .. "|"
				for i=1,sqlnum do
					sasql.fetch_row()
					local image = other.atoi(sasql.data(40))
					if image == -1 then
						image = item.getgraNoFromITEMtabl(other.atoi(sasql.data(2)))
					end
					
					token = token .. sasql.data(33)  .. "|" .. image .. "|" .. sasql.data(4) .. "|" .. sasql.data(39) .. "|"--道具颜色|道具形像|叠加数|仓库道具索引
				end
			else
				token = "L|0|" .. poolitemnum .. "|" .. vippoint[poolitemnum - 15 + 1]
			end
			if showtype == 1 then
				lssproto.windows(talkerindex, "仓库道具框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
			else
				lssproto.NewSaMenu(char.getFd(talkerindex),2, token)
			end
		end
	end
	return 0
end

function ShowWindowTalked(meindex, talkerindex,data, showtype )
	if data == "" then
		return 0
	end
	if char.getInt(talkerindex,"地图号") == 41011 or char.getInt(talkerindex,"地图号") == 41012 then
		char.newMessageToCli(talkerindex,-1,"此地图不可以使用仓库","白色")
		return 0
	end
	local type = other.getString(data,"|",1)
	if type == "C" then
		poolitemnum = 15
		ret = sasql.query("select `itemnum` from `pooldata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				sasql.fetch_row()
				poolitemnum = other.atoi(sasql.data(1))
			else
				sasql.query("insert into `pooldata` values ('" .. char.getChar(talkerindex,"账号") .. "',10,15)")
			end
		end
		ret = sasql.query("select * from `poolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum >= poolitemnum then
				char.newMessageToCli(talkerindex,-1,"您的仓库已满","白色")
				return 0
			else
				local itemhaveid = other.getString(data,"|",2)
				if itemhaveid == "" then
					return 0
				end
				if other.atoi(itemhaveid) < 9 or other.atoi(itemhaveid) > 23 then
					return 0
				end
				itemindex = char.getItemIndex(talkerindex,other.atoi(itemhaveid))
				if item.check(itemindex) == 1 then
					if item.getInt(itemindex,"丢弃消失") == 0 and item.getChar(itemindex,"使用函数名") ~= "ITEM_useSkup" then
						local playeruid = ""
						if string.sub(item.getChar(itemindex,"名称"),1,1) == "*" then
							playeruid = char.getChar(talkerindex,"UID")
						end
						token = "insert into `poolitem` VALUES ('" .. char.getChar(talkerindex,"账号") .. "'," 
							.. item.getInt(itemindex,"序号") .. ","
							.. item.getInt(itemindex,"次数")
							.. "," .. item.getInt(itemindex,"堆叠") .. "," .. item.getInt(itemindex,"最小度") .. "," .. item.getInt(itemindex,"最大度") .. "," .. item.getInt(itemindex,"伤")
							.. "," .. item.getInt(itemindex,"吸") .. "," .. item.getInt(itemindex,"最小攻击") .. "," .. item.getInt(itemindex,"最大攻击") .. "," .. item.getInt(itemindex,"攻")
							.. "," .. item.getInt(itemindex,"防") .. "," .. item.getInt(itemindex,"敏") .. "," .. item.getInt(itemindex,"HP") .. "," .. item.getInt(itemindex,"MP")
							.. "," .. item.getInt(itemindex,"运气") .. "," .. item.getInt(itemindex,"魅力") .. "," .. item.getInt(itemindex,"回避") .. "," .. item.getInt(itemindex,"属性")
							.. "," .. item.getInt(itemindex,"属性比例") .. "," .. item.getInt(itemindex,"格档") .. "," .. item.getInt(itemindex,"次序") .. "," .. item.getInt(itemindex,"负重")
							.. "," .. item.getInt(itemindex,"命中") .. "," .. item.getInt(itemindex,"忽防") .. "," .. item.getInt(itemindex,"毒耐") .. "," .. item.getInt(itemindex,"麻耐")
							.. "," .. item.getInt(itemindex,"睡耐") .. "," .. item.getInt(itemindex,"石耐") .. "," .. item.getInt(itemindex,"酒耐") .. "," .. item.getInt(itemindex,"混耐")
							.. "," .. item.getInt(itemindex,"会心") .. "," .. item.getInt(itemindex,"颜色") .. "," .. item.getInt(itemindex,"合成") .. ",'" .. item.getChar(itemindex,"名称")
							.. "','" .. item.getChar(itemindex,"显示名") .. "','" .. item.getChar(itemindex,"说明") .. "','" .. item.getChar(itemindex,"字段") .. "','" .. item.getChar(itemindex,"编码") 
							.. "'," .. item.getInt(itemindex,"图号") ..",".. item.getInt(itemindex,"安全锁") .. "," .. item.getInt(itemindex,"物品时间") 
							..",".. item.getInt(itemindex,"精灵")..",'"..item.getChar(itemindex,"类型代码").."','"..item.getChar(itemindex,"镶嵌代码").."','".. playeruid.. "')"
						ret = sasql.query(token)
						if ret == 1 then
							token = "Z|" .. item.getInt(itemindex,"颜色") .. "|" .. item.getInt(itemindex,"图号") .. "|" .. item.getInt(itemindex,"堆叠") .. "|" .. item.getChar(itemindex,"编码") .. "|"
							if showtype == 1 then
								lssproto.windowsupdate(talkerindex, "仓库道具框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
							else
								lssproto.NewSaMenu(char.getFd(talkerindex), 2, token)
							end
							if item.getInt(itemindex,"堆叠") > 1 then
								char.DelPileItemMess(talkerindex,other.atoi(itemhaveid))
                                                                         
							else
								char.DelItem(talkerindex,other.atoi(itemhaveid))

							end
							--char.charSaveFromConnect(talkerindex)
						end
					else
						char.newMessageToCli(talkerindex,-1,"特殊道具无法存入仓库","白色")
						return 0
					end
				end
			end
		end
	elseif type == "B" then
		local uid = other.getString(data,"|",2)
		if uid == "" then
			return 0
		end
		--print("[poolitem:ShowWindowTalked]",uid)
		ret = sasql.query("select * from `poolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `ITEM_UNIQUECODE`='" .. uid .. "'")
		--print("[poolitem:ShowWindowTalked]",ret)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			--print("[poolitem:ShowWindowTalked]num",sqlnum)
			if sqlnum > 0 then
				if checkEmptItemNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex,-1,"道具栏无空位，无法取回道具","白色")
					return 0
				end
				sasql.fetch_row()
				local itemid = other.atoi(sasql.data(2))
				local ITEM_DAMAGEBREAK = other.atoi(sasql.data(3))
				local ITEM_USEPILENUMS = other.atoi(sasql.data(4))
				local ITEM_DAMAGECRUSHE = other.atoi(sasql.data(5))
				local ITEM_MAXDAMAGECRUSHE = other.atoi(sasql.data(6))
				local ITEM_OTHERDAMAGE = other.atoi(sasql.data(7))
				local ITEM_OTHERDEFC = other.atoi(sasql.data(8))
				local ITEM_ATTACKNUM_MIN = other.atoi(sasql.data(9))
				local ITEM_ATTACKNUM_MAX = other.atoi(sasql.data(10))
				local ITEM_MODIFYATTACK = other.atoi(sasql.data(11))
				local ITEM_MODIFYDEFENCE = other.atoi(sasql.data(12))
				local ITEM_MODIFYQUICK = other.atoi(sasql.data(13))
				local ITEM_MODIFYHP = other.atoi(sasql.data(14))
				local ITEM_MODIFYMP = other.atoi(sasql.data(15))
				local ITEM_MODIFYLUCK = other.atoi(sasql.data(16))
				local ITEM_MODIFYCHARM = other.atoi(sasql.data(17))
				local ITEM_MODIFYAVOID = other.atoi(sasql.data(18))
				local ITEM_MODIFYATTRIB = other.atoi(sasql.data(19))
				local ITEM_MODIFYATTRIBVALUE = other.atoi(sasql.data(20))
				local ITEM_MODIFYARRANGE = other.atoi(sasql.data(21))
				local ITEM_MODIFYSEQUENCE = other.atoi(sasql.data(22))
				local ITEM_ATTACHPILE = other.atoi(sasql.data(23))
				local ITEM_HITRIGHT = other.atoi(sasql.data(24))
				local ITEM_NEGLECTGUARD = other.atoi(sasql.data(25))
				local ITEM_POISON = other.atoi(sasql.data(26))
				local ITEM_PARALYSIS = other.atoi(sasql.data(27))
				local ITEM_SLEEP = other.atoi(sasql.data(28))
				local ITEM_STONE = other.atoi(sasql.data(29))
				local ITEM_DRUNK = other.atoi(sasql.data(30))
				local ITEM_CONFUSION = other.atoi(sasql.data(31))
				local ITEM_CRITICAL = other.atoi(sasql.data(32))
				local ITEM_COLOER = other.atoi(sasql.data(33))
				local ITEM_MERGEFLG = other.atoi(sasql.data(34))
				local ITEM_NAME = sasql.data(35)
				local ITEM_SECRETNAME = sasql.data(36)
				local ITEM_EFFECTSTRING = sasql.data(37)
				local ITEM_ARGUMENT = sasql.data(38)
				local ITEM_UNIQUECODE = sasql.data(39)
				local ITEM_BASEIMAGENUMBER = other.atoi(sasql.data(40))				
				local ITEM_LOCKED = other.atoi(sasql.data(41))
				local ITEM_USETIME = other.atoi(sasql.data(42))
				local ITEM_MAGICID = other.atoi(sasql.data(43))
				local ITEM_TYPECODE = other.atoi(sasql.data(44))
				local ITEM_INLAYCODE = other.atoi(sasql.data(45))
				-- local PLAYER_UID = sasql.data(47)

				-- if PLAYER_UID ~= "" then
				-- 	if PLAYER_UID ~= char.getChar(talkerindex,"UID") then
				-- 		return 0
				-- 	end
				-- end
				ret = sasql.query("delete from `poolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `ITEM_UNIQUECODE`='" .. uid .. "'")
				--print("[poolitem:ShowWindowTalked]delete",ret,ITEM_USETIME)
				if ret == 1 then
					if ITEM_USETIME <= 0 or ITEM_USETIME > other.time() then
						itemindex = char.Additem(talkerindex,itemid)
						if item.check(itemindex) == 1 then
							item.setInt(itemindex,"次数",ITEM_DAMAGEBREAK)
							item.setInt(itemindex,"堆叠",ITEM_USEPILENUMS)
							item.setInt(itemindex,"最小度",ITEM_DAMAGECRUSHE)
							item.setInt(itemindex,"最大度",ITEM_MAXDAMAGECRUSHE)
							item.setInt(itemindex,"伤",ITEM_OTHERDAMAGE)
							item.setInt(itemindex,"吸",ITEM_OTHERDEFC)
							item.setInt(itemindex,"最小攻击",ITEM_ATTACKNUM_MIN)
							item.setInt(itemindex,"最大攻击",ITEM_ATTACKNUM_MAX)
							item.setInt(itemindex,"攻",ITEM_MODIFYATTACK)
							item.setInt(itemindex,"防",ITEM_MODIFYDEFENCE)
							item.setInt(itemindex,"敏",ITEM_MODIFYQUICK)
							item.setInt(itemindex,"HP",ITEM_MODIFYHP)
							item.setInt(itemindex,"MP",ITEM_MODIFYMP)
							item.setInt(itemindex,"运气",ITEM_MODIFYLUCK)
							item.setInt(itemindex,"魅力",ITEM_MODIFYCHARM)
							item.setInt(itemindex,"回避",ITEM_MODIFYAVOID)
							item.setInt(itemindex,"属性",ITEM_MODIFYATTRIB)
							item.setInt(itemindex,"属性比例",ITEM_MODIFYATTRIBVALUE)
							item.setInt(itemindex,"格档",ITEM_MODIFYARRANGE)
							item.setInt(itemindex,"次序",ITEM_MODIFYSEQUENCE)
							item.setInt(itemindex,"负重",ITEM_ATTACHPILE)
							item.setInt(itemindex,"命中",ITEM_HITRIGHT)
							item.setInt(itemindex,"忽防",ITEM_NEGLECTGUARD)
							item.setInt(itemindex,"毒耐",ITEM_POISON)
							item.setInt(itemindex,"麻耐",ITEM_PARALYSIS)
							item.setInt(itemindex,"睡耐",ITEM_SLEEP)
							item.setInt(itemindex,"石耐",ITEM_STONE)
							item.setInt(itemindex,"酒耐",ITEM_DRUNK)
							item.setInt(itemindex,"混耐",ITEM_CONFUSION)
							item.setInt(itemindex,"会心",ITEM_CRITICAL)
							item.setInt(itemindex,"颜色",ITEM_COLOER)
							item.setInt(itemindex,"合成",ITEM_MERGEFLG)
							item.setInt(itemindex,"安全锁",ITEM_LOCKED)
							item.setChar(itemindex,"名称",ITEM_NAME)
							item.setChar(itemindex,"显示名",ITEM_SECRETNAME)
							item.setChar(itemindex,"说明",ITEM_EFFECTSTRING)
							item.setChar(itemindex,"字段",ITEM_ARGUMENT)
							if ITEM_BASEIMAGENUMBER ~= -1 then
								item.setInt(itemindex,"图号",ITEM_BASEIMAGENUMBER)
							end
							if ITEM_USETIME > 0 then
								item.setInt(itemindex,"物品时间",ITEM_USETIME)
							end
						end
						for i=9,23 do
							item.UpdataHaveItemOne(talkerindex,i)
						end
						--char.charSaveFromConnect(talkerindex)
					else
						char.newMessageToCli(talkerindex,-1,"您的道具已经到期","白色")
					end
					token = "D|" .. uid .. "|"
					if showtype == 1 then
						lssproto.windowsupdate(talkerindex, "仓库道具框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.NewSaMenu(char.getFd(talkerindex), 2, token)
					end
				end
			end
		end
	elseif type == "X" then
		local uid = other.getString(data,"|",2)
		if uid == "" then
			return 0
		end
		ret = sasql.query("select * from `poolitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `ITEM_UNIQUECODE`='" .. uid .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				if checkEmptItemNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex,-1,"道具栏无空位，无法取回道具","白色")
					return 0
				end
				sasql.fetch_row()
				local itemid = other.atoi(sasql.data(2))
				local ITEM_DAMAGEBREAK = other.atoi(sasql.data(3))
				local ITEM_USEPILENUMS = other.atoi(sasql.data(4))
				local ITEM_DAMAGECRUSHE = other.atoi(sasql.data(5))
				local ITEM_MAXDAMAGECRUSHE = other.atoi(sasql.data(6))
				local ITEM_OTHERDAMAGE = other.atoi(sasql.data(7))
				local ITEM_OTHERDEFC = other.atoi(sasql.data(8))
				local ITEM_ATTACKNUM_MIN = other.atoi(sasql.data(9))
				local ITEM_ATTACKNUM_MAX = other.atoi(sasql.data(10))
				local ITEM_MODIFYATTACK = other.atoi(sasql.data(11))
				local ITEM_MODIFYDEFENCE = other.atoi(sasql.data(12))
				local ITEM_MODIFYQUICK = other.atoi(sasql.data(13))
				local ITEM_MODIFYHP = other.atoi(sasql.data(14))
				local ITEM_MODIFYMP = other.atoi(sasql.data(15))
				local ITEM_MODIFYLUCK = other.atoi(sasql.data(16))
				local ITEM_MODIFYCHARM = other.atoi(sasql.data(17))
				local ITEM_MODIFYAVOID = other.atoi(sasql.data(18))
				local ITEM_MODIFYATTRIB = other.atoi(sasql.data(19))
				local ITEM_MODIFYATTRIBVALUE = other.atoi(sasql.data(20))
				local ITEM_MODIFYARRANGE = other.atoi(sasql.data(21))
				local ITEM_MODIFYSEQUENCE = other.atoi(sasql.data(22))
				local ITEM_ATTACHPILE = other.atoi(sasql.data(23))
				local ITEM_HITRIGHT = other.atoi(sasql.data(24))
				local ITEM_NEGLECTGUARD = other.atoi(sasql.data(25))
				local ITEM_POISON = other.atoi(sasql.data(26))
				local ITEM_PARALYSIS = other.atoi(sasql.data(27))
				local ITEM_SLEEP = other.atoi(sasql.data(28))
				local ITEM_STONE = other.atoi(sasql.data(29))
				local ITEM_DRUNK = other.atoi(sasql.data(30))
				local ITEM_CONFUSION = other.atoi(sasql.data(31))
				local ITEM_CRITICAL = other.atoi(sasql.data(32))
				local ITEM_COLOER = other.atoi(sasql.data(33))
				local ITEM_MERGEFLG = other.atoi(sasql.data(34))
				local ITEM_NAME = sasql.data(35)
				local ITEM_SECRETNAME = sasql.data(36)
				local ITEM_EFFECTSTRING = sasql.data(37)
				local ITEM_ARGUMENT = sasql.data(38)
				local ITEM_UNIQUECODE = sasql.data(39)
				local naijiu = ""
				if ITEM_MAXDAMAGECRUSHE < 1 then
					naijiu = "耐久度：无限"
				else
					ITEM_DAMAGECRUSHE = math.floor(ITEM_DAMAGECRUSHE/1000)
					ITEM_MAXDAMAGECRUSHE = math.floor(ITEM_MAXDAMAGECRUSHE/1000)
					if ITEM_MAXDAMAGECRUSHE < 1 then
						ITEM_MAXDAMAGECRUSHE = 1
					end
					naijiu = "耐久度：" .. math.floor((ITEM_DAMAGECRUSHE*100)/ITEM_MAXDAMAGECRUSHE) .. "%"
				end
				token = "I|" .. uid .. "|" .. ITEM_SECRETNAME .. "|" .. naijiu .. "|" .. ITEM_EFFECTSTRING .. "|"
				if showtype == 1 then
					lssproto.windowsupdate(talkerindex, "仓库道具框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
				else
					lssproto.NewSaMenu(char.getFd(talkerindex), 2, token)
				end
			end
		end
	elseif type == "H" then
		poolitemnum = 15
		ret = sasql.query("select `itemnum` from `pooldata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				sasql.fetch_row()
				poolitemnum = other.atoi(sasql.data(1))
			else
				sasql.query("insert into `pooldata` values ('" .. char.getChar(talkerindex,"账号") .. "',10,15)")
			end
			if vippoint[poolitemnum - 15 + 1] < 0 then
				return 0
			end
			if sasql.getVipPoint(talkerindex) < vippoint[poolitemnum - 15 + 1] then
				char.newMessageToCli(talkerindex,-1,"您的金币不足","白色")
				return 0
			end
			ret = sasql.query("update `pooldata` set `itemnum`=" .. poolitemnum + 1 .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
			if ret == 1 then
				local myvippoint = sasql.getVipPoint(talkerindex)
				sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - vippoint[poolitemnum - 15 + 1])
				other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vippoint[poolitemnum - 15 + 1]})
				other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,vippoint[poolitemnum - 15 + 1]})
				token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -vippoint[poolitemnum - 15 + 1] .. "," .. myvippoint .. "," .. myvippoint - vippoint[poolitemnum - 15 + 1] .. ",'购买道具仓库位置扣除" .. vippoint[poolitemnum - 15 + 1] .. "金币',NOW())"
				sasql.query(token)
				char.newMessageToCli(talkerindex,-1,"扣除金币" .. vippoint[poolitemnum - 15 + 1],"白色")
				token = "H|" .. poolitemnum + 1 .. "|" .. vippoint[poolitemnum - 15 + 1 + 1]
				if showtype == 1 then
					lssproto.windowsupdate(talkerindex, "仓库道具框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
				else
					lssproto.NewSaMenu(char.getFd(talkerindex), 2, token)
				end
				other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
			end
		end
	end
	return 0
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		ShowTalked(meindex, talkerindex, 1 )
	end
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		ShowWindowTalked(meindex, talkerindex,data, 1 )
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
	vippoint = {10,10,10,10,10,10,10,10,10,10,20,20,40,40,60,60,80,80,100,100,120,120,140,140,160,160,180,180,200,200,-1}
end

function main()
	data()
	Create("寄放店", 16055, 1009, 14, 13, 4)
	Create("寄放店", 16056, 2009, 17, 34, 6)
	Create("寄放店", 16201, 3009, 18, 40, 4)
	Create("寄放店", 16201, 4009, 15, 13, 4)
	Create("斗技场的寄放店", 16027, 130, 4, 14, 4)
	Create("道具寄放店", 16400, 7119, 15, 6, 4)
	Create("道具寄放店", 16055, 7203, 6, 9, 4)
	Create("道具寄放店", 16055, 2005, 8, 2, 4)
end

