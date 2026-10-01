function FreeBattleComboCheck( charaindex, per) --判断命中per越大越不容易命中
	if char.getInt(charaindex,"类型") == 1 then
		if char.getWorkInt(charaindex,"攻击") >= 300 then
			per = per - math.floor(per * 0.1)
		end
	end
	return per
end
