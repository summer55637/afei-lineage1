function fmlist(charaindex, data)
	if data == nil then
		char.TalkToCli(charaindex, -1, "请输入家族索引", "随机色")
		return
	end
	local ShowFamilyList = family.ShowFamilyList(other.atoi(data))
	char.TalkToCli(charaindex, -1, ShowFamilyList, "黄色")
end

function fmdel(charaindex, data)
	if data == nil then
		char.TalkToCli(charaindex, -1, "请输入家族索引", "随机色")
		return
	end
	local ShowFamilyList = family.ShowFamilyList(other.atoi(data))
	if ShowFamilyList ~= "" then
		token = "您确定下删除下列家族吗："
		      .."\n家族索引：" .. other.getString(ShowFamilyList," ",1)
			  .."\n家族名称：" .. other.getString(ShowFamilyList," ",2)
			  .."\n家族声望：" .. other.atoi(other.getString(ShowFamilyList," ",4)) / 100
			  .."\n家族人数：" .. other.getString(ShowFamilyList," ",5)
		leaderid = other.getString(ShowFamilyList," ",9)
		logintime = ""
		sqlstr = "select `LoginTime` from `CSAlogin` where `Name`='" .. leaderid .. "'"
		ret = sasql.query(sqlstr)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			num = sasql.num_rows()
			if num > 0 then
				sasql.fetch_row(0)
				logintime = sasql.data(1)
			end
		end
		token = token .. "\n族长登录时间：" .. logintime
		lssproto.windows(charaindex, "对话框", 12, other.atoi(other.getString(ShowFamilyList," ",1)), char.getWorkInt( npcindex, "对象"), token)
	end
	--char.TalkToCli(charaindex, -1, ShowFamilyList, "黄色")
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 4 then
		if seqno >= 1 and seqno <= 1000 then
			family.DelFamily(seqno,talkerindex)
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function main()
	Create("删除家族", 101156, 777, 15, 21, 4)
	magic.addLUAListFunction("fmlist", "fmlist", "", 1, "测试专用命令")
	magic.addLUAListFunction("fmdel", "fmdel", "", 1, "测试专用命令")
end

