function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 1, 5 do
		if char.getCharPet(charaindex, i - 1) == -1 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function ShowTalked(meindex, talkerindex, showtype )
	if char.getInt(talkerindex,"地图号") == 41011 or char.getInt(talkerindex,"地图号") == 41012 then
		char.newMessageToCli(talkerindex,-1,"此地图不可以使用仓库","白色")
		return 0
	end
	poolpetnum = 10
	ret = sasql.query("select `petnum` from `pooldata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		sqlnum = sasql.num_rows()
		if sqlnum > 0 then
			sasql.fetch_row()
			poolpetnum = other.atoi(sasql.data(1))
		else
			sasql.query("insert into `pooldata` values ('" .. char.getChar(talkerindex,"账号") .. "',10,15)")
		end
		ret = sasql.query("select * from `poolpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				token = "L|" .. sqlnum .. "|" .. poolpetnum .. "|" .. vippoint[poolpetnum - 10 + 1] .. "|"
				for i=1,sqlnum do
					sasql.fetch_row()
					local vital = other.atoi(sasql.data(7))
					local str = other.atoi(sasql.data(8))
					local tough = other.atoi(sasql.data(9))
					local dex = other.atoi(sasql.data(10))
					local fixhp = math.floor((vital * 4 + str + tough + dex) * 0.01)
					token = token .. sasql.data(39)  .. "|" .. sasql.data(6) .. "|" .. fixhp .. "|"
							.. sasql.data(13) .. "|" .. sasql.data(14) .. "|" .. sasql.data(15) .. "|" .. sasql.data(16) .. "|" .. sasql.data(43) .. "|"--宠物名|等级|血|地|水|火|风|索引|
				end
			else
				token = "L|0|" .. poolpetnum .. "|" .. vippoint[poolpetnum - 10 + 1]
			end
			if showtype == 1 then
				lssproto.windows(talkerindex, "仓库宠物框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
			else
				lssproto.NewSaMenu(char.getFd(talkerindex), 1,token)
			end
		end
	end
	return 0
end

function ShowWindowTalked(meindex, talkerindex,data, showtype )
	if data == "" then
		return 0
	end
	if char.getInt(talkerindex,"地图号") == 41011 or char.getInt(talkerindex,"地图号") == 41012 then
		char.newMessageToCli(talkerindex,-1,"此地图不可以使用仓库","白色")
		return 0
	end
	local type = other.getString(data,"|",1)
	if type == "C" then
		-- if char.getInt(talkerindex,"转数") < 1 and npc.CheckEvent(talkerindex,304) == 0 then
		-- 	char.newMessageToCli(talkerindex,-1,"条件未满足","白色")
		-- 	return 0
		-- end
		poolpetnum = 10
		ret = sasql.query("select `petnum` from `pooldata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				sasql.fetch_row()
				poolpetnum = other.atoi(sasql.data(1))
			else
				sasql.query("insert into `pooldata` values ('" .. char.getChar(talkerindex,"账号") .. "',10,15)")
			end
		end
		ret = sasql.query("select * from `poolpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum >= poolpetnum then
				char.newMessageToCli(talkerindex,-1,"您的仓库已满","白色")
				return 0
			else
				local pethaveid = other.getString(data,"|",2)
				if pethaveid == "" then
					return 0
				end
				if other.atoi(pethaveid) < 0 or other.atoi(pethaveid) > 4 then
					return 0
				end
				petindex = char.getCharPet(talkerindex,other.atoi(pethaveid))
				if char.check(petindex) == 1 then
					if char.getInt(petindex,"守护兽") == 3 then
						char.newMessageToCli(talkerindex,-1,"家族守护兽无法存入仓库","白色")
						return 0
					end
					--if string.sub(char.getChar(petindex,"名字"),1,1) ~= "*" then
						local petskillid = {-1,-1,-1,-1,-1,-1,-1}
						for j=1,7 do
							petskillid[j] = char.getPetSkill(petindex,j - 1)
						end
						token = "insert into `poolpet` VALUES ('" .. char.getChar(talkerindex,"账号") .. "'," .. char.getInt(petindex,"宠ID")
							.. "," .. char.getInt(petindex,"图像号")
							.. "," .. char.getInt(petindex,"原图像号") .. "," .. char.getInt(petindex,"方向") .. "," .. char.getInt(petindex,"等级") .. "," .. char.getInt(petindex,"体力")
							.. "," .. char.getInt(petindex,"腕力") .. "," .. char.getInt(petindex,"耐力") .. "," .. char.getInt(petindex,"速度") .. "," .. char.getInt(petindex,"模式AI")
							.. "," .. char.getInt(petindex,"可变AI") .. "," .. char.getInt(petindex,"地") .. "," .. char.getInt(petindex,"水") .. "," .. char.getInt(petindex,"火")
							.. "," .. char.getInt(petindex,"风") .. "," .. char.getInt(petindex,"宠技位") .. "," .. char.getInt(petindex,"暴击") .. "," .. char.getInt(petindex,"死亡次数")
							.. "," .. char.getInt(petindex,"损坏次数") .. "," .. char.getInt(petindex,"类型") .. "," .. char.getInt(petindex,"经验") .. "," .. char.getInt(petindex,"出生地")
							.. "," .. char.getInt(petindex,"能力值") .. "," .. char.getInt(petindex,"成长区间") .. "," .. char.getInt(petindex,"转数") .. "," .. char.getInt(petindex,"守护兽")
							.. "," .. char.getInt(petindex,"限制等级") .. "," .. char.getInt(petindex,"提升值") .. "," .. char.getInt(petindex,"无声望模式") .. "," .. char.getInt(petindex,"极品")
							.. "," .. petskillid[1] .. "," .. petskillid[2] .. "," .. petskillid[3] .. "," .. petskillid[4] .. "," .. petskillid[5] .. "," .. petskillid[6]
							.. "," .. petskillid[7] .. ",'" .. char.getChar(petindex,"名字") .. "','" .. char.getChar(petindex,"昵称")
							.. "','" .. char.getChar(petindex,"称号") .. "','" .. char.getChar(petindex,"宠物四围") .. "','" .. char.getChar(petindex,"唯一编号") .. "'," .. char.getInt(petindex,"攻击特效") .. "," .. char.getInt(petindex,"安全锁") .. "," .. char.getInt(petindex,"证书骑宠") .. "," .. char.getInt(petindex,"证书骑宠1") .. "," .. char.getInt(petindex,"证书骑宠2") 
							.. ",'" .. char.getChar(petindex,"抓宠数据") .. "','" .. char.getChar(petindex,"宠物转生四围").. "')"
						ret = sasql.query(token)
						if ret == 1 then
							token = "Z|" .. char.getChar(petindex,"名字") .. "|" .. char.getInt(petindex,"等级") .. "|" .. char.getWorkInt(petindex,"最大HP") .. "|" .. char.getInt(petindex,"地")
									.. "|" .. char.getInt(petindex,"水") .. "|" .. char.getInt(petindex,"火") .. "|" .. char.getInt(petindex,"风") .. "|" .. char.getChar(petindex,"唯一编号") .. "|"
							if showtype == 1 then
								lssproto.windowsupdate(talkerindex, "仓库宠物框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
							else
								lssproto.NewSaMenu(char.getFd(talkerindex), 1,token)
							end
							char.DelPet(talkerindex,petindex)
							--char.charSaveFromConnect(talkerindex)
						end
					--else
					--	char.newMessageToCli(talkerindex,-1,"绑定宠物无法存入仓库","白色")
					--	return 0
					--end
				end
			end
		end
	elseif type == "B" then
		local uid = other.getString(data,"|",2)
		if uid == "" then
			return 0
		end
		ret = sasql.query("select * from `poolpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `CHAR_UNIQUECODE`='" .. uid .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				if checkEmptPetNum(talkerindex) == 0 then
					char.newMessageToCli(talkerindex,-1,"宠物栏无空位，无法取回宠物","白色")
					return 0
				end
				sasql.fetch_row()
				local petid = other.atoi(sasql.data(2))
				local CHAR_BASEIMAGENUMBER = other.atoi(sasql.data(3))
				local CHAR_BASEBASEIMAGENUMBER = other.atoi(sasql.data(4))
				local CHAR_DIR = other.atoi(sasql.data(5))
				local CHAR_LV = other.atoi(sasql.data(6))
				local CHAR_VITAL = other.atoi(sasql.data(7))
				local CHAR_STR = other.atoi(sasql.data(8))
				local CHAR_TOUGH = other.atoi(sasql.data(9))
				local CHAR_DEX = other.atoi(sasql.data(10))
				local CHAR_MODAI = other.atoi(sasql.data(11))
				local CHAR_VARIABLEAI = other.atoi(sasql.data(12))
				local CHAR_EARTHAT  = other.atoi(sasql.data(13))
				local CHAR_WATERAT = other.atoi(sasql.data(14))
				local CHAR_FIREAT = other.atoi(sasql.data(15))
				local CHAR_WINDAT = other.atoi(sasql.data(16))
				local CHAR_SLOT  = other.atoi(sasql.data(17))
				local CHAR_CRITIAL = other.atoi(sasql.data(18))
				local CHAR_DEADCOUNT  = other.atoi(sasql.data(19))
				local CHAR_DAMAGECOUNT  = other.atoi(sasql.data(20))
				local CHAR_WHICHTYPE  = other.atoi(sasql.data(21))
				local CHAR_EXP = other.atoi(sasql.data(22))
				local CHAR_LASTTALKELDER = other.atoi(sasql.data(23))
				local CHAR_ALLOCPOINT  = other.atoi(sasql.data(24))
				local CHAR_PETRANK = other.atoi(sasql.data(25))
				local CHAR_TRANSMIGRATION  = other.atoi(sasql.data(26))
				local CHAR_PETFAMILY = other.atoi(sasql.data(27))
				local CHAR_LIMITLEVEL = other.atoi(sasql.data(28))
				local CHAR_BEATITUDE = other.atoi(sasql.data(29))
				local CHAR_NOFAME = other.atoi(sasql.data(30))
				local CHAR_SUPER = other.atoi(sasql.data(31))
				local PETSKILL1 = other.atoi(sasql.data(32))
				local PETSKILL2 = other.atoi(sasql.data(33))
				local PETSKILL3 = other.atoi(sasql.data(34))
				local PETSKILL4 = other.atoi(sasql.data(35))
				local PETSKILL5 = other.atoi(sasql.data(36))
				local PETSKILL6 = other.atoi(sasql.data(37))
				local PETSKILL7 = other.atoi(sasql.data(38))
				local CHAR_NAME = sasql.data(39)
				local CHAR_USERPETNAME = sasql.data(40)
				local CHAR_NEWNAME = sasql.data(41)
				local CHAR_PET_4V  = sasql.data(42)
				local CHAR_UNIQUECODE = sasql.data(43)
				local CHAR_ATTACK_EFFECT = other.atoi(sasql.data(44))
				local CHAR_LOCKED = other.atoi(sasql.data(45))
				local CHAR_LOWRIDEPETS = other.atoi(sasql.data(46))
				local CHAR_LOWRIDEPETS1 = other.atoi(sasql.data(47))
				local CHAR_HIGHRIDEPET2 = other.atoi(sasql.data(48))
				local CHAR_CAPTURE_DATA = sasql.data(49)
				local CHAR_PETTRN_4V = sasql.data(50)
				if char.getInt(talkerindex,"转数") < 1 and char.getInt(talkerindex,"等级") + 5 < CHAR_LV then
					char.newMessageToCli(talkerindex,-1,"您的能力无法照顾该宠物","白色")
					return 0
				end
				ret = sasql.query("delete from `poolpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `CHAR_UNIQUECODE`='" .. uid .. "'")
				if ret == 1 then
					petindex = char.AddPetTempNo(talkerindex,petid,1)
					if char.check(petindex) == 1 then
						char.setInt(petindex,"图像号",CHAR_BASEIMAGENUMBER)
						char.setInt(petindex,"原图像号",CHAR_BASEBASEIMAGENUMBER)
						char.setInt(petindex,"方向",CHAR_DIR)
						char.setInt(petindex,"等级",CHAR_LV)
						char.setInt(petindex,"体力",CHAR_VITAL)
						char.setInt(petindex,"腕力",CHAR_STR)
						char.setInt(petindex,"耐力",CHAR_TOUGH)
						char.setInt(petindex,"速度",CHAR_DEX)
						char.setInt(petindex,"模式AI",CHAR_MODAI)
						char.setInt(petindex,"可变AI",CHAR_VARIABLEAI)
						char.setInt(petindex,"地",CHAR_EARTHAT)
						char.setInt(petindex,"水",CHAR_WATERAT)
						char.setInt(petindex,"火",CHAR_FIREAT)
						char.setInt(petindex,"风",CHAR_WINDAT)
						char.setInt(petindex,"宠技位",CHAR_SLOT)
						char.setInt(petindex,"暴击",CHAR_CRITIAL)
						char.setInt(petindex,"死亡次数",CHAR_DEADCOUNT)
						char.setInt(petindex,"损坏次数",CHAR_DAMAGECOUNT)
						char.setInt(petindex,"类型",CHAR_WHICHTYPE)
						char.setInt(petindex,"经验",CHAR_EXP)
						char.setInt(petindex,"出生地",CHAR_LASTTALKELDER)
						char.setInt(petindex,"能力值",CHAR_ALLOCPOINT)
						char.setInt(petindex,"成长区间",CHAR_PETRANK)
						char.setInt(petindex,"转数",CHAR_TRANSMIGRATION)
						char.setInt(petindex,"守护兽",CHAR_PETFAMILY)
						char.setInt(petindex,"限制等级",CHAR_LIMITLEVEL)
						char.setInt(petindex,"提升值",CHAR_BEATITUDE)
						char.setInt(petindex,"无声望模式",CHAR_NOFAME)
						char.setInt(petindex,"极品",CHAR_SUPER)
						char.setChar(petindex,"名字",CHAR_NAME)
						char.setChar(petindex,"昵称",CHAR_USERPETNAME)
						char.setChar(petindex,"称号",CHAR_NEWNAME)
						char.setChar(petindex,"宠物四围",CHAR_PET_4V)
						char.setChar(petindex,"唯一编号",CHAR_UNIQUECODE)
						char.setInt(petindex,"攻击特效",CHAR_ATTACK_EFFECT)
						char.setInt(petindex,"安全锁",CHAR_LOCKED)
						char.setInt(petindex,"证书骑宠",CHAR_LOWRIDEPETS)
						char.setInt(petindex,"证书骑宠1",CHAR_LOWRIDEPETS1)
						char.setInt(petindex,"证书骑宠2",CHAR_HIGHRIDEPET2)
						char.setChar(petindex,"抓宠数据",CHAR_CAPTURE_DATA)
						char.setChar(petindex,"宠物转生四围",CHAR_PETTRN_4V)
						char.setPetSkill(petindex,0,PETSKILL1)
						char.setPetSkill(petindex,1,PETSKILL2)
						char.setPetSkill(petindex,2,PETSKILL3)
						char.setPetSkill(petindex,3,PETSKILL4)
						char.setPetSkill(petindex,4,PETSKILL5)
						char.setPetSkill(petindex,5,PETSKILL6)
						char.setPetSkill(petindex,6,PETSKILL7)
						char.complianceParameter(petindex)
						char.setInt(petindex,"HP",char.getWorkInt(petindex,"最大HP"))
						other.CallFunction("petattupdate", "data/ablua/npc/petatterrect/petatterrect.lua", {petindex})
						for i=1,5 do
							if char.getCharPet(talkerindex, i - 1) == petindex then
								char.sendStatusString(talkerindex,"K" .. i - 1)
								char.sendStatusString(talkerindex,"W" .. i - 1)
								break
							end
						end
						--char.charSaveFromConnect(talkerindex)
					end
					token = "D|" .. uid .. "|"
					if showtype == 1 then
						lssproto.windowsupdate(talkerindex, "仓库宠物框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
					else
						lssproto.NewSaMenu(char.getFd(talkerindex), 1,token)
					end
				end
			end
		end
	elseif type == "X" then
		local uid = other.getString(data,"|",2)
		if uid == "" then
			return 0
		end
		ret = sasql.query("select * from `poolpet` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "' and `CHAR_UNIQUECODE`='" .. uid .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				sasql.fetch_row()
				local petid = other.atoi(sasql.data(2))
				local CHAR_BASEIMAGENUMBER = other.atoi(sasql.data(3))
				local CHAR_BASEBASEIMAGENUMBER = other.atoi(sasql.data(4))
				local CHAR_DIR = other.atoi(sasql.data(5))
				local CHAR_LV = other.atoi(sasql.data(6))
				local CHAR_VITAL = other.atoi(sasql.data(7))
				local CHAR_STR = other.atoi(sasql.data(8))
				local CHAR_TOUGH = other.atoi(sasql.data(9))
				local CHAR_DEX = other.atoi(sasql.data(10))
				local CHAR_MODAI = other.atoi(sasql.data(11))
				local CHAR_VARIABLEAI = other.atoi(sasql.data(12))
				local CHAR_EARTHAT  = other.atoi(sasql.data(13))
				local CHAR_WATERAT = other.atoi(sasql.data(14))
				local CHAR_FIREAT = other.atoi(sasql.data(15))
				local CHAR_WINDAT = other.atoi(sasql.data(16))
				local CHAR_SLOT  = other.atoi(sasql.data(17))
				local CHAR_CRITIAL = other.atoi(sasql.data(18))
				local CHAR_DEADCOUNT  = other.atoi(sasql.data(19))
				local CHAR_DAMAGECOUNT  = other.atoi(sasql.data(20))
				local CHAR_WHICHTYPE  = other.atoi(sasql.data(21))
				local CHAR_EXP = other.atoi(sasql.data(22))
				local CHAR_LASTTALKELDER = other.atoi(sasql.data(23))
				local CHAR_ALLOCPOINT  = other.atoi(sasql.data(24))
				local CHAR_PETRANK = other.atoi(sasql.data(25))
				local CHAR_TRANSMIGRATION  = other.atoi(sasql.data(26))
				local CHAR_PETFAMILY = other.atoi(sasql.data(27))
				local CHAR_LIMITLEVEL = other.atoi(sasql.data(28))
				local CHAR_BEATITUDE = other.atoi(sasql.data(29))
				local CHAR_NOFAME = other.atoi(sasql.data(30))
				local CHAR_SUPER = other.atoi(sasql.data(31))
				local PETSKILL1 = other.atoi(sasql.data(32))
				local PETSKILL2 = other.atoi(sasql.data(33))
				local PETSKILL3 = other.atoi(sasql.data(34))
				local PETSKILL4 = other.atoi(sasql.data(35))
				local PETSKILL5 = other.atoi(sasql.data(36))
				local PETSKILL6 = other.atoi(sasql.data(37))
				local PETSKILL7 = other.atoi(sasql.data(38))
				local CHAR_NAME = sasql.data(39)
				local CHAR_USERPETNAME = sasql.data(40)
				local CHAR_NEWNAME = sasql.data(41)
				local CHAR_PET_4V  = sasql.data(42)
				local CHAR_UNIQUECODE = sasql.data(43)
				local petoldlv = other.getString(CHAR_PET_4V,"|",5)
				local petoldhp = other.getString(CHAR_PET_4V,"|",1)
				local petoldstr = other.getString(CHAR_PET_4V,"|",2)
				local petoldtou = other.getString(CHAR_PET_4V,"|",3)
				local petolddex = other.getString(CHAR_PET_4V,"|",4)
				local fixstr = math.floor(CHAR_STR * 0.01 + CHAR_TOUGH * 0.01 * 0.1 + CHAR_VITAL * 0.01 * 0.1 + CHAR_DEX * 0.01 * 0.05)
				local fixtough = math.floor(CHAR_TOUGH * 0.01 + CHAR_STR * 0.01 * 0.1 + CHAR_VITAL * 0.01 * 0.1 + CHAR_DEX * 0.01 * 0.05)
				local fixdex = math.floor(CHAR_DEX * 0.01)
				local fixhp = math.floor((CHAR_VITAL * 4 + CHAR_STR + CHAR_TOUGH + CHAR_DEX) * 0.01)
				token = "I|" .. uid .. "|" .. CHAR_BASEIMAGENUMBER .. "|" .. CHAR_TRANSMIGRATION .. "|" .. fixstr .. "|" .. fixtough .. "|" .. fixdex .. "|" .. petoldlv .. "|" .. petoldhp .. "|"
						.. petoldstr .. "|" .. petoldtou .. "|" .. petolddex .. "|" .. CHAR_SLOT .. "|"
				local petskillname = ""
				for i=1,CHAR_SLOT do
					petskillindex = petskill.getPetskillArray(other.atoi(sasql.data(31 + i)));
					if petskill.check(petskillindex) == 1 then
						petskillname = petskillname .. petskill.getChar(petskillindex,"名称") .. "|"
					else
						petskillname = petskillname .. "|"
					end
				end
				token = token .. petskillname
				if CHAR_NEWNAME == "" then
					if petid == 718 then
						token = token .. other.NumRightToNum(CHAR_ALLOCPOINT,24) .. "|" .. other.NumRightToNum(CHAR_ALLOCPOINT,16) .. "|" .. other.NumRightToNum(CHAR_ALLOCPOINT,8) .. "|" .. other.NumRightToNum(CHAR_ALLOCPOINT,0) .. "|" .. char.getPet4v(CHAR_VITAL,CHAR_STR,CHAR_TOUGH,CHAR_DEX,0,0,0,0)
					else
						token = token .. "0|0|0|0|" .. char.getPet4v(CHAR_VITAL,CHAR_STR,CHAR_TOUGH,CHAR_DEX,0,0,0,0)
					end
				else 
					token = token .. CHAR_NEWNAME .. "|" .. char.getPet4v(CHAR_VITAL,CHAR_STR,CHAR_TOUGH,CHAR_DEX,other.atoi(other.getString(CHAR_NEWNAME,"|",1)),other.atoi(other.getString(CHAR_NEWNAME,"|",2)),other.atoi(other.getString(CHAR_NEWNAME,"|",3)),other.atoi(other.getString(CHAR_NEWNAME,"|",4)))
				end
				if showtype == 1 then
					lssproto.windowsupdate(talkerindex, "仓库宠物框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
				else
					lssproto.NewSaMenu(char.getFd(talkerindex), 1,token)
				end
			end
		end
	elseif type == "H" then
		poolpetnum = 10
		ret = sasql.query("select `petnum` from `pooldata` where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			if sqlnum > 0 then
				sasql.fetch_row()
				poolpetnum = other.atoi(sasql.data(1))
			else
				sasql.query("insert into `pooldata` values ('" .. char.getChar(talkerindex,"账号") .. "',10,15)")
			end
			if vippoint[poolpetnum - 10 + 1] < 0 then
				return 0
			end
			if sasql.getVipPoint(talkerindex) < vippoint[poolpetnum - 10 + 1] then
				char.newMessageToCli(talkerindex,-1,"您的金币不足","白色")
				return 0
			end
			ret = sasql.query("update `pooldata` set `petnum`=" .. poolpetnum + 1 .. " where `cdkey`='" .. char.getChar(talkerindex,"账号") .. "'")
			if ret == 1 then
				local myvippoint = sasql.getVipPoint(talkerindex)
				sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - vippoint[poolpetnum - 10 + 1])
				other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,vippoint[poolpetnum - 10 + 1]})
				other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {talkerindex,4,vippoint[poolpetnum - 10 + 1]})
				token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -vippoint[poolpetnum - 10 + 1] .. "," .. myvippoint .. "," .. myvippoint - vippoint[poolpetnum - 10 + 1] .. ",'购买宠物仓库位置扣除" .. vippoint[poolpetnum - 10 + 1] .. "金币',NOW())"
				sasql.query(token)
				char.newMessageToCli(talkerindex,-1,"扣除金币" .. vippoint[poolpetnum - 10 + 1],"白色")
				token = "H|" .. poolpetnum + 1 .. "|" .. vippoint[poolpetnum - 10 + 1 + 1]
				if showtype == 1 then
					lssproto.windowsupdate(talkerindex, "仓库宠物框", "取消", 0, char.getWorkInt( meindex, "对象"), token)
				else
					lssproto.NewSaMenu(char.getFd(talkerindex), 1,token)
				end
				other.CallFunction("GetGoldSend","data/ablua/dispatchmessage.lua",{talkerindex})
			end
		end
	end
	return 0
end

--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		ShowTalked(meindex, talkerindex, 1 )
	end
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		ShowWindowTalked( meindex, talkerindex, data,1)
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
	vippoint = {10,10,20,20,30,30,40,40,50,50,100,100,150,150,200,200,250,250,300,300,-1}
end

function main()
	data()
	Create("宠物店", 16038, 130, 49, 3, 4)
	Create("伊甸宠物店店长", 16027, 7009, 10, 5, 4)
	Create("塔耳塔宠物店店长", 16027, 7121, 5, 4, 4)
	Create("尼克斯宠物店店长", 16027, 7205, 10, 5, 4)
	Create("宠物店", 16038, 1003, 12, 13, 4)
	Create("柯奥的宠物店", 16046, 1103, 19, 17, 6)
	Create("柯尔克的宠物店", 16035, 1203, 14, 13, 4)
	Create("霍特尔的宠物店", 16048, 1303, 16, 13, 4)
	Create("卡坦的宠物店", 16016, 1403, 14, 13, 4)
	Create("宠物店", 16036, 2003, 18, 17, 6)
	Create("便民宠物店", 16036, 32021, 36, 28, 6)
	Create("宠物店", 16027, 3003, 12, 13, 4)
	Create("塔姆塔姆的宠物店", 16035, 3103, 16, 13, 4)
	Create("多多的宠物店", 16033, 3203, 18, 18, 6)
	Create("乌鲁力的宠物店", 16218, 3303, 16, 14, 4)
	Create("奇喀喀的宠物店", 16033, 3403, 18, 18, 6)
	Create("宠物店", 16038, 4003, 13, 13, 4)
	Create("宠物店", 16027, 5003, 21, 13, 4)
	Create("店主", 16019, 5103, 13, 12, 4)
	Create("宠物店", 16038, 2005, 6, 2, 4)--渔村医院
	Create("便民宠物店", 16036, 32021, 36, 28, 4)--渔村医院
end

