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
	for i = 1, 5 do
		local petindex = char.getCharPet(charaindex, i - 1)
		if char.check(petindex) ~= 1 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "。。。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	end
--[[
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if npc.Free(meindex, talkerindex,"ENDEV=251") == 1 then
			npc.EvClr(talkerindex,"251")
		end
		if npc.Free(meindex, talkerindex,"ITEM=26104*5") == 1 then
			token = "你真的搜集到五个新春礼盒了么啊，你要和我换战斗鸡么？换了就不能反悔啦，不过我能告诉你的是，战斗鸡很强力哦，属性火5风5，战斗力惊人。"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
		elseif npc.Free(meindex, talkerindex,"NOWEV!=251") == 1 then
			if char.getInt(talkerindex,"转数") == 5 and char.getInt(talkerindex,"等级") == 140 then
				token = "\n勇士你好！这里有个限时任务你要接么？\n任务的时效限制：2017年2月28日 23:59\n\n事情大概是这样的，几只小鸡要报晓，遇到点麻烦，需要勇士去帮助他们，你有兴趣吗。\n这个任务可以重复做，想多做几次也可以的。"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 2, char.getWorkInt( meindex, "对象"), token)
			else
				char.TalkToCli(talkerindex, -1, "[温馨提示]您还没有5转140级哦，请达到后再来找我吧。", "随机色")
			end
		elseif npc.Free(meindex, talkerindex,"ENDEV=252&ENDEV=253&ENDEV=254") == 1 then
			if npc.Free(meindex, talkerindex,"ITEM=26101") == 1 then
				token = "哇，你真的帮他们解决了所有麻烦，那么这个礼盒就送给你啦，有很多好用的道具哦，你也可以凑齐五个和我换一只鸡年限时宠物-战斗鸡[火5风5]。"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 3, char.getWorkInt( meindex, "对象"), token)
			else
				char.TalkToCli(talkerindex, -1, "[温馨提示]你身上没有信物哦。", "随机色")
			end
		else
			if npc.Free(meindex, talkerindex,"ITEM=26101") == 1 then
				token = "打开信物查看下任务进度吧。"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			else
				token = "我的兄弟好像在阎罗四殿，我把我的信物放在那了，你去找他拿吧，如果连阎罗前三个殿主的考验都无法通过，看来你也不能帮小鸡们解决麻烦了！\n\n提醒一点哦，任务过程中的道具不能随便乱丢的，不然就只能重头开始了！"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		end
	end
	]]
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	token = "。。。"
	lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
--[[
	if select == 2 or select == 8 then
		return
	end
	if seqno == 1 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"ITEM=26104*5") == 1 then
				if checkEmptPetNum(talkerindex) == 0 then
					char.TalkToCli(talkerindex, -1, "[错误提示]您身上的宠物已经满啦。", "随机色")
					return
				end
				local petindex = char.AddPet(talkerindex,3130,1)
				if char.check(petindex) == 1 then
					npc.DelItemNum(talkerindex,"26104,5")
					char.TalkToCli(talkerindex, -1, "[温馨提示]恭喜您兑换了宠物[" .. char.getChar(petindex,"名字") .. "]。", "随机色")
				end
			else
				char.TalkToCli(talkerindex, -1, "[温馨提示]您身上没有五个新春礼包，不能兑换。", "随机色")
			end
		end
	elseif seqno == 2 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"NOWEV!=251") == 1 then
				if char.getInt(talkerindex,"转数") == 5 and char.getInt(talkerindex,"等级") == 140 then
					npc.EvNow(talkerindex,"251")
					token = "很好，你很勇敢，但是也要有一定的实力才能帮助他们呢。毕竟不是小麻烦，那么给你个考验吧，我的兄弟好像在阎罗四殿，我把我的信物放在那了，你去找他拿吧。"
					lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				else
					char.TalkToCli(talkerindex, -1, "[温馨提示]您还没有5转140级哦，请达到后再来找我吧。", "随机色")
				end
			else
				if npc.Free(meindex, talkerindex,"ITEM=26101") == 1 then
					token = "打开信物查看下任务进度吧。"
					lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				else
					token = "我的兄弟好像在阎罗四殿，我把我的信物放在那了，你去找他拿吧。"
					lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				end
			end
		end
	elseif seqno == 3 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"ENDEV=252&ENDEV=253&ENDEV=254") == 1 then
				if npc.Free(meindex, talkerindex,"ITEM=26101") == 1 then
					npc.DelItemNum(talkerindex,"26101,1")
					npc.EvClr(talkerindex,"251")
					npc.EvClr(talkerindex,"252")
					npc.EvClr(talkerindex,"253")
					npc.EvClr(talkerindex,"254")
					local itemindex = char.Additem(talkerindex,26104)
					if itemindex > -1 then
						char.TalkToCli(talkerindex, -1, "[温馨提示]新年快乐，恭喜您获得[" .. item.getChar(itemindex,"名称") .. "]。", "随机色")
					end
				else
					char.TalkToCli(talkerindex, -1, "[温馨提示]你身上没有信物哦。", "随机色")
				end
			end
		end
	elseif seqno == 4 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 3 then
			return
		end
		local haveitemindex = char.getWorkInt(talkerindex,"NPC临时1")
		if haveitemindex < 9 or haveitemindex > 23 then
			return
		end
		local itemindex = char.getItemIndex(talkerindex, haveitemindex)
		if itemindex > -1 then
			if item.getChar(itemindex,"使用函数名") ~= "ITEM_JI3" then
				return
			end
			char.DelItem(talkerindex,haveitemindex)
			local itemindexbuff = {"26111-26113","26114-26143","26144-26145"}
			local giveitemindex = npc.AddRandItem(talkerindex,itemindexbuff[num])
			if giveitemindex > -1 then
				char.TalkToCli(talkerindex, -1, "恭喜您得到[" .. item.getChar(giveitemindex,"名称") .. "]。", "随机色")
			end
		end
	end
	]]
