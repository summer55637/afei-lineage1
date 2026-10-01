function ShowList(meindex, talkerindex)
	local token = "3\n" .. char.getChar(meindex, "名字") .. "\n         购买道具"
	local point = char.getInt(talkerindex, "族战积分")
	token = "0|1|0|" .. char.getChar(meindex, "名字") .. "|sdfsdf|战点是参加族战而来，努力吧勇士！\n您当前战点："
	.. point .."|请输入你想购买的数量|您是否确定要买该物品？|您是否确定要买该物品？|您的道具栏已满|"
	for i = 1, #zhanitemid do
		if zhanitemid[i][1] > -1 then
			token = token .. item.getNameFromNumber(zhanitemid[i][1])
			if point < zhanitemid[i][2] then
				token = token .. "|1|"
			else
				token = token .. "|0|"
			end
			token = token .. "0|" .. zhanitemid[i][2] .. "|" .. item.getgraNoFromITEMtabl(zhanitemid[i][1]) .. "|" .. item.getItemInfoFromNumber(zhanitemid[i][1]) .. "|-1|"
		end
	end

	lssproto.windows(talkerindex, "买道具框", "确定", 1, char.getWorkInt( meindex, "对象"), token)
end

function BuyItem(meindex, talkerindex, id, num)
	if num < 1 then
		return
	end
	--对话框中选择确定
	local cost = zhanitemid[id][2];
	if char.getInt(talkerindex, "族战积分") >= cost * num then
		local icost = 0
		local inum = 0
		for i = 1, num do
			itemindex = char.Additem(talkerindex, zhanitemid[id][1])
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
				if itemindex == 22486 then
					item.setChar(itemindex,"名称","*" .. item.getChar(itemindex,"名称"))
				end
				item.UpdataItemOne(talkerindex, itemindex)
				char.setInt(talkerindex, "族战积分", char.getInt(talkerindex, "族战积分") - cost)
				icost = icost + cost
				inum = inum + 1
			else
				char.TalkToCli(talkerindex, -1, "[温馨提示]您身上的道具已满了，无法继续购买！", "随机色")
				break
			end
		end
		char.TalkToCli(talkerindex, -1, "[温馨提示]您已成功购买" .. inum .. "个 " .. item.getChar(itemindex, "名称") .. " 并扣除" .. icost .. "战点！", "随机色")
		--char.charSaveFromConnect(talkerindex)
		char.TalkToCli(talkerindex, -1, "系统自动为您存档!", "随机色");
	else
		char.TalkToCli(talkerindex, -1, "[温馨提示]您的战点不足购买此物品，请积极参加族战哦！", "随机色")
	end
	char.Updata(talkerindex, "石币")
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
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
		ShowList(meindex, talkerindex)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 then
		return
	end
	if seqno == 1 then
		local id = other.atoi(other.getString(data, "|", 1))
		local num = other.atoi(other.getString(data, "|", 2))

		BuyItem(meindex, talkerindex, id, num)
	end
end

function ShowHeadMenu(talkerindex)
		if char.getInt(talkerindex,"安全锁") > 0 then
			if char.getInt(talkerindex,"安全锁") == 1 then
				token = "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码"
			elseif char.getInt(talkerindex,"安全锁") == 2 then
				token = "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
			else
				token = "由于您的密码过于简单，并且异地登录。\n例如：密码非常简单或者全包含于账号。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。"
			end
			lssproto.windows(talkerindex, "输入框", "确定|取消", "安全锁", -1, token)
			return 0
		end
		ShowList(npcindex, talkerindex)
		return 0
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end
--21012,21013,21001,21003,21005,21007,20646,21027,21028,20780-20791
--50,    100,  100,  200,  500,  999,  500  ,2888 ,3888 ,6888
function data()
		zhanitemid = {	{20210,6}
						,{20211,6}
						,{20212,6}
						,{20213,6}
						,{21018,8}
						,{21019,6}
						--,{21106,88}
						,{22044,15}
						,{22046,50}
						,{22474,100}
						,{22456,200}
						,{22457,400}
						,{22460,500}
						,{24401,500}
						,{24402,777}
						,{25101,30}
						,{25111,30}
						,{25121,30}
						,{25131,30}
						
						}
end
function main()
	--第一个商店内容
	Create("战点商店", 24785, 777, 27, 21, 4)
	data()
end
