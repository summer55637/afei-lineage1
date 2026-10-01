function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function petup(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "转数") == 1 and char.getInt(toindex, "等级") >= 140 then
				local data = item.getChar(itemindex, "字段")
				local id = other.atoi(other.getString(data, "|", 1))
				local type = other.atoi(other.getString(data, "|", 2))
				local itembase = other.atoi(other.getString(data, "|", 3))
				local petname = char.getChar(toindex, "名字")
				local upnum = 0;
				local upbuff = char.getChar(toindex,"称号") 
				if itembase<1 or itembase>3 then
					itembase = 3;
				end
				for j = 1, #petuplist[id][1] do 
					if char.getInt(toindex, "宠ID") == petuplist[id][1][j] then
						if char.getRightTo8(char.getInt(toindex, "提升值"), type) == 0 then
							if petuplist[id][2][type][1] == 1 then
								if string.find(item.getChar(itemindex,"名称"),"究极的") == nil then
									upnum = math.random(petuplist[id][2][type][itembase+1][1],petuplist[id][2][type][itembase+1][2])*100
								else
									upnum = petuplist[id][2][type][itembase+1][2]*100
								end
								char.setInt(toindex, "体力", char.getInt(toindex, "体力") + upnum)
							elseif petuplist[id][2][type][1] == 2 then
								if string.find(item.getChar(itemindex,"名称"),"究极的") == nil then
									upnum = math.random(petuplist[id][2][type][itembase+1][1],petuplist[id][2][type][itembase+1][2])*100
								else
									upnum = petuplist[id][2][type][itembase+1][2]*100
								end
								char.setInt(toindex, "腕力", char.getInt(toindex, "腕力") + upnum)
							elseif petuplist[id][2][type][1] == 3 then
								if string.find(item.getChar(itemindex,"名称"),"究极的") == nil then
									upnum = math.random(petuplist[id][2][type][itembase+1][1],petuplist[id][2][type][itembase+1][2])*100
								else
									upnum = petuplist[id][2][type][itembase+1][2]*100
								end
								char.setInt(toindex, "耐力", char.getInt(toindex, "耐力") + upnum)
							elseif petuplist[id][2][type][1] == 4 then
								if string.find(item.getChar(itemindex,"名称"),"究极的") == nil then
									upnum = math.random(petuplist[id][2][type][itembase+1][1],petuplist[id][2][type][itembase+1][2])*100
								else
									upnum = petuplist[id][2][type][itembase+1][2]*100
								end
								char.setInt(toindex, "速度", char.getInt(toindex, "速度") + upnum)
							end
							--if char.getInt(toindex, "提升值") == 0 and string.sub(petname,1,1) ~= '*' then
							--	char.setChar(toindex, "名字", "*" .. char.getChar(toindex, "名字"))
							--end
							upnum = upnum/100
							if upbuff == "" then
								if type == 1 then
									upbuff = upnum .. "|0|0|0"
								elseif type == 2 then
									upbuff = "0|" .. upnum .. "|0|0"
								elseif type == 3 then
									upbuff = "0|0|" .. upnum .. "|0"
								elseif type == 4 then
									upbuff = "0|0|0|" .. upnum
								end
							else
								upbuff1 = other.getString(upbuff, "|", 1)
								upbuff2 = other.getString(upbuff, "|", 2)
								upbuff3 = other.getString(upbuff, "|", 3)
								upbuff4 = other.getString(upbuff, "|", 4)
								if type == 1 then
									upbuff = upnum .. "|" .. upbuff2 .. "|" .. upbuff3 .. "|" .. upbuff4
								elseif type == 2 then
									upbuff = upbuff1 .. "|" .. upnum .. "|" .. upbuff3 .. "|" .. upbuff4
								elseif type == 3 then
									upbuff = upbuff1 .. "|" .. upbuff2 .. "|" .. upnum .. "|" .. upbuff4
								elseif type == 4 then
									upbuff = upbuff1 .. "|" .. upbuff2 .. "|" .. upbuff3 .. "|" .. upnum
								end
							end
							if string.find(item.getChar(itemindex,"名称"),"究极的") ~= nil then
								if string.sub(char.getChar(toindex, "名字"),1,1) ~= "*" then
									char.setChar(toindex, "名字", "*" .. char.getChar(toindex, "名字"))
								end
							end
							char.setChar(toindex, "称号", upbuff)
							char.setInt(toindex, "提升值", char.getInt(toindex, "提升值") + char.getLiftTo8(1, type))
							char.complianceParameter(toindex)
							char.sendStatusString(charaindex, "K" .. i)
							char.TalkToCli(charaindex, -1, char.getChar(toindex, "名字") .. "能力已提升！", "随机色")
							char.talkToServer(-1, "「 新闻 」恭喜 " .. char.getChar(charaindex, "名字") .. " 使用 " .. item.getChar(itemindex,"名称") .." 将 ".. char.getChar(toindex, "名字") .." 的".. petupstr[type] .."提升".. upnum .."点。", "随机色")
							char.DelItem(charaindex, haveitemindex)
							char.charSaveFromConnect(charaindex)
							char.TalkToCli(charaindex, -1, "系统自动为您存档!", "随机色");
						else
							char.TalkToCli(charaindex, -1, "[错误提示]该项属性已提升过了,无法重复提升，查看进化属性可到祝福大师透视查看。", "随机色")
						end
						return
					end
				end
				char.TalkToCli(charaindex, -1, "[错误提示]使用失败，祝福石只能给对应的系列宠物使用，请核对后再试。", "随机色")
			else
				char.TalkToCli(charaindex, -1, "[错误提示]你的宠物尚未到达1转140级，无法食用祝福。", "随机色")
			end
			return
		end
	end

	char.TalkToCli(charaindex, -1, "该物品只能给宠物使用！", "随机色")
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = char.getChar(meindex, "名字") .. "|我是宠物祝福制造者\n详情请看说明|6|封印宠物祝福|查看宠物评分|透视宠物属性|清洗宠物祝福|升级宠物祝福|宠物祝福说明"
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end


