function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function FreeSaMenu(meindex, index)
	print("[FreeSaMenu]",meindex,index)
	parameter = {meindex}
	if char.getWorkInt(meindex,"战斗") ~= 0 then
		if index == 20 then
			other.CallFunction("OffLine", "data/ablua/item/offline.lua", parameter)
		elseif index == 18 then
			char.StopEncounter(meindex)
		elseif index == 25 then
			other.CallFunction("SaMenuBuyVigor", "data/ablua/npc/buyvigor/buyvigor.lua", parameter)
			--char.newMessageToCli(meindex,-1,"此功能暂无开放","白色")
		elseif index == 28 then
			lssproto.windows(meindex, 1024, "取消", 0, char.getWorkInt( npcindex3, "对象"), "")
		elseif index == 114 then
			if char.getChar(meindex,"家族") ~= "" then
				other.CallFunction("ShowMyFamily", "data/ablua/npc/family/family.lua", parameter)
			end
		elseif index == 115 then
			other.CallFunction("ShowFamilyList", "data/ablua/npc/family/family.lua", parameter)
		elseif index == 33 then--活动
			other.CallFunction("ShowHuodong", "data/ablua/npc/huodong/huodong.lua", {meindex,1})
		elseif index == 112 then
			other.CallFunction("ShowTalked", "data/ablua/npc/petbilling/petbilling.lua", parameter)
		elseif index == 24 then
			other.CallFunction("ShowTeacherWin", "data/ablua/npc/teacher/teacher.lua", parameter)
		end
		return
	end
	if index == 20 then
		other.CallFunction("OffLine", "data/ablua/item/offline.lua", parameter)
	elseif index == 32 then
		other.CallFunction("ShowPay", "data/ablua/npc/pay/pay.lua", parameter)
	elseif index == 31 then
		other.CallFunction("ShowList", "data/ablua/npc/shop/vippoint.lua", parameter)
	elseif index == 33 then--活动
		other.CallFunction("ShowHuodong", "data/ablua/npc/huodong/huodong.lua", {meindex,1})
	elseif index == 34 then--活动
		other.CallFunction("ShowHuodong", "data/ablua/npc/huodong/huodong.lua", {meindex,2})
	elseif index == 17 then
		char.Encounter(meindex)
	elseif index == 999 or index == 18 then
		char.StopEncounter(meindex)
	elseif index == 12 then
		other.CallFunction("QueryMissionTalked", "data/ablua/npc/querymission/querymission.lua", parameter)
	elseif index == 7 then--观战
		lssproto.windows(meindex, 1034, "确定|取消", 0, -1, "")
	elseif index >= 101 and index <= 104 then--切换队长
		if char.getWorkInt(meindex, "组队") == 1 then
			party[meindex]={}
			local num=0
			for i=1,4 do
				local partyindex = char.getWorkInt(meindex, "队员" .. i+1)
				if char.check(partyindex) == 1 then
					num = num + 1
					party[meindex][num] = partyindex
				end
			end
			if char.check(party[meindex][index - 100]) == 1 then
				char.DischargeParty(meindex,0)
				char.JoinParty(party[meindex][index - 100],meindex,0)
				char.newMessageToCli(meindex, -1, "队长转移给"..char.getChar(party[meindex][index - 100],"名字"), "白色")
				for i =1,#party[meindex] do
					if i ~= index - 100 then
						char.JoinParty(party[meindex][index - 100],party[meindex][i],0)
					end
				end
				char.Encounter(party[meindex][index - 100])
			end
		else
			char.TalkToCli(meindex, -1, "该功能需要队长权限", "红色")
		end
	elseif index == 21 then
		lssproto.windows(meindex, 1031, "确定|取消", 0, char.getWorkInt( npcindex2, "对象"), "")
	elseif index == 22 then
		char.AroundChar(meindex)
	elseif index == 24 then
		other.CallFunction("ShowTeacherWin", "data/ablua/npc/teacher/teacher.lua", parameter)
	elseif index == 26 then
		if meindex >= 5000 then
			return
		end
		if os.time() < StackData[meindex+1] then
			char.newMessageToCli(meindex, -1, "当前叠加功能正在冷却", "黄色")
			return
		end
		StackData[meindex+1] = os.time()+10;
		local itemmaxnum = char.getMyMaxPilenum(meindex);
		local flg=false;
		for i = 9,22 do
			local fromindex = char.getItemIndex(meindex,i);
			if fromindex > -1 then
				if item.getInt(fromindex,"重叠") == 1 then
					local frompilenum = item.getInt(fromindex,"堆叠");
					if frompilenum < itemmaxnum then
						for b=i+1,23 do
							local toindex = char.getItemIndex(meindex,b);
							if toindex>-1 then
								if item.getInt(toindex,"堆叠") < itemmaxnum then
									if item.getInt(fromindex,"序号") == item.getInt(toindex,"序号") and item.getChar(fromindex,"名称") == item.getChar(toindex,"名称") then
										itemlocked = 0
										if item.getInt(fromindex,"安全锁") == 1 or item.getInt(toindex,"安全锁") == 1 then
											itemlocked = 1
										end
										char.PileItemFromItemBoxToItemBox(meindex,b,i)
										if itemlocked == 1 then
											item.setInt(fromindex,"安全锁",1)
										end
										frompilenum = item.getInt(fromindex,"堆叠");
										flg=true;
										if frompilenum >= itemmaxnum then
											break;
										end
									end
								end
							end
						end
					end
				end
			end
		end
		for i=9,23 do
			local itemindex = char.getItemIndex(meindex,i)
			if itemindex < 0 then
				for j=i+1,23 do
					local itemindex2 = char.getItemIndex(meindex,j)
					if itemindex2 > -1 then
						char.moveEquipItem(meindex,j,i)
						break
					end
				end
			end
			item.UpdataHaveItemOne(meindex,i)
		end
		char.newMessageToCli(meindex, -1, "自动叠加成功", "黄色")
	elseif index == 27 then
		other.CallFunction("getTeamData", "data/ablua/npc/playerteam/playerteam.lua", {meindex,1})
		--other.CallFunction("weixin","data/ablua/weixin.lua",{meindex,6,char.getChar(meindex,"名字")})
	elseif index == 28 then
		lssproto.windows(meindex, 1024, "取消", 0, char.getWorkInt( npcindex3, "对象"), "")
	elseif index == 29 then--邮件
		lssproto.windows(meindex, 1026, "取消", 0, char.getWorkInt( npcindex4, "对象"), "")
	elseif index == 111 then--买活力
		other.CallFunction("ShowBuyVigor", "data/ablua/npc/buyvigor/buyvigor.lua", parameter)
	elseif index == 25 then
		other.CallFunction("SaMenuBuyVigor", "data/ablua/npc/buyvigor/buyvigor.lua", parameter)
	elseif index == 112 then
		other.CallFunction("ShowTalked", "data/ablua/npc/petbilling/petbilling.lua", parameter)
	elseif index == 113 then
		other.CallFunction("NewQueryMissionTalked", "data/ablua/npc/querymission/querymission.lua", parameter)
	elseif index == 114 then
		if char.getChar(meindex,"家族") ~= "" then
			other.CallFunction("ShowMyFamily", "data/ablua/npc/family/family.lua", parameter)
		end
	elseif index == 115 then
		other.CallFunction("ShowFamilyList", "data/ablua/npc/family/family.lua", parameter)
	elseif index == 116 then
		other.CallFunction("ShowHead", "data/ablua/npc/playerquestion/playerquestion.lua", parameter)
	elseif index == 117 then
		--print("[samenu:FreeSaMenu]",meindex)
		parameter = {meindex,1}
		other.CallFunction("showmmexp", "data/ablua/item/newmmexp.lua", parameter)
	elseif index == 118 then
		print("[samenu:FreeSaMenu]118",meindex)
        other.CallFunction("EmailRedSend", "data/ablua/dispatchmessage.lua", {meindex,0})
        other.CallFunction("ShowHead", "data/ablua/npc/email/email.lua", {meindex,1})
	elseif index == 121 then
		other.CallFunction("openWindows", "data/ablua/mergeitem.lua", parameter)
	elseif index >= 201 and index <= 205 then
		parameter = {meindex,index - 200}
		other.CallFunction("ShowTalked", "data/ablua/npc/petatterrect/petatterrect.lua", parameter)
	end
