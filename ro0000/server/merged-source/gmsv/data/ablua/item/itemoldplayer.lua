function NetLoopFunction()
	local maxplayer = char.getPlayerMaxNum()
	local year = tonumber(os.date("%Y", os.time()))
	local month = string.format("%02d",tonumber(os.date("%m", os.time())))
	local day = string.format("%02d",tonumber(os.date("%d", os.time())))
	for i = 0, maxplayer - 1 do
		if char.check(i) == 1 then
			if char.getWorkInt(i,"离线") == 0 then
				local itemindex = char.getItemIndex(i, 9)
				if itemindex > -1 then
					if item.getChar(itemindex,"使用函数名") == "ITEM_OLDPLAYER" then
						local itembuff = item.getChar(itemindex,"字段")
						local itemcnt = other.atoi(other.getString(itembuff,"|",1))
						local itemexp = other.atoi(other.getString(itembuff,"|",2))
						local itemdate = other.getString(itembuff,"|",3)
						if itemdate ~= year .. month .. day then
							if itemexp < 200 then
								itemexp = itemexp + 1
								item.setChar(itemindex,"字段",itemcnt .. "|" .. itemexp .. "|" .. itemdate)
								if itemexp % 2 == 0 then
									item.setChar(itemindex,"显示名",item.getChar(itemindex,"名称") .. "[" .. math.floor(itemexp / 2) .. "%]")
									item.UpdataItemOne(i,itemindex)
								end
							end
						end
					end
				end
			end
		end
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

