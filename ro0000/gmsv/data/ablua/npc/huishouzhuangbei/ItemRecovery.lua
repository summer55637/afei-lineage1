function ShowHead(meindex, talkerindex)
		token = "1 老铁，是不是要清理下仓库的多余装备？\n" 
						 .. "≡ 回收各种装备 ≡\n" 
						 .. "≡ 功能介绍说明 ≡" 
		lssproto.windows(talkerindex, "选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
end

function ShowWindow(meindex, talkerindex, page, maxpage, seqno, token, mytype)
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
		lssproto.windows(talkerindex, "对话框", button, 1000 + page, char.getWorkInt( meindex, "对象"), token)
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if char.getInt(talkerindex,"安全锁") > 0 then
			if char.getInt(talkerindex,"安全锁") == 1 then
				token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
			elseif char.getInt(talkerindex,"安全锁") == 2 then
				token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
			else
				token = "由于您的密码过于简单，并且异地登录。\n例如：密码非常简单或者全包含于账号。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
			end
			lssproto.windows(talkerindex, "输入框", "确定|取消", "安全锁", -1, token)
			return
		end
		ShowHead(meindex, talkerindex)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
--	char.talkToServer(meindex, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	if seqno == 0 then	--租用装备页面
		num = other.atoi(data)
		if num == 1 then
			local TempItemName = {"","","","",""}
			for i = 9, 11 do
				local TempItemIndex = char.getItemIndex( talkerindex, i);
				local TempItemId = item.getInt(TempItemIndex,"序号")
				if TempItemIndex > 0 then
					if TempItemId < 14001 or TempItemId > 18105 then
						char.TalkToCli(talkerindex, meindex, "道具栏前三格都必须是可以回收的装备的11-20级白字装备哟。", "随机色")
						return
					end
					if item.getInt(TempItemIndex,"物品时间") > 0 then
						char.TalkToCli(talkerindex, meindex, "租用的装备无法回收哦，我只回收阎王出品的11-20级的白字装备哟。", "随机色")
						return
					end
					if item.getInt(TempItemIndex,"合成") ~= 0 then
						char.TalkToCli(talkerindex, meindex, "合成装备无法回收哦，我只回收阎王出品的11-20级的白字装备哟。", "随机色")
						return
					end
					TempItemName[i-8] = item.getChar(TempItemIndex,"名称")
				else
					char.TalkToCli(talkerindex, meindex, "道具栏前三格都必须是可以回收的装备的11-20级白字装备哟。", "随机色")
					return
				end
			end
			token = "[style c=16]     确定要用以下三件装备换一个【祝福宝石】吗？[/style]\n\n" 
			for i=1,3 do
				token = ""..token.."                  [style c=28+i]【" .. TempItemName[i] .. "】[/style]\n"
			end
				token = ""..token.."\n     [style c=33]注意：兑换成功后可不能后悔，请务必仔细检查。[/style]"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
		elseif num == 2 then -- 系统说明
			ShowReadMe(meindex, talkerindex, 0)
		end				
		
	elseif seqno == 1 then
		if select == 2 then
			return
		end
		for i = 9, 11 do
			local TempItemIndex = char.getItemIndex( talkerindex, i);
			local TempItemId = item.getInt(TempItemIndex,"序号")
			if TempItemIndex > 0 then
				if TempItemId < 14001 or TempItemId > 18105 then
					char.TalkToCli(talkerindex, meindex, "道具栏前三格都必须是可以回收的装备的11-20级白字装备哟。", "随机色")
					return
				end
				if item.getInt(TempItemIndex,"物品时间") > 0 then
					char.TalkToCli(talkerindex, meindex, "租用的装备无法回收哦，我只回收阎王出品的11-20级的白字装备哟。", "随机色")
					return
				end
				if item.getInt(TempItemIndex,"合成") ~= 0 then
					char.TalkToCli(talkerindex, meindex, "合成装备无法回收哦，我只回收阎王出品的11-20级的白字装备哟。", "随机色")
					return
				end
			else
				char.TalkToCli(talkerindex, meindex, "道具栏前三格都必须是可以回收的装备的11-20级白字装备哟。", "随机色")
				return
			end
		end
		for i=9,11 do
			char.DelItem(talkerindex,i)
		end
        p = math.random(0, 2)
		if p == 2 then
			char.TalkToCli(talkerindex, meindex, "恭喜您人品爆发在装备回收中获得20钻石", "随机色")
			char.talkToServer(-1, "【大陆新闻】恭喜幸运玩家人品爆发在装备回收中获得20钻石 ", "随机色")
			sasql.setPetPoint(talkerindex,sasql.getPetPoint(talkerindex) + 20)
		end
		char.Additem(talkerindex,22050)
		char.TalkToCli(talkerindex, meindex, "恭喜您回收装备成功,得到一个[祝福宝石]", "随机色")
	elseif seqno >= 1000 and seqno < 2000 then
		num = seqno - 1000
		if select == 16 then
			ShowReadMe(meindex, talkerindex, num - 1)
		elseif select == 32 then
			ShowReadMe(meindex, talkerindex, num + 1)
		end
	end						
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	--npc.CreateNpc("", 125076, floor, x, y, dir)

end

function data()				 
	TM_ReadMe = {
					"　　　　　　   [style c=4 s=16] 『回收功能说明』[/style]\n\n这里可用[style c=1]三个[/style]11-20级的垃圾装备兑换1个\n[style c=1]【祝福宝石】并有几率获得20钻石[/style]\n用于升级装备，回收必须将这三件装备放在道具栏的\n[style c=22]前三格[/style]内，方便我辨认，也避免玩家误操作导致损失。\n\n[style c=16]只回收白字装备，合成的无法回收，加油挑战魔王吧！[/style]"
				};
	maxpage = #TM_ReadMe - 1
end

function main()
	data()
    Create("合成装备回收", 101156, 2005, 16, 23, 6)
end