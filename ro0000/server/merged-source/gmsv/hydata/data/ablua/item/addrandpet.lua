function checkEmptPetNum(charaindex)
	EmptyPetNum = -1
	for i = 0, 4 do
		local petindex = char.getCharPet(charaindex, i)
		if char.check(petindex) ~= 1 then
			return i
		end
	end
	return EmptyPetNum
end

function ITEM_ADDRANDLOCKPET(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local pethaveid = checkEmptPetNum(charaindex)
	if pethaveid < 0 then
		char.newMessageToCli(charaindex, -1, "您宠物栏空位不足", "白色")
		return
	end
	local petid = {}
	local i = 1
	while other.getString(data,"|",i) ~= "" do
		petid[i] = other.atoi(other.getString(data,"|",i))
		i = i + 1
	end
	if #petid > 0 then
		local rnd = other.Random(1,#petid)
		local petindex = char.AddPet(charaindex,petid[rnd],1)
		if char.check(petindex) == 1 then
			if string.sub(char.getChar(petindex,"名字"),1,1) ~= "*" then
				char.setChar(petindex,"名字","*" .. char.getChar(petindex,"名字"))
				char.sendStatusString(charaindex,"K" .. pethaveid)
			end
			char.newMessageToCli(charaindex, -1, "获得" .. char.getChar(petindex,"名字"), "白色")
			char.DelItem(charaindex, haveitemindex)
		end
	end
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_ADDRANDLOCKPET", "ITEM_ADDRANDLOCKPET", "")
end
