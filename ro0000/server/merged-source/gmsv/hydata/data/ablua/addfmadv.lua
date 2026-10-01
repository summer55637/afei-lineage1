--此lua是把端里的完成什么期标任务获得多少声望写道lua里了
function FreeAddFMAdv( charaindex, shiftbit )
	if config.getGameservername() == "零九石器任务线" then
		if char.getInt(charaindex, "转数") > 0 then
			if shiftbit > 0 and shiftbit <=#FMAdvTbl then
				if FMAdvTbl[shiftbit] > 0 then
					char.setInt(charaindex, "活力", char.getInt(charaindex, "活力") + FMAdvTbl[shiftbit])
					char.TalkToCli(charaindex, -1, "恭喜你完成任务并获得" .. FMAdvTbl[shiftbit] .. "活力", "随机色")
				end
			end
		end
	end
end

function data()
 FMAdvTbl = {
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	6,
	0,
	3,
	0,
	0,
	4,
	8,
	0,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	9,
	0,
	0,
	0,
	0,
	0,
	0,
	150,
	200,
}
end

function main()
	data()
end
