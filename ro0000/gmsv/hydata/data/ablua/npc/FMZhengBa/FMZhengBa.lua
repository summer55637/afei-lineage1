function NetLoopFunction()
if config.getGameservername() ~= "娱乐互动线" then--是否限制线路
return
end
	if pktime == -1 then
	if tonumber(os.date("%w",os.time())) == 0 then--每周几开启
		if tonumber(os.date("%H", os.time())) == 20 and tonumber(os.date("%M", os.time())) == 30 then--开启时间
		Delfmjl()
			pktime = 30--倒计时
		end
		end
		return
	elseif pktime > 0 then
		pktime = pktime - 1
		if pktime == 0 then
			char.talkToServer(-1, "[家族乱舞争霸]正式开始咯~", "红色")
			
			strattime = 0
		else
			char.talkToServer(-1, "[家族乱舞争霸]距离家族乱舞争霸战正式时间还剩" .. pktime .. "分钟，请各位家族成员到" .. map.getFloorName(2005) .. "(9,8)入场准备，争夺霸主资格！", "红色")
		end
	end
	if pktime == 0 then
		if other.time() > strattime then
			fmindex = -1
			fmname = ""
			familynum = 0
			for i = 0, char.getPlayerMaxNum() - 1 do
				if char.check(i) == 1 then
					if char.getInt(i, "地图号") == 140 then
							if fmindex == -1 then
							fmindex = char.getInt(i,"家族索引")
							fmname = char.getChar(i,"家族")
						else
							if char.getInt(i,"家族索引") ~= fmindex then
								familynum = 1
							end
						end
					end
				end
			end

			if familynum == 0 then

                       			token = "insert into `FMZhengBa` values ('" .. fmindex .. "','" .. fmname .. "',1)"
			sasql.query(token)
char.talkToAllServer("P|P|[家族乱舞争霸] 王者诞生〈" .. fmname .. "〉获得本次霸主家族地位，恭喜他们。","")
			--char.talkToAllServer("[家族乱舞争霸] 王者诞生〈" .. fmname .. "〉获得本次霸主家族地位，恭喜他们。")
char.talkToAllServer("P|P|[家族乱舞争霸] 〈" .. fmname .. "〉族长可到报名处领取奖励,截至下次活动结束之前家族成员可至" .. map.getFloorName(fmzhengbamap) .. "挂机。","")
			--char.talkToAllServer("[家族乱舞争霸] 〈" .. fmname .. "〉族长可到报名处领取奖励,截至下次活动结束之前家族成员可至" .. map.getFloorName(fmzhengbamap) .. "挂机。")			
				for i = 0, char.getPlayerMaxNum() - 1 do
					if char.check(i) == 1 then
						if char.getInt(i, "地图号") == 140 then
							char.WarpToSpecificPoint(i, 2005, 11, 12)
						elseif char.getInt(i, "地图号") == fmzhengbamap then
							char.WarpToSpecificPoint(i, 2005, 11, 12)	
						end
					end
				end												
				pktime = -1
			else
				for charaindex1 = 0, char.getPlayerMaxNum() - 1 do
					if char.check(charaindex1) == 1 then
						if char.getInt(charaindex1, "地图号") == 140 then
							if char.getWorkInt(charaindex1, "组队") ~= 2 and char.getWorkInt(charaindex1, "战斗") == 0 then
								charaindex2 = -1
								for i = 0, char.getPlayerMaxNum() - 1 do
									if char.check(i) == 1 then
										if char.getInt(i, "类型") == 1 and char.getInt(i, "地图号") == 140 then
											if char.getWorkInt(i, "组队") ~= 2 and char.getWorkInt(i, "战斗") == 0 then
												if charaindex1 ~= i then
													if char.getInt(charaindex1, "家族索引") ~= char.getInt(i, "家族索引") then
														charaindex2 = i
														if math.random(3) == 1 then
															break
														end
													end
												end
											end
										end
									end
								end
								if char.check(charaindex2) == 1 then
									battleindex = battle.CreateVsPlayer(charaindex1, charaindex2)
									if battleindex > -1 then
										battle.setLUAFunctionPointer(battleindex, "结束事件", "BattleFinish", "")
									end
								end
							end
						end
					end
				end
				strattime = other.time() + 180
				char.talkToFloor(140, -1, "[家族乱舞争霸]三分钟后将安排新一轮对决!请尽快补给!", "红色")
			end
		end
	end
