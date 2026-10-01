function FreeShowItemEffect(itemindex)
	local type,shuoming
	type = item.getInt(itemindex,"类型")
	shuoming = item.getChar(itemindex,"说明")
	local itemtype = 0
	if type == 16 or type == 20 or type == 21 or type == 22 or type == 23 then
		itemtype = 2
	else
		itemtype = 1
	end
	if itemtype == 1 then
		local magicid = item.getInt(itemindex,"精灵")
		local magicname = magic.getChar(magicid,"名字")
	
		shuoming = item.getInt(itemindex,"攻") .. "," .. item.getInt(itemindex,"防") .. "," .. item.getInt(itemindex,"敏") .. "," .. item.getInt(itemindex,"HP") .. "," .. item.getInt(itemindex,"MP") .. "," .. item.getInt(itemindex,"伤") .. "," .. item.getInt(itemindex,"吸") .. "," .. item.getInt(itemindex,"格档") .. "," .. item.getInt(itemindex,"回避") .. "," .. item.getInt(itemindex,"会心") .. "," .. item.getInt(itemindex,"毒耐") .. "," .. item.getInt(itemindex,"麻耐") .. "," .. item.getInt(itemindex,"睡耐") .. "," .. item.getInt(itemindex,"石耐") .. "," .. item.getInt(itemindex,"酒耐") .. "," .. item.getInt(itemindex,"混耐").."," .. item.getInt(itemindex,"魅力")..","..magicname
	end
	return shuoming
end

function data()

end

function main()
	data()
end