end

function Talked4(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "。。。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	end
--[[
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if npc.Free(meindex, talkerindex,"ENDEV!=251&NOWEV=251&ITEM!=26101") == 1 then
			token = "\n哎呀，来的真巧，你是使迎春使者派来的么？\n你要这个信物啊，虽然我有很多但是也不是随便给人的，你要的话也可以，我要收你" .. xinwufame .. "声望或者" .. xinwupoint .. "点卷吧，不多不多的，意思一下总是要的，不然我就给别人了	。"
			lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
		else
			token = "你是来这里干嘛的？"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		end
	end
	]]
end

function WindowTalked4 ( meindex, talkerindex, seqno, select, data)
	token = "。。。"
	lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
--[[
	if select == 2 or select == 8 then
		return
	end
	if seqno == 1 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"ENDEV!=251&NOWEV=251&ITEM!=26101") == 1 then
				token = "4\n\n\n那你选择用什么方式和我换这个信物呢？\n\n"
					.. "　　　　　　　　　使用 ".. xinwufame .. " 声望\n"
					.. "　　　　　　　　　使用 ".. xinwupoint .. " 点卷\n"
				lssproto.windows(talkerindex, "选择框", "取消", 2, char.getWorkInt( meindex, "对象"), token)
			else
				token = "你是来这里干嘛的？"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		end
	elseif seqno == 2 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 2 then
			return
		end
		if npc.Free(meindex, talkerindex,"ENDEV!=251&NOWEV=251&ITEM!=26101") == 1 then
			if num == 1 then
				local myfame = char.getInt(talkerindex,"声望")
				if myfame < xinwufame * 100 then
					char.TalkToCli(talkerindex, -1, "使者的朋友：哎呀呀，你的声望不够的说，去攒点再来找我吧。", "随机色")
					return
				end
				char.setWorkInt(talkerindex,"NPC临时1",1)
				token = "\n\n你确定要用" .. xinwufame .. "声望来和我换这个信物的吧？换过就不能反悔了，我们可说好了哦！\n还有，不能和我迎春兄弟说这事，明白不？"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 3, char.getWorkInt( meindex, "对象"), token)
			elseif num == 2 then
				local mypoint = sasql.getVipPoint(talkerindex)
				if mypoint < xinwupoint then
					char.TalkToCli(talkerindex, -1, "使者的朋友：哎呀呀，你的点劵不够的说，去攒点再来找我吧。", "随机色")
					return
				end
				char.setWorkInt(talkerindex,"NPC临时1",2)
				token = "\n\n你确定要用" .. xinwupoint .. "点卷来和我换这个信物的吧？换过就不能反悔了，我们可说好了哦！\n还有，不能和我迎春兄弟说这事，明白不？"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 3, char.getWorkInt( meindex, "对象"), token)
			end
		end
	elseif seqno == 3 then
		num = char.getWorkInt(talkerindex,"NPC临时1")
		if num < 1 or num > 2 then
			return
		end
		if select == 1 then
			if npc.Free(meindex, talkerindex,"ENDEV!=251&NOWEV=251") == 1 then
				if checkEmptItemNum(talkerindex) == 0 then 
					char.TalkToCli(talkerindex, meindex, "使者的朋友：你的物品都满了，空一格再来吧。", "随机色")
					return
				end
				if num == 1 then
					local myfame = char.getInt(talkerindex,"声望")
					if myfame < xinwufame * 100 then
						char.TalkToCli(talkerindex, -1, "使者的朋友：哎呀呀，你的声望不够的说，去攒点再来找我吧。", "随机色")
						return
					end
					local itemindex = char.Additem(talkerindex,26101)
					if itemindex > -1 then
						char.setInt(talkerindex,"声望",myfame - xinwufame * 100)
						char.TalkToCli(talkerindex, -1, "使者的朋友：[" .. item.getChar(itemindex,"名称") .. "]已经给你了，那么这" .. xinwufame .. "声望我就收走了。", "随机色")
					end
				elseif num == 2 then
					local mypoint = sasql.getVipPoint(talkerindex)
					if mypoint < xinwupoint then
						char.TalkToCli(talkerindex, -1, "使者的朋友：哎呀呀，你的点劵不够的说，去攒点再来找我吧。", "随机色")
						return
					end
					local itemindex = char.Additem(talkerindex,26101)
					if itemindex > -1 then
						sasql.setVipPoint(talkerindex,mypoint - xinwupoint)
						other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,xinwupoint})
						char.TalkToCli(talkerindex, -1, "使者的朋友：[" .. item.getChar(itemindex,"名称") .. "]已经给你了，那么这" .. xinwupoint .. "点卷我就收走了。", "随机色")
					end
				end
			end
		end
	end
	]]