end

function BattleFinish( charaindex )
	if char.getInt(charaindex, "地图号") == 140 then
		if char.getFlg(charaindex, "死亡") == 1 or char.getWorkInt(charaindex, "逃跑") == 1 then
			char.DischargeParty(charaindex, 1)
			char.WarpToSpecificPoint(charaindex, 2005, 11, 12)
		end
		
		strattime = other.time() + 180
		char.talkToFloor(140, -1, "[家族乱舞争霸]三分钟后将安排新一轮对决!请尽快补给!", "红色")
	end
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )

	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if pktime == -1 then
		token = char.getChar(meindex, "名字") .. "|《家族乱舞争霸》\n每周日X20时30分开放|3|族长领取奖励|传送专享地图|争霸规则介绍"
		lssproto.windows(talkerindex, "新选择框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
		elseif pktime > 0 then
			token = "               『" .. char.getChar(meindex, "名字") .. "』\n    《家族乱舞争霸》将在" .. pktime .. "分钟后开始进行，请各方家族开始入场做好准备！最后剩下的家族将获得霸主资格！\n胜利的家族成员，可任意传送至--140金暴洞地图,专送权限直到下一次对决时取消\n结束后，家族族长领取 （5W金+机年的蛋蛋）\n你要入场吗?!"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
		elseif pktime == 0 then
			token = "               『" .. char.getChar(meindex, "名字") .. "』\n\n    请问你需要观战吗？"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 2, char.getWorkInt( meindex, "对象"), token)
		end
	end
end
--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
	if seqno == 0 then
	num = other.atoi(data)
			if num == 1 then
								if char.getInt( talkerindex, "家族地位") ~= 3 then --族长3 
					char.TalkToCli(talkerindex, meindex, "你不是族长无法领取奖励!", "黄色")
					return
					end
                    local fmindex1,fmname1,flg1 = FMZhengBa()
					print("展示:"..fmindex1,fmname1,flg1)
					if char.getInt(talkerindex, "家族索引") == fmindex1 and fmname1 ==  char.getChar(talkerindex,"家族") and char.getInt( talkerindex, "家族地位") == 3 and flg1 == 1 then
					npc.AddItem(talkerindex, fmzhengbaitem)
					sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex)+ fmzhengvippoint)
char.talkToAllServer("P|P|[家族乱舞争霸] 恭喜〈" .. fmname1 .. "〉族长领取霸主家族奖励成功。","")

					--char.talkToAllServer("[家族乱舞争霸] 恭喜〈" .. fmname1 .. "〉族长领取霸主家族奖励成功。")
					upfmjl()
					else
					char.TalkToCli(talkerindex, -1, "你不是霸主家族族长或本次争霸奖励已领取！", "红色")
					return
				end	
			elseif num == 2 then
							if char.getWorkInt(talkerindex, "组队") ~= 0 then
					char.TalkToCli(talkerindex, -1, "请解散团队后进入！", "黄色")
					return
				end	
				local fmindex2,fmname2,flg2 = FMZhengBa()
				if char.getInt( talkerindex, "家族地位") > 0 and char.getInt( talkerindex, "家族地位") ~= 2 and char.getInt(talkerindex, "家族索引") == fmindex2 and fmname2 == char.getChar(talkerindex,"家族") then				
						char.WarpToSpecificPoint(talkerindex, fmzhengbamap, 42, 53)
				else
					char.TalkToCli(talkerindex, meindex, "你不是获胜家族成员！无法为您传送!", "黄色")
				end
			elseif num == 3 then
			token = "               『" .. char.getChar(meindex, "名字") .. "』\n    家族乱舞争霸于每周日晚上9点举行,8点30分可进场,最后剩下的家族将获得霸主资格！\n胜利的家族成员，可任意传送至----特定挂机地图,专送权限直到下一次对决时取消\n结束后，家族族长领取 （5W金+机年的蛋蛋）"
			lssproto.windows(talkerindex, "对话框", "取消", -1, char.getWorkInt( meindex, "对象"), token)
            end
		elseif seqno == 1 then
			if select == 1 then
				if char.getWorkInt(talkerindex, "组队") ~= 0 then
					char.TalkToCli(talkerindex, -1, "请解散团队后进入！", "黄色")
					return
				end	
				if char.getInt( talkerindex, "家族地位") > 0 and char.getInt( talkerindex, "家族地位") ~= 2 then				
						char.WarpToSpecificPoint(talkerindex, 140, 14, 14)
				else
					char.TalkToCli(talkerindex, meindex, "你不是家族成员！", "黄色")
				end
			end
		elseif seqno == 2 then
			if select == 1 then
            FmPkLookWar( meindex, talkerindex, 2, select, data)
			end
		elseif seqno >= 1001 and seqno <=1050 then
		FmPkLookWar ( meindex, talkerindex, seqno, select, data)	
		end
	end
