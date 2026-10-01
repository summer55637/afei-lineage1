function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then
		if select == 1 then
			lssproto.windows(talkerindex, "宠物框", "取消", 1, char.getWorkInt( meindex, "对象"), "")
		end
	elseif seqno == 1 then
		if data == "" then
			return
		end
		local petno = other.atoi(data)
		if petno < 1 or petno > 5 then
			return
		end
		local petindex = char.getCharPet(talkerindex, petno - 1)
		if char.check(petindex) ~= 1 then
			return
		end
		local petname = char.getChar(petindex,"名字")
		if string.sub(petname,1,1) == "*" or char.getInt(petindex,"安全锁") == 1 then
			char.TalkToCli(talkerindex, -1, "[错误提示]您的宠物已经绑定了，无需再找我绑定哦。", "随机色")
			return
		end
		token = "　\n　√ 请输入您的手机号码进行绑定\n\n解绑需要客服人工审核 必须填写真实手机"
		lssproto.windows(talkerindex, "输入框", "确定|取消", petno + 1, char.getWorkInt( meindex, "对象"), token)
	elseif seqno >= 2 and seqno <= 6 then
		if select == 1 then
			if data == "" then
				return
			end
			if string.len(data) ~= 11 then
				char.TalkToCli(talkerindex, -1, "[错误提示]请输入正确的11位手机号码，请务必真实填写，无法修改，造成的一切后果自行承担。", "随机色")
				return
			end
			local phonenum = tonumber(data)
			if phonenum == nil then
				char.TalkToCli(talkerindex, -1, "[错误提示]请输入正确的11位手机号码，请务必真实填写，无法修改，造成的一切后果自行承担。", "随机色")
				return
			end
			local havepetid = seqno - 2
			if havepetid < 0 or havepetid > 4 then
				return
			end
			local petindex = char.getCharPet(talkerindex, havepetid)
			if char.check(petindex) ~= 1 then
				return
			end
			local petname = char.getChar(petindex,"名字")
			if string.sub(petname,1,1) == "*" or char.getInt(petindex,"安全锁") == 1 then
				char.TalkToCli(talkerindex, -1, "[错误提示]您的宠物已经绑定了，无需再找我绑定哦。", "随机色")
				return
			end
			local myphone = ""
			token = "select `phone` from `petlockdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				locknum = sasql.num_rows()
				if locknum > 0 then
					sasql.fetch_row(0)
					myphone = sasql.data(1)
				end
			end
			if myphone ~= "" then
				if myphone ~= data then
					char.TalkToCli(talkerindex, -1, "[错误提示]您输入的手机号码与之前输入的不符，绑定失败。", "随机色")
					return
				end
			else
				token = "  \n请确认您的手机号码 (确认后无法修改)\n"
					 .. "\n    手机号码：" .. data .."\n\n★ 请务必真实的填写手机号码 ★\n★ 否则造成无法解绑自行负责 ★ "
				char.setWorkChar(talkerindex,"NPC临时1",data)
				lssproto.windows(talkerindex, "对话框", "确定|取消", seqno + 5, char.getWorkInt( meindex, "对象"), token)
				return
			end
			if ret == 1 then
				char.setInt(petindex,"安全锁",1)
				char.TalkToCli(talkerindex, -1, "[温馨提示]您的宠物[" .. petname .. "][" .. math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷")) .. "]已成功绑定。", "随机色")
			end
		end
	elseif seqno >= 7 and seqno <= 11 then
		if select == 1 then
			local mydata = char.getWorkChar(talkerindex,"NPC临时1")
			if mydata == "" then
				return
			end
			if string.len(mydata) ~= 11 then
				char.TalkToCli(talkerindex, -1, "[错误提示]请输入正确的11位手机号码，请务必真实填写，无法修改，造成的一切后果自行承担。", "随机色")
				return
			end
			local phonenum = tonumber(mydata)
			if phonenum == nil then
				char.TalkToCli(talkerindex, -1, "[错误提示]请输入正确的11位手机号码，请务必真实填写，无法修改，造成的一切后果自行承担。", "随机色")
				return
			end
			local havepetid = seqno - 7
			if havepetid < 0 or havepetid > 4 then
				return
			end
			local petindex = char.getCharPet(talkerindex, havepetid)
			if char.check(petindex) ~= 1 then
				return
			end
			local petname = char.getChar(petindex,"名字")
			if string.sub(petname,1,1) == "*" or char.getInt(petindex,"安全锁") == 1 then
				char.TalkToCli(talkerindex, -1, "[错误提示]您的宠物已经绑定了，无需再找我绑定哦。", "随机色")
				return
			end
			local myphone = ""
			token = "select `phone` from `petlockdata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'"
			ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				locknum = sasql.num_rows()
				if locknum > 0 then
					sasql.fetch_row(0)
					myphone = sasql.data(1)
				end
			end
			if myphone ~= "" then
				if myphone ~= mydata then
					char.TalkToCli(talkerindex, -1, "[错误提示]您输入的手机号码与之前输入的不符，绑定失败。", "随机色")
					return
				end
			else
				token = "insert into `petlockdata` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. mydata .. "')"
				ret = sasql.query(token)
			end
			if ret == 1 then
				char.setInt(petindex,"安全锁",1)
				char.TalkToCli(talkerindex, -1, "[温馨提示]您的宠物[" .. petname .. "][" .. math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷")) .. "]已成功绑定。", "随机色")
			end
		end
	end
end

function ITEM_PETLOCK(itemindex, charaindex, toindex, haveitemindex)
	if char.getInt(charaindex,"安全锁") > 0 then
		if char.getInt(charaindex,"安全锁") == 1 then
			token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
		elseif char.getInt(charaindex,"安全锁") == 2 then
			token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		else
			token = "由于您的密码过于简单，并且异地登录。\n例如：密码非常简单或者全包含于账号。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
		end
		lssproto.windows(charaindex, "输入框", "确定|取消", "安全锁", -1, token)
		return
	end
	token = "　　　　　　　 「 绑定宠物须知 」\n\n"
		 .. "　　 喝下药水后宠物绑定不可交易摆摊贩卖\n"
		 .. "　　 第一次使用需要登记持有人的手机号码\n"
		 .. "　　 第二次使用仅需校验持有人的手机号码\n"
		 .. "　  · 解绑需联系客服人工受理验证手机 ·\n"
		 .. "　  · 解绑无法解绑究极祝福造成的绑定 ·\n"
		 .. "　  · 解绑为增值服务 √ 资费 50元/只 ·\n"
	lssproto.windows(charaindex, "对话框", "确定|取消", 0, char.getWorkInt( npcindex, "对象"), token)
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function main()
	Create("宠物绑定", 101156, 777, 25, 21, 4)
	item.addLUAListFunction( "ITEM_PETLOCK", "ITEM_PETLOCK", "")
end