end

function Talked1(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "。。。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	end
	--[[
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if npc.Free(meindex, talkerindex,"ENDEV=252") == 1 then
			token = "感谢你帮我找到了我的铃铛，我的麻烦已经解决了，你去我的兄弟金鸡那边看看吧，它在波拉山顶。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		elseif npc.Free(meindex, talkerindex,"NOWEV=251") == 1 then
			if npc.Free(meindex, talkerindex,"ITEM=26102") == 1 then
				token = "哇，太感谢你了，帮我找到了我的铃铛。这实在太好了，我又可以带着他去打鸣了。我这边已经没有问题了，你去找我另外两个兄弟吧。"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
			else
				token = "我确实遇到点麻烦，我的铃铛不见了，被龙域的怪物拿走了，你带着使者的信物在龙域进攻的时候帮我抢回来吧或者去活力商店帮我买个新的。"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		else
			token = "。。。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		end
	end
	]]
end

function WindowTalked1 ( meindex, talkerindex, seqno, select, data)
	token = "。。。"
	lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	--[[
	if select == 2 or select == 8 then
		return
	end
	if seqno == 1 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"NOWEV=251") == 1 then
				if npc.Free(meindex, talkerindex,"ITEM=26102") == 1 then
					npc.DelItemNum(talkerindex,"26102,1")
					npc.EvEnd(talkerindex,"252")
				else
					token = "我确实遇到点麻烦，我的铃铛不见了，被龙域的怪物拿走了，你带着使者的信物在龙域进攻的时候帮我抢回来吧或者去活力商店帮我买个新的。"
					lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				end
			end
		end
	end
	]]
end

