function ITEM_ENEMYUP(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	local enemyuptime = other.atoi(other.getString(data, "|", 1))
	local enemyupbase = other.atoi(other.getString(data, "|", 2))
	if char.getInt(charaindex, "遇敌几率时间") > 0 then
		if char.getInt(charaindex, "遇敌几率倍数") > enemyupbase then
			char.TalkToCli(charaindex, -1, "[错误提示]你使用的诱敌香还不如您现在的状态强力，不用使用啦！", "随机色")
			return
		elseif char.getInt(charaindex, "遇敌几率倍数") == enemyupbase then
			char.setInt(charaindex, "遇敌几率时间",char.getInt(charaindex, "遇敌几率时间") + enemyuptime)
			char.DelItem(charaindex, haveitemindex)
			token = "[温馨提示]增加 " .. enemyupbase+1 .. "倍诱敌香 时间 " .. enemyuptime/60 .. " 分钟，目前剩余时长 " .. char.getInt(charaindex, "遇敌几率时间")/60 .. " 分钟，请抓紧时间哟！"
			char.TalkToCli(charaindex, -1, token, "随机色")
		elseif char.getInt(charaindex, "遇敌几率倍数") < enemyupbase then
			char.DelItem(charaindex, haveitemindex)
			char.setInt(charaindex, "遇敌几率时间",enemyuptime)
			char.setInt(charaindex, "遇敌几率倍数",enemyupbase)
			token = "[温馨提示]增加 " .. enemyupbase+1 .. "倍诱敌香 时间 " .. enemyuptime/60 .. " 分钟，目前剩余时长 " .. char.getInt(charaindex, "遇敌几率时间")/60 .. " 分钟，请抓紧时间哟！"
			char.TalkToCli(charaindex, -1, token, "随机色")
		end
	else
		char.DelItem(charaindex, haveitemindex)
		char.setInt(charaindex, "遇敌几率时间",enemyuptime)
		char.setInt(charaindex, "遇敌几率倍数",enemyupbase)
			token = "[温馨提示]增加 " .. enemyupbase+1 .. "倍诱敌香 时间 " .. enemyuptime/60 .. " 分钟，目前剩余时长 " .. char.getInt(charaindex, "遇敌几率时间")/60 .. " 分钟，请抓紧时间哟！"
		char.TalkToCli(charaindex, -1, token, "随机色")
	end
	if char.getInt(charaindex,"地图号") >= 40030 and char.getInt(charaindex,"地图号") <= 40034 then
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,1})
	else
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,0})
	end
	
end

function data()

end

function main()
	item.addLUAListFunction( "ITEM_ENEMYUP", "ITEM_ENEMYUP", "")
	data()
end
