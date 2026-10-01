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
	for i = 1, 5 do
		if char.getCharPet(charaindex, i - 1) == -1 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function ShowItemOne( id,name,shuoming,str,vgh,dex,hp,mp,mei)
	local chuld
	local chuld1

	if string.find(shuoming, '?') ~= nil then
		local i = 0
		local to = 0
		local t = {}
		
		while true do
			i = string.find(shuoming,'?',i+1)
			if i == nil then
				break
			else
				to = i
			end
			t[#t+1] = i
		end
		chuld = string.sub(shuoming,to+1,string.len(shuoming))
	end
		
	if string.find(shuoming, '？') ~= nil then
		local i1 = 0
		local to1 = 0
		local t1 = {}
		while true do
			i1 = string.find(shuoming,'？',i1+1)
			if i1 == nil then
				break
			else
				to1 = i1
			end
			t1[#t1+1] = i1
		end
		chuld1 = string.sub(shuoming,to1+2,string.len(shuoming))
	end

	if ( string.find(shuoming, '?') ~= nil or string.find(shuoming, '？') ~= nil )
	and 
	( (string.find(name, '合成斧') ~= nil or  string.find(name, '合成棍') ~= nil  
	or  string.find(name, '合成枪') ~= nil or  string.find(name, '合成爪') ~= nil
	or  string.find(name, '合成弓') ~= nil or  string.find(name, '合成回') ~= nil
	or  string.find(name, '合成石') ~= nil or  string.find(name, '合成兜') ~= nil
	or  string.find(name, '合成投') ~= nil	or  string.find(name, '合成服') ~= nil
	or  string.find(name, '合成防') ~= nil	or  string.find(name, '合成铠') ~= nil 
	or  string.find(name, '合成手') ~= nil  )
	)		
	then
		local tokenatt = string.format("攻:%d ", str)
		local tokenfan = string.format("防:%d ", vgh)
		local tokenmin = string.format("敏:%d ", dex)
		local tokenHP = string.format("HP:%d ", hp)
		local tokenMP = string.format("MP:%d ", mp)
		local tokenHARM = string.format("魅:%d ", mei)

		
		local alltoken
		
		if str ~= 0 then
			if str > 0 then					
				tokenatt = tokenatt .. ' '
			end
			if alltoken ~= nil then
				alltoken = alltoken..tokenatt
			else
				alltoken = tokenatt
			end	
		end
		
		
		if vgh ~= 0 then
			if vgh > 0 then					
				tokenfan = tokenfan .. ' '
			end
			if alltoken ~= nil then
				alltoken = alltoken..tokenfan
			else
				alltoken = tokenfan
			end				
		end
		if dex ~= 0 then
			if dex > 0 then					
				tokenmin = tokenmin .. ' '
			end
			if alltoken ~= nil then
				alltoken = alltoken..tokenmin
			else
				alltoken = tokenmin
			end			
		end
		
		if hp ~= 0 then
			if hp > 0 then					
				tokenHP = tokenHP .. ' '
			end
			if alltoken ~= nil then
				alltoken = alltoken..tokenHP
			else
				alltoken = tokenHP
			end			
		end
		
		if mp ~= 0 then
			if mp > 0 then					
				tokenMP = tokenMP .. ' '
			end
			if alltoken ~= nil then
				alltoken = alltoken..tokenMP
			else
				alltoken = tokenMP
			end			
		end
		
		if mei ~= 0 then
			if mei > 0 then					
				tokenHARM = tokenHARM .. ' '
			end
			if alltoken ~= nil then
				alltoken = alltoken..tokenHARM
			else
				alltoken = tokenHARM
			end			
		end

		if chuld ~= nil then
			return alltoken .. chuld
		end
		if chuld1 ~= nil then
			return alltoken .. chuld1
		end
		
	end
	return shuoming
end

function getStreetType(charaindex)
	local streetflg = 0
	token = "select * from `streetdata` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		if sasql.num_rows() > 0 then
			sasql.fetch_row()
			if other.atoi(sasql.data(8)) ~= config.getServernumber() then
				--char.newMessageToCli(charaindex,-1,"您的寄售摊位不在该线路","白色")
				return 0
			end
			streetflg = 1
		end
	else
		return -1
	end
	streetnum = 0
	ret = sasql.query("select * from `streetpet` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "' and `check`=0")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			streetnum = streetnum + sqlnum
		end
	else
		return -1
	end
	ret = sasql.query("select * from `streetitem` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "' and `check`=0")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			streetnum = streetnum + sqlnum
		end
	else
		return -1
	end
	if streetflg == 0 and streetnum == 0 then
		return 1
	elseif streetflg == 0 and streetnum > 0 then
		return 2
	elseif streetflg == 1 and streetnum > 0 then
		return 3
	elseif streetflg == 1 and streetnum == 0 then
		return 4
	end
	return -1
end

function Loop(meindex)
	local cdkey = char.getWorkChar(meindex,"NPC临时1")
	if cdkey ~= "" then
		token = "select * from `streetdata` where `cdkey`='" .. cdkey .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			if sasql.num_rows() > 0 then
				sasql.fetch_row()
				if other.atoi(sasql.data(7)) < other.time() then
					token = "delete from `streetdata` where `cdkey`='" .. cdkey .. "'"
					ret = sasql.query(token)
					if ret == 1 then
						npc.DelNpc(meindex)
					end
				else
					if char.getChar(meindex,"名字") ~= sasql.data(2) then
						char.setChar(meindex,"名字",sasql.data(2))
						char.ToAroundChar(meindex)
					end
					num = 0
					ret = sasql.query("select * from `streetpet` where `cdkey`='" .. cdkey .. "' and `check`=0")
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						sqlnum = sasql.num_rows()
						if sqlnum > 0 then
							num = num + sqlnum
						end
					end
					ret = sasql.query("select * from `streetitem` where `cdkey`='" .. cdkey .. "' and `check`=0")
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						sqlnum = sasql.num_rows()
						if sqlnum > 0 then
							num = num + sqlnum
						end
					end
					local myimage = char.getInt(meindex,"图像号")
					for i=1,#streetimage do
						if myimage == streetimage[i][2] then
							if num > 0 then
								ret = sasql.query("update `streetdata` set `image`=" .. streetimage[i][1] .. " where `cdkey`='" .. cdkey .. "'")
								if ret == 1 then
									char.setInt(meindex,"图像号",streetimage[i][1])
									char.ToAroundChar(meindex)
								end
							end
							return
						elseif myimage == streetimage[i][1] then
							if num == 0 then
								ret = sasql.query("update `streetdata` set `image`=" .. streetimage[i][2] .. " where `cdkey`='" .. cdkey .. "'")
								if ret == 1 then
									char.setInt(meindex,"图像号",streetimage[i][2])
									char.ToAroundChar(meindex)
								end
							end
							return
						end
					end
				end
			else
				npc.DelNpc(meindex)
			end
		end
	else
		npc.DelNpc(meindex)
	end
end

function NpcLoop(meindex)
	token = "delete from `streetlog` where `time`<" .. other.time() - 86400 * 3
	sasql.query(token)
end

function FreeStreet(fd,data)
	if data == "" then
		return
	end
	local charaindex = net.getCharaindex(fd)
	if char.check(charaindex) == 1 then
		if char.getInt(charaindex,"地图号") ~= 1000 and char.getInt(charaindex,"地图号") ~= 2000 and char.getInt(charaindex,"地图号") ~= 3000 and char.getInt(charaindex,"地图号") ~= 4000 then
			char.newMessageToCli(charaindex,-1,"摊位功能只允许在四大村使用哦","白色")
			return
		end
		if char.getInt(charaindex,"转数") < 1 and char.getInt(charaindex,"等级") < 50 then
			char.newMessageToCli(charaindex,-1,"0转50级以下无法摆摊","白色")
			return 
		end
		if char.getInt(charaindex,"地图号") == 2000 and char.getInt(charaindex,"坐标X") >= 103 and char.getInt(charaindex,"坐标Y") >= 84 and char.getInt(charaindex,"坐标X") <= 107 and char.getInt(charaindex,"坐标Y") <= 92 then
			char.newMessageToCli(charaindex,-1,"加美航空乘坐点不允许摆摊","白色")
			return
		end
		if char.getInt(charaindex,"地图号") == 2000 and char.getInt(charaindex,"坐标X") >= 85 and char.getInt(charaindex,"坐标Y") >= 101 and char.getInt(charaindex,"坐标X") <= 110 and char.getInt(charaindex,"坐标Y") <= 136 then
			char.newMessageToCli(charaindex,-1,"此地点不允许摆摊","白色")
			return
		end
		if char.getInt(charaindex,"地图号") == 4000 and char.getInt(charaindex,"坐标X") >= 90 and char.getInt(charaindex,"坐标Y") >= 68 and char.getInt(charaindex,"坐标X") <= 95 and char.getInt(charaindex,"坐标Y") <= 74 then
			char.newMessageToCli(charaindex,-1,"加美航空乘坐点不允许摆摊","白色")
			return
		end
		local type = other.getString(data,"|",1)
		if type == "O" then
			local objindex = other.getString(data,"|",2)
			if objindex == "" then
				local streetflg = getStreetType(charaindex)
				if streetflg == -1 then
					return
				elseif streetflg == 0 then
					token = "管理摊位|您可以在这里管理您的摊位\n祝您游戏愉快|1|延长时间"
					lssproto.windows(charaindex, "新选择框", 8, 0, char.getWorkInt( npcindex, "对象"), token)
					--char.newMessageToCli(charaindex,-1,"您的寄售摊位不在该线路","白色")
					--return
				elseif streetflg == 1 then
					if obj.getObjFromType(charaindex,1,54) == 1 then
						char.newMessageToCli(charaindex,-1,"您周围已有寄售摊位","白色")
						return
					end
					lssproto.sendNewStreet(fd,"O|")
				elseif streetflg == 2 then
					token = "管理摊位|您可以在这里管理您的摊位\n祝您游戏愉快|3|我要摆摊|领回物品|卖出记录"
					lssproto.windows(charaindex, "新选择框", 8, 0, char.getWorkInt( npcindex, "对象"), token)
				elseif streetflg == 3 then
					local endtime = 0
					token = "select * from `streetdata` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
					ret = sasql.query(token)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() > 0 then
							sasql.fetch_row()
							endtime = other.atoi(sasql.data(7))
						end
					end
					token = "管理摊位|您可以在这里管理您的摊位\n摊位到期时间：\n" .. os.date("%Y-%m-%d %H:%M:%S", endtime)  .. "\n祝您游戏愉快|8|管理物品|上架物品|更换摊名|更换样式|延长时间|收起摊位|卖出记录|寻找摊位"
					lssproto.windows(charaindex, "新选择框", 8, 0, char.getWorkInt( npcindex, "对象"), token)
				elseif streetflg == 4 then
					local endtime = 0
					token = "select * from `streetdata` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
					ret = sasql.query(token)
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() > 0 then
							sasql.fetch_row()
							endtime = other.atoi(sasql.data(7))
						end
					end
					token = "管理摊位|您可以在这里管理您的摊位\n摊位到期时间：\n" .. os.date("%Y-%m-%d %H:%M:%S", endtime)  .. "\n祝您游戏愉快|6|上架物品|更换样式|延长时间|收起摊位|卖出记录|寻找摊位"
					lssproto.windows(charaindex, "新选择框", 8, 0, char.getWorkInt( npcindex, "对象"), token)
				end
			else
				local toindex = obj.getIndex(other.atoi(objindex))
				if char.check(toindex) == 1 then
					if char.getInt(toindex,"类型") == 54 then
						local tocdkey = char.getWorkChar(toindex,"NPC临时1")
						token = "select * from `streetdata` where `cdkey`='" .. tocdkey .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								sasql.fetch_row()
								if other.atoi(sasql.data(8)) ~= config.getServernumber() then
									char.newMessageToCli(charaindex,-1,"您的寄售摊位不在该线路","白色")
									return
								end
								num = 0
								token = ""
								ret = sasql.query("select * from `streetpet` where `cdkey`='" .. tocdkey .. "' and `check`=0")
								if ret == 1 then
									sasql.free_result()
									sasql.store_result()
									sqlnum = sasql.num_rows()
									if sqlnum > 0 then
										num = num + sqlnum
										for i=1,sqlnum do
											sasql.fetch_row()
											token = token .. "|1|" .. sasql.data(3) .. "|" .. sasql.data(41) .. "||" .. sasql.data(45)
										end
									end
								end
								ret = sasql.query("select * from `streetitem` where `cdkey`='" .. tocdkey .. "' and `check`=0")
								if ret == 1 then
									sasql.free_result()
									sasql.store_result()
									sqlnum = sasql.num_rows()
									if sqlnum > 0 then
										num = num + sqlnum
										for i=1,sqlnum do
											sasql.fetch_row()
											token = token .. "|0|" .. sasql.data(3) .. "|" .. sasql.data(38) .. "|" .. sasql.data(6) .. "|" .. sasql.data(41)
										end
									end
								end
								if num == 0 then
									char.newMessageToCli(charaindex,-1,"商品已卖完","白色")
									return
								end
								lssproto.sendNewStreet(fd,"B|" .. sasql.getVipPoint(charaindex) .. "|" .. objindex .. "|" .. num .. token)
							end
						end
					end
				end
			end
		elseif type == "S" then--上架
			local flg = 0
			token = "select * from `streetdata` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				num = sasql.num_rows()
				if num > 0 then
					sasql.fetch_row()
					if other.atoi(sasql.data(8)) ~= config.getServernumber() then
						char.newMessageToCli(charaindex,-1,"您已经在别的线路开启寄售","白色")
						return
					end
					flg = 1
				end
			end
			yuannum = other.atoi(other.getString(data,"|",2))
			num = other.atoi(other.getString(data,"|",2))
			print("[street:FreeStreet]",yuannum,num,flg)
			if flg == 1 then
				token = "select * from `streetpet` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "' and `check`=0"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						num = num + sqlnum
					end
				end
				token = "select * from `streetitem` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "' and `check`=0"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						num = num + sqlnum
					end
				end
			end
			print("[street:FreeStreet]num:",num)
			if num <= 0 or num > 20 then
				char.newMessageToCli(charaindex,-1,"寄售数量最多为20个","白色")
				return
			end
			--摊位名称
			if flg == 0 then
				if char.getInt(charaindex,"石币") < 10000 then
					char.newMessageToCli(charaindex,-1,"您的石币不足，无法摆摊","白色")
					return
				end
				if obj.getObjFromType(charaindex,1,54) == 1 then
					char.newMessageToCli(charaindex,-1,"您周围已有寄售摊位","白色")
					return
				end
				streetname = other.getString(data,"|",3 + num * 3)
				if streetname == "" then
					streetname = "欢迎光临"
				end
				if string.len(streetname) > 12 then
					char.newMessageToCli(charaindex,-1,"您的摊位名过长","白色")
					return
				end
				token = "insert into `streetdata` VALUES ('" .. char.getChar(charaindex,"账号") .. "','" .. streetname .. "'," .. streetimage[1][1] .. "," .. char.getInt(charaindex,"地图号") .. "," .. char.getInt(charaindex,"坐标X")
						.. "," .. char.getInt(charaindex,"坐标Y") .. "," .. other.time() + 43200 .. "," .. config.getServernumber() .. ",-1)"
				ret = sasql.query(token)
				if ret == 1 then
					char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") - 10000)
					Create(streetname, streetimage[1][1], char.getInt(charaindex,"地图号"), char.getInt(charaindex,"坐标X"), char.getInt(charaindex,"坐标Y"), char.getChar(charaindex,"账号"),other.time() + 43200)
					char.Updata(charaindex,"石币")
				else
					return
				end
			elseif flg == 1 then
				streetname = other.getString(data,"|",3 + yuannum * 3)
				if streetname == "" then
					streetname = "欢迎光临"
				end
				if string.len(streetname) > 12 then
					char.newMessageToCli(charaindex,-1,"您的摊位名过长","白色")
					return
				end
				ret = sasql.query("select `index` from `streetdata` where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						sasql.fetch_row()
						local mynpcindex = other.atoi(sasql.data(1))
						if char.check(mynpcindex) == 1 then
							ret = sasql.query("update `streetdata` set `name`='" .. streetname .. "' where `cdkey`='" .. char.getChar(charaindex,"账号") .. "'")
							if ret == 1 then
								char.setChar(mynpcindex,"名字",streetname)
								char.ToAroundChar(mynpcindex)
							end
						end
					end
				end
			end
			print("[street:FreeStreet]num:",num)
			for i=1,num do
				selltype = other.atoi(other.getString(data,"|",2 + (i-1) * 3 + 1))
				sellindex = other.atoi(other.getString(data,"|",2 + (i-1) * 3 + 2))
				sellprice = other.atoi(other.getString(data,"|",2 + (i-1) * 3 + 3))
				if sellprice < 1 then
					return
				end
				if selltype == 0 then
					if sellindex >= 9 and sellindex <= 23 then
						itemindex = char.getItemIndex(charaindex,sellindex)
						if item.check(itemindex) == 1 then
							if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" and item.getInt(itemindex,"丢弃消失") == 0 and item.getInt(itemindex,"物品时间") <= 0 and item.getChar(itemindex,"使用函数名") ~= "ITEM_MMEXP" then
								token = "insert into `streetitem` VALUES ('" .. char.getChar(charaindex,"账号") .. "',0," .. sellprice .. "," .. item.getInt(itemindex,"序号") .. "," .. item.getInt(itemindex,"次数")
									.. "," .. item.getInt(itemindex,"堆叠") .. "," .. item.getInt(itemindex,"最小度") .. "," .. item.getInt(itemindex,"最大度") .. "," .. item.getInt(itemindex,"伤")
									.. "," .. item.getInt(itemindex,"吸") .. "," .. item.getInt(itemindex,"最小攻击") .. "," .. item.getInt(itemindex,"最大攻击") .. "," .. item.getInt(itemindex,"攻")
									.. "," .. item.getInt(itemindex,"防") .. "," .. item.getInt(itemindex,"敏") .. "," .. item.getInt(itemindex,"HP") .. "," .. item.getInt(itemindex,"MP")
									.. "," .. item.getInt(itemindex,"运气") .. "," .. item.getInt(itemindex,"魅力") .. "," .. item.getInt(itemindex,"回避") .. "," .. item.getInt(itemindex,"属性")
									.. "," .. item.getInt(itemindex,"属性比例") .. "," .. item.getInt(itemindex,"格档") .. "," .. item.getInt(itemindex,"次序") .. "," .. item.getInt(itemindex,"负重")
									.. "," .. item.getInt(itemindex,"命中") .. "," .. item.getInt(itemindex,"忽防") .. "," .. item.getInt(itemindex,"毒耐") .. "," .. item.getInt(itemindex,"麻耐")
									.. "," .. item.getInt(itemindex,"睡耐") .. "," .. item.getInt(itemindex,"石耐") .. "," .. item.getInt(itemindex,"酒耐") .. "," .. item.getInt(itemindex,"混耐")
									.. "," .. item.getInt(itemindex,"会心") .. "," .. item.getInt(itemindex,"颜色") .. "," .. item.getInt(itemindex,"合成") .. ",'" .. item.getChar(itemindex,"名称")
									.. "','" .. item.getChar(itemindex,"显示名") .. "','" .. item.getChar(itemindex,"说明") .. "','" .. item.getChar(itemindex,"字段") .. "','" .. item.getChar(itemindex,"编码")
									.. "'," .. item.getInt(itemindex,"图号") 
									..",".. item.getInt(itemindex,"精灵")..",'"..item.getChar(itemindex,"类型代码").."','"..item.getChar(itemindex,"镶嵌代码").."')"
								ret = sasql.query(token)
								if ret == 1 then
									if item.getInt(itemindex,"堆叠") > 1 then
										char.DelPileItemMess(charaindex,sellindex)
									else
										char.DelItem(charaindex,sellindex)
									end
									char.charSaveFromConnect(charaindex)
								end
							end
						end
					end
				elseif selltype == 1 then
					if sellindex >= 0 and sellindex <= 4 then
						petindex = char.getCharPet(charaindex,sellindex)
						if char.check(petindex) == 1 then
							if string.sub(char.getChar(petindex,"名字"),1,1) ~= "*" and char.getInt(petindex,"安全锁") == 0 and char.getInt(petindex,"守护兽") ~= 1 then
								local petskillid = {-1,-1,-1,-1,-1,-1,-1}
								for j=1,7 do
									petskillid[j] = char.getPetSkill(petindex,j - 1)
								end
								token = "insert into `streetpet` VALUES ('" .. char.getChar(charaindex,"账号") .. "',0," .. sellprice .. "," .. char.getInt(petindex,"宠ID") .. "," .. char.getInt(petindex,"图像号")
									.. "," .. char.getInt(petindex,"原图像号") .. "," .. char.getInt(petindex,"方向") .. "," .. char.getInt(petindex,"等级") .. "," .. char.getInt(petindex,"体力")
									.. "," .. char.getInt(petindex,"腕力") .. "," .. char.getInt(petindex,"耐力") .. "," .. char.getInt(petindex,"速度") .. "," .. char.getInt(petindex,"模式AI")
									.. "," .. char.getInt(petindex,"可变AI") .. "," .. char.getInt(petindex,"地") .. "," .. char.getInt(petindex,"水") .. "," .. char.getInt(petindex,"火")
									.. "," .. char.getInt(petindex,"风") .. "," .. char.getInt(petindex,"宠技位") .. "," .. char.getInt(petindex,"暴击") .. "," .. char.getInt(petindex,"死亡次数")
									.. "," .. char.getInt(petindex,"损坏次数") .. "," .. char.getInt(petindex,"类型") .. "," .. char.getInt(petindex,"经验") .. "," .. char.getInt(petindex,"出生地")
									.. "," .. char.getInt(petindex,"能力值") .. "," .. char.getInt(petindex,"成长区间") .. "," .. char.getInt(petindex,"转数") .. "," .. char.getInt(petindex,"守护兽")
									.. "," .. char.getInt(petindex,"限制等级") .. "," .. char.getInt(petindex,"提升值") .. "," .. char.getInt(petindex,"无声望模式") .. "," .. char.getInt(petindex,"极品")
									.. "," .. petskillid[1] .. "," .. petskillid[2] .. "," .. petskillid[3] .. "," .. petskillid[4] .. "," .. petskillid[5] .. "," .. petskillid[6]
									.. "," .. petskillid[7] .. ",'" .. char.getChar(petindex,"名字") .. "','" .. char.getChar(petindex,"昵称")
									.. "','" .. char.getChar(petindex,"称号") .. "','" .. char.getChar(petindex,"宠物四围") .. "','" .. char.getChar(petindex,"唯一编号") .. "',''," .. char.getInt(petindex,"攻击特效") .. "," .. char.getInt(petindex,"证书骑宠") 
									.. "," .. char.getInt(petindex,"证书骑宠1") .. "," .. char.getInt(petindex,"证书骑宠2") .. ",'"..char.getChar(petindex,"抓宠数据").."','"..char.getChar(petindex,"宠物转生四围").."')"
								ret = sasql.query(token)
								if ret == 1 then
									char.DelPet(charaindex,petindex)
									char.charSaveFromConnect(charaindex)
								end
							end
						end
					end
				end
			end
		elseif type == "D" then
			local objindex = other.getString(data,"|",2)
			local uid = other.getString(data,"|",3)
			if objindex == "" or uid == "" then
				return
			else
				local toindex = obj.getIndex(other.atoi(objindex))
				if char.check(toindex) == 1 then
					if char.getInt(toindex,"类型") == 54 then
						local tocdkey = char.getWorkChar(toindex,"NPC临时1")
						token = "select * from `streetdata` where `cdkey`='" .. tocdkey .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								num = 0
								ret = sasql.query("select * from `streetpet` where `cdkey`='" .. tocdkey .. "' and `check`=0 and `CHAR_UNIQUECODE`='" .. uid .. "'")
								if ret == 1 then
									sasql.free_result()
									sasql.store_result()
									sqlnum = sasql.num_rows()
									if sqlnum > 0 then
										sasql.fetch_row()
										local petid = other.atoi(sasql.data(4))
										local petskillnum = other.atoi(sasql.data(19))
										local petskillname = ""
										local lv = other.atoi(sasql.data(8))
										local vital = other.atoi(sasql.data(9))
										local str = other.atoi(sasql.data(10))
										local tough = other.atoi(sasql.data(11))
										local dex = other.atoi(sasql.data(12))
										local di = other.atoi(sasql.data(15))
										local shui = other.atoi(sasql.data(16))
										local huo = other.atoi(sasql.data(17))
										local feng = other.atoi(sasql.data(18))
										local ALLOCPOINT = other.atoi(sasql.data(26))
										local zhong = 100
										local trans = other.atoi(sasql.data(28))
										local image = other.atoi(sasql.data(5))
										local pet4v = sasql.data(44)
										local petoldlv = other.getString(pet4v,"|",5)
										local petoldhp = other.getString(pet4v,"|",1)
										local petoldstr = other.getString(pet4v,"|",2)
										local petoldtou = other.getString(pet4v,"|",3)
										local petolddex = other.getString(pet4v,"|",4)
										local fixstr = math.floor(str * 0.01 + tough * 0.01 * 0.1 + vital * 0.01 * 0.1 + dex * 0.01 * 0.05)
										local fixtough = math.floor(tough * 0.01 + str * 0.01 * 0.1 + vital * 0.01 * 0.1 + dex * 0.01 * 0.05)
										local fixdex = math.floor(dex * 0.01)
										local fixhp = math.floor((vital * 4 + str + tough + dex) * 0.01)
										local newname = sasql.data(43)
										local attackeffect = other.atoi(sasql.data(47))
										local nofame = other.atoi(sasql.data(32))
										local lasttalkelder = other.atoi(sasql.data(25))
										--if newname ~= "" then
										--	char.newMessageToCli(charaindex,-1,"祝福宠物暂时无法购买","白色")
										--	return
										--end
										for i=1,petskillnum do
											petskillindex = petskill.getPetskillArray(other.atoi(sasql.data(33 + i)));
											if petskill.check(petskillindex) == 1 then
												petskillname = petskillname .. petskill.getChar(petskillindex,"名称") .. "|"
											else
												petskillname = petskillname .. "|"
											end
										end
										token = "D|" .. uid .. "|" .. petskillnum .. "|" .. petskillname .. lv .. "|" .. fixhp .. "|" .. fixstr .. "|" .. fixtough .. "|" .. fixdex .. "|"
											 .. di .. "|" .. shui .. "|" .. huo .. "|" .. feng .. "|" .. zhong .. "|" .. trans .. "|" .. image .. "|" .. petoldlv .. "|" .. petoldhp .. "|"
											 .. petoldstr .. "|" .. petoldtou .. "|" .. petolddex .. "|"
										if newname == "" then
											if petid == 718 then
												token = token .. other.NumRightToNum(ALLOCPOINT,24) .. ",0|" .. other.NumRightToNum(ALLOCPOINT,16) .. ",0|" .. other.NumRightToNum(ALLOCPOINT,8) .. ",0|" .. other.NumRightToNum(ALLOCPOINT,0) .. ",0|" .. char.getPet4v(vital,str,tough,dex,0,0,0,0)
											else
												token = token .. "0,0|0,0|0,0|0,0|" .. char.getPet4v(vital,str,tough,dex,0,0,0,0)
											end
										else
											char.newMessageToCli(charaindex,-1,"该宠物已祝福","白色")
											token = token .. other.getString(newname,"|",1) .. ",0|" .. other.getString(newname,"|",2) .. ",0|" .. other.getString(newname,"|",3) .. ",0|" .. other.getString(newname,"|",4) .. ",0|" .. char.getPet4v(vital,str,tough,dex,other.atoi(other.getString(newname,"|",1)),other.atoi(other.getString(newname,"|",2)),other.atoi(other.getString(newname,"|",3)),other.atoi(other.getString(newname,"|",4)))
										end
										token = token .. "|" .. nofame .. "|" .. lasttalkelder .. "|" .. attackeffect
										lssproto.sendNewStreet(fd,token)
										if petoldlv ~= "1" then
											char.newMessageToCli(charaindex,-1,"该宠物是野生宠物","白色")
										end
										return
									end
								end
								ret = sasql.query("select * from `streetitem` where `cdkey`='" .. tocdkey .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
								if ret == 1 then
									sasql.free_result()
									sasql.store_result()
									sqlnum = sasql.num_rows()
									if sqlnum > 0 then
										sasql.fetch_row()
										local shuoming = sasql.data(39)
										local ITEM_DAMAGECRUSHE = other.atoi(sasql.data(7))
										local ITEM_MAXDAMAGECRUSHE = other.atoi(sasql.data(8))
										local color = sasql.data(35)
										local image = other.atoi(sasql.data(42))
										if image == -1 then
											image = item.getgraNoFromITEMtabl(other.atoi(sasql.data(4)))
										end
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
										local ITEM_ID = other.atoi(sasql.data(4))
										local ITEM_MODIFYATTACK = other.atoi(sasql.data(13))
										local ITEM_MODIFYDEFENCE = other.atoi(sasql.data(14))
										local ITEM_MODIFYQUICK = other.atoi(sasql.data(15))
										local ITEM_MODIFYHP = other.atoi(sasql.data(16))
										local ITEM_MODIFYMP = other.atoi(sasql.data(17))
										local ITEM_MODIFYCHARM = other.atoi(sasql.data(19))
										local ITEM_NAME = sasql.data(37)
										token = "D|" .. uid .. "|" .. ShowItemOne( ITEM_ID,ITEM_NAME,shuoming,ITEM_MODIFYATTACK,ITEM_MODIFYDEFENCE,ITEM_MODIFYQUICK,ITEM_MODIFYHP,ITEM_MODIFYMP,ITEM_MODIFYCHARM) .. "|" .. naijiu .. "|" .. color .. "|" .. image .. "|"
										lssproto.sendNewStreet(fd,token)
										return
									end
								end
								char.newMessageToCli(charaindex,-1,"该商品已卖掉","白色")
								return
							else
								char.newMessageToCli(charaindex,-1,"该寄售摊位已关闭","白色")
								return
							end
						end
					end
				end
			end
		elseif type == "B" then
			local objindex = other.getString(data,"|",2)
			local type = other.getString(data,"|",3)
			local uid = other.getString(data,"|",4)
			local buynum = other.getString(data,"|",5)
			if objindex == "" or type == "" or uid == "" then
				return
			else
				if buynum == "" or buynum == nil then
					buynum = "1"
				end
				if other.atoi(buynum) < 1 then
					buynum = "1"
				end
				local toindex = obj.getIndex(other.atoi(objindex))
				if char.check(toindex) == 1 then
					if char.getInt(toindex,"类型") == 54 then
						local tocdkey = char.getWorkChar(toindex,"NPC临时1")
						token = "select * from `streetdata` where `cdkey`='" .. tocdkey .. "'"
						ret = sasql.query(token)
						if ret == 1 then
							sasql.free_result()
							sasql.store_result()
							if sasql.num_rows() > 0 then
								if other.atoi(type) == 1 then
									if char.getChar(charaindex,"账号") == tocdkey then
										char.newMessageToCli(charaindex,-1,"不能购买自己的商品","白色")
										return
									end
									ret = sasql.query("select * from `streetpet` where `cdkey`='" .. tocdkey .. "' and `check`=0 and `CHAR_UNIQUECODE`='" .. uid .. "'")
									if ret == 1 then
										sasql.free_result()
										sasql.store_result()
										sqlnum = sasql.num_rows()
										if sqlnum > 0 then
											sasql.fetch_row()
											if checkEmptPetNum(charaindex) == 0 then
												char.newMessageToCli(charaindex,-1,"您的宠物栏位不足","白色")
												return
											end
											local petid = other.atoi(sasql.data(4))
											local CHAR_BASEIMAGENUMBER = other.atoi(sasql.data(5))
											local CHAR_BASEBASEIMAGENUMBER = other.atoi(sasql.data(6))
											local CHAR_DIR = other.atoi(sasql.data(7))
											local CHAR_LV = other.atoi(sasql.data(8))
											local CHAR_VITAL = other.atoi(sasql.data(9))
											local CHAR_STR = other.atoi(sasql.data(10))
											local CHAR_TOUGH = other.atoi(sasql.data(11))
											local CHAR_DEX = other.atoi(sasql.data(12))
											local CHAR_MODAI = other.atoi(sasql.data(13))
											local CHAR_VARIABLEAI = other.atoi(sasql.data(14))
											local CHAR_EARTHAT  = other.atoi(sasql.data(15))
											local CHAR_WATERAT = other.atoi(sasql.data(16))
											local CHAR_FIREAT = other.atoi(sasql.data(17))
											local CHAR_WINDAT = other.atoi(sasql.data(18))
											local CHAR_SLOT  = other.atoi(sasql.data(19))
											local CHAR_CRITIAL = other.atoi(sasql.data(20))
											local CHAR_DEADCOUNT  = other.atoi(sasql.data(21))
											local CHAR_DAMAGECOUNT  = other.atoi(sasql.data(22))
											local CHAR_WHICHTYPE  = other.atoi(sasql.data(23))
											local CHAR_EXP = other.atoi(sasql.data(24))
											local CHAR_LASTTALKELDER = other.atoi(sasql.data(25))
											local CHAR_ALLOCPOINT  = other.atoi(sasql.data(26))
											local CHAR_PETRANK = other.atoi(sasql.data(27))
											local CHAR_TRANSMIGRATION  = other.atoi(sasql.data(28))
											local CHAR_PETFAMILY = other.atoi(sasql.data(29))
											local CHAR_LIMITLEVEL = other.atoi(sasql.data(30))
											local CHAR_BEATITUDE = other.atoi(sasql.data(31))
											local CHAR_NOFAME = other.atoi(sasql.data(32))
											local CHAR_SUPER = other.atoi(sasql.data(33))
											local PETSKILL1 = other.atoi(sasql.data(34))
											local PETSKILL2 = other.atoi(sasql.data(35))
											local PETSKILL3 = other.atoi(sasql.data(36))
											local PETSKILL4 = other.atoi(sasql.data(37))
											local PETSKILL5 = other.atoi(sasql.data(38))
											local PETSKILL6 = other.atoi(sasql.data(39))
											local PETSKILL7 = other.atoi(sasql.data(40))
											local CHAR_NAME = sasql.data(41)
											local CHAR_USERPETNAME = sasql.data(42)
											local CHAR_NEWNAME = sasql.data(43)
											local CHAR_PET_4V  = sasql.data(44)
											local CHAR_UNIQUECODE = sasql.data(45)
											local price = other.atoi(sasql.data(3))
											local CHAR_ATTACK_EFFECT = other.atoi(sasql.data(47))
											local CHAR_LOWRIDEPETS = other.atoi(sasql.data(48))
											local CHAR_LOWRIDEPETS1 = other.atoi(sasql.data(49))
											local CHAR_HIGHRIDEPET2 = other.atoi(sasql.data(50))
											if price < 0 then
												return
											end
											--if CHAR_NEWNAME ~= "" then
											--	char.newMessageToCli(charaindex,-1,"祝福宠物暂时无法购买","白色")
											--	return
											--end
											local mypoint = sasql.getVipPoint(charaindex)
											if mypoint < price then
												char.newMessageToCli(charaindex,-1,"您的金币不足","白色")
												return
											end
											if char.getInt(charaindex,"转数") == 0 and char.getInt(charaindex,"等级") < CHAR_LV - 5 then
												char.newMessageToCli(charaindex,-1,"不能购买高于您5级的宠物","白色")
												return
											end
											ret = sasql.query("update `streetpet` set `check`=1,`buycdkey`='" .. char.getChar(charaindex,"账号") .. "' where `cdkey`='" .. tocdkey .. "' and `check`=0 and `CHAR_UNIQUECODE`='" .. uid .. "'")
											if ret == 1 then
												petindex = char.AddPetTempNo(charaindex,petid,1)
												if char.check(petindex) == 1 then
													char.setInt(petindex,"图像号",CHAR_BASEIMAGENUMBER)
													char.setInt(petindex,"原图像号",CHAR_BASEBASEIMAGENUMBER)
													char.setInt(petindex,"方向",CHAR_DIR)
													char.setInt(petindex,"等级",CHAR_LV)
													char.setInt(petindex,"体力",CHAR_VITAL)
													char.setInt(petindex,"腕力",CHAR_STR)
													char.setInt(petindex,"耐力",CHAR_TOUGH)
													char.setInt(petindex,"速度",CHAR_DEX)
													char.setInt(petindex,"模式AI",CHAR_MODAI)
													char.setInt(petindex,"可变AI",CHAR_VARIABLEAI)
													char.setInt(petindex,"地",CHAR_EARTHAT)
													char.setInt(petindex,"水",CHAR_WATERAT)
													char.setInt(petindex,"火",CHAR_FIREAT)
													char.setInt(petindex,"风",CHAR_WINDAT)
													char.setInt(petindex,"宠技位",CHAR_SLOT)
													char.setInt(petindex,"暴击",CHAR_CRITIAL)
													char.setInt(petindex,"死亡次数",CHAR_DEADCOUNT)
													char.setInt(petindex,"损坏次数",CHAR_DAMAGECOUNT)
													char.setInt(petindex,"类型",CHAR_WHICHTYPE)
													char.setInt(petindex,"经验",CHAR_EXP)
													char.setInt(petindex,"出生地",CHAR_LASTTALKELDER)
													char.setInt(petindex,"能力值",CHAR_ALLOCPOINT)
													char.setInt(petindex,"成长区间",CHAR_PETRANK)
													char.setInt(petindex,"转数",CHAR_TRANSMIGRATION)
													char.setInt(petindex,"守护兽",CHAR_PETFAMILY)
													char.setInt(petindex,"限制等级",CHAR_LIMITLEVEL)
													char.setInt(petindex,"提升值",CHAR_BEATITUDE)
													char.setInt(petindex,"无声望模式",CHAR_NOFAME)
													char.setInt(petindex,"极品",CHAR_SUPER)
													char.setChar(petindex,"名字",CHAR_NAME)
													char.setChar(petindex,"昵称",CHAR_USERPETNAME)
													char.setChar(petindex,"称号",CHAR_NEWNAME)
													char.setChar(petindex,"宠物四围",CHAR_PET_4V)
													char.setChar(petindex,"唯一编号",CHAR_UNIQUECODE)
													char.setInt(petindex,"攻击特效",CHAR_ATTACK_EFFECT)
													char.setInt(petindex,"证书骑宠",CHAR_LOWRIDEPETS)
													char.setInt(petindex,"证书骑宠1",CHAR_LOWRIDEPETS1)
													char.setInt(petindex,"证书骑宠2",CHAR_HIGHRIDEPET2)
													char.setPetSkill(petindex,0,PETSKILL1)
													char.setPetSkill(petindex,1,PETSKILL2)
													char.setPetSkill(petindex,2,PETSKILL3)
													char.setPetSkill(petindex,3,PETSKILL4)
													char.setPetSkill(petindex,4,PETSKILL5)
													char.setPetSkill(petindex,5,PETSKILL6)
													char.setPetSkill(petindex,6,PETSKILL7)
													char.complianceParameter(petindex)
													char.setInt(petindex,"HP",char.getWorkInt(petindex,"最大HP"))
													other.CallFunction("petattupdate", "data/ablua/npc/petatterrect/petatterrect.lua", {petindex})
													for i=1,5 do
														if char.getCharPet(charaindex, i - 1) == petindex then
															char.sendStatusString(charaindex,"K" .. i - 1)
															char.sendStatusString(charaindex,"W" .. i - 1)
															break
														end
													end
													char.newMessageToCli(charaindex,-1,"购买" .. CHAR_NAME .."成功,扣除" .. price .. "金币","白色")
													ratepoint = math.ceil(price * rate)
													if ratepoint < 1 then
														ratepoint = 1
													end
													sellpoint = price - ratepoint
													if sellpoint > 0 then
														topoint = sasql.getVipPointForCdkey(tocdkey)
														sasql.setVipPointForCdkey(tocdkey,topoint + sellpoint)
														token = "insert into `VipPointLog` values ('" .. tocdkey .. "'," .. sellpoint .. "," .. topoint .. "," .. topoint + sellpoint .. ",'卖出宠物[" .. CHAR_NAME .. "]增加" .. sellpoint .. "金币',NOW())"
														sasql.query(token)
													end
													sasql.setVipPoint(charaindex,mypoint - price)
													other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,4,price})
													token = "insert into `VipPointLog` values ('" .. char.getChar(charaindex,"账号") .. "'," .. -price .. "," .. mypoint .. "," .. mypoint - price .. ",'购买宠物[" .. CHAR_NAME .. "]扣除" .. price .. "金币',NOW())"
													sasql.query(token)
													char.charSaveFromConnect(charaindex)
													token = "insert into `streetlog` values ('" .. tocdkey .. "',1,'" .. char.getChar(petindex,"名字") .. "',1," .. sellpoint .. ",'" .. char.getChar(charaindex,"账号") .. "','" .. char.getChar(charaindex,"名字") .. "'," .. other.time() .. ")"
													sasql.query(token)
												end
											end
											return
										else
											char.newMessageToCli(charaindex,-1,"该商品已被卖出或已下架","白色")
											return
										end
									end
								elseif other.atoi(type) == 0 then
									if char.getChar(charaindex,"账号") == tocdkey then
										char.newMessageToCli(charaindex,-1,"不能购买自己的商品","白色")
										return
									end
									ret = sasql.query("select * from `streetitem` where `cdkey`='" .. tocdkey .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
									if ret == 1 then
										sasql.free_result()
										sasql.store_result()
										sqlnum = sasql.num_rows()
										if sqlnum > 0 then
											if checkEmptItemNum(charaindex) == 0 then
												char.newMessageToCli(charaindex,-1,"您的道具栏空位不足","白色")
												return
											end
											sasql.fetch_row()
											local price = other.atoi(sasql.data(3)) * other.atoi(buynum)
											local itemid = other.atoi(sasql.data(4))
											local ITEM_DAMAGEBREAK = other.atoi(sasql.data(5))
											local ITEM_USEPILENUMS = other.atoi(sasql.data(6))
											local ITEM_DAMAGECRUSHE = other.atoi(sasql.data(7))
											local ITEM_MAXDAMAGECRUSHE = other.atoi(sasql.data(8))
											local ITEM_OTHERDAMAGE = other.atoi(sasql.data(9))
											local ITEM_OTHERDEFC = other.atoi(sasql.data(10))
											local ITEM_ATTACKNUM_MIN = other.atoi(sasql.data(11))
											local ITEM_ATTACKNUM_MAX = other.atoi(sasql.data(12))
											local ITEM_MODIFYATTACK = other.atoi(sasql.data(13))
											local ITEM_MODIFYDEFENCE = other.atoi(sasql.data(14))
											local ITEM_MODIFYQUICK = other.atoi(sasql.data(15))
											local ITEM_MODIFYHP = other.atoi(sasql.data(16))
											local ITEM_MODIFYMP = other.atoi(sasql.data(17))
											local ITEM_MODIFYLUCK = other.atoi(sasql.data(18))
											local ITEM_MODIFYCHARM = other.atoi(sasql.data(19))
											local ITEM_MODIFYAVOID = other.atoi(sasql.data(20))
											local ITEM_MODIFYATTRIB = other.atoi(sasql.data(21))
											local ITEM_MODIFYATTRIBVALUE = other.atoi(sasql.data(22))
											local ITEM_MODIFYARRANGE = other.atoi(sasql.data(23))
											local ITEM_MODIFYSEQUENCE = other.atoi(sasql.data(24))
											local ITEM_ATTACHPILE = other.atoi(sasql.data(25))
											local ITEM_HITRIGHT = other.atoi(sasql.data(26))
											local ITEM_NEGLECTGUARD = other.atoi(sasql.data(27))
											local ITEM_POISON = other.atoi(sasql.data(28))
											local ITEM_PARALYSIS = other.atoi(sasql.data(29))
											local ITEM_SLEEP = other.atoi(sasql.data(30))
											local ITEM_STONE = other.atoi(sasql.data(31))
											local ITEM_DRUNK = other.atoi(sasql.data(32))
											local ITEM_CONFUSION = other.atoi(sasql.data(33))
											local ITEM_CRITICAL = other.atoi(sasql.data(34))
											local ITEM_COLOER = other.atoi(sasql.data(35))
											local ITEM_MERGEFLG = other.atoi(sasql.data(36))
											local ITEM_NAME = sasql.data(37)
											local ITEM_SECRETNAME = sasql.data(38)
											local ITEM_EFFECTSTRING = sasql.data(39)
											local ITEM_ARGUMENT = sasql.data(40)
											local ITEM_UNIQUECODE = sasql.data(41)
											local ITEM_BASEIMAGENUMBER = other.atoi(sasql.data(42))
											local mypoint = sasql.getVipPoint(charaindex)
											if price < 0 then
												return
											end
											if mypoint < price then
												char.newMessageToCli(charaindex,-1,"您的金币不足","白色")
												return
											end
											if ITEM_USEPILENUMS > 1 then
												if other.atoi(buynum) > ITEM_USEPILENUMS then
													return
												elseif other.atoi(buynum) == ITEM_USEPILENUMS then
													ret = sasql.query("update `streetitem` set `check`=1 where `cdkey`='" .. tocdkey .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
												else
													ret = sasql.query("update `streetitem` set `ITEM_USEPILENUMS`=" .. ITEM_USEPILENUMS - other.atoi(buynum) .. " where `cdkey`='" .. tocdkey .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
												end
											else
												buynum = "1"
												ret = sasql.query("update `streetitem` set `check`=1 where `cdkey`='" .. tocdkey .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
											end
											if ret == 1 then
												itemindex = char.Additem(charaindex,itemid)
												if item.check(itemindex) == 1 then
													item.setInt(itemindex,"次数",ITEM_DAMAGEBREAK)
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
													item.setChar(itemindex,"名称",ITEM_NAME)
													item.setChar(itemindex,"显示名",ITEM_SECRETNAME)
													item.setChar(itemindex,"说明",ITEM_EFFECTSTRING)
													item.setChar(itemindex,"字段",ITEM_ARGUMENT)
													if ITEM_USEPILENUMS <= 1 or other.atoi(buynum) == ITEM_USEPILENUMS then
														item.setChar(itemindex,"编码",ITEM_UNIQUECODE)
													end
													if other.atoi(buynum) > 1 then
														item.setInt(itemindex,"堆叠",other.atoi(buynum))
													end
													if ITEM_BASEIMAGENUMBER ~= -1 then
														item.setInt(itemindex,"图号",ITEM_BASEIMAGENUMBER)
													end
													for i=9,23 do
														item.UpdataHaveItemOne(charaindex,i)
													end
													char.newMessageToCli(charaindex,-1,"购买" .. ITEM_SECRETNAME .."*" .. other.atoi(buynum) .. "成功,扣除" .. price .. "金币","白色")
													ratepoint = math.ceil(price * rate)
													if ratepoint < 1 then
														ratepoint = 1
													end
													sellpoint = price - ratepoint
													if sellpoint > 0 then
														topoint = sasql.getVipPointForCdkey(tocdkey)
														sasql.setVipPointForCdkey(tocdkey,topoint + sellpoint)
														token = "insert into `VipPointLog` values ('" .. tocdkey .. "'," .. sellpoint .. "," .. topoint .. "," .. topoint + sellpoint .. ",'卖出道具[" .. ITEM_SECRETNAME .. "]*" .. other.atoi(buynum) .. "增加" .. sellpoint .. "金币',NOW())"
														sasql.query(token)
													end
													sasql.setVipPoint(charaindex,mypoint - price)
													other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,4,price})
													token = "insert into `VipPointLog` values ('" .. char.getChar(charaindex,"账号") .. "'," .. -price .. "," .. mypoint .. "," .. mypoint - price .. ",'购买道具[" .. ITEM_SECRETNAME .. "]*" .. other.atoi(buynum) .. "扣除" .. price .. "金币',NOW())"
													sasql.query(token)
													char.charSaveFromConnect(charaindex)
													token = "insert into `streetlog` values ('" .. tocdkey .. "',0,'" .. item.getChar(itemindex,"名称") .. "'," .. other.atoi(buynum) .. "," .. sellpoint .. ",'" .. char.getChar(charaindex,"账号") .. "','" .. char.getChar(charaindex,"名字") .. "'," .. other.time() .. ")"
													sasql.query(token)
												end
											end
											return
										else
											char.newMessageToCli(charaindex,-1,"该商品已被卖出或已下架","白色")
											return
										end
									end
								end
							else
								char.newMessageToCli(charaindex,-1,"该寄售摊位已关闭","白色")
								return
							end
						end
					end
				end
			end
		end
	end
end

function downProduct(meindex,talkerindex,type,uid)
	if type == 0 then
		local ret = sasql.query("select * from `streetitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			local sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				if checkEmptItemNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex,-1,"您的道具栏空位不足","白色")
					return false
				end
				sasql.fetch_row()
				local itemid = other.atoi(sasql.data(4))
				local ITEM_DAMAGEBREAK = other.atoi(sasql.data(5))
				local ITEM_USEPILENUMS = other.atoi(sasql.data(6))
				local ITEM_DAMAGECRUSHE = other.atoi(sasql.data(7))
				local ITEM_MAXDAMAGECRUSHE = other.atoi(sasql.data(8))
				local ITEM_OTHERDAMAGE = other.atoi(sasql.data(9))
				local ITEM_OTHERDEFC = other.atoi(sasql.data(10))
				local ITEM_ATTACKNUM_MIN = other.atoi(sasql.data(11))
				local ITEM_ATTACKNUM_MAX = other.atoi(sasql.data(12))
				local ITEM_MODIFYATTACK = other.atoi(sasql.data(13))
				local ITEM_MODIFYDEFENCE = other.atoi(sasql.data(14))
				local ITEM_MODIFYQUICK = other.atoi(sasql.data(15))
				local ITEM_MODIFYHP = other.atoi(sasql.data(16))
				local ITEM_MODIFYMP = other.atoi(sasql.data(17))
				local ITEM_MODIFYLUCK = other.atoi(sasql.data(18))
				local ITEM_MODIFYCHARM = other.atoi(sasql.data(19))
				local ITEM_MODIFYAVOID = other.atoi(sasql.data(20))
				local ITEM_MODIFYATTRIB = other.atoi(sasql.data(21))
				local ITEM_MODIFYATTRIBVALUE = other.atoi(sasql.data(22))
				local ITEM_MODIFYARRANGE = other.atoi(sasql.data(23))
				local ITEM_MODIFYSEQUENCE = other.atoi(sasql.data(24))
				local ITEM_ATTACHPILE = other.atoi(sasql.data(25))
				local ITEM_HITRIGHT = other.atoi(sasql.data(26))
				local ITEM_NEGLECTGUARD = other.atoi(sasql.data(27))
				local ITEM_POISON = other.atoi(sasql.data(28))
				local ITEM_PARALYSIS = other.atoi(sasql.data(29))
				local ITEM_SLEEP = other.atoi(sasql.data(30))
				local ITEM_STONE = other.atoi(sasql.data(31))
				local ITEM_DRUNK = other.atoi(sasql.data(32))
				local ITEM_CONFUSION = other.atoi(sasql.data(33))
				local ITEM_CRITICAL = other.atoi(sasql.data(34))
				local ITEM_COLOER = other.atoi(sasql.data(35))
				local ITEM_MERGEFLG = other.atoi(sasql.data(36))
				local ITEM_NAME = sasql.data(37)
				local ITEM_SECRETNAME = sasql.data(38)
				local ITEM_EFFECTSTRING = sasql.data(39)
				local ITEM_ARGUMENT = sasql.data(40)
				local ITEM_UNIQUECODE = sasql.data(41)
				local ITEM_BASEIMAGENUMBER = other.atoi(sasql.data(42))
				ret = sasql.query("delete from `streetitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
				if ret == 1 then
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
						item.setChar(itemindex,"名称",ITEM_NAME)
						item.setChar(itemindex,"显示名",ITEM_SECRETNAME)
						item.setChar(itemindex,"说明",ITEM_EFFECTSTRING)
						item.setChar(itemindex,"字段",ITEM_ARGUMENT)
						item.setChar(itemindex,"编码",ITEM_UNIQUECODE)
						if ITEM_BASEIMAGENUMBER ~= -1 then
							item.setInt(itemindex,"图号",ITEM_BASEIMAGENUMBER)
						end
						for i=9,23 do
							item.UpdataHaveItemOne(talkerindex,i)
						end
						--char.charSaveFromConnect(talkerindex)
					end
					if meindex~=-1 then
						lssproto.windowsupdate(talkerindex, "摊位框", "取消", 1, char.getWorkInt( meindex, "对象"), "D|" .. uid)
					end
				end
			else
				char.newMessageToCli(talkerindex,-1,"该商品已售出","白色")
				return
			end
		end
	elseif type == 1 then
		local ret = sasql.query("select * from `streetpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `CHAR_UNIQUECODE`='" .. uid .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			local sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				sasql.fetch_row()
				if checkEmptPetNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex,-1,"您的宠物栏位不足","白色")
					return false
				end
				local petid = other.atoi(sasql.data(4))
				local CHAR_BASEIMAGENUMBER = other.atoi(sasql.data(5))
				local CHAR_BASEBASEIMAGENUMBER = other.atoi(sasql.data(6))
				local CHAR_DIR = other.atoi(sasql.data(7))
				local CHAR_LV = other.atoi(sasql.data(8))
				local CHAR_VITAL = other.atoi(sasql.data(9))
				local CHAR_STR = other.atoi(sasql.data(10))
				local CHAR_TOUGH = other.atoi(sasql.data(11))
				local CHAR_DEX = other.atoi(sasql.data(12))
				local CHAR_MODAI = other.atoi(sasql.data(13))
				local CHAR_VARIABLEAI = other.atoi(sasql.data(14))
				local CHAR_EARTHAT  = other.atoi(sasql.data(15))
				local CHAR_WATERAT = other.atoi(sasql.data(16))
				local CHAR_FIREAT = other.atoi(sasql.data(17))
				local CHAR_WINDAT = other.atoi(sasql.data(18))
				local CHAR_SLOT  = other.atoi(sasql.data(19))
				local CHAR_CRITIAL = other.atoi(sasql.data(20))
				local CHAR_DEADCOUNT  = other.atoi(sasql.data(21))
				local CHAR_DAMAGECOUNT  = other.atoi(sasql.data(22))
				local CHAR_WHICHTYPE  = other.atoi(sasql.data(23))
				local CHAR_EXP = other.atoi(sasql.data(24))
				local CHAR_LASTTALKELDER = other.atoi(sasql.data(25))
				local CHAR_ALLOCPOINT  = other.atoi(sasql.data(26))
				local CHAR_PETRANK = other.atoi(sasql.data(27))
				local CHAR_TRANSMIGRATION  = other.atoi(sasql.data(28))
				local CHAR_PETFAMILY = other.atoi(sasql.data(29))
				local CHAR_LIMITLEVEL = other.atoi(sasql.data(30))
				local CHAR_BEATITUDE = other.atoi(sasql.data(31))
				local CHAR_NOFAME = other.atoi(sasql.data(32))
				local CHAR_SUPER = other.atoi(sasql.data(33))
				local PETSKILL1 = other.atoi(sasql.data(34))
				local PETSKILL2 = other.atoi(sasql.data(35))
				local PETSKILL3 = other.atoi(sasql.data(36))
				local PETSKILL4 = other.atoi(sasql.data(37))
				local PETSKILL5 = other.atoi(sasql.data(38))
				local PETSKILL6 = other.atoi(sasql.data(39))
				local PETSKILL7 = other.atoi(sasql.data(40))
				local CHAR_NAME = sasql.data(41)
				local CHAR_USERPETNAME = sasql.data(42)
				local CHAR_NEWNAME = sasql.data(43)
				local CHAR_PET_4V  = sasql.data(44)
				local CHAR_UNIQUECODE = sasql.data(45)
				local CHAR_ATTACK_EFFECT = other.atoi(sasql.data(47))
				local CHAR_LOWRIDEPETS = other.atoi(sasql.data(48))
				local CHAR_LOWRIDEPETS1 = other.atoi(sasql.data(49))
				local CHAR_HIGHRIDEPET2 = other.atoi(sasql.data(50))
				ret = sasql.query("delete from `streetpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `CHAR_UNIQUECODE`='" .. uid .. "'")
				if ret == 1 then
					local petindex = char.AddPetTempNo(talkerindex,petid,1)
					if char.check(petindex) == 1 then
						char.setInt(petindex,"图像号",CHAR_BASEIMAGENUMBER)
						char.setInt(petindex,"原图像号",CHAR_BASEBASEIMAGENUMBER)
						char.setInt(petindex,"方向",CHAR_DIR)
						char.setInt(petindex,"等级",CHAR_LV)
						char.setInt(petindex,"体力",CHAR_VITAL)
						char.setInt(petindex,"腕力",CHAR_STR)
						char.setInt(petindex,"耐力",CHAR_TOUGH)
						char.setInt(petindex,"速度",CHAR_DEX)
						char.setInt(petindex,"模式AI",CHAR_MODAI)
						char.setInt(petindex,"可变AI",CHAR_VARIABLEAI)
						char.setInt(petindex,"地",CHAR_EARTHAT)
						char.setInt(petindex,"水",CHAR_WATERAT)
						char.setInt(petindex,"火",CHAR_FIREAT)
						char.setInt(petindex,"风",CHAR_WINDAT)
						char.setInt(petindex,"宠技位",CHAR_SLOT)
						char.setInt(petindex,"暴击",CHAR_CRITIAL)
						char.setInt(petindex,"死亡次数",CHAR_DEADCOUNT)
						char.setInt(petindex,"损坏次数",CHAR_DAMAGECOUNT)
						char.setInt(petindex,"类型",CHAR_WHICHTYPE)
						char.setInt(petindex,"经验",CHAR_EXP)
						char.setInt(petindex,"出生地",CHAR_LASTTALKELDER)
						char.setInt(petindex,"能力值",CHAR_ALLOCPOINT)
						char.setInt(petindex,"成长区间",CHAR_PETRANK)
						char.setInt(petindex,"转数",CHAR_TRANSMIGRATION)
						char.setInt(petindex,"守护兽",CHAR_PETFAMILY)
						char.setInt(petindex,"限制等级",CHAR_LIMITLEVEL)
						char.setInt(petindex,"提升值",CHAR_BEATITUDE)
						char.setInt(petindex,"无声望模式",CHAR_NOFAME)
						char.setInt(petindex,"极品",CHAR_SUPER)
						char.setChar(petindex,"名字",CHAR_NAME)
						char.setChar(petindex,"昵称",CHAR_USERPETNAME)
						char.setChar(petindex,"称号",CHAR_NEWNAME)
						char.setChar(petindex,"宠物四围",CHAR_PET_4V)
						char.setChar(petindex,"唯一编号",CHAR_UNIQUECODE)
						char.setInt(petindex,"攻击特效",CHAR_ATTACK_EFFECT)
						char.setInt(petindex,"证书骑宠",CHAR_LOWRIDEPETS)
						char.setInt(petindex,"证书骑宠1",CHAR_LOWRIDEPETS1)
						char.setInt(petindex,"证书骑宠2",CHAR_HIGHRIDEPET2)
						char.setPetSkill(petindex,0,PETSKILL1)
						char.setPetSkill(petindex,1,PETSKILL2)
						char.setPetSkill(petindex,2,PETSKILL3)
						char.setPetSkill(petindex,3,PETSKILL4)
						char.setPetSkill(petindex,4,PETSKILL5)
						char.setPetSkill(petindex,5,PETSKILL6)
						char.setPetSkill(petindex,6,PETSKILL7)
						char.complianceParameter(petindex)
						char.setInt(petindex,"HP",char.getWorkInt(petindex,"最大HP"))
						other.CallFunction("petattupdate", "data/ablua/npc/petatterrect/petatterrect.lua", {petindex})
						for i=1,5 do
							if char.getCharPet(talkerindex, i - 1) == petindex then
								char.sendStatusString(talkerindex,"K" .. i - 1)
								char.sendStatusString(talkerindex,"W" .. i - 1)
								break
							end
						end
						--char.charSaveFromConnect(talkerindex)
					end
					if meindex~=-1 then
						lssproto.windowsupdate(talkerindex, "摊位框", "取消", 1, char.getWorkInt( meindex, "对象"), "D|" .. uid)
					end
				end
			-- else
			-- 	char.newMessageToCli(talkerindex,-1,"该商品已售出","白色")
			-- 	return 
			end
		end
	end
	return true
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	print("[street:WindowTalked]",seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno ~= 3 and seqno ~= 6 and data == "" then
		return
	end
	local streetflg = getStreetType(talkerindex)
	if seqno == 0 then
		num = other.atoi(data)
		print("[street:WindowTalked]seqno=0",streetflg, num)
		if streetflg == -1 then
			return
		elseif streetflg == 0 then
			if num == 1 then
				token = "您要将您的摊位时间延长12小时吗\n收费为20000石币"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 3, char.getWorkInt( meindex, "对象"), token)
				--延长时间
			end
			--char.newMessageToCli(talkerindex,-1,"您的寄售摊位不在该线路","白色")
			--return
		elseif streetflg == 1 then
			return
		elseif streetflg == 2 then
			if num < 1 or num > 3 then
				return
			end
			if num == 1 then
				if char.getInt(talkerindex,"石币") < 10000 then
					char.newMessageToCli(talkerindex,-1,"您的石币不足，无法摆摊","白色")
					return
				end
				if obj.getObjFromType(talkerindex,1,54) == 1 then
					char.newMessageToCli(talkerindex,-1,"您周围已有寄售摊位","白色")
					return
				end
				token = "insert into `streetdata` VALUES ('" .. char.getChar(talkerindex,"账号") .. "','" .. char.getChar(talkerindex,"名字") .. "的摊位'," .. streetimage[1][1] .. "," .. char.getInt(talkerindex,"地图号") .. "," .. char.getInt(talkerindex,"坐标X")
						.. "," .. char.getInt(talkerindex,"坐标Y") .. "," .. other.time() + 43200 .. "," .. config.getServernumber() .. ",-1)"
				ret = sasql.query(token)
				if ret == 1 then
					char.setInt(talkerindex,"石币",char.getInt(talkerindex,"石币") - 10000)
					Create(char.getChar(talkerindex,"名字") .. "的摊位", streetimage[1][1], char.getInt(talkerindex,"地图号"), char.getInt(talkerindex,"坐标X"), char.getInt(talkerindex,"坐标Y"), char.getChar(talkerindex,"账号"),other.time() + 43200)
					char.Updata(talkerindex,"石币")
				else
					return
				end
			elseif num == 2 then
				local numtmp = 0
				token = ""
				ret = sasql.query("select * from `streetpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						numtmp = numtmp + sqlnum
						for i=1,sqlnum do
							sasql.fetch_row()
							token = token .. "|1|" .. sasql.data(45) .. "|" .. sasql.data(41) .. "|0|" .. sasql.data(3)
						end
					end
				end
				ret = sasql.query("select * from `streetitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						numtmp = numtmp + sqlnum
						for i=1,sqlnum do
							sasql.fetch_row()
							token = token .. "|0|" .. sasql.data(41) .. "|" .. sasql.data(38) .. "|" .. sasql.data(6) .. "|" .. sasql.data(3)
						end
					end
				end
				lssproto.windows(talkerindex, "摊位框", "取消", 1, char.getWorkInt( meindex, "对象"), "L|0|" .. numtmp .. token)
			elseif num == 3 then
				token = "select * from `streetlog` where `sellcdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					sellpage = math.ceil(sqlnum / 10)
					sellnum = math.min(sqlnum,10)
					token = "L|" .. sellnum .. "|" .. sellpage
					if sqlnum > 0 then
						for i=1,sellnum do
							sasql.fetch_row()
							token = token .. "|" .. sasql.data(1) .. "|" .. sasql.data(8) .. "|" .. sasql.data(7) .. "|" .. sasql.data(3) .. "|" .. sasql.data(4) .. "|" .. sasql.data(5)
						end
					end
					lssproto.windows(talkerindex, 1005, "取消", 5, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif streetflg == 3 then
			if num < 1 or num > 8 then
				return
			end
			if num == 1 then
				local numtmp = 0
				token = ""
				ret = sasql.query("select * from `streetpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						numtmp = numtmp + sqlnum
						for i=1,sqlnum do
							sasql.fetch_row()
							token = token .. "|1|" .. sasql.data(45) .. "|" .. sasql.data(41) .. "|0|" .. sasql.data(3)
						end
					end
				end
				ret = sasql.query("select * from `streetitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						numtmp = numtmp + sqlnum
						for i=1,sqlnum do
							sasql.fetch_row()
							token = token .. "|0|" .. sasql.data(41) .. "|" .. sasql.data(38) .. "|" .. sasql.data(6) .. "|" .. sasql.data(3)
						end
					end
				end
				lssproto.windows(talkerindex, "摊位框", "取消", 1, char.getWorkInt( meindex, "对象"), "L|1|" .. numtmp  .. token)
			elseif num == 2 then
				streetname = ""
				ret = sasql.query("select `name` from `streetdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						streetname = sasql.data(1)
					end
				end
				lssproto.sendNewStreet(char.getFd(talkerindex),"O|" .. streetname)
				--上架物品
			elseif num == 3 then
				token = "输入您要更改的摊位名"
				lssproto.windows(talkerindex, "输入框", "确定|取消", 4, char.getWorkInt( meindex, "对象"), token)
				--更换摊名
			elseif num == 4 then
				token = ""
				for i=2,#streetimage do
					token = token .. "|" .. streetimage[i][1] .. "|" .. streetimage[i][3]
				end
				lssproto.windows(talkerindex, "摊位样式框", "取消", 2, char.getWorkInt( meindex, "对象"), "T|" .. #streetimage - 1 .. token)
				--更换样式
			elseif num == 5 then
				token = "您要将您的摊位时间延长12小时吗\n收费为20000石币"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 3, char.getWorkInt( meindex, "对象"), token)
				--延长时间
			elseif num == 6 then
				token = "您确定要收摊吗？"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 6, char.getWorkInt( meindex, "对象"), token)
			elseif num == 7 then
				token = "select * from `streetlog` where `sellcdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					sellpage = math.ceil(sqlnum / 10)
					sellnum = math.min(sqlnum,10)
					token = "L|" .. sellnum .. "|" .. sellpage
					if sqlnum > 0 then
						for i=1,sellnum do
							sasql.fetch_row()
							token = token .. "|" .. sasql.data(1) .. "|" .. sasql.data(8) .. "|" .. sasql.data(7) .. "|" .. sasql.data(3) .. "|" .. sasql.data(4) .. "|" .. sasql.data(5)
						end
					end
					lssproto.windows(talkerindex, 1005, "取消", 5, char.getWorkInt( meindex, "对象"), token)
				end
			elseif num == 8 then
				if char.getWorkInt(talkerindex,"组队") ~= 0 then
					char.newMessageToCli(talkerindex,-1,"队伍中无法使用此功能","白色")
					return
				end
				ret = sasql.query("select `floor`,`x`,`y` from `streetdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						street_floor = other.atoi(sasql.data(1))
						street_x = other.atoi(sasql.data(2))
						street_y = other.atoi(sasql.data(3))
						char.WarpToSpecificPoint(talkerindex,street_floor,street_x,street_y)
					end
				end
			end
		elseif streetflg == 4 then
			if num < 1 or num > 6 then
				return
			end
			if num == 1 then
				streetname = ""
				ret = sasql.query("select `name` from `streetdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						streetname = sasql.data(1)
					end
				end
				lssproto.sendNewStreet(char.getFd(talkerindex),"O|" .. streetname)
				--上架物品
			elseif num == 2 then
				token = ""
				for i=2,#streetimage do
					token = token .. "|" .. streetimage[i][1] .. "|" .. streetimage[i][3]
				end
				lssproto.windows(talkerindex, "摊位样式框", "取消", 2, char.getWorkInt( meindex, "对象"), "T|" .. #streetimage - 1 .. token)
				--更换样式
			elseif num == 3 then
				token = "您要将您的摊位时间延长12小时吗\n收费为20000石币"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 3, char.getWorkInt( meindex, "对象"), token)
				--延长时间
			elseif num == 4 then
				token = "您确定要收摊吗？"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 6, char.getWorkInt( meindex, "对象"), token)
			elseif num == 5 then
				token = "select * from `streetlog` where `sellcdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					sellpage = math.ceil(sqlnum / 10)
					sellnum = math.min(sqlnum,10)
					token = "L|" .. sellnum .. "|" .. sellpage
					if sqlnum > 0 then
						for i=1,sellnum do
							sasql.fetch_row()
							token = token .. "|" .. sasql.data(1) .. "|" .. sasql.data(8) .. "|" .. sasql.data(7) .. "|" .. sasql.data(3) .. "|" .. sasql.data(4) .. "|" .. sasql.data(5)
						end
					end
					lssproto.windows(talkerindex, 1005, "取消", 5, char.getWorkInt( meindex, "对象"), token)
				end
			elseif num == 6 then--找摊位
				if char.getWorkInt(talkerindex,"组队") ~= 0 then
					char.newMessageToCli(talkerindex,-1,"队伍中无法使用此功能","白色")
					return
				end
				ret = sasql.query("select `floor`,`x`,`y` from `streetdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						sasql.fetch_row()
						street_floor = other.atoi(sasql.data(1))
						street_x = other.atoi(sasql.data(2))
						street_y = other.atoi(sasql.data(3))
						char.WarpToSpecificPoint(talkerindex,street_floor,street_x,street_y)
					end
				end
			end
		end
	elseif seqno == 1 then--下架
		local flg = other.getString(data,"|",1)
		if flg == "D" then
			local type = other.getString(data,"|",2)
			local uid = other.getString(data,"|",3)
			if type == "" or uid == "" then
				return
			end
			downProduct(meindex,talkerindex,tonumber(type),uid)
		elseif flg == "Z" then
			local type = other.getString(data,"|",2)
			local uid = other.getString(data,"|",3)
			local price = other.getString(data,"|",4)
			if type == "" or uid == "" or price == "" then
				return
			end
			if other.atoi(price) < 1 then
				return
			end
			if other.atoi(type) == 0 then
				ret = sasql.query("select * from `streetitem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						ret = sasql.query("update `streetitem` set `price`=" .. other.atoi(price) .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `ITEM_UNIQUECODE`='" .. uid .. "'")
						if ret == 1 then
							lssproto.windowsupdate(talkerindex, "摊位框", "取消", 1, char.getWorkInt( meindex, "对象"), "Z|" .. uid .. "|" .. price)
						end
					else
						char.newMessageToCli(talkerindex,-1,"该商品已售出","白色")
						return
					end
				end
			elseif other.atoi(type) == 1 then
				ret = sasql.query("select * from `streetpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `CHAR_UNIQUECODE`='" .. uid .. "'")
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					sqlnum = sasql.num_rows()
					if sqlnum > 0 then
						ret = sasql.query("update `streetpet` set `price`=" .. other.atoi(price) .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `CHAR_UNIQUECODE`='" .. uid .. "'")
						if ret == 1 then
							lssproto.windowsupdate(talkerindex, "摊位框", "取消", 1, char.getWorkInt( meindex, "对象"), "Z|" .. uid .. "|" .. price)
						end
					else
						char.newMessageToCli(talkerindex,-1,"该商品已售出","白色")
						return
					end
				end
			end
		end
	elseif seqno == 2 then
		if data == "" then
			return
		end
		if other.getString(data,"|",1) == "T" then
			local type = other.getString(data,"|",2)
			if type == "" then
				return
			end
			if other.atoi(type) < 1 or other.atoi(type) > #streetimage - 1 then
				return
			end
			local image = streetimage[other.atoi(type) + 1][1]
			local point = streetimage[other.atoi(type) + 1][3]
			if streetflg == 3 or streetflg == 4 then
				if sasql.getVipPoint(talkerindex) < point then
					char.newMessageToCli(talkerindex,-1,"您的金币不足，无法更换摊位样式","白色")
					return
				end
				ret = sasql.query("update `streetdata` set `image`=" .. image .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					local myvippoint = sasql.getVipPoint(talkerindex)
					sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - point)
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,point})
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,point})
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -point .. "," .. myvippoint .. "," .. myvippoint - point .. ",'购买摊位形象扣除" .. point .. "金币',NOW())"
					sasql.query(token)
					ret = sasql.query("select `index` from `streetdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						if sasql.num_rows() > 0 then
							sasql.fetch_row()
							local mynpcindex = other.atoi(sasql.data(1))
							if char.check(mynpcindex) == 1 then
								char.setInt(mynpcindex,"图像号",image)
								char.ToAroundChar(mynpcindex)
							end
						end
					end
					char.newMessageToCli(talkerindex,-1,"更改摊位样式成功，扣除" .. point .. "金币","白色")
				end
			end
		end
	elseif seqno == 3 then
		if select == 1 then
			if streetflg == 3 or streetflg == 4 or streetflg == 0 then
				if char.getInt(talkerindex,"石币") < 20000 then
					char.newMessageToCli(talkerindex,-1,"您的石币不足，无法延长摊位时间","白色")
					return
				end
				ret = sasql.query("update `streetdata` set `time`=`time` + 43200 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
				if ret == 1 then
					char.setInt(talkerindex,"石币",char.getInt(talkerindex,"石币") - 20000)
					char.Updata(talkerindex,"石币")
					char.newMessageToCli(talkerindex,-1,"延长摊位时间成功，扣除20000石币","白色")
				end
			end
		end
	elseif seqno == 4 then
		if select == 1 and streetflg == 3 then
			if data == "" then
				return
			end
			if string.len(data) > 12 then
				char.newMessageToCli(talkerindex,-1,"摊位名最多6个中文","白色")
				return
			end
			ret = sasql.query("select `index` from `streetdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					local mynpcindex = other.atoi(sasql.data(1))
					if char.check(mynpcindex) == 1 then
						ret = sasql.query("update `streetdata` set `name`='" .. data .. "' where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
						if ret == 1 then
							char.setChar(mynpcindex,"名字",data)
							char.ToAroundChar(mynpcindex)
							char.newMessageToCli(talkerindex,-1,"修改摊位名成功","白色")
						end
					end
				else
					char.newMessageToCli(talkerindex,-1,"您还没有摆摊哦","白色")
				end
			end
		end
	elseif seqno == 5 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		local page = other.getString(data,"|",2)
		if type == "" or page == "" then
			return
		end
		if type == "A" then
			pagenum = other.atoi(page)
			token = "select * from `streetlog` where `sellcdkey`='" .. char.getChar(talkerindex,"账号") .. "' order by `time` desc limit " .. (pagenum - 1) * 10 .. ",10"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				sqlnum = sasql.num_rows()
				token = "A|" .. sqlnum
				if sqlnum > 0 then
					for i=1,sqlnum do
						sasql.fetch_row()
						token = token .. "|" .. sasql.data(1) .. "|" .. sasql.data(8) .. "|" .. sasql.data(7) .. "|" .. sasql.data(3) .. "|" .. sasql.data(4) .. "|" .. sasql.data(5)
					end
				end
				lssproto.windowsupdate(talkerindex, 1016, "取消", 5, char.getWorkInt( meindex, "对象"), token)
			end
		end
	elseif seqno == 6 then--收摊
		if select == 1 then
			local cdkey = char.getChar(talkerindex,"账号")
			local ret = sasql.query("select `index` from `streetdata` where `cdkey`='" .. cdkey .. "'")
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				if sasql.num_rows() > 0 then
					sasql.fetch_row()
					local mynpcindex = other.atoi(sasql.data(1))
					--先下架商品
					ret = sasql.query("select CHAR_UNIQUECODE from `streetpet` where `cdkey`='" .. cdkey.."'")
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						local sqlnum = sasql.num_rows()
						for i=1,sqlnum do
							sasql.fetch_row()
							if not downProduct(meindex,talkerindex,1,sasql.data(1)) then
								char.newMessageToCli(talkerindex,-1,"收摊失败!","白色")
								return
							end
						end
					end
					ret = sasql.query("select ITEM_UNIQUECODE from `streetitem` where `cdkey`='" .. cdkey .. "' and `check`=0 ")
					if ret == 1 then
						sasql.free_result()
						sasql.store_result()
						local sqlnum = sasql.num_rows()
						for i=1,sqlnum do
							sasql.fetch_row()
							if not downProduct(meindex,talkerindex,0,sasql.data(1)) then
								char.newMessageToCli(talkerindex,-1,"收摊失败!","白色")
								return
							end
						end
					end
					token = "delete from `streetdata` where `cdkey`='" .. cdkey.. "'"
					ret = sasql.query(token)
					if ret == 1 then
						npc.DelNpc(mynpcindex)
						char.newMessageToCli(talkerindex,-1,"收摊成功,未出售物品自动返回.","白色")
					end
				end
			end
		end
	end
end

function Create(name, metamo, floor, x, y,cdkey,deltime)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local tmpindex = npc.CreateNpc(name, metamo, floor, x, y, 5)
	char.setWorkChar(tmpindex,"NPC临时1",cdkey)
	char.setWorkInt(tmpindex,"NPC临时1",deltime)
	char.setInt(tmpindex,"类型",54)
	char.ToAroundChar(tmpindex)
	char.setFunctionPointer(tmpindex, "循环事件", "Loop", "")
	char.setInt(tmpindex, "循环事件时间", 600000)
	sasql.query("update `streetdata` set `index`=" .. tmpindex .. " where `cdkey`='" .. cdkey .. "'")
end

function CreateNpc(name, metamo, floor, x, y)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, 5)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "NpcLoop", "")
	char.setInt(npcindex, "循环事件时间", 600000)
end

function data()
	rate = 0.1
	streetimage = {{51477,51478,0}
					,{51479,51480,100}
					,{51481,51482,100}
					,{51483,51484,100}
					,{51485,51486,300}
					,{51487,51488,300}
					,{51489,51490,300}
					,{51491,51492,300}
					,{51493,51494,500}
					,{51495,51496,500}
					,{51497,51498,500}
					,{51499,51500,500}
					,{51501,51502,500}
					,{51503,51504,500}
					,{51505,51506,500}
					,{51507,51508,500}
					,{51509,51510,1000}
					,{51511,51512,1000}
					,{51513,51514,1000}
					,{51515,51516,1000}
					,{51517,51518,1000}}
end

function main()
	data()
	CreateNpc("管理摊位",100000,777, 13, 26)
	token = "DELETE FROM `streetdata` WHERE `time` < " .. other.time()
	sasql.query(token)
	token = "SELECT * FROM `streetdata`"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			for i=1,num do 
				sasql.fetch_row();
				if other.atoi(sasql.data(8)) == config.getServernumber() then
					if other.atoi(sasql.data(7)) < other.time() then
						token = "delete from `streetdata` where `cdkey`='" .. cdkey .. "'"
						sasql.query(token)
					else
						Create(sasql.data(2), other.atoi(sasql.data(3)), other.atoi(sasql.data(4)), other.atoi(sasql.data(5)), other.atoi(sasql.data(6)), sasql.data(1),other.atoi(sasql.data(7)))
					end
				end
			end
		end
	end
end