function Talked2(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "。。。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	end
	--[[
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if npc.Free(meindex, talkerindex,"ENDEV=253") == 1 then
			token = "感谢你帮我找到了那么棒的接班人，我的麻烦已经解决了，你去我的兄弟红鸡那边看看吧，它在哥亚山的洞窟山顶。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		elseif npc.Free(meindex, talkerindex,"ENDEV=252") == 1 then
			local zhao = -1
			local petindex = -1
			for i=0,4 do
				petindex = char.getCharPet(talkerindex,i)
				if char.check(petindex) == 1 then
					if char.getInt(petindex,"宠ID") == 292 then
						if math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "修正腕力") + char.getWorkInt(petindex, "修正耐力") + char.getWorkInt(petindex, "修正速度")) >= 1280 then
							zhao = i
							break
						end
					end
				end
			end
			if zhao > -1 then
				token = "哇，这只克克洛斯很有潜力哦，他的战斗力竟然达到" .. math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "修正腕力") + char.getWorkInt(petindex, "修正耐力") + char.getWorkInt(petindex, "修正速度")) .. "分"
					 .. "，是个好苗子，你确定要把它交给我来培养吗？给我了就不能反悔了，做个决定吧。"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
			else
				token = "我已经很年迈了，需要找个接班人，帮我找个战斗力超过1280分的克克洛斯来吧，我可以训练他成为新的金鸡。\n\n战斗力(评分) = 血量/4+攻击+防御+敏捷"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		else
			token = "。。。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		end
	end
	]]
end

function WindowTalked2 ( meindex, talkerindex, seqno, select, data)
	token = "。。。"
	lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	--[[
	if select == 2 or select == 8 then
		return
	end
	if seqno == 1 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"ENDEV=252") == 1 then
				local zhao = -1
				local petindex = -1
				for i=0,4 do
					petindex = char.getCharPet(talkerindex,i)
					if char.check(petindex) == 1 then
						if char.getInt(petindex,"宠ID") == 292 then
							if math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "修正腕力") + char.getWorkInt(petindex, "修正耐力") + char.getWorkInt(petindex, "修正速度")) >= 1280 then
								zhao = i
								break
							end
						end
					end
				end
				local petpoint = math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "修正腕力") + char.getWorkInt(petindex, "修正耐力") + char.getWorkInt(petindex, "修正速度"))
				local petlv = char.getInt(petindex, "等级")
				if zhao > -1 then
					char.DelPet(talkerindex,petindex)
					npc.EvEnd(talkerindex,"253")
					char.TalkToCli(talkerindex, -1, "交出[克克洛斯][Lv:" .. petlv .. "][战力:" .. petpoint .. "]", "随机色")
				else
					token = "我已经很年迈了，需要找个接班人，帮我找个战斗力超过1280分的克克洛斯来吧，我可以训练他成为新的金鸡。\n\n战斗力=血量/4+攻击+防御+敏捷"
					lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				end
			end
		end
	end
	]]
end


function Talked3(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "。。。"
		lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	end
	--[[
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if npc.Free(meindex, talkerindex,"ENDEV=254") == 1 then
			token = "感谢你为我们兄弟三人做的事，我们的麻烦都解决了，找使者大人去领奖吧。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		elseif npc.Free(meindex, talkerindex,"ENDEV=253") == 1 then
			if npc.Free(meindex, talkerindex,"ITEM=26103") == 1 then
				local itemindex = -1
				local zhao = -1
				for i = 9, 23 do
					itemindex = char.getItemIndex(talkerindex, i)
					if itemindex > -1 then
						if item.getInt(itemindex,"序号") == 26103 then
							if item.getChar(itemindex,"字段") == "3" then
								zhao = i
								break
							end
						end
					end
				end
				if zhao > -1 then
					token = "那么快就搜集到了三味草药，真是太厉害了，赶快把它交给我吧，合成了草珊瑚含片应该能很快治愈我的喉咙，太感谢你了。"
					lssproto.windows(talkerindex, "对话框", "确定|取消", 2, char.getWorkInt( meindex, "对象"), token)
				else
					token = "赶紧帮我去采药吧，都快天亮了，药名和位置都在药方上了。"
					lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
				end
			else
				if checkEmptItemNum(talkerindex) == 0 then 
					char.TalkToCli(talkerindex, meindex, "物品已满，请道具栏留有足够的空位！", "随机色")
					return
				end
				token = "我确实也遇到了麻烦，我的喉咙哑了，需要草珊瑚含片，药方我有，能帮我找齐这些药材么？"
				lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
			end
		else
			token = "。。。"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
		end
	end
	]]
end

function WindowTalked3 ( meindex, talkerindex, seqno, select, data)
	token = "。。。"
	lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
	--[[
	if select == 2 or select == 8 then
		return
	end
	if seqno == 1 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"ENDEV=253") == 1 then
				if npc.Free(meindex, talkerindex,"ITEM=26103") ~= 1 then
					char.Additem(talkerindex,26103)
					char.TalkToCli(talkerindex, -1, "得到红鸡的药方。", "随机色")
				end
			end
		end
	elseif seqno == 2 then
		if select == 1 then
			if npc.Free(meindex, talkerindex,"ENDEV=253") == 1 then
				if npc.Free(meindex, talkerindex,"ITEM=26103") == 1 then
					local itemindex = -1
					local zhao = -1
					for i = 9, 23 do
						itemindex = char.getItemIndex(talkerindex, i)
						if itemindex > -1 then
							if item.getInt(itemindex,"序号") == 26103 then
								if item.getChar(itemindex,"字段") == "3" then
									zhao = i
									break
								end
							end
						end
					end
					if zhao > -1 then
						char.DelItem(talkerindex,zhao)
						npc.EvEnd(talkerindex,"254")
						char.TalkToCli(talkerindex, -1, "交出[肿节风][金银花][薄荷脑]", "随机色")
					else
						token = "赶紧帮我去采药吧，都快天亮了，药名和位置都在药方上了。"
						lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
					end
				else
					if checkEmptItemNum(talkerindex) == 0 then 
						char.TalkToCli(talkerindex, meindex, "物品已满，请道具栏留有足够的空位！", "随机色")
						return
					end
					token = "我确实也遇到了麻烦，我的喉咙哑了，需要草珊瑚含片，药方我有，能帮我找齐这些药材么？"
					lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		end
	end
	]]
