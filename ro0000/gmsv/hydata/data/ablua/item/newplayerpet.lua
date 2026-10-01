function NetPlayerPet( charindex, petid )
	local petindex = char.AddPet(charindex, petid, 1)
	if char.check(petindex) == 1 then
		char.setChar( petindex, "主人账号", char.getChar( charindex, "账号"))
		char.setChar( petindex, "主人名字", char.getChar( charindex, "名字"))
		char.setChar(petindex, "名字", "*新手" .. char.getChar(petindex, "名字"))
		
		for i = 0, 4 do
			if petindex == char.getCharPet(charindex, i) then
				char.complianceParameter(petindex)
	
				char.setInt(petindex, "HP", char.getWorkInt(petindex, "最大HP"))
				char.sendStatusString(charindex, "K" .. i)
				break
			end
		end
		char.TalkToCli(charindex, -1, "获得" .. char.getChar(petindex, "名字") , "随机色")
	end
end


function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end


function newplayerpet(itemindex, charaindex, toindex, haveitemindex)
	local pettype = other.atoi(item.getChar(itemindex, "字段"))
	
	if checkEmptPetNum(charaindex) < 1 then
		char.TalkToCli(charaindex, -1, "请把身上预留1个宠物栏空位！", "随机色")
		return
	end
	

	newplayer2d = false
	for i = 0, 4 do
		petindex = char.getCharPet(charaindex, i)
		if char.check(petindex) == 1 then
			if char.getInt(petindex, "宠ID") == 1344 or char.getInt(petindex, "宠ID") == 1345 or char.getInt(petindex, "宠ID") == 1346 or char.getInt(petindex, "宠ID") == 1347 or char.getInt(petindex, "宠ID") == newpetlst[pettype] then
				newplayer2d = true
			end
		end
	end
	for i = 0, 14 do
		petindex = char.getCharPoolPet(charaindex, i)
		if char.check(petindex) == 1 then
			if char.getInt(petindex, "宠ID") == 1344 or char.getInt(petindex, "宠ID") == 1345 or char.getInt(petindex, "宠ID") == 1346 or char.getInt(petindex, "宠ID") == 1347 or char.getInt(petindex, "宠ID") == newpetlst[pettype] then
				newplayer2d = true
			end
		end
	end
	if newplayer2d == true then
		char.TalkToCli(charaindex, -1, "您已经有相关的宠物，无法再进行补领", "随机色")
		return
	end
	char.DelItem(charaindex, haveitemindex)
	NetPlayerPet(charaindex, pettype)
end

function data()
	newpetlst = {2, 112, 102, 34}
end


function main()
	data()
	item.addLUAListFunction( "ITEM_NEWPLAYERPET", "newplayerpet", "")
end
