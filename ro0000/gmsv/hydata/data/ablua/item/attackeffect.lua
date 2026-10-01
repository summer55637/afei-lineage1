function ITEM_ATTACKEFFECT(itemindex, charaindex, toindex, haveitemindex)
	lssproto.windows(charaindex, "宠物框", "取消", haveitemindex, char.getWorkInt( npcindex, "对象"), "")
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	--print("[attacheffect:WindowTalked]",meindex, talkerindex, seqno, select, data)
	if seqno >= 9 and seqno <= 23 then
		if data == "" then
			return
		end
		local petno = other.atoi(data)
		if petno < 1 or petno > 5 then
			return
		end
		local petindex = char.getCharPet(talkerindex,petno - 1)
		if char.check(petindex) ~= 1 then
			return
		end
		token = "您确定要给[" .. char.getChar(petindex,"名字") .. "]使用攻击特效吗？"
		lssproto.windows(talkerindex, "对话框", "确定|取消", seqno - 8 + petno * 100, char.getWorkInt( meindex, "对象"), token)
	elseif seqno > 100 and seqno < 600 then
		if select ~= 1 and select ~= 4 then
			return
		end
		local petno = math.floor(seqno / 100)
		local itemhaveindex = seqno % 100 + 8
		if itemhaveindex < 9 or itemhaveindex > 23 then
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, "无效物品索引."..itemhaveindex)
			return
		end
		local petindex = char.getCharPet(talkerindex,petno - 1)
		if char.check(petindex) ~= 1 then
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, "无效宠物索引.")
			return
		end
		local itemindex =  char.getItemIndex(talkerindex, itemhaveindex)
		if item.check(itemindex) ~= 1 then
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, "无效物品索引.")
			return
		end
		if item.getChar(itemindex,"使用函数名") ~= "ITEM_ATTACKEFFECT" then
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, "获取物品信息检查失败.")
			return
		end
		local itembuff = item.getChar(itemindex,"字段")
		if itembuff == "" then
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, "获取物品信息失败.")
			return
		end
		local attackeffectno = other.atoi(itembuff)
		-- if attackeffectno == 102218 then
		-- 	attackeffectno = 102200
		-- end
		local callFunc=other.CallFunction("petattuse", "data/ablua/npc/petatterrect/petatterrect.lua", {talkerindex,petindex,attackeffectno})
		--print("[attacheffect:WindowTalked]callFunc",callFunc,petindex,attackeffectno)
		if callFunc == 1 then
			char.DelItem(talkerindex, itemhaveindex)
			token = "您的[" .. char.getChar(petindex,"名字") .. "]已经获得攻击特效。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			char.sendStatusString(talkerindex,"K" .. petno - 1)
			--char.charSaveFromConnect(talkerindex)
		else
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, "添加特效失败.")
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	
end


function main()
	data()
	Create("宠物攻击特效", 100000, 777, 25, 39, 6)
	item.addLUAListFunction( "ITEM_ATTACKEFFECT", "ITEM_ATTACKEFFECT", "")
end