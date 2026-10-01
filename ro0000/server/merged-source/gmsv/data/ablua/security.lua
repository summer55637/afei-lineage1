function FreeSecurity(charaindex,type,codetype,index,codedata)
	if char.check(charaindex) ~= 1 then
		return
	end
	token = "select `SafePasswd` from `CSAlogin` where `Name`='" .. char.getChar(charaindex,"账号") .. "'"
	ret = sasql.query(token)
	if ret ~= 1 then
		return
	end
	sasql.free_result()
	sasql.store_result()
	num = sasql.num_rows()
	if num < 1 then
		return
	end
	sasql.fetch_row()
	local safepasswd = sasql.data(1)
	if safepasswd == nil or safepasswd == "" then
		if type == 0 or type == 1 then
			type = 2
		end
	else
		if type == 2 then
			return
		end
	end
	if type == 2 then
		if codedata == "" then
			return
		end
		if string.len(codedata) ~= 6 then
			return
		end
		token = "update `CSAlogin` set `SafePasswd`='" .. codedata .. "' where `Name`='" .. char.getChar(charaindex,"账号") .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			char.newMessageToCli(charaindex, -1, "安全码设置成功", "白色")
			char.sendStatusString(charaindex,"P")
		else
			char.newMessageToCli(charaindex, -1, "安全码设置失败", "白色")
		end
		return
	elseif type == 0 then
		if codetype == 0 then
			if safepasswd ~= codedata then
				char.newMessageToCli(charaindex, -1, "安全码输入失败", "白色")
				return
			end
			if index < 0 or index > 23 then
				return
			end
			local itemindex = char.getItemIndex(charaindex,index)
			if item.check(itemindex) ~= 1 then
				return
			end
			item.setInt(itemindex,"安全锁",0)
			item.UpdataHaveItemOne(charaindex,index)
			char.newMessageToCli(charaindex, -1, "道具解锁成功", "白色")
		elseif codetype == 1 then
			if index < 0 or index > 23 then
				return
			end
			local itemindex = char.getItemIndex(charaindex,index)
			if item.check(itemindex) ~= 1 then
				return
			end
			item.setInt(itemindex,"安全锁",1)
			item.UpdataHaveItemOne(charaindex,index)
			char.newMessageToCli(charaindex, -1, "道具上锁成功", "白色")
		end
	elseif type == 1 then
		if codetype == 0 then
			if safepasswd ~= codedata then
				char.newMessageToCli(charaindex, -1, "安全码输入失败", "白色")
				return
			end
			if index < 0 or index > 4 then
				return
			end
			local petindex = char.getCharPet(charaindex,index)
			if char.check(petindex) ~= 1 then
				return
			end
			char.setInt(petindex,"安全锁",0)
			char.sendStatusString(charaindex,"K" .. index)
			char.newMessageToCli(charaindex, -1, "宠物解锁成功", "白色")
		elseif codetype == 1 then
			if index < 0 or index > 4 then
				return
			end
			local petindex = char.getCharPet(charaindex,index)
			if char.check(petindex) ~= 1 then
				return
			end
			char.setInt(petindex,"安全锁",1)
			char.sendStatusString(charaindex,"K" .. index)
			char.newMessageToCli(charaindex, -1, "宠物上锁成功", "白色")
		end
	end
end

function data()
	
end

function main()
	data()
end

