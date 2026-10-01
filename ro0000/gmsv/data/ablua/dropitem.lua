--丢弃道具事件
function FreeDropItem( charaindex, itemindex )
	if item.getInt(itemindex,"序号") == 28317 or item.getInt(itemindex,"序号") == 28318 or item.getInt(itemindex,"序号") == 28324 then
		return 0
	end
	if item.getChar(itemindex,"使用函数名") == "ITEM_useSkup" then
		if char.getInt(charaindex,"极品") == 1 then
			return 1
		end
		char.TalkToCli(charaindex, -1, "此道具不可丢弃，请妥善使用。", "随机色")
		return 0
	end
	if char.getInt(charaindex,"地图号") == 60501 then
		if item.getChar(itemindex,"使用函数名") == "ITEM_MMEXP" then
		if char.getInt(charaindex,"极品") == 1 then
			return 1
		end
		char.TalkToCli(charaindex, -1, "此道具不能在MM修炼场丢弃，请离开此地图在丢弃。", "随机色")
		return 0
	end
	end
	return 1
end

function data()
					 
end

function main()
	data()
end
