function Loop(meindex)
	local nowday = other.atoi(os.date("%w",os.time()))
	local nowhour = other.atoi(os.date("%H",os.time()))
	local nowmin = other.atoi(os.date("%M",os.time()))
	if nowday == pkstartday and nowhour == pkstarthour and nowmin >= pkstartmin and nowmin <= pkstartmin2 then
		pkstart = 0
		char.talkToAllServer("[混乱之庄]混乱之庄的争夺将在" .. pkstartmin2 - nowmin + 1 .. "分钟后开始，请大家迅速入场[入口][玛丽娜斯渔村医院][23.8]","")
		char.talkToAllServer("[混乱之庄]混乱之庄的争夺将在" .. pkstartmin2 - nowmin + 1 .. "分钟后开始，请大家迅速入场[入口][玛丽娜斯渔村医院][23.8]","")
		char.talkToAllServer("[混乱之庄]混乱之庄的争夺将在" .. pkstartmin2 - nowmin + 1 .. "分钟后开始，请大家迅速入场[入口][玛丽娜斯渔村医院][23.8]","")
	elseif nowday == pkstartday and nowhour == pkstarthour and nowmin == pkstartmin2 + 1 then
		if pkstart == 0 then
			char.talkToAllServer("[混乱之庄]混乱之庄的争夺战已经开始，停止入场。","")
			pkstart = 1
			char.setInt(meindex, "循环事件时间", 1000)
			for i=0,char.getPlayerMaxNum() - 1 do
				if char.check(i) == 1 then
					if char.getInt(i,"地图号") == 5032 then
						char.setWorkInt(i,"战斗模式",1);
						char.setFlg(i,"决斗",1)
					end
				end
			end
		end
		if pkstart == 1 then
			fmindex = -1
			fmname = ""
			pktype = 0
			for i = 0, char.getPlayerMaxNum()-1 do
				if char.check(i) == 1 then
					if char.getInt(i, "地图号") == 5032 then
						if fmindex == -1 then
							fmindex = char.getInt(i,"家族索引")
							fmname = char.getChar(i,"家族")
						else
							if char.getInt(i,"家族索引") ~= fmindex then
								pktype = 1
							end
						end
						if char.getWorkInt(i,"族战标识") < 0 and char.getChar(i,"账号") ~= "yiqishiqik" then
							char.TalkToCli(i, -1, "战败离场。", "随机色")
							if char.getWorkInt(i,"组队") ~= 0 then
								char.DischargeParty(i,0)
							end
							char.setWorkInt(i,"战斗模式",0)
							char.WarpToSpecificPoint(i,char.getInt(meindex,"地图号"),char.getInt(meindex,"坐标X"),char.getInt(meindex,"坐标Y"))
						end
					end
				end
			end
			if pktype == 0 then
				if fmindex == -1 then
					pkstart = 2
					--char.talkToAllServer("[混乱之庄]因无人参战，争夺战取消。")
					char.setInt(meindex, "循环事件时间", 60000)
					return
				else
					pkstart = 2
					saacproto.ACFixFMPoint(fmname,fmindex,fmindex-1,fmname,fmindex,fmindex-1,5)
					char.talkToAllServer("[混乱之庄] 王者诞生〈" .. fmname .. "〉拿下混乱之庄，家族成员可以骑乘卡卡金宝哦，恭喜他们。","")
					if fmname == zyfmname then
						fmnum = sasql.queryFmPointData(5,1)
						sasql.updateFmPointData(5,0,fmnum + 1,1)
					else
						sasql.updateFmPointData(5,other.time(),0,0)
						zyfmname = fmname
					end
					for i = 0, char.getPlayerMaxNum()-1 do
						if char.check(i) == 1 then
							if char.getInt(i, "地图号") == 5032 then
								if char.getWorkInt(i,"组队") ~= 0 then
									char.DischargeParty(i,0)
								end
								char.setWorkInt(i,"族战标识",-1)
								char.setWorkInt(i,"战斗模式",0)
								char.WarpToSpecificPoint(i,char.getInt(meindex,"地图号"),char.getInt(meindex,"坐标X"),char.getInt(meindex,"坐标Y"))
							end
						end
					end
					char.setInt(meindex, "循环事件时间", 60000)
					return
				end
			end
		end
	else
		if pkstart == 1 then
			fmindex = -1
			fmname = ""
			pktype = 0
			for i = 0, char.getPlayerMaxNum()-1 do
				if char.check(i) == 1 then
					if char.getInt(i, "地图号") == 5032 then
						if fmindex == -1 then
							fmindex = char.getInt(i,"家族索引")
							fmname = char.getChar(i,"家族")
						else
							if char.getInt(i,"家族索引") ~= fmindex then
								pktype = 1
							end
						end
						if char.getWorkInt(i,"族战标识") < 0 and char.getChar(i,"账号") ~= "yiqishiqik" then
							char.TalkToCli(i, -1, "战败离场。", "随机色")
							if char.getWorkInt(i,"组队") ~= 0 then
								char.DischargeParty(i,0)
							end
							char.setWorkInt(i,"战斗模式",0)
							char.WarpToSpecificPoint(i,char.getInt(meindex,"地图号"),char.getInt(meindex,"坐标X"),char.getInt(meindex,"坐标Y"))
						end
					end
				end
			end
			if pktype == 0 then
				if fmindex == -1 then
					pkstart = 2
					--char.talkToAllServer("[混乱之庄]因无人参战，争夺战取消。")
					char.setInt(meindex, "循环事件时间", 60000)
					return
				else
					pkstart = 2
					saacproto.ACFixFMPoint(fmname,fmindex,fmindex-1,fmname,fmindex,fmindex-1,5)
					char.talkToAllServer("[混乱之庄] 王者诞生 【" .. fmname .. "】拿下混乱之庄，恭喜他们。","")
					if fmname == zyfmname then
						fmnum = sasql.queryFmPointData(5,1)
						sasql.updateFmPointData(5,0,fmnum + 1,1)
					else
						sasql.updateFmPointData(5,other.time(),0,0)
						zyfmname = fmname
					end
					for i = 0, char.getPlayerMaxNum()-1 do
						if char.check(i) == 1 then
							if char.getInt(i, "地图号") == 5032 then
								if char.getWorkInt(i,"组队") ~= 0 then
									char.DischargeParty(i,0)
								end
								char.setWorkInt(i,"族战标识",-1)
								char.setWorkInt(i,"战斗模式",0)
								char.WarpToSpecificPoint(i,char.getInt(meindex,"地图号"),char.getInt(meindex,"坐标X"),char.getInt(meindex,"坐标Y"))
							end
						end
					end
					char.setInt(meindex, "循环事件时间", 60000)
					return
				end
			end
		end
	end
