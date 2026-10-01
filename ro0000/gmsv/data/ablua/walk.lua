function FreeWalk( talkerindex )
	if char.getWorkInt(talkerindex,"安全模式") == 1 then
		token = "SELECT `SafePasswd` FROM `CSAlogin` "
				.. " WHERE `Name` = '" .. char.getChar(talkerindex,"账号") .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			num = sasql.num_rows()
			if num > 0 then
				sasql.fetch_row(0)
				if sasql.data(1) == nil or sasql.data(1) == "" then
					token = "请输入您新的密码："
					lssproto.windows(talkerindex, "输入框", "确定", 2, char.getWorkInt(npcindex,"对象"), token)
					return
				end
			end
		end
		token = "由于您帐号存在被盗风险，请及时修改密码\n"
			 .. "请输入您的安全码："
		lssproto.windows(talkerindex, "输入框", "确定", 1, char.getWorkInt(npcindex,"对象"), token)
	end
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if char.getWorkInt(talkerindex,"安全模式") ~= 1 then
		return
	end
	if seqno == 1 then
		if data == "" then
			token = "由于您帐号存在被盗风险，请及时修改密码\n"
				.. "请输入您的安全码："
			lssproto.windows(talkerindex, "输入框", "确定", 1, char.getWorkInt(npcindex,"对象"), token)
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
		if feyfa == 1 then
			token = "由于您帐号存在被盗风险，请及时修改密码\n"
				.. "请输入您的安全码："
			lssproto.windows(talkerindex, "输入框", "确定", 1, char.getWorkInt(npcindex,"对象"), token)
			return
		end
		token = "SELECT `SafePasswd` FROM `CSAlogin` "
				.. " WHERE `Name` = '" .. char.getChar(talkerindex,"账号") .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			num = sasql.num_rows()
			if num > 0 then
				sasql.fetch_row(0)
				if sasql.data(1) == data then
					token = "请输入您新的密码(6-12位)："
					lssproto.windows(talkerindex, "输入框", "确定", 2, char.getWorkInt(npcindex,"对象"), token)
					return
				else
					token = "安全码输入错误，请重新输入您的安全码"
					lssproto.windows(talkerindex, "输入框", "确定", 1, char.getWorkInt(npcindex,"对象"), token)
					return
				end
			end
		end
	elseif seqno == 2 then
		if data == "" then
			token = "请输入您新的密码(6-12位)："
			lssproto.windows(talkerindex, "输入框", "确定", 2, char.getWorkInt(npcindex,"对象"), token)
			return
		end
		local lenInByte = #data
		local feifa = 0
		if string.len(data) < 6 or string.len(data) > 12 then
			token = "请输入您新的密码(6-12位)："
			lssproto.windows(talkerindex, "输入框", "确定", 2, char.getWorkInt(npcindex,"对象"), token)
			return
		end
		for i=1,lenInByte do
			local curByte = string.byte(data, i)
			if (curByte < 48 or curByte > 57) and (curByte < 65 or curByte > 90) and (curByte < 97 or curByte > 122) then
				feifa = 1
				break
			end
		end
		if feyfa == 1 then
			token = "请输入您新的密码(6-12位)："
			lssproto.windows(talkerindex, "输入框", "确定", 2, char.getWorkInt(npcindex,"对象"), token)
			return
		end
		local oldpass = ""
		local oldsafepass = ""
		token = "SELECT `PassWord`,`SafePasswd` FROM `CSAlogin` "
				.. " WHERE `Name` = '" .. char.getChar(talkerindex,"账号") .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			num = sasql.num_rows()
			if num > 0 then
				sasql.fetch_row(0)
				oldpass = sasql.data(1)
				if sasql.data(2) ~= nil and sasql.data(2) ~= "" then
					oldsafepass = sasql.data(2)
				end
			end
		end
		if oldpass == data then
			token = "您输入的新密码不能和旧密码相同\n"
				 .. "请输入您新的密码(6-12位)："
			lssproto.windows(talkerindex, "输入框", "确定", 2, char.getWorkInt(npcindex,"对象"), token)
			return
		end
		if oldsafepass == data then
			token = "您输入的新密码不能和安全码相同\n"
				 .. "请输入您新的密码(6-12位)："
			lssproto.windows(talkerindex, "输入框", "确定", 2, char.getWorkInt(npcindex,"对象"), token)
			return
		end
		token = "update `CSAlogin` set `PassWord` = '" .. data .. "',`Lock`='0' where `Name`='" .. char.getChar(talkerindex,"账号") .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			char.TalkToCli(talkerindex, -1, "您的密码已修改为：" .. data .. "，请牢记您的新密码。", "黄色")
			char.setWorkInt(talkerindex,"安全模式",0)
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	
end

function main()
	data()
	Create("安全模式", 44908, 777, 37, 40, 6)
end
