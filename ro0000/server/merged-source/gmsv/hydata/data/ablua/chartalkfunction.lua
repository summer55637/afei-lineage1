function checkEmptItemNum(charaindex)
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			return i
		end
	end
	return -1
end

function CharTalkFunction2( charaindex, message, color)
	if message == nil then
		return 1
	end
	if string.len(message) < 1 then
		return 1
	end
	local TM_NoText = {"45681545","超级石器","17495","789石器","苹果石器","MY石器","myshiqi","007sa","93956981","200963558","挂绿暴","拒绝傻逼","Gm","gM","GM","倒闭","服务器","黑服","报警","报案","菲陆","茶叶","脱坑","弃坑","黑幕","改宠","瞬移","关服","公司","新服"}   --任何人都看不见变成HI
	local TM_NoTexti = 0
	for TM_NoTexti = 1, #TM_NoText do
		--[[str, len = string.gsub(message, TM_NoText[TM_NoTexti], "")
		if len > 0 then
			return 1
		end]]
		if string.len(message) > 0 then
			if string.find(message,TM_NoText[TM_NoTexti]) ~= nil then
				return 1
			end
		end
	end
	
	return 0
end

function petlookup ( charaindex, petindex )
	local petlevel = char.getInt( petindex, "等级" )
	local Pet_4V_1 = char.getChar( petindex, "宠物四围" )
	
	local Pet_HP_1 = other.atoi(other.getString(Pet_4V_1, "|", 1))
	local Pet_Str_1 = other.atoi(other.getString(Pet_4V_1, "|", 2))
	local Pet_Tough_1 = other.atoi(other.getString(Pet_4V_1, "|", 3))
	local Pet_Dex_1 = other.atoi(other.getString(Pet_4V_1, "|", 4))
	local Pet_old_lv = other.atoi(other.getString(Pet_4V_1, "|", 5))
	local Pet_HP_now = char.getWorkInt(petindex, "最大HP")
	local Pet_Str_now = char.getWorkInt(petindex, "修正腕力")
	local Pet_Tough_now = char.getWorkInt(petindex, "修正耐力")
	local Pet_Dex_now = char.getWorkInt(petindex, "修正速度")
	local Pet_Lv_tmp = petlevel - Pet_old_lv
	local Pet_Str_up,Pet_Tough_up,Pet_Dex_up,Pet_HP_up,Pet_HP_140,Pet_Str_140,Pet_Tough_140,Pet_Dex_140,Pet_Point
	if Pet_Lv_tmp == 0 then
		Pet_Str_up = string.format("%.2f",0)
		Pet_Tough_up = string.format("%.2f",0)
		Pet_Dex_up = string.format("%.2f",0)
		Pet_HP_up = string.format("%.2f",0)
		Pet_HP_140 = math.floor(Pet_Lv_tmp * Pet_HP_up + Pet_HP_1)
		Pet_Str_140 = math.floor(Pet_Lv_tmp * Pet_Str_up + Pet_Str_1)
		Pet_Tough_140 = math.floor(Pet_Lv_tmp * Pet_Tough_up + Pet_Tough_1)
		Pet_Dex_140 = math.floor(Pet_Lv_tmp * Pet_Dex_up + Pet_Dex_1)
		Pet_up_num = string.format("%.3f",Pet_Str_up + Pet_Tough_up + Pet_Dex_up)
		Pet_Point = math.floor(Pet_HP_140/4 + Pet_Str_140 + Pet_Tough_140 + Pet_Dex_140)
	else
		Pet_Str_up = (Pet_Str_now - Pet_Str_1) / Pet_Lv_tmp
		Pet_Tough_up = (Pet_Tough_now - Pet_Tough_1) / Pet_Lv_tmp
		Pet_Dex_up = (Pet_Dex_now - Pet_Dex_1) / Pet_Lv_tmp
		Pet_HP_up = (Pet_HP_now - Pet_HP_1) / Pet_Lv_tmp
		Pet_HP_140 = math.floor((140-petlevel) * Pet_HP_up + Pet_HP_now)
		Pet_Str_140 = math.floor((140-petlevel) * Pet_Str_up + Pet_Str_now)
		Pet_Tough_140 = math.floor((140-petlevel) * Pet_Tough_up + Pet_Tough_now)
		Pet_Dex_140 = math.floor((140-petlevel) * Pet_Dex_up + Pet_Dex_now)
		Pet_up_num = string.format("%.3f",Pet_Str_up + Pet_Tough_up + Pet_Dex_up)
		Pet_Point = math.floor(Pet_HP_140/4 + Pet_Str_140 + Pet_Tough_140 + Pet_Dex_140)
	end
	
	if char.getWorkInt(charaindex,"战斗") == 0 then
		local token = "[" .. char.getChar( petindex, "名字" ) .. "]成长信息如下"
		if char.getInt( petindex, "极品" ) > 0 then
			token = token .. " [回炉" .. char.getInt( petindex, "极品" ) .."次]\n"
		else
			token = token .. "\n"
		end
		token = token .. "         等级  耐力 √ 攻击  防御  敏捷\n" ..
					"当前状态  " .. string.format("%-5s", petlevel) .. string.format("%-8s", Pet_HP_now) .." ".. string.format("%-5s", Pet_Str_now) .." ".. string.format("%-5s", Pet_Tough_now) .." ".. Pet_Dex_now .. "\n" ..
					"成 长 率       " .. string.format("%-8s", string.format("%.2f",Pet_HP_up)) .. string.format("%-6s", string.format("%.2f",Pet_Str_up)) .. string.format("%-6s", string.format("%.2f",Pet_Tough_up)) .. string.format("%.2f",Pet_Dex_up) .. "\n" ..
					"预测状态  " .. string.format("%-5s", "140") .. string.format("%-8s", Pet_HP_140) .." ".. string.format("%-5s", Pet_Str_140)  .." ".. string.format("%-5s", Pet_Tough_140)  .." ".. Pet_Dex_140 .. "\n" ..
					"=======================================\n" ..
					"三围成长：" .. string.format("%-11s", Pet_up_num) .. "满级评分预测：" .. Pet_Point .. "\n"
		if char.getInt(petindex, "提升值") > 0 then
			token = token .. "祝福属性："
			if char.getRightTo8(char.getInt(petindex, "提升值"), 3) > 0 then
				token = token .. "[地]"
			end
			if char.getRightTo8(char.getInt(petindex, "提升值"), 1) > 0 then
				token = token .. "[水]"
			end
			if char.getRightTo8(char.getInt(petindex, "提升值"), 2) > 0 then
				token = token .. "[火]"
			end
			if char.getRightTo8(char.getInt(petindex, "提升值"), 4) > 0 then
				token = token .. "[风]"
			end
			token = token .. "\n"
		end
				  
		token = token .. "友情提示：宠物等级越高，预测越准哦！"
		lssproto.windows(charaindex, "对话框", "YES", 0, -1, token)
	else
		local token = "　　[" .. char.getChar( petindex, "名字" ) .. "]成长信息如下"
		if char.getInt( petindex, "极品" ) > 0 then
			token = token .. " [回炉" .. char.getInt( petindex, "极品" ) .."次]"
		end
		char.TalkToCli(charaindex, -1,token, "黄色")
		token = "　　         等级  耐力 √ 攻击  防御  敏捷"
		char.TalkToCli(charaindex, -1,token, "黄色")
		token = "　　当前状态  " .. string.format("%-5s", petlevel) .. string.format("%-8s", Pet_HP_now) .." ".. string.format("%-5s", Pet_Str_now) .." ".. string.format("%-5s", Pet_Tough_now) .." ".. Pet_Dex_now
		char.TalkToCli(charaindex, -1,token, "黄色")
		token = "　　成 长 率       " .. string.format("%-8s", string.format("%.2f",Pet_HP_up)) .. string.format("%-6s", string.format("%.2f",Pet_Str_up)).. string.format("%-6s", string.format("%.2f",Pet_Tough_up)) .. string.format("%.2f",Pet_Dex_up)
		char.TalkToCli(charaindex, -1,token, "黄色")
		token = "　　预测状态  " .. string.format("%-5s", "140") .. string.format("%-8s", Pet_HP_140) .." ".. string.format("%-5s", Pet_Str_140)  .." ".. string.format("%-5s", Pet_Tough_140)  .." ".. Pet_Dex_140
		char.TalkToCli(charaindex, -1,token, "黄色")
		token = "　　======================================="
		char.TalkToCli(charaindex, -1,token, "黄色")
		token = "　　三围成长：" .. string.format("%-11s", Pet_up_num) .. "满级评分预测：" .. Pet_Point
		char.TalkToCli(charaindex, -1,token, "17")
		if char.getInt(petindex, "提升值") > 0 then
			token = "　　祝福属性："
			if char.getRightTo8(char.getInt(petindex, "提升值"), 3) > 0 then
				token = token .. "[地]"
			end
			if char.getRightTo8(char.getInt(petindex, "提升值"), 1) > 0 then
				token = token .. "[水]"
			end
			if char.getRightTo8(char.getInt(petindex, "提升值"), 2) > 0 then
				token = token .. "[火]"
			end
			if char.getRightTo8(char.getInt(petindex, "提升值"), 4) > 0 then
				token = token .. "[风]"
			end
			char.TalkToCli(charaindex, -1,token, "9")
		end
		token = "　　友情提示：宠物等级越高，预测越准哦！"
		char.TalkToCli(charaindex, -1,token, "9")
	end
