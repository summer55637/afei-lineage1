function ShowItem(meindex, charaindex, page)
	local itemnum = 9+(page-1)*5
	local button = {40,56,24}
	local token = "2\n             『" .. char.getChar(meindex, "名字") .. "』\n      请选择需要升级的道具"
	for i=itemnum,itemnum+4 do
		local itemindex = char.getItemIndex(charaindex, i)
		if itemindex == -1 then
			token = token .. "\n      道具栏" .. i-8 .. "：空"
		else
			token = token .. "\n      道具栏" .. i-8 .. "：" .. item.getChar(itemindex, "名称")
		end
	end
	lssproto.windows(charaindex, 2, button[page], page+2, char.getWorkInt( meindex, "对象"), token)
end

function ShowDlg(meindex, charaindex, page)
	local button = 40
	if page == #text then
		button = 24
	elseif page > 1 and page < #text then
		button = 56
	end
	local token = text[page]
	lssproto.windows(charaindex, 0, button, page+12, char.getWorkInt(meindex, "对象"), token)
end

function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		local token = char.getChar(meindex,"名字") .. "|你可以在这使用宝石合成\n装备升级服务|3|宝石合成|升级或重置|功能说明" 
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalked(meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 and select ~= 8 then
		if seqno == 0 then
			if data*1 == 1 then
				local token = char.getChar(meindex,"名字") .. "|选择你要的合成的宝石|"..#gem
				for i=1,#gem do
					token = token.."|"..item.getNameFromNumber(gem[i][1])
				end
				lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
			elseif data*1 == 2 then
				ShowItem(meindex, talkerindex, 1)
			elseif data*1 == 3 then
				ShowDlg(meindex, talkerindex, 1)
			end
		elseif seqno == 1 then
			local token = "\n                [style c=4]≡ 合 成 须 知 ≡[/style]\n\n"
			.. "           合成 [[style c=2]" .. item.getNameFromNumber(gem[data*1][1]) .. "[/style]] 条件\n"
			.. "           消耗道具：[style c=1]" .. item.getNameFromNumber(gem[data*1][2]) .. "[/style][style c=4] * [/style][style c=5]" .. gem[data*1][3] .. "[/style]\n"
			.. "           消耗活力：[style c=10]"  .. gem[data*1][4] .. "[/style]\n"
			.. "           [style c=6]您确定要合成吗？[/style]"
			lssproto.windows(talkerindex, 0, 12, 2, char.getWorkInt( meindex, "对象"), token)
			char.setWorkInt(talkerindex, "NPC临时1", data)
		elseif seqno == 2 then
			local num = char.getWorkInt(talkerindex, "NPC临时1")
			if npc.Free(meindex,talkerindex,"ITEM="..gem[num][2].."*"..gem[num][3]) == 1 then
				if char.getInt(talkerindex,"活力") >= gem[num][4] then
					npc.DelItem(talkerindex,gem[num][2].."*"..gem[num][3])
					char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - gem[num][4])
					char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + gem[num][4]*100)
					saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
					npc.AddItem(talkerindex, gem[num][1])
				else
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=4]您的活力不足[/style]");
				end
			else
				lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=4]合成条件不足[/style]");
			end
		elseif seqno > 2 and seqno < 6 then
			if select == 32 then
				ShowItem(meindex, talkerindex, seqno-1)
			elseif select == 16 then
				ShowItem(meindex, talkerindex, seqno-3)
			else
				char.setWorkInt(talkerindex, "NPC临时1", data+8+(seqno-3)*5)
				local itemindex = char.getItemIndex(talkerindex, char.getWorkInt(talkerindex, "NPC临时1"))
				if item.getInt(itemindex,"序号") > 14000 and item.getInt(itemindex,"序号") < 18001 then
					local itemlv = other.atoi(other.getString(item.getChar(itemindex, "名称"), " ", 2))
					if itemlv > 10 and itemlv < 21 then
						local token = char.getChar(meindex,"名字") .. "|         需要对\n〖"..item.getChar(itemindex, "名称").."〗进行|3|普通升级|免降级升级|属性重置"
						lssproto.windows(talkerindex, "新选择框", 8, 6, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n               [style c=4]你选择的装备无法升级[/style]");
					end
				else
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n              [style c=4]你选择的物品无法升级[/style]");
				end
			end
		elseif seqno == 6 then
			local itemindex = char.getItemIndex(talkerindex, char.getWorkInt(talkerindex, "NPC临时1"))
			local itemlv = other.atoi(other.getString(item.getChar(itemindex, "名称"), " ", 2))
			local token = "                [style c=4]≡ 升 级 条 件 ≡[/style]\n\n           升级 [style c=2]" .. item.getChar(itemindex, "名称") .. "[/style] 条件\n"
			if data*1 == 1 then
				if itemlv < 14 then
					token = token.. "           消耗道具：[style c=1]祝福宝石[/style]\n"
					.. "           升级几率：[style c=5]100%[/style]\n"
					.. "           [style c=6]您确定要升级吗？[/style]"
					lssproto.windows(talkerindex, 0, 12, 7, char.getWorkInt( meindex, "对象"), token)
				elseif itemlv < 18 then
					token = token.. "           消耗道具：[style c=1]灵魂宝石[/style]\n"
					.. "           升级几率：[style c=5]60%[/style]\n"
					.. "           升级失败：[style c=10]随机降1-3级[/style]\n"
					.. "           [style c=6]您确定要升级吗？[/style]"
					lssproto.windows(talkerindex, 0, 12, 8, char.getWorkInt( meindex, "对象"), token)
				elseif itemlv < 20 then
					token = token.. "           消耗道具：[style c=1]天佑宝石[/style]\n"
					.. "           升级几率：[style c=5]40%[/style]\n"
					.. "           升级失败：[style c=10]随机降1-3级[/style]\n"
					.. "           [style c=6]您确定要升级吗？[/style]"
					lssproto.windows(talkerindex, 0, 12, 9, char.getWorkInt( meindex, "对象"), token)
				else
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n               [style c=4]您的装备无需升级[/style]");
				end
			elseif data*1 == 2 then
				if itemlv > 13 and itemlv < 18 then
					token = token.. "           消耗道具：[style c=1]灵魂宝石[/style]\n"
					.. "           消耗金币：[style c=4]500[/style]\n"
					.. "           升级几率：[style c=5]60%[/style]\n"
					.. "           升级失败：[style c=2]免降级[/style]\n"
					.. "           [style c=6]您确定要升级吗？[/style]"
					lssproto.windows(talkerindex, 0, 12, 10, char.getWorkInt( meindex, "对象"), token)
				elseif itemlv > 16 and itemlv < 20 then
					token = token.. "           消耗道具：[style c=1]天佑宝石[/style]\n"
					.. "           消耗金币：[style c=4]800[/style]\n"
					.. "           升级几率：[style c=5]40%[/style]\n"
					.. "           升级失败：[style c=2]免降级[/style]\n"
					.. "           [style c=6]您确定要升级吗？[/style]"
					lssproto.windows(talkerindex, 0, 12, 11, char.getWorkInt( meindex, "对象"), token)
				else
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n           [style c=4]只有14-19级装备才能使用[/style]");
				end
			elseif data*1 == 3 then
				if itemlv > 17 then
					token = "                [style c=4]≡ 重 置 条 件 ≡[/style]\n\n           重置 [style c=2]" .. item.getChar(itemindex, "名称") .. "[/style] 条件\n"
					.. "           消耗道具：[style c=1]净化宝石[/style]\n"
					.. "           重置效果：[style c=5]重新改变武器或装备属性[/style]\n"
					.. "           [style c=6]您确定要重置吗？[/style]"
					lssproto.windows(talkerindex, 0, 12, 12, char.getWorkInt( meindex, "对象"), token)
				else
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n           [style c=4]只有18-20级装备才能使用[/style]");
				end
			end
		elseif seqno > 6 and seqno < 10 then
			local itemindex = char.getItemIndex(talkerindex, char.getWorkInt(talkerindex, "NPC临时1"))
			if char.Finditem(talkerindex, gem[seqno-6][2]) > 0 and itemindex > -1 then
				local itemlv = other.atoi(other.getString(item.getChar(itemindex, "名称"), " ", 2))
				local itemno = item.getInt(itemindex,"序号")
				char.DelItem(talkerindex,char.getWorkInt(talkerindex, "NPC临时1"))
				if itemlv < 14 then
					Upgrade(talkerindex, itemno)
				elseif itemlv < 18 then
					if GetChance(60) then
						Upgrade(talkerindex, itemno)
					else
						char.TalkToCli(talkerindex, -1, "升级失败", 4);
						npc.AddItem(talkerindex, Getitemdata(itemno, math.random(-3,-1)))
					end
				else
					if GetChance(40) then
						Upgrade(talkerindex, itemno)
					else
						char.TalkToCli(talkerindex, -1, "升级失败", 4);
						npc.AddItem(talkerindex, Getitemdata(itemno, math.random(-3,-1)))
					end
				end
				npc.DelItem(talkerindex, gem[seqno-6][2].."*1")
			else
				lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=4]升级条件不足[/style]");
			end
		elseif seqno == 10 or seqno == 11 then
			local itemindex = char.getItemIndex(talkerindex, char.getWorkInt(talkerindex, "NPC临时1"))
			if char.Finditem(talkerindex, gem[seqno-8][2]) > 0 and itemindex > -1 then
				local itemlv = other.atoi(other.getString(item.getChar(itemindex, "名称"), " ", 2))
				local itemno = item.getInt(itemindex,"序号")
				if seqno == 10 and sasql.getVipPoint(talkerindex) > 999 then
					if GetChance(60) then
						char.DelItem(talkerindex,char.getWorkInt(talkerindex, "NPC临时1"))
						Upgrade(talkerindex, itemno)
					else
						char.TalkToCli(talkerindex, -1, "升级失败", 4);
					end
					npc.DelItem(talkerindex, gem[seqno-8][2].."*1")
					sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex)-1000)
				elseif seqno == 11 and sasql.getVipPoint(talkerindex) > 1599 then
					if GetChance(40) then
						char.DelItem(talkerindex,char.getWorkInt(talkerindex, "NPC临时1"))
						Upgrade(talkerindex, itemno)
					else
						char.TalkToCli(talkerindex, -1, "升级失败", 4);
					end
					npc.DelItem(talkerindex, gem[seqno-8][2].."*1")
					sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex)-1600)
				else
					lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=4]您的金币不足[/style]");
				end
			else
				lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=4]升级条件不足[/style]");
			end
		elseif seqno == 12 then
			local itemindex = char.getItemIndex(talkerindex, char.getWorkInt(talkerindex, "NPC临时1"))
			if char.Finditem(talkerindex, gem[3][1]) > 0 and itemindex > -1 then
				local itemno = item.getInt(itemindex,"序号")
				char.DelItem(talkerindex,char.getWorkInt(talkerindex, "NPC临时1"))
				char.TalkToCli(talkerindex, -1, "重置完成", 4);
				npc.AddItem(talkerindex, itemno)
				npc.DelItem(talkerindex, gem[3][1].."*1")
			else
				lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=4]重置条件不足[/style]");
			end
		elseif seqno > 12 then
			if select == 32 then
				ShowDlg(meindex, talkerindex, seqno-11)
			elseif select == 16 then
				ShowDlg(meindex, talkerindex, seqno-13)
			end
		end
	end
