--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "3            『" .. char.getChar(meindex, "名字") .. "』"
					.."\n请问有什么我可以为您服务呢?\n"
					.."\n          〖单个印记兑换〗"
					.."\n          〖13个印记兑换〗"
					.."\n          〖兑换  2D老虎〗"
					.."\n          〖  活动说明  〗"
		lssproto.windows(talkerindex, "选择框", "取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 1 then
			num = other.atoi(data)
			if num == 1 then
				if npc.Free(meindex, talkerindex, "ITEM=22356*1") == 1 then
					npc.DelItem(talkerindex, "22356*1")
				else
					char.TalkToCli(talkerindex, meindex, "你身上并没有活动印记", "黄色")
					return
				end
				if math.random(100) <= 15 then
					itemid = math.random(22357, 22361)
					npc.AddItem(talkerindex, itemid)
					if config.getGameservername() == "一起玩石器测试线" then
						char.talkToServer(-1,"恭喜玩家<" .. char.getChar(talkerindex, "名字") .. ">参加单个活动印记抽奖获得" .. item.getNameFromNumber(itemid), "青色")
					else
						char.talkToAllServer("恭喜玩家<" .. char.getChar(talkerindex, "名字") .. ">参加单个活动印记抽奖获得" .. item.getNameFromNumber(itemid),"")
					end
				else
					hl = math.random(1, 10)
					char.setInt(talkerindex, "声望", char.getInt(talkerindex, "声望") + hl*100)
					char.talkToServer(-1, "恭喜玩家<" .. char.getChar(talkerindex, "名字") .. ">参加单个活动印记抽奖获得声望" .. hl .. "点", "青色")
				end
			elseif num == 2 then
				if npc.Free(meindex, talkerindex, "ITEM=22356*13") == 1 then
					npc.DelItem(talkerindex, "22356*13")
					itemid = math.random(22357, 22361)
					npc.AddItem(talkerindex, itemid)
					if config.getGameservername() == "一起玩石器测试线" then
						char.talkToServer(-1,"恭喜玩家<" .. char.getChar(talkerindex, "名字") .. ">参加13个活动印记换兑获得" .. item.getNameFromNumber(itemid), "红色")
					else
						char.talkToAllServer("恭喜玩家<" .. char.getChar(talkerindex, "名字") .. ">参加13个活动印记换兑获得" .. item.getNameFromNumber(itemid),"")
					end
				else
					char.TalkToCli(talkerindex, meindex, "你的活动印记不足13个哦", "黄色")
				end
			elseif num == 3 then
				token = "                 『" .. char.getChar(meindex, "名字") .. "』"
							.."\n你需要换奖励吗?条件如下:"
							.."\n "
							.."\n2D虎印记1  2D虎印记2"
							.."\n2D虎印记3  2D虎印记4 "
							.."\n2D虎印记5  声望50000"
							.."\n "
							.."\n收集好以上东西后再来找我兑换吧！"

				lssproto.windows(talkerindex, "对话框", "确定|取消", 2, char.getWorkInt( meindex, "对象"), token)
			elseif num == 4 then
				token = "                 『" .. char.getChar(meindex, "名字") .. "』"
							.."\n1、活动结束时间2017-09-17 23:59:59"
							.."\n2、在加村门口各处寻找四色活动怪"
							.."\n3、记得要带上《豆沙枣泥月饼》"
							.."\n4、料理方法为豆子3+水3+碳3+油3+砂糖3"
							.."\n5、活动怪会四处跑，战斗后有几率获得印记"
							.."\n6、单个活动印记有机率得2D虎印记或声望"
							.."\n7、13个活动印记换兑100%获得2D虎印记"

				lssproto.windows(talkerindex, "对话框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
			end
		elseif seqno == 2 then
			if select == 2 then
				return
			end
			if npc.Free(meindex, talkerindex, "ITEM=22357&ITEM=22358&ITEM=22359&ITEM=22360&ITEM=22361") == 1 then
				if char.getInt(talkerindex, "声望") < 5000000 then
					char.TalkToCli(talkerindex, meindex, "您的声望不足，请准备好再来！", "黄色")
					return
				end
				npc.DelItem(talkerindex, "22357*1")
				npc.DelItem(talkerindex, "22358*1")
				npc.DelItem(talkerindex, "22359*1")
				npc.DelItem(talkerindex, "22360*1")
				npc.DelItem(talkerindex, "22361*1")
				char.setInt(talkerindex, "声望", char.getInt(talkerindex, "声望") - 5000000)
				char.TalkToCli(talkerindex, -1, "扣除50000声望，兑换成功。", "黄色")
				npc.AddItem(talkerindex,22071)
			else
				char.TalkToCli(talkerindex, meindex, "您所携带的道具不足，请准备好再来，谢谢!", "黄色")
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

function CreateBoss(name, metamo)
	fx = math.random(500,563)
	fy = math.random(380,390)

	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, 200, fx, fy, math.random(0,7))
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "循环事件", "LoopBoss", "")
	char.setFunctionPointer(npcindex, "对话事件", "TalkedBoss", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalkedBoss", "")
	char.setFunctionPointer(npcindex, "战后事件", "BattleOver", "")
	char.setFunctionPointer(npcindex, "战斗设置事件", "SetBattleEnmey", "")
	--char.setInt(npcindex, "等级", 140)
	char.setWorkInt(npcindex, "NPC临时2", 3)
	char.setInt(npcindex, "循环事件时间", 2000)
end


function SetBattleEnmey(meindex, enemyindex, id)
	char.setChar(enemyindex, "名字", char.getChar(meindex, "名字"))
	--metamo = math.random(105080,105083)
	--char.setInt(enemyindex, "图像号", metamo)
	--char.setInt(enemyindex, "原图像号", metamo)
end

function question(meindex, talkerindex, seqno, token)
	char.setWorkInt(talkerindex, "计时器", math.random(9999))
	token = token .. "\n验证码为" .. 	char.getWorkInt(talkerindex, "计时器")
	lssproto.windows(talkerindex, "输入框", "确定|取消", seqno, char.getWorkInt(meindex, "对象"), token)
end

function LoopBoss(meindex)
	char.setInt(meindex, "等级", 0)
	if start == 0 then
		npc.DelNpc(meindex)
		return
	end


	local Hour = tonumber(os.date("%H", os.time()))
	if Hour<10 then		--夜里不刷新
		if char.getWorkInt(meindex, "战斗") ~= 0 then
			return
		end
		if char.getInt( meindex, "地图号") ~= 777 then
			char.WarpToSpecificPoint(meindex, 777, math.random(30,40), math.random(10,20))
			return
		end
	else
		char.RandRandWalk(meindex)
		if char.getInt( meindex, "地图号") == 777 then
			if char.getWorkInt( meindex, "NPC临时2") < other.time() then
				fx = math.random(500,563)
				fy = math.random(380,390)
				char.WarpToSpecificPoint(meindex, 200, fx, fy)
				if config.getGameservername() == "一起玩石器测试线" then
					char.talkToServer( -1,"活动怪<" .. char.getChar(meindex, "名字") .. ">又在" .. config.getGameservername() .. "加加村周围出现了！","随机色")
				else
					char.talkToAllServer( "活动怪<" .. char.getChar(meindex, "名字") .. ">又在" .. config.getGameservername() .. "加加村周围出现了！","")
				end
			end
		end
	end
end

function WindowTalkedBoss( meindex, talkerindex, seqno, select, data)
	if select == 1 then
		local pass = other.atoi(data)
		if pass == char.getWorkInt(talkerindex, "计时器") then
			if char.getWorkInt(talkerindex, "组队") ~= 0 then
				char.TalkToCli(talkerindex, -1, "很抱歉,组队无法加入战斗！", "红色")
				return
			end
			if char.getWorkInt(meindex, "战斗索引") > -1 then
				if char.getWorkInt(talkerindex, "战斗") ~= 0 then
					return
				end
				--if npc.Free(meindex, talkerindex, "ITEM=12927") ~= 1 then
				--	char.TalkToCli(talkerindex, meindex, "咻～咻～咻～没【豆沙枣泥月饼】也想来引诱我~~滚蛋！", "黄色")
				--	return
				--end
				if battle.NewEntry(talkerindex, battleindex, 0) == 1 then
					--npc.DelItem(talkerindex, "12927*1")
					char.talkToFloor(200, -1, "勇者『" .. char.getChar(talkerindex, "名字") .. "』加入求助队伍中！", "黄色")
				else
					char.TalkToCli(talkerindex, -1, "很抱歉,目前已无法加入战斗！", "红色")
				end
			else
				char.TalkToCli(talkerindex, -1, "十分感谢你的热情帮忙,怪物已被勇者消灭了！", "红色")
			end
		else
			char.TalkToCli(talkerindex, meindex, "你输入的验证码有误,无法给你挑战?", "红色")
		end
	end
	char.setWorkInt(talkerindex, "计时器", math.random(9999))
end

--NPC对话事件(NPC索引)
function TalkedBoss(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if other.time() > char.getWorkInt(talkerindex,"NPC临时4") then
			char.setWorkInt(talkerindex,"NPC临时4",other.time()+3);
			if char.getWorkInt(meindex, "战斗") ~= 0 then
				char.TalkToCli(talkerindex, meindex, "我在忙，别烦我呢，等下再收拾你！", "黄色")
				return
			end
			if npc.Free(meindex, talkerindex, "ITEM=13110") == 1 then
				if math.random(9) == 1 then
					if char.getWorkInt(talkerindex, "组队") ~= 0 then
						char.TalkToCli(talkerindex, -1, "你好烦，我本来决定干你了，但是你是组团来欺负我的，鸟都不鸟你！", "红色")
						return
					end
					char.TalkToCli(talkerindex, meindex, "你好烦，我决定干你了！", "黄色")
					char.DischargeParty(talkerindex, 1)
					char.setWorkChar( meindex, "NPC临时1", char.getChar( talkerindex, "账号"))
					local enemytable = {4016, 4017, 4018, 4019, -1, -1, -1, -1, -1, -1}
		--			for i = 1, 5 do
		--				enemytable[i] = math.random(2860, 2864)
		--			end
		
					battleindex = battle.CreateVsEnemy(talkerindex, meindex, enemytable)
					for i = 0, char.getPlayerMaxNum()-1 do
						if char.check(i) == 1 then
							if char.getWorkInt(i, "离线") ==  0 then
								if char.getWorkInt(i, "战斗") == 0 then
									if char.getInt(i, "地图号") == 200 then
										token = "    [" .. char.getChar(talkerindex, "名字") .. "]成功拦截住活动怪，现已向各位求助，请输入验证码加入战斗\n\n"
										question(meindex, i, -2, token)
									end
								end
							end
						end
					end
					local TempIndex = -1
					local TypeOne = -1
					local TypeTwo = -1
					local Type = {-1,-1,-1,-1}
					for i=0,9 do
						TempIndex = battle.getCharOne(battleindex, i, 1)
						if char.check(TempIndex) == 1 then
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
								Type[TypeOne] = math.random(1,2) * 10
								Type[TypeTwo] = 100 - Type[TypeOne]
							end
							char.setInt(TempIndex,"地",Type[1])
							char.setInt(TempIndex,"水",Type[2])
							char.setInt(TempIndex,"火",Type[3])
							char.setInt(TempIndex,"风",Type[4])
						end
					end
					return
				else
					char.TalkToCli(talkerindex, meindex, "真好吃,吃完我撒腿就跑!哈哈哈~~有本事继续抓我啊~~", "黄色")
				end
				npc.DelItem(talkerindex, "13110*1")
			else
				char.TalkToCli(talkerindex, meindex, "咻～咻～咻～没【豆沙枣泥月饼】也想来引诱我~~滚蛋！", "黄色")
			end
			fx = math.random(500,563)
			fy = math.random(380,390)
			char.WarpToSpecificPoint(meindex, 200, fx, fy);
		end
	end
end

--NPC战斗结束事件(NPC索引， 战斗索引，赢败)
function BattleOver(meindex, battleindex, iswin)
	--当NPC输了
	if iswin == 1 then
		for i=0, 4 do
			local charaindex = battle.getCharOne(battleindex, i, 0)
			local ipnum = 0
			if char.check(charaindex) == 1 then
				for j=i + 1, 4 do
					local pindex = battle.getCharOne(battleindex, j, 0)
					if char.check(pindex) == 1 then
						if char.getWorkChar(charaindex,"MAC") == char.getWorkChar(pindex,"MAC")  then
							ipnum = ipnum + 1
						end
					end
				end
				itemid = -1
				if ipnum == 0 then
					if char.getWorkChar( meindex, "NPC临时1") == char.getChar( charaindex, "账号") or math.random(10) == 5 then
						npc.AddItem(charaindex, 22356)
						char.talkToFloor(200, -1, "勇者<" .. char.getChar(charaindex, "名字") .. ">消灭了活动怪获得" .. item.getNameFromNumber(22356), "青色")
					end
				end
				char.setWorkInt(charaindex,"获得经验",0)
				for j=0,4 do 
					local petindex  = char.getCharPet(charaindex, j);
					if char.check(petindex) == 1 then
						char.setWorkInt(petindex,"获得经验",0)
					end
				end
			end
		end
	end
	char.setWorkInt( meindex, "NPC临时2", other.time() + 1000)
	char.WarpToSpecificPoint(meindex, 777, math.random(30,40), math.random(10,20))
end

function duanwu(charaindex, data)
	print("成功读取新的LUA");
	local count = other.atoi(data)
	if count >0 then
		start = 1
		for i=1,count do
			CreateBoss("活动怪", 105080)
			CreateBoss("活动怪", 105081)
			CreateBoss("活动怪", 105082)
			CreateBoss("活动怪", 105083)
		end
		char.TalkToCli(charaindex, -1, "成功创建"..count.."组活动怪！", "青色")
	else
		start = 0
		char.TalkToCli(charaindex, -1, "关闭活动怪活动！", "青色")
	end
end

function data()

end

function main()
	start = 0
	data()
	if config.getGameservername() == "娱乐互动线" then
	--	Create("活动指引使者", 60116, 200, 568, 374, 6)
	end
	magic.addLUAListFunction("duanwu", "duanwu", "", 1, "[gm duanwu 创建组数]")

end