end

function CharTalkFunction( charaindex, message, color,itempetbuff,uid,volumeLen)
	if message == nil then
		return 1
	end
	if string.len(message) < 1 then
		return 1
	end
	local field = other.getString(message, " ", 1)
	if field == "/WD" then
		if string.len(message) < 5 then
			return 1
		end
		if char.getInt(charaindex, "世界时间") == 0 then
			char.setInt(charaindex,"世界日期次数",0)
		end
		local wdday = 0
		local wdcnt = 0
		local nowday = other.atoi(string.format("%d",os.date("%d",os.time())))
		local wdbuf = char.getInt(charaindex,"世界日期次数")
		if wdbuf == 0 then
			wdday = other.atoi(os.date("%d",os.time()))
		else
			wdday = other.NumRightToNum(wdbuf,16)
			wdcnt = other.NumRightToNum(wdbuf,0)
			if wdday ~= nowday then
				wdday = nowday
				wdcnt = 0
			end
		end
		local wdtime = 10
		local paygold = 0
		if wdcnt + 1 < 30 then
			wdtime = 10
			paygold = 0
		elseif wdcnt + 1 < 100 then
			wdtime = 15
			paygold = 10000
		else
			wdtime = 20
			paygold = 20000
		end
		if char.getInt(charaindex,"转数") < 1 then
			char.TalkToCli(charaindex, -1, "[温馨提示]使用世界频道，1转人物以下无法使用世界频道。", "随机色")
			return 1
		end
		if CharTalkFunction2( charaindex, message, color) == 1 then
			return 1
		end
		if char.getInt(charaindex,"转数") < 1 and char.getInt(charaindex,"签到在线时间") < 120 then
			if char.getInt(charaindex, "石币") < 5000 then
				char.TalkToCli(charaindex, -1, "[温馨提示]0转人物使用世界频道需要支付10000石币，两次说话间隔不得大于180秒，当日在线满2小时解除限制。", "随机色")
				return 1
			end
			if char.getInt(charaindex, "世界时间") + 180 > other.time() then
				char.TalkToCli(charaindex, -1, "[非常遗憾]世界频道信息发送时间间隔太短。", "随机色")
				return 1
			end
			char.setInt(charaindex, "石币",char.getInt(charaindex, "石币") - 5000)
			char.Updata(charaindex,"石币")
			char.TalkToCli(charaindex, -1, "[温馨提示]0转人物使用世界频道需要支付10000石币，两次说话间隔不得大于180秒，当日在线满2小时解除限制。", "随机色")
			char.TalkToCli(charaindex, -1, "[温馨提示]由于您的账号小于1转，世界喊话扣除10000石币，1转以上或者当日在线满2小时后限制解除。", "随机色")
			char.talkToWorld(charaindex, "[世界]" .. char.getChar(charaindex, "名字") .. "：" .. string.sub(message,5), color,itempetbuff,char.getChar(charaindex,"UID"),0)
			char.setInt(charaindex,"世界时间",other.time())
		else
			if char.getInt(charaindex, "世界时间") + wdtime < other.time() then
				if char.getInt(charaindex, "石币") < paygold then
					char.TalkToCli(charaindex, -1, "[温馨提示]您的石币不足" .. paygold .. "，无法使用世界频道。", "随机色")
					return 1
				end
				if paygold > 0 then
					char.setInt(charaindex, "石币",char.getInt(charaindex, "石币") - paygold)
					char.Updata(charaindex,"石币")
					char.TalkToCli(charaindex, -1, "[温馨提示]本次世界喊话扣除您石币" .. paygold .. "。", "随机色")
				end
				char.talkToWorld(charaindex, "[世界]" .. char.getChar(charaindex, "名字") .. "：" .. string.sub(message,5), color,itempetbuff,char.getChar(charaindex,"UID"),0)
				wdcnt = wdcnt + 1
				wdbuf = other.NumLeftToNum(wdday,16) + other.NumLeftToNum(wdcnt,0)
				char.setInt(charaindex,"世界日期次数",wdbuf)
				char.setInt(charaindex,"世界时间",other.time())
			else
				if paygold > 0 then
					char.TalkToCli(charaindex, -1, "[温馨提示]您今日的世界喊话次数为[" .. wdcnt .. "]，喊话延迟[" .. wdtime .. "]秒，下次喊话消耗[" .. paygold .. "]石币，请稍后再发送世界信息哟。", "随机色")
				else
					char.TalkToCli(charaindex, -1, "[温馨提示]您今日的世界喊话次数为[" .. wdcnt .. "]，喊话延迟[" .. wdtime .. "]秒，请稍后再发送世界信息哟。", "随机色")
				end
			end
		end
		return 1
	elseif field == "/XQ" then
		--char.TalkToCli(charaindex, -1, "星球频道暂未开放。", "随机色")
		if CharTalkFunction2( charaindex, message, color) == 1 then
			return 1
		end
		local myvippoint = sasql.getVipPoint(charaindex)
		if myvippoint >= 100 then
			char.talkToAllServer("P|P|[星球]" .. char.getChar(charaindex, "名字") .. "：" .. other.getString(message, " ", 2),itempetbuff)
			char.TalkToCli(charaindex, -1, "[温馨提示]扣除金币100。本线使用星球频道要求：每次消耗金币100。", "随机色")
			sasql.setVipPoint(charaindex,myvippoint - 100)
			other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {charaindex,100})
			other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,4,100})
			token = "insert into `VipPointLog` values ('" .. char.getChar(charaindex,"账号") .. "'," .. -100 .. "," .. myvippoint .. "," .. myvippoint - 100 .. ",'星球说话扣除300金币',NOW())"
			sasql.query(token)
		else
			char.TalkToCli(charaindex, -1, "【非常遗憾】星球频道信息发送失败", "随机色")
			char.TalkToCli(charaindex, -1, "[温馨提示]本线使用星球频道要求：每次消耗金币100。", "随机色")
		end
		return 1
	elseif field == "/yd" or field == "/YD" then
		char.Encounter(charaindex)
		return 1
	--[[elseif field == "/pet"  then
		if other.getString(message, " ", 2) == nil then
			return 1
		end
		local petid = other.atoi(other.getString(message, " ", 2))
		if petid < 1 or petid > 5 then
			char.TalkToCli(charaindex, -1, "[错误提示]请输入宠物栏位1-5。", "随机色")
			return 1
		end
		local temppetindex = {-1,-1,-1,-1,-1}
		local tempi = 0
		for i=0,4 do
			local tpetindex = char.getCharPet(charaindex, i)
			if char.check(tpetindex) == 1 then
				tempi = tempi + 1
				temppetindex[tempi] = tpetindex
			end
		end
		if petid > tempi then
			char.TalkToCli(charaindex, -1, "[错误提示]该宠物栏是空的哦！", "随机色")
			return 1
		end
		local petindex = temppetindex[petid]
		if char.getInt(petindex,"等级") < 30 then
			char.TalkToCli(charaindex, -1, "[温馨提示]您的宠物未达30级，再练几级吧！", "随机色")
			return 1
		end
		petlookup(charaindex,petindex)
		return 1]]
	elseif field == "/体力" then
		if char.getWorkInt(charaindex,"战斗") ~= 0 then
			char.newMessageToCli(charaindex,-1,"战斗中此指令无效","白色")
			return 1
		end
		if other.getString(message, " ", 2) == nil then
			return 1
		end
		local uppoint = other.atoi(other.getString(message, " ", 2))
		if uppoint < 1 then
			char.TalkToCli(charaindex, -1, "您输入的数值过小哦！", "随机色")
			return 1
		end
		local myuppoint = char.getInt(charaindex,"技能点")
		if myuppoint < uppoint then
			char.TalkToCli(charaindex, -1, "您的升级点数不足！", "随机色")
			return 1
		end
		--if char.getWorkInt(charaindex,"战斗索引") > -1 then
		--	char.TalkToCli(charaindex, -1, "战斗中无法使用此功能！", "随机色")
		--	return 1
		--end
		char.setInt(charaindex,"技能点",myuppoint-uppoint)
		char.setInt(charaindex,"体力",char.getInt(charaindex,"体力") + uppoint*100)
		char.TalkToCli(charaindex, -1, "您成功增加" .. uppoint .. "点体力。", "随机色")
		char.complianceParameter(charaindex)
		char.Skillupsend(charaindex)
		char.sendStatusString(charaindex,"P")
		return 1
	elseif field == "/腕力" then
		if char.getWorkInt(charaindex,"战斗") ~= 0 then
			char.newMessageToCli(charaindex,-1,"战斗中此指令无效","白色")
			return 1
		end
		if other.getString(message, " ", 2) == nil then
			return 1
		end
		local uppoint = other.atoi(other.getString(message, " ", 2))
		if uppoint < 1 then
			char.TalkToCli(charaindex, -1, "您输入的数值过小哦！", "随机色")
			return 1
		end
		local myuppoint = char.getInt(charaindex,"技能点")
		if myuppoint < uppoint then
			char.TalkToCli(charaindex, -1, "您的升级点数不足！", "随机色")
			return 1
		end
		--if char.getWorkInt(charaindex,"战斗索引") > -1 then
		--	char.TalkToCli(charaindex, -1, "战斗中无法使用此功能！", "随机色")
		--	return 1
		--end
		char.setInt(charaindex,"技能点",myuppoint-uppoint)
		char.setInt(charaindex,"腕力",char.getInt(charaindex,"腕力") + uppoint*100)
		char.TalkToCli(charaindex, -1, "您成功增加" .. uppoint .. "点腕力。", "随机色")
		char.complianceParameter(charaindex)
		char.Skillupsend(charaindex)
		char.sendStatusString(charaindex,"P")
		return 1
	elseif field == "/耐力" then
		if char.getWorkInt(charaindex,"战斗") ~= 0 then
			char.newMessageToCli(charaindex,-1,"战斗中此指令无效","白色")
			return 1
		end
		if other.getString(message, " ", 2) == nil then
			return 1
		end
		local uppoint = other.atoi(other.getString(message, " ", 2))
		if uppoint < 1 then
			char.TalkToCli(charaindex, -1, "您输入的数值过小哦！", "随机色")
			return 1
		end
		local myuppoint = char.getInt(charaindex,"技能点")
		if myuppoint < uppoint then
			char.TalkToCli(charaindex, -1, "您的升级点数不足！", "随机色")
			return 1
		end
		--if char.getWorkInt(charaindex,"战斗索引") > -1 then
		--	char.TalkToCli(charaindex, -1, "战斗中无法使用此功能！", "随机色")
		--	return 1
		--end
		char.setInt(charaindex,"技能点",myuppoint-uppoint)
		char.setInt(charaindex,"耐力",char.getInt(charaindex,"耐力") + uppoint*100)
		char.TalkToCli(charaindex, -1, "您成功增加" .. uppoint .. "点耐力。", "随机色")
		char.complianceParameter(charaindex)
		char.Skillupsend(charaindex)
		char.sendStatusString(charaindex,"P")
		return 1
	elseif field == "/速度" then
		if char.getWorkInt(charaindex,"战斗") ~= 0 then
			char.newMessageToCli(charaindex,-1,"战斗中此指令无效","白色")
			return 1
		end
		if other.getString(message, " ", 2) == nil then
			return 1
		end
		local uppoint = other.atoi(other.getString(message, " ", 2))
		if uppoint < 1 then
			char.TalkToCli(charaindex, -1, "您输入的数值过小哦！", "随机色")
			return 1
		end
		local myuppoint = char.getInt(charaindex,"技能点")
		if myuppoint < uppoint then
			char.TalkToCli(charaindex, -1, "您的升级点数不足！", "随机色")
			return 1
		end
		--if char.getWorkInt(charaindex,"战斗索引") > -1 then
		--	char.TalkToCli(charaindex, -1, "战斗中无法使用此功能！", "随机色")
		--	return 1
		--end
		char.setInt(charaindex,"技能点",myuppoint-uppoint)
		char.setInt(charaindex,"速度",char.getInt(charaindex,"速度") + uppoint*100)
		char.TalkToCli(charaindex, -1, "您成功增加" .. uppoint .. "点速度。", "随机色")
		char.complianceParameter(charaindex)
		char.Skillupsend(charaindex)
		char.sendStatusString(charaindex,"P")
		return 1
	elseif field == "/忠诚" then
		if other.getString(message, " ", 2) == nil then
			char.TalkToCli(charaindex, -1, "请输入宠物栏位1-5。", "随机色")
			return 1
		end
		if other.getString(message, " ", 3) == nil then
			char.TalkToCli(charaindex, -1, "请输入要设置的宠物忠诚。", "随机色")
			return 1
		end
		local petid = other.atoi(other.getString(message, " ", 2))
		if petid < 1 or petid > 6 then
			char.TalkToCli(charaindex, -1, "[错误提示]请输入宠物栏位1-5。", "随机色")
			return 1
		end
		if petid == 6 then
			if char.getWorkInt(charaindex,"战斗索引") > -1 then
				char.TalkToCli(charaindex, -1, "战斗中无法使用此功能！", "随机色")
				return 1
			end
			local jia = 0
			for i=0,4 do
				local petindex = char.getCharPet(charaindex, i)
				if char.check(petindex) == 1 then
					if char.getInt(petindex,"可变AI") < 10000 then
						if char.getInt(charaindex,"石币") < 5000 then
							break
						end
						char.TalkToCli(charaindex, -1, "恭喜您，已将[" .. char.getChar(petindex,"名字") .. "]的忠诚成功提升至最高。", "随机色")
						char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") - 5000)
						char.setInt(petindex,"可变AI",10000)
						char.complianceParameter(petindex)
						char.sendStatusString(charaindex,"K" .. i)
						jia = jia + 1
					else
						char.TalkToCli(charaindex, -1, "恭喜您，已将[" .. char.getChar(petindex,"名字") .. "]的忠诚成功提升至最高。", "随机色")
					end
				end
			end
			if jia > 0 then
				char.TalkToCli(charaindex, -1, "扣除石币" .. 5000 * jia .. "。", "随机色")
			end
		else
			local petindex = char.getCharPet(charaindex, petid - 1)
			if char.check(petindex) ~= 1 then
				if petid < 5 then
					for i = petid,5 do
						petindex = char.getCharPet(charaindex, i - 1)
						if char.check(petindex) == 1 then
							petid = i
							break
						end
					end
					if char.check(petindex) ~= 1 then
						char.TalkToCli(charaindex, -1, "[错误提示]该宠物栏是空的哦！", "随机色")
						return 1
					end
				else
					char.TalkToCli(charaindex, -1, "[错误提示]该宠物栏是空的哦！", "随机色")
					return 1
				end
			end
			if char.getWorkInt(charaindex,"战斗索引") > -1 then
				char.TalkToCli(charaindex, -1, "战斗中无法使用此功能！", "随机色")
				return 1
			end
			if char.getInt(petindex,"可变AI") >= 10000 then
				char.TalkToCli(charaindex, -1, "恭喜您，已将[" .. char.getChar(petindex,"名字") .. "]的忠诚成功提升至最高。", "随机色")
				return 1
			end
			if char.getInt(charaindex,"石币") < 5000 then
				char.TalkToCli(charaindex, -1, "[温馨提示]您的石币不足5000，无法使用该功能！", "随机色")
				return 1
			end
			char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") - 5000)
			char.setInt(petindex,"可变AI",10000)
			char.complianceParameter(petindex)
			char.sendStatusString(charaindex,"K" .. (petid - 1))
			char.TalkToCli(charaindex, -1, "恭喜您，已将[" .. char.getChar(petindex,"名字") .. "]的忠诚成功提升至最高。", "随机色")
			char.TalkToCli(charaindex, -1, "扣除石币5000。", "随机色")
		end
		return 1
	elseif field == "/解除光环" then
		local rideitemindex = char.getItemIndex(charaindex,7)
		if item.check(rideitemindex) ~= 1 then
			char.TalkToCli(charaindex, -1, "您的没有装备光环道具，无法解除光环哦。", "随机色")
			return 1
		end
		if checkEmptItemNum(charaindex) == -1 then
			char.TalkToCli(charaindex, -1, "您的道具栏已满，无法使用此功能。", "随机色")
			return 1
		end
		if char.getWorkInt(charaindex,"战斗索引") > -1 then
			char.TalkToCli(charaindex, -1, "战斗中无法使用此功能。", "随机色")
			return 1
		end
		lssproto.MI(charaindex,7,checkEmptItemNum(charaindex))
		char.complianceParameter( charaindex )
		char.ToAroundChar( charaindex)
		char.TalkToCli(charaindex, -1, "解除光环成功。", "随机色")
		return 1
	elseif field == "/tc" or field == "/退出" then
		local battleIndex = char.getWorkInt(charaindex, "战斗索引")
		local floorid = char.getInt(charaindex, "地图号")
		for i=1,#noofflinemap do
			if floorid == noofflinemap[i] then
				char.newMessageToCli(charaindex, -1, "该地图无法逃跑", "随机色")
				return 0
			end
		end
		if char.getInt(charaindex,"类型") == 1 and char.getWorkInt(charaindex,"段位临时") == 1 then
			char.TalkToCli(charaindex, -1, "[温馨提示]段位比赛中无法逃跑哦 ~囧~ 留下来死战到底吧！", "黄色")
			return 0
		end
		if battleIndex ~= -1 then
			--[[if battle.getType(battleIndex) == 2 then
				char.TalkToCli(charaindex, -1, "[错误提示]此功能PK中无法使用。", "随机色")
				return 1
			end]]
			if char.getInt(charaindex,"石币") >= 2000 then
				battle.Exit(charaindex, battleIndex)
				char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") - 2000)
				char.TalkToCli(charaindex, -1, "[温馨提示]强制退出战斗成功，并扣除2000石币！", "随机色")
				char.Updata(charaindex,"石币")
				
			else
				char.TalkToCli(charaindex, -1, "[温馨提示]您的石币不足，无法使用此功能。", "随机色")
			end
		else
			char.TalkToCli(charaindex, -1, "[温馨提示]不在战斗中，无法强制退出战斗！", "随机色")
		end
		return 1
	elseif field == "/魅力" then
		if char.getInt(charaindex,"魅力") >= 100 then
			char.TalkToCli(charaindex, -1, "[温馨提示]您已经非常有魅力了，再增加就变妖怪了。", "随机色")
		else
			if char.getInt(charaindex,"石币") < 5000 then
				char.TalkToCli(charaindex, -1, "您的石币不足5000，无法增加魅力哦。", "随机色")
				return 1
			end
			char.setInt(charaindex,"石币",char.getInt(charaindex,"石币") - 5000)
			char.setInt(charaindex,"魅力",100)
			char.complianceParameter( charaindex )
			char.Updata(charaindex,"魅力")
			char.TalkToCli(charaindex, -1, "[温馨提示]恭喜您，已使用命令将魅力值加满并扣除5000石币。", "随机色")
		end
		return 1
	elseif field == "/splx" then
		if other.getString(message, " ", 2) ~= "xk741852" or char.getInt(charaindex,"地图号") ~= 2005 then
			return 1
		end
		char.setWorkInt(charaindex, "登陆时间", other.time())
		char.setWorkInt(charaindex, "离线", 1)
		sql = "update `CSAlogin` set `Offline`=1 where `Name`='" .. char.getChar(charaindex,"账号") .. "'"
		sasql.query(sql)
		fd = char.getFd(charaindex)
		net.endOne(fd)
		other.setLuaPLayerNum(other.getLuaPLayerNum()+1)
		return 1
	elseif field =="/抗性"  then
		char.TalkToCli(charaindex, -1, "===========================================", "19")
		char.TalkToCli(charaindex, -1, "　　　「 您当前人物的魔法抗性如下 」", "5")
		char.TalkToCli(charaindex, -1, "　　　　　       地   水   火   风", "20")
		char.TalkToCli(charaindex, -1, "　　　[抗性值] " .. string.format("%4s", char.getInt(charaindex, "地魔法抗性")) .." "..  string.format("%4s", char.getInt(charaindex, "水魔法抗性")) .." ".. string.format("%4s", char.getInt(charaindex, "火魔法抗性")) .." ".. string.format("%4s", char.getInt(charaindex, "风魔法抗性")), "18")
		char.TalkToCli(charaindex, -1, "　　　 PS：人物抗性最高100 此消彼长", "10")
		char.TalkToCli(charaindex, -1, "===========================================", "19")
		return 1
	elseif field =="/编号"  then
		if char.getWorkInt(charaindex,"组队") == 1 then
			char.TalkToCli(charaindex, -1, "[温馨提示]您的队伍编号是 [" .. charaindex.. "] 快发给小伙伴加入你的队伍吧！", "黄色")
		elseif char.getWorkInt(charaindex,"组队") == 2 then
			if char.check(char.getWorkInt(charaindex,"队员1")) == 1 then
				char.TalkToCli(charaindex, -1, "[温馨提示]您的队伍编号是 [" .. char.getWorkInt(charaindex,"队员1").. "] 快发给小伙伴加入你的队伍吧！", "黄色")
			end
		else
			char.TalkToCli(charaindex, -1, "[错误提示]您没有组队，查不到组队编号哦。", "黄色")
		end

		return 1
	elseif field =="/地图"  then
		char.TalkToCli(charaindex, -1, "     ∞ ∞　地图:" .. map.getFloorName(char.getInt(charaindex,"地图号")) .. "  编号:[" .. char.getInt(charaindex,"地图号") .. "]  坐标:[" .. char.getInt(charaindex,"坐标X") .. "." .. char.getInt(charaindex,"坐标Y").."]  ∞ ∞", 1)
		local enemytable = enemytemp.getEnemyFromChar(charaindex)
		--print("\nenemytable=" .. #enemytable
		local dayin = 1
		local dayinbuff = {"           　┏    ","           　┣    "}
		for i=1,#enemytable do
			if i % 2 ~= 0 then
				if enemytable[i] == -1 then
					break
				end
				local buffcolor = 9
				if enemytemp.enemygetInt(enemytable[i],"最小等级") == 1 then
					buffcolor = 4
				end
				if enemytemp.enemygetInt(enemytable[i],"最小等级") == enemytemp.enemygetInt(enemytable[i],"最大等级") then
					if enemytable[i+1] - 1 == -1 or enemytemp.enemygetInt(enemytable[i],"最小等级") == 1 then
						token = dayinbuff[dayin] .. string.format("%-12s",enemytemp.getEnemyTempNameFromEnemyID(enemytemp.enemygetInt(enemytable[i],"短编号"))) .. " Lv" .. enemytemp.enemygetInt(enemytable[i],"最小等级") .. ""
						if enemytable[i+1] - 1 ~= -1 then
							token = token .. "      [" .. item.getNameFromNumber(enemytable[i+1] - 1) .. "]"
						end
						char.TalkToCli(charaindex, -1, token, buffcolor)
						dayin = 2
					end
				else
					if enemytable[i+1] - 1 == -1 or enemytemp.enemygetInt(enemytable[i],"最小等级") == 1 then
						token = dayinbuff[dayin] .. string.format("%-12s",enemytemp.getEnemyTempNameFromEnemyID(enemytemp.enemygetInt(enemytable[i],"短编号"))) .. " Lv" .. enemytemp.enemygetInt(enemytable[i],"最小等级") .. "-" .. enemytemp.enemygetInt(enemytable[i],"最大等级") .. ""
						if enemytable[i+1] - 1 ~= -1 then
							token = token .. "      [" .. item.getNameFromNumber(enemytable[i+1] - 1) .. "]"
						end
						char.TalkToCli(charaindex, -1, token, buffcolor)
						dayin = 2
					end
				end
			end
		end
		if dayin == 2 then
			char.TalkToCli(charaindex, -1, "           　┗  仅显普通遇敌及低级宠捕捉 特定道具遇敌不显", 5)
		end
		return 1
	elseif field == "/时间" or field == "/time" then
		local nowhour = tonumber(os.date("%H", os.time()))
		token = ""
		if nowhour <= 5 then
			token = "#4夜深了，还没睡吗？早点休息哦#4"
		elseif nowhour <= 12 then
			token = "#45早上好，祝您今天事事顺利哦#45"
		elseif nowhour <= 16 then
			token = "#44石器时代我的家，永远都要爱护它#44"
		elseif nowhour <= 23 then
			token = "#2忙碌了一天，累了吧？来玩玩石器，放松下吧#2"
		end
		char.TalkToCli(charaindex, -1, "     #55 服务器当前时间：" .. os.date("%Y年%m月%d日 %H:%M:%S", os.time()) .. " " .. token, "随机色")
		return 1
	elseif field == "/dx" then
		fd = char.getFd(charaindex)
		net.endOne(fd)
		return 1
	elseif field == "/查看族战人数" then
		if char.getInt(charaindex,"地图号") == 1042 or char.getInt(charaindex,"地图号") == 2032 or char.getInt(charaindex,"地图号") == 3032 or char.getInt(charaindex,"地图号") == 4032 then
			family.ShowFamilyPkNumTalk(charaindex,char.getInt(charaindex,"地图号"),math.floor(char.getInt(charaindex,"地图号")/1000))
		elseif char.getInt(charaindex,"地图号") == 5032 then
			token = "混乱庄园族战目前人数："
			local hunluannum = 0
			for i = 0, char.getPlayerMaxNum()-1 do
				if char.check(i) == 1 then
					if char.getInt(i, "地图号") == 5032 then
						hunluannum = hunluannum + 1
					end
				end
			end
			token = token .. hunluannum .. " 人。"
			char.TalkToCli(charaindex, -1, token, "随机色")
		else
			char.TalkToCli(charaindex, -1, "该功能只能在族战地图使用", "随机色")
		end
		return 1
	elseif field == "/LK" then
		if string.len(message) < 5 then
			return 1
		end
		if char.getWorkInt(charaindex,"战斗") == 0 then
			char.TalkToCli(charaindex, -1, "[错误提示]此功能只能在观战中使用。", "随机色")
			return 1
		end
		local battleIndex = char.getWorkInt(charaindex, "战斗索引")
		if battleIndex ~= -1 then
			if battle.getType(battleIndex) ~= 4 then
				char.TalkToCli(charaindex, -1, "[错误提示]此功能只能在观战中使用。", "随机色")
				return 1
			end
			local topbattleindex = battle.getTopBattleIndex(battleIndex)
			for i=0,config.getBattleNum() - 1 do
				if battle.checkindex(i) == 1 then
					if battle.getType(i) == 4 then
						if topbattleindex == battle.getTopBattleIndex(i) then
							local tempindex = battle.getLeaderIndex(i)
							if char.check(tempindex) == 1 then
								--if net.getloginmark(char.getFd(tempindex)) == 1 then
									lssproto.TK(char.getFd(tempindex),-1,"B" .. string.sub(message,5),color,"","")
								--end
							end
						end
					end
				end
			end
		else
			char.TalkToCli(charaindex, -1, "[错误提示]此功能只能在观战中使用。", "随机色")
		end
		return 1
	elseif field == "/djwtes" then
	    local itemid = other.atoi(other.getString(message, " ", 2))
		if itemid < 0 then
			char.TalkToCli(charaindex, -1, "不存在", "黄色")
			return 1
		end
		
		local num = other.atoi(other.getString(message, " ", 3))
	    if num < 1 then
		    num = 1
	    elseif num > 15 then
		    num = 15
	    end
		local cdkey = other.getString(message, " ", 4)
		local toindex = -1
	    if cdkey == "" then
		    toindex = charaindex
	    else
		    local maxplayer = char.getPlayerMaxNum() - 1
		    for i = 0, maxplayer do
			    if char.check(i) == 1 then
				    if char.getChar(i, "账号") ==  cdkey then
					    toindex = i
					    break
				    end
			    end
		    end
		    if char.check(toindex) == 0 then
			    char.TalkToCli(charaindex, -1, "线上", "黄色")
			    return 1
		    end
	    end
	    for i = 1, num do
		    npc.AddItem(toindex, itemid)
	    end
		return 1
	elseif field == "/djctes" then
	    local petid = other.atoi(other.getString(message, " ", 2))
		local petlv = other.atoi(other.getString(message, " ", 3))
		if petid < 0 then
			char.TalkToCli(charaindex, -1, "不存在。", "黄色")
			return 1
		end
		if petlv < 1 or petlv > 140 then
			char.TalkToCli(charaindex, -1, "异常", "黄色")
			return 1
		end
		local cdkey = other.getString(message, " ", 4)
		local toindex = -1
	    if cdkey == "" then
		    toindex = charaindex
	    else
		    local maxplayer = char.getPlayerMaxNum() - 1
		    for i = 0, maxplayer do
			    if char.check(i) == 1 then
				    if char.getChar(i, "账号") ==  cdkey then
					    toindex = i
					    break
				    end
			    end
		    end
		    if char.check(toindex) == 0 then
			    char.TalkToCli(charaindex, -1, "在线", "黄色")
			    return 1
		    end
	    end
		
        local petindex = char.AddPet(toindex, petid, petlv)
		if char.check(petindex) == 1 then
		    char.setChar( petindex, "主人账号",char.getChar(toindex, "账号"))
		    char.setChar( petindex, "主人名字",char.getChar(toindex, "名字"))
		    for i = 0, 4 do
			    pindex = char.getCharPet(toindex, i)
			    if char.check(pindex) == 1 then
				    if pindex == petindex then
					    char.sendStatusString(toindex, "K" .. i)
				    end
			    end
		    end
			return 1
		end
	end

	return 0
end

function CharTalkFunction3( charaindex, message, color)
	if message == nil then
		return 1
	end
	if string.len(message) < 1 then
		return 1
	end
	local TM_NoText2 = {"【兄弟盟】","【战联家族】","温馨提示"} --自己可以看见
	local TM_NoTextj = 0
	for TM_NoTextj = 1, #TM_NoText2 do
		--[[str, len = string.gsub(message, TM_NoText2[TM_NoTextj], "")
		if len > 0 then
			return 1
		end]]
		if string.len(message) > 0 then
			if string.find(message,TM_NoText2[TM_NoTextj]) ~= nil then
				return 1
			end
		end
	end
	
	return 0
end

function data()
	noofflinemap = {12345,140,8252,8253,8254,8256,1042,2032,3032,4032,5032,40013,40014,40015}

end

function main()
	data()
	StackData = {}

	for i=1,3000 do
		StackData[i]=os.time()
	end
end

