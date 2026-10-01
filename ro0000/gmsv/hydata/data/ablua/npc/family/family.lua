function ShowMyFamily(talkerindex)
	if topfmlisttime < other.time() then
		family.ACShowTopFMList(1)
		family.ACShowTopFMList(2)
		family.ACShowTopFMList(3)
		family.ACShowTopFMList(4)
		family.ACShowTopFMList(5)
		family.ACShowTopFMList(6)
		family.ACShowTopFMList(8)
		topfmlisttime = other.time() + 180
	end
	local fmindex = char.getInt(talkerindex,"家族索引")
	if fmindex < 1 then
		char.newMessageToCli(talkerindex, -1, "您还没有加入家族", "白色")
		return 0
	end
	if familytime[fmindex] == nil then
		family.ACShowMemberList(fmindex)
		familytime[fmindex] = other.time() + 180
	else
		if familytime[fmindex] <= other.time() then
			family.ACShowMemberList(fmindex)
			familytime[fmindex] = other.time() + 180
		end
	end
	--I|家族名|成员数量|族长名|声望|家族声望|个人声望|家族职位|精灵|家族气势|个人气势|徽章|编号|QQ|宗旨|守护兽|
	local fmrank = family.ShowFmRank(char.getWorkInt(talkerindex,"家族临时索引"))
