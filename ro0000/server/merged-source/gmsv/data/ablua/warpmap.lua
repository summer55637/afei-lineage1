function NewMapBattleInfo(charaindex,floorid, x, y)
	if floorid == 1042 or floorid == 2032 or floorid == 3032 or floorid == 4032 then
		token = family.ShowFamilyPkName(floorid,math.floor(floorid / 1000),1) .. "|" .. family.ShowFamilyPkPlayerNum(floorid,math.floor(floorid / 1000),1) .. "|" .. family.ShowFamilyPkName(floorid,math.floor(floorid / 1000),2) .. "|" .. family.ShowFamilyPkPlayerNum(floorid,math.floor(floorid / 1000),2)
		lssproto.sendNewMapBattleInfo(char.getFd(charaindex),1,token)
	elseif floorid == 60501 then
		other.CallFunction("showmmexp", "data/ablua/item/mmexp.lua", {charaindex})
	else
		lssproto.sendNewMapBattleInfo(char.getFd(charaindex),0,"")
	end
	return 0
end
--地图传送条件
function FreeWarpMap( charaindex, floorid, x, y )
	if floorid == 60501 and config.getGameservername() == "娱乐互动线" then
		char.newMessageToCli(charaindex, -1, "请前往其他线路修炼MM", "白色")
		return 0
	end
	if floorid >= 32017 and floorid <= 32020 then
		if char.getInt(charaindex,"等级") < 80 then
			char.newMessageToCli(charaindex, -1, "此地图需要80级及以上才可进入", "白色")
			return 0
		end
	end
	if other.CallFunction("warpmap", "data/ablua/npc/wenming/wenming.lua", {charaindex,floorid}) == 0 then
		return 0
	end
	--NewMapBattleInfo(charaindex,floorid, x, y)
	if char.getInt(charaindex,"地图号") == 41012 then
		other.CallFunction("quithecheng", "data/ablua/npc/hecheng/hecheng.lua", {charaindex})
	end
	if floorid >= 40030 and floorid <= 40034 then
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,1})
	else
		other.CallFunction("SAsend","data/ablua/dispatchmessage.lua",{charaindex,0})
	end
	return 1
end

function data()
					 
end

function main()
	data()
end
