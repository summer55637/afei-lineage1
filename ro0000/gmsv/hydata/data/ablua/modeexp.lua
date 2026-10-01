function FreeModeExp( charaindex,getexp, modexp )
	--return getexp + getexp * modexp / 100
	getexp=getexp or 1
	modexp=modexp or 1
	local ownindex = charaindex
	if char.getInt(charaindex,"类型") == 3 then
		ownindex = char.getWorkInt(charaindex,"宠物主人索引")
	end
	if char.getInt(ownindex,"转数") >= 1 then
		getexp = getexp * 4
	--elseif npc.CheckEvent(ownindex,60) ~= 0 then
	elseif char.getInt(ownindex,"等级") >= 120 then
		getexp = getexp * 4
	--elseif npc.CheckEvent(ownindex,31) ~= 0 then
	elseif char.getInt(ownindex,"等级") >= 80 then
		getexp = getexp * 2
	--elseif npc.CheckEvent(ownindex,301) ~= 0 then
	elseif char.getInt(ownindex,"等级") >= 10 then
		getexp = getexp * 2
	end
	local ret=getexp + getexp * modexp
	--print("[FreeModeExp]",ret,type(ret))
	return math.floor(ret / 100)
end

function data()
					 
end

function main()
	data()
end
