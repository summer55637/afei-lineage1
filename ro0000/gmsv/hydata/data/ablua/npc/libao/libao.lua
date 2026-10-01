function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function querygift2(cdkey,flg)
	token = "select `NeiCe` from `CSAlogin` where `Name`='" ..  cdkey .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			if other.atoi(sasql.data(1)) > 0 then
				return 1
			end
		end
	end
	return 0
end

function querygift(cdkey,flg)
	token = "select * from `Gift` where `cdkey`='" ..  cdkey .. "'"
	ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row(0)
			if other.atoi(sasql.data(flg+1)) == 1 then
				return 1
			end
		else
			token = "insert into `Gift` values ('" .. cdkey .. "',0,0,0,0)"
			sasql.query(token)
		end
	end
	return 0
end

function updategift(cdkey,flg)
	token = "update `Gift` set `data" .. flg .. "`=1 where `cdkey`='" ..  cdkey .. "'"
	sasql.query(token)
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "2           请您选择要领取的等级礼包\n\n"
		for i=1,table.getn(gifttranslevel) do
			token = token .. "          [领取礼包]  " .. gifttranslevel[i][1] .. "转" .. gifttranslevel[i][2] .. "-" .. gifttranslevel[i][3] .. "级\n" 
		end
		lssproto.windows(talkerindex, "选择框", "YES", 0, char.getWorkInt( npcindex, "对象"), token)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno ~= 0 then
		return
	end
	if other.atoi(data) >=1 and other.atoi(data) <= 4 then
		local level = char.getInt(talkerindex,"等级")
		local trans = char.getInt(talkerindex,"转数")
		if trans == gifttranslevel[other.atoi(data)][1] and level >= gifttranslevel[other.atoi(data)][2] and level <= gifttranslevel[other.atoi(data)][3] then
			if querygift2(char.getChar(talkerindex,"账号"),other.atoi(data)) > 0 then
				token = "\n\n　　　　您这个号貌似已经领取过公测礼包啦\n\n　　　　不能重复参与礼包活动哟。"
				lssproto.windows(talkerindex, "对话框", "YES", -1, -1, token)
				return
			end
			if querygift(char.getChar(talkerindex,"账号"),other.atoi(data)) == 0 then
				if checkEmptItemNum(talkerindex) < table.getn(giftitemid[other.atoi(data)]) then
					token = "\n\n您身上道具空位不足。\n\n请清空三格以上后再来找我。"
					lssproto.windows(talkerindex, "对话框", "YES", -1, -1, token)
					return
				end
				for j=1,table.getn(giftitemid[other.atoi(data)]) do
					local itemindex = char.Additem(talkerindex,giftitemid[other.atoi(data)][j])
					if giftitemid[other.atoi(data)][j] == 20900 then
						item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
					end
				end
				updategift(char.getChar(talkerindex,"账号"),other.atoi(data))
				token = "\n恭喜您成功领取这个阶段的等级奖励。\n\n注意：此奖励一个账号只能领取一次哦。"
				lssproto.windows(talkerindex, "对话框", "YES", -1, -1, token)
				char.TalkToCli(talkerindex, meindex, "您这个阶段的礼包已领取成功，打开包裹看看呗！", "随机色")
				return
			else
				token = "\n\n您的账号已经领取了这个阶段的升级奖励咯！\n\n注意：此奖励一个账号只能领取一次哦。"
				lssproto.windows(talkerindex, "对话框", "YES", -1, -1, token)
				return
			end
		else
			token = "\n　　　　　　您的等级不在此范围内。\n\n　　　　　　无法领取此阶段的礼包。\n\n　　　　　　再看看其他的礼包吧！"
			lssproto.windows(talkerindex, "对话框", "YES", -1, -1, token)
			return
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
	gifttranslevel = {{0,1,140},{1,120,140},{3,135,140},{5,140,140}}
	giftitemid = {{22018,22019,22017},{22009,21099,18547},{22008,22016,22012},{22015,22014,20900,21100}}
end


function main()
	--Create("圣诞老人", 41340, 2006, 18, 16, 4)
	data()
end