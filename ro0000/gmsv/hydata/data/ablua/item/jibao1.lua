function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end


function GiveJIBAOT(itemindex, charaindex, toindex, haveitemindex)
	if checkEmptPetNum(charaindex) == 0 then
		char.TalkToCli(charaindex, -1, "[温馨提示]很抱歉，您的身上宠物已满！", "随机色")
		return
	end
		
	char.DelItem(charaindex, haveitemindex)

	local PetIndex = char.AddPet(charaindex,1381,1)
	char.setInt(PetIndex,"宠技位",7)
	char.setPetSkill(PetIndex,0,52)
	char.setPetSkill(PetIndex,1,41)
	local rnd = math.random(1,100)
	if rnd > 33 and rnd < 67 then
		char.setPetSkill(PetIndex,2,41)
	end
	rnd = math.random(1,100)
	if rnd > 33 and rnd < 67 then
		char.setPetSkill(PetIndex,3,41)
	end
	rnd = math.random(1,100)
	if rnd > 33 and rnd < 67 then
		char.setPetSkill(PetIndex,4,41)
	end
	rnd = math.random(1,100)
	if rnd > 33 and rnd < 67 then
		char.setPetSkill(PetIndex,5,41)
	end
	rnd = math.random(1,100)
	if rnd > 33 and rnd < 67 then
		char.setPetSkill(PetIndex,6,41)
	end
	char.setInt(PetIndex,"可变AI",10000)
	char.complianceParameter(PetIndex)
	char.TalkToCli(charaindex, -1, "[温馨提示]得到一只随机T机暴。", "随机色")
	for i = 0, 4 do
		local pindex = char.getCharPet( charaindex, i)
		if char.check(pindex) == 1 then
			if pindex == PetIndex then
				char.sendStatusString(charaindex, "K" .. i)
				char.sendStatusString(charaindex, "W" .. i)
			end
		end
	end
	
end


function main()
	item.addLUAListFunction( "ITEM_JIBAOT", "GiveJIBAOT", "")
end