end

function ITEM_JI1(itemindex, charaindex, toindex, haveitemindex)
	if npc.Free(npcindex,charaindex,"ENDEV=252&ENDEV=253&ENDEV=254") == 1 then
		char.TalkToCli(charaindex, -1, "信物提示：您已帮所有小鸡解决了麻烦 找迎春使者拿礼品吧。", "随机色")
	else
		if npc.Free(npcindex,charaindex,"ENDEV=252") == 1 then
			token = "  √ 火鸡的麻烦：已完成"
		else
			token = "  × 火鸡的麻烦：未完成   火鸡所在位置：森林洞窟山顶:21.17"
		end
		char.TalkToCli(charaindex, -1, "   ", "随机色")
		char.TalkToCli(charaindex, -1, token, "随机色")
		if npc.Free(npcindex,charaindex,"ENDEV=253") == 1 then
			token = "  √ 金鸡的麻烦：已完成"
		else
			token = "  × 金鸡的麻烦：未完成   金鸡所在位置：波拉山顶:15.15"
		end
		char.TalkToCli(charaindex, -1, token, "随机色")
		if npc.Free(npcindex,charaindex,"ENDEV=254") == 1 then
			token = "  √ 红鸡的麻烦：已完成"
		else
			token = "  × 红鸡的麻烦：未完成   红鸡所在位置：哥亚山的洞窟山顶:14.15"
		end
		char.TalkToCli(charaindex, -1, token, "随机色")
	end
end

