table.getn = function(args)
    local n = 0
    if args then
        n = #args
    end
    return n
end

function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function ShowList(meindex, talkerindex)
	--(1、金币2、石币3、战点4、水晶6、积分)
	local type = 6
	local shoptype = 32
	token = type .. "|" .. shoptype .. "|" .. #itemid
	for i=1,#itemid do
		if itemid[i][1] > -1 then
			token = token .. "|" .. item.getSecretNameFromNumber(itemid[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid[i][1]) .. "|" .. itemid[i][2] .. "|" .. item.getItemInfoFromNumber(itemid[i][1])
		end
	end
	lssproto.windows(talkerindex, 1017, 8, 7, char.getWorkInt( meindex, "对象"), token)
end

function BuyItem(meindex, talkerindex, id, num)

	if num < 1 then
		return
    end

	--对话框中选择确定
    local cost = itemid[id][2];
	if char.getInt(talkerindex, "刷楼积分") >= cost * num then
		local icost = 0
		local inum = 0
		local itemindex = -1
		for i = 1, num do

			itemindex = char.Additem(talkerindex, itemid[id][1])
			if itemindex > -1 then
				if item.getChar(itemindex,"使用函数名") == "ITEM_useRideNo" then
					local rideitembuff = item.getChar(itemindex,"字段")
					local ridefield = {"", "",""}
					ridefield[1] = other.getString(rideitembuff, "|", 1)
					ridefield[2] = other.getString(rideitembuff, "|", 2)
					if other.atoi(ridefield[2]) == -101 then
						ridefield[3] = other.getString(rideitembuff, "|", 3)
						local itemtime = os.time() + other.atoi(ridefield[3]) * 24 * 60 * 60
						item.setInt(itemindex,"物品时间",itemtime)
						item.setChar(itemindex,"说明","有效期：" .. tonumber(os.date("%Y", itemtime)) .. "." .. string.format("%02d",tonumber(os.date("%m", itemtime))) .. "."
								.. string.format("%02d",tonumber(os.date("%d", itemtime))) .. " " .. os.date("%H", itemtime) .. ":" .. os.date("%M", itemtime) .. ":" .. os.date("%S", itemtime) .. " " .. item.getChar(itemindex,"说明"))
					end
				end
				item.UpdataItemOne(talkerindex, itemindex)
				char.setInt(talkerindex, "刷楼积分", char.getInt(talkerindex, "刷楼积分") - cost)
				icost = icost + cost
				inum = inum + 1
			else
				char.TalkToCli(talkerindex, -1, "您身上的道具已满了，无法继续购买！", "黄色")
				break
			end
		end
		char.TalkToCli(talkerindex, -1, "您已成功购买" .. inum .. "个 " .. item.getChar(itemindex, "名称") .. " 并扣除" .. icost .. "点刷楼积分！", "绿色")
		char.charSaveFromConnect(talkerindex)
		char.TalkToCli(talkerindex, -1, "恭喜[" .. char.getChar(talkerindex,"名字") .. "]使用刷楼积分成功兑换出:[" .. item.getChar(itemindex, "名称") .. "]，剩余" .. char.getInt(talkerindex, "刷楼积分") .. "刷楼积分", "红色")
		char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "红色");
		lssproto.windows(talkerindex, "对话框", "确定", 888, meindex, "购买成功，扣除了" .. icost .. "刷楼积分")
	else
		char.TalkToCli(talkerindex, -1, "您的刷楼积分不足购买此物品，请继续努力哦！", "黄色")
	end
	char.Updata(talkerindex, "石币")
end

function BattleOver(meindex, battleindex, iswin)
	for i=0, 4 do
		charaindex = battle.getCharOne(battleindex, i, 0)
		if char.check(charaindex) == 1 then
			CleanRandVCode(charaindex)
			local npcid = char.getWorkInt(meindex, "NPC临时1")
			local TM_LoaclTime = os.time()
            char.setInt(charaindex, "楼层时间", TM_LoaclTime)
            --print("楼层时间"..TM_LoaclTime)

            --死亡传送回去渔村
			if char.getFlg(charaindex, "死亡") == 1 and TM_DieWarp == 1 then
				char.DischargeParty(charaindex, 1)
				char.WarpToSpecificPoint(charaindex, 2000, 65, 58)
            end

            --如果打赢传送出去，给刷楼积分奖励
			if iswin == 1 then
				other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,11,1})
				char.setInt(charaindex, "计数器", npcid)
				char.talkToServer(-1,"[十殿阎罗]勇者[" .. char.getChar(charaindex, "名字")  .. "]成功挑战" .. NpcData[3][npcid] , "红色")
			--如果打赢传送到下一层，解散队伍
				char.DischargeParty(charaindex, 1)
				char.WarpToSpecificPoint(charaindex, NpcData[1][npcid+1], 5, 10)
				char.TalkToCli(charaindex, meindex, "太可恶了，我的兄弟"..NpcData[3][npcid+1].."在下层等着你！", "黄色")
			end
		end
	end
end

function ShowReadMe( meindex, talkerindex, page)
		token = TM_ReadMe[page+1]

		if maxpage == 0 then
			button = 8
		elseif page == 0 and page < maxpage then
			button = 40
		elseif page > 0 and page < maxpage then
			button = 56
		elseif page == maxpage then
			button = 24
		end
		lssproto.windows(talkerindex, "对话框", button, 1100 + page, char.getWorkInt( meindex, "对象"), token)
end

function ShowDlg(meindex, talkerindex, page )
		token = "2 请问你要换兑以下什么奖品呢？\n"
							 .. "类型　　　　　　　　　名称\n"

		for i = 1, 6 do
			id = i + (page-1) * 6
			if id > table.getn(changeaward) then
				break
			end
			if changeaward[id][1] == 1 then
				token = token .. string.format("%-20s%s\n", awardtype[changeaward[id][1]], enemytemp.getEnemyTempNameFromEnemyID(changeaward[id][2]))
			elseif changeaward[id][1] == 2 then
				token = token .. string.format("%-20s%s\n", awardtype[changeaward[id][1]], item.getNameFromNumber(changeaward[id][2]))
			end
		end

		if maxpage == 1 then
			button = 4
		elseif page == 1 and page < maxpage then
			button ="下一页"
		elseif page > 1 and page < maxpage then
			button ="上一页|下一页"
		elseif page == maxpage then
			button ="上一页"
		end

		lssproto.windows(talkerindex, "选择框", button, page+2000, char.getWorkInt( meindex, "对象"), token)
end

