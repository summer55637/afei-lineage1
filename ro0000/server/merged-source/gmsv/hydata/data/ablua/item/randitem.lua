function randitem(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "×Ö¶Î")
	local num = other.atoi(other.getString(data, "|", 1))
	local itemid = other.atoi(other.getString(data, "|", math.random(num) + 1))
	if itemid > -1 then
		npc.AddItem(charaindex, itemid)
		char.DelItem(charaindex, haveitemindex)
	end
end

function main()
	item.addLUAListFunction( "ITEM_RANDITEM", "randitem", "")
end
