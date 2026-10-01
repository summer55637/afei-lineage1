function ITEM_SHUXING(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end
	local num = other.atoi(data)
	if num == 1 then
		char.setInt(charaindex,"地",100)
		char.setInt(charaindex,"水",0)
		char.setInt(charaindex,"火",0)
		char.setInt(charaindex,"风",0)
		token = "恭喜您已将您的属性修改成地10"
		lssproto.windows(charaindex, "对话框", "取消", 0, -1, token)
	elseif num == 2 then
		char.setInt(charaindex,"地",0)
		char.setInt(charaindex,"水",100)
		char.setInt(charaindex,"火",0)
		char.setInt(charaindex,"风",0)
		token = "恭喜您已将您的属性修改成水10"
		lssproto.windows(charaindex, "对话框", "取消", 0, -1, token)
	elseif num == 3 then
		char.setInt(charaindex,"地",0)
		char.setInt(charaindex,"水",0)
		char.setInt(charaindex,"火",100)
		char.setInt(charaindex,"风",0)
		token = "恭喜您已将您的属性修改成火10"
		lssproto.windows(charaindex, "对话框", "取消", 0, -1, token)
	elseif num == 4 then
		char.setInt(charaindex,"地",0)
		char.setInt(charaindex,"水",0)
		char.setInt(charaindex,"火",0)
		char.setInt(charaindex,"风",100)
		token = "恭喜您已将您的属性修改成风10"
		lssproto.windows(charaindex, "对话框", "取消", 0, -1, token)
	end
	char.DelItem(charaindex, haveitemindex)
	char.complianceParameter(charaindex)
	char.sendStatusString(charaindex,"P")
end

function data()

end

function main()
	data()
	item.addLUAListFunction( "ITEM_SHUXING", "ITEM_SHUXING", "")
end