end

function FreePartyJoin( meindex, toindex )
	if char.getInt(meindex, "地图号") == 5032 then
		--if char.getInt(meindex,"家族索引") ~= char.getInt(toindex,"家族索引") then
		--	char.TalkToCli(meindex, -1, "双方所在家族不同，不能组队。", "随机色")
		--	return 0
		--end
		return 0
	end
	return 1
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		local nowday = other.atoi(os.date("%w",os.time()))
		local nowhour = other.atoi(os.date("%H",os.time()))
		local nowmin = other.atoi(os.date("%M",os.time()))
		--print("\nnowday=" .. nowday .. ",nowhour=" .. nowhour .. ",nowmin=" .. nowmin)
		--print("\npkstartday=" .. pkstartday .. ",pkstarthour=" .. pkstarthour .. ",pkstartmin=" .. pkstartmin .. ",pkstartmin2=" .. pkstartmin2)
		if nowday == pkstartday and nowhour == pkstarthour and nowmin >= pkstartmin and nowmin <= pkstartmin2 then
			token = "               『混乱之庄的门卫』\n"
				  .."\n\n现在是入场时间，快进去吧。\n\n喊上小伙伴一起杀进去吧！"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
		else
			token = "               『混乱之庄的门卫』\n"
				  .."\n混乱之庄的争夺为每周一次\n"
				  .."每周六的20:00-20:20可以入场\n取得胜利的家族可持有本庄一周。\n现在还不是入场时间。\n周六晚上激情千万不要错过！"
			if pkstart == 1 then
				local playernum= 0
				for i = 0, char.getPlayerMaxNum()-1 do
					if char.check(i) == 1 then
						if char.getInt(i, "地图号") == 5032 then
							playernum = playernum + 1
						end
					end
				end
				token = token .. "\n目前场内人数：" .. playernum
			end
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		end
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 1 then
		if select == 1 then
			if char.getWorkInt(talkerindex,"组队") ~= 0 then
				char.TalkToCli(talkerindex, -1, "很抱歉，不支持组队传送，请解散团队后进入！", "随机色")
				return
			end
			if char.getInt(talkerindex,"家族索引") < 1 or char.getInt(talkerindex,"家族地位") == -1 or char.getInt(talkerindex,"家族地位") == 2 then
				char.TalkToCli(talkerindex, -1, "很遗憾，您还没有加入家族，不能进入！", "随机色")
				return
			end
			if char.getWorkInt(talkerindex,"家族地图") == 1041 or char.getWorkInt(talkerindex,"家族地图") == 2031 or char.getWorkInt(talkerindex,"家族地图") == 3031 or char.getWorkInt(talkerindex,"家族地图") == 4031 then
				char.TalkToCli(talkerindex, -1, "很遗憾，您所在的家族已经是四大庄园了，不能争夺此庄园！", "随机色")
				return
			end
			if char.getWorkInt(talkerindex,"家族地图") == 5031 then
				zyfmname = char.getChar(talkerindex,"家族")
			end
			char.WarpToSpecificPoint(talkerindex, 5032, 3, 19)
			char.setWorkInt(talkerindex,"战斗模式",0);
			char.setWorkInt(talkerindex,"族战标识",1);
		end
	end
