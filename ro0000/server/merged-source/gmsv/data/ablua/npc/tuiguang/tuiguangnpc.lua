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
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function zhizuosn(charaindex, data)
	if data == nil then
		char.TalkToCli(charaindex, -1, "请输入参数[数量 宠物ID 道具ID]", "随机色")
		return
	end
	local nonum = other.atoi(other.getString(data, " ", 1))
	if nonum < 1 or nonum > 10000 then
		char.TalkToCli(charaindex, -1, "数量在1-10000之间", "随机色")
		return
	end
	local petid = other.atoi(other.getString(data, " ", 2))
	if petid < 0 then
		char.TalkToCli(charaindex, -1, "宠物ID非法，如果不需要请填写0", "随机色")
		return
	end
	local itemid = other.atoi(other.getString(data, " ", 3))
	if itemid < 0 then
		char.TalkToCli(charaindex, -1, "道具ID非法，如果不需要请填写0", "随机色")
		return
	end
	
	local tempbuff = other.getString(data, " ", 4)
	if tempbuff == "" then
		char.TalkToCli(charaindex, -1, "请输入备注", "随机色")
		return
	end
	
	local type = other.getString(data, " ", 5)
	if type == "" then
		char.TalkToCli(charaindex, -1, "请输入类型", "随机色")
		return
	end
	
	for i=1,nonum do
		local buf = ""
		for j=1,16 do
			buf = buf .. alpha[math.random(36)]
		end
		token = "INSERT INTO `SnNoPetItem` ("
				.. "`CostPasswd` ,"
				.. "`PetId` ,"
				.. "`ItemId` ,"
				.. "`cdkey` ,"
				.. "`cdkey2` ,"
				.. "`CostTime` ,"
				.. "`check`,"
				.. "`buff`,"
				.. "`type`"
				.. ") VALUES (BINARY"
				.. "'" .. buf 
				.. "', '" .. petid 
				.. "', '" .. itemid 
				.. "', '" 
				.. "', '" 
				.. "', '0000-00-00 00:00:00" 
				.. "', '0"
				.. "','" .. tempbuff .. "'," .. other.atoi(type) .. ");"
		ret = sasql.query(token)
	end
	char.TalkToCli(charaindex, -1, "卡密制作成功。", "随机色")
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "请在框内输入16位卡密(CDK)：\n\n卡密的来源：论坛贡献商城贡献值兑换\n贡献的来源：通过论坛推广任务帮游戏做推广\n大家动起手来，一起共建美好火爆的石器时代"
		lssproto.windows(talkerindex, "输入框", "确定|取消", 0, char.getWorkInt(meindex,"对象"), token)
	end
end

function LUAWindowTalked( talkerindex ,data)
	WindowTalked(npcindex,talkerindex,0,0,data)
	return 0
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if data == "" then
		return
	end
	if string.len(data) ~= 16 then
		char.newMessageToCli(talkerindex, -1, "密钥输入错误", "白色")
		return
	end
	local lenInByte = #data
	local feifa = 0
	for i=1,lenInByte do
		local curByte = string.byte(data, i)
		if (curByte < 48 or curByte > 57) and (curByte < 65 or curByte > 90) and (curByte < 97 or curByte > 122) then
			feifa = 1
			break
		end
	end
	if feifa == 1 then
		char.newMessageToCli(talkerindex, -1, "密钥含有非法字符", "白色")
		return
	end
	token = "select `PetId`,`ItemId`,`check`,`cdkey2`,`type` from `SnNoPetItem` where `CostPasswd`='" .. data .. "';"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			local petid = other.atoi(sasql.data(1))
			local itemid = other.atoi(sasql.data(2))
			local checktype = other.atoi(sasql.data(3))
			local cdkey2 = sasql.data(4)
			local type = other.atoi(sasql.data(5))
			if checktype ~= 0 then
				char.newMessageToCli(talkerindex, -1, "该密钥已经被使用过了", "白色")
				return
			end
			if cdkey2 ~= nil then
				if cdkey2 ~= "" and char.getChar(talkerindex,"账号") ~= cdkey2 then
					char.newMessageToCli(talkerindex, -1, "您的CDK与领取账号不符", "白色")
					return
				end
			end
			if type > 0 then
				token = "select * from `SnNoPetItem` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `type`='" .. type .. "'"
				ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					if sasql.num_rows() > 0 then
						char.newMessageToCli(talkerindex,-1,"您已经领取过该类礼包","白色")
						return
					end
				else
					return
				end
			end
			if petid > 0 then
				if checkEmptPetNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex, -1, "您的宠物栏已满", "白色")
					return
				end
			end
			if itemid > 0 then
				if checkEmptItemNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex, -1, "您的道具栏已满", "白色")
					return
				end
			end
			local petindex = -1
			local itemindex = -1
			if petid > 0 then
				petindex = char.AddPet(talkerindex,petid,1)
				if petindex > -1 then
					if string.sub(char.getChar(petindex,"名字"),1,1) ~= '*' then
						char.setChar(petindex,"名字","*" .. char.getChar(petindex,"名字"))
					end
					for i = 0, 4 do
						if petindex == char.getCharPet(talkerindex, i) then
							char.sendStatusString(talkerindex, "K" .. i)
							break
						end
					end
					char.newMessageToCli(talkerindex, -1, "获得宠物[" .. char.getChar(petindex,"名字") .. "]", "白色")
				end
			end
			if itemid > 0 then
				itemindex = char.Additem(talkerindex,itemid)
				if itemindex > -1 then
					if string.sub(item.getChar(itemindex,"名称"),1,1) ~= '*' then
						item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
						item.UpdataItemOne(talkerindex,itemindex)
					end
					char.newMessageToCli(talkerindex, -1, "获得道具[" .. item.getChar(itemindex,"名称") .. "]", "白色")
				end
			end
			token = "update `SnNoPetItem` set `cdkey`='" .. char.getChar(talkerindex,"账号") .. "',`CostTime`=NOW(),`check`=1 where `CostPasswd`='" .. data .. "';"
			sasql.query(token)
			token = ""
			if petindex > -1 then
				token = token .. "< " .. char.getChar(petindex,"名字") .. " >"
			end
			if itemindex > -1 then
				token = token .. "< " .. item.getChar(itemindex,"名称") .. " >"
			end
		else
			char.newMessageToCli(talkerindex, -1, "您输入的密钥错误", "白色")
			return
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	alpha = {"0",  "1",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9"
					,"A",  "B",  "C",  "D",  "E",  "F",  "G"
					,"H",  "I",  "J",  "K",  "L",  "M",  "N"
					,"o",  "P",  "Q",  "R",  "S",  "T"
					,"U",  "V",  "W",  "X",  "Y",  "Z"
					}
end

function main()
	data()
	magic.addLUAListFunction("zuocdk", "zhizuosn", "", 3, "测试专用命令")
	Create("礼包领取员", 70217, 1006, 17, 13, 4)
	Create("礼包领取员", 70217, 2006, 12, 13, 4)
	Create("礼包领取员", 70217, 3006, 14, 13, 4)
	Create("礼包领取员", 70217, 4006, 11, 13, 4)
end
