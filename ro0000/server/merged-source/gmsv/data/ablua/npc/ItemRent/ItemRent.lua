function ShowHead(meindex, talkerindex)
		token = char.getChar(meindex,"名字") .. "|选择你要的服务种类吧|2|鉴定装备属性|功能介绍说明" 
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
end

function ShowWindow(meindex, talkerindex, page, maxpage, seqno, token, mytype)
		char.setWorkInt(talkerindex,"NPC临时11",page)
		
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
			lssproto.windows(talkerindex, "新选择框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 2 then
			lssproto.windows(talkerindex, "对话框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		elseif mytype == 3 then
			lssproto.windows(talkerindex, "输入框", button, seqno, char.getWorkInt( meindex, "对象"), token)
		end
end

function ShowEquitUpReadMe( meindex, talkerindex, page)
		token = TM_ReadMe[page+1]
		local maxpage = table.getn(TM_ReadMe) - 1
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

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		ShowHead(meindex, talkerindex)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--char.talkToServer(meindex, "Seqno:"..seqno.." | select:"..select.." | data:"..data, "随机色")
	if select == 2 or select == 8 then
		return
	end
	if seqno == 0 then	--租用装备页面
		num = other.atoi(data)
		if num == 1 then
			local TM_equipname = {"没有道具","没有道具","没有道具","没有道具","没有道具"}
			for i = 9, 13 do
				local TempItemIndex = char.getItemIndex( talkerindex, i);
				if TempItemIndex > 0 then
					TM_equipname[i - 8] = item.getChar(TempItemIndex, "显示名")
				end
			end
			token = char.getChar(meindex,"名字") .. "|请确保鉴定装备在前5个栏位\n请选择你要鉴定的装备\n成功鉴定装备后扣200金币|5|" .. TM_equipname[1] .. "|" .. TM_equipname[2] .. "|" .. TM_equipname[3] .. "|" .. TM_equipname[4] .. "|" .. TM_equipname[5]
			char.setWorkInt(talkerindex,"NPC临时1",1)
			ShowWindow(meindex, talkerindex, 1, 3, 2, token, 1)
		elseif num == 2 then -- 系统说明
			ShowEquitUpReadMe(meindex, talkerindex, 0)
		end	
		elseif seqno == 2 then
		local TM_equipname = {"没有道具","没有道具","没有道具","没有道具","没有道具"}
		local TM_equipid = {{9,13},{14,18},{19,23}}
		if select == 16 then
			if char.getWorkInt(talkerindex,"NPC临时1") <= 1 or char.getWorkInt(talkerindex,"NPC临时1") > 3 then
				return
			end
			for i = TM_equipid[char.getWorkInt(talkerindex,"NPC临时1") - 1][1], TM_equipid[char.getWorkInt(talkerindex,"NPC临时1") - 1][2] do
				local TempItemIndex = char.getItemIndex( talkerindex, i);
				if TempItemIndex > 0 then
					TM_equipname[i - TM_equipid[char.getWorkInt(talkerindex,"NPC临时1") - 1][1] + 1] = item.getChar(TempItemIndex, "显示名")
				end
			end
			token = char.getChar(meindex,"名字") .. "|鉴定装备在前5个栏位\n请选择你要鉴定的装备\n成功鉴定装备后扣200金币|5|" .. TM_equipname[1] .. "|" .. TM_equipname[2] .. "|" .. TM_equipname[3] .. "|" .. TM_equipname[4] .. "|" .. TM_equipname[5]
			char.setWorkInt(talkerindex,"NPC临时1",char.getWorkInt(talkerindex,"NPC临时1") - 1)
			ShowWindow(meindex, talkerindex, char.getWorkInt(talkerindex,"NPC临时1"), 3, 2, token, 1)
			return
		elseif select == 32 then
			if char.getWorkInt(talkerindex,"NPC临时1") < 1 or char.getWorkInt(talkerindex,"NPC临时1") >= 3 then
				return
			end
			for i = TM_equipid[char.getWorkInt(talkerindex,"NPC临时1") + 1][1], TM_equipid[char.getWorkInt(talkerindex,"NPC临时1") + 1][2] do
				local TempItemIndex = char.getItemIndex( talkerindex, i)
				if TempItemIndex > 0 then
					TM_equipname[i - TM_equipid[char.getWorkInt(talkerindex,"NPC临时1") + 1][1] + 1] = item.getChar(TempItemIndex, "显示名")
				end
			end
			token = char.getChar(meindex,"名字") .. "|鉴定装备在前5个栏位\n请选择你要鉴定的装备\n成功鉴定装备后扣200金币|5|" .. TM_equipname[1] .. "|" .. TM_equipname[2] .. "|" .. TM_equipname[3] .. "|" .. TM_equipname[4] .. "|" .. TM_equipname[5]
			char.setWorkInt(talkerindex,"NPC临时1",char.getWorkInt(talkerindex,"NPC临时1") + 1)
			ShowWindow(meindex, talkerindex, char.getWorkInt(talkerindex,"NPC临时1"), 3, 2, token, 1)
			return
		end
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		local uppage = char.getWorkInt(talkerindex,"NPC临时1")
		if uppage < 1 or uppage > 3 then
			return
		end
		local myitemindex = char.getItemIndex( talkerindex, TM_equipid[uppage][1] + num - 1)

		if item.check(myitemindex) ~= 1 then
			char.TalkToCli(talkerindex, meindex, "该道具栏无装备！", "随机色")
			return
		end
		if sasql.getVipPoint(talkerindex) < 200 then
				char.newMessageToCli(talkerindex, -1, "您的金币不足200", "白色")
			return
		end
						
		ShowItemOne(meindex, talkerindex, num + 8)
		return
		elseif seqno >= 4000 and seqno < 5000 then
		num = seqno - 4000
		if select == 16 then
			ShowEquitUpReadMe(meindex, talkerindex, num - 1)
		elseif select == 32 then
			ShowEquitUpReadMe(meindex, talkerindex, num + 1)
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

function ShowItem( meindex, charindex, page)
	start = 0
	button = 8
	if page == 8 then
		start = 9
		button = 40
	elseif page == 9 then
		start = 14
		button = 56
	elseif page == 10 then
		start = 19
		button = 24
	end

	token = "3\n                  " .. char.getChar(meindex, "名字") .. "\n请问你要鉴定哪个呢？\n"

	for i=start, start + 4 do
		itemindex = char.getItemIndex(charindex, i)
		if itemindex == -1 then
			token = token .. "\n　　　　　　道具栏" .. i - 8 .. "：没有道具"
		else
			token = token .. "\n　　　　　　道具栏" .. i - 8 .. "：" .. item.getChar(itemindex, "名称")
		end
	end
	
	lssproto.windows(charindex, "选择框", button, page, char.getWorkInt( meindex, "对象"), token)
end

function ShowItemOne( meindex, charindex, id)		 
	itemindex = char.getItemIndex(charindex, id)
	if itemindex == -1 then
		char.TalkToCli(charindex, meindex, "该位置并不存在物品！", "随机色")
		return
	else
		token = "                  " .. char.getChar(meindex, "名字") .. "\n"
					.. "道具栏" .. id .. "：" .. item.getChar(itemindex, "名称") .. "\n"
					.. string.format("\n攻击:%-8d防御:%-8d敏捷:%-8d", item.getInt(itemindex, "攻"), item.getInt(itemindex, "防"), item.getInt(itemindex, "敏"))
					.. string.format("\n运气:%-8d魅力:%-8d回避:%-8d", item.getInt(itemindex, "运气"), item.getInt(itemindex, "魅力"), item.getInt(itemindex, "回避"))
					--.. string.format("\n毒耐:%-8d麻耐:%-8d睡耐:%-8d", item.getInt(itemindex, "毒耐"), item.getInt(itemindex, "麻耐"), item.getInt(itemindex, "睡耐"))
					--.. string.format("\n石耐:%-8d酒耐:%-8d混耐:%-8d", item.getInt(itemindex, "石耐"), item.getInt(itemindex, "酒耐"), item.getInt(itemindex, "混耐"))
		--token = token .. "\n\n物品成份："
		for i=0, 4 do
		--if item.getChar(itemindex, "成份名" .. i) ~= "" then
				--token = token .. item.getChar(itemindex, "成份名" .. i) .. ":" .. item.getInt(itemindex, "份量" .. i) .. "  "
		end
	end
	
		lssproto.windows(charindex, "对话框", 8, -1, char.getWorkInt( meindex, "对象"), token)
	
	
	
	--这里加物品说明的修改
		local TM_OldSM = item.getChar(itemindex, "说明")
		--print("\n 原始的物品说明 "..TM_OldSM)
		--取最后一个问号
		local chuld
		local chuld1

		if string.find(TM_OldSM, '?') ~= nil then
			local i = 0
			local to = 0
			local t = {}
			
			while true do
				--print("\n 最后一个问号位置 %d",i)
				 i = string.find(TM_OldSM,'?',i+1)
				 --print("\n 最后一个问号位置1 %d",i)
				 if i == nil then
				 break
				 else
				 to = i
				 end
				 t[#t+1] = i
			end
			--print("\n 最后一个问号位置2 %d",to)
			chuld = string.sub(TM_OldSM,to+1,string.len(TM_OldSM))
			--[[
			if  string.find(item.getChar(itemindex, "名称"), '合成斧') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成棍') ~= nil  
			or  string.find(item.getChar(itemindex, "名称"), '合成枪') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成爪') ~= nil
			or  string.find(item.getChar(itemindex, "名称"), '合成弓') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成回') ~= nil
			or  string.find(item.getChar(itemindex, "名称"), '合成石') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成兜') ~= nil
			or  string.find(item.getChar(itemindex, "名称"), '合成防') ~= nil	or  string.find(item.getChar(itemindex, "名称"), '合成铠') ~= nil 
			or  string.find(item.getChar(itemindex, "名称"), '合成手') ~= nil   then
			print("\n 最后发现武器名字 %s",item.getChar(itemindex, "名称"))
			end
			--]]
		end
		
		if string.find(TM_OldSM, '？') ~= nil then
			local i1 = 0
			local to1 = 0
			local t1 = {}
			--print("\n 大位置的查找 %d",string.find(TM_OldSM, '？'))
			while true do
				--print("\n 最后2个问号位置 %d",i1)
				 i1 = string.find(TM_OldSM,'？',i1+1)
				 --print("\n 最后一个问号位置1 %d",i)
				 if i1 == nil then
				 break
				 else
				 to1 = i1
				 end
				 t1[#t1+1] = i1
			end
			--print("\n 最后2个问号位置2 %d",to1)
			chuld1 = string.sub(TM_OldSM,to1+2,string.len(TM_OldSM))--大写的要加2？
			--print("\n 最后2个问号位置2 %s",chuld1)
		end

		if ( string.find(TM_OldSM, '?') ~= nil or string.find(TM_OldSM, '？') ~= nil )
		and 
		( (string.find(item.getChar(itemindex, "名称"), '合成斧') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成棍') ~= nil  
		or  string.find(item.getChar(itemindex, "名称"), '合成枪') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成爪') ~= nil
		or  string.find(item.getChar(itemindex, "名称"), '合成弓') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成回') ~= nil
		or  string.find(item.getChar(itemindex, "名称"), '合成石') ~= nil or  string.find(item.getChar(itemindex, "名称"), '合成兜') ~= nil
		or  string.find(item.getChar(itemindex, "名称"), '合成投') ~= nil	or  string.find(item.getChar(itemindex, "名称"), '合成服') ~= nil
		or  string.find(item.getChar(itemindex, "名称"), '合成防') ~= nil	or  string.find(item.getChar(itemindex, "名称"), '合成铠') ~= nil 
		or  string.find(item.getChar(itemindex, "名称"), '合成手') ~= nil  )
		)		
		then
			 local tokenatt = string.format("攻:%d ", item.getInt(itemindex, "攻"))
			 --print("\n 真实的攻击数据 长度是：%d"..tokenatt ,string.len(tokenatt) )
			 local tokenfan = string.format("防:%d ", item.getInt(itemindex, "防"))
			--print("\n 真实的防御数据 "..tokenfan)
			 local tokenmin = string.format("敏:%d ", item.getInt(itemindex, "敏"))
			 --加上其他数据一次性写好
			local tokenHP = string.format("HP:%d ", item.getInt(itemindex, "HP"))
			local tokenMP = string.format("MP:%d ", item.getInt(itemindex, "MP"))
			local tokenHARM = string.format("魅:%d ", item.getInt(itemindex, "魅力"))

			
			local alltoken;
			
			if item.getInt(itemindex, "攻") ~= 0 then
				if item.getInt(itemindex, "攻") > 0 then					
					tokenatt = tokenatt .. ' '
				end
				if alltoken ~= nil then
					alltoken = alltoken..tokenatt
				else
					alltoken = tokenatt
				end	
			end
			
			
			if item.getInt(itemindex, "防") ~= 0 then
				--print("\n 真实的攻击数据写入1 ")
				if item.getInt(itemindex, "防") > 0 then					
					tokenfan = tokenfan .. ' '
				end
				if alltoken ~= nil then
					--print("\n 真实的写入 "..tokenfan)
					alltoken = alltoken..tokenfan
				else
					--print("\n alltoken是 0 ")
					alltoken = tokenfan
					--print("\n alltoken是 ".. alltoken)
				end				
			end
			if item.getInt(itemindex, "敏") ~= 0 then
				if item.getInt(itemindex, "敏") > 0 then					
					tokenmin = tokenmin .. ' '
				end
				if alltoken ~= nil then
					--print("\n 真实的写入 "..tokenmin)
					alltoken = alltoken..tokenmin
				else
					--print("\n alltoken是 0 ")
					alltoken = tokenmin
				end			
			end
			
			if item.getInt(itemindex, "HP") ~= 0 then
				if item.getInt(itemindex, "HP") > 0 then					
					tokenHP = tokenHP .. ' '
				end
				if alltoken ~= nil then
					--print("\n 真实的写入 "..tokenmin)
					alltoken = alltoken..tokenHP
				else
					--print("\n alltoken是 0 ")
					alltoken = tokenHP
				end			
			end
			
			if item.getInt(itemindex, "MP") ~= 0 then
				if item.getInt(itemindex, "MP") > 0 then					
					tokenMP = tokenMP .. ' '
				end
				if alltoken ~= nil then
					--print("\n 真实的写入 "..tokenmin)
					alltoken = alltoken..tokenMP
				else
					--print("\n alltoken是 0 ")
					alltoken = tokenMP
				end			
			end
			
			if item.getInt(itemindex, "魅力") ~= 0 then
				if item.getInt(itemindex, "魅力") > 0 then					
					tokenHARM = tokenHARM .. ' '
				end
				if alltoken ~= nil then
					--print("\n 真实的写入 "..tokenmin)
					alltoken = alltoken..tokenHARM
				else
					--print("\n alltoken是 0 ")
					alltoken = tokenHARM
				end			
			end

		--print("\n 要写入的物品说明0 "..alltoken)

		if chuld ~= nil then
			--print("\n 小写全部物品说明 "..alltoken..chuld)
			item.setChar(itemindex, "说明", alltoken..chuld)--ok
			item.setChar(itemindex, "显示名", item.getChar(itemindex, "名称"),"kk")
			item.UpdataItemOne(charindex, itemindex)
			char.TalkToCli(charindex, -1, item.getChar(itemindex, "名称") .. " 鉴定成功，真实属性为：" .. item.getChar(itemindex, "说明"), "随机色")	
			local myvippoint = sasql.getVipPoint(charindex)
		local jdpoint = 200
		sasql.setVipPoint(charindex,sasql.getVipPoint(charindex) - 200)
		other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {charindex,200})
		token = "insert into `VipPointLog` values ('" .. char.getChar(charindex,"账号") .. "'," .. -jdpoint .. "," .. myvippoint .. "," .. myvippoint - jdpoint .. ",'鉴定装备扣除" .. jdpoint .. "金币',NOW())"								
		sasql.query(token)
		char.newMessageToCli(charindex, -1, "扣除200金币", "白色")	
		end
		--print("\n 大写 %d ",string.len(chuld1))
		if chuld1 ~= nil then
			--print("\n 大写全部物品说明 "..alltoken..chuld1)
			item.setChar(itemindex, "说明", alltoken    ..chuld1)--ok
			item.setChar(itemindex, "显示名", item.getChar(itemindex, "名称"),"kk")
			item.UpdataItemOne(charindex, itemindex)
			char.TalkToCli(charindex, -1, item.getChar(itemindex, "名称") .. " 鉴定成功，真实属性为：" .. item.getChar(itemindex, "说明"), "随机色")	
		local myvippoint = sasql.getVipPoint(charindex)
		local jdpoint = 200
		sasql.setVipPoint(charindex,sasql.getVipPoint(charindex) - 200)
		other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {charindex,200})
		token = "insert into `VipPointLog` values ('" .. char.getChar(charindex,"账号") .. "'," .. -jdpoint .. "," .. myvippoint .. "," .. myvippoint - jdpoint .. ",'鉴定装备扣除" .. jdpoint .. "金币',NOW())"								
		sasql.query(token)
		char.newMessageToCli(charindex, -1, "扣除200金币", "白色")		
		end
			
	end
		--物品说明修改完毕 

end
--end

function data()			
	TM_Gold = {{5,10,15,30},{5,10,15,30},{5,10,15,30},{5,10,15,30}}
	
	TM_Vigor = {{10,20,40,80},{10,20,40,80},{10,20,40,80},{10,20,40,80}}
	
	TM_Point = {{0,0,0,0},{0,0,0,0}}
	
	TM_XL = {10,100}
	
									 
	TM_ReadMe = {	"　　　　　　　『装备鉴定』\n\n这个功能可以鉴定你一切道具的真实属性，不用再自己加加减减了，另外我们在摆摊中也加入了真实属性的显示，所以贩卖装备也非常方便，不用担心上当受骗的哦，赶快去试试吧！\n成功后扣除200金币",
				};		

	TM_equipid = {0,1,2,3,4}

end

function main()
	data()
	--Create("装备鉴定师", 26855, 2005, 28, 1, 4)
end