function checkEmptItemNum(charaindex)
	local maxitemnum = 9+15
	EmptyItemNum = 0
	for i = 9, maxitemnum-1 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if char.getInt(meindex,"地图号") == 8213 then
		char.setWorkInt(meindex,"传送标识",7)
	elseif char.getInt(meindex,"地图号") == 8210 then
		char.setWorkInt(meindex,"传送标识",6)
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		local token = "                 『" .. char.getChar(meindex, "名字") .. "』\n\n"
				 .. "    你真厉害，能跑到这里来，送你个礼物吧！!感谢有你。"

		lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 1 then
			if select == 1 then
				if checkEmptItemNum(talkerindex) == 0 then
					char.TalkToCli(talkerindex, -1, "很抱歉，您的身上物品已满！", "红色")
					return
				end
				local flg = QueryInfo(talkerindex)
				if flg == -1 then
					char.TalkToCli(talkerindex, -1, "很抱歉，您已经领取过了！", "红色")
					return
				elseif flg == 1 then
					local id = char.getWorkInt(meindex,"传送标识");
					local chartitleflg = char.getInt(talkerindex, "132称号");
					if other.DataAndData(chartitleflg,id-1) == 0 then
						char.setInt(talkerindex, "132称号",other.DataOrData(chartitleflg,id-1))
						if chartitleflg == 0 then
							InsertLog(talkerindex,0)
						else
							InsertLog(talkerindex,1)
						end
						npc.AddItem(talkerindex, itemid[id])
					else
						local token = "                 『" .. char.getChar(meindex, "名字") .. "』\n\n"
								 .. "    您已经领取过奖励啦。"
				
						lssproto.windows(talkerindex, "对话框", "确定", 0, char.getWorkInt( meindex, "对象"), token)
					end
				end
			end
		end
	end
end

function QueryInfo(charaindex)
	token = "SELECT * FROM `maintainprize1` WHERE `cdkey`='"..char.getChar(charaindex, "账号").."'"
	--print(token)
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			return -1
		end
	end
	return 1
end

function InsertLog(charaindex,type1)
	local token = "";
	if type1 == 0 then
		token = "INSERT INTO `132title` ("
										.. "`cdkey` ,"
										.. "`name` ,"
										.. "`time` ,"
										.. "`mac`,"
										.. "`flg`"
										.. ")"
										.. "VALUES ("
										.. "'"
										.. char.getChar(charaindex, "账号")  .. "', '"
										.. char.getChar(charaindex, "名字") .. "', "
										.. "NOW(), '"
										.. char.getWorkChar(charaindex, "MAC") .. "',"
										.. char.getInt(charaindex, "132称号")
										.. ");"
	else
		token = "UPDATE `132title` "
							.. "SET `flg` = " .. char.getInt(charaindex, "132称号")
							.. " WHERE `cdkey` = '" .. char.getChar(charaindex, "账号")  .. "'"
							.. " AND `name` = '" .. char.getChar(charaindex, "名字")  .. "'"
	end
	--print(token)
	ret = sasql.query(token)
end

function TalkedWarp(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "2\n请选择要传送到的楼层：\n"
			 .. "\n21层"
			 .. "\n41层"
			 .. "\n61层"
			 .. "\n81层"
			 .. "\n101层"
			 .. "\n121层"
		lssproto.windows(talkerindex, "选择框", "取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalkedWarp ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 1 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > 6 then
				return
			end
			local chartitleflg = char.getInt(talkerindex, "132称号");
			if other.DataAndData(chartitleflg,num-1) == 0 then
				char.TalkToCli(talkerindex, -1, "很抱歉，您还没有挑战到这个楼层。", "红色")
				return
			end
			if char.getWorkInt(talkerindex, "组队") ~= 0 then
				char.TalkToCli(talkerindex, -1, "很抱歉，组队模式下不允许传送的哦。", "红色")
				return
			end
			token = "您确定要传送到第[" .. num * 20 + 1 .. "]层吗\n"
				 .. "传送到该楼层需要支付" .. warppoint[num][4] .. "金币\n"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 10 + num, char.getWorkInt( meindex, "对象"), token)
		elseif seqno >= 11 and seqno <= 16 then
			if select ~= 1 and select ~= 4 then
				return
			end
			num = seqno - 10
			local chartitleflg = char.getInt(talkerindex, "132称号");
			if other.DataAndData(chartitleflg,num-1) == 0 then
				char.TalkToCli(talkerindex, -1, "很抱歉，您还没有挑战到这个楼层。", "红色")
				return
			end
			if char.getWorkInt(talkerindex, "组队") ~= 0 then
				char.TalkToCli(talkerindex, -1, "很抱歉，组队模式下不允许传送的哦。", "红色")
				return
			end
			if sasql.getVipPoint(talkerindex) < warppoint[num][4] then
				char.TalkToCli(talkerindex, -1, "很抱歉，您的金币不足" .. warppoint[num][4] .. "。", "红色")
				return
			end
			sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - warppoint[num][4])
			other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,warppoint[num][4]})
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,warppoint[num][4]})
			char.WarpToSpecificPoint(talkerindex, warppoint[num][1], warppoint[num][2], warppoint[num][3])
			if num == 1 then
				npc.EvNow(talkerindex,"151")
				npc.EvEnd(talkerindex,"151")
			elseif num == 2 then
				npc.EvNow(talkerindex,"152")
				npc.EvClr(talkerindex,"151")
			elseif num == 3 then
				npc.EvNow(talkerindex,"152")
				npc.EvEnd(talkerindex,"152")
			elseif num == 4 then
				npc.EvNow(talkerindex,"153")
				npc.EvClr(talkerindex,"152")
			elseif num == 5 then
				npc.EvNow(talkerindex,"153")
				npc.EvEnd(talkerindex,"153")
			elseif num == 6 then
				npc.EvNow(talkerindex,"154")
				npc.EvClr(talkerindex,"153")
			end
			char.TalkToCli(talkerindex, -1, "传送成功，扣除" .. warppoint[num][4] .. "金币。", "红色")
		end
	end
end

function Create(name, metamo, floor, x, y, dir,id)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setWorkInt(npcindex,"NOTICE",120139)
	char.setWorkInt(npcindex,"传送标识",id)
end

function CreateWarp(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "TalkedWarp", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalkedWarp", "")
	char.setWorkInt(npcindex,"NOTICE",120139)
end

function data()
	itemid = {22480,22482,22483,22484,22485,22060};
	warppoint = {{8201,73,135,500}
				,{8203,155,73,1000}
				,{8205,206,23,2000,}
				,{8206,81,130,4000,}
				,{8208,136,68,8000,}
				,{8210,203,28,15000,}}
end

function main()
	data()
	Create("20层称号领取", 105111, 8201, 74, 135, 6,1)
	Create("40层称号领取", 105111, 8203, 156, 73, 6,2)
	Create("60层称号领取", 105111, 8205, 207, 23, 6,3)
	Create("80层称号领取", 105111, 8206, 81, 129, 4,4)
	Create("100层称号领取", 105111, 8208, 136, 67, 4,5)
	Create("120层称号领取", 105111, 8210, 203, 26, 4,6)
	Create("132层奖励领取", 105111, 8213, 25, 148, 4,7)
	CreateWarp("英雄道场传送", 105111, 8200, 211, 29, 4)
end

