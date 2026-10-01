function Vip(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	local viplevel = other.atoi(other.getString(data, "|", 1))
	local viptime = other.atoi(other.getString(data, "|", 2))
	
	oldviptime = char.getInt(charaindex, "会员有效期")
	if oldviptime > other.time() then
		if char.getInt(charaindex, "会员") == viplevel then
			char.setInt(charaindex, "会员有效期", oldviptime + viptime * 24 * 60 * 60)
		else
			char.setInt(charaindex, "会员有效期", other.time() + viptime * 24 * 60 * 60)
		end
	else
		char.setInt(charaindex, "会员有效期", other.time() + viptime * 24 * 60 * 60)
	end
	char.setInt(charaindex, "会员", viplevel)

	token = "您将拥有以下会员服务:"
				.. "\n  1)上线进行全服提示"
				.. "\n  2)人物名称前面显有VIP"
				.. "\n  3)骑所有可以骑的宠物"
				.. "\n  4)游戏经验双倍"
				.. "\n  5)转生不用做1.82任务 但要做红暴祝福哟"
				.. "\n  6) 双倍的泡点时间"

	lssproto.windows(charaindex, "对话框", "确定", -1, -1, token)
	
	char.DelItem(charaindex, haveitemindex)
	
	char.talkToAllServer("P|P|[零九石器]让我们欢迎【" .. char.getChar(charaindex, "名字") .. "】加入零九石器的大家庭","")
	
end

function data()

end

function main()
	item.addLUAListFunction( "ITEM_Vip", "Vip", "")
	data()
end