end

function FmPkLookWar ( meindex, talkerindex, seqno, select, data)
	autopkbattleteam1 = {-1,-1}
	autopkbattleteam2 = {-1,-1}
	autopkfloorid = 140
	autopkfloorname = "家族地图"
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 2 then
			if select == 0 or select == 1 then
				for i=1,table.getn(autopkbattleteam1) do
					autopkbattleteam1[i] = nil
				end
				for i=1,table.getn(autopkbattleteam2) do
					autopkbattleteam2[i] = nil
				end
				ii = 0
				for i = 0,400 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == autopkfloorid then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										autopkbattleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										autopkbattleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 then
					for i = 1,math.min(table.getn(autopkbattleteam1),15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",autopkbattleteam1[i],autopkfloorname,char.getChar(autopkbattleteam1[i],"名字"),char.getChar(autopkbattleteam2[i],"名字")) .. "\n"
					end
					if table.getn(autopkbattleteam1) < 15 then
						for i=1,15 - table.getn(autopkbattleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					if table.getn(autopkbattleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, "宽输入框", 44, 1001, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n\n    很遗憾，目前场内还没有人在对决哦～\n\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif seqno >= 1001 and seqno <= 1050 then
			if select == 4 then
				battleno = other.atoi(data)
				if battle.checkindex(char.getWorkInt(battleno,"战斗索引")) ~= 1 then
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，您输入的战斗编号错误或战斗已经结束。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					return
				end
				if battle.getBattleFloor(char.getWorkInt(battleno,"战斗索引")) ~= autopkfloorid then 
					token = "                 " .. char.getChar(meindex, "名字") .. "\n\n    很遗憾，您输入的战斗编号错误或战斗已经结束。"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
					return
				end
				toindex = battleno
				if char.check(toindex) == 1 then
					battle.WatchEntry(talkerindex, toindex)
				else
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n\n    很遗憾，目前场内还没有人在对决哦～\n\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 16 then
				if seqno == 1001 then
					return
				end
				for i=1,table.getn(autopkbattleteam1) do
					autopkbattleteam1[i] = nil
				end
				for i=1,table.getn(autopkbattleteam2) do
					autopkbattleteam2[i] = nil
				end
				ii = 0
				for i = 0,400 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == autopkfloorid then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										autopkbattleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										autopkbattleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1002) * 15 + 1 <= table.getn(autopkbattleteam1) then
					for i = (seqno - 1002) * 15 + 1,math.min(table.getn(autopkbattleteam1),(seqno - 1002) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",autopkbattleteam1[i],autopkfloorname,char.getChar(autopkbattleteam1[i],"名字"),char.getChar(autopkbattleteam2[i],"名字")) .. "\n"
					end
					if table.getn(autopkbattleteam1) < (seqno - 1002) * 15 + 15 then
						for i = 1,(seqno - 1002) * 15 + 15 - table.getn(autopkbattleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					if table.getn(autopkbattleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 > 0 then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1002) * 15 == 0 then
						lssproto.windows(talkerindex, "宽输入框", 44, seqno - 1, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n\n    很遗憾，目前场内还没有人在对决哦～\n\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif select == 32 then
				if seqno == 1050 then
					return
				end
				for i=1,table.getn(autopkbattleteam1) do
					autopkbattleteam1[i] = nil
				end
				for i=1,table.getn(autopkbattleteam2) do
					autopkbattleteam2[i] = nil
				end
				ii = 0
				for i = 0,400 do
					if battle.checkindex(i) == 1 then
						if battle.getBattleFloor(i) == autopkfloorid then
							if battle.getType(i) == 2 then
								ii = ii + 1
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,0)) == 1 then
										autopkbattleteam1[ii] = battle.getCharOne(i,jj,0)
										break
									end
								end
								for jj=0,9 do
									if char.check(battle.getCharOne(i,jj,1)) == 1 then
										autopkbattleteam2[ii] = battle.getCharOne(i,jj,1)
										break
									end
								end
							end
						end
					end
				end
				token = ""
				if ii > 0 and (seqno - 1001 + 1) * 15 + 1 <= table.getn(autopkbattleteam1) then
					for i = (seqno - 1001 + 1) * 15 + 1,math.min(table.getn(autopkbattleteam1),(seqno - 1001 + 1) * 15 + 15) do
						token = token .. string.format("ID:%-4d   %s    %16s Vs %s",autopkbattleteam1[i],autopkfloorname,char.getChar(autopkbattleteam1[i],"名字"),char.getChar(autopkbattleteam2[i],"名字")) .. "\n"
					end
					if table.getn(autopkbattleteam1) < (seqno - 1001 + 1) * 15 + 15 then
						for i = 1,(seqno - 1001 + 1) * 15 + 15 - table.getn(autopkbattleteam1) do
							token = token .. "\n"
						end
					end
					token = token .. "请输入您要观战的战斗编号："
					seqno = seqno + 1
					if table.getn(autopkbattleteam1) <= 15 then
						lssproto.windows(talkerindex, "宽输入框", "YES|NO", 1001, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 >= table.getn(autopkbattleteam1) then
						lssproto.windows(talkerindex, "宽输入框", 28, seqno, char.getWorkInt( meindex, "对象"), token)
					elseif (seqno - 1001 + 1) * 15 < table.getn(autopkbattleteam1) then
						lssproto.windows(talkerindex, "宽输入框", 60, seqno, char.getWorkInt( meindex, "对象"), token)
					end
				else
					token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n\n    很遗憾，目前场内还没有人在对决哦～\n\n    请确定比赛已经开始了再点我吧～"
					lssproto.windows(talkerindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		end
	end
end

function FMZhengBa()
    local point = 1
	token = "SELECT `fmindex`,`fmname`,`flg` FROM `FMZhengBa`"
	ret = sasql.query(token)
	local point = 0
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()		
		if num > 0 then
			sasql.fetch_row(0)
			return tonumber(sasql.data(1)),sasql.data(2),tonumber(sasql.data(3))
		end
	end
	return -1,-1,0
end

function upfmjl()
    local point = 0
	token = "UPDATE `FMZhengBa` SET `flg` = " .. point .. ""		
			ret = sasql.query(token)
end

function Delfmjl()
	local sql = "truncate table `FMZhengBa`"
	sasql.query(sql)
end

function FreePartyJoin( meindex, toindex )
			if char.getInt(meindex, "地图号") == 140 then
				if char.getInt( meindex, "家族索引") ~= char.getInt( toindex, "家族索引") then
			char.TalkToCli(meindex, -1, "不同家族无法进行组队！", "黄色")
			return 0
		end
			end
	return 1
end

function Create()
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc("家族争霸管理员", 26786, 2005, 6, 10, 4)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
    npc.CreateNpc("", 109053, 2005, 6, 10, 4)	
end

function data()
	NetLoopFunction()
	fmzhengbamap = 158--特权地图
	fmzhengvippoint = 10000 --奖励会员点
	fmzhengbaitem = 28469 --奖励道具
end

function fmzhengba(charaindex, data)
	pktime = other.atoi(data)
	char.talkToServer(-1, "[家族乱舞争霸]距离家族乱舞争霸战开始时间还剩" .. pktime .. "分钟，请各位家族成员到" .. map.getFloorName(2005) .. "(9,8)入场准备，争夺霸主资格！", "红色")
end

function main()
	Create()
	pktime = -1
	data()
	
	magic.addLUAListFunction("fmzhengba", "fmzhengba", "", 3, "[gm fmzhengba 分钟]")
end
