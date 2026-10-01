function evendsetend(itemindex, charaindex, toindex, haveitemindex)
	if charaindex ~= toindex then
		return
	end

	local id = other.atoi(item.getChar(itemindex, "字段"))
	for i = 1, #evendlist[id][1] do
		npc.EvClr(charaindex, evendlist[id][1][i])
		npc.EvEnd(charaindex, evendlist[id][1][i])
	end

	char.TalkToCli(charaindex, -1, "[温馨提示]恭喜你完成" .. evendlist[id][2] .. "任务", "黄色")

	char.DelItem(charaindex, haveitemindex)

	if evendlist[id][3] > -1 then
		npc.AddItem(charaindex, evendlist[id][3])
	end

end

function data()
	evendlist = {{{69, 70, 71, 72}, "天空岛任务", 1292}
							,{{39}, "琉璃洞窟", 2701}
							,{{40}, "深红洞窟", 2707}
							,{{41,42}, "玄黄洞窟", 2735}
							,{{46}, "碧青洞窟", 2770}
							,{{4},  "成人", 2418}
							,{{1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,18,19,20,21,22,27,28,29,30,31,32,33,34,35,37,38,44,45,47,54}, "1.82全部", 22170}
							,{{9,10,11,12},  "梦德洞窟", -1}
							}
end

function main()
	data()
	item.addLUAListFunction( "ITEM_EVENTSETEND", "evendsetend", "")
end
