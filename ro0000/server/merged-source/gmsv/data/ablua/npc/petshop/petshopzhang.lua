function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 1, 5 do
		if char.getCharPet(charaindex, i - 1) == -1 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end
--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if npc.CheckEvent(talkerindex,701) ~= 0 then
			char.TalkToCli(talkerindex, meindex, "年轻人，你终于来了，我听村长说您要去尼斯大陆冒险？", "白色")
			char.TalkToCli(talkerindex, meindex, "这是我特意为您准备的宠物哦，它可是我们这个村庄的守护兽呢", "白色")
			char.TalkToCli(talkerindex, meindex, "我相信有它陪伴会让你在以后的冒险中不会孤独", "白色")
		else
			token = char.getChar(meindex,"名字") .. "|我已经听村长说了\n这是给新手冒险家准备的宠物\n同时也是这个村庄代代相传的守护者\n相信它会在你的旅途中\n作为你最坚实的护盾|1|领取新手战宠" 
			lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
		end
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 1 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num == 1 then
			if checkEmptPetNum(talkerindex) == 0 then
				char.newMessageToCli(talkerindex, -1, "您的宠物栏已满", "白色")
				return
			end
			if npc.CheckEvent(talkerindex,701) ~= 0 then
				char.newMessageToCli(talkerindex, -1, "您已领取过新手战宠", "白色")
				return
			end
			if char.getInt(talkerindex,"出生地") == 0 then--萨村
				char.AddPet(talkerindex, 1, 1)
				char.newMessageToCli(talkerindex, -1, "成功领取新手战宠", "白色")
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,701,0})
			elseif char.getInt(talkerindex,"出生地") == 1 then--玛丽娜丝
				char.AddPet(talkerindex, 2, 1)
				char.newMessageToCli(talkerindex, -1, "成功领取新手战宠", "白色")
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,701,0})
			elseif char.getInt(talkerindex,"出生地") == 2 then--加加
				char.AddPet(talkerindex, 3, 1)
				char.newMessageToCli(talkerindex, -1, "成功领取新手战宠", "白色")
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,701,0})
			elseif char.getInt(talkerindex,"出生地") == 3 then--卡鲁它那
				char.AddPet(talkerindex, 4, 1)
				char.newMessageToCli(talkerindex, -1, "成功领取新手战宠", "白色")
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,701,0})
			else
				return
			end
		end
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	
end

function main()
	data()
	Create("店长", 16016, 1003, 16, 13, 4)
	Create("宠物店长", 16035, 2006, 17, 17, 4)
	Create("店长", 16019, 3003, 12, 19, 4)
	Create("店长", 16017, 4003, 18, 18, 6)
end