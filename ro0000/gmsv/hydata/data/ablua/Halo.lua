function queryHalo(charaindex)
	local mycdkey = char.getChar(charaindex,"账号")
	if playerhalodata[mycdkey] == nil then
		local Haloindexdata = 0
		local flg1 = 0
		local flg2 = 0
		local flg3 = 0
		local Halotimedata = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
		local delindex = {}
		local ret = sasql.query("select * from `halo` where `cdkey`='" .. mycdkey .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				Haloindexdata = other.atoi(sasql.data(2))
				flg1 = other.atoi(sasql.data(3))
				flg2 = other.atoi(sasql.data(4))
				flg3 = other.atoi(sasql.data(5))
				for i=1,96 do
					Halotimedata[i] = other.atoi(sasql.data(5 + i))
					if Halotimedata[i] > 0 and Halotimedata[i] <= other.time() then
						delindex[#delindex + 1] = i
						Halotimedata[i] = 0
					end
				end
				if #delindex > 0 then
					for i=1,#delindex do
						if delindex[i] <= 32 then
							flg1 = other.DataNotData(flg1,delindex[i] - 1)
						elseif  delindex[i] <= 64 then
							flg2 = other.DataNotData(flg2,delindex[i] - 32- 1)
						elseif  delindex[i] <= 96 then
							flg3 = other.DataNotData(flg3,delindex[i] - 64- 1)
						end
					end
					token = "update `halo` set `flg1`=" .. flg1 .. ",`flg2`=" .. flg2 .. ",`flg3`=" .. flg3
					for i=1,#delindex do
						token = token .. ",`time" .. delindex[i] .. "`=0"
					end
					token = token .. " where `cdkey`='" .. mycdkey .. "'"
					sasql.query(token)
				end
				if Haloindexdata > 0 then
					if Haloindexdata <= 32 then
						if other.DataAndData(flg1,Haloindexdata - 1) == 0 then
							Haloindexdata = 0
							updateuseHalo(charaindex,Haloindexdata)
						end
					elseif Haloindexdata <= 64 then
						if other.DataAndData(flg2,Haloindexdata - 32 - 1) == 0 then
							Haloindexdata = 0
							updateuseHalo(charaindex,Haloindexdata)
						end
					elseif Haloindexdata <= 96 then
						if other.DataAndData(flg3,Haloindexdata - 64 - 1) == 0 then
							Haloindexdata = 0
							updateuseHalo(charaindex,Haloindexdata)
						end
					end
				end
			end
		end
		playerhalodata[mycdkey] = {}
		playerhalodata[mycdkey][1] = Haloindexdata
		playerhalodata[mycdkey][2] = flg1
		playerhalodata[mycdkey][3] = flg2
		playerhalodata[mycdkey][4] = flg3
		playerhalodata[mycdkey][5] = Halotimedata
	end
	return playerhalodata[mycdkey][1],playerhalodata[mycdkey][2],playerhalodata[mycdkey][3],playerhalodata[mycdkey][4],playerhalodata[mycdkey][5]
end

function updateuseHalo(charaindex,Haloindex)
	local mycdkey = char.getChar(charaindex,"账号")
	sasql.query("update `halo` set `index`=" .. Haloindex .. " where `cdkey`='" .. mycdkey .. "'")
	if playerhalodata[mycdkey] == nil then
		local Halotimedata = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
		playerhalodata[mycdkey] = {}
		playerhalodata[mycdkey][1] = Haloindex
		playerhalodata[mycdkey][2] = 0
		playerhalodata[mycdkey][3] = 0
		playerhalodata[mycdkey][4] = 0
		playerhalodata[mycdkey][5] = Halotimedata
	else
		playerhalodata[mycdkey][1] = Haloindex
	end
end

function updateHalo(charaindex,Haloindex,flg1,flg2,flg3,type,Halotime)
	local mycdkey = char.getChar(charaindex,"账号")
	local ret = sasql.query("select * from `halo` where `cdkey`='" .. mycdkey .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.query("update `halo` set `index`=" .. Haloindex .. ",`flg1`=" .. flg1 .. ",`flg2`=" .. flg2.. ",`flg3`=" .. flg3 .. ",`time" .. type .. "`=" .. Halotime .. " where `cdkey`='" .. mycdkey .. "'")
		else
			sasql.query("insert into `halo` (`cdkey`) values ('" .. mycdkey .. "')")
			sasql.query("update `halo` set `index`=" .. Haloindex .. ",`flg1`=" .. flg1 .. ",`flg2`=" .. flg2 .. ",`flg3`=" .. flg3.. ",`time" .. type .. "`=" .. Halotime .. " where `cdkey`='" .. mycdkey .. "'")
		end
		if playerhalodata[mycdkey] == nil then
			local Halotimedata = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
			playerhalodata[mycdkey] = {}
			playerhalodata[mycdkey][1] = Haloindex
			playerhalodata[mycdkey][2] = flg1
			playerhalodata[mycdkey][3] = flg2
			playerhalodata[mycdkey][4] = flg3
			Halotimedata[type] = Halotime
			playerhalodata[mycdkey][5] = Halotimedata
		else
			playerhalodata[mycdkey][1] = Haloindex
			playerhalodata[mycdkey][2] = flg1
			playerhalodata[mycdkey][3] = flg2
			playerhalodata[mycdkey][4] = flg3
			playerhalodata[mycdkey][5][type] = Halotime
		end
		return 1
	end
	return 0
end

function Halouse(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local skinindex = other.getString(data,"|",1)
	if skinindex == "" then
		return
	end
	skinindex = other.atoi(skinindex)
	if skinindex < 1 or skinindex > 96 then
		return
	end
	if skindata[skinindex][2] == 0 then
		return
	end
	local skintime = other.getString(data,"|",2)
	if skintime == "" then
		return
	end
	skintime = other.atoi(skintime)
	if skintime < 0 then
		skintime = 0
	end
	local skinindexdata,flg1,flg2,flg3,skintimedata = queryHalo(charaindex)
	if skinindex <= 32 then
		if other.DataAndData(flg1,skinindex - 1) ~= 0 then
			char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
			return
		end
		flg1 = other.DataOrData(flg1,skinindex - 1)
	elseif skinindex <= 64 then
		if other.DataAndData(flg2,skinindex - 32 - 1) ~= 0 then
			char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
			return
		end
        flg2 = other.DataOrData(flg2,skinindex - 32 - 1)
    elseif skinindex <= 96 then
		if other.DataAndData(flg3,skinindex - 64 - 1) ~= 0 then
			char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
			return
		end
		flg3 = other.DataOrData(flg3,skinindex - 64 - 1)
	end
	if skintime > 0 then
		skintimedata[skinindex] = other.time() + skintime
	else
		skintimedata[skinindex] = 0
	end
	
	if updateHalo(charaindex,skinindexdata,flg1,flg2,flg3,skinindex,skintimedata[skinindex]) == 1 then
		char.DelItem(charaindex, haveitemindex)
		local titlename = item.getChar(itemindex,"显示名")
		char.newMessageToCli(charaindex, -1, "恭喜你获得光环"..titlename.."！", "黄色")
		token = "A|" .. skindata[skinindex][1] .. "|" .. skindata[skinindex][2] .. "|"  .. skindata[skinindex][3].. "|" .. skindata[skinindex][4] .. "|" .. skintimedata[skinindex].. "|" .. skinindex
		other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})
		other.CallFunction("updateTotalbonus", "data/ablua/complianceparameter.lua", {charaindex})
	end
end

function getnewtitle(charaindex,id)
	if char.getInt(charaindex,"转数") == 5 and char.getInt(charaindex,"等级") == 140 then
		local skinindexdata,flg1,flg2,flg3,skintimedata = queryHalo(charaindex)
		if skinindexdata > 0 then
			if id <= 32 then
				if other.DataAndData(flg1,id - 1) ~= 0 then
					char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
					return
				end
				flg1 = other.DataOrData(flg1,id - 1)
			elseif id <= 64 then
				if other.DataAndData(flg2,id - 32 - 1) ~= 0 then
					char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
					return
				end
				flg2 = other.DataOrData(flg2,id - 32 - 1)
			elseif id <= 96 then
				if other.DataAndData(flg3,id - 64 - 1) ~= 0 then
					char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
					return
				end
				flg3 = other.DataOrData(flg3,id - 64 - 1)
			end
			if updateHalo(charaindex,skinindexdata,flg1,flg2,flg3,id,skintimedata[id]) == 1 then
				token = "A|" .. skindata[id][1] .. "|" .. skindata[id][2] .. "|" .. skindata[id][3].. "|" .. skindata[id][4] .. "|" .. skintimedata[id].. "|" .. id
				other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})
			end
		end
	end
	return 0
