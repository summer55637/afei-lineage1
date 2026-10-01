function FreeBattleHelp(charaindex,flg)--战斗是否HELP
	if char.getInt(charaindex,"地图号") >= 40030 and char.getInt(charaindex,"地图号") <= 40034 then
		return 0
	end
	return 1
end

function data()

end

function main()
	data()
end