end

function Talked2(meindex, talkerindex , szMes, color )
	if char.getWorkInt(talkerindex,"组队") > 1 then
		return
	end
	if pkstart == 1 then
		token = "请输入您要PK的队伍的编号：\n"
		local ii = 0
		for i = 0, char.getPlayerMaxNum()-1 do
			if ii >= 15 then
				break
			end
			if char.check(i) == 1 then
				if char.getInt(i, "地图号") == 5032 and char.getWorkInt(i,"组队") <= 1 and char.getWorkInt(i,"战斗索引") < 0 then
					token = token .. "编号:" .. i .. " 名字：" .. char.getChar(i, "名字") .. "\n"
					ii = ii + 1
				end
			end
		end
		if ii > 0 then
			lssproto.windows(talkerindex, "宽输入框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
		else
			token = "目前无人可以战斗。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		end
	else
		token = "族战还没开始。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	end
end

function WindowTalked2 ( meindex, talkerindex, seqno, select, data)
	if char.getWorkInt(talkerindex,"组队") > 1 then
		return
	end
	if pkstart == 1 then
		if seqno == 1 then
			if select == 1 then
				if data == "" then
					return
				end
				local playerindex = -1
				playerindex = other.atoi(data)
				if char.check(playerindex) == 1 then
					if char.getInt(playerindex, "地图号") == 5032 and char.getWorkInt(playerindex,"组队") <= 1 and char.getWorkInt(playerindex,"战斗索引") < 0 and playerindex ~= talkerindex then
						if char.getInt(talkerindex,"家族索引") ~= char.getInt(playerindex,"家族索引") then
							if char.getWorkInt(playerindex,"PK时间") + 120 > other.time() then
								char.TalkToCli(talkerindex, -1, "对方正在连点保护中，剩余时间：" .. char.getWorkInt(playerindex,"PK时间") + 120 - other.time() .. "秒，对方如果移动或转向保护结束。", "随机色")
								return
							end
							battle.CreateVsPlayer(talkerindex, playerindex)
						else
							token = "同家族无法开始战斗。"
							lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
						end
					end
				end
			end
		end
	else
		token = "族战还没开始。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	end
end


function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
	char.setInt(npcindex, "循环事件时间", 60000)
end

function Create2(name, metamo, floor, x, y, dir)
	npcindex2 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex2, "对话事件", "Talked2", "")
	char.setFunctionPointer(npcindex2, "窗口事件", "WindowTalked2", "")
end

function data()
	pkstartday = 6
	pkstarthour = 20
	pkstartmin = 0
	pkstartmin2 = 20
end

function main()
	data()
	pkstart = 0
	zyfmname = ""
	if config.getGameservername() == "娱乐互动线" then
		Create("混乱之庄门卫", 26732, 2005, 23, 5, 6)
		Create2("混乱之庄战斗员", 108297, 5032, 19, 19, 6)
	end
end

