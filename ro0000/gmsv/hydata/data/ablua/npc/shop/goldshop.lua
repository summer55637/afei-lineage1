function BuyItem(meindex, talkerindex, id, num)
	if num < 1 or num > 15 then
		return
	end
	if id < 1 or id > table.getn(itemid) then
		return
	end
	--对话框中选择确定
	local mygold = char.getInt(talkerindex,"石币")
	local cost = itemid[id][2];
	
	if mygold >= cost * num then
		local goldicost = 0
		local inum = 0
		for i = 1, num do
			itemindex = char.Additem(talkerindex, itemid[id][1])
			if itemindex > -1 then
				--item.setInt(itemindex, "颜色", 9)
				--if string.sub(item.getChar(itemindex,"名称"),1,1) ~= "*" then
				--	item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
				--end
				if item.getChar(itemindex,"名称") == "豪华船生鱼片" then
					item.setChar(itemindex,"字段","体1000")
					item.setChar(itemindex,"说明",item.getChar(itemindex,"说明") .. "(功效翻倍)")
					item.setInt(itemindex,"合成",1)
				end
				item.UpdataItemOne(talkerindex, itemindex)
				mygold = mygold - cost
				char.setInt(talkerindex,"石币",mygold)
				goldicost = goldicost + cost
				inum = inum + 1
			else
				char.newMessageToCli(talkerindex, -1, "道具空位不足,无法购买此物品", "随机色")
				break
			end
		end
		char.newMessageToCli(talkerindex, -1, "购买" .. inum .. "个 " .. item.getChar(itemindex, "显示名"), "随机色")
		if goldicost > 0 then
			char.newMessageToCli(talkerindex, -1, "扣除" .. goldicost .. "石币", "随机色")
		end
		--char.charSaveFromConnect(talkerindex)
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
	else
		char.newMessageToCli(talkerindex, -1, "石币不足以购买" .. num .. "个", "随机色")
	end
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
		--(1、金币2、声望3、战点4、石币5、宝石)
		local type = 4
		local shoptype = 8
		token = type .. "|" .. shoptype .. "|" .. table.getn(itemid)
		for i=1,table.getn(itemid) do
			token = token .. "|" .. item.getSecretNameFromNumber(itemid[i][1]) .. "|" .. item.getgraNoFromITEMtabl(itemid[i][1]) .. "|" .. itemid[i][2] .. "|" .. item.getItemInfoFromNumber(itemid[i][1])
		end
		lssproto.windows(talkerindex, 1034, 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "B" then
		local shoptype = other.getString(data,"|",2)
		if shoptype == "" then
			return
		end
		shoptype = other.atoi(shoptype)
		local itemlist = other.getString(data,"|",3)
		if itemlist == "" then
			return
		end
		itemlist = other.atoi(itemlist)
		local buynum = other.getString(data,"|",4)
		if buynum == "" then
			return
		end
		buynum = other.atoi(buynum)
		BuyItem(meindex, talkerindex, itemlist, buynum)
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	--道具ID，金币--
	itemid = {	 {28321,26}
				,{28322,22}
				,{12146,5}
				,{12186,10}
				}
end
function main()
	--第一个商店内容
	Create("生产指导员", 24956, 1009, 25, 20, 4)
	Create("生产指导员", 24956, 2009, 25, 23, 4)
	Create("生产指导员", 24956, 3009, 25, 32, 4)
	Create("生产指导员", 24956, 4009, 25, 20, 4)
	data()
end