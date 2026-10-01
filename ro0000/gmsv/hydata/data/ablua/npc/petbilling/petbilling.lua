function UpdataPetBilling(talkerindex, petindex)
	for i=1,#nopetcdkey do
		if char.getChar(talkerindex,"账号") == nopetcdkey[i] then
			return 0
		end
	end
	local petname = string.gsub(char.getChar(petindex, "名字"), "*", "")
	local Pet_4V_1 = char.getChar( petindex, "宠物四围" )
	local Pet_HP_1 = other.atoi(other.getString(Pet_4V_1, "|", 1))
	local Pet_Str_1 = other.atoi(other.getString(Pet_4V_1, "|", 2))
	local Pet_Tough_1 = other.atoi(other.getString(Pet_4V_1, "|", 3))
	local Pet_Dex_1 = other.atoi(other.getString(Pet_4V_1, "|", 4))
	local Pet_old_lv = other.atoi(other.getString(Pet_4V_1, "|", 5))
	local Pet_Sum = char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击力") + char.getWorkInt(petindex, "防御力") + char.getWorkInt(petindex, "敏捷力")
	local Pet_Zhu_Buff = char.getChar(petindex,"称号")
	local Pet_Zhu_HP = 0
	local Pet_Zhu_Str = 0
	local Pet_Zhu_Tough = 0
	local Pet_Zhu_Dex = 0
	if Pet_Zhu_Buff ~= "" then
		Pet_Zhu_HP = other.atoi(other.getString(Pet_Zhu_Buff, "|", 1))
		Pet_Zhu_Str = other.atoi(other.getString(Pet_Zhu_Buff, "|", 2))
		Pet_Zhu_Tough = other.atoi(other.getString(Pet_Zhu_Buff, "|", 3))
		Pet_Zhu_Dex = other.atoi(other.getString(Pet_Zhu_Buff, "|", 4))
	end
	local id = char.getInt(petindex,"宠ID")
	token = "select * from `petNameType` where `petid` = "..id.." limit 1"
	local ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		petnum = sasql.num_rows()
		if petnum == 0 then--这里是没有这个类型。提交他
			token = "INSERT INTO `petNameType` ("
								.. "`name` ,"
								.. "`petid`"
								.. ")"
								.. "VALUES ("
								.."'" .. petname
								.. "',"..id
								.. ")"
			sasql.query(token)
		end
	end
	local petsumarray = {0,0,0,0,0,0,0}
	local petuidarray = {"","","","","","",""}
	local petplayername = {"","","","","","",""}
	for i=1,7 do
		token = "select * from `petbilling` where `petId` = " .. id .. " and `type`=" .. i
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			num = sasql.num_rows()
			if num > 0 then
				sasql.fetch_row()
				if i < 4 then
					petsumarray[i] = other.atoi(sasql.data(10)) / 4 + other.atoi(sasql.data(11)) + other.atoi(sasql.data(12)) + other.atoi(sasql.data(13))
				elseif i == 4 then
					petsumarray[i] = other.atoi(sasql.data(10))
				elseif i == 5 then
					petsumarray[i] = other.atoi(sasql.data(11))
				elseif i == 6 then
					petsumarray[i] = other.atoi(sasql.data(12))
				elseif i == 7 then
					petsumarray[i] = other.atoi(sasql.data(13))
				end
				petuidarray[i] = sasql.data(23)
				petplayername[i] = sasql.data(24)
			end
		end
	end
	local updatetype = 0
	local youtype = 0
	local update = 0
	for i=1,7 do
		if char.getChar(petindex, "唯一编号") == petuidarray[i] then
			if char.getChar(talkerindex,"名字") ~= petplayername[i] then
				update = 1
			end
			if i < 4 then
				if Pet_Sum ~= petsumarray[i] then
					update = 1
					updatetype = i
					petsumarray[i] = Pet_Sum
				end
				youtype = 1
			elseif i == 4 then
				if char.getWorkInt(petindex, "最大HP") ~= petsumarray[i] then
					update = 1
					petsumarray[i] = char.getWorkInt(petindex, "最大HP")
				end
			elseif i == 5 then
				if char.getWorkInt(petindex, "攻击力") ~= petsumarray[i] then
					update = 1
					petsumarray[i] = char.getWorkInt(petindex, "攻击力")
				end
			elseif i == 6 then
				if char.getWorkInt(petindex, "防御力") ~= petsumarray[i] then
					update = 1
					petsumarray[i] = char.getWorkInt(petindex, "防御力")
				end
			elseif i == 7 then
				if char.getWorkInt(petindex, "敏捷力") ~= petsumarray[i] then
					update = 1
					petsumarray[i] = char.getWorkInt(petindex, "敏捷力")
				end
			end
		end
	end
	if update > 0 then
		token = "UPDATE `petbilling`"
				.. "SET `name` = '" .. petname
				.. "', `lv` = " .. char.getInt(petindex, "等级")
				.. ", `hp` = " .. char.getWorkInt(petindex, "最大HP")
				.. ", `attack` = " .. char.getWorkInt(petindex, "攻击力")
				.. ", `def` = " .. char.getWorkInt(petindex, "防御力")
				.. ", `quick` = " .. char.getWorkInt(petindex, "敏捷力")
				.. ", `oldlv` = " .. Pet_old_lv
				.. ", `oldhp` = " .. Pet_HP_1
				.. ", `oldattack` = " .. Pet_Str_1
				.. ", `olddef` = " .. Pet_Tough_1
				.. ", `oldquick` = " .. Pet_Dex_1
				.. ", `zhuhp` = " .. Pet_Zhu_HP
				.. ", `zhustr` = " .. Pet_Zhu_Str
				.. ", `zhuvgh` = " .. Pet_Zhu_Tough
				.. ", `zhudex` = " .. Pet_Zhu_Dex
				.. ", `author` = '" .. char.getChar(talkerindex, "名字")
				.. "', `vital` = " .. char.getInt(petindex, "体力")
				.. ", `str` = " .. char.getInt(petindex, "腕力")
				.. ", `tough` = " .. char.getInt(petindex, "耐力")
				.. ", `dex` = " .. char.getInt(petindex, "速度")
				.. " where `unicode` = '" .. char.getChar(petindex, "唯一编号") .. "'"
		sasql.query(token)
	end
	if updatetype > 0 then
		if petsumarray[3] > petsumarray[1] then
			token = "UPDATE `petbilling` set"
					.. " `type`=0"
					.. " where `petId` = " .. id
					.. " and `type` = 3"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=3"
					.. " where `petId` = " .. id
					.. " and `type` = 2"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=2"
					.. " where `petId` = " .. id
					.. " and `type` = 1"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=1"
					.. " where `petId` = " .. id
					.. " and `type` = 0"
			sasql.query(token)
			local petsumtemp = petsumarray[3]
			petsumarray[3] = petsumarray[2]
			petsumarray[2] = petsumarray[1]
			petsumarray[1] = petsumtemp
		elseif petsumarray[3] > petsumarray[2] then
			token = "UPDATE `petbilling` set"
					.. " `type`=0"
					.. " where `petId` = " .. id
					.. " and `type` = 3"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=3"
					.. " where `petId` = " .. id
					.. " and `type` = 2"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=2"
					.. " where `petId` = " .. id
					.. " and `type` = 0"
			sasql.query(token)
			local petsumtemp = petsumarray[3]
			petsumarray[3] = petsumarray[2]
			petsumarray[2] = petsumtemp
		elseif petsumarray[2] > petsumarray[1] then
			token = "UPDATE `petbilling` set"
					.. " `type`=0"
					.. " where `petId` = " .. id
					.. " and `type` = 2"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=2"
					.. " where `petId` = " .. id
					.. " and `type` = 1"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=1"
					.. " where `petId` = " .. id
					.. " and `type` = 0"
			sasql.query(token)
			local petsumtemp = petsumarray[2]
			petsumarray[2] = petsumarray[1]
			petsumarray[1] = petsumtemp
		end
	end
	if youtype == 0 then
		if Pet_Sum > petsumarray[1] then
			token = "delete from `petbilling` where `petId` = " .. id .. " AND `type` = 3"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=3"
					.. " where `petId` = " .. id
					.. " and `type` = 2"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=2"
					.. " where `petId` = " .. id
					.. " and `type` = 1"
			sasql.query(token)
			token = "INSERT INTO `petbilling` ( "
					.. "`petId`, "
					.. "`type`, "
					.. "`name`, "
					.. "`imageId`, "
					.. "`lv`, "
					.. "`di`, "
					.. "`shui`, "
					.. "`huo`, "
					.. "`feng`, "
					.. "`hp`,"
					.. "`attack`, "
					.. "`def`, "
					.. "`quick`, "
					.. "`oldlv`, "
					.. "`oldhp`,"
					.. "`oldattack`, "
					.. "`olddef`, "
					.. "`oldquick`, "
					.. "`zhuhp`, "
					.. "`zhustr`, "
					.. "`zhuvgh`, "
					.. "`zhudex`, "
					.. "`unicode`,"
					.. "`author`,"
					.. "`vital`,"
					.. "`str`,"
					.. "`tough`,"
					.. "`dex`,"
					.. "`cdkey`"
					.. ")"
					.. " VALUES ("
					.. "" .. id
					.. ", " .. 1
					.. ", '" .. petname
					.. "', " .. char.getInt(petindex, "图像号")
					.. ", " .. char.getInt(petindex, "等级")
					.. ", " .. char.getInt(petindex, "地")
					.. ", " .. char.getInt(petindex, "水")
					.. ", " .. char.getInt(petindex, "火")
					.. ", " .. char.getInt(petindex, "风")
					.. ", " .. char.getWorkInt(petindex, "最大HP")
					.. ", " .. char.getWorkInt(petindex, "攻击力")
					.. ", " .. char.getWorkInt(petindex, "防御力")
					.. ", " .. char.getWorkInt(petindex, "敏捷力")
					.. ", " .. Pet_old_lv
					.. ", " .. Pet_HP_1
					.. ", " .. Pet_Str_1
					.. ", " .. Pet_Tough_1
					.. ", " .. Pet_Dex_1
					.. ", " .. Pet_Zhu_HP
					.. ", " .. Pet_Zhu_Str
					.. ", " .. Pet_Zhu_Tough
					.. ", " .. Pet_Zhu_Dex
					.. ", '" .. char.getChar(petindex, "唯一编号")
					.. "', '" .. char.getChar(talkerindex, "名字")
					.. "', " .. char.getInt(petindex, "体力")
					.. ", " .. char.getInt(petindex, "腕力")
					.. ", " .. char.getInt(petindex, "耐力")
					.. ", " .. char.getInt(petindex, "速度")
					.. ", '" .. char.getChar(talkerindex,"账号")
					.. "')"
			sasql.query(token)
		elseif Pet_Sum > petsumarray[2] then
			token = "delete from `petbilling` where `petId` = " .. id .. " AND `type` = 3"
			sasql.query(token)
			token = "UPDATE `petbilling` set"
					.. " `type`=3"
					.. " where `petId` = " .. id
					.. " and `type` = 2"
			sasql.query(token)
			token = "INSERT INTO `petbilling` ( "
					.. "`petId`, "
					.. "`type`, "
					.. "`name`, "
					.. "`imageId`, "
					.. "`lv`, "
					.. "`di`, "
					.. "`shui`, "
					.. "`huo`, "
					.. "`feng`, "
					.. "`hp`,"
					.. "`attack`, "
					.. "`def`, "
					.. "`quick`, "
					.. "`oldlv`, "
					.. "`oldhp`,"
					.. "`oldattack`, "
					.. "`olddef`, "
					.. "`oldquick`, "
					.. "`zhuhp`, "
					.. "`zhustr`, "
					.. "`zhuvgh`, "
					.. "`zhudex`, "
					.. "`unicode`,"
					.. "`author`,"
					.. "`vital`,"
					.. "`str`,"
					.. "`tough`,"
					.. "`dex`,"
					.. "`cdkey`"
					.. ")"
					.. " VALUES ("
					.. "" .. id
					.. ", " .. 2
					.. ", '" .. petname
					.. "', " .. char.getInt(petindex, "图像号")
					.. ", " .. char.getInt(petindex, "等级")
					.. ", " .. char.getInt(petindex, "地")
					.. ", " .. char.getInt(petindex, "水")
					.. ", " .. char.getInt(petindex, "火")
					.. ", " .. char.getInt(petindex, "风")
					.. ", " .. char.getWorkInt(petindex, "最大HP")
					.. ", " .. char.getWorkInt(petindex, "攻击力")
					.. ", " .. char.getWorkInt(petindex, "防御力")
					.. ", " .. char.getWorkInt(petindex, "敏捷力")
					.. ", " .. Pet_old_lv
					.. ", " .. Pet_HP_1
					.. ", " .. Pet_Str_1
					.. ", " .. Pet_Tough_1
					.. ", " .. Pet_Dex_1
					.. ", " .. Pet_Zhu_HP
					.. ", " .. Pet_Zhu_Str
					.. ", " .. Pet_Zhu_Tough
					.. ", " .. Pet_Zhu_Dex
					.. ", '" .. char.getChar(petindex, "唯一编号")
					.. "', '" .. char.getChar(talkerindex, "名字")
					.. "', " .. char.getInt(petindex, "体力")
					.. ", " .. char.getInt(petindex, "腕力")
					.. ", " .. char.getInt(petindex, "耐力")
					.. ", " .. char.getInt(petindex, "速度")
					.. ", '" .. char.getChar(talkerindex, "账号")
					.. "')"
			sasql.query(token)
		elseif Pet_Sum > petsumarray[3] then
			token = "delete from `petbilling` where `petId` = " .. id .. " AND `type` = 3"
			sasql.query(token)
			token = "INSERT INTO `petbilling` ( "
					.. "`petId`, "
					.. "`type`, "
					.. "`name`, "
					.. "`imageId`, "
					.. "`lv`, "
					.. "`di`, "
					.. "`shui`, "
					.. "`huo`, "
					.. "`feng`, "
					.. "`hp`,"
					.. "`attack`, "
					.. "`def`, "
					.. "`quick`, "
					.. "`oldlv`, "
					.. "`oldhp`,"
					.. "`oldattack`, "
					.. "`olddef`, "
					.. "`oldquick`, "
					.. "`zhuhp`, "
					.. "`zhustr`, "
					.. "`zhuvgh`, "
					.. "`zhudex`, "
					.. "`unicode`,"
					.. "`author`,"
					.. "`vital`,"
					.. "`str`,"
					.. "`tough`,"
					.. "`dex`,"
					.. "`cdkey`"
					.. ")"
					.. " VALUES ("
					.. "" .. id
					.. ", " .. 3
					.. ", '" .. petname
					.. "', " .. char.getInt(petindex, "图像号")
					.. ", " .. char.getInt(petindex, "等级")
					.. ", " .. char.getInt(petindex, "地")
					.. ", " .. char.getInt(petindex, "水")
					.. ", " .. char.getInt(petindex, "火")
					.. ", " .. char.getInt(petindex, "风")
					.. ", " .. char.getWorkInt(petindex, "最大HP")
					.. ", " .. char.getWorkInt(petindex, "攻击力")
					.. ", " .. char.getWorkInt(petindex, "防御力")
					.. ", " .. char.getWorkInt(petindex, "敏捷力")
					.. ", " .. Pet_old_lv
					.. ", " .. Pet_HP_1
					.. ", " .. Pet_Str_1
					.. ", " .. Pet_Tough_1
					.. ", " .. Pet_Dex_1
					.. ", " .. Pet_Zhu_HP
					.. ", " .. Pet_Zhu_Str
					.. ", " .. Pet_Zhu_Tough
					.. ", " .. Pet_Zhu_Dex
					.. ", '" .. char.getChar(petindex, "唯一编号")
					.. "', '" .. char.getChar(talkerindex, "名字")
					.. "', " .. char.getInt(petindex, "体力")
					.. ", " .. char.getInt(petindex, "腕力")
					.. ", " .. char.getInt(petindex, "耐力")
					.. ", " .. char.getInt(petindex, "速度")
					.. ", '" .. char.getChar(talkerindex, "账号")
					.. "')"
			sasql.query(token)
		end
	end
	
	if char.getWorkInt(petindex, "最大HP") > petsumarray[4] then
		token = "delete from `petbilling` where `petId` = " .. id .. " AND `type` = 4"
		sasql.query(token)
		token = "INSERT INTO `petbilling` ( "
				.. "`petId`, "
				.. "`type`, "
				.. "`name`, "
				.. "`imageId`, "
				.. "`lv`, "
				.. "`di`, "
				.. "`shui`, "
				.. "`huo`, "
				.. "`feng`, "
				.. "`hp`,"
				.. "`attack`, "
				.. "`def`, "
				.. "`quick`, "
				.. "`oldlv`, "
				.. "`oldhp`,"
				.. "`oldattack`, "
				.. "`olddef`, "
				.. "`oldquick`, "
				.. "`zhuhp`, "
				.. "`zhustr`, "
				.. "`zhuvgh`, "
				.. "`zhudex`, "
				.. "`unicode`,"
				.. "`author`,"
				.. "`vital`,"
				.. "`str`,"
				.. "`tough`,"
				.. "`dex`,"
				.. "`cdkey`"
				.. ")"
				.. " VALUES ("
				.. "" .. id
				.. ", " .. 4
				.. ", '" .. petname
				.. "', " .. char.getInt(petindex, "图像号")
				.. ", " .. char.getInt(petindex, "等级")
				.. ", " .. char.getInt(petindex, "地")
				.. ", " .. char.getInt(petindex, "水")
				.. ", " .. char.getInt(petindex, "火")
				.. ", " .. char.getInt(petindex, "风")
				.. ", " .. char.getWorkInt(petindex, "最大HP")
				.. ", " .. char.getWorkInt(petindex, "攻击力")
				.. ", " .. char.getWorkInt(petindex, "防御力")
				.. ", " .. char.getWorkInt(petindex, "敏捷力")
				.. ", " .. Pet_old_lv
				.. ", " .. Pet_HP_1
				.. ", " .. Pet_Str_1
				.. ", " .. Pet_Tough_1
				.. ", " .. Pet_Dex_1
				.. ", " .. Pet_Zhu_HP
				.. ", " .. Pet_Zhu_Str
				.. ", " .. Pet_Zhu_Tough
				.. ", " .. Pet_Zhu_Dex
				.. ", '" .. char.getChar(petindex, "唯一编号")
				.. "', '" .. char.getChar(talkerindex, "名字")
				.. "', " .. char.getInt(petindex, "体力")
				.. ", " .. char.getInt(petindex, "腕力")
				.. ", " .. char.getInt(petindex, "耐力")
				.. ", " .. char.getInt(petindex, "速度")
				.. ", '" .. char.getChar(talkerindex, "账号")
				.. "')"
		sasql.query(token)
	end
	if char.getWorkInt(petindex, "攻击力") > petsumarray[5] then
		token = "delete from `petbilling` where `petId` = " .. id .. " AND `type` = 5"
		sasql.query(token)
		token = "INSERT INTO `petbilling` ( "
				.. "`petId`, "
				.. "`type`, "
				.. "`name`, "
				.. "`imageId`, "
				.. "`lv`, "
				.. "`di`, "
				.. "`shui`, "
				.. "`huo`, "
				.. "`feng`, "
				.. "`hp`,"
				.. "`attack`, "
				.. "`def`, "
				.. "`quick`, "
				.. "`oldlv`, "
				.. "`oldhp`,"
				.. "`oldattack`, "
				.. "`olddef`, "
				.. "`oldquick`, "
				.. "`zhuhp`, "
				.. "`zhustr`, "
				.. "`zhuvgh`, "
				.. "`zhudex`, "
				.. "`unicode`,"
				.. "`author`,"
				.. "`vital`,"
				.. "`str`,"
				.. "`tough`,"
				.. "`dex`,"
				.. "`cdkey`"
				.. ")"
				.. " VALUES ("
				.. "" .. id
				.. ", " .. 5
				.. ", '" .. petname
				.. "', " .. char.getInt(petindex, "图像号")
				.. ", " .. char.getInt(petindex, "等级")
				.. ", " .. char.getInt(petindex, "地")
				.. ", " .. char.getInt(petindex, "水")
				.. ", " .. char.getInt(petindex, "火")
				.. ", " .. char.getInt(petindex, "风")
				.. ", " .. char.getWorkInt(petindex, "最大HP")
				.. ", " .. char.getWorkInt(petindex, "攻击力")
				.. ", " .. char.getWorkInt(petindex, "防御力")
				.. ", " .. char.getWorkInt(petindex, "敏捷力")
				.. ", " .. Pet_old_lv
				.. ", " .. Pet_HP_1
				.. ", " .. Pet_Str_1
				.. ", " .. Pet_Tough_1
				.. ", " .. Pet_Dex_1
				.. ", " .. Pet_Zhu_HP
				.. ", " .. Pet_Zhu_Str
				.. ", " .. Pet_Zhu_Tough
				.. ", " .. Pet_Zhu_Dex
				.. ", '" .. char.getChar(petindex, "唯一编号")
				.. "', '" .. char.getChar(talkerindex, "名字")
				.. "', " .. char.getInt(petindex, "体力")
				.. ", " .. char.getInt(petindex, "腕力")
				.. ", " .. char.getInt(petindex, "耐力")
				.. ", " .. char.getInt(petindex, "速度")
				.. ", '" .. char.getChar(talkerindex, "账号")
				.. "')"
		sasql.query(token)
	end
	if char.getWorkInt(petindex, "防御力") > petsumarray[6] then
		token = "delete from `petbilling` where `petId` = " .. id .. " AND `type` = 6"
		sasql.query(token)
		token = "INSERT INTO `petbilling` ( "
				.. "`petId`, "
				.. "`type`, "
				.. "`name`, "
				.. "`imageId`, "
				.. "`lv`, "
				.. "`di`, "
				.. "`shui`, "
				.. "`huo`, "
				.. "`feng`, "
				.. "`hp`,"
				.. "`attack`, "
				.. "`def`, "
				.. "`quick`, "
				.. "`oldlv`, "
				.. "`oldhp`,"
				.. "`oldattack`, "
				.. "`olddef`, "
				.. "`oldquick`, "
				.. "`zhuhp`, "
				.. "`zhustr`, "
				.. "`zhuvgh`, "
				.. "`zhudex`, "
				.. "`unicode`,"
				.. "`author`,"
				.. "`vital`,"
				.. "`str`,"
				.. "`tough`,"
				.. "`dex`,"
				.. "`cdkey`"
				.. ")"
				.. " VALUES ("
				.. "" .. id
				.. ", " .. 6
				.. ", '" .. petname
				.. "', " .. char.getInt(petindex, "图像号")
				.. ", " .. char.getInt(petindex, "等级")
				.. ", " .. char.getInt(petindex, "地")
				.. ", " .. char.getInt(petindex, "水")
				.. ", " .. char.getInt(petindex, "火")
				.. ", " .. char.getInt(petindex, "风")
				.. ", " .. char.getWorkInt(petindex, "最大HP")
				.. ", " .. char.getWorkInt(petindex, "攻击力")
				.. ", " .. char.getWorkInt(petindex, "防御力")
				.. ", " .. char.getWorkInt(petindex, "敏捷力")
				.. ", " .. Pet_old_lv
				.. ", " .. Pet_HP_1
				.. ", " .. Pet_Str_1
				.. ", " .. Pet_Tough_1
				.. ", " .. Pet_Dex_1
				.. ", " .. Pet_Zhu_HP
				.. ", " .. Pet_Zhu_Str
				.. ", " .. Pet_Zhu_Tough
				.. ", " .. Pet_Zhu_Dex
				.. ", '" .. char.getChar(petindex, "唯一编号")
				.. "', '" .. char.getChar(talkerindex, "名字")
				.. "', " .. char.getInt(petindex, "体力")
				.. ", " .. char.getInt(petindex, "腕力")
				.. ", " .. char.getInt(petindex, "耐力")
				.. ", " .. char.getInt(petindex, "速度")
				.. ", '" .. char.getChar(talkerindex, "账号")
				.. "')"
		sasql.query(token)
	end
	if char.getWorkInt(petindex, "敏捷力") > petsumarray[7] then
		token = "delete from `petbilling` where `petId` = " .. id .. " AND `type` = 7"
		sasql.query(token)
		token = "INSERT INTO `petbilling` ( "
				.. "`petId`, "
				.. "`type`, "
				.. "`name`, "
				.. "`imageId`, "
				.. "`lv`, "
				.. "`di`, "
				.. "`shui`, "
				.. "`huo`, "
				.. "`feng`, "
				.. "`hp`,"
				.. "`attack`, "
				.. "`def`, "
				.. "`quick`, "
				.. "`oldlv`, "
				.. "`oldhp`,"
				.. "`oldattack`, "
				.. "`olddef`, "
				.. "`oldquick`, "
				.. "`zhuhp`, "
				.. "`zhustr`, "
				.. "`zhuvgh`, "
				.. "`zhudex`, "
				.. "`unicode`,"
				.. "`author`,"
				.. "`vital`,"
				.. "`str`,"
				.. "`tough`,"
				.. "`dex`,"
				.. "`cdkey`"
				.. ")"
				.. " VALUES ("
				.. "" .. id
				.. ", " .. 7
				.. ", '" .. petname
				.. "', " .. char.getInt(petindex, "图像号")
				.. ", " .. char.getInt(petindex, "等级")
				.. ", " .. char.getInt(petindex, "地")
				.. ", " .. char.getInt(petindex, "水")
				.. ", " .. char.getInt(petindex, "火")
				.. ", " .. char.getInt(petindex, "风")
				.. ", " .. char.getWorkInt(petindex, "最大HP")
				.. ", " .. char.getWorkInt(petindex, "攻击力")
				.. ", " .. char.getWorkInt(petindex, "防御力")
				.. ", " .. char.getWorkInt(petindex, "敏捷力")
				.. ", " .. Pet_old_lv
				.. ", " .. Pet_HP_1
				.. ", " .. Pet_Str_1
				.. ", " .. Pet_Tough_1
				.. ", " .. Pet_Dex_1
				.. ", " .. Pet_Zhu_HP
				.. ", " .. Pet_Zhu_Str
				.. ", " .. Pet_Zhu_Tough
				.. ", " .. Pet_Zhu_Dex
				.. ", '" .. char.getChar(petindex, "唯一编号")
				.. "', '" .. char.getChar(talkerindex, "名字")
				.. "', " .. char.getInt(petindex, "体力")
				.. ", " .. char.getInt(petindex, "腕力")
				.. ", " .. char.getInt(petindex, "耐力")
				.. ", " .. char.getInt(petindex, "速度")
				.. ", '" .. char.getChar(talkerindex, "账号")
				.. "')"
		sasql.query(token)
	end
	return 0