end

function FreeNewSaMenu(fd, index, data)
	print("[FreeNewSaMenu]",index, data)
	if index == 1 then
		if data == "" then
			return
		end
		if char.getInt(net.getCharaindex(fd),"地图号") >= 40030 and char.getInt(net.getCharaindex(fd),"地图号") <= 40034 then
			return
		end
		if other.getString(data,"|",1) == "O" then
			other.CallFunction("ShowTalked", "data/ablua/npc/pool/poolpet.lua", {-1,net.getCharaindex(fd),2})
		else
			other.CallFunction("ShowWindowTalked", "data/ablua/npc/pool/poolpet.lua", {-1,net.getCharaindex(fd),data,2})
		end
	elseif index == 2 then
		if data == "" then
			return
		end
		if char.getInt(net.getCharaindex(fd),"地图号") >= 40030 and char.getInt(net.getCharaindex(fd),"地图号") <= 40034 then
			return
		end
		if other.getString(data,"|",1) == "O" then
			other.CallFunction("ShowTalked", "data/ablua/npc/pool/poolitem.lua", {-1,net.getCharaindex(fd),2})
		else
			other.CallFunction("ShowWindowTalked", "data/ablua/npc/pool/poolitem.lua", {-1,net.getCharaindex(fd),data,2})
		end
	elseif index == 3 then
		other.CallFunction("FreeRideQuery", "data/ablua/familyridefunction.lua", {net.getCharaindex(fd)})
	elseif index == 4 then--活跃
		other.CallFunction("ShowList", "data/ablua/npc/huoyue/huoyue.lua", {net.getCharaindex(fd),data})
	elseif index == 5 then--快捷组队
		other.CallFunction("ShowHead", "data/ablua/npc/AutoTeam/AutoTeam.lua", {net.getCharaindex(fd)})
	elseif index == 6 then--石器宝典
		other.CallFunction("ShowHead", "data/ablua/npc/baodian/baodian.lua", {net.getCharaindex(fd)})
	elseif index == 7 then--我要奖励
		local listnum = 1
		if data ~= "" then
			listnum = other.atoi(data)
		end
		other.CallFunction("ShowList", "data/ablua/npc/woyao/woyao.lua", {net.getCharaindex(fd),listnum})
	elseif index == 8 then--便捷传送
		other.CallFunction("ShowList", "data/ablua/npc/chuansong/chuansong.lua", {net.getCharaindex(fd)})
	elseif index == 9 then
		if data == "" then
			return
		end
		other.CallFunction("warppoint", "data/ablua/npc/chuansong/chuansong.lua", {net.getCharaindex(fd),other.atoi(data)})
	elseif index == 10 then
		if data == "" then
			lssproto.NewSaMenu(fd,index,"0|名字为空")
		else
			local ret = other.CallFunction("checkCharName", "data/ablua/checkCharName.lua", {-1,data})
			print("[FreeNewSaMenu]checkCharName ret",ret)
			if ret== 1 then
				lssproto.NewSaMenu(fd,index,"0|名字已经存在")
			else
				lssproto.NewSaMenu(fd,index,"1|成功")
			end
		end
	elseif index == 11 then--皮肤
		if data == "" then
			return
		end
		other.CallFunction("userskin", "data/ablua/item/skin.lua", {net.getCharaindex(fd),other.atoi(data)})
	elseif index == 12 then--MM
		if data == "" then
			return
		end
		other.CallFunction("addmm", "data/ablua/item/mmexp.lua", {net.getCharaindex(fd),data})
	elseif index == 13 then--问答
		other.CallFunction("ShowHead", "data/ablua/npc/playerquestion/playerquestion.lua", {net.getCharaindex(fd)})
	elseif index == 14 then--U8问卷调查
		other.CallFunction("ShowList", "data/ablua/npc/u8question/u8question.lua", {net.getCharaindex(fd)})
	--[[elseif index == 15 then--新手指引
		if char.getInt(net.getCharaindex(fd),"新玩家旗标") == 1 then
			other.CallFunction("TalkedNpcLua", "data/ablua/newplayer.lua", {net.getCharaindex(fd)})
		end]]
	elseif index == 16 then--新手指引
		lssproto.windows(net.getCharaindex(fd), 1039, "取消", 0, -1, data)
	elseif index == 17 or index == 24 then --回炉
		if data == "" then
			return
		end
		other.CallFunction("getdata", "data/ablua/item/petchange.lua", {net.getCharaindex(fd),data})	
	elseif index == 18 then--道具拆分
		if data == "" then
			return
		end
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return
		end
		local itemhaveid = other.getString(data,"|",1)
		local itemnum = other.getString(data,"|",2)
		if itemhaveid == "" or itemnum == "" then
			return
		end
		itemhaveid = other.atoi(itemhaveid)
		itemnum = other.atoi(itemnum)
		if itemhaveid < 9 or itemhaveid > 23 then
			return
		end
		if itemnum < 1 then
			return
		end
		if checkEmptItemNum(charaindex) < 1 then
			char.newMessageToCli(charaindex, -1, "您的道具栏已满", "白色")
			return
		end
		local itemindex = char.getItemIndex(charaindex,itemhaveid)
		if item.check(itemindex) ~= 1 then
			return
		end
		if item.getInt(itemindex,"重叠") ~= 1 then
			return
		end
		if itemnum >= item.getInt(itemindex,"堆叠") then
			return
		end
		local newitemindex = char.Additem(charaindex,item.getInt(itemindex,"序号"))
		if item.check(newitemindex) ~= 1 then
			return
		end
		item.setInt(itemindex,"堆叠",item.getInt(itemindex,"堆叠") - itemnum)
		item.setInt(newitemindex,"堆叠",itemnum)
		if item.getChar(itemindex,"名称") ~= item.getChar(newitemindex,"名称") then
			item.setChar(newitemindex,"名称",item.getChar(itemindex,"名称"))
		end
		item.UpdataItemOne(charaindex,itemindex)
		item.UpdataItemOne(charaindex,newitemindex)
		char.newMessageToCli(charaindex, -1, "拆分道具成功", "白色")
	elseif index == 19 then--宠物攻击特效
		if data == "" then
			return
		end
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return
		end
		other.CallFunction("luapetatt", "data/ablua/npc/petatterrect/petatterrect.lua", {charaindex,data})
	elseif index == 20 then--每日福利
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return
		end
		other.CallFunction("LuaWindowTalked","data/ablua/npc/huodong/huodong.lua",{charaindex,2,"G"})
	elseif index == 21 then--加点
		if data == "" then
			return
		end
		local vital = other.getString(data,"|",1)
		local str = other.getString(data,"|",2)
		local vgh = other.getString(data,"|",3)
		local dex = other.getString(data,"|",4)
		if vital == "" or str == "" or vgh == "" or dex == "" then
			return
		end
		vital = other.atoi(vital)
		str = other.atoi(str)
		vgh = other.atoi(vgh)
		dex = other.atoi(dex)
		if vital < 0 or str < 0 or vgh < 0 or dex < 0 then
			return
		end
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return
		end
		if vital + str + vgh + dex > char.getInt(charaindex,"技能点") then
			return
		end
		char.setInt(charaindex,"体力",char.getInt(charaindex,"体力") + vital * 100)
		char.setInt(charaindex,"腕力",char.getInt(charaindex,"腕力") + str * 100)
		char.setInt(charaindex,"耐力",char.getInt(charaindex,"耐力") + vgh * 100)
		char.setInt(charaindex,"速度",char.getInt(charaindex,"速度") + dex * 100)
		char.setInt(charaindex,"技能点",char.getInt(charaindex,"技能点") - vital - str - vgh - dex)
		char.complianceParameter(charaindex)
		char.sendStatusString(charaindex,"P")
		char.Skillupsend(charaindex)
		char.newMessageToCli(charaindex, -1, "加点成功", "白色")
	elseif index == 22 then--宠物图鉴
		if data == "" then
			return
		end
		local charaindex = net.getCharaindex(fd)
		if char.check(charaindex) ~= 1 then
			return
		end
		local type = other.getString(data,"|",1)
		if type == "A" then
			local petno = other.getString(data,"|",2)
			if petno == "" then
				return
			end
			petno = other.atoi(petno)
			local petindex = char.getCharPet(charaindex,petno - 1)
			if char.check(petindex) == 1 then
				for j=1,#petimagedata do
					if char.getInt(petindex,"宠ID") == petimagedata[j][2] then
						if petimagedata[j][1] <= 32 then
							char.setInt(charaindex,"宠物图鉴1",other.DataOrData(char.getInt(charaindex,"宠物图鉴1"),petimagedata[j][1] - 1))
						elseif petimagedata[j][1] <= 64 then
							char.setInt(charaindex,"宠物图鉴2",other.DataOrData(char.getInt(charaindex,"宠物图鉴2"),petimagedata[j][1] - 1 - 32))
						elseif petimagedata[j][1] <= 96 then
							char.setInt(charaindex,"宠物图鉴3",other.DataOrData(char.getInt(charaindex,"宠物图鉴3"),petimagedata[j][1] - 1 - 64))
						elseif petimagedata[j][1] <= 128 then
							char.setInt(charaindex,"宠物图鉴4",other.DataOrData(char.getInt(charaindex,"宠物图鉴4"),petimagedata[j][1] - 1 - 96))
						elseif petimagedata[j][1] <= 160 then
							char.setInt(charaindex,"宠物图鉴5",other.DataOrData(char.getInt(charaindex,"宠物图鉴5"),petimagedata[j][1] - 1 - 128))
						elseif petimagedata[j][1] <= 192 then
							char.setInt(charaindex,"宠物图鉴6",other.DataOrData(char.getInt(charaindex,"宠物图鉴6"),petimagedata[j][1] - 1 - 160))
						elseif petimagedata[j][1] <= 224 then
							char.setInt(charaindex,"宠物图鉴7",other.DataOrData(char.getInt(charaindex,"宠物图鉴7"),petimagedata[j][1] - 1 - 192))
						elseif petimagedata[j][1] <= 256 then
							char.setInt(charaindex,"宠物图鉴8",other.DataOrData(char.getInt(charaindex,"宠物图鉴8"),petimagedata[j][1] - 1 - 224))
						elseif petimagedata[j][1] <= 288 then
							char.setInt(charaindex,"宠物图鉴9",other.DataOrData(char.getInt(charaindex,"宠物图鉴9"),petimagedata[j][1] - 1 - 256))
						elseif petimagedata[j][1] <= 320 then
							char.setInt(charaindex,"宠物图鉴10",other.DataOrData(char.getInt(charaindex,"宠物图鉴10"),petimagedata[j][1] - 1 - 288))
						else
							return
						end
						break
					end
				end
				local token = ""
				for i=1,10 do
					token = token .. char.getInt(charaindex,"宠物图鉴" .. i) .. "|"
				end
				lssproto.NewSaMenu(fd,index,token)
			end
		elseif type == "O" then
			local token = ""
			for i=1,10 do
				token = token .. char.getInt(charaindex,"宠物图鉴" .. i) .. "|"
			end
			lssproto.NewSaMenu(fd,index,token)
		end
	elseif index == 23 then
		if data == "" then
			return
		end
		other.CallFunction("getdata", "data/ablua/npc/LY/LY.lua", {net.getCharaindex(fd)})
	end
