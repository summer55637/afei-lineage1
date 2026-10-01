function Talked(meindex, talkerindex , szMes, color )
	if char.getWorkInt(talkerindex,"战斗模式") ~= 1 then
		token = "　　　　《目前族战还未开始》\n\n族战开始后可以使用我追击逃跑的选手。\n每次战斗结束会有120秒的原地保护时间。\n在这120秒内可以原地买药或者邮寄。\n切记！走动或转向都将结束保护时间。\n族战地图内打开[SHOP]按钮自动切药店。\n族战地图内打开[SHOP]按钮自动切药店。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		return
	end
	for i = 0, char.getPlayerMaxNum()-1 do
		if char.check(i) == 1 then
			if char.getInt(i, "地图号") == char.getInt(meindex,"地图号") then
				char.setWorkInt(i,"战斗模式",1)
			end
		end
	end
	if char.getWorkInt(talkerindex,"组队") > 1 then
		token = "此功能只能单人或者队长使用。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		return
	end
		token = "请输入您要PK的队伍的编号：\n"
		local ii = 0
		for i = 0, char.getPlayerMaxNum()-1 do
			if ii >= 15 then
				break
			end
			if char.check(i) == 1 then
				if char.getInt(i, "地图号") == char.getInt(meindex, "地图号") and char.getWorkInt(i,"组队") <= 1 and char.getWorkInt(i,"战斗索引") < 0 and char.getInt(talkerindex,"家族索引") ~= char.getInt(i,"家族索引") then
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
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if char.getWorkInt(talkerindex,"战斗模式") ~= 1 then
		token = "　　　　《目前族战还未开始》\n\n族战开始后可以使用我追击逃跑的选手。\n每次战斗结束会有120秒的原地保护时间。\n在这120秒内可以原地买药或者邮寄。\n切记！走动或转向都将结束保护时间。\n族战地图内打开[SHOP]按钮自动切药店。\n族战地图内打开[SHOP]按钮自动切药店。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		return
	end
	if char.getWorkInt(talkerindex,"组队") > 1 then
		token = "此功能只能单人或者队长使用。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		return
	end
		if seqno == 1 then
			if select == 1 then
				if data == "" then
					return
				end
				local playerindex = -1
				playerindex = other.atoi(data)
				if char.check(playerindex) == 1 then
					if char.getInt(playerindex, "地图号") == char.getInt(meindex, "地图号") and char.getWorkInt(playerindex,"组队") <= 1 and char.getWorkInt(playerindex,"战斗索引") < 0 and playerindex ~= talkerindex then
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
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()

end

function main()
	data()
	Create("萨庄战斗员", 16647, 1042, 16, 15, 6)
	Create("渔庄战斗员", 16647, 2032, 16, 15, 6)
	Create("加加战斗员", 16647, 3032, 16, 15, 6)
	Create("卡庄战斗员", 16647, 4032, 15, 16, 6)


end

