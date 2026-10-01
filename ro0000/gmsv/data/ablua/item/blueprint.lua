function blueprint(itemindex, charaindex, toindex, haveitemindex)
	local id = other.atoi(item.getChar(itemindex, "字段"))
	if npc.Free(-1, charaindex, BlueprintList[id][2]) == 1 then
		for i = 1, #BlueprintList[id][3] do
			npc.DelItem(charaindex, BlueprintList[id][3][i])
		end
		char.DelItem(charaindex, haveitemindex)
		npc.AddItem(charaindex, BlueprintList[id][1])
	else
		char.TalkToCli(charaindex, -1, "很抱歉，你所需的设计蓝图中的素材不足够，无法为您设计！", "随机色")
	end
end

function data()
								--生成的ID，条件，删除物品
	BlueprintList = {{23002, "ITEM=22462&ITEM=22463&ITEM=22464&ITEM=22465", {22462, 22463, 22464, 22465}}
									,{23006, "ITEM=22462*4", {22462, 22462, 22462, 22462}}
									}
end

function main()
	data()
	item.addLUAListFunction( "ITEM_BLUEPRINT", "blueprint", "")
end