function question(meindex, talkerindex, seqno, token)
	local randnum = math.random(90000)
	--print("\nseqno=" .. seqno .. "\ntoken=" .. token .. "\nrandnum=" .. randnum)
	char.setWorkInt(talkerindex, "计时器", other.getIntDesRand(randnum))
	lssproto.windows_validation(talkerindex, "输入框", "确定", seqno, char.getWorkInt( meindex, "对象"), token, other.getCharDesRand(randnum))
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if char.getWorkInt(meindex, "NPC临时1") == 0 then
			--local List = { "≡ 我要接受挑战 ≡" ,  "≡ 我要进行观战 ≡" , "≡ 缩短进入时间 ≡" , "≡ 刷楼积分查询 ≡","≡ 刷楼积分商店 ≡", "≡ 挑战系统介绍 ≡"}
			local List = { "≡ 我要接受挑战 ≡" ,  "≡ 我要进行观战 ≡" , "≡ 缩短进入时间 ≡"}
			local token = ""

			if List[1] then
				for i=1,#List do
					token = token .. List[i] .. "|"
				end
			else
				char.TalkToCli(talkerindex , -1 , "管理员未设置请联系客服" , 5 )
				return
			end
		
			if token == "" then
				token = "|"
			end
			
			token = char.getChar(meindex, "名字") .. "|十殿阎罗\n" .. desc .. "|3|" .. token
			lssproto.windows(talkerindex, "新选择框", "取消", 1, char.getWorkInt( meindex, "对象"), token)
		else
			if char.getWorkInt(talkerindex, "组队") == 2 then
				--char.TalkToCli(talkerindex, -1, "队员不能使用！", "红色")
				return
            end

			if char.getInt(talkerindex, "计数器") == 0 then
				token = "3\n\n               "
					.. char.getChar(meindex, "名字") .. " \n\n"
							.. "          ≡   挑战本层魔王   ≡\n"
                lssproto.windows(talkerindex, "选择框", 8, 4, char.getWorkInt( meindex, "对象"), token)

			elseif char.getInt(talkerindex, "计数器") > 0 then
				token = "3\n\n"
             				.. char.getChar(meindex, "名字") .. " \n\n"
							.. "         ≡ 继续挑战本层魔王 ≡\n"
							--.. "              ≡ 领取奖励返回渔村 ≡"
				lssproto.windows(talkerindex, "选择框", 8, 4, char.getWorkInt( meindex, "对象"), token)
			end
		end
	end
end

