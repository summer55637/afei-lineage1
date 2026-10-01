function weixin(charaindex,wintype,token)
	sqltoken = "insert into `weixin` values ('" .. char.getChar(charaindex,"账号") .. "'," .. wintype .. "," .. other.time() .. ",0)"
	sasql.query(sqltoken)
	lssproto.windows(charaindex, 1017, "取消", 0, char.getWorkInt( npcindex, "对象"), wintype .. "|" .. token)
	return 0
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 0 then
		if data == "" then
			return
		end
		local type = other.getString(data, "|", 1)
		if type == "G" then
			local wintypebuff = other.getString(data, "|", 2)
			if wintypebuff == "" then
				return
			end
			sqltoken = "select * from `weixin` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `type`=" .. wintypebuff .. " order by `time` desc"
			ret = sasql.query(sqltoken)
			if ret == 1 then
				sasql.free_result()--释放内存
				sasql.store_result()--释放query内存
				sqlnum = sasql.num_rows()--返回结果集中行的数目
				if sqlnum > 0 then
					sasql.fetch_row()
					if other.time() <= other.atoi(sasql.data(3)) + 600 then
						sqltoken = "update `weixin` set `check`=1 where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `check`=0 and `time`=" .. other.atoi(sasql.data(3)) .. " and `type`=" .. wintypebuff
						ret = sasql.query(sqltoken)
						if ret == 1 then
							--[[if char.getInt(talkerindex,"活力") <= 140 then
								char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") + 10)
								char.newMessageToCli(talkerindex, -1, "获得10活力", "白色")
							end]]
							other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,8,1})
						end
					end
				end
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end 

function data()
	
end

function main()
	data()
	Create("微信分享", 100000, 777, 5, 5, 6)
end
