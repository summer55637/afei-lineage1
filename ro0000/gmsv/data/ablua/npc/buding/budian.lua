function ShowHead(meindex, talkerindex)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
			token = "2  努力皆可成为极品人 \n\n" 
					.. "≡ 使用能量晶石补点 ≡\n" 
					.. "≡ 使用族战战点补点 ≡\n" 
					.. "≡ 使用充值积分补点 ≡\n" 
					.. "≡ 补点大师功能说明 ≡" 
		lssproto.windows(talkerindex, "选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
	end
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


function ShowWindow(meindex, talkerindex, page, maxpage, seqno, token, mytype)
		TM_NowPage = page
		
		if maxpage == 99 then
			button = 8
		elseif maxpage == 1 then
			button = 12
		elseif page == 1 and page < maxpage then
			button = 40
		elseif page > 1 and page < maxpage then
			button = 56
		elseif page == maxpage then
			button = 24
		end
		
		if mytype == 1 then
			lssproto.windows(talkerindex, "选择框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 2 then
			lssproto.windows(talkerindex, "对话框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 3 then
			lssproto.windows(talkerindex, "输入框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		end
end



--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if char.getInt(talkerindex,"安全锁") > 0 then
			if char.getInt(talkerindex,"安全锁") == 1 then
				token = "解锁快捷解锁命令：/safe 安全密码"
			elseif char.getInt(talkerindex,"安全锁") == 2 then
				token = "由于您在非常用设备登录。|请输入您的安全码验证身份。"
			else
				token = "由于您密码过于简单存在安全隐患。|请输入您的安全码验证身份。"
			end
			char.Alert(talkerindex,token,4,300);
			lssproto.windows(talkerindex, "安全码", "确定|取消", "安全锁", -1, "2")
			return
		end
		ShowHead(meindex, talkerindex)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--char.TalkToCli(talkerindex, meindex, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	
	if select == 0 and other.atoi(data) == 0 then
		ShowHead(meindex, talkerindex)
	end
	
	if seqno == 1 then
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		
		char.setWorkInt(talkerindex,"NPC临时1",num)
		if num == 4 then
			token = "            [style c=23 s=16]   「 能力修补介绍 」[/style]\n\n" 
								.. "       [style c=16]专为5转140级并完成红暴后的圆满人物准备[/style]\n  [style c=4]最高可将点数补齐至625点，弥补练人物时失误的遗憾[/style]\n           [style c=18]能量晶石补点：1个能量结晶/点(金币购买)[/style]\n           [style c=19]族战战点补点：48点族战战点/点[/style]\n           [style c=24]充值积分补点：100点充值积分/点[/style]\n           [style c=26]每次进行能力修补需要消耗10活力[/style]\n"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		elseif num == 1 then
			token = "            [style c=4 s=16]   「 能量结晶补点 」[/style]\n\n" 
								.. "    1、完成红暴任务并且已使用英雄的祝福。\n    2、人物总属性未达到625点的非极品人。\n    3、消耗1枚能量结晶和10活力可补1点。\n    4、满足条件需要进行能力修补请点确认按钮。\n    5、能力修补为不可逆操作，一旦完成无法反悔哦！"
			ShowWindow(meindex, talkerindex, 1, 1, 3, token, 2)
		elseif num == 2 then
			token = "            [style c=24 s=16]   「 族战战点补点 」[/style]\n\n" 
								.. "    1、完成红暴任务并且已使用英雄的祝福。\n    2、人物总属性未达到625点的非极品人。\n    3、消耗48族战战点和10活力可补1点。\n    4、满足条件需要进行能力修补请点确认按钮。\n    5、能力修补为不可逆操作，一旦完成无法反悔哦！"
			ShowWindow(meindex, talkerindex, 1, 1, 4, token, 2)
		else 
			token = "            [style c=18 s=16]   「 充值积分补点 」[/style]\n\n" 
								.. "    1、完成红暴任务并且已使用英雄的祝福。\n    2、人物总属性未达到625点的非极品人。\n    3、消耗100附赠积分和10活力可补1点。\n    4、满足条件需要进行能力修补请点确认按钮。\n    5、能力修补为不可逆操作，一旦完成无法反悔哦！"
			ShowWindow(meindex, talkerindex, 1, 1, 5, token, 2)
		end
		
	elseif seqno == 3 then
		if select == 8 then
			return
		end
			local TM_MyHL = char.getInt(talkerindex, "活力")

			if TM_MyHL < delHL then
				char.TalkToCli(talkerindex, -1, "活力不足，请在线累计（能力修补需要消耗".. delHL .."活力）", 27)
				return
			end			
			
			if char.getInt(talkerindex,"转数") ~= 5 or char.getInt(talkerindex,"等级") ~= 140 then
				char.TalkToCli(talkerindex, -1, "能力修补需要5转140的人物才可以使用！", "随机色")
				return
			end
			if npc.Free(meindex, talkerindex, "ENDEV=60") ~= 1 then
				char.TalkToCli(talkerindex, -1, "您尚未完成红暴任务，无法进行能力修补！", "随机色")
				return
			end
			for i=9,23 do
				local itemindex = char.getItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useSkup" then
						char.TalkToCli(talkerindex, -1, "您尚未使用吸收完英雄的祝福的力量，无法进行能力修补！", "随机色")
						return
					end
				end
			end
			for i=0,29 do
				local itemindex = char.getPoolItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useSkup" then
						char.TalkToCli(talkerindex, -1, "您尚未使用吸收完英雄的祝福的力量，无法进行能力修补！", "随机色")
						return
					end
				end
			end
			if math.floor(char.getInt(talkerindex,"体力") / 100) + math.floor(char.getInt(talkerindex,"腕力") / 100) + math.floor(char.getInt(talkerindex,"耐力") / 100) + math.floor(char.getInt(talkerindex,"速度") / 100) + char.getInt(talkerindex,"技能点") >= 625 then
				char.TalkToCli(talkerindex, -1, "您的能力已经超过625点，无法进行能力修补！", "随机色")
				return
			end
			
			----开始判断消耗品----
			local itemzhao = 0
			local itemindex = -1
			for i=9,23 do
				itemindex = char.getItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getInt(itemindex,"序号") == 25100 then
						itemzhao = itemzhao + 1
						if itemzhao >= delnum then
							break
						end
					end
				end
			end
			if itemzhao < delnum then
				char.TalkToCli(talkerindex, -1, "您身上并没有带够1个能量结晶，无法进行能力修补。", "黄色")
				return
			end
			
			----开始判断消耗品----
			itemzhao = 0
				for i=9,23 do
					itemindex = char.getItemIndex(talkerindex,i)
					if item.check(itemindex) == 1 then
						if item.getInt(itemindex,"序号") == 25100 then
							itemzhao = itemzhao + 1
							char.DelItem(talkerindex,i)
							if itemzhao >= delnum then
								break
							end
						end
					end
				end
			char.TalkToCli(talkerindex, -1, "[能力修补]收走能量结晶 * ".. delnum .."。", 24)

			----结束清理消耗品----
			char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - delHL)
			char.TalkToCli(talkerindex, -1, "[能力修补]消耗了您".. delHL .."点活力。", 24)
			char.setInt(talkerindex,"技能点",char.getInt(talkerindex,"技能点") + 1)
			char.TalkToCli(talkerindex, -1, "[能力修补]修为正逐步转化为您的力量，消耗1枚能量结晶，增加1点自由分配点数。", 24)
			--char.talkToAllServer("P|P|[能力修补]恭喜 " .. char.getChar(talkerindex, "名字") .. " 通过自身努力增加1点能力值，账号练废不用怕，能力修补来帮你，了解一下。")
			char.complianceParameter(talkerindex)
			char.Skillupsend(talkerindex)
			char.sendStatusString(talkerindex,"P")	
	elseif seqno == 4 then
		if select == 8 or select ~= 4 then
			return
		end
			local TM_MyHL = char.getInt(talkerindex, "活力")

			if TM_MyHL < delHL then
				char.TalkToCli(talkerindex, -1, "活力不足，请在线累计（能力修补需要消耗".. delHL .."活力）", 27)
				return
			end			
			
			if char.getInt(talkerindex,"转数") ~= 5 or char.getInt(talkerindex,"等级") ~= 140 then
				char.TalkToCli(talkerindex, -1, "能力修补需要5转140的人物才可以使用！", "随机色")
				return
			end
			if npc.Free(meindex, talkerindex, "ENDEV=60") ~= 1 then
				char.TalkToCli(talkerindex, -1, "您尚未完成红暴任务，无法进行能力修补！", "随机色")
				return
			end
			for i=9,23 do
				local itemindex = char.getItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useSkup" then
						char.TalkToCli(talkerindex, -1, "您尚未使用吸收完英雄的祝福的力量，无法进行能力修补！", "随机色")
						return
					end
				end
			end
			for i=0,29 do
				local itemindex = char.getPoolItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useSkup" then
						char.TalkToCli(talkerindex, -1, "您尚未使用吸收完英雄的祝福的力量，无法进行能力修补！", "随机色")
						return
					end
				end
			end
			if math.floor(char.getInt(talkerindex,"体力") / 100) + math.floor(char.getInt(talkerindex,"腕力") / 100) + math.floor(char.getInt(talkerindex,"耐力") / 100) + math.floor(char.getInt(talkerindex,"速度") / 100) + char.getInt(talkerindex,"技能点") >= 625 then
				char.TalkToCli(talkerindex, -1, "您的能力已经超过625点，无法进行能力修补！", "随机色")
				return
			end
			
			----开始判断消耗品----
			if char.getInt(talkerindex,"族战积分") < 48 then
				char.TalkToCli(talkerindex, -1, "战点不足，请多参加族战吧！（使用战点修补能力需要48/点）", "随机色")
				return
			end
			
			----开始判断消耗品----
			char.setInt(talkerindex,"族战积分",char.getInt(talkerindex,"族战积分") - 48)

			char.TalkToCli(talkerindex, -1, "[能力修补]消耗了您48个战点。", 24)

			----结束清理消耗品----
			char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - delHL)
			char.TalkToCli(talkerindex, -1, "[能力修补]消耗了您".. delHL .."点活力。", 24)
			char.setInt(talkerindex,"技能点",char.getInt(talkerindex,"技能点") + 1)
			char.TalkToCli(talkerindex, -1, "[能力修补]修为正逐步转化为您的力量，消耗1枚能量结晶，增加1点自由分配点数。", 24)
			--char.talkToAllServer("P|P|[能力修补]恭喜 " .. char.getChar(talkerindex, "名字") .. " 通过自身努力增加1点能力值，账号练废不用怕，能力修补来帮你，了解一下。")
			char.complianceParameter(talkerindex)
			char.Skillupsend(talkerindex)
			char.sendStatusString(talkerindex,"P")
	elseif seqno == 5 then	-- 兑换萝卜
		if select == 8 then
			return
		end
			local TM_MyHL = char.getInt(talkerindex, "活力")

			if TM_MyHL < delHL then
				char.TalkToCli(talkerindex, -1, "活力不足，请在线累计（能力修补需要消耗".. delHL .."活力）", 27)
				return
			end			
			
			if char.getInt(talkerindex,"转数") ~= 5 or char.getInt(talkerindex,"等级") ~= 140 then
				char.TalkToCli(talkerindex, -1, "能力修补需要5转140的人物才可以使用！", "随机色")
				return
			end
			if npc.Free(meindex, talkerindex, "ENDEV=60") ~= 1 then
				char.TalkToCli(talkerindex, -1, "您尚未完成红暴任务，无法进行能力修补！", "随机色")
				return
			end
			for i=9,23 do
				local itemindex = char.getItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useSkup" then
						char.TalkToCli(talkerindex, -1, "您尚未使用吸收完英雄的祝福的力量，无法进行能力修补！", "随机色")
						return
					end
				end
			end
			for i=0,29 do
				local itemindex = char.getPoolItemIndex(talkerindex,i)
				if item.check(itemindex) == 1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_useSkup" then
						char.TalkToCli(talkerindex, -1, "您尚未使用吸收完英雄的祝福的力量，无法进行能力修补！", "随机色")
						return
					end
				end
			end
			if math.floor(char.getInt(talkerindex,"体力") / 100) + math.floor(char.getInt(talkerindex,"腕力") / 100) + math.floor(char.getInt(talkerindex,"耐力") / 100) + math.floor(char.getInt(talkerindex,"速度") / 100) + char.getInt(talkerindex,"技能点") >= 625 then
				char.TalkToCli(talkerindex, -1, "您的能力已经超过625点，无法进行能力修补！", "随机色")
				return
			end
			
			----开始判断消耗品----
			if sasql.getPayPoint(talkerindex) < 100 then
				char.TalkToCli(talkerindex, -1, "积分不足！（使用积分修补能力需要100/点）", "随机色")
				return
			end
			
			----开始判断消耗品----
				sasql.setPayPoint(talkerindex, sasql.getPayPoint(talkerindex) - 100)

			char.TalkToCli(talkerindex, -1, "[能力修补]消耗了您100点积分。", 24)

			----结束清理消耗品----
			char.setInt(talkerindex, "活力", char.getInt(talkerindex, "活力") - delHL)
			char.TalkToCli(talkerindex, -1, "[能力修补]消耗了您".. delHL .."点活力。", 24)
			char.setInt(talkerindex,"技能点",char.getInt(talkerindex,"技能点") + 1)
			char.TalkToCli(talkerindex, -1, "[能力修补]修为正逐步转化为您的力量，消耗1枚能量结晶，增加1点自由分配点数。", 24)
			--char.talkToAllServer("P|P|[能力修补]恭喜 " .. char.getChar(talkerindex, "名字") .. " 通过自身努力增加1点能力值，账号练废不用怕，能力修补来帮你，了解一下。")
			char.complianceParameter(talkerindex)
			char.Skillupsend(talkerindex)
			char.sendStatusString(talkerindex,"P")
 	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	--	npc.CreateNpc("", 120015, floor, x, y, dir)

end

function data()
	delHL = 50			-- 需要消耗的活力
	delnum = 1 			-- 需要消耗几个能量结晶
end


function PetUp_4v(petindex)
	local Resault = char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷")
	return math.floor(Resault)
end

function main()
	Create("极品人补点", 24794, 2005, 28, 20, 6)
	--Create("极品人补点", 16300, 2001, 17, 16, 4)
	data()
end