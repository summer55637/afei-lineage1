function randluck(itemindex, charaindex, toindex, haveitemindex)
	local myluck = char.getInt(charaindex,"运气")
	if myluck < 1 then
		myluck = 1
	elseif myluck > 5 then
		myluck = 5
	end
	token = "　　　　　　　　  「 命运之神 」\n\n　　　　　  当前人物的幸运值 [" .. luckbuff[myluck] .. "]\n\n　您确认要刷新 " .. os.date("%Y-%m-%d", os.time()) .." 当前的幸运值吗\n\n　点击确定将消耗一枚命运之戒刷新当前运势"
	lssproto.windows(charaindex, "对话框", 12, 0, char.getWorkInt( npcindex, "对象"), token)
	char.setWorkInt(charaindex,"计时器",itemindex)
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 1 or select == 4 then
		local itemindex = char.getWorkInt(talkerindex,"计时器")
		if item.check(itemindex) == 0 then
			return
		end
		local j = -1
		for i=9,23 do
			if char.getItemIndex(talkerindex,i) == itemindex then
				j = i
				break
			end
		end
		if j == -1 then
			return
		end
		local myluck = char.getInt(talkerindex,"运气")
		local luckrand = math.random(1,100)
		if luckrand <= 20 then
			char.setInt(talkerindex,"运气",1)
		elseif luckrand <= 50 then
			char.setInt(talkerindex,"运气",2)
		elseif luckrand <= 70 then
			char.setInt(talkerindex,"运气",3)
		elseif luckrand <= 90 then
			char.setInt(talkerindex,"运气",4)
		else
			char.setInt(talkerindex,"运气",5)
		end
		if myluck == char.getInt(talkerindex,"运气") then
			if myluck == 1 then
				char.setInt(talkerindex,"运气",1 + 1)
			else
				char.setInt(talkerindex,"运气",myluck - 1)
			end
		end
		char.setInt(talkerindex,"运气时间",other.time())
		char.TalkToCli(talkerindex, -1, "[温馨提示]命运之戒生效，您现在的运气为 [" .. luckbuff[char.getInt(talkerindex,"运气")] .. "]", "随机色")
		char.DelItem(talkerindex, j)
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	luckbuff = {"凶","一般","小吉","中吉","大吉"}
end

function main()
	data()
	Create("MM大师", 101156, 777, 15, 13, 4)
	item.addLUAListFunction( "ITEM_RANDLUCK", "randluck", "")
end