end

function FreeSaMenuLua(meindex, index)
	FreeSaMenu(meindex, index)
	return 0
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	if seqno == 0 then
		local num = tonumber(data)
		if num > 0 and num < 5 then
			if char.check(party[talkerindex][num]) == 1 then
				if char.getWorkInt(party[talkerindex][num],"离线") > 0 then
					char.TalkToCli(talkerindex, -1, "不能将队长转移给已经离线的玩家，请选择其他队员。", "随机色")
					return
				end
			end
			char.DischargeParty(talkerindex,0)
			char.JoinParty(party[talkerindex][num],talkerindex,0)
			char.TalkToCli(party[talkerindex][num], -1, "您的队长["..char.getChar(talkerindex,"名字").."]已经将队长权力移交给您，并自动开始原地遇敌！", "随机色")
			char.TalkToCli(talkerindex, -1, "您已经成功把队长权力移交给["..char.getChar(party[talkerindex][num],"名字").."]，原地遇敌自动开启。", "随机色")
			for i =1,#party[talkerindex] do
				if i ~= num then
					char.JoinParty(party[talkerindex][num],party[talkerindex][i],0)
				end
			end
			char.Encounter(party[talkerindex][num])
		end
	end
end

function WindowTalked3( meindex, talkerindex, seqno, select, data)
	if seqno == 0 then
		if data == "" then
			return
		end
		if data == "1" then
			other.CallFunction("showpetrace", "data/ablua/npc/petrace/petrace.lua", {talkerindex})
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function Create2(name, metamo, floor, x, y, dir)
	npcindex2 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--char.setFunctionPointer(npcindex2, "窗口事件", "WindowTalked2", "")
