function offlinetime(itemindex, charaindex, toindex, haveitemindex)
	char.DelItem(charaindex, haveitemindex)
end

function main()
	item.addLUAListFunction( "ITEM_OFFLINETIME", "offlinetime", "")
end