end

function othertitleuse(charaindex,id)
	local skinindexdata,flg1,flg2,flg3,skintimedata = queryHalo(charaindex)
	if skinindexdata > 0 then
		if id <= 32 then
			if other.DataAndData(flg1,id - 1) ~= 0 then
				char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
				return
			end
			flg1 = other.DataOrData(flg1,id - 1)
		elseif id <= 64 then
			if other.DataAndData(flg2,id - 32 - 1) ~= 0 then
				char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
				return
			end
			flg2 = other.DataOrData(flg2,id - 32 - 1)
		elseif id <= 96 then
			if other.DataAndData(flg3,id - 64 - 1) ~= 0 then
				char.newMessageToCli(charaindex,-1,"您已经有此光环了","白色")
				return
			end
			flg3 = other.DataOrData(flg3,id - 64 - 1)
		end
		if updateHalo(charaindex,skinindexdata,flg1,flg2,flg3,id,skintimedata[id]) == 1 then
			token = "A|" .. skindata[id][1] .. "|" .. skindata[id][2] .. "|" .. skindata[id][3].. "|" .. skindata[id][4] .. "|" .. skintimedata[id].. "|" .. id
			other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})
			other.CallFunction("updateTotalbonus", "data/ablua/complianceparameter.lua", {charaindex})
		end
	end
	return 0