end

function ComPetData(vital,str,tgh,dex)
	local newvital,newstr,newtgh,newdex;
	newdex = dex * 0.01
	newstr = str * 0.01 + tgh*0.001 + vital*0.001 + dex*0.01*0.05;
	newtgh = tgh * 0.01 + str*0.001 + vital*0.001 + dex*0.01*0.05;
	newvital = (vital*4 +str+tgh+dex)*0.01;
	return newvital,newstr,newtgh,newdex;
end

function ComPet140(Ability,rank,index,vital,str,tgh,dex)
	local RankRandTbl = {
											{450,470,490,510,530,550},
											{500,520,540,560,580,600}
											};
	local Param = {0.0,0.0,0.0,0.0};
	
	local i=1;
	for i=1,10 do 
		local index1=other.Random(1,4);
		Param[index1]=Param[index1] + 1.0;
	end
	local fRand;
	if index == 0 then
		fRand = RankRandTbl[1][rank] * 0.01;
	elseif index == 1 then
		fRand = RankRandTbl[2][rank] * 0.01;
	elseif index == 2 then
		fRand = (RankRandTbl[1][rank] + (RankRandTbl[2][rank] - RankRandTbl[1][rank])/2) * 0.01;
	end
	local str1,vital1,dex1,tgh1;
	
	vital1 = other.NumRightToNum(Ability,24);
	str1 = other.NumRightToNum(Ability,16);
	tgh1 = other.NumRightToNum(Ability,8);
	dex1 = other.NumRightToNum(Ability,0);

	vital1 =vital1 * fRand + Param[1] * fRand;
	str1 = str1   * fRand + Param[2] * fRand;
	tgh1 = tgh1   * fRand + Param[3] * fRand;
	dex1 = dex1   * fRand + Param[4] * fRand;
	
	vital = vital + math.max(0,vital1);
	str = str + math.max(0,str1);
	tgh = tgh + math.max(0,tgh1);
	dex = dex + math.max(0,dex1);
	return vital,str,tgh,dex;
	
