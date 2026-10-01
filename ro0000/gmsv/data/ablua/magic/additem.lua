function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function additem(charaindex, data)
	local maxplayer = char.getPlayerMaxNum() - 1
	if data == nil then
		return
	end
	local itemidbuff = other.getString(data," ",1)
	local numbuff = other.getString(data," ",2)
	local cdkey = other.getString(data," ",3)
	if itemidbuff == "" then
		return
	end
	local num = 1
	if numbuff ~= "" then
		num = other.atoi(numbuff)
	end
	local toindex = -1
	if cdkey ~= "" then
		for i = 0, maxplayer do
			if char.check(i) == 1 then
				if char.getChar(i,"账号") == cdkey then
					toindex = i
					break
				end
			end
		end
		if toindex == -1 then
			char.newMessageToCli(charaindex, -1, "此账号不在线", "黄色")
			return
		end
	else
		toindex = charaindex
	end
	if char.check(toindex) == 1 then
		for i=1,num do
			if checkEmptItemNum(toindex) == 0 then
				char.newMessageToCli(charaindex, -1, "玩家" .. char.getChar(toindex,"名字") .. "物品栏位不足", "黄色")
				break
			end
			itemindex = char.Additem(toindex,other.atoi(itemidbuff))
			if item.check(itemindex) == 1 then
				if charaindex ~= toindex then
					char.TalkToCli(toindex, -1, "[GM]给你制作" .. item.getChar(itemindex,"名称") .. "成功", "黄色")
					char.TalkToCli(charaindex, -1, "成功为" .. char.getChar(toindex,"名字") .. "制作" .. item.getChar(itemindex,"名称"), "黄色")
				else
					char.TalkToCli(charaindex, -1, "制作%s成功" .. item.getChar(itemindex,"名称"), "黄色")
				end
			else
				char.newMessageToCli(charaindex, -1, "制作道具失败", "黄色")
				break
			end
		end
	end
	local f=io.open("./data/ablua/magic/log/" .. os.date("%Y%m%d",os.time()) .. ".txt","a+")
	f:write("cdkey:" .. char.getChar(charaindex,"账号") .. ",time:" .. os.date("%Y-%m-%d %H:%M:%S",os.time()) .. ",data:" .. data .. "\n")
	f:flush()
	f:seek("end",-1) --定位到文件末尾前一个字节
	f:close()
end

function main()
	magic.addLUAListFunction("additem", "additem", "", 3, "测试专用命令")
end