end

function GetCharNewHaloMode(charaindex,id)
	if char.check(charaindex)~=1 then
		return -1
	end
	if id < 1 or id > #skindata then
		return -1
	end
	local skinindexdata,flg1,flg2,flg3,skintimedata = queryHalo(charaindex)
	if id <= 32 then
		if other.DataAndData(flg1,id - 1) ~= 0 then
			return 1
		end
	elseif id <= 64 then
		if other.DataAndData(flg2,id - 32 - 1) ~= 0 then
			return 1
		end
	elseif id <= 96 then
		if other.DataAndData(flg3,id - 64 - 1) ~= 0 then
			return 1
		end
	end

	return 0
end

function playerHalouse(charaindex,id)
	if id > 0 then
		--print("change halo successful, client send id is " .. id)
		local gettitlemode = GetCharNewHaloMode(charaindex,id)
		if gettitlemode ~= 1 then
			return 0
		end
		updateuseHalo(charaindex,id)
		char.setInt(charaindex,"人物光环",skindata[id][2])
		char.newMessageToCli(charaindex, -1, "更换光环成功", "白色")
		token = "N|" .. skindata[id][2] .. "|" .. id
	else
		--print("unload halo successful, client send id is " .. id)
		updateuseHalo(charaindex,0)
		char.setInt(charaindex,"人物光环",0)
		char.newMessageToCli(charaindex, -1, "卸载光环成功", "白色")
		token = "D"
		other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})
		char.WarpToSpecificPoint(charaindex,char.getInt(charaindex,"地图号"),char.getInt(charaindex,"坐标X"),char.getInt(charaindex,"坐标Y"))
		token = "N|0|0"
		
	end
	--print("halo send to client token is " .. token)
	other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	other.CallFunction("updateTotalbonus", "data/ablua/complianceparameter.lua", {charaindex})
	char.ToAroundChar(charaindex)
	char.sendCMeToMe(charaindex)
	return 1