end

--NPC对话事件(NPC索引)
function ShowTalked(talkerindex)
	--token = char.getChar(npcindex,"名字") .. "||2|查看宠物排行|查看宠物成长"
	--lssproto.windows(talkerindex, "新选择框", 0, 0, char.getWorkInt( npcindex, "对象"), token)
	if petTypeStr == "" then
		char.newMessageToCli(talkerindex, -1, "目前没有排行榜数据", "白色")
		return 0
	end
	token = "L|" .. petTypeStr
	lssproto.windows(talkerindex, 1000, 0, 1, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)

	if seqno == 0 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num == 1 then
			token = "L|" .. petTypeStr
			lssproto.windows(talkerindex, 1000, 0, 1, char.getWorkInt( meindex, "对象"), token)
		elseif num == 2 then
			lssproto.windows(talkerindex, "宠物框", 0, 2, char.getWorkInt( meindex, "对象"), "")
		end
	elseif seqno == 1 then
		if data == "" then
			return
		end
		local type = other.getString(data,"|",1)
		if type == "G" then
			local petid = other.getString(data,"|",2)
			local petbiliType = other.getString(data,"|",3)
			if petid == "" then
				return
			end
			local petplayerchar = ""
			for i=1,7 do
				token = "SELECT author,unicode FROM `petbilling` WHERE `petId`=" .. petid .. " and `type`=" .. i
				local ret = sasql.query(token)
				if ret == 1 then
					sasql.free_result()
					sasql.store_result()
					num = sasql.num_rows()
					if num > 0 then
						sasql.fetch_row();
						petplayerchar = petplayerchar .. sasql.data(1) .. "|" .. sasql.data(2) .. "|"
					else
						if i == 1 then
							petplayerchar = "||"
						else
							petplayerchar = petplayerchar .."||"
						end
					end
				end
			end
			token = "P|"..petbiliType.."|" .. petplayerchar
			lssproto.windowsupdate(talkerindex, 1000, 0, 1, char.getWorkInt( meindex, "对象"), token)
		elseif type == "P" then
			local petuid = other.getString(data,"|",2)
			if petuid == "" then
				return
			end
			token = "SELECT * FROM `petbilling` WHERE `unicode`='" .. petuid .. "'"
			print("[petbilling:WindowTalked]",token)
			local ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				num = sasql.num_rows()
				if num > 0 then
					sasql.fetch_row()
					token = "S|1|" .. sasql.data(4) .. "|" .. sasql.data(6) .. "|" .. sasql.data(7) .. "|" .. sasql.data(8) .. "|" .. sasql.data(9) .. "|" .. sasql.data(21)
							 .. "|" .. sasql.data(19) .. "|" .. sasql.data(20) .. "|" .. sasql.data(22) .. "|" .. sasql.data(5) .. "|" .. sasql.data(10) .. "|" .. sasql.data(11)
							 .. "|" .. sasql.data(12) .. "|" .. sasql.data(13) .. "|" .. sasql.data(14) .. "|" .. sasql.data(15) .. "|" .. sasql.data(16) .. "|" .. sasql.data(17)
							 .. "|" .. sasql.data(18) .. "|" .. char.getPet4v(other.atoi(sasql.data(25)),other.atoi(sasql.data(26)),other.atoi(sasql.data(27)),other.atoi(sasql.data(28)),other.atoi(sasql.data(19)),other.atoi(sasql.data(20)),other.atoi(sasql.data(21)),other.atoi(sasql.data(22)))
					lssproto.windowsupdate(talkerindex, 1000, 0, 1, char.getWorkInt( meindex, "对象"), token)
				else
					token = "S|0|"
					lssproto.windowsupdate(talkerindex, 1000, 0, 1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		elseif type == "O" then
			local petid = other.getString(data,"|",2)
			if petid == "" then
				return
			end
			token = "select * from `PetData` where `petno`=" .. petid
			local ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				num = sasql.num_rows()
				if num > 0 then
					sasql.fetch_row()
					local oldminhp = other.atoi(sasql.data(3))
					local oldminstr = other.atoi(sasql.data(4))
					local oldmintgh = other.atoi(sasql.data(5))
					local oldmindex = other.atoi(sasql.data(6))
					local oldmaxhp = other.atoi(sasql.data(7))
					local oldmaxstr = other.atoi(sasql.data(8))
					local oldmaxtgh = other.atoi(sasql.data(9))
					local oldmaxdex = other.atoi(sasql.data(10))
					local petminhp = other.atoi(sasql.data(12))
					local petminstr = other.atoi(sasql.data(13))
					local petmintgh = other.atoi(sasql.data(14))
					local petmindex = other.atoi(sasql.data(15))
					local petmaxhp = other.atoi(sasql.data(16))
					local petmaxstr = other.atoi(sasql.data(17))
					local petmaxtgh = other.atoi(sasql.data(18))
					local petmaxdex = other.atoi(sasql.data(19))
					token = "O|" .. oldminhp .. "|" .. oldmaxhp .. "|" .. oldminstr .. "|" .. oldmaxstr .. "|" .. oldmintgh .. "|" .. oldmaxtgh .. "|" .. oldmindex .. "|" .. oldmaxdex .. "|" .. petminhp .. "|" .. petmaxhp .. "|" .. petminstr .. "|" .. petmaxstr .. "|" .. petmintgh .. "|" .. petmaxtgh .. "|" .. petmindex .. "|" .. petmaxdex
					lssproto.windowsupdate(talkerindex, 1000, 0, 1, char.getWorkInt( meindex, "对象"), token)
				end
			end
		end
	elseif seqno == 2 then
		if data == "" then
			return
		end
		num = other.atoi(data)
		if num < 1 or num > 5 then
			return
		end
		local petindex = char.getCharPet(talkerindex,num - 1)
		if char.check(petindex) == 1 then
			local petno = char.getInt(petindex, "宠ID")
			token = "select * from `PetData` where `petno`=" .. petno
			local ret = sasql.query(token)
			if ret == 1 then
				sasql.free_result()
				sasql.store_result()
				num = sasql.num_rows()
				if num > 0 then
					sasql.fetch_row()
					local oldminhp = other.atoi(sasql.data(3))
					local oldminstr = other.atoi(sasql.data(4))
					local oldmintgh = other.atoi(sasql.data(5))
					local oldmindex = other.atoi(sasql.data(6))
					local oldmaxhp = other.atoi(sasql.data(7))
					local oldmaxstr = other.atoi(sasql.data(8))
					local oldmaxtgh = other.atoi(sasql.data(9))
					local oldmaxdex = other.atoi(sasql.data(10))
					local petminhp = other.atoi(sasql.data(12))
					local petminstr = other.atoi(sasql.data(13))
					local petmintgh = other.atoi(sasql.data(14))
					local petmindex = other.atoi(sasql.data(15))
					local petmaxhp = other.atoi(sasql.data(16))
					local petmaxstr = other.atoi(sasql.data(17))
					local petmaxtgh = other.atoi(sasql.data(18))
					local petmaxdex = other.atoi(sasql.data(19))
					token = char.getChar(petindex,"名字") .. "的成长范围如下："
						 .. "\n1级血范围：" .. oldminhp .. "-" .. oldmaxhp
						 .. "\n1级攻范围：" .. oldminstr .. "-" .. oldmaxstr
						 .. "\n1级防范围：" .. oldmintgh .. "-" .. oldmaxtgh
						 .. "\n1级敏范围：" .. oldmindex .. "-" .. oldmaxdex
						 .. "\n140级血范围：" .. petminhp .. "-" .. petmaxhp
						 .. "\n140级攻范围：" .. petminstr .. "-" .. petmaxstr
						 .. "\n140级防范围：" .. petmintgh .. "-" .. petmaxtgh
						 .. "\n140级敏范围：" .. petmindex .. "-" .. petmaxdex
						 .. "\nPS：该数据为1W次练宠数据范围，仅供参考"
					lssproto.windows(talkerindex, "宽对话框", "取消", 0, -1, token)
				end
			end
		end
	end
end

function updatePetBill(charaindex, data1)
	updatePet();
	char.TalkToCli(charaindex, -1, "手动更新数据成功！", "黄色")
end

function updatePet()
	--先获取宠物类型
	local flg = false;
	local token = "SELECT * FROM petNameType"
	local ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		petTotalNum = num
		if num > 0 then
			petTypeData = nil;
			petTypeData = {};
			petTypeStr=num.."|";--宠物类型
			flg = true;
			for i=1,num do 
				sasql.fetch_row();
				petTypeData[i] = {sasql.data(1),other.atoi(sasql.data(2))};
				petTypeStr = petTypeStr .. petTypeData[i][1].."|" .. petTypeData[i][2] .. "|"
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function NetLoopFunction()
	local minute = tonumber(os.date("%M",os.time()))
	local bj = config.getServernumber() % 10
	
	if minute == bj then
		updatePet()
		--更新数据
	end
end

function setPetTotalData(talkerindex,petindex)
	local battleno = {125002,125001,125000}
	if char.check(petindex) ~= 1 then
		return 0
	end
	local mypetid = char.getInt(petindex,"宠ID")
	token = "select `type`,`vital`,`str`,`tough`,`dex` from `petbilling` where `unicode` = '" .. char.getChar(petindex,"唯一编号") .. "' ORDER BY `type` ASC"
	local ret = sasql.query(token)
	if ret == 1 then
		sasql.free_result()
		sasql.store_result()
		num = sasql.num_rows()
		if num > 0 then
			sasql.fetch_row()
			if other.atoi(sasql.data(1)) < 4 then
				local ridepetno = char.getInt(talkerindex,"骑宠")
				if ridepetno > -1 then
					local ridepetindex = char.getCharPet(talkerindex,ridepetno)
					if ridepetindex == petindex then
						char.setWorkInt(talkerindex,"战斗特效",battleno[other.atoi(sasql.data(1))])
					end
				end
				char.setWorkInt(petindex,"战斗特效",battleno[other.atoi(sasql.data(1))])
			end
			if other.atoi(sasql.data(2)) == 0 then
				token = "UPDATE `petbilling`"
				.. "SET `vital` = " .. char.getInt(petindex, "体力")
				.. ", `str` = " .. char.getInt(petindex, "腕力")
				.. ", `tough` = " .. char.getInt(petindex, "耐力")
				.. ", `dex` = " .. char.getInt(petindex, "速度")
				.. " where `unicode` = '" .. char.getChar(petindex, "唯一编号") .. "'"
				sasql.query(token)
			end
		end
	end
	return 0
end

function data()
	nopetcdkey = {"yiqishiqib"}
end

function main()
	petTypeData = {};
	petTypeStr = "";
	petData = {};
	petCharStr = {};
	petTotalNum = 0
	Create("宠物排行榜", 26785, 777, 18, 23, 6)
	data()
	magic.addLUAListFunction("updatePetBill", "updatePetBill", "", 3, " ")
	updatePet()
end
