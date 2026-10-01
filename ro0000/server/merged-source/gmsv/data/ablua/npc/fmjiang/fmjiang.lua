--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToChara(talkerindex, meindex,1) == 1 then 
		token = "                「 " .. char.getChar(meindex,"名字") .." 」\n\n"
			  .."为了鼓励族战，作为庄园统治者我会奖励给守庄天数超过7天的家族，隔天12点-14点领奖\n成功守庄30天+  随机1个稀有蛋蛋\n成功守庄15天+  机暴证（永久）\n成功守庄 7天 随机商宠的蛋蛋"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--char.TalkToCli(talkerindex,-1, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if select == 1 then
			local myfloorid = char.getWorkInt( talkerindex, "家族地图")
			local myflg = char.getInt( talkerindex, "家族地位")
			local myfmid = 0
			for i=1,#fmfloorid do
				if myfloorid == fmfloorid[i] then
					myfmid = i
					break
				end
			end
			if myfmid == 0 or myflg ~= 3 then
				char.TalkToCli(talkerindex,meindex, "您不是4大庄园家族族长，无法领取。", "随机色")
				return
			end
			
			--[[if nowday ~= 0 or nowhour < 12 or nowhour > 21 then
				char.TalkToCli(talkerindex,meindex, "现在不是星期日中午12点到21点之间，无法领取。", "随机色")
				return
			end]]
			token = "SELECT `time`, `jiangtime` FROM `fmpointdata` "
				.. " WHERE `id` = '" .. myfmid .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				num = sasql.num_rows()
				if num > 0 then
					sasql.fetch_row(0)
					local zhantime = other.atoi(sasql.data(1))
					local jiangtime = other.atoi(sasql.data(2))
					local nowdate = other.atoi(os.date("%Y", os.time()) .. os.date("%m", os.time()) .. os.date("%d", os.time()))
					local jiangdate = other.atoi(os.date("%Y", jiangtime) .. os.date("%m", jiangtime) .. os.date("%d", jiangtime))
					if nowdate == jiangdate then
						char.TalkToCli(talkerindex,meindex, "您今日已经领取过了，无法领取。", "随机色")
						return
					end
					local zhanday = math.floor((other.time() - zhantime) / 86400)
					local jiangflg = 0
					local nowday = tonumber(os.date("%w", os.time()))
			        local nowhour = tonumber(os.date("%H", os.time()))
					if (zhanday ~= 8 and zhanday ~= 16 and zhanday ~= 31) or (nowhour ~= 12 and nowhour ~= 13) then
						char.TalkToCli(talkerindex,meindex, "占领天数或时间未到暂时无法领取", "随机色")
						return
					end
					
					if zhanday >= 30 then
						jiangflg = 3
					elseif zhanday >= 15 then
						jiangflg = 2
					elseif zhanday >= 7 then
						jiangflg = 1
					end
					if jiangflg == 0 then
						char.TalkToCli(talkerindex,meindex, "您占庄天数不足7天，无法领取。", "随机色")
						return
					end
					local jiangitemindex = char.Additem(talkerindex,fmitemid[jiangflg][myfmid])
					if jiangitemindex > -1 then
						char.TalkToCli(talkerindex,meindex, "恭喜您的家族[" .. char.getChar(talkerindex,"家族") .. "]成功守庄" .. math.floor(zhanday) .. "天，领取奖励[" .. item.getChar(jiangitemindex,"名称") .. "]，再接再厉哦。", "随机色")
						token = "update `fmpointdata` set `jiangtime`='" .. other.time() .. "' where `id`='" .. myfmid .. "'"
						sasql.query(token)
					else
						char.TalkToCli(talkerindex,meindex, "您身上道具已满，无法领取。", "随机色")
						return
					end
				end
			end
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
	fmfloorid = {1041, 2031, 3031, 4031,5031}
	fmitemid = {{22000,22000,22000,22000,22000},{23805,23805,23805,23805,23805},{29063,29015,29016,29017,29018}}
end

function main()
	data()
	if config.getGameservername() == "娱乐互动线" then
	Create("庄园奖励", 102040, 1000, 77, 77, 6)
	Create("庄园奖励", 102040, 2005, 9, 23, 6)
end
end