end

function HaloListSend(charaindex)
	if char.check(charaindex)~=1 then
		return 0
	end
	local skinindexdata,flg1,flg2,flg3,skintimedata = queryHalo(charaindex)
	token = ""
	titlelistnum = 0
	for i=1,#skindata do
		if GetCharNewHaloMode(charaindex,i) == 1 then
			token = token .. "|" .. skindata[i][1] .. "|".. skindata[i][2] .. "|" .. skindata[i][3] .. "|" .. skindata[i][4] .. "|" .. skintimedata[i].. "|" .. i
			titlelistnum = titlelistnum + 1
		end
	end
	token = "S|" .. titlelistnum .. token
	other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})

	if skinindexdata > 0 then
		if skinindexdata >= 1 and skinindexdata <= #skindata then
			token = "N|" .. skindata[skinindexdata][2] .. "|" .. skinindexdata
			other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})
		end
	else
		token = "N|0|0"
		other.CallFunction("HaloSend","data/ablua/dispatchmessage.lua",{charaindex,token})
	end
	return 0
end

function delhalodata(charaindex)
	local mycdkey = char.getChar(charaindex,"账号")
	if playerhalodata[mycdkey] ~= nil then
		playerhalodata[mycdkey] = nil
	end
	return 0
end

function data()
	skindata =	{	--描述 类型 使用加成 拥有加成
				 {"大地守护Lv1",120014,"防御+10,0,0","0"}
				,{"海神守护LV1",120015,"血量+40,0,0","0"}
				,{"烈焰守护LV1",120016,"攻击+10,0,0","0"}
				
				,{"疾风守护LV1",125006,"敏捷+10,0,0","0"}
				,{"大地守护Lv2",125003,"防御+15,0,0","0"}
				,{"海神守护LV2",125004,"血量+60,0,0","0"}
				,{"烈焰守护LV2",125005,"攻击+15,0,0","0"}
				,{"疾风守护LV2",125006,"敏捷+15,0,0","0"}
				,{"大地守护Lv3",125028,"防御+20,0,0","0"}
				,{"海神守护LV3",125026,"血量+80,0,0","0"}	
				,{"烈焰守护LV3",125019,"攻击+20,0,0","0"}
				,{"疾风守护LV3",125023,"敏捷+20,0,0","0"}
				,{"星光守护",125053,"0,0,0","0"}
				,{"波纹守护",125054,"0,0,0","0"}
				,{"八面玲珑",125051,"0,0,0","0"}
				,{"玫瑰守护",125042,"0,0,0","攻击+2"}
				,{"狼神庇护",109002,"0,0,0","0"}
				,{"樱花烂漫",109013,"0,0,0","0"}
				,{"冰封时刻",109017,"0,0,0","0"}
				,{"猩红之夜",109009,"0,0,0","0"}
				,{"魂断蓝桥",109011,"0,0,0","0"}
				,{"烈焰灼烧",109000,"0,0,0","0"}
				,{"金碧辉煌",109008,"0,0,0","0"}
				,{"春节光环",109001,"0,0,0","0"}
				,{"电闪雷鸣",109003,"0,0,0","0"}
				,{"元素守护",109007,"0,0,0","0"}
				,{"彩虹",109010,"0,0,0","0"}
				,{"冰葵守护",125038,"0,0,0","防御+2"}
				,{"紫魅守护",125037,"0,0,0","敏捷+2"}
				,{"紫电荆棘",109004,"0,0,0","0"}
				,{"银河星陨",109016,"0,0,0","0"}
				,{"鬼魂",109015,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}
				,{"",0,"0,0,0","0"}}
end

function main()
	playerhalodata = {}
	data()
	item.addLUAListFunction( "ITEM_Halo", "Halouse", "")
end
