function ITEM_SafePassword(itemindex, charaindex, toindex, haveitemindex)
	local token = "\n\n"
	.. "           [style c=5]请输入您的二级安全码[/style]\n\n\n\n"
	.. " [style c=4]请输入6位数整数[/style]"
	lssproto.windows(charaindex, 1, 12, 0, char.getWorkInt(npcindex, "对象"), token);
end

function WindowTalked (meindex, talkerindex, seqno, select, data)
	if select ~= 8 then
		if seqno == 0 then
			sasql.query("select SafePasswd from CSAlogin where Name = '"..char.getChar(talkerindex,"账号").."'")
			sasql.free_result();
			sasql.store_result();
			sasql.fetch_row();
			if other.atoi(sasql.data(1)) == other.atoi(data) then
				local token = "\n           [style c=10]请输入新的二级安全码[/style]\n"
				.. "           [style c=6]请务必记住新的二级安全码[/style]\n\n\n\n"
				.. " [style c=4]请输入6位数整数[/style]"
				lssproto.windows(talkerindex, 1, 12, 1, char.getWorkInt(meindex, "对象"), token);
			else
				char.newMessageToCli(talkerindex,-1,"您输入的二级安全码有误",4)
			end
		elseif seqno == 1 then
			local token = "\n           [style c=5]请再次输入新的二级安全码[/style]\n"
			.. "           [style c=6]请务必记住新的二级安全码[/style]\n\n\n\n"
			.. " [style c=4]请输入6位数整数[/style]"
			lssproto.windows(talkerindex, 1, 12, 2, char.getWorkInt(meindex, "对象"), token);
			char.setWorkInt(talkerindex, "NPC临时1", data)
		elseif seqno == 2 then
			if char.getWorkInt(talkerindex, "NPC临时1") ~= other.atoi(data) then
				char.newMessageToCli(talkerindex,-1,"您输入了两次不同密码",4)
				local token = "\n           [style c=10]请输入新的二级安全码[/style]\n"
				.. "           [style c=6]请务必记住新的二级安全码[/style]\n\n\n\n"
				.. " [style c=4]请输入6位数整数[/style]"
				lssproto.windows(talkerindex, 1, 12, 1, char.getWorkInt(meindex, "对象"), token);
			elseif other.atoi(data) > 99999 and other.atoi(data) < 1000000 then
				char.newMessageToCli(talkerindex,-1,"二级安全码已更新",4)
				npc.DelItem(talkerindex, 30505)
				sasql.query("update CSAlogin set SafePasswd =" .. other.atoi(data) .. " where Name ='" .. char.getChar(talkerindex,"账号") .. "'")
			else
				char.newMessageToCli(talkerindex,-1,"请输入6位数整数",4)
			end
		end
	end
end

function main()
	npcindex = npc.CreateNpc("二级密码", 100000, 777, 44, 36, 6);
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "");
	item.addLUAListFunction( "ITEM_SafePassword", "ITEM_SafePassword", "")
end