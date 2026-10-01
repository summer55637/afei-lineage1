function FreeBattleDuck( attackindex,defindex,per) --判断命中per越大越不容易命中
	if char.getInt(attackindex,"类型") == 3 then
		if char.getInt(defindex,"类型") == 3 then
			--[[if char.getInt(attackindex,"宠ID") == 3038 and char.getInt(defindex,"宠ID") == 304 then
				per = per - math.floor(per * 0.4)
			else]]if char.getInt(attackindex,"宠ID") == 304 then
				per = per + math.floor(per * 0.05)
			elseif char.getInt(defindex,"宠ID") == 304 then
				per = per - math.floor(per * 0.05)
			end
		end
	elseif char.getInt(attackindex,"类型") == 1 then
		if char.getWorkInt(attackindex,"攻击") >= 300 then
			per = per + math.floor(per * 0.1)
		end
	end
	return per
end
