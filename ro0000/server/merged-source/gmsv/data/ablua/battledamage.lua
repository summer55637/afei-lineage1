function FreeBattleDamage( attackindex, defindex, damage)
	if char.getInt(attackindex, "¿‡–Õ") == 3 then
		local petai = char.getWorkInt(attackindex,"÷“≥œ")
		if petai < 25 then
			damage = math.ceil(damage * 75 / 100)
		elseif petai < 30 then
			damage = math.ceil(damage * 80 / 100)
		elseif petai < 35 then
			damage = math.ceil(damage * 85 / 100)
		elseif petai < 50 then
			damage = math.ceil(damage * 90 / 100)
		elseif petai < 80 then
			damage = math.ceil(damage * 95 / 100)
		end
		if char.getInt(defindex, "¿‡–Õ") == 3 then
			if char.getInt(attackindex,"≥ËID") == 3040 and char.getInt(defindex,"≥ËID") == 304 then
				damage = math.ceil(damage * 110 / 100)
			elseif char.getInt(attackindex,"≥ËID") == 304 and char.getInt(defindex,"≥ËID") == 3040 then
				damage = math.ceil(damage * 90 / 100)
			elseif char.getInt(attackindex,"≥ËID") == 304 and char.getInt(defindex,"≥ËID") == 3038 then
				damage = math.ceil(damage * 90 / 100)
			elseif char.getInt(attackindex,"≥ËID") == 3038 and char.getInt(defindex,"≥ËID") == 304 then
				damage = math.ceil(damage * 110 / 100)
			end
		end
	elseif char.getInt(attackindex, "¿‡–Õ") == 1 then
		if char.getWorkInt(attackindex,"∏Ωº”…À∫¶") > 0 then
			damage = math.ceil(damage * (100 + char.getWorkInt(attackindex,"∏Ωº”…À∫¶")) / 100)
		end
	end
	return damage
end

function data()
	
end

function main()
	data()
end