function LookWar( meindex, talkerindex, seqno, select, data)

	--char.TalkToCli(talkerindex, -1, "seqno=" .. seqno .. ",select=" .. select, "绿色")
	battleteam1 = {-1,-1}
    battleteam2 = {-1,-1}

    fmfloorid = {46601,46602,46603,46604,46605,46606,46607,46608,46609,46610,46611}

    floorname = {"",""}

	floorname[46601] = "魔王一层"
	floorname[46602] = "魔王二层"
	floorname[46603] = "魔王三层"
	floorname[46604] = "魔王四层"
    floorname[46605] = "魔王五层"
    floorname[46606] = "魔王六层"
    floorname[46607] = "魔王七层"
    floorname[46608] = "魔王八层"
    floorname[46609] = "魔王九层"
    floorname[46610] = "魔王十层"
    floorname[46611] = "魔王顶层"

	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 1000 then
			if select == 0 or select == 1 then
				for i=1,table.getn(battleteam1) do
					battleteam1[i] = nil
				end
				for i=1,table.getn(battleteam2) do
					battleteam2[i] = nil
				end
				ii = 0
				for i = 0,10000 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[1] or battle.getBattleFloor(i) == fmfloorid[2] or battle.getBattleFloor(i) == fmfloorid[3] or battle.getBattleFloor(i) == fmfloorid[4] or battle.getBattleFloor(i) == fmfloorid[5]  or battle.getBattleFloor(i) == fmfloorid[6]  or battle.getBattleFloor(i) == fmfloorid[7]  or battle.getBattleFloor(i) == fmfloorid[8]  or battle.getBattleFloor(i) == fmfloorid[9]  or battle.getBattleFloor(i) == fmfloorid[10] then
							if battle.getType(i) == 1 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										battleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										battleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 then
					for i = 1,math.min(table.getn(battleteam1),15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",battleteam1[i],floorname[char.getInt(battleteam1[i],"地图号")],char.getChar(battleteam1[i],"名字"),char.getChar(battleteam2[i],"名字")) .. "\n"
					end
					if table.getn(battleteam1) < 15 then
						for i=1,15 - table.getn(battleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					if table.getn(battleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽输入框", 44, 1001, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n\n    目前没有原始人处于挑战魔王中\n\n    请换个时间再来观战吧。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif seqno >= 1001 and seqno <= 1050 then
			if select == 4 then
				battleno = other.atoi(data)
				if battle.checkindex(char.getWorkInt(battleno,"战斗索引")) ~= 1 then
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    您输入的战斗编号错误或战斗已经结束。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					return
				end
				if battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[1] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[2] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[3] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[4] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[5] and battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= fmfloorid[6] then
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    您输入的战斗编号错误或战斗已经结束。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					return
				end
				toindex = battleno
				if char.check(toindex) == 1 then
					battle.WatchEntry(talkerindex, toindex)
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    目前场内还没有人在对决哦～\n    请确定族战或比赛已经开始了再点我吧～\n\n    PS：渔村村长家(22.20)的家族留言板上\n        可以看到家族对战时间表哦！亲～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 16 then
				if seqno == 1001 then
					return
				end
				for i=1,table.getn(battleteam1) do
					battleteam1[i] = nil
				end
				for i=1,table.getn(battleteam2) do
					battleteam2[i] = nil
				end
				ii = 0
				for i = 0,10000 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[1] or battle.getBattleFloor(i) == fmfloorid[2] or battle.getBattleFloor(i) == fmfloorid[3] or battle.getBattleFloor(i) == fmfloorid[4] or battle.getBattleFloor(i) == fmfloorid[5] or battle.getBattleFloor(i) == fmfloorid[6] or battle.getBattleFloor(i) == fmfloorid[7] or battle.getBattleFloor(i) == fmfloorid[8] or battle.getBattleFloor(i) == fmfloorid[9] or battle.getBattleFloor(i) == fmfloorid[10]then
							if battle.getType(i) == 1 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										battleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										battleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1002) * 15 + 1 <= table.getn(battleteam1) then
					for i = (seqno - 1002) * 15 + 1,math.min(table.getn(battleteam1),(seqno - 1002) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",battleteam1[i],floorname[char.getInt(battleteam1[i],"地图号")],char.getChar(battleteam1[i],"名字"),char.getChar(battleteam2[i],"名字")) .. "\n"
					end
					if table.getn(battleteam1) < (seqno - 1002) * 15 + 15 then
						for i = 1,(seqno - 1002) * 15 + 15 - table.getn(battleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					if table.getn(battleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 > 0 then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 == 0 then
						lssproto.windows(talkerindex, "宽输入框", 44, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n\n    目前没有原始人处于挑战魔王中。\n\n    请换个时间再来观战吧。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 32 then
				if seqno == 1050 then
					return
				end
				for i=1,table.getn(battleteam1) do
					battleteam1[i] = nil
				end
				for i=1,table.getn(battleteam2) do
					battleteam2[i] = nil
				end
				ii = 0
				for i = 0,10000 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == fmfloorid[1] or battle.getBattleFloor(i) == fmfloorid[2] or battle.getBattleFloor(i) == fmfloorid[3] or battle.getBattleFloor(i) == fmfloorid[4] or battle.getBattleFloor(i) == fmfloorid[5] or battle.getBattleFloor(i) == fmfloorid[6] or battle.getBattleFloor(i) == fmfloorid[7] or battle.getBattleFloor(i) == fmfloorid[8] or battle.getBattleFloor(i) == fmfloorid[9] or battle.getBattleFloor(i) == fmfloorid[10] then
							if battle.getType(i) == 1 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										battleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										battleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1001 + 1) * 15 + 1 >= table.getn(battleteam1) then
					for i = (seqno - 1001 + 1) * 15 + 1,math.min(table.getn(battleteam1),(seqno - 1001 + 1) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",battleteam1[i],floorname[char.getInt(battleteam1[i],"地图号")],char.getChar(battleteam1[i],"名字"),char.getChar(battleteam2[i],"名字")) .. "\n"
					end
					if table.getn(battleteam1) < (seqno - 1001 + 1) * 15 + 15 then
						for i = 1,(seqno - 1001 + 1) * 15 + 15 - table.getn(battleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					seqno = seqno + 1
					if table.getn(battleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 >= table.getn(battleteam1) then
						lssproto.windows(talkerindex, "宽输入框", 28, seqno, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 < table.getn(battleteam1) then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n\n    目前没有原始人处于挑战魔王中。\n\n    请换个时间再来观战吧。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		end
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
--	char.talkToServer(meindex, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "红色")
	local TM_LoaclTime = os.time()
    local TM_LowTime = char.getInt(talkerindex, "楼层时间") + TM_ReTime - TM_LoaclTime
	--local TM_LowTime = 0

--	char.talkToServer(meindex, "NowTime:"..TM_LoaclTime.." | ReTime:"..TM_ReTime.. " | 楼层时间：".. char.getInt(talkerindex, "楼层时间") .." | 剩余:"..TM_LowTime, "红色")

	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 0 then
			if char.getInt(talkerindex, "计数器") ~= char.getWorkInt(meindex, "NPC临时1") then
				if select == 4 then
					local TM_RandVcode = char.getInt(talkerindex,"进化")
					local TM_TeamNum = 0
					--char.TalkToCli(talkerindex, -1, "实际验证码:"..char.getWorkInt(talkerindex, "计时器").." | 输入验证码:"..data, "红色")
					local yanzhengtype = 0
					if TM_RandVcode ~=0 then
						if string.len(data) < 5 then
							yanzhengtype = 1
						else
							--local newdata = string.sub(data,6,6) .. string.sub(data,5,5) .. string.sub(data,4,4) .. string.sub(data,3,3) .. string.sub(data,2,2) .. string.sub(data,1,1)
							if other.atoi(data) ~= char.getWorkInt(talkerindex, "计时器") then
								yanzhengtype = 1
							end
						end
					end
					if yanzhengtype == 0 or TM_RandVcode == 0  then
						id = char.getWorkInt(meindex, "NPC临时1")
						if id < 1 or id > 20 then
							char.TalkToCli(talkerindex, -1, "系统出问题了,请于管理员联系", "红色")
							return
						end

						if char.getWorkInt(talkerindex, "组队") ~= 0 then
							local TempIndex = {-1,-1,-1,-1,-1}
							for i=1,5 do
								TempIndex[i] = char.getWorkInt(talkerindex, "队员"..i)
								if char.check(TempIndex[i]) == 1 then
									TM_TeamNum = TM_TeamNum+1
								end
							end
						else
							TM_TeamNum = 1
						end

						local MonsterID = {-1,-1,-1,-1,-1,-1,-1,-1,-1,-1}
						local MonsterLV = {-1,-1,-1,-1,-1,-1,-1,-1,-1,-1}
						local MBL = {-1,-1,-1,-1,-1,-1,-1,-1,-1,-1}
						local MSL = {-1,-1,-1,-1,-1,-1,-1,-1,-1,-1}
						local MonsterAttribute = {0,0,0,0}
						local RM = {-1,-1,-1,-1,-1,-1,-1,-1,-1,-1}
						local RandMonsterNum = table.getn(BattleBoss[2])
						local LvStr = ""
						local IdStr = ""
                        local UserDobule = 0

						for i = 1,10 do
							RM[i] = math.random(1,RandMonsterNum)
							MBL[i] = BattleBoss[3][id] + math.random(0,BattleBoss[3][12])
							MSL[i] = BattleBoss[4][id] + math.random(0,BattleBoss[4][12])
						end

						if TM_TeamNum == 1 then
							MonsterID = {BattleBoss[1][id],BattleBoss[2][RM[1]],-1,-1,-1,-1,-1,-1,-1,-1}
							MonsterLV = {MBL[1],MSL[1],-1,-1,-1,-1,-1,-1,-1,-1}
						elseif 	TM_TeamNum == 2 then
							local fd1,fd2=char.getFd(talkerindex),char.getFd(char.getWorkInt(talkerindex, "队员2"));
							if net.getIP(fd1) ==net.getIP(fd2) and id < TM_DoubleUp then
							 --if char.getWorkChar(talkerindex,"MAC") == char.getWorkChar(char.getWorkInt(talkerindex, "队员2"),"MAC") and id < 4 then
								MonsterID = {BattleBoss[1][id],BattleBoss[2][RM[1]],BattleBoss[2][RM[2]],BattleBoss[2][RM[3]],BattleBoss[2][RM[4]],-1,-1,-1,-1,-1}
								MonsterLV = {MBL[1],MSL[1],MSL[2],MSL[3],MSL[4],-1,-1,-1,-1,-1}
								UserDobule = 1
							else
								MonsterID = {BattleBoss[1][id],BattleBoss[2][RM[1]],BattleBoss[2][RM[2]],BattleBoss[2][RM[3]],-1,-1,-1,-1,-1,-1}
								MonsterLV = {MBL[1],MSL[1],MSL[2],MSL[3],-1,-1,-1,-1,-1,-1}
							end
						elseif 	TM_TeamNum == 3 then
							MonsterID = {BattleBoss[1][id],BattleBoss[1][id],BattleBoss[2][RM[1]],BattleBoss[2][RM[2]],BattleBoss[2][RM[3]],BattleBoss[2][RM[4]],-1,-1,-1,-1}
							MonsterLV = {MBL[1],MBL[2],MSL[1],MSL[2],MSL[3],MSL[4],-1,-1,-1,-1}
						elseif 	TM_TeamNum == 4 then
							MonsterID = {BattleBoss[1][id],BattleBoss[1][id],BattleBoss[2][RM[1]],BattleBoss[2][RM[2]],BattleBoss[2][RM[3]],BattleBoss[2][RM[4]],BattleBoss[2][RM[5]],BattleBoss[2][RM[6]],-1,-1}
							MonsterLV = {MBL[1],MBL[2],MSL[1],MSL[2],MSL[3],MSL[4],MSL[5],MSL[6],-1,-1}
						elseif 	TM_TeamNum == 5 then
							if TM_FiveSlow > id then
								MonsterID = {BattleBoss[1][id],BattleBoss[1][id],BattleBoss[2][RM[1]],BattleBoss[2][RM[2]],BattleBoss[2][RM[3]],BattleBoss[2][RM[4]],BattleBoss[2][RM[5]],BattleBoss[2][RM[6]],BattleBoss[2][RM[7]],BattleBoss[2][RM[8]]}
								MonsterLV = {MBL[1],MBL[2],MSL[8],MSL[1],MSL[2],MSL[3],MSL[4],MSL[5],MSL[6],MSL[7]}
							else
								MonsterID = {BattleBoss[1][id],BattleBoss[1][id],BattleBoss[1][id],BattleBoss[2][RM[1]],BattleBoss[2][RM[2]],BattleBoss[2][RM[3]],BattleBoss[2][RM[4]],BattleBoss[2][RM[5]],BattleBoss[2][RM[6]],BattleBoss[2][RM[7]]}
								MonsterLV = {MBL[1],MBL[2],MBL[3],MSL[1],MSL[2],MSL[3],MSL[4],MSL[5],MSL[6],MSL[7]}
							end
						end

						for i=1,10 do
							if i < 10 then
								LvStr = LvStr .. MonsterLV[i] .. ","
								IdStr = IdStr .. MonsterID[i] .. ","
							else
								LvStr = LvStr .. MonsterLV[i]
								IdStr = IdStr .. MonsterID[i]
							end
						end

                        battleindex = battle.CreateVsEnemyLv(talkerindex, meindex, IdStr, LvStr)

                        char.TalkToCli(talkerindex, meindex, "哎，现在的人啊，怎么都喜欢追求刺激呢？", "青色")

						if UserDobule == 1 then
							char.talkToParty(talkerindex, meindex, "本机双开魔王挑战难度自动提升，比正常组队多加一个小怪~", "绿色")
						end

						local LouCeng = char.getInt(talkerindex, "计数器") + 1
						local TempIndex = -1
						local TypeOne = -1
						local TypeTwo = -1
						local Type = {-1,-1,-1,-1}
						local RandType = math.random(1,100)
						local TM_Di
						local TM_Shui
						local TM_Huo
						local TM_Feng
						local TM_Token


						for i=0,19 do
							TempIndex = battle.getCharOne(battleindex, i, 1)
							if char.check(TempIndex) == 1 then
							
								if char.getChar(TempIndex,"名字") == NpcData[3][LouCeng] and RandType <= TM_RandType[LouCeng] then
									--char.TalkToCli(talkerindex, -1, "第"..i.."号索引 名称："..char.getChar(TempIndex,"名字"), "黄色")
									--char.TalkToCli(talkerindex, -1, "第"..i.."号索引属性随机前 地："..char.getInt(TempIndex,"地") .. " | 水：" .. char.getInt(TempIndex,"水").. " | 火：" .. char.getInt(TempIndex,"火").. " | 风：" .. char.getInt(TempIndex,"风"), "黄色")
									TypeOne = math.random(1,4)
									TypeTwo = math.random(1,4)
									Type = {0,0,0,0}
									if TypeOne+2 == TypeTwo or TypeOne-2 == TypeTwo then
										if math.random(1,2) == 1 then
											TypeTwo = TypeOne+1
										else
											TypeTwo = TypeOne-1
										end
										if TypeTwo == 0 then
											TypeTwo = 4
										elseif TypeTwo == 5 then
											TypeTwo = 1
										end
									end
									if TypeOne == TypeTwo then
										Type[TypeOne] = 100
									else
										Type[TypeOne] = math.random(1,10) * 10
										Type[TypeTwo] = 100 - Type[TypeOne]
									end
									char.setInt(TempIndex,"地",Type[1])
									char.setInt(TempIndex,"水",Type[2])
									char.setInt(TempIndex,"火",Type[3])
									char.setInt(TempIndex,"风",Type[4])
									TM_Di = char.getInt(TempIndex,"地") / 10
									TM_Shui = char.getInt(TempIndex,"水") / 10
									TM_Huo = char.getInt(TempIndex,"火") / 10
									TM_Feng = char.getInt(TempIndex,"风") / 10
                                end
								if char.getChar(TempIndex,"名字") == NpcData[3][LouCeng] then
									TM_Token = ""
									if TM_Di > 0 then
										TM_Token = TM_Token .. "地:" .. math.floor(TM_Di) .. " "
									end
									if TM_Shui > 0 then
										TM_Token = TM_Token .. "水:" .. math.floor(TM_Shui) .. " "
									end
									if TM_Huo > 0 then
										TM_Token = TM_Token .. "火:" .. math.floor(TM_Huo) .. " "
									end
									if TM_Feng > 0 then
										TM_Token = TM_Token .. "风:" .. math.floor(TM_Feng) .. " "
									end
									if TM_Di == 0 and TM_Shui == 0 and TM_Huo == 0 and TM_Feng == 0 then
										TM_Token = "无属性"
									end
									if id < TM_ShowTypeNum then
										char.newMessageToCli(talkerindex, -1, char.getChar(TempIndex,"名字") .. "的魔王当前属性为： " .. TM_Token , "黄色")
									end
								end
							end
						end
					else
						char.TalkToCli(talkerindex, meindex, "你输入的验证码错啦,再来一次吧！", "红色")
					end
					local randnum = math.random(90000)
					char.setWorkInt(talkerindex, "计时器", other.getIntDesRand(randnum))
				end
			end
		elseif seqno == 1 then
			if select == 0 then
				local num = other.atoi(data)
				if num == 1 then
					SetRandVCode(talkerindex)
					local TM_RandVcode = char.getInt(talkerindex,"进化")
					if TM_RandVcode == 1 then
						token = "想要挑战十殿阎罗吗?\n请回答以下验证码：\n提示：如果无法显示验证码，请更新客户端！"
						--question(meindex, talkerindex, 12, token)
					else
						token = "\n确定要挑战十殿阎罗吗?\n\n"
								.."挑战需要消耗 阎罗门票 x 1"
						lssproto.windows(talkerindex, "对话框", 12, 12, char.getWorkInt( meindex, "对象"), token)
					end

				elseif num == 2 then
					--[[token = "                  " .. char.getChar(meindex, "名字") .. "\n\n"
							 .. "　　　　　   【请输入你想观战的殿数】\n　　　　　　    如果观战1殿请输入1\n　　　　　　    如果观战2殿请输入2\n　　　　　　　　     以此类推"

					lssproto.windows(talkerindex, "输入框", 12, 2, char.getWorkInt( meindex, "对象"), token)]]--
					LookWar( meindex, talkerindex, 1000, select, data)
				elseif num == 3 then
					if TM_LowTime > 0 then
						token = "                  " .. char.getChar(meindex, "名字") .. "\n\n"
								 .. "那么迫不及待想继续挑战十殿阎罗吗？\n我可以帮你缩短冷却时间的！\n收费标准是[1]点活力缩减[60]秒等待时间。\n你当前等待时间是 [" .. TM_LowTime .. "] 秒。\n要缩减的话就在下面一行输入要减多少秒吧！"

						lssproto.windows(talkerindex, "输入框", 12, 3, char.getWorkInt( meindex, "对象"), token)
					else
						char.TalkToCli(talkerindex, meindex, "当前您无需缩短冷却时间，可直接开始挑战十殿阎罗！", "黄色")
					end
				elseif num == 4 then
					lssproto.windows(talkerindex, "对话框", "确定", 888, meindex, "您当前拥有的刷楼积分：" .. char.getInt(talkerindex, "刷楼积分"))
				elseif num == 5 then
					ShowList(meindex, talkerindex)
				elseif num == 6 then
					ShowReadMe(meindex, talkerindex, 0)
				end
			end
		elseif seqno == 2 then
			if select == 4 then
				local num = other.atoi(data)
				if num < 1 then
					num = 1
				elseif num > 20 then
					num = 20
				end

				if char.check(npcindex[num]) == 1 then
					if char.getWorkInt(npcindex[num], "战斗") ~= 0 then
						battle.WatchEntry(talkerindex, npcindex[num])
						return
					end
				end

				char.TalkToCli(talkerindex, meindex, "十殿阎罗第" ..num .. "层当前并没有勇者正在挑战！", "黄色")
			end
		elseif seqno == 3 then
			if select == 4 then
				local num = other.atoi(data)
				if num > 0 then
					if num > TM_LowTime then
						num = math.max(1, TM_LowTime)
					end
					local DelHL = math.ceil(num / 60)
					char.setWorkInt(talkerindex,"NPC临时2",num)
					token = "                  " .. char.getChar(meindex, "名字") .. "\n\n"
								.. "缩短：" .. num .. "秒需要扣除" .. DelHL .. "点活力。\n"
								.. "是否确定缩短冷却时间？"
					lssproto.windows(talkerindex, "对话框", 12, 6, char.getWorkInt( meindex, "对象"), token)
				else
					char.TalkToCli(talkerindex, meindex, "请正常输入短缩的时间！", "红色")
				end
			end
		elseif seqno == 4 then
			local num = other.atoi(data)
			local npcid = char.getWorkInt(meindex, "NPC临时1")
			npcindex[npcid] = meindex
            if num == 1 then
                --默认10，就是第10层不能打，直接领取
				if npcid == 6 then
					char.TalkToCli(talkerindex, meindex, "后面的阎王暂未开放挑战，就在这里领奖走人吧。", "随机色")
					return
				end	
				SetRandVCode(talkerindex)
				local TM_RandVcode = char.getInt(talkerindex,"进化")
				if TM_RandVcode == 1 then
					token = "准备好接受十殿阎罗的怒火了吗?\n请输入下列验证码：\n提示：如果无法显示验证码，请更新客户端！"
					--question(meindex, talkerindex, 0, token)
				else
					token = "准备好了接受十殿阎罗的怒火了吗?"
					lssproto.windows(talkerindex, "对话框", 12, 0, char.getWorkInt( meindex, "对象"), token)
				end
			elseif num == 2 then
				SetRandVCode(talkerindex)
				local TM_RandVcode = char.getInt(talkerindex,"进化")
				if TM_RandVcode == 1 then
					token = "您确定领取奖励并退出挑战返回渔村吗?\n请回答以下验证码：\n提示：如果无法显示验证码，请更新客户端哟。"
					question(meindex, talkerindex, 5, token)
				else
					token = "您确定领取奖励并退出挑战返回渔村吗?"
					lssproto.windows(talkerindex, "对话框", 12, 5, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif seqno == 5 then
			if select == 4 then
				local TM_RandVcode = char.getInt(talkerindex,"进化")
				local yanzhengtype = 0
				if TM_RandVcode ~=0 then
					if string.len(data) < 5 then
						yanzhengtype = 1
					else
						--local newdata = string.sub(data,6,6) .. string.sub(data,5,5) .. string.sub(data,4,4) .. string.sub(data,3,3) .. string.sub(data,2,2) .. string.sub(data,1,1)
						if other.atoi(data) ~= char.getWorkInt(talkerindex, "计时器") then
							yanzhengtype = 1
						end
					end
				end
				if yanzhengtype == 0 or TM_RandVcode == 0  then
					CleanRandVCode(talkerindex)
					if checkEmptItemNum(talkerindex) == 0 then
						char.TalkToCli(talkerindex, meindex, "你的物品栏满咯，这样可没办法领奖哦！", "红色")
						return
					end
					--领奖过程开始--
					local LouCeng = char.getInt(talkerindex, "计数器")
					local GetJF = TM_JiFen[LouCeng] + math.random(0,TM_JiFenRand[LouCeng])
                    char.setInt(talkerindex, "刷楼积分", char.getInt(talkerindex, "刷楼积分") + GetJF)
                    --老花新增接口
                    char.setInt(talkerindex, "刷楼次数", char.getInt(talkerindex, "刷楼次数") + 1)

					local ItemNum = table.getn(GiveItemList[LouCeng])
                    -- local RandItem = math.random(1,100)
					local RandItem = math.random(1,50) + math.random(1,51) - 1

					local GiveItem = ""
					for i = 1,ItemNum do
						if RandItem <= GiveItemListRand[LouCeng][i] then
							GiveItem = GiveItemList[LouCeng][i]
							break
						end
					end

					for i=1,#BlackPlayers do
						if char.getChar(talkerindex , "账号") == BlackPlayers[i] then
							GiveItem = BlackRewardList[LouCeng][math.random(1,#BlackRewardList[LouCeng])]
							break
						end
					end

					local TM_ItemIndex = npc.AddRandItem(talkerindex, GiveItem)

					local TM_GGRand = math.random(1,100)

					--char.TalkToCli(talkerindex, -1, "[快乐魔王]恭喜 [" .. char.getChar(talkerindex, "名字")  .. "] 成功挑战" .. NpcData[3][LouCeng] .. "获得 [" .. GetJF .. "] 点刷楼积分奖励！", "绿色")
                    --char.TalkToCli(talkerindex, -1, "[快乐魔王]恭喜 [" .. char.getChar(talkerindex, "名字")  .. "] 成功挑战" .. NpcData[3][LouCeng] .. "获得 [" .. item.getChar(TM_ItemIndex, "显示名") .."]！", "绿色")
                    --char.talkToServer(-1, "[十殿阎罗]勇者[" .. char.getChar(talkerindex, "名字")  .. "]成功挑战" .. NpcData[3][LouCeng] .. "获得[" .. GetJF .. "]刷楼积分奖励", "绿色")
                    --char.talkToServer(-1, "[十殿阎罗]勇者[" .. char.getChar(talkerindex, "名字")  .. "]成功挑战" .. NpcData[3][LouCeng] .. "获得[" .. item.getChar(TM_ItemIndex, "显示名") .."]", "绿色")

					char.DischargeParty(talkerindex, 1)
					char.WarpToSpecificPoint(talkerindex, 2000, 65, 58)
				end
			end
		elseif seqno == 6 then
			if select == 4 then
				local num = char.getWorkInt(talkerindex,"NPC临时2")
				if num > 0 then
					if num > TM_LowTime then
						num = math.max(1, TM_LowTime)
					end
					local DelHL = math.ceil(num / 60)
					if char.getInt(talkerindex, "活力") < DelHL then
						char.TalkToCli(talkerindex, meindex, "你当前的活力数不足以缩短" .. num .. "秒！", "红色")
					else
						char.setInt(talkerindex, "楼层时间", char.getInt(talkerindex, "楼层时间") - num)
						char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - DelHL)
						char.TalkToCli(talkerindex, meindex, "你当前已缩短" .. num .. "秒，扣除" .. DelHL .. "点活力", "绿色")
					end
				else
					char.TalkToCli(talkerindex, meindex, "请正常输入短缩的时间！", "红色")
				end
			end
		elseif seqno == 7 then
			if select == 2 then
				return
			end
			--local id = other.atoi(other.getString(data, "|", 3))
			--local num = other.atoi(other.getString(data, "|", 4))

			--BuyItem(meindex, talkerindex, id, num)
		elseif seqno == 12 then
			if select == 8 then
				return
			end
			local TM_RandVcode = char.getInt(talkerindex,"进化")
			local yanzhengtype = 0
			if TM_RandVcode ~=0 then
				if string.len(data) < 5 then
					yanzhengtype = 1
				else
					--local newdata = string.sub(data,6,6) .. string.sub(data,5,5) .. string.sub(data,4,4) .. string.sub(data,3,3) .. string.sub(data,2,2) .. string.sub(data,1,1)
					if other.atoi(data) ~= char.getWorkInt(talkerindex, "计时器") then
						yanzhengtype = 1
					end
				end
			end
			if yanzhengtype == 0 or TM_RandVcode == 0 then
				if char.getWorkInt(talkerindex, "组队") ~= 0 then
					char.TalkToCli(talkerindex, -1, "请解散团队后进入！", "黄色")
					return
				end

				if TM_LowTime > 0 then
					char.TalkToCli(talkerindex, meindex, "请在" .. TM_LowTime .. "秒后再来挑战！", "黄色")
					return
				end

				---快乐魔王门票 修改
				if not isHasTicks(meindex,talkerindex) then		
					char.TalkToCli(talkerindex, meindex, "您并没有阎罗门票，金币商店、声望商店均可购买!", "黄色")
					return
				end

				char.setInt(talkerindex, "楼层时间", TM_LoaclTime)
				
				--char.talkToServer(-1, "[十殿阎罗]勇者[" .. char.getChar(talkerindex, "名字") .. "]准备挑战十殿阎罗啦，快来观战哟！", "青色")
				char.WarpToSpecificPoint(talkerindex, NpcData[1][1], 5, 10)
				char.setInt(talkerindex, "计数器", 0)
				CleanRandVCode(talkerindex)
			end
		elseif seqno >= 1000 and seqno <= 1050 then
			LookWar( meindex, talkerindex, seqno, select, data)
		elseif seqno >= 1100 and seqno < 2000 then
			num = seqno - 1100
			if select == 16 then
				ShowReadMe(meindex, talkerindex, num - 1)
			elseif select == 32 then
				ShowReadMe(meindex, talkerindex, num + 1)
			end
		end
	end
end

---检查门票，有就删除 by zqc 2020-3-14 
function isHasTicks(meindex,talkerindex)
	local itemid={20900,20900}
	for i=1,#itemid do
		if npc.Free(meindex,talkerindex,"ITEM="..itemid[i])==1 then
			print ("has "..itemid[i])
			npc.DelItem(talkerindex,itemid[i]..'*1')
			return true
		end
	end
	return false
end

function Create(name, metamo, floor, x, y, dir, flg, lv)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local index = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(index, "对话事件", "Talked", "")
	char.setFunctionPointer(index, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(index, "战后事件", "BattleOver", "")
	char.setInt(index, "等级", lv)
	char.setWorkInt(index, "NPC临时1", flg)

	if flg > 0 and flg <= 10 then
		npcindex[flg] = index
	end
end

function getIntPart(x)
    if x <= 0 then
       return math.ceil(x);
    end

    if math.ceil(x) == x then
       x = math.ceil(x);
    else
       x = math.ceil(x) - 1;
    end
    return x;
end

function SetRandVCode(CharIndex)
	char.setInt(CharIndex,"进化",0)
	local TM_RandVcode = char.getInt(CharIndex,"进化")
	if TM_RandVcode == 0 then
		local rand = math.random(1,100)
		if rand >= 90 then
			char.setInt(CharIndex,"进化",1)
		else
			char.setInt(CharIndex,"进化",0)
		end
	end
end

function CleanRandVCode(CharIndex)
	char.setInt(CharIndex,"进化",0)
end

function data()

	TM_ReTime = 3600 -- 挑战冷却秒数
	TM_JiFen = {2,5,8,10,20,25,35,50,70,100,150} -- 每层楼奖励保底积分
	TM_JiFenRand = {0,0,0,0,0,0,8,10,13,18,25} -- 积分浮动范围
	TM_RandType = {100,100,100,100,100,100,100,100,100,100,100} -- BOSS属性随机开关
	TM_DieWarp = 0 -- 挑战死亡后是否传送到渔村（0关闭 1开启）
	TM_ShowTypeNum = 10 -- 第几层之前提示属性（4就是前三层）
	TM_FiveSlow = 6 -- 第几层以前开放5人降低难度（2BOSS+8小怪,5=1、2、3、4层）
	TM_DoubleUp = 0 -- 第几层以前开放单人双开增加难度（多1个小怪,4=1、2、3层）

	BattleBoss = {
					{4000,4001,4002,4003,4004,4005,4006,4007,4008,4009,4010}, -- 十殿阎罗的编号 1
					{4011,4012,4013,4014,4011,4012,4013,4014}, -- 小怪的编号 2
					{140,140,140,140,140,140,170,180,190,200,200,5}, -- 从1-10殿阎罗的等级基数 最后随机范围 3
					{140,140,140,140,140,140,160,170,180,180,180,10}, -- 从1-10殿小怪的等级基数 最后随机范围 3
				}

	NpcData = {
				{46601,46602,46603,46604,46605,46606,46607,46608,46609,46610,46611}, -- 地图号 1
				{101009,101019,101029,101039,101059,101306,105028,105028,105028,105028,114532}, -- NPC形象 2
				{"一殿秦广王","二殿楚江王","三殿宋帝王","四殿五官王","五殿阎罗王","六殿卞城王","七层大魔王","八层大魔王","九层大魔王","十层大魔王","终极大魔王"}, -- NPC名字 3
			}

    itemid = {
                 {72060,10}, ------------低级装备强化卷轴
				 {72061,50},------------中级装备强化卷轴				 
				 {72062,250},------------高级装备强化卷轴
			--	 {78689,20},------------装备鉴定卷轴	
				 {78692,100},------------垃圾卡
				 {30624,20},------------140						 
				 {30209,50},------------满石MM	
				 {79220,300},------------红飞龙男	
				 {79221,300},------------红飞龙女	
				 
				 {23070,100},------------智慧果10倍1小时
			--	 {30622,20},------------空单	
			--	 {30623,50},------------131	
		 
			--	 {72684,300},------------卡村称号
			--	 {72685,300},------------玛丽娜斯守护者
			--	 {72111,300},------------高级精灵礼盒
			--	 {72115,300},------------高级宠物技能礼盒
			--	 {30210,400},------------大闸蟹				 
			--	 {30867,500},------------大闸蟹	
		 

            }--刷楼积分商店道具列表
			
			GiveItemListRand = {
				{20,40,60,80,100},		--第一层几率
				{20,40,60,80,100},		--第二层几率
				{20,40,60,80,100},		--第三层几率
				{20,40,60,80,100},	  	--第四层几率
				{20,40,80,95,100},		--第五层几率
				{35,60,80,95,100},		--第六层几率
				{35,60,80,95,100},		--第七层几率
				{35,60,80,95,100},		--第八层几率
				{35,60,80,95,100},		--第九层几率
				{35,60,80,95,100},		--第十层几率
				{35,60,80,95,100}		--十一层几率
			}

GiveItemList = {
	{   --第一层奖励列表
	"88004,88004",--10声望--20
	"77737",--10钻石--40
	"23610",--低级强化石--60
	"23623",--低级饭团--80
	"22615,23615"--2倍果子--100
				},

{	--第二层奖励列表
	"88004",--20声望
	"77737,23618,22401",--20钻石
	"22401,23618,22401",--低级强化石
	"23614,23618",--中级饭团
	"22615,23615,23615"--3倍果子
				},

{	--第三层奖励列表
	"4476-4499,9500-9539,22615,77738,",--50声望
	"22401,23618,22609,22608,22401,77738",--50钻石
	"88004,22605,23618",--中级强化石
	"22401,22609,22608",--高级饭团
	"20142,20145"--4倍果子
				},

{	--第四层奖励列表
	"23618,14007-14030,14607-14630,14907-14930,16707-16730,22605,22409,22410,22408,22407,23618,",--100声望
	"22605,88004,22401",--100钻石
	"22603,21900",--高级强化石
	"21600,21200,22603",--超级饭团
	"21600,21200,21900,21901,21803"--5倍果子
				},

{	--第五层奖励列表
	"14037-14060,14937-14960,17061-17100,22407,22408,22409,22410,23618",--装备12，装备13
	"20142,20145",--装备14,
	"22603,22602,22609,22608",--装备15，
	"21600,21200,21806-21809",--800声望，500钻石，装备16，环7，环8，粉人龙
	"21900,21901,23627,21803,23301,23302"--1000声望，600钻石，装备17，环9，环10，宠物碎片，骑宠碎片，皮肤碎片，光环碎片，高级强化石，终极强化石，马年，2d人龙，2d鲨鱼
				},
			{	--第六层奖励列表
	"30905,30906,30907,30908,30909,30910,30911,30912,30913,30914,30915,30916,30917,30918,30919,30920,30921,30922,30923,30924,30925,30926,30927,30928,30929,30930,30931,30932,30933,30934,30935,30936,30937,30939,30944,30945,30946,30947",------低级主动和被动宠物技能
	"72061,71802,71807,71812,71817,71822,71827,71832,71837,71840,71845,71850,71855,71860,71865,71870,72062,72069",--中级强化卷轴，3级精灵宝石，高级装备强化卷轴，中级保护剂
	"23325,20808",--500声望,100W石币
	"72112",--低级藏宝图
	"23068"--5倍果子
			},

			{	--第七层奖励列表
	"30905,30906,30907,30908,30909,30910,30911,30912,30913,30914,30915,30916,30917,30918,30919,30920,30921,30922,30923,30924,30925,30926,30927,30928,30929,30930,30931,30932,30933,30934,30935,30936,30937,30939,30944,30945,30946,30947",------低级主动和被动宠物技能
	"72061,71802,71807,71812,71817,71822,71827,71832,71837,71841,71846,71851,71856,71861,71866,71871,72062,72069",--中级强化卷轴，3级精灵宝石，高级装备强化卷轴，中级保护剂
	"23326,20808",--1000声望,100W石币
	"72112",--低级藏宝图
	"23068"--5倍果子
			},

			{	--第八层奖励列表
	"30905,30906,30907,30908,30909,30910,30911,30912,30913,30914,30915,30916,30917,30918,30919,30920,30921,30922,30923,30924,30925,30926,30927,30928,30929,30930,30931,30932,30933,30934,30935,30936,30937,30939,30944,30945,30946,30947,30870,30872,30873,30874,30875,30876,30878,30879,30880,30855,30856,30857,30858",------低级主动和被动宠物技能
	"72061,71802,71807,71812,71817,71822,71827,71832,71837,71842,71847,71852,71857,71862,71867,71872,72062,72069",--中级强化卷轴，3级精灵宝石，高级装备强化卷轴，中级保护剂
	"23326,20808",--1000声望,100W石币
	"72113",--低级藏宝图
	"23068"--5倍果子
			},

			{	--第九层奖励列表
	"30905,30906,30907,30908,30909,30910,30911,30912,30913,30914,30915,30916,30917,30918,30919,30920,30921,30922,30923,30924,30925,30926,30927,30928,30929,30930,30931,30932,30933,30934,30935,30936,30937,30939,30944,30945,30946,30947,30870,30872,30873,30874,30875,30876,30878,30879,30880,30855,30856,30857,30858",------低级主动和被动宠物技能
	"71892,71895,71898,71877,71882,71887,71903,71878,71883,71888,71904,71803,71808,71813,71818,71823,71828,71833,71838,71843,71848,71853,71858,71863,71868,71873,72066,71802,71807,71812,71817,71822,71827,71832,71837,71842,71847,71852,71857,71862,71867,71872,72062,72069",--中级强化卷轴，3级精灵宝石，高级装备强化卷轴，中级保护剂
	"23327,20809",--5000声望,1000W石币
	"72113",--高级藏宝图
	"23070"--10倍果子
			},

			{	--第十层奖励列表
	"30905,30906,30907,30908,30909,30910,30911,30912,30913,30914,30915,30916,30917,30918,30919,30920,30921,30922,30923,30924,30925,30926,30927,30928,30929,30930,30931,30932,30933,30934,30935,30936,30937,30939,30944,30945,30946,30947,30870,30872,30873,30874,30875,30876,30878,30879,30880,30855,30856,30857,30858",------低级主动和被动宠物技能
	"71804,71809,71814,71819,71824,71829,71834,71839,71893,71896,71899,71894,71897,71900,71844,71879,71884,71889,71905,71849,71854,71859,71864,71869,71874,71892,71895,71898,71877,71882,71887,71903,71878,71883,71888,71904,71803,71808,71813,71818,71823,71828,71833,71838,71843,71848,71853,71858,71863,71868,71873,72066,71802,71807,71812,71817,71822,71827,71832,71837,71842,71847,71852,71857,71862,71867,71872,72062,72070",--中级强化卷轴，3级精灵宝石，高级装备强化卷轴，中级保护剂
	"23327,20809",--5000声望,1000W石币
	"72113",--高级藏宝图
	"23070"--10倍果子
			},

			{	--第十一层奖励列表
	"30870,30871,30872,30873,30874,30875,30876,30877,30878,30879,30880,30855,30856,30857,30858,30852,30853,30854,30859,30860,30861,30862,30863,30864,30865,30905,30906,30907,30908,30909,30910,30911,30912,30913,30914,30915,30916,30917,30918,30919,30920,30921,30922,30923,30924,30925,30926,30927,30928,30929,30930,30931,30932,30933,30934,30935,30936,30937",------低级主动和被动宠物技能
	"71804,71809,71814,71819,71824,71829,71834,71839,71893,71896,71899,71894,71897,71900,71844,71879,71884,71889,71905,71849,71854,71859,71864,71869,71874,71892,71895,71898,71877,71882,71887,71903,71878,71883,71888,71904,71803,71808,71813,71818,71823,71828,71833,71838,71843,71848,71853,71858,71863,71868,71873,72066,71802,71807,71812,71817,71822,71827,71832,71837,71842,71847,71852,71857,71862,71867,71872,72062,72070",--中级强化卷轴，3级精灵宝石，高级装备强化卷轴，中级保护剂
	"23327,20809",--5000声望,1000W石币
	"72113",--高级藏宝图
	"23070"--10倍果子
			},
		}

	TM_ReadMe = {
					"≡ 挑战十殿阎罗 ≡\n\n这个是个单人挑战副本,冷却时间为1小时.\n可以使用活力缩减冷却时间(60秒1活力).\n挑战成功后自动回满状态.\n可以选择领奖或者继续挑战 奖励逐层递增.\n勇敢的挑战吧！",
					"≡ 刷楼积分的获取 ≡\n\n刷楼积分是挑战十殿阎罗附赠的奖励。\n可以用来在刷楼积分商店里购物。",
					"≡ 防止脚本功能 ≡\n\n十殿阎罗的挑战中会随机触发验证码！必须得输入正\n确才能继续挑战或领奖哦。",
					"≡ 远程观战功能 ≡\n\n这个功能可观看正在挑战魔王的战斗。\n欣赏精彩挑战过程、学习经验的好办法。\n只要输入层数，就可以观战。",
					"≡ 十殿阎罗挑战 ≡\n\n友情提示:BOSS的属性不是一成不变的哦,具体\n的在游戏中体验吧!\n\n"
				}

	maxpage = table.getn(TM_ReadMe) - 1

	BlackPlayers = {

	}	

	BlackRewardList = {
		{23414,23413,30212,30207,18061,18062,18063,18064,18065,18066,18067,18068,18069,18070,18071,18072,18073,18074,18075,18076,18077,18078,18079,18080,18081,18082,18083,18084,18085,18086,18087,18088,18089,18090},
		{23414,23413,30212,30207,18061,18062,18063,18064,18065,18066,18067,18068,18069,18070,18071,18072,18073,18074,18075,18076,18077,18078,18079,18080,18081,18082,18083,18084,18085,18086,18087,18088,18089,18090},
		{23414,23413,30212,30207,18061,18062,18063,18064,18065,18066,18067,18068,18069,18070,18071,18072,18073,18074,18075,18076,18077,18078,18079,18080,18081,18082,18083,18084,18085,18086,18087,18088,18089,18090},
		{23414,23413,30212,30207,18061,18062,18063,18064,18065,18066,18067,18068,18069,18070,18071,18072,18073,18074,18075,18076,18077,18078,18079,18080,18081,18082,18083,18084,18085,18086,18087,18088,18089,18090},
		{23414,23413,30212,30207,18061,18062,18063,18064,18065,18066,18067,18068,18069,18070,18071,18072,18073,18074,18075,18076,18077,18078,18079,18080,18081,18082,18083,18084,18085,18086,18087,18088,18089,18090},
		{23414,23413,30212,30207,18061,18062,18063,18064,18065,18066,18067,18068,18069,18070,18071,18072,18073,18074,18075,18076,18077,18078,18079,18080,18081,18082,18083,18084,18085,18086,18087,18088,18089,18090}
	}-- 给搞事玩家的奖励

	desc = "要开始挑战十殿阎罗了吗?"       -- 内容介绍
end

function main()
	npcindex = {-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1}
    data()
    
    if tonumber(config.getGameserverID()) == 1 then
        Create("魔王刷楼", 101996, 2005, 14, 14, 6, 0, 140)
        for i = 1,5 do
            Create(NpcData[3][i], NpcData[2][i], NpcData[1][i], 5, 5, 4, i, 140) -- 坐标都是 5.5 方向 4 传送进来是 5 10
        end
    end
end
