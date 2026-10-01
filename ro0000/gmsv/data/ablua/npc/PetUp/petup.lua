function ShowWindow(meindex, talkerindex, page, maxpage, seqno, token, mytype)
		TM_NowPage = page
		
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


function ShowReadMe( meindex, talkerindex, page)
		token = TM_ReadMe[page+1]
		
		if maxpage1 == 0 then
			button = 8
		elseif page == 0 and page < maxpage1 then
			button = 40
		elseif page > 0 and page < maxpage1 then
			button = 56
		elseif page == maxpage1 then
			button = 24
		end
		lssproto.windows(talkerindex, "对话框", button, 1100 + page, char.getWorkInt( meindex, "对象"), token)
end

function ShowPetReadMe( meindex, talkerindex, page)
		token = TM_PetReadMe[page+1]
		
		if maxpage2 == 0 then
			button = 8
		elseif page == 0 and page < maxpage2 then
			button = 40
		elseif page > 0 and page < maxpage2 then
			button = 56
		elseif page == maxpage2 then
			button = 24
		end
		lssproto.windows(talkerindex, "对话框", button, 4000 + page, char.getWorkInt( meindex, "对象"), token)
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "宠物进化系统|我可以让你宠物进化\n详细请看说明|3|开始宠物进化|功能介绍说明|宠物进化一览" 
		lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 1 then
		num = other.atoi(data)
		if num == 1 then -- 完全进化
			lssproto.windows(talkerindex, "宠物框", 8, 2, char.getWorkInt( meindex, "对象"), "")
		elseif num == 2 then
			--lssproto.windows(talkerindex, "对话框", 40, 15, char.getWorkInt( meindex, "对象"), TM_ReadMe[1])
			ShowReadMe(meindex, talkerindex, 0)
		elseif num == 3 then
			--lssproto.windows(talkerindex, "对话框", 40, 11, char.getWorkInt( meindex, "对象"), TM_PetReadMe[1])
			ShowPetReadMe(meindex, talkerindex, 0)
		end
	elseif seqno == 2 then  -- 完全进化
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		
		local MyPetIndexBuf = char.getCharPet(talkerindex,num-1)
		if char.check(MyPetIndexBuf) ~= 1 then
			char.newMessageToCli(talkerindex, -1, "该宠物栏位没有宠物哦", "白色")
			return
		end
		local MyPetId = char.getInt(MyPetIndexBuf,"宠ID")
		local MyPetName = char.getChar(MyPetIndexBuf,"名字")

		for i=1,#TM_PetId do
			if MyPetId == TM_PetId[i][1] then
				if char.getInt(MyPetIndexBuf,"转数") ~= 1 or char.getInt(MyPetIndexBuf,"等级") < 135 then
					char.newMessageToCli(talkerindex, -1, "没有达到1转135级的宠物不能进化二代", "白色")
					return
				end
				local TM_MyPet4v = PetUp_4v(MyPetIndexBuf)
				local TM_4vBuf = (TM_Pet4v[i] - TM_MyPet4v) * TM_PetVipPoint
				if TM_4vBuf < 1 then
					TM_4vBuf = 0
				end
				
				token = "您的 [" ..MyPetName.."] 已开放完全进化\n"
						.. "进化后可得到1级的["..TM_PetName[i].."]\n" 
						.. "目前宠物四维评分："..TM_MyPet4v.."\n"
						.. "需要宠物四维评分："..TM_Pet4v[i].."\n"
						.. "需要宠物碎片："..TM_PetId[i][2]
						.. "  + 需要机械玩偶："..TM_PetId[i][3].."\n"
				if TM_PetSW[i] > 0 then
					token = token .. "需要声望："..TM_PetSW[i].."\n"
				end
				if TM_PetHL[i] > 0 then
					token = token .. "需要活力："..TM_PetHL[i].."\n"
				end
				if TM_4vBuf > 0 then
					token = token .. "需要扣除金币："..TM_4vBuf.."\n补足一点评分需要贿赂我200金币哦！"
				end
				lssproto.windows(talkerindex, "对话框", "确定|取消", num + 10, char.getWorkInt( meindex, "对象"), token)
				return
			end
		end
		char.TalkToCli(talkerindex, meindex, "您的宠物 [" ..MyPetName.."] 不能进化二代哦!", "随机色")
	elseif seqno >= 11 and seqno <= 15 then
		if select ~= 1 then
			return
		end
		local MyPetIndexBuf = char.getCharPet(talkerindex,seqno - 11)
		if char.check(MyPetIndexBuf) ~= 1 then
			char.newMessageToCli(talkerindex, -1, "该宠物栏位没有宠物哦", "白色")
			return
		end
		local MyPetId = char.getInt(MyPetIndexBuf,"宠ID")
		local MyPetName = char.getChar(MyPetIndexBuf,"名字")

		for i=1,#TM_PetId do
			if MyPetId == TM_PetId[i][1] then
				if char.getInt(MyPetIndexBuf,"转数") ~= 1 or char.getInt(MyPetIndexBuf,"等级") < 135 then
					char.newMessageToCli(talkerindex, -1, "没有达到1转135级的宠物不能进化二代", "白色")
					return
				end
				local TM_MyPet4v = PetUp_4v(MyPetIndexBuf)
				local TM_4vBuf = (TM_Pet4v[i] - TM_MyPet4v) * TM_PetVipPoint
				if TM_4vBuf < 1 then
					TM_4vBuf = 0
				end
				if TM_PetSW[i] > 0 then
					if char.getInt(talkerindex,"声望") < TM_PetSW[i] * 100 then
						char.newMessageToCli(talkerindex, -1, "您的声望不足" .. TM_PetSW[i], "白色")
						lssproto.windows(talkerindex, 1038, 0, -1, -1, "3")
						return
					end
				end
				if TM_PetHL[i] > 0 then
					if char.getInt(talkerindex,"活力") < TM_PetHL[i] then
						char.newMessageToCli(talkerindex, -1, "您的活力不足" .. TM_PetHL[i], "白色")
						lssproto.windows(talkerindex, 1038, 0, -1, -1, "6")
						return
					end
				end
				local myvippoint = sasql.getVipPoint(talkerindex)
				if TM_4vBuf > 0 then
					if myvippoint < TM_4vBuf then
						char.newMessageToCli(talkerindex, -1, "您的金币不足" .. TM_4vBuf, "白色")
						lssproto.windows(talkerindex, 1038, 0, -1, -1, "2")
						return
					end
				end
				if npc.Free(meindex, talkerindex,"ITEM=21113*"..TM_PetId[i][2].."&ITEM=29062*"..TM_PetId[i][3]) == 1 then
            		npc.DelItem(talkerindex, "21113*"..TM_PetId[i][2]..",29062*"..TM_PetId[i][3])
				else
					char.newMessageToCli(talkerindex, -1, "道具兑换数不足", "白色")
					return
				end
				if TM_PetSW[i] > 0 then
					char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") - TM_PetSW[i] * 100)
					char.newMessageToCli(talkerindex,-1,"扣除" .. TM_PetSW[i] .. "声望","白色")
				end
				if TM_PetHL[i] > 0 then
					char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - TM_PetHL[i])
					char.setInt(talkerindex,"气势",char.getInt(talkerindex,"气势") + TM_PetHL[i] * 100)
					saacproto.ACFixFMData(talkerindex,12,char.getInt(talkerindex,"气势"),"")
					char.newMessageToCli(talkerindex,-1,"扣除" .. TM_PetHL[i] .. "活力","白色")
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,2,TM_PetHL[i]})
				end
				if TM_4vBuf > 0 then
					sasql.setVipPoint(talkerindex,myvippoint - TM_4vBuf)
					other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,TM_4vBuf})
					char.newMessageToCli(talkerindex,-1,"扣除" .. TM_4vBuf .. "金币","白色")
					token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -TM_4vBuf .. "," .. myvippoint .. "," .. myvippoint - TM_4vBuf .. ",'进化宠物扣除" .. TM_4vBuf .. "金币',NOW())"
					sasql.query(token)
				end
				char.DelPet(talkerindex, MyPetIndexBuf)
				local newpetindex = char.AddPet(talkerindex, TM_PetNewId[i],1)
				char.newMessageToCli(talkerindex, -1, "交出["..MyPetName.."]", "白色")
				char.newMessageToCli(talkerindex, -1, "宠物进化二代成功", "白色")
				token = "insert into `petup` values ('" .. char.getChar(talkerindex,"账号") .. "','" .. char.getChar(talkerindex,"名字") .. "','" .. char.getChar(newpetindex,"名字") .. "'," .. TM_PetNewId[i] .. ",NOW())"
				sasql.query(token)
				return
			end
		end
		char.newMessageToCli(talkerindex, -1, "您的宠物[" ..MyPetName.."]不能进化二代哦", "白色")
	elseif seqno >= 1100 and seqno < 2000 then
			num = seqno - 1100
			if select == 16 then
				ShowReadMe(meindex, talkerindex, num - 1)
			elseif select == 32 then
				ShowReadMe(meindex, talkerindex, num + 1)
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


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	TM_PetId = {{91,5,10},{92,5,10},{93,5,10},{94,5,10},{95,5,10},{74,5,10},{73,5,10},{71,5,10},{72,5,10},{191,5,10},{192,5,10},{193,5,10},{194,5,10}}--进化前的编号  21113,29062
	TM_PetNewId = {3001,3002,3003,3004,3005,3029,3030,3031,3032,3006,3007,3008,3009}--进化后的编号
	TM_Pet4v = {1280,1310,1310,1280,1310,1275,1320,1275,1310,1265,1265,1265,1275}--完全进化所需的评分值
	TM_PetSW = {1666,1666,1666,1666,1666,1666,1666,1666,1666,1666,1666,1666,1666}--完全进化所需的声望
	TM_PetHL = {600,600,600,600,600,800,800,800,800,600,600,600,600}--完全进化所需的活力
	
	TM_PetName = {"2D利则诺顿","2D扬奇洛斯","2D邦浦洛斯","2D邦奇诺","2D布鲁顿","布鲁多基","哈斯多基","毕格多基","普德多基","2D贝鲁卡","2D贝鲁伊卡","2D格鲁西斯","2D金格萨贝鲁"}--进化后的宠物名字
	TM_PetVipPoint = 300--差1点评分需要补足多少会员点
	TM_PetMin4v = 0--评分小于多少不能补会员点进化
	TM_ReadMe = {	
					"           ≡ 宠物进化二代 ≡\n\n宠物进化二代是原宠物消失，进化成一只新的宠物，等级变更为0转1级，成本比较高，有一定的风险，进化后只是起点比较高而已，未必会比原来的成长好，请三思而后进化。推荐有一定基础的玩家使用。",
					"           ≡ 宠物四维评分 ≡\n\n四维评分公式=攻击+防御+敏捷+血量/4\n弥补评分不足=(需求评分-目前四维评分)*2000\n\n由此可知，进化的合适等级为1转135+\n否则评分值不足就比较麻烦啦，相差不大的话推荐贿赂进化大师即可，相差很大就不合算了"
				}
	
	
	TM_PetReadMe = {"           ≡ 二代人龙系列 ≡\n\n利则诺顿-->2D利则诺顿  ★纯属性不解释\n扬奇洛斯-->2D扬奇洛斯  评分容易达到\n邦浦洛斯-->2D邦浦洛斯  成长相对较高\n邦 奇 诺-->2D邦 奇 诺  ★纯属性不解释\n布 鲁 顿-->2D布 鲁 顿  ★高攻高敏",
					"           ≡  狗年兽系列  ≡\n\n鲁尼帖斯1270-->布鲁多基  ★9/1属性不解释\n多萨金格1310-->哈斯多基  ★9/1属性不解释\n拉奇鲁哥1270-->毕格多基  ★纯属性不解释\n呼拔拔1310-->普德多基  ★纯属高攻高敏",
                    "           ≡  二代虎系列  ≡\n\n贝鲁卡1365-->2D贝鲁卡  ★9/1属性不解释\n贝鲁伊卡1365-->2D贝鲁伊卡  ★9/1属性不解释\n格鲁西斯1365-->2D格鲁西斯  ★9/1属性不解释\n金格萨贝鲁1375-->2D金格萨贝鲁  ★属高攻高敏",
					"           ≡  持续开发中  ≡\n\n\n      觉得好玩一定要叫朋友一起来哦！"
				}
				
	maxpage1 = #TM_ReadMe - 1
	maxpage2 = #TM_PetReadMe - 1
end


function PetUp_4v(petindex)
	local Resault = char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷")
	return math.floor(Resault)
end

function main()
	Create("二代宠物进化", 110119, 2005, 23, 1, 4)
	data()
end