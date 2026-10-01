function FreeShowPlayerPet(charaindex,toindex)
	if config.getGameservername() == "族战线" then
		return
	end
	if char.getFlg(toindex,"查看宠物") > 0 then
		char.newMessageToCli(charaindex,-1,"对方不允许查看宠物","白色")
		return
	end
	petnum = 0
	battlepet = 0
	ridepet = 0
	petindexdata = {}
	for i=0,4 do
		petindex = char.getCharPet(toindex,i)
		if char.check(petindex) == 1 then
			petindexdata[#petindexdata + 1] = i
			if char.getInt(toindex,"战宠") == i then
				battlepet = #petindexdata
			end
			if char.getInt(toindex,"骑宠") == i then
				ridepet = #petindexdata
			end
		end
	end
	token = char.getChar(toindex,"名字") .. "|" .. #petindexdata .. "|" .. battlepet .. "|" .. ridepet
	if #petindexdata > 0 then
		for i=1,#petindexdata do
			petindex = char.getCharPet(toindex,petindexdata[i])
			upbuff = char.getChar(petindex,"称号")
			zf_vital = 0
			zf_str = 0
			zf_tgh = 0
			zf_dex = 0
			if upbuff ~= "" then
				zf_vital = other.atoi(other.getString(upbuff, "|", 1))
				zf_str = other.atoi(other.getString(upbuff, "|", 2))
				zf_tgh = other.atoi(other.getString(upbuff, "|", 3))
				zf_dex = other.atoi(other.getString(upbuff, "|", 4))
			end
			old_hp = other.atoi(other.getString(char.getChar(petindex,"宠物四围"), "|", 1))
			old_str = other.atoi(other.getString(char.getChar(petindex,"宠物四围"), "|", 2))
			old_tgh = other.atoi(other.getString(char.getChar(petindex,"宠物四围"), "|", 3))
			old_dex = other.atoi(other.getString(char.getChar(petindex,"宠物四围"), "|", 4))
			old_lv = other.atoi(other.getString(char.getChar(petindex,"宠物四围"), "|", 5))
			tm_vital = char.getInt(petindex,"体力") - zf_vital * 100
			tm_str = char.getInt(petindex,"腕力") - zf_str * 100
			tm_tgh = char.getInt(petindex,"耐力") - zf_tgh * 100
			tm_dex = char.getInt(petindex,"速度") - zf_dex * 100
			nozf_hp = math.floor(tm_vital * 4 * 0.01 + tm_str * 0.01 + tm_tgh * 0.01 + tm_dex * 0.01)
			nozf_str = math.floor(tm_vital * 0.1 * 0.01 + tm_str * 0.01 + tm_tgh * 0.1 * 0.01 + tm_dex * 0.05 * 0.01)
			nozf_tgh = math.floor(tm_vital * 0.1 * 0.01 + tm_str * 0.1 * 0.01 + tm_tgh * 0.01 + tm_dex * 0.05 * 0.01)
			nozf_dex = math.floor(tm_dex * 0.01)
			token = token .. "|" .. char.getChar(petindex,"名字") .. "|" .. char.getInt(petindex,"图像号") .. "|" .. char.getInt(petindex,"等级") .. "|" .. char.getWorkInt(petindex,"最大HP") .. "|" .. char.getWorkInt(petindex,"攻击") .. "|" .. char.getWorkInt(petindex,"防御") .. "|" .. char.getWorkInt(petindex,"敏捷") .. "|" .. char.getWorkInt(petindex,"忠诚") .. "|" .. char.getInt(petindex,"地") .. "|" .. char.getInt(petindex,"水") .. "|" .. char.getInt(petindex,"火") .. "|" .. char.getInt(petindex,"风") .. "|" .. old_lv .. "|" .. old_hp .. "|" .. old_str .. "|" .. old_tgh .. "|" .. old_dex .. "|" .. nozf_hp .. "|" .. nozf_str .. "|" .. nozf_tgh .. "|" .. nozf_dex .. "|" .. zf_vital .. "|" .. zf_str .. "|" .. zf_tgh .. "|" .. zf_dex .. "|" .. char.getInt(petindex,"经验") .. "|" .. char.getLevelExp(petindex,char.getInt(petindex,"等级") + 1) .. "|" .. char.getInt(petindex,"宠技位")
			for j=0,char.getInt(petindex,"宠技位") - 1 do
				petskillid = char.getPetSkill(petindex,j)
				petskillindex = petskill.getPetskillArray(petskillid)
				if petskill.check(petskillindex) == 1 then
					token = token .. "|" .. petskill.getChar(petskillindex,"名称")
				else
					token = token .. "|"
				end
			end
		end
		
	end
	lssproto.windows(charaindex, 1008, "取消", 0, -1, token)
end

function data()
	noshowmap = {1042,2032,3032,4032}
end

function main()
	data()
end