function ITEM_JI2(itemindex, charaindex, toindex, haveitemindex)
	local itemarg = item.getChar(itemindex,"字段")
	local myfloor = char.getInt(charaindex,"地图号")
	local myx = char.getInt(charaindex,"坐标X")
	local myy = char.getInt(charaindex,"坐标Y")
	if itemarg == "0" then
		if myfloor == 200 and myx >= 354 - 2 and myx <= 354 + 2 and myy >= 570 - 2 and myy <= 570 + 2 then
			char.TalkToCli(charaindex, -1, "采集提示：肿节风收集成功。", "随机色")
			item.setChar(itemindex,"字段","1")
			item.setChar(itemindex,"显示名",item.getChar(itemindex,"名称") .. "(1/3)")
			item.UpdataItemOne(charaindex,itemindex)
		else
			char.TalkToCli(charaindex, -1, "药方提示：[肿节风] 在 [加鲁卡] (354.570) 附近可以采到。", "随机色")
		end
	elseif itemarg == "1" then
		if myfloor == 500 and myx >= 232 - 2 and myx <= 232 + 2 and myy >= 276 - 2 and myy <= 276 + 2 then
			char.TalkToCli(charaindex, -1, "采集提示：金银花收集成功。", "随机色")
			item.setChar(itemindex,"字段","2")
			item.setChar(itemindex,"显示名",item.getChar(itemindex,"名称") .. "(2/3)")
			item.UpdataItemOne(charaindex,itemindex)
		else
			char.TalkToCli(charaindex, -1, "药方提示：[金银花] 在 [五十年前波拉岛] (232.276) 附近可以采到。", "随机色")
		end
	elseif itemarg == "2" then
		if myfloor == 21002 and myx >= 39 - 2 and myx <= 39 + 2 and myy >= 37 - 2 and myy <= 37 + 2 then
			char.TalkToCli(charaindex, -1, "采集提示：薄荷脑收集成功。", "随机色")
			item.setChar(itemindex,"字段","3")
			item.setChar(itemindex,"显示名",item.getChar(itemindex,"名称") .. "(3/3)")
			item.UpdataItemOne(charaindex,itemindex)
		else
			char.TalkToCli(charaindex, -1, "药方提示：[薄荷脑] 在 [琉璃的洞窟⒉楼] (39.37) 附近可以采到。", "随机色")
		end
	elseif itemarg == "3" then
		char.TalkToCli(charaindex, -1, "药方提示：我们已经搜集了所有草药，快去找红鸡吧。", "随机色")
	end
end

function ITEM_JI3(itemindex, charaindex, toindex, haveitemindex)
	if checkEmptItemNum(charaindex) == 0 then 
		char.TalkToCli(charaindex, -1, "[温馨提示]道具栏满咯，打不开礼包，请道具栏留有足够的空位！", "随机色")
		return
	end
	char.DelItem(charaindex,haveitemindex)
	--local itemindexbuff = {"26111-26113","26114-26143","26144-26145"}
	local giveitemindex = npc.AddRandItem(charaindex,"26111-26145")
	if giveitemindex > -1 then
		char.TalkToCli(charaindex, -1, "恭喜您得到[" .. item.getChar(giveitemindex,"名称") .. "]。", "随机色")
	end
	--[[char.setWorkInt(charaindex,"NPC临时1",haveitemindex)
	token = "3\n请选择您要的礼物\n\n\n"
		 .. "雄鸡唱韵[守护类精灵]\n"
		 .. "金鸡报晓[攻击类精灵]\n"
		 .. "红鸡啼夜[反转类精灵]\n"
	lssproto.windows(charaindex, "选择框", "取消", 4, char.getWorkInt( npcindex, "对象"), token)]]
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setWorkInt(npcindex,"NOTICE",120137)
	npc.CreateNpc("", 125038, floor, x, y, dir)
end

function Create1(name, metamo, floor, x, y, dir)
	npcindex1 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex1, "对话事件", "Talked1", "")
	char.setFunctionPointer(npcindex1, "窗口事件", "WindowTalked1", "")
end

function Create2(name, metamo, floor, x, y, dir)
	npcindex2 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex2, "对话事件", "Talked2", "")
	char.setFunctionPointer(npcindex2, "窗口事件", "WindowTalked2", "")
end

function Create3(name, metamo, floor, x, y, dir)
	npcindex3 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex3, "对话事件", "Talked3", "")
	char.setFunctionPointer(npcindex3, "窗口事件", "WindowTalked3", "")
end

function Create4(name, metamo, floor, x, y, dir)
	npcindex4 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex4, "对话事件", "Talked4", "")
	char.setFunctionPointer(npcindex4, "窗口事件", "WindowTalked4", "")
end

function data()
	xinwufame = 500
	xinwupoint = 300
end

function main()
	--Create1("报晓火鸡", 100367, 20105, 21, 17, 4)
	--Create2("报晓金鸡", 100368, 5509, 15, 15, 4)
	--Create3("报晓红鸡", 100370, 20406, 14, 15, 4)
	--Create4("使者的朋友", 70142, 40004, 8, 2, 6)
	--Create("迎春使者", 70013, 2005, 24, 8, 6)
	item.addLUAListFunction( "ITEM_JI1", "ITEM_JI1", "")
	item.addLUAListFunction( "ITEM_JI2", "ITEM_JI2", "")
	item.addLUAListFunction( "ITEM_JI3", "ITEM_JI3", "")
	data()
end