end

function Upgrade(charaindex, itemno)
	char.TalkToCli(charaindex, -1, "升级成功", 4);
	npc.AddItem(charaindex, Getitemdata(itemno, 1))
end

function GetChance(num)
	local chance = {}
	for i=1,num do
		local rndnum = math.random(100)
		table.insert(chance,rndnum)
	end
	local fault = math.random(100)
	for i=1,#chance do
		if fault == chance[i] then
			return true
		end
	end
	return false
end
 
function Getitemdata(itemno,rate)
	if itemno < 17001 then
		return itemno+30*rate
	end
	return itemno+50*rate
end

function Create(name, metamo, floor, x, y, dir)
	local npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end
 
function data()
	gem = {{22051,22050,5,200},{22052,22051,5,200},{22053,22052,5,200}}
	text = {
	"　　  　　  [style c=4 s=16]　　　『宝石分级』[/style]\n\n      祝福宝石：可用于提升[11-13]级装备等级\n      灵魂宝石：可用于提升[14-17]级装备等级\n      天佑宝石：可用于提升[18-19]级装备等级\n      净化神石：可用于洗炼[18-20]级装备属性\n     祝福宝石升级100%成功 灵魂和天佑并非100%\n     净化神石只改变装备攻敏防属性 不改变精灵",
	"　　  　　  [style c=4 s=16]　　　『宝石来源』[/style]\n\n      祝福宝石：魔王BOSS，攻城BOSS以及游戏活动 \n      灵魂宝石：祝福宝石*3 [合成] + 其他\n      天佑宝石：灵魂宝石*5 [合成] + 未知\n      净化神石：天使宝石*3[合成] + 未知\n      宝石的来源为魔王、副本、派派送、活动\n      后续还会开放各种获得方式，尽情期待 ^_^",
	"　　  　　  [style c=4 s=16]　　　『成功概率』[/style]\n\n      利用宝石可以将装备的等级提升1级，超过14级 \n     后有成功概率，失败会降低装备等级。\n      灵魂宝石：14级:60% 　15级:60% 　16级:60%\n      　 [成功提升1级 失败降低1-3级]17级:50%\n      天佑宝石：18级-19级:40%\n      　 [成功提升1级 失败降低1-3级]",
	"　　  　　  [style c=4 s=16]　　　『升级保护』[/style]\n\n      在使用中级以及高级强化宝石提升装备等级的\n      时候，有几率会升级失败，升级时如果选择保\n      护模式的话会扣除相应的金币，但是升级失败\n      不会掉级并累计幸运值，每1次失败增加5%成\n      功概率，越高级的装备收取的保护费用也越贵\n      祝大家都能获得自己心仪的装备！",
	"　　  　　  [style c=4 s=16]　　　『极品秘籍』[/style]\n\n\n          [style c=24]多读书,多看报,少吃零食,多睡觉![/style]\n\n\n "
				}
end

function main()
	data()
	Create("合成装备升级", 24794, 2005, 28, 8, 6)
end