end

function Create3(name, metamo, floor, x, y, dir)
	npcindex3 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex3, "窗口事件", "WindowTalked3", "")
end

function data()
	party={}
	--序号，宠物长编号
	petimagedata = {{1,94},
					{1,549},
					{1,651},
					{1,695},
					{1,701},
					{1,827},
					{2,91},
					{2,546},
					{2,582},
					{2,825},
					{3,92},
					{3,76},
					{3,547},
					{3,826},
					{4,95},
					{4,550},
					{4,662},
					{4,696},
					{4,702},
					{4,828},
					{5,93},
					{5,540},
					{5,548},
					{6,755},
					{7,100},
					{7,301},
					{8,105},
					{8,302},
					{8,682},
					{8,704},
					{9,106},
					{9,303},
					{9,650},
					{9,705},
					{9,724},
					{10,164},
					{10,194},
					{11,162},
					{11,192},
					{11,554},
					{11,671},
					{12,163},
					{12,193},
					{12,536},
					{12,551},
					{12,660},
					{13,161},
					{13,191},
					{13,518},
					{14,524},
					{15,223},
					{15,679},
					{15,691},
					{16,224},
					{16,535},
					{17,221},
					{18,222},
					{18,519},
					{19,233},
					{20,232},
					{21,234},
					{21,562},
					{22,791},
					{22,841},
					{23,291},
					{23,591},
					{23,680},
					{24,293},
					{24,593},
					{25,292},
					{25,558},
					{25,590},
					{25,592},
					{25,669},
					{26,39},
					{26,294},
					{26,553},
					{26,594},
					{27,273},
					{28,274},
					{28,275},
					{29,272},
					{30,271},
					{31,144},
					{32,141},
					{33,142},
					{34,143},
					{35,65},
					{35,664},
					{36,64},
					{37,62},
					{38,63},
					{38,580},
					{39,61},
					{39,657},
					{40,74},
					{40,575},
					{41,70},
					{41,73},
					{42,69},
					{42,72},
					{42,501},
					{42,523},
					{43,71},
					{43,99},
					{43,659},
					{44,3},
					{44,6},
					{44,586},
					{44,678},
					{44,717},
					{45,2},
					{45,1061},
					{46,1},
					{46,97},
					{46,716},
					{47,13},
					{48,11},
					{48,587},
					{49,14},
					{50,12},
					{50,1115},
					{51,22},
					{52,23},
					{52,667},
					{53,21},
					{53,655},
					{53,721},
					{54,24},
					{54,665},
					{55,31},
					{55,663},
					{56,32},
					{57,34},
					{57,1064},
					{58,33},
					{59,41},
					{59,684},
					{60,43},
					{60,685},
					{61,44},
					{61,656},
					{62,42},
					{62,506},
					{62,578},
					{63,54},
					{63,555},
					{64,52},
					{64,579},
					{65,53},
					{65,588},
					{65,652},
					{66,51},
					{66,505},
					{66,560},
					{66,666},
					{67,86},
					{68,84},
					{68,581},
					{69,75},
					{69,81},
					{70,83},
					{71,82},
					{72,88},
					{73,85},
					{73,697},
					{74,87},
					{75,102},
					{75,140},
					{75,1063},
					{76,103},
					{77,101},
					{77,583},
					{78,104},
					{78,589},
					{78,686},
					{79,112},
					{79,1062},
					{80,111},
					{80,653},
					{81,114},
					{82,113},
					{83,171},
					{84,173},
					{85,175},
					{86,174},
					{86,658},
					{87,172},
					{88,182},
					{89,184},
					{89,584},
					{90,183},
					{90,670},
					{91,181},
					{91,508},
					{91,687},
					{92,213},
					{92,585},
					{93,212},
					{93,692},
					{94,211},
					{94,559},
					{95,244},
					{96,241},
					{96,690},
					{97,243},
					{97,1137},
					{98,242},
					{99,264},
					{100,8},
					{100,27},
					{101,262},
					{101,681},
					{102,263},
					{103,312},
					{103,708},
					{104,323},
					{104,538},
					{105,324},
					{106,322},
					{106,683},
					{106,694},
					{106,700},
					{107,321},
					{107,552},
					{107,688},
					{108,325},
					{109,332},
					{109,526},
					{109,689},
					{110,331},
					{110,525},
					{111,333},
					{111,527},
					{112,334},
					{112,406},
					{112,654},
					{113,3037},
					{114,3038},
					{115,3052},
					{116,3057},
					{117,902},
					{118,901},
					{119,903},
					{120,904},
					{121,3041},
					{122,3042},
					{123,3043},
					{124,3044},
					{125,787},
					{126,786},
					{126,869},
					{127,784},
					{127,862},
					{127,912},
					{128,785},
					{128,863},
					{129,777},
					{130,3000},
					{131,3033},
					{132,3034},
					{133,253},
					{134,252},
					{135,254},
					{136,255},
					{137,251},
					{137,577},
					{137,703},
					{138,3004},
					{139,3001},
					{140,3005},
					{141,3002},
					{142,3003},
					{143,304},
					{143,698},
					{143,967},
					{144,4540},
					{145,4547},
					{146,3040},
					{147,4559},
					{148,4560},
					{149,4561},															
					{150,4562},
					{151,1047},
					{152,986},
					{153,1048},
					{154,985},
					{155,4548},
					{156,314},	
					{156,710},	
					{157,313},	
					{157,709},	
					{158,725},	
					{158,926},	
						
																							
				}
end

function main()
	data()
	Create("队长切换", 100000, 777, 20, 21, 4)
	Create2("天气锁定", 100000, 777, 21, 21, 4)
	Create3("其他", 100000, 777, 22, 21, 4)
	StackData = {}

	for i=1,5000 do
		StackData[i]=os.time()
	end
end