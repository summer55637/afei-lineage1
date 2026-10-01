function pettrans(charaindex, data)
	for i=0,4 do
		local petindex = char.getCharPet(charaindex, i)
		if char.check(petindex) == 1 then
			if char.getInt(petindex,"转数") == 0 then
				petindex2 = char.PetTrans(charaindex,petindex,50,50,50,50)
				if char.check(petindex2) == 1 then
					for j=1,139 do
						char.PetLevelUp(petindex2)
						char.setInt(petindex2,"等级",char.getInt(petindex2,"等级") + 1)
						char.complianceParameter(petindex2)
					end
					char.setInt(petindex2,"HP",char.getWorkInt(petindex2, "最大HP"))
					char.sendStatusString(charaindex, "K" .. i)
				end
			end
		end
	end
end

function data()
	
end

function main()
	data()
	magic.addLUAListFunction("petzhuan", "pettrans", "", 3, "[pettrans]")
end