function ShowPetReadMe( meindex, talkerindex, page)
		token = petupreadme[page+1]
		
		if maxpage == 0 then
			button = 8
		elseif page == 0 and page < maxpage then
			button = 40
		elseif page > 0 and page < maxpage then
			button = 56
		elseif page == maxpage then
			button = 24
		end
		lssproto.windows(talkerindex, "对话框", button, 4000 + page, char.getWorkInt( meindex, "对象"), token)
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			local num = other.atoi(data)
			if num == 1 then
				token = "               " .. char.getChar(meindex, "名字") .. "\n\n"
				      .."    我是宠物祝福师，可以将一只成长达标的宠物封印成祝福石，祝福石可以对本系所有的1转140级宠物使用，使用后提升相应的属性。并且自动绑定。心动了吧，赶紧试试吧。\n\n"
				      .."[评分计算方式]宠物评分=血/4+攻+防+敏"
				lssproto.windows(talkerindex, "对话框", 12, 1, char.getWorkInt( meindex, "对象"), token)
			elseif num == 2 then
				lssproto.windows(talkerindex, "宠物框", 8, 2, char.getWorkInt( meindex, "对象"), token)
			elseif num == 3 then
				lssproto.windows(talkerindex, "宠物框", 8, 3, char.getWorkInt( meindex, "对象"), token)
			elseif num == 4 then
				lssproto.windows(talkerindex, "宠物框", 8, 4, char.getWorkInt( meindex, "对象"), token)
			elseif num == 5 then
				token = char.getChar(meindex, "名字") .. "|请选择您要升级的祝福\n[2个升级1个]|3|普通祝福|优质祝福|究极祝福"
				lssproto.windows(talkerindex, "新选择框", 8, 5, char.getWorkInt( meindex, "对象"), token)
			elseif num == 6 then
				ShowPetReadMe(meindex, talkerindex, 0)
			end
		elseif seqno == 1 then
			if select == 1 or select == 4 then
				lssproto.windows(talkerindex, "宠物框", 8, 2000, char.getWorkInt( meindex, "对象"), token)
			end
		elseif seqno == 2 then
			petid = other.atoi(data) - 1
			local petindex = char.getCharPet(talkerindex, petid)
			if char.check(petindex) == 1 then
				value = math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷"))
				char.TalkToCli(talkerindex, meindex, char.getChar(petindex, "名字") .. "评分为:" .. value .. "分!", "随机色")
			end
		elseif seqno == 3 then
			petid = other.atoi(data) - 1
			local petindex = char.getCharPet(talkerindex, petid)
			if char.check(petindex) == 1 then
					local upbuff = char.getChar(petindex,"称号")
					if upbuff == "" then
						char.TalkToCli(talkerindex, meindex, "这个宠物还没被祝福过嘛！", "随机色")
						return
					end
					token = "                  " .. char.getChar(meindex, "名字") .. "\n"
				          .."以下是您的宠物["..char.getChar(petindex,"名字").."]的祝福信息：\n\n"
				          .."体力：".. other.atoi(other.getString(upbuff, "|", 1)) .."\n"
						  .."腕力：".. other.atoi(other.getString(upbuff, "|", 2)) .."\n"
						  .."耐力：".. other.atoi(other.getString(upbuff, "|", 3)) .."\n"
						  .."敏捷：".. other.atoi(other.getString(upbuff, "|", 4)) .."\n"
						  .."综合："
					local TM_HP = other.atoi(other.getString(upbuff, "|", 1))*4 + other.atoi(other.getString(upbuff, "|", 2)) + other.atoi(other.getString(upbuff, "|", 3)) + other.atoi(other.getString(upbuff, "|", 4))
					local TM_STR = other.atoi(other.getString(upbuff, "|", 2)) + other.atoi(other.getString(upbuff, "|", 3))*0.1 + other.atoi(other.getString(upbuff, "|", 1))*0.1 + other.atoi(other.getString(upbuff, "|", 4))*0.05
					local TM_TOUGH = other.atoi(other.getString(upbuff, "|", 3)) + other.atoi(other.getString(upbuff, "|", 2))*0.1 + other.atoi(other.getString(upbuff, "|", 1))*0.1 + other.atoi(other.getString(upbuff, "|", 4))*0.05
					local TM_DEX = other.atoi(other.getString(upbuff, "|", 4))
					if TM_HP > 0 then
						token = token .. "HP+" .. TM_HP .. " "
					end
					if TM_STR > 0 then
						token = token .. "攻+" .. TM_STR .. " "
					end
					if TM_TOUGH > 0 then
						token = token .. "防+" .. TM_TOUGH .. " "
					end
					if TM_DEX > 0 then
						token = token .. "敏+" .. TM_DEX
					end
					lssproto.windows(talkerindex, "对话框", 8, 0, char.getWorkInt( meindex, "对象"), token)
			end
		elseif seqno == 4 then
			petid = other.atoi(data) - 1
			local petindex = char.getCharPet(talkerindex, petid)
			if char.check(petindex) == 1 then
					local upbuff = char.getChar(petindex,"称号")
					if upbuff == "" then
						char.TalkToCli(talkerindex, meindex, "这个宠物还没被祝福过嘛！", "随机色")
						return
					end
					token = char.getChar(meindex, "名字") .. "|"..char.getChar(petindex,"名字").."的祝福信息\n请选择需要清洗的项目|4|体力：".. other.atoi(other.getString(upbuff, "|", 1)) .."|腕力：".. other.atoi(other.getString(upbuff, "|", 2)) .."|耐力：".. other.atoi(other.getString(upbuff, "|", 3)) .."|敏捷：".. other.atoi(other.getString(upbuff, "|", 4))
					lssproto.windows(talkerindex, "新选择框", 8, petid + 10, char.getWorkInt( meindex, "对象"), token)
			end
		elseif seqno == 5 then
			itemtype = other.atoi(data)
			if itemtype < 1 or itemtype > 3 then
				return
			end
			local TempItemName = {"","",""}
			local TempItemNum = {"两","两","两"}
			local TempItemHave = {10,10,10}
			for i = 9, TempItemHave[itemtype] do
				local TempItemIndex = char.getItemIndex( talkerindex, i);
				local TempItemId = item.getInt(TempItemIndex,"序号")
				if TempItemId ~= 20899 then
					if itemtype == 1 then
						char.TalkToCli(talkerindex, meindex, "兑换普通祝福需要两个相同的劣质祝福并放在道具栏前两位。", "随机色")
					elseif itemtype == 2 then
						char.TalkToCli(talkerindex, meindex, "兑换优质祝福需要两个相同的普通祝福并放在道具栏前两位。", "随机色")
					else
						char.TalkToCli(talkerindex, meindex, "兑换究极祝福需要两个相同的优质祝福并放在道具栏前两位。　　　　　　　　（究极祝福的加成属性为固定的优质祝福的最高值，使用后宠物会绑定哟）", "随机色")
					end
					return
				end
				TempItemName[i-8] = item.getChar(TempItemIndex,"名称")
				if itemtype == 1 then
					if string.find(TempItemName[i-8],"劣质的") == nil then
						char.TalkToCli(talkerindex, meindex, "兑换普通祝福需要两个相同的劣质祝福并放在道具栏前两位。", "随机色")
						return
					end
				elseif itemtype == 2 then
					if string.find(TempItemName[i-8],"普通的") == nil then
						char.TalkToCli(talkerindex, meindex, "兑换优质祝福需要两个相同的普通祝福并放在道具栏前两位。", "随机色")
						return
					end
				else
					if string.find(TempItemName[i-8],"优质的") == nil then
						char.TalkToCli(talkerindex, meindex, "兑换究极祝福需要两个相同的优质祝福并放在道具栏前两位。　　　　　　　　（究极祝福的加成属性为固定的优质祝福的最高值，使用后宠物会绑定哟）", "随机色")
						return
					end
				end
			end
			if TempItemName[1] ~= TempItemName[2] then
				char.TalkToCli(talkerindex, meindex, "您的两个祝福不一样哦，无法升级呢！", "随机色")
				return
			end
			char.setWorkInt(talkerindex,"NPC临时1",itemtype)
			token = "                  " .. char.getChar(meindex, "名字") .. "\n\n"
				  .."您确定要用以下" .. TempItemNum[itemtype] .. "个祝福升级为更高等级的祝福么?\n\n"
				  .. TempItemName[1] .. "\n"
				  .. TempItemName[2] .. "\n"
			lssproto.windows(talkerindex, "对话框", 12, 6, char.getWorkInt( meindex, "对象"), token)
		elseif seqno == 6 then
			if select == 1 or select == 4 then
				itemtype = char.getWorkInt(talkerindex,"NPC临时1")
				if itemtype < 1 or itemtype > 3 then
					return
				end
				local TempItemName = {"","",""}
				local TempItemNum = {"两","两","两"}
				local TempItemHave = {10,10,10}
				for i = 9, TempItemHave[itemtype] do
					local TempItemIndex = char.getItemIndex( talkerindex, i);
					local TempItemId = item.getInt(TempItemIndex,"序号")
					if TempItemId ~= 20899 then
						if itemtype == 1 then
							char.TalkToCli(talkerindex, meindex, "兑换普通祝福需要两个相同的劣质祝福并放在道具栏前两位。", "随机色")
						elseif itemtype == 2 then
							char.TalkToCli(talkerindex, meindex, "兑换优质祝福需要两个相同的普通祝福并放在道具栏前两位。", "随机色")
						else
							char.TalkToCli(talkerindex, meindex, "兑换究极祝福需要两个相同的优质祝福并放在道具栏前两位。　　　　　　　　（究极祝福的加成属性为固定的优质祝福的最高值，使用后宠物会绑定哟）", "随机色")
						end
						return
					end
					TempItemName[i-8] = item.getChar(TempItemIndex,"名称")
					if itemtype == 1 then
						if string.find(TempItemName[i-8],"劣质的") == nil then
							char.TalkToCli(talkerindex, meindex, "兑换普通祝福需要两个相同的劣质祝福并放在道具栏前两位。", "随机色")
							return
						end
					elseif itemtype == 2 then
						if string.find(TempItemName[i-8],"普通的") == nil then
							char.TalkToCli(talkerindex, meindex, "兑换优质祝福需要两个相同的普通祝福并放在道具栏前两位。", "随机色")
							return
						end
					else
						if string.find(TempItemName[i-8],"优质的") == nil then
							char.TalkToCli(talkerindex, meindex, "兑换究极祝福需要两个相同的优质祝福并放在道具栏前两位。　　　　　　　　（究极祝福的加成属性为固定的优质祝福的最高值，使用后宠物会绑定哟）", "随机色")
							return
						end
					end
				end
				if TempItemName[1] ~= TempItemName[2] then
					char.TalkToCli(talkerindex, meindex, "您的两个祝福不一样哦，无法升级呢！", "随机色")
					return
				end
				local TempName = string.sub(TempItemName[1],7)
				for i=1,#itemlist do
					if itemlist[i][4] == TempName then
						char.DelItem(talkerindex, 9)
						char.DelItem(talkerindex, 10)
						local newitemindex = npc.AddRandItem(talkerindex, itemlist[i][1])
						if itemtype == 3 then
							local itembase = 1
							item.setChar(newitemindex,"名称","究极的" ..itemlist[i][9].."祝福"..itemstr[itemlist[i][7]])
							item.setChar(newitemindex,"显示名","究极的" ..itemlist[i][9].."祝福"..itemstr[itemlist[i][7]])
							item.setChar(newitemindex,"字段",itemlist[i][8].."|"..itemlist[i][7].."|"..itembase)
							item.setChar(newitemindex,"说明","使用后可使"..itemlist[i][9].."系宠物增加"..petupstr[itemlist[i][7]]..petuplist[itemlist[i][8]][2][itemlist[i][7]][itembase+1][2].."点[使用后宠物绑定]")
							item.setInt(newitemindex,"图号",itempic[itemlist[i][7]])
						else
							local itembase = 3
							if itemtype == 1 then
								itembase = 2
							else
								itembase = 1
							end
							item.setChar(newitemindex,"名称",itembasestr[itembase]..itemlist[i][9].."祝福"..itemstr[itemlist[i][7]])
							item.setChar(newitemindex,"显示名",itembasestr[itembase]..itemlist[i][9].."祝福"..itemstr[itemlist[i][7]])
							item.setChar(newitemindex,"字段",itemlist[i][8].."|"..itemlist[i][7].."|"..itembase)
							item.setChar(newitemindex,"说明","使用后可使"..itemlist[i][9].."系宠物增加"..petupstr[itemlist[i][7]]..petuplist[itemlist[i][8]][2][itemlist[i][7]][itembase+1][1].."-"..petuplist[itemlist[i][8]][2][itemlist[i][7]][itembase+1][2].."点")
							item.setInt(newitemindex,"图号",itempic[itemlist[i][7]])
						end
						char.sendStatusString(talkerindex,"I");
						char.TalkToCli(talkerindex, meindex, "您已经将您的祝福升级为 ["..item.getChar(newitemindex,"名称").."]", "随机色")
						--char.charSaveFromConnect(talkerindex)
						char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
						return
					end
				end
			end
		elseif seqno >= 10 and seqno < 15 then
			petid = seqno - 10
			local petindex = char.getCharPet(talkerindex, petid)
			local num = 0
			if select == 4 then
				num = char.getWorkInt(talkerindex,"计时器")
			else
				num = other.atoi(data)
			end
			if num < 1 or num > 4 then
				return
			end
			if char.check(petindex) == 1 then
					local upbuff = char.getChar(petindex,"称号")
					if upbuff == "" then
						char.TalkToCli(talkerindex, meindex, "这个宠物还没被祝福过嘛！", "随机色")
						return
					end
					for j = 1, #petuplist do
						for k = 1, #petuplist[j][1] do
							if char.getInt(petindex, "宠ID") == petuplist[j][1][k] then
								if other.atoi(other.getString(upbuff, "|", num)) < 1 then
									char.TalkToCli(talkerindex, meindex, "这项属性没有被祝福过嘛！", "随机色")
									return
								end
								if select == 4 then
									local myvippoint = sasql.getVipPoint(talkerindex)
									if myvippoint < petuplist[j][3] then
										char.TalkToCli(talkerindex, meindex, "您的金币不足", "随机色")
										lssproto.windows(talkerindex, 1038, 0, -1, -1, "2")
										return
									end
									if num == 1 then
										char.setChar(petindex,"称号",0 .. "|" .. other.atoi(other.getString(upbuff, "|", 2)) .. "|" .. other.atoi(other.getString(upbuff, "|", 3)) .. "|" .. other.atoi(other.getString(upbuff, "|", 4)))
									elseif num == 2 then
										char.setChar(petindex,"称号",other.atoi(other.getString(upbuff, "|", 1)) .. "|" .. 0 .. "|" .. other.atoi(other.getString(upbuff, "|", 3)) .. "|" .. other.atoi(other.getString(upbuff, "|", 4)))
									elseif num == 3 then
										char.setChar(petindex,"称号",other.atoi(other.getString(upbuff, "|", 1)) .. "|" .. other.atoi(other.getString(upbuff, "|", 2)) .. "|" .. 0 .. "|" .. other.atoi(other.getString(upbuff, "|", 4)))
									elseif num == 4 then
										char.setChar(petindex,"称号",other.atoi(other.getString(upbuff, "|", 1)) .. "|" .. other.atoi(other.getString(upbuff, "|", 2)) .. "|" .. other.atoi(other.getString(upbuff, "|", 3)) .. "|" .. 0)
									end
									if char.getChar(petindex,"称号") == "0|0|0|0" then
										char.setChar(petindex,"称号","")
										local temppetid = char.getInt(petindex,"宠ID")
										local temppetname = enemytemp.getChar(enemytemp.getEnemyTempArrayFromTempNo(temppetid),"名字")
										char.setChar(petindex,"名字",temppetname)
									end
									char.setInt(petindex, "提升值", char.getInt(petindex, "提升值") - char.getLiftTo8(1, num))
									char.setInt(petindex, petupstr[num], char.getInt(petindex, petupstr[num]) - other.atoi(other.getString(upbuff, "|", num))*100)
									sasql.setVipPoint(talkerindex,myvippoint-petuplist[j][3])
									other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,petuplist[j][3]})
									other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,petuplist[j][3]})
									token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -petuplist[j][3] .. "," .. myvippoint .. "," .. myvippoint - petuplist[j][3] .. ",'兑换宠物祝福扣除" .. petuplist[j][3] .. "金币',NOW())"
									sasql.query(token)
									char.TalkToCli(talkerindex, meindex, "扣除"..petuplist[j][3].."金币!", "随机色")
									char.complianceParameter(petindex)
									char.sendStatusString(talkerindex, "K" .. petid)
									char.TalkToCli(talkerindex, meindex, "该宠物清洗成功！", "随机色")
									--char.charSaveFromConnect(talkerindex)
									char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
									return
								else
									token = "                  " .. char.getChar(meindex, "名字") .. "\n"
										.."以下是您的宠物["..char.getChar(petindex,"名字").."]的清洗信息\n"
										..petupstr[num].."："..other.atoi(other.getString(upbuff, "|", num)).."\n"
										.."需要金币："..petuplist[j][3].."\n"
										.."您确认需要清洗吗？"
									lssproto.windows(talkerindex, "对话框", 12, petid + 10, char.getWorkInt( meindex, "对象"), token)
									char.setWorkInt(talkerindex,"计时器",num)
									return
								end
							end
						end
					end
					char.TalkToCli(talkerindex, meindex, "此宠物无法清洗！", "随机色")
			end
		elseif seqno == 2000 then
			petid = other.atoi(data) - 1
			
			if checkEmptItemNum(talkerindex) == 0 then
				char.TalkToCli(talkerindex, meindex, "物品已满，请道具栏留有足够的空位！", "随机色")
				return
			end
			
			local petindex = char.getCharPet(talkerindex, petid)
			if char.check(petindex) == 1 then
				if char.getInt(petindex, "转数") == 1 and char.getInt(petindex, "等级") >= 135 then
					for j = 1, #itemlist do
						if char.getInt(petindex, "宠ID") == itemlist[j][2] then
							if itemlist[j][3] == 0 then
								char.TalkToCli(talkerindex, meindex, "该项还未开放封印!", "随机色")
								return
							end
							value = math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷"))
							if value - itemlist[j][3] >= -40 then
								paypoint = 0
								if itemlist[j][3] > value then
									paypoint = (itemlist[j][3] - value)*itemlist[j][5]
									if paypoint > itemlist[j][6] then
										paypoint = itemlist[j][6]
									end
								end
								local gailv1 = 0
								local gailv2 = 0
								local gailv3 = 0
								if value - itemlist[j][3] >= 80 then
									gailv1 = 100
									gailv2 = 0
									gailv3 = 0
								elseif value - itemlist[j][3] >= 30 then
									gailv1 = 20 + (value - itemlist[j][3])
									gailv2 = 100 - gailv1
									gailv3 = 0
								elseif value - itemlist[j][3] >= 0 then
									gailv1 = 20 + (value - itemlist[j][3])
									gailv2 = gailv1
									gailv3 = 100 - gailv1 * 2
								else
									gailv1 = 20
									gailv2 = 20
									gailv3 = 60
								end
								if paypoint == 0 then
									token = "要封印的宠物祝福属性："..itemlist[j][4]
									if itemlist[j][10] > 0 then
										token = token .. "\n需要活力:" .. itemlist[j][10]
									end
									token = token .."\n当前宠物评分:"..value
										.."\n目标宠物评分:"..itemlist[j][3]
										.."\n优质祝福概率:"..gailv1.."%"
										.."\n普通祝福概率:"..gailv2.."%"
										.."\n劣质祝福概率:"..gailv3.."%"
										.."\n封印后将您的宠物将消失，是否确认封印"
								else
									token = "要封印的宠物祝福属性："..itemlist[j][4]
									if itemlist[j][10] > 0 then
										token = token .. "\n需要活力:" .. itemlist[j][10]
									end
									token = token .. "\n当前宠物评分:"..value
										.."\n目标宠物评分:"..itemlist[j][3]
										.."\n评分不足需要贿赂我 "..paypoint.." 金币"
										.."\n封印后将您的宠物将消失，是否确认封印"
										.."\n评分不足的宠物兑换祝福概率一律为\n优质(20%) 普通(20%) 劣质(60%)"
								end
								char.setWorkInt(talkerindex,"计时器",petid)
								lssproto.windows(talkerindex, "对话框", 12, j+3000, char.getWorkInt( meindex, "对象"), token)
							else
								char.TalkToCli(talkerindex, -1, "[错误提示]您的这只宠物太弱了，回去再修炼修炼吧！", "随机色")
							end
							return
						end
					end
					char.TalkToCli(talkerindex, meindex, "该宠物不符合封印的要求哦！", "随机色")
				else
					char.TalkToCli(talkerindex, -1, "[错误提示]你的宠物尚未到达1转135级，再练练再来吧。", "随机色")
				end
			end
		elseif seqno > 3000 and seqno < 4000 then
			id = seqno - 3000
			petid = char.getWorkInt(talkerindex,"计时器")
			if itemlist[id][3] == 0 then
				char.TalkToCli(talkerindex, meindex, "该项还未开放封印祝福!", "随机色")
				return
			end
			
			if checkEmptItemNum(talkerindex) == 0 then
				char.TalkToCli(talkerindex, meindex, "物品已满，请道具栏留有足够的空位！", "随机色")
				return
			end
			
			local petindex = char.getCharPet(talkerindex, petid)
			if char.check(petindex) == 1 and char.getInt(petindex, "等级") >= 135 then
				if char.getInt(petindex, "转数") == 1 then
					if char.getInt(petindex, "宠ID") == itemlist[id][2] then
						value = math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷"))
						if value - itemlist[id][3] >= -40 then
							paypoint = 0
							if itemlist[id][3] > value then
								paypoint = (itemlist[id][3] - value)*itemlist[id][5]
								if paypoint > itemlist[id][6] then
									paypoint = itemlist[id][6]
								end
							end
							if sasql.getVipPoint(talkerindex) < paypoint then
								char.TalkToCli(talkerindex, -1, "[错误提示]您的金币不足" .. paypoint .."，封印失败！", "随机色")
								lssproto.windows(talkerindex, 1038, 0, -1, -1, "2")
								return
							end
							if itemlist[id][10] > 0 then
								if char.getInt(talkerindex,"活力") < itemlist[id][10] then
									char.TalkToCli(talkerindex, meindex, "您的活力不足", "随机色")
									return
								end
								char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - itemlist[id][10])
								char.newMessageToCli(talkerindex, -1, "扣除" .. itemlist[id][10] .. "活力", "白色")
								char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + itemlist[id][10] * 100)
								saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
								other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,itemlist[id][10]})
							end
							local newitemindex = npc.AddRandItem(talkerindex, itemlist[id][1])
							local itembase = 1
							local itemrand = math.random(1,100)
							if value - itemlist[id][3] >= 0 then
								if itemrand > 100 - 20 - (value - itemlist[id][3]) then
									itembase = 1
								elseif itemrand > 100 - 40 - (value - itemlist[id][3])*2 then
									itembase = 2
								else
									itembase = 3
								end
							else
								if itemrand > 100 - 20 then
									itembase = 1
								elseif itemrand > 100 - 40 then
									itembase = 2
								else
									itembase = 3
								end
							end
							item.setChar(newitemindex,"名称",itembasestr[itembase]..itemlist[id][9].."祝福"..itemstr[itemlist[id][7]])
							item.setChar(newitemindex,"显示名",itembasestr[itembase]..itemlist[id][9].."祝福"..itemstr[itemlist[id][7]])
							item.setChar(newitemindex,"字段",itemlist[id][8].."|"..itemlist[id][7].."|"..itembase)
							item.setChar(newitemindex,"说明","使用后可使"..itemlist[id][9].."系宠物增加"..petupstr[itemlist[id][7]]..petuplist[itemlist[id][8]][2][itemlist[id][7]][itembase+1][1].."-"..petuplist[itemlist[id][8]][2][itemlist[id][7]][itembase+1][2].."点")
							item.setInt(newitemindex,"图号",itempic[itemlist[id][7]])
							char.sendStatusString(talkerindex,"I");
							if paypoint > 0 then
								sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex)-paypoint)
								other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,paypoint})
								other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,paypoint})
								char.TalkToCli(talkerindex, meindex, "扣除"..paypoint.."金币!", "随机色")
							end
							char.TalkToCli(talkerindex, meindex, "您的 [" .. char.getChar(petindex, "名字") .. "] 已成功被封印为 ["..item.getChar(newitemindex,"名称").."]", "随机色")
							char.DelPet(talkerindex, petindex)
							--char.charSaveFromConnect(talkerindex)
							char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
						else
							char.TalkToCli(talkerindex, -1, "[错误提示]您的这只宠物太弱了，回去再修炼修炼吧！", "随机色")
						end
					else
						char.TalkToCli(talkerindex, meindex, "该宠物封印失败" .. item.getNameFromNumber(itemlist[id][1]), "随机色")
					end
				else
					char.TalkToCli(talkerindex, -1, "[错误提示]你的宠物尚未到达1转135级，再练练再来吧。", "随机色")
				end
			end
		elseif seqno >= 4000 and seqno < 5000 then
			num = seqno - 4000
			if select == 16 then
				ShowPetReadMe(meindex, talkerindex, num - 1)
			elseif select == 32 then
				ShowPetReadMe(meindex, talkerindex, num + 1)
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
	itemlist = {----------道具编号，长编号，评分，说明，差1点要补得点数，最大补点数，道具类型1-4，宠物类型（人龙就是1），道具名字系名，活力
	--人龙系
							{"20899", 92, 1310, "人龙祝福[水]",50,1500,1,1,"人龙",0}
							,{"20899", 94, 1280, "人龙祝福[火]",50,1500,2,1,"人龙",0}
							,{"20899", 91, 1280, "人龙祝福[地]",50,1500,3,1,"人龙",0}
							,{"20899", 95, 1310, "人龙祝福[风]",50,1500,4,1,"人龙",0}
		--小鸡系
							,{"20899", 808, 1300, "小鸡祝福[水]",50,1500,1,2,"小鸡",0}
							,{"20899", 294, 1300, "小鸡祝福[火]",50,1500,2,2,"小鸡",0}
							,{"20899", 293, 1300, "小鸡祝福[地]",50,1500,3,2,"小鸡",0}
							,{"20899", 292, 1280, "小鸡祝福[风]",50,1500,4,2,"小鸡",0}
		--鲨鱼系
							,{"20899", 223, 1270, "鲨鱼祝福[水]",30,1200,1,3,"鲨鱼",0}
							,{"20899", 222, 1270, "鲨鱼祝福[火]",30,1200,2,3,"鲨鱼",0}
							,{"20899", 221, 1270, "鲨鱼祝福[地]",30,1200,3,3,"鲨鱼",0}
		--猩猩系
							,{"20899", 142, 1310, "猩猩祝福[水]",30,1200,1,4,"猩猩",0}
							,{"20899", 144, 1310, "猩猩祝福[火]",30,1200,2,4,"猩猩",0}
							,{"20899", 141, 1310, "猩猩祝福[地]",30,1200,3,4,"猩猩",0}
	    --年兽系
							,{"20899", 902, 1380, "马年祝福[水]",300,15000,1,5,"马年",0}
							,{"20899", 903, 1390, "马年祝福[火]",300,15000,2,5,"马年",0}
							,{"20899", 901, 1380, "马年祝福[地]",300,15000,3,5,"马年",0}
							,{"20899", 904, 1390, "马年祝福[风]",300,15000,4,5,"马年",0}
		--毒蛙系
							,{"20899", 232, 1330, "毒蛙祝福[水]",30,1200,1,6,"毒蛙",0}
							,{"20899", 234, 1330, "毒蛙祝福[火]",30,1200,2,6,"毒蛙",0}
							,{"20899", 791, 1370, "毒蛙祝福[地]",30,1200,3,6,"毒蛙",0}
							,{"20899", 233, 1330, "毒蛙祝福[风]",30,1200,4,6,"毒蛙",0}
		--拳王系
							,{"20899", 64, 1310, "拳王祝福[水]",30,1200,1,7,"拳王",0}
							,{"20899", 61, 1310, "拳王祝福[火]",30,1200,2,7,"拳王",0}
							,{"20899", 63, 1310, "拳王祝福[地]",30,1200,3,7,"拳王",0}
							,{"20899", 65, 1310, "拳王祝福[风]",30,1200,4,7,"拳王",0}
		--威威系
							,{"20899", 33, 1270, "威威祝福[水]",30,1200,1,8,"威威",0}
							,{"20899", 32, 1270, "威威祝福[火]",30,1200,2,8,"威威",0}
							,{"20899", 34, 1270, "威威祝福[地]",30,1200,3,8,"威威",0}
							,{"20899", 31, 1270, "威威祝福[风]",30,1200,4,8,"威威",0}
		--2D虎系
							,{"20899", 3008, 1360, "2D虎祝福[火]",300,15000,2,9,"2D虎",0}
							,{"20899", 3006, 1360, "2D虎祝福[地]",300,15000,3,9,"2D虎",0}
							,{"20899", 3007, 1360, "2D虎祝福[风]",300,15000,4,9,"2D虎",0}
							,{"20899", 3009, 1360, "2D虎祝福[水]",300,15000,1,9,"2D虎",0}
		--2D龙系
							,{"20899", 3002, 1350, "2D龙祝福[水]",300,12000,1,10,"2D龙",0}
							,{"20899", 3004, 1340, "2D龙祝福[火]",300,12000,2,10,"2D龙",0}
							,{"20899", 3001, 1340, "2D龙祝福[地]",300,12000,3,10,"2D龙",0}
							,{"20899", 3005, 1350, "2D龙祝福[风]",300,12000,4,10,"2D龙",0}
		--天使系
							,{"20899", 3027, 1340, "天使祝福[水]",300,12000,1,11,"天使",0}
							,{"20899", 3026, 1340, "天使祝福[火]",300,12000,2,11,"天使",0}
							,{"20899", 3028, 1340, "天使祝福[地]",300,12000,3,11,"天使",0}
							,{"20899", 3025, 1340, "天使祝福[风]",300,12000,4,11,"天使",0}
		--兔子系
							,{"20899", 3019, 1330, "新兔祝福[火]",150,6000,2,12,"新兔",0}
							,{"20899", 3021, 1330, "新兔祝福[地]",150,6000,3,12,"新兔",0}
							,{"20899", 3018, 1330, "新兔祝福[风]",150,6000,4,12,"新兔",0}
		--乌龟系
							,{"20899", 3010, 1330, "乌龟祝福[水]",100,4000,1,13,"乌龟",0}
							,{"20899", 3012, 1330, "乌龟祝福[火]",100,4000,2,13,"乌龟",0}
							,{"20899", 3013, 1330, "乌龟祝福[地]",100,4000,3,13,"乌龟",0}
							,{"20899", 3011, 1330, "乌龟祝福[风]",100,4000,4,13,"乌龟",0}
		--舌头系
							,{"20899", 41, 1270, "舌头祝福[水]",50,2000,1,14,"舌头",0}
							,{"20899", 44, 1300, "舌头祝福[火]",50,2000,2,14,"舌头",0}
							,{"20899", 42, 1300, "舌头祝福[地]",50,2000,3,14,"舌头",0}
		--暴龙系
							,{"20899", 302, 1310, "暴龙祝福[水]",100,4000,1,15,"暴龙",0}
							,{"20899", 303, 1310, "暴龙祝福[火]",100,4000,2,15,"暴龙",0}
							,{"20899", 301, 1330, "暴龙祝福[地]",100,4000,3,15,"暴龙",0}
							,{"20899", 304, 1300, "暴龙祝福[风]",100,4000,4,15,"暴龙",0}
		--茄子系
							,{"20899", 181, 1290, "茄子祝福[水]",30,1200,1,16,"茄子",0}
							,{"20899", 182, 1290, "茄子祝福[火]",30,1200,2,16,"茄子",0}
							,{"20899", 184, 1290, "茄子祝福[地]",30,1200,3,16,"茄子",0}
							,{"20899", 183, 1290, "茄子祝福[风]",30,1200,4,16,"茄子",0}					
		--跳狗系
							,{"20899", 73, 1310, "跳狗祝福[水]",100,4000,1,17,"跳狗",0}
							,{"20899", 71, 1270, "跳狗祝福[火]",100,4000,2,17,"跳狗",0}
							,{"20899", 74, 1270, "跳狗祝福[地]",100,4000,3,17,"跳狗",0}
							,{"20899", 72, 1310, "跳狗祝福[风]",100,4000,4,17,"跳狗",0}
		--飞龙系
							,{"20899", 3124, 1330, "飞龙祝福[水]",80,3200,1,18,"飞龙",0}
							,{"20899", 272, 1320, "飞龙祝福[火]",30,1200,2,18,"飞龙",0}
							,{"20899", 273, 1330, "飞龙祝福[地]",30,1200,3,18,"飞龙",0}
							,{"20899", 274, 1310, "飞龙祝福[风]",30,1200,4,18,"飞龙",0}
		--老虎系
							,{"20899", 193, 1260, "老虎祝福[火]",150,6000,2,19,"老虎",0}
							,{"20899", 191, 1260, "老虎祝福[地]",150,6000,3,19,"老虎",0}
							,{"20899", 192, 1265, "老虎祝福[风]",150,6000,4,19,"老虎",0}
		--兔子系
							,{"20899", 102, 1290, "兔子祝福[水]",30,1200,1,20,"兔子",0}
							,{"20899", 103, 1300, "兔子祝福[火]",30,1200,2,20,"兔子",0}
							,{"20899", 101, 1300, "兔子祝福[地]",30,1200,3,20,"兔子",0}
        --猪鱼系
							,{"20899", 322, 1290, "猪鱼祝福[水]",30,1200,1,21,"猪鱼",0}
							,{"20899", 324, 1300, "猪鱼祝福[火]",30,1200,2,21,"猪鱼",0}
							,{"20899", 323, 1300, "猪鱼祝福[地]",30,1200,3,21,"猪鱼",0}
	    --小狗系
							,{"20899", 3128, 1310, "小狗祝福[水]",100,4000,1,22,"小狗",0}
							,{"20899", 3129, 1310, "小狗祝福[火]",100,4000,2,22,"小狗",0}
							,{"20899", 3127, 1310, "小狗祝福[地]",100,4000,3,22,"小狗",0}
			    --狗年系
							,{"20899", 3030, 1370, "狗年祝福[水]",100,4000,1,23,"狗年",0}
							,{"20899", 3031, 1370, "狗年祝福[火]",100,4000,2,23,"狗年",0}
							,{"20899", 3029, 1370, "狗年祝福[地]",100,4000,3,23,"狗年",0}
							,{"20899", 3032, 1370, "狗年祝福[风]",100,4000,4,23,"狗年",0}
		--人狼系
							,{"20899", 3054, 1365, "人狼祝福[水]",100,4000,1,24,"人狼",0}
							,{"20899", 3055, 1365, "人狼祝福[火]",100,4000,2,24,"人狼",0}
							,{"20899", 3053, 1365, "人狼祝福[地]",100,4000,3,24,"人狼",0}
							,{"20899", 3056, 1365, "人狼祝福[风]",100,4000,4,24,"人狼",0}
		--雷龙系
							,{"20899", 252, 1280, "雷龙祝福[水]",150,6000,1,25,"雷龙",100}
							,{"20899", 253, 1310, "雷龙祝福[火]",150,6000,2,25,"雷龙",100}
							,{"20899", 254, 1310, "雷龙祝福[地]",150,6000,3,25,"雷龙",100}
							,{"20899", 255, 1300, "雷龙祝福[风]",150,6000,4,25,"雷龙",100}
		--新舌头系
							,{"20899", 740, 1340, "新舌祝福[水]",100,4000,1,26,"新舌",0}
							,{"20899", 742, 1350, "新舌祝福[火]",100,4000,2,26,"新舌",0}
							,{"20899", 741, 1340, "新舌祝福[地]",100,4000,3,26,"新舌",0}
							,{"20899", 739, 1350, "新舌祝福[风]",100,4000,4,26,"新舌",0}
		--新乌龟系
							,{"20899", 3059, 1310, "新龟祝福[水]",30,1200,1,27,"新龟",0}
							,{"20899", 3060, 1280, "新龟祝福[火]",30,1200,2,27,"新龟",0}
							,{"20899", 3058, 1280, "新龟祝福[地]",30,1200,3,27,"新龟",0}
							,{"20899", 3061, 1310, "新龟祝福[风]",30,1200,4,27,"新龟",0}
		--新鲨系		                    
							,{"20899", 784, 1375, "新鲨祝福[水]",100,4000,1,28,"新鲨",0}
							,{"20899", 785, 1375, "新鲨祝福[火]",100,4000,2,28,"新鲨",0}
							,{"20899", 786, 1375, "新鲨祝福[地]",100,4000,3,28,"新鲨",0}
							,{"20899", 787, 1370, "新鲨祝福[风]",100,4000,4,28,"新鲨",0}
		--三头蛇系
							,{"20899", 3042, 1370, "三头祝福[水]",100,4000,1,29,"三头",0}
							,{"20899", 3043, 1370, "三头祝福[火]",100,4000,2,29,"三头",0}
							,{"20899", 3041, 1370, "三头祝福[地]",100,4000,3,29,"三头",0}
							,{"20899", 3044, 1370, "三头祝福[风]",100,4000,4,29,"三头",0}
		--狮子系
							,{"20899", 118, 1370, "狮子祝福[水]",100,4000,1,30,"狮子",0}
							,{"20899", 119, 1370, "狮子祝福[火]",100,4000,2,30,"狮子",0}
							,{"20899", 117, 1370, "狮子祝福[地]",100,4000,3,30,"狮子",0}
							,{"20899", 120, 1370, "狮子祝福[风]",100,4000,4,30,"狮子",0}
		--蝎子系
							,{"20899", 36, 1365, "蝎子祝福[水]",100,4000,1,31,"蝎子",0}
							,{"20899", 37, 1365, "蝎子祝福[火]",100,4000,2,31,"蝎子",0}
							,{"20899", 35, 1365, "蝎子祝福[地]",100,4000,3,31,"蝎子",0}
							,{"20899", 38, 1365, "蝎子祝福[风]",100,4000,4,31,"蝎子",0}
		--端午系
							,{"20899", 958, 1365, "端午祝福[水]",100,4000,1,32,"端午",0}
							,{"20899", 959, 1365, "端午祝福[火]",100,4000,2,32,"端午",0}
							,{"20899", 957, 1365, "端午祝福[地]",100,4000,3,32,"端午",0}
							,{"20899", 960, 1365, "端午祝福[风]",100,4000,4,32,"端午",0}
		--新骑宠系		
		                    ,{"20899", 1110, 1320, "新骑祝福[水]",100,4000,1,33,"新骑",0}
							,{"20899", 4400, 1315, "新骑祝福[火]",100,4000,2,33,"新骑",0}
							,{"20899", 81, 1265, "新骑祝福[地]",100,4000,3,33,"新骑",0}
							,{"20899", 1095, 1295, "新骑祝福[风]",100,4000,4,33,"新骑",0}
														
							}

	
	
	---长编号，分别是血，攻，防，敏，清洗需要点数
							--人龙系
	petuplist = {{{91, 92, 93, 94, 95, 755, 754 ,3126,3045}, {{1, {6,10}, {4,9}, {2,8}}, {2, {12,18}, {10,16}, {6,15}}, {3, {8,12}, {6,11}, {4,10}}, {4, {5,9}, {3,8}, {1,7}}},500}
							--小鸡系
							,{{291, 292, 293, 294,808}, {{1, {8,10}, {6,9}, {4,8}}, {2, {10,15}, {8,14}, {5,12}}, {3, {8,12}, {6,11}, {4,10}}, {4, {12,18}, {10,16}, {6,15}}},500}
							--鲨鱼系
							,{{221, 222, 223, 224}, {{1, {12,18}, {10,16}, {6,15}}, {2, {12,18}, {10,16}, {6,15}}, {3, {8,12}, {6,11}, {4,10}}, {4, {0,0}, {0,0}, {0,0}}},500}
							--猩猩系
							,{{141, 142, 143, 144,766, 767, 768,969}, {{1, {10,14}, {8,13}, {6,10}}, {2, {10,16}, {8,13}, {6,10}}, {3, {10,14}, {8,13}, {6,10}}, {4, {0,0}, {0,0}, {0,0}}},500}
							--马年系
							,{{901, 902, 903, 904,4559,4560,4561,4562}, {{1, {4,8}, {2,7}, {1,5}}, {2, {8,13}, {5,11}, {3,9}}, {3, {4,8}, {2,7}, {1,5}}, {4, {4,8}, {2,7}, {1,5}}},3000}
							--毒蛙系
							,{{231, 232, 233, 234, 791}, {{1, {6,10}, {4,9}, {2,8}}, {2, {6,10}, {4,9}, {2,8}}, {3, {8,12}, {6,11}, {4,9}}, {4, {4,8}, {2,7}, {1,5}}},500}
							--拳王系
							,{{61, 62, 63, 64, 65}, {{1, {6,10}, {4,9}, {2,8}}, {2, {7,15}, {6,13}, {4,10}}, {3, {6,10}, {4,9}, {2,8}}, {4, {6,10}, {4,9}, {2,8}}},500}
							--威威系
							,{{31, 32, 33, 34}, {{1, {6,10}, {4,9}, {2,8}}, {2, {7,13}, {5,11}, {3,9}}, {3, {6,10}, {4,9}, {2,8}}, {4, {7,13}, {5,11}, {3,9}}},500}
							--2D虎系
							,{{3006, 3007, 3008, 3009}, {{1, {6,10}, {3,9}, {2,7}}, {2, {6,10}, {3,9}, {2,7}}, {3, {6,10}, {3,9}, {2,7}}, {4, {6,10}, {3,9}, {2,7}}},3000}
							--2D龙系
							,{{3001, 3002, 3003, 3004, 3005}, {{1, {4,7}, {2,6}, {1,4}}, {2, {8,13}, {5,11}, {4,9}}, {3, {6,10}, {3,9}, {2,7}}, {4, {4,7}, {2,6}, {1,4}}},3000}
							--天使系
							,{{3025, 3026, 3027, 3028}, {{1, {4,7}, {2,6}, {1,4}}, {2, {8,13}, {5,11}, {4,9}}, {3, {4,7}, {2,6}, {1,4}}, {4, {8,13}, {5,11}, {4,9}}},3000}
							--新兔系
							,{{3019, 3018, 3021,3020}, {{1, {0,0}, {0,0}, {0,0}}, {2, {8,14}, {6,12}, {5,10}}, {3, {4,8}, {3,7}, {2,5}}, {4, {8,14}, {6,12}, {5,10}}},1500}
							--乌龟系
							,{{3010, 3011, 3012, 3013}, {{1, {6,10}, {4,9}, {2,8}}, {2, {6,10}, {4,9}, {2,8}}, {3, {8,12}, {6,11}, {4,9}}, {4, {4,8}, {2,7}, {1,5}}},500}
							--舌头系
							,{{41, 42, 43, 44}, {{1, {10,14}, {8,13}, {6,10}}, {2, {10,16}, {8,13}, {6,10}}, {3, {10,14}, {8,13}, {6,10}}, {4, {0,0}, {0,0}, {0,0}}},500}
							--暴龙系
							,{{301, 302, 303, 304}, {{1, {6,10}, {4,9}, {2,8}}, {2, {6,10}, {4,9}, {2,8}}, {3, {6,10}, {4,9}, {2,8}}, {4, {6,10}, {4,9}, {2,8}}},1000}
							--拳王系
							,{{181, 182, 183, 184}, {{1, {6,10}, {4,9}, {2,8}}, {2, {7,15}, {6,13}, {4,10}}, {3, {6,10}, {4,9}, {2,8}}, {4, {6,10}, {4,9}, {2,8}}},500}
							--跳狗系
							,{{71, 72, 73, 74}, {{1, {6,10}, {4,9}, {2,8}}, {2, {12,18}, {10,16}, {6,15}}, {3, {8,12}, {6,11}, {4,10}}, {4, {5,9}, {3,8}, {1,7}}},500}
							--飞龙系
							,{{271, 272, 273, 274 ,275 ,3124},  {{1, {5,10}, {4,8}, {2,6}}, {2, {8,14}, {6,12}, {5,10}}, {3, {4,8}, {3,7}, {2,5}}, {4, {8,12}, {6,10}, {5,8}}},500}
							--老虎系
							,{{191, 192, 193, 194,4540}, {{1, {0,0}, {0,0}, {0,0}}, {2, {8,14}, {6,12}, {5,10}}, {3, {8,14}, {6,12}, {5,10}}, {4, {8,14}, {6,12}, {5,10}}},1500}
							--兔子系
							,{{101, 102, 103}, {{1, {10,14}, {8,13}, {6,10}}, {2, {10,16}, {8,13}, {6,10}}, {3, {10,14}, {8,13}, {6,10}}, {4, {0,0}, {0,0}, {0,0}}},500}
							--猪鱼系
							,{{321, 322, 323, 324, 325,908}, {{1, {10,14}, {8,13}, {6,10}}, {2, {10,16}, {8,13}, {6,10}}, {3, {10,14}, {8,13}, {6,10}}, {4, {0,0}, {0,0}, {0,0}}},500}
							--小狗系
							,{{3128, 3129, 3127}, {{1, {10,14}, {8,13}, {6,10}}, {2, {10,16}, {8,13}, {6,10}}, {3, {10,14}, {8,13}, {6,10}}, {4, {0,0}, {0,0}, {0,0}}},1500}
							--狗年系
							,{{3029, 3030, 3031, 3032}, {{1, {5,8}, {4,7}, {3,5}}, {2, {7,11}, {6,10}, {5,9}}, {3, {5,8}, {4,7}, {3,5}}, {4, {5,8}, {4,7}, {3,5}}},5000}
							--人狼系
							,{{3053, 3054, 3055, 3056}, {{1, {4,7}, {3,6}, {2,5}}, {2, {7,11}, {6,10}, {5,9}}, {3, {5,8}, {4,7}, {3,5}}, {4, {5,8}, {4,7}, {3,5}}},5000}
							--雷龙系
							,{{251, 252, 253, 254, 255,4547}, {{1, {5,8}, {4,7}, {3,5}}, {2, {6,10}, {4,9}, {2,8}}, {3, {5,8}, {4,7}, {3,5}}, {4, {5,8}, {4,7}, {3,5}}},1500}
							--新舌头系
							,{{739, 740, 741, 742}, {{1, {4,7}, {2,6}, {1,4}}, {2, {5,9}, {3,8}, {2,6}}, {3, {4,7}, {2,6}, {1,4}}, {4, {4,7}, {2,6}, {1,4}}},1500}
							--新乌龟
							,{{3058, 3059, 3060, 3061}, {{1, {6,10}, {4,9}, {2,8}}, {2, {12,18}, {10,16}, {6,15}}, {3, {8,12}, {6,11}, {4,10}}, {4, {5,9}, {3,8}, {1,7}}},500}
							--新鲨
							,{{784, 785, 786, 787}, {{1, {3,6}, {2,5}, {1,4}}, {2, {7,10}, {7,9}, {6,8}}, {3, {7,9}, {6,8}, {4,6}}, {4, {3,6}, {2,5}, {1,4}}},2000}
                           --三头蛇
							,{{3041,3042,3043,3044}, {{1, {3,6}, {2,5}, {1,4}}, {2, {7,11}, {7,10}, {6,8}}, {3, {7,10}, {6,8}, {4,6}}, {4, {3,7}, {2,5}, {1,4}}},2000}
                           --狮子系
							,{{117,118,119,120}, {{1, {3,6}, {2,4}, {2,3}}, {2, {4,7}, {3,6}, {2,4}}, {3, {3,5}, {3,4}, {2,3}}, {4, {3,5}, {3,4}, {2,3}}},2000}
							--蝎子系
							,{{35, 36, 37, 38}, {{1, {3,5}, {2,4}, {2,3}}, {2, {4,7}, {3,6}, {2,4}}, {3, {3,5}, {3,4}, {2,3}}, {4, {3,5}, {3,4}, {2,3}}},2000}
							--端午系
							,{{957, 958, 959, 960}, {{1, {3,6}, {2,5}, {2,4}}, {2, {4,9}, {3,8}, {2,7}}, {3, {3,6}, {3,5}, {2,4}}, {4, {3,5}, {3,4}, {2,3}}},2000}
                            --新骑系
							,{{1110, 1095, 4400, 81}, {{1, {6,10}, {4,9}, {2,8}}, {2, {6,10}, {4,9}, {2,8}}, {3, {6,10}, {4,9}, {2,8}}, {4, {6,10}, {4,9}, {2,8}}},2000}

							}
	petupstr = {"体力", "腕力", "耐力", "速度"}
	itemstr = {"[水]", "[火]", "[地]", "[风]"}
	itembasestr = {"优质的", "普通的", "劣质的"}
	itempic = {23102,23099,23100,23101}
	
	petupreadme = {"           ≡ 祝福设计初衷 ≡\n\n目前开放十六个系列，百余只宠物的封印祝福功能，本着强力宠物少加、中低档多加的原则，所以每个系列的封印祝福属性区别还是很大的，大大增加了中低档宠物的实战能力。\n比如满祝福的人龙都是非常犀利的哦！\n还有拳王系、猩猩系等等都是怪兽啊！"
				  ,"           ≡ 封印宠物祝福 ≡\n\n可以把满足条件、达到评分要求的宠物封印成宠物祝福，宠物祝福可以对本系宠物使用，食用后增加一定的成长属性，并且宠物绑定。\n\n具体的评分要求，详细增加参数建议看论坛。"
				  ,"           ≡ 查看宠物评分 ≡\n\n这个功能可以计算任何宠物的评分，不用自己再费脑筋了，需要进化或者封印祝福的玩家有福咯！！不过，这里还是再把评分系统的公式再告诉一边大家哈！\n宠物评分=血量/4+攻击+防御+敏捷"
				  ,"           ≡ 透视宠物属性 ≡\n\n这个功能是查看祝福后的宠物的增加属性的，在宠物栏里只能看到宠物的某项属性是否已经祝福，但是无法看到具体的属性，在这里就可以清晰的看到了！还可以看到综合增加值哦。不用再自己计算咯，算那个真心很麻烦！"
				  ,"           ≡ 清洗宠物祝福 ≡\n\n这个功能可以清洗掉宠物身上的祝福属性，而且是单项清洗，不用担心会全部清理，对加成属性不满意的朋友不用担心咯，但清洗后不会改变绑定属性哦，收取少许的金币作为辛苦费！\n使用究极祝福后宠物会绑定，需清洗所有祝福才能解绑。"
				  ,"           ≡ 宠物祝福分类 ≡\n\n宠物祝福在封印时会随机出现 优质的、普通的、劣质的 字样，与兑换宠物本身成长有一定关系，增加的参数范围也是不一样的，我们加入了很多随机性的玩法，在调整游戏平衡的同时又丰富了游戏内容和市场，提升耐玩性！"
				  ,"           ≡ 宠物祝福一览 ≡\n\n人龙系   小鸡系   鲨鱼系   猩猩系\n毒蛙系   拳王系   威威系   兔子系\n乌龟系   舌头系   暴龙系   跳狗系\n飞龙系   老虎系   马年系   2D人龙系"

					}
	
	maxpage = #petupreadme - 1
end

function main()
	data()
	Create("「 宠物祝福师 」", 16000, 2005, 28, 17, 6)
	item.addLUAListFunction( "ITEM_PETUP", "petup", "")
end
