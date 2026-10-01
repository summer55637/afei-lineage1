function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 0, 4 do
		if char.check(char.getCharPet(charaindex, i)) == 0 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end

function GiveMM(itemindex, charaindex, toindex, haveitemindex)
	local MAXVARIABLEAI = 100*100
	local MINVARIABLEAI = -100*100
	local LevelUpPoint = 0
	local iWork = 0
	if checkEmptPetNum(charaindex) == 0 then
		char.TalkToCli(charaindex, -1, "很抱歉，您的身上宠物已满！", "随机色")
		return
	end
		
	char.DelItem(charaindex, haveitemindex)

	local MMIndex = char.AddPet(charaindex,1479,1)

	while(char.getInt(MMIndex, "等级")<79) do
		LevelUpPoint = other.NumLeftToNum(50,24) + other.NumLeftToNum(50,16) + other.NumLeftToNum(50,8) + other.NumLeftToNum(50,0)
		char.setInt(MMIndex, "能力值", LevelUpPoint)
		char.PetLevelUp(MMIndex)
		iWork = char.getInt(MMIndex,"可变AI") + 500
		iWork = math.min(MAXVARIABLEAI,iWork)
		iWork = math.max(MINVARIABLEAI,iWork)
		char.setInt(MMIndex,"可变AI",iWork)
		char.setInt(MMIndex, "等级", char.getInt(MMIndex, "等级") + 1)
	end
	char.setInt(MMIndex,"可变AI",10000)
	char.complianceParameter(MMIndex)
	char.setInt( MMIndex, "HP", char.getWorkInt( MMIndex, "最大HP" ))
	char.TalkToCli(charaindex, -1, "得到一只玛蕾菲雅。", "随机色")
	for i = 0, 4 do
		local pindex = char.getCharPet( charaindex, i)
		if char.check(pindex) == 1 then
			if pindex == MMIndex then
				char.sendStatusString(charaindex, "K" .. i)
			end
		end
	end
	
end


function main()
	item.addLUAListFunction( "ITEM_MM", "GiveMM", "")
end