function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function ITEM_OLDPLAYER(itemindex, charaindex, toindex, haveitemindex)
	local itembuff = item.getChar(itemindex,"字段")
	local itemcnt = other.atoi(other.getString(itembuff,"|",1))
	local itemexp = other.atoi(other.getString(itembuff,"|",2))
	local itemdate = other.getString(itembuff,"|",3)
	if itemcnt >= 7 then
		char.DelItem(charaindex, haveitemindex)
	end
	local year = tonumber(os.date("%Y", os.time()))
	local month = string.format("%02d",tonumber(os.date("%m", os.time())))
	local day = string.format("%02d",tonumber(os.date("%d", os.time())))
	if itemdate == year .. month .. day then
		char.TalkToCli(charaindex, -1, "[温馨提示]您今天已经使用过该道具了，明天再点我吧！", "随机色")
		return
	end
	if itemexp < 200 then
		char.TalkToCli(charaindex, -1, "[温馨提示]您的道具经验还不够，要搜集到100%总计需要200分钟（放在道具栏第一位开始搜集）", "随机色")
		return
	end
	itemcnt = itemcnt + 1
	if itempetid[itemcnt][1] == 1 then
		if checkEmptItemNum(charaindex) < table.getn(itempetid[itemcnt][2]) then
			char.TalkToCli(charaindex, -1, "[温馨提示]您身上道具栏不足" .. table.getn(itempetid[itemcnt][2]) .. "个，请清空一下吧！", "随机色")
			return
		end
		token = ""
		for i=1,table.getn(itempetid[itemcnt][2]) do
			local giveitemindex = char.Additem(charaindex,itempetid[itemcnt][2][i])
			if giveitemindex > -1 then
				local itemname = item.getChar(giveitemindex,"名称")
				if string.sub(itemname,1,1) ~= '*' then
					item.setChar(giveitemindex,"名称","*" .. itemname)
					item.UpdataItemOne(charaindex,giveitemindex)
				end
				if i ~= table.getn(itempetid[itemcnt][2]) then
					token = token .. "[" .. item.getChar(giveitemindex,"名称") .. "]、"
				else
					token = token .. "[" .. item.getChar(giveitemindex,"名称") .. "]"
				end
			end
		end
		if itemcnt >= 7 then
			char.DelItem(charaindex, haveitemindex)
			char.TalkToCli(charaindex, -1, "[温馨提示]您的礼包已经打开七次，全部领取完毕，得到" .. token .. "，希望这里是您的石器终点。", "随机色")
		else
			item.setChar(itemindex,"字段",itemcnt .. "|0|" .. year .. month .. day)
			item.setChar(itemindex,"显示名",item.getChar(itemindex,"名称") .. "[0%]")
			item.setChar(itemindex,"说明","-回归的赠礼-每天可以打开一次在线累计能量 剩余打开次数" .. 7 - itemcnt .. "次")
			item.UpdataItemOne(charaindex,itemindex)
			token2 = ""
			if itempetid[itemcnt + 1][1] == 1 then
				for i=1,table.getn(itempetid[itemcnt + 1][2]) do
					if i ~= table.getn(itempetid[itemcnt + 1][2]) then
						token2 = token2 .. "[" .. item.getNameFromNumber(itempetid[itemcnt + 1][2][i]) .. "]、"
					else
						token2 = token2 .. "[" .. item.getNameFromNumber(itempetid[itemcnt + 1][2][i]) .. "]"
					end
				end
			else
				token2 = token2 .. "[" .. itempetid[itemcnt + 1][3] .. "]"
			end
			char.TalkToCli(charaindex, -1, "[温馨提示]您的礼包打开成功，得到" .. token .. "，明天还可以领取" .. token2 .."，石器PK有您更精彩，记得多多推广哟！", "随机色")
		end
	elseif itempetid[itemcnt][1] == 2 then
		if checkEmptPetNum(charaindex) < 1 then
			char.TalkToCli(charaindex, -1, "[温馨提示]您身上宠物栏不足1个，请空出来再找点我哟！", "随机色")
			return
		end
		local petrnd = math.random(table.getn(itempetid[itemcnt][2]))
		token = ""
		local givepetindex = char.AddPet(charaindex,itempetid[itemcnt][2][petrnd],1)
		if char.check(givepetindex) then
			local petname = char.getChar(givepetindex,"名字")
			if string.sub(petname,1,1) ~= '*' then
				char.setChar(givepetindex,"名字","*" .. petname)
				for j = 0, 4 do
					if char.check(char.getCharPet(charaindex, j)) == 1 then
						if char.getCharPet(charaindex, j) == givepetindex then
							char.sendStatusString(charaindex, "K" .. j)
							break
						end
					end
				end
			end
			token = token .. "[" .. char.getChar(givepetindex,"名字") .. "]"
		end
		
		if itemcnt >= 7 then
			char.DelItem(charaindex, haveitemindex)
			char.TalkToCli(charaindex, -1, "[温馨提示]您的礼包已经打开七次，全部领取完毕，得到" .. token .. "，希望这里是您的石器终点。", "随机色")
		else
			item.setChar(itemindex,"字段",itemcnt .. "|0|" .. year .. month .. day)
			item.setChar(itemindex,"显示名",item.getChar(itemindex,"名称") .. "[0%]")
			item.setChar(itemindex,"说明","-回归的赠礼-每天可以打开一次在线累计能量 剩余打开次数" .. 7 - itemcnt .. "次")
			item.UpdataItemOne(charaindex,itemindex)
			token2 = ""
			if itempetid[itemcnt + 1][1] == 1 then
				for i=1,table.getn(itempetid[itemcnt + 1][2]) do
					if i ~= table.getn(itempetid[itemcnt + 1][2]) then
						token2 = token2 .. "[" .. item.getNameFromNumber(itempetid[itemcnt + 1][2][i]) .. "]、"
					else
						token2 = token2 .. "[" .. item.getNameFromNumber(itempetid[itemcnt + 1][2][i]) .. "]"
					end
				end
			else
				token2 = token2 .. "[" .. itempetid[itemcnt + 1][3] .. "]"
			end
			char.TalkToCli(charaindex, -1, "[温馨提示]您的礼包打开成功，得到" .. token .. "，明天还可以领取" .. token2 .."有您更精彩，记得多多推广哟！", "随机色")
		end
	end
end

function data()
	itempetid = {
				{1,{22008,21099,22504}}
				,{1,{22043,22454}}
				,{2,{3127,3128,3129,1588,1589,1636},"可捕捉的新宠一只"}
				,{1,{20833}}
				,{1,{22008,22010}}
				,{1,{20900}}
				,{1,{21020,22045}}
				}
end


function main()
	data()
	item.addLUAListFunction( "ITEM_OLDPLAYER", "ITEM_OLDPLAYER", "")
end