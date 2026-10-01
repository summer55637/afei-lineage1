function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function FreePlayerTrans(charaindex)
	if checkEmptItemNum(charaindex) == 0 then
		char.newMessageToCli(charaindex, -1, "您的道具栏已满", "白色")
		return 0
	end
	if npc.Free(-1,charaindex,"ENDEV=39&ENDEV=40&ENDEV=42&ENDEV=46") == 0 then
		char.newMessageToCli(charaindex, -1, "您四大洞窟任务没有完成", "白色")
		return 0
	end
	-- ret = sasql.query("select `QQ` from `CSAlogin` where `Name`='" .. char.getChar(charaindex,"账号") .. "'")
	-- if ret == 1 then
	-- 	sasql.free_result()
	-- 	sasql.store_result()
	-- 	if sasql.num_rows() > 0 then
	-- 		sasql.fetch_row()
	-- 		if sasql.data(1) == "10000" then
	-- 			other.CallFunction("ShowHuodong", "data/ablua/npc/huodong/huodong.lua", {charaindex,16})
	-- 			char.newMessageToCli(charaindex, -1, "请先补填账号信息", "白色")
	-- 			return 0
	-- 		end
	-- 	end
	-- end
	local fametype = 1
	local noevname = {}
	for i=1,#missionid do
		if npc.Free(-1,charaindex,"ENDEV=" .. missionid[i]) == 0 then
			fametype = 0
			noevname[#noevname + 1] = missionname[i]
		end
	end
	if fametype == 1 then
		if char.getInt(charaindex,"等级") == 140 then
			char.setInt(charaindex,"声望",char.getInt(charaindex,"声望") + 50000)
			char.TalkToCli(charaindex, -1, "恭喜您在[Lv" .. char.getInt(charaindex,"等级") .. "]完成转生，并且完成1.82全部任务，额外奖励声望500点。", "随机色")
		elseif char.getInt(charaindex,"等级") >= 135 then
			char.setInt(charaindex,"声望",char.getInt(charaindex,"声望") + 40000)
			char.TalkToCli(charaindex, -1, "恭喜您在[Lv" .. char.getInt(charaindex,"等级") .. "]完成转生，并且完成1.82全部任务，额外奖励声望400点。", "随机色")
		elseif char.getInt(charaindex,"等级") >= 130 then
			char.setInt(charaindex,"声望",char.getInt(charaindex,"声望") + 30000)
			char.TalkToCli(charaindex, -1, "恭喜您在[Lv" .. char.getInt(charaindex,"等级") .. "]完成转生，并且完成1.82全部任务，额外奖励声望300点。", "随机色")
		elseif char.getInt(charaindex,"等级") >= 120 then
			char.setInt(charaindex,"声望",char.getInt(charaindex,"声望") + 20000)
			char.TalkToCli(charaindex, -1, "恭喜您在[Lv" .. char.getInt(charaindex,"等级") .. "]完成转生，并且完成1.82全部任务，额外奖励声望200点。", "随机色")
		end
	else
		if char.getInt(charaindex,"等级") >= 120 then
			for i=1,#noevname do
				char.TalkToCli(charaindex, -1, "您没有完成" .. noevname[i] .. ",无法获得额外声望哦", "随机色")
			end
		end
	end
	if char.getInt(charaindex,"转数") == 4 then
		char.Additem(charaindex,22033)
		char.TalkToCli(charaindex, -1, "恭喜您圆满五转，特兹奖励一个机暴[帖拉所伊朵]玩偶。", "随机色")
	elseif char.getInt(charaindex,"转数") == 0 then
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,2})
		char.setInt(charaindex,"新玩家旗标",0)
	end
	
	if string.len(char.getChar(charaindex,"账号")) > 8 then
		sasql.query("insert into `transdata` values ('" .. char.getChar(charaindex,"账号") .. "'," .. char.getInt(charaindex,"转数") .. "," .. char.getInt(charaindex,"等级") .. ",NOW())")
	end
	return 1
end

function data()
	missionid = {1,2,4,5,8,12,13,16,17,19,22,27,31,34,35,38,45,47,54}
	missionname = {"解救老爷爷","送贝壳","成人仪式","亚姆的斧头","小猪的爱情故事","梦德洞窟","强盗洞窟","恐龙博士","龙洞任务","伐木任务","强恩一族","旷工的比赛","五兄弟之谜","梦幻洞窟","卡坦的任务","马祖任务","四宝玉之谜","猜谜三兄弟","黄金羚羊之谜"}
end



function main()
	data()
end
