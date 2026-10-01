--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = char.getChar(meindex, "名字") .. "|请选择随机匹配模式|3|进行1V1匹配|进行2V2匹配|进行5V5匹配"
		lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			local num = other.atoi(data)
			if num < 1 or num > 4 then
				return
			end
			if char.getInt(talkerindex,"转数") < 5 or char.getInt(talkerindex,"等级") < 140 then
				char.TalkToCli(talkerindex, -1, "温馨提示：您还没有达到5转140，无法使用此功能。", "红色")
				return
			end
			if num == 1 then
				if char.getWorkInt(talkerindex,"组队") ~= 0 then
					char.newMessageToCli(talkerindex, -1, "您已经组队了", "白色")
					return
				end
				if char.check(pkindex) ~= 1 then
					pkindex = talkerindex
					pkcharname = char.getChar(talkerindex,"名字")
					char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[1v1]挑战排程，请耐心等待别人的挑战。", "随机色")
					return
				else
					if char.getChar(pkindex,"名字") ~= pkcharname or char.getInt(pkindex,"地图号") ~= 2005 then
						pkindex = talkerindex
						pkcharname = char.getChar(talkerindex,"名字")
						char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[1v1]挑战排程，请耐心等待别人的挑战。", "随机色")
						return
					else
						if pkindex == talkerindex then
							char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[1v1]挑战排程，请耐心等待别人的挑战。", "随机色")
							return
						else
							if char.getWorkInt(pkindex,"组队") ~= 0 then
								pkindex = talkerindex
								pkcharname = char.getChar(talkerindex,"名字")
								char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[1v1]挑战排程，请耐心等待别人的挑战。", "随机色")
								return
							else
								battleindex = battle.CreateVsPlayer(talkerindex, pkindex)
								if battleindex > -1 then
									char.talkToServer(-1, "[1v1模式匹配赛][ " .. char.getChar(talkerindex,"名字") .. " vs " .. pkcharname .. " ] 正在医院进行中，快来围观吧。", "粉色")
								end
								pkindex = -1
								pkcharname = ""
								return
							end
						end
					end
				end
			elseif num == 2 then
				if char.getWorkInt(talkerindex,"组队") ~= 1 then
					char.newMessageToCli(talkerindex, -1, "只有队长才能匹配哦", "白色")
					return
				end
				local partynum = 0
				for i=1,5 do
					local partyindex = char.getWorkInt(talkerindex,"队员" .. i)
					if char.check(partyindex) == 1 then
						partynum = partynum + 1
					end
				end
				if partynum > 2 then
					char.newMessageToCli(talkerindex, -1, "您的组队人数过多", "白色")
					return
				end
				if char.check(pkindex3) ~= 1 then
					pkindex3 = talkerindex
					pkcharname3 = char.getChar(talkerindex,"名字")
					char.TalkToCli(talkerindex, -1, "友情提示：您已经加入了[2v2]随机匹配挑战排程，请耐心等待别人的加入。", "白色")
				else
					if char.getChar(pkindex3,"名字") ~= pkcharname3 or char.getInt(pkindex3,"地图号") ~= 2005 then
						pkindex3 = talkerindex
						pkcharname3 = char.getChar(talkerindex,"名字")
						char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[2v2]挑战排程，请耐心等待别人的挑战。", "随机色")
						return
					else
						if pkindex3 == talkerindex then
							char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[2v2]挑战排程，请耐心等待别人的挑战。", "随机色")
							return
						else
							if char.getWorkInt(pkindex3,"组队") ~= 1 then
								pkindex3 = talkerindex
								pkcharname3 = char.getChar(talkerindex,"名字")
								char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[2v2]挑战排程，请耐心等待别人的挑战。", "随机色")
								return
							else
								partynum = 0
								for i=1,5 do
									local partyindex = char.getWorkInt(talkerindex,"队员" .. i)
									if char.check(partyindex) == 1 then
										partynum = partynum + 1
									end
								end
								if partynum > 2 then
									pkindex3 = talkerindex
									pkcharname3 = char.getChar(talkerindex,"名字")
									char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[2v2]挑战排程，请耐心等待别人的挑战。", "随机色")
									return
								end
								battleindex = battle.CreateVsPlayer(talkerindex, pkindex3)
								if battleindex > -1 then
									char.talkToServer(-1, "[2v2模式匹配赛][ " .. char.getChar(talkerindex,"名字") .. " vs " .. pkcharname3 .. " ] 正在医院进行中，快来围观吧。", "粉色")
									pkindex3 = -1
									pkcharname3 = ""
								end
								return
							end
						end
					end
				end
			elseif num == 3 then
				if char.getWorkInt(talkerindex,"组队") ~= 1 then
					char.newMessageToCli(talkerindex, -1, "只有队长才能匹配哦", "白色")
					return
				end
				local partynum = 0
				for i=1,5 do
					local partyindex = char.getWorkInt(talkerindex,"队员" .. i)
					if char.check(partyindex) == 1 then
						partynum = partynum + 1
					end
				end
				if partynum < 5 then
					char.newMessageToCli(talkerindex, -1, "您的组队人数不足5人", "白色")
					return
				end
				if char.check(pkindex5) ~= 1 then
					pkindex5 = talkerindex
					pkcharname5 = char.getChar(talkerindex,"名字")
					char.TalkToCli(talkerindex, -1, "友情提示：您已经加入了[5v5]随机匹配挑战排程，请耐心等待别人的加入。", "白色")
				else
					if char.getChar(pkindex5,"名字") ~= pkcharname5 or char.getInt(pkindex5,"地图号") ~= 2005 then
						pkindex5 = talkerindex
						pkcharname5 = char.getChar(talkerindex,"名字")
						char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[5v5]挑战排程，请耐心等待别人的挑战。", "随机色")
						return
					else
						if pkindex5 == talkerindex then
							char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[5v5]挑战排程，请耐心等待别人的挑战。", "随机色")
							return
						else
							if char.getWorkInt(pkindex5,"组队") ~= 1 then
								pkindex5 = talkerindex
								pkcharname5 = char.getChar(talkerindex,"名字")
								char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[5v5]挑战排程，请耐心等待别人的挑战。", "随机色")
								return
							else
								partynum = 0
								for i=1,5 do
									local partyindex = char.getWorkInt(talkerindex,"队员" .. i)
									if char.check(partyindex) == 1 then
										partynum = partynum + 1
									end
								end
								if partynum < 5 then
									pkindex5 = talkerindex
									pkcharname5 = char.getChar(talkerindex,"名字")
									char.TalkToCli(talkerindex, -1, "友情提示：您目前已经加入了[5v5]挑战排程，请耐心等待别人的挑战。", "随机色")
									return
								end
								battleindex = battle.CreateVsPlayer(talkerindex, pkindex5)
								if battleindex > -1 then
									char.talkToServer(-1, "[5v5模式匹配赛][ " .. char.getChar(talkerindex,"名字") .. " vs " .. pkcharname5 .. " ] 正在医院进行中，快来围观吧。", "粉色")
									pkindex5 = -1
									pkcharname5 = ""
								end
								return
							end
						end
					end
				end
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	pkfloorid = 2005
end

function main()
	data()
	pkindex = -1
	pkcharname = ""
	pkindex3 = -1
	pkcharname3 = ""
	pkindex5 = -1
	pkcharname5 = ""
	if config.getGameservername() == "娱乐互动线" then
		Create("医院PK管理员", 26948, 2005, 9, 18, 6)
	end
end

