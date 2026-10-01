function checkEmptItemNum(charaindex)
	EmptyItemNum = 0
	for i = 9, 23 do
		if char.getItemIndex(charaindex, i) == -1 then
			EmptyItemNum = EmptyItemNum + 1
		end
	end
	return EmptyItemNum
end

function fruit(itemindex, charaindex, toindex, haveitemindex)
	if checkEmptItemNum(charaindex) < 10 then
		char.TalkToCli(charaindex, -1, "很抱歉，你身上不足10个果包的空位！", "随机色")
		return
	end
	char.DelItem(charaindex, haveitemindex)
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	npc.AddItem(charaindex, "24145")
	
end



function data()

end
	
function main()
	item.addLUAListFunction( "ITEM_FRUIT", "fruit", "")
	data()
end