--	token = "I|" .. char.getChar(talkerindex,"家族") .. "|" .. family.ShowFmJoinNum(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. other.getString(family.ShowMemberListData(fmindex,1),"|",2) .. "|" .. fmrank + 1 .. "|" .. family.ShowFmFame(fmrank) .. "|" .. math.floor(char.getInt(talkerindex,"声望") / 100) .. "|" .. char.getInt(talkerindex,"家族地位") .. "|" .. char.getInt(talkerindex,"家族类型") .. "|" .. math.floor(family.ShowFmMomnum(fmrank) / 100) .. "|" .. math.floor(char.getInt(talkerindex,"气势") / 100) .. "|" .. family.ShowFmBadge(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. fmindex .. "|" .. family.ShowFmQq(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. family.ShowFmRule(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. other.getString(family.ShowFmPetAttr(fmindex - 1)," ",1)
	token = "I|" .. char.getChar(talkerindex,"家族") .. "|" .. family.ShowMemberListNum(fmindex) .. "|" .. other.getString(family.ShowMemberListData(fmindex,1),"|",2) .. "|" .. fmrank + 1 .. "|" .. family.ShowFmFame(fmrank) .. "|" .. math.floor(char.getInt(talkerindex,"声望") / 100) .. "|" .. char.getInt(talkerindex,"家族地位") .. "|" .. family.ShowFmSprite(fmindex - 1) .. "|" .. math.floor(family.ShowFmMomnum(fmrank) / 100) .. "|" .. math.floor(char.getInt(talkerindex,"气势")) .. "|" .. family.ShowFmBadge(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. fmindex .. "|" .. family.ShowFmQq(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. family.ShowFmRule(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. other.getString(family.ShowFmPetAttr(fmindex - 1)," ",1)
	lssproto.windows(talkerindex, 1200, 0, 0, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

function ShowFamilyList(talkerindex)
	if topfmlisttime < other.time() then
		--family.ShowFamilyListfromSaac()		
		family.ACShowTopFMList(1)
		family.ACShowTopFMList(2)
		family.ACShowTopFMList(3)
		family.ACShowTopFMList(4)
		family.ACShowTopFMList(5)
		family.ACShowTopFMList(6)
		family.ACShowTopFMList(8)
		topfmlisttime = other.time() + 180
	end
	--O|总页数|当前页数|当前数量|家族索引|家族名家|族长名家|总声望|总人数|是否成立|是否可加人|...家族索引|家族名家|族长名家|总声望|总人数|是否成立|是否可加人|
	local page = 1
	local pagetotal = math.ceil(family.ShowFamilyListNum() / 10)
	if pagetotal > 0 then
		if page < 1 or page > pagetotal then
			return
		end
	end
	local familynum = 0
	if page > 0 then
		familynum = math.min(family.ShowFamilyListNum() - (page - 1) * 10,10)
	end
	local ShowFamilyList = ""
	token = "O|" .. pagetotal .. "|1|" .. familynum
	if familynum > 0 then
		for i=(page - 1) * 10 + 1,(page - 1) * 10 + familynum do
			ShowFamilyList = family.ShowFamilyList(i)
			token = token .. "|" .. other.getString(ShowFamilyList," ",1) .. "|" .. other.getString(ShowFamilyList," ",2) .. "|" .. other.getString(ShowFamilyList," ",3) .. "|" .. other.getString(ShowFamilyList," ",4) .. "|" .. other.getString(ShowFamilyList," ",5) .. "|" .. other.getString(ShowFamilyList," ",7) .. "|" .. other.getString(ShowFamilyList," ",8)
		end
	end
	lssproto.windows(talkerindex, 1201, 0, 0, char.getWorkInt( npcindex, "对象"), token)
	--WindowTalked(npcindex,talkerindex,0,0,"G|1")
	return 0
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	--print("\nseqno=" .. seqno .. ",select=" .. select .. ",data=" .. data)
	if select == -1 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		if type == "O" then
			local fmtype = other.getString(data,"|",2)
			if fmtype == "" then
				return
			end
			if other.atoi(fmtype) == 1 then--家族详细信息
				local fmindex = char.getInt(talkerindex,"家族索引")
				if fmindex < 1 then
					char.newMessageToCli(talkerindex, -1, "您还没有加入家族", "白色")
					return
				end
				--I|家族名|成员数量|族长名|声望|家族声望|个人声望|家族职位|精灵|家族气势|个人气势|徽章|编号|QQ|宗旨|守护兽|
				local fmrank = family.ShowFmRank(char.getWorkInt(talkerindex,"家族临时索引"))
--				token = "I|" .. char.getChar(talkerindex,"家族") .. "|" .. family.ShowFmJoinNum(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. other.getString(family.ShowMemberListData(fmindex,1),"|",2) .. "|" .. fmrank + 1 .. "|" .. family.ShowFmFame(fmrank) .. "|" .. math.floor(char.getInt(talkerindex,"声望") / 100) .. "|" .. char.getInt(talkerindex,"家族地位") .. "|" .. char.getInt(talkerindex,"家族类型") .. "|" .. math.floor(family.ShowFmMomnum(fmrank) / 100) .. "|" .. math.floor(char.getInt(talkerindex,"气势")) .. "|" .. family.ShowFmBadge(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. fmindex .. "|" .. family.ShowFmQq(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. family.ShowFmRule(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. other.getString(family.ShowFmPetAttr(fmindex - 1)," ",1)
				token = "I|" .. char.getChar(talkerindex,"家族") .. "|" .. family.ShowMemberListNum(fmindex) .. "|" .. other.getString(family.ShowMemberListData(fmindex,1),"|",2) .. "|" .. fmrank + 1 .. "|" .. family.ShowFmFame(fmrank) .. "|" .. math.floor(char.getInt(talkerindex,"声望") / 100) .. "|" .. char.getInt(talkerindex,"家族地位") .. "|" .. family.ShowFmSprite(fmindex - 1) .. "|" .. math.floor(family.ShowFmMomnum(fmrank) / 100) .. "|" .. math.floor(char.getInt(talkerindex,"气势")) .. "|" .. family.ShowFmBadge(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. fmindex .. "|" .. family.ShowFmQq(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. family.ShowFmRule(char.getWorkInt(talkerindex,"家族临时索引")) .. "|" .. other.getString(family.ShowFmPetAttr(fmindex - 1)," ",1)
				lssproto.windowsupdate(talkerindex, 1200, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif other.atoi(fmtype) == 2 then--成员窗口
				local fmindex = char.getInt(talkerindex,"家族索引")
				if fmindex < 1 then
					char.newMessageToCli(talkerindex, -1, "您还没有加入家族", "白色")
					return
				end
				local fmmembernum = family.ShowMemberListNum(fmindex)
				local fmmemberpagetotal = math.ceil(fmmembernum / 10)
				token = "M|O|" .. fmmemberpagetotal .. "|" .. math.min(fmmembernum,10) .. "|" .. family.ShowFmAccept(fmindex)
				for i=1,math.min(fmmembernum,10) do
					memberdata = family.ShowMemberListData(fmindex,i)
					token = token .. "|" .. other.getString(memberdata,"|",1) .. "|" .. other.getString(memberdata,"|",2) .. "|" .. other.getString(memberdata,"|",3) .. "|" .. other.getString(memberdata,"|",4) .. "|" .. other.getString(memberdata,"|",5) .. "|" .. other.getString(memberdata,"|",7) .. "|" .. other.getString(memberdata,"|",9)
				end
				lssproto.windowsupdate(talkerindex, 1200, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif other.atoi(fmtype) == 3 then--排程窗口
				pktype = {5,5,2,1}
				token = "S"
				for i=1,4 do
					fmpktime = 0
					sqltoken = "select `time` from `fmpointdata` where `id`=" .. i
					ret = sasql.query(sqltoken)
					if ret == 1 then
						sasql.free_result()--释放内存
						sasql.store_result()--释放query内存
						num = sasql.num_rows()--返回结果集中行的数目
						if num > 0 then
							sasql.fetch_row()
							fmpktime = other.atoi(sasql.data(1))
						end
					end
					fmhostname = family.getFamilyPkHostName(i)
					if fmhostname == "" then
						fmhostname = "无"
					end
					fmguestname = family.getFamilyPkGuestName(i)
					if fmguestname == "" then
						fmguestname = "无"
					end
					fmpktimebuff = ""
					if family.getFamilyPkTime(i) > 0 then
						fmpktimebuff = os.date("%m月%d日 %H:%M",family.getFamilyPkTime(i))
					end
					if i == 2 then
						local nWeekDay = tonumber(os.date("%w",  family.getFamilyPkTime(i)))
						if nWeekDay == 1 then 
							pktype[i] = 1
						elseif nWeekDay == 2 or nWeekDay == 3 then 
							pktype[i] = nWeekDay
						else
							pktype[i] = 5
						end
					end
					token = token .. "|" .. math.floor((other.time() - fmpktime) / 86400) .. "|[" .. pktype[i] .. "对" .. pktype[i] .. "]|50|" .. fmhostname .. "|" .. fmguestname .. "|" .. fmpktimebuff
				end
				lssproto.windowsupdate(talkerindex, 1200, 0, 0, char.getWorkInt( meindex, "对象"), token)
			elseif other.atoi(fmtype) == 4 then--强者窗口
				local fmpointid = {-1,-1,-1,-1}
				local fmpointname = {"","","",""}
				local fmpointleadername = {"","","",""}
				local topnum = family.ShowFamilyTopNum()
				local pagetotal = math.min(math.ceil(topnum / 10),5)
				token = "K|S|" .. pagetotal
				for i=1,4 do
					fmpointid[i] = other.atoi(other.getString(family.ShowPointListArray(i - 1),"|",5))
					fmpointname[i] = other.getString(family.ShowPointListArray(i - 1),"|",6)
					if fmpointname[i] == "-1" then
						fmpointname[i] = ""
					end
					fmpointleadername[i] = other.getString(family.ShowFamilyList(fmpointid[i])," ",3)
					token = token .. "|" .. fmpointname[i] .. "|" .. fmpointleadername[i]
				end
				token = token .. "|" .. math.min(topnum,10)
				for i=1,math.min(topnum,10) do
					local sumdp = other.atoi(other.getString(family.ShowFamilyTop(i - 1),"|",5))
					local taldp = other.atoi(other.getString(family.ShowFamilyTop(i - 1),"|",6))
					token = token .. "|" .. other.getString(family.ShowFamilyTop(i - 1),"|",3) .. "|" .. other.getString(family.ShowFamilyTop(i - 1),"|",4) .. "|" .. sumdp .. "|" .. taldp - sumdp .. "|" .. taldp
				end
				lssproto.windowsupdate(talkerindex, 1200, 0, 0, char.getWorkInt( meindex, "对象"), token)
			end
		end
	elseif select == 0 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		
		if type == "U" then
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			if char.getInt(talkerindex,"家族地位") ~= 3 then
				char.newMessageToCli(talkerindex, -1, "您不是族长哦", "白色")
				return
			end
			local fmbage = other.getString(data,"|",2)
			local fmqq = other.getString(data,"|",3)
			local fmrule = other.getString(data,"|",4)
			local fmpethaveid = other.getString(data,"|",5)
			-- if fmbage == "" or fmqq == "" or fmrule == "" or fmpethaveid == "" then
			-- 	return
			-- end
			if fmrule == "" then
				fmrule = "."
			end		
			fmbage = other.atoi(fmbage)
			fmpethaveid = other.atoi(fmpethaveid)
			local petname = family.ShowFmPetName(fmindex - 1)
			local petarr = family.ShowFmPetAttr(fmindex - 1)
			if fmpethaveid >= 0 and fmpethaveid <= 4 then
				local petindex = char.getCharPet(talkerindex,fmpethaveid)
				if char.check(petindex) == 0 then
					return
				end
				char.setInt(petindex,"守护兽",1)
				petname = char.getChar(petindex,"名字")
				petarr = char.getInt(petindex,"图像号") .. " " .. char.getWorkInt(petindex,"攻击") .. " " .. char.getWorkInt(petindex,"防御") .. " " .. char.getWorkInt(petindex,"敏捷")
				for i=1,5 do
					if i ~= fmpethaveid + 1 then
						petindex = char.getCharPet(talkerindex,i - 1)
						if char.check(petindex) == 1 then
							if char.getInt(petindex,"守护兽") == 1 then
								char.setInt(petindex,"守护兽",0)
							end
						end
					end
				end
			end
			if fmbage < 0 or fmbage > 50 then
				return
			end
			saacproto.ACFixFMData(talkerindex,99,fmbage + 59000 .. "|" .. fmqq .. "|" .. fmrule .. "|" .. petname,petarr)
			char.newMessageToCli(talkerindex,-1,"修改家族信息成功","白色")
			family.ACShowMemberList(fmindex)
			familytime[fmindex] = other.time() + 180
		elseif type == "G" then--获取家族列表
			local page = other.getString(data,"|",2)
			if page == "" then
				return
			end
			page = other.atoi(page)
			--O|总页数|当前页数|当前数量|家族索引|家族名家|族长名家|总声望|总人数|是否成立|是否可加人|...家族索引|家族名家|族长名家|总声望|总人数|是否成立|是否可加人|
			local pagetotal = math.ceil(family.ShowFamilyListNum() / 10)
			if page < 1 or page > pagetotal then
				return
			end
			local familynum = math.min(family.ShowFamilyListNum() - (page - 1) * 10,10)
			local ShowFamilyList = ""
			token = "O|" .. pagetotal .. "|" .. page .. "|" .. familynum
			for i=(page - 1) * 10 + 1,(page - 1) * 10 + familynum do
				ShowFamilyList = family.ShowFamilyList(i)
				token = token .. "|" .. other.getString(ShowFamilyList," ",1) .. "|" .. other.getString(ShowFamilyList," ",2) .. "|" .. other.getString(ShowFamilyList," ",3) .. "|" .. other.getString(ShowFamilyList," ",4) .. "|" .. other.getString(ShowFamilyList," ",5) .. "|" .. other.getString(ShowFamilyList," ",7) .. "|" .. other.getString(ShowFamilyList," ",8)
			end
			lssproto.windowsupdate(talkerindex, 1201, 0, 0, char.getWorkInt( meindex, "对象"), token)
		elseif type == "X" then--获取家族详细信息
			local fmname = other.getString(data,"|",2)
			local fmindex = other.getString(data,"|",3)
			if fmname  == "" or fmindex == "" then
				return
			end
			fmindex = other.atoi(fmindex)
			if fmindex < 1 or fmindex > 4000 then
				return
			end
			--X|家族索引|家族名字|守护兽形象|精灵|宗旨|
			token = "X|" .. fmindex .. "|" .. fmname .. "|" .. other.getString(family.ShowFmPetAttr(fmindex - 1)," ",1) .. "|" .. family.ShowFmSprite(fmindex - 1) .. "|" .. family.ShowFmRule(fmindex - 1)
			lssproto.windowsupdate(talkerindex, 1201, 0, 0, char.getWorkInt( meindex, "对象"), token)
		elseif type == "J" then--加入家族
			local fmindex = other.getString(data,"|",2)
			local fmname = other.getString(data,"|",3)
			if fmindex == "" or fmname == "" then
				return
			end
			--[[fmhostname = ""
			fmguestname = ""
			for i=1,4 do
				fmhostname = family.getFamilyPkHostName(i)
				fmguestname = family.getFamilyPkGuestName(i)
			end
			if fmname == fmhostname or fmname == fmguestname then
				char.newMessageToCli(talkerindex, -1, "您加入的家族正在约战中", "白色")
				return
			end]]
			fmindex = other.atoi(fmindex)
			family.Family(talkerindex,"J|" .. fmindex - 1 .. "|" .. fmindex .. "|" .. fmname .. "|" .. family.ShowFmSprite(fmindex - 1) )
			if char.getInt(talkerindex,"等级") >= 30 then
				other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,611,0})
			end
		end
	elseif select == 1 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		if type == "G" then
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			local type2 = other.getString(data,"|",2)
			if type2 == "" then
				return
			end
			type2 = other.atoi(type2)
			if type2 < 0 or type2 > 1 then
				return
			end
			if type2 == 0 then
				WindowTalked ( meindex, talkerindex, 0, -1, "O|2")
			elseif type2 == 1 then
				local fmmembernum = family.ShowMemberListNum(fmindex)
				local indexnum = 0
				token = ""
				for i=1,fmmembernum do
					memberdata = family.ShowMemberListData(fmindex,i)
					if other.atoi(other.getString(memberdata,"|",7)) == 4 and other.atoi(other.getString(memberdata,"|",8)) == config.getServernumber() then
						token = token .. "|" .. other.getString(memberdata,"|",1) .. "|" .. other.getString(memberdata,"|",2) .. "|" .. other.getString(memberdata,"|",3) .. "|" .. other.getString(memberdata,"|",4) .. "|" .. other.getString(memberdata,"|",5) .. "|" .. other.getString(memberdata,"|",7) .. "|" .. other.getString(memberdata,"|",9)
						indexnum = indexnum + 1
					end
				end
				token = "E|" .. indexnum .. token
				lssproto.windowsupdate(talkerindex, 1200, 0, 0, char.getWorkInt( meindex, "对象"), token)
			end
		elseif type == "R" then--更改成员
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			local memberindex = other.getString(data,"|",2)
			local accept = other.getString(data,"|",3)
			if memberindex == "" or accept == "" then
				return
			end
			memberindex = other.atoi(memberindex)
			accept = other.atoi(accept)
			local memberaccept = -1
			local membercharaindex = -1
			local member
			local fmmembernum = family.ShowMemberListNum(fmindex)
			for i=1,fmmembernum do
				memberdata = family.ShowMemberListData(fmindex,i)
				if other.atoi(other.getString(memberdata,"|",1)) == memberindex then
					memberaccept = other.atoi(other.getString(memberdata,"|",7))
					membercharaindex = memberindex
					break
				end
			end
			if accept == 0 then--剔除成员
				if memberaccept == 3 then
					return
				end
				if memberaccept == 4 then
					if char.getInt(talkerindex,"家族地位") ~= 3 then
						char.newMessageToCli(talkerindex, -1, "您不是族长哦", "白色")
						return
					end
				end
				if char.getInt(talkerindex,"家族地位") ~= 3 and char.getInt(talkerindex,"家族地位") ~= 4 then
					char.newMessageToCli(talkerindex, -1, "您没有资格哦", "白色")
					return
				end
				family.Family(talkerindex,"M|" .. other.getString(memberdata,"|",2) .. "|" .. membercharaindex .. "|" .. -1)
			elseif accept == 2 then--一般成员
				if memberaccept == 2 then
					if char.getInt(talkerindex,"家族地位") ~= 3 and char.getInt(talkerindex,"家族地位") ~= 4 then
						char.newMessageToCli(talkerindex, -1, "您没有资格哦", "白色")
						return
					end
				elseif memberaccept == 4 then
					if char.getInt(talkerindex,"家族地位") ~= 3 then
						char.newMessageToCli(talkerindex, -1, "您没有资格哦", "白色")
						return
					end
				elseif memberaccept == 1 or memberaccept == 3 then
					return
				end
				family.Family(talkerindex,"M|" .. other.getString(memberdata,"|",2) .. "|" .. membercharaindex .. "|" .. 1)
			elseif accept == 1 then--长老
				if char.getInt(talkerindex,"家族地位") ~= 3 then
					char.newMessageToCli(talkerindex, -1, "您没有资格哦", "白色")
					return
				end
				if memberaccept ~= 1 then
					return
				end
				family.Family(talkerindex,"M|" .. other.getString(memberdata,"|",2) .. "|" .. membercharaindex .. "|" .. 4)
			end
		elseif type == "Z" then--更改招募
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			if char.getInt(talkerindex,"家族地位") ~= 3 then
				char.newMessageToCli(talkerindex, -1, "您没有资格哦", "白色")
				return
			end
			local accept = other.getString(data,"|",2)
			if accept == "" then
				return
			end
			accept = other.atoi(accept)
			if accept < 0 or accept > 1 then
				return
			end
			family.Family(talkerindex,"T|" .. accept)
			family.ACShowMemberList(fmindex)
			familytime[fmindex] = other.time() + 180
		elseif type == "U" then--成员列表上一页下一页
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			local page = other.getString(data,"|",2)
			if page == "" then
				return
			end
			page = other.atoi(page)
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有加入家族", "白色")
				return
			end
			local fmmembernum = family.ShowMemberListNum(fmindex)
			local fmmemberpagetotal = math.ceil(fmmembernum / 10)
			if page < 1 or page > fmmemberpagetotal then
				return
			end
			token = "M|U|" .. math.min(fmmembernum - (page - 1) * 10,10)
			for i=(page - 1) * 10 + 1,(page - 1) * 10 + math.min(fmmembernum - (page - 1) * 10,10) do
				memberdata = family.ShowMemberListData(fmindex,i)
				token = token .. "|" .. other.getString(memberdata,"|",1) .. "|" .. other.getString(memberdata,"|",2) .. "|" .. other.getString(memberdata,"|",3) .. "|" .. other.getString(memberdata,"|",4) .. "|" .. other.getString(memberdata,"|",5) .. "|" .. other.getString(memberdata,"|",7) .. "|" .. other.getString(memberdata,"|",9)
			end
			lssproto.windowsupdate(talkerindex, 1200, 0, 0, char.getWorkInt( meindex, "对象"), token)
		elseif type == "K" then--退出解散家族
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			family.Family(talkerindex,"E|1")
		elseif type == "A" then--成立
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex >= 1 then
				char.newMessageToCli(talkerindex, -1, "您已经有家族了", "白色")
				return
			end
			family.Family(talkerindex,data)
		elseif type == "Q" then--族长让位
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			local memberindex = other.getString(data,"|",2)
			if memberindex == "" then
				return
			end
			
			local fmmembernum = family.ShowMemberListNum(fmindex)
			local indexnum = 0
			token = ""
			for i=1,fmmembernum do
				memberdata = family.ShowMemberListData(fmindex,i)
				if other.getString(memberdata,"|",1) == memberindex then
					if other.atoi(other.getString(memberdata,"|",7)) == 4 and other.atoi(other.getString(memberdata,"|",8)) == config.getServernumber() then
						for j=0,char.getPlayerMaxNum() - 1 do
							if char.check(j) == 1 then
								if char.getChar(j,"名字") == other.getString(memberdata,"|",2) and fmindex == char.getInt(j,"家族索引") and char.getInt(j,"家族地位") == 4 then
									char.setWorkInt(talkerindex,119,j)
									char.setWorkInt(j,119,talkerindex)
									lssproto.windows(j, 34, "确定", -1, -1, char.getChar(talkerindex,"名字") .. "|" .. talkerindex)
									return
								end
							end
						end
						--family.Family(talkerindex,"L|CHANGE|Q|" .. memberindex .. "|" .. other.getString(memberdata,"|",2))
						return
					end
					break
				end
			end
		end
	elseif select == 3 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		if type == "Z" then
			local fmindex = char.getInt(talkerindex,"家族索引")
			if fmindex < 1 then
				char.newMessageToCli(talkerindex, -1, "您还没有家族", "白色")
				return
			end
			if char.getInt(talkerindex,"家族地位") ~= 3 then
				char.newMessageToCli(talkerindex, -1, "您没有资格哦", "白色")
				return
			end
			local fmpointindex = other.getString(data,"|",2)
			if fmpointindex == "" then
				return
			end
			fmpointindex = other.atoi(fmpointindex)
			if fmpointindex < 0 or fmpointindex > 3 then
				return
			end
			local fmpointname = {"","","",""}
			fmpointdata = {{1041,607,563},{2031,73,588},{3031,497,354},{4031,274,532}}
			fmpointname[fmpointindex + 1] = other.getString(family.ShowPointListArray(fmpointindex),"|",6)
			if fmpointname[fmpointindex + 1] == "-1" then
				family.Family(talkerindex,"P|" .. fmpointindex .. "|" .. fmpointdata[fmpointindex + 1][1] .. "|" .. fmpointdata[fmpointindex + 1][2] .. "|" .. fmpointdata[fmpointindex + 1][3])
			end
		elseif type == "G" then
			local page = other.getString(data,"|",2)
			if page == "" then
				return
			end
			page = other.atoi(page)
			local topnum = family.ShowFamilyTopNum()
			local pagetotal = math.min(math.ceil(topnum / 10),5)
			if page < 1 or page > pagetotal then
				return
			end
			token = "K|L|" .. math.min(topnum - (page - 1) * 10,10)
			for i=(page - 1) * 10 + 1,(page - 1) * 10 +math.min(topnum - (page - 1) * 10,10) do
				local sumdp = other.atoi(other.getString(family.ShowFamilyTop(i - 1),"|",5))
				local taldp = other.atoi(other.getString(family.ShowFamilyTop(i - 1),"|",6))
				token = token .. "|" .. other.getString(family.ShowFamilyTop(i - 1),"|",3) .. "|" .. other.getString(family.ShowFamilyTop(i - 1),"|",4) .. "|" .. sumdp .. "|" .. taldp - sumdp .. "|" .. taldp
			end
			lssproto.windowsupdate(talkerindex, 1200, 0, 0, char.getWorkInt( meindex, "对象"), token)
		end
	end
end


function Create(name, metamo, floorid, x, y,dir)
	npcindex = npc.CreateNpc(name, metamo, floorid, x, y, dir)
	if char.check(npcindex) == 1 then
		char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
		for i=1,4000 do
			family.ACShowMemberList(i)
			familytime[i] = other.time() + 180
			family.ACFMReadMemo(i)
		end
		family.ACFMPointList()
		family.ACShowTopFMList(1)
		family.ACShowTopFMList(2)
		family.ACShowTopFMList(3)
		family.ACShowTopFMList(4)
		family.ACShowTopFMList(5)
		family.ACShowTopFMList(6)
		family.ACShowTopFMList(8)
	end
end

function data()
	topfmlisttime = 0
end

function main()
	familytime = {}
	data()
	Create("家族系统",26943,777,21,26,6)
end


