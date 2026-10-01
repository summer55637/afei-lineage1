--¶ªÆú³èÎïÊÂ¼ş
function FreeDropPetFollow( charaindex, havepetindex )
	local petindex = char.getCharPet(charaindex,havepetindex)
	if char.check(petindex) ~= 1 then
		return 0
	end
	return 1
end

function data()
					 
end

function main()
	data()
end
