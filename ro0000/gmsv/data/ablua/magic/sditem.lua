function sditem(charaindex, data)
	if data == nil then
		char.TalkToCli(charaindex, -1, "请输入账号", "随机色")
		return
	end
	local itemid = other.getString(data, " ", 1)
	local cdkey = other.getString(data, " ", 2)
	local maxplayer = char.getPlayerMaxNum() - 1
	local itemindex = -1
	for i=0,maxplayer do
		if char.check(i) == 1 then
			if char.getChar(i,"账号") == cdkey then
				itemindex = char.Additem(i,other.atoi(itemid))
				if itemindex > -1 then
					char.talkToAllServer("P|P|[端午活动]恭喜玩家[" .. char.getChar(i,"名字") .. "]在<渔村医院&渔村PK区>收到一个活动礼物，得到[" .. item.getChar(itemindex,"显示名") .. "]。","")
					char.talkToAllServer("P|P|[端午活动]恭喜玩家[" .. char.getChar(i,"名字") .. "]在<渔村医院&渔村PK区>收到一个活动礼物，得到[" .. item.getChar(itemindex,"显示名") .. "]。","")
					char.talkToAllServer("P|P|[端午活动]恭喜玩家[" .. char.getChar(i,"名字") .. "]在<渔村医院&渔村PK区>收到一个活动礼物，得到[" .. item.getChar(itemindex,"显示名") .. "]。","")
				else
					char.talkToAllServer("P|P|[端午活动]很可惜，玩家[" .. char.getChar(i,"名字") .. "]由于身上道具栏满了，错失了一个端午粽子。","")
				end
				return
			end
		end
	end
end

function main()
	magic.addLUAListFunction("sditem", "sditem", "", 3, "测试专用命令")
end

