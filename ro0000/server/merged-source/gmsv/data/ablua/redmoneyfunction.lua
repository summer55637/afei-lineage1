function RedMoneyFunction(charaindex, data)

	local cdkey = char.getChar(charaindex,"账号")
	local name = char.getChar(charaindex,"名字")
	local type = other.atoi(other.getString(data, "|", 2))
	local num = other.atoi(other.getString(data, "|", 3))
	local total = other.atoi(other.getString(data, "|", 4))
	local sum = total
	local count = 0
	for i = 1,num do
		local count = 0
		if type == 1 then
			count = getIntPart(total/num)
		else
			if i == num then
				count = sum
			else
				local jun = getIntPart(total/num)
				local mintemp = 5 --最少给5点
				local safe_total = (sum - i*mintemp)/i
				count = getIntPart(math.random(mintemp * 100,safe_total*100)/100)
				if jun * 5 < count then
					count = math.random(jun*2,jun*5)
				end
				sum = sum - count
			end
		end
	--	char.TalkToCli(charaindex, -1, "红包"..i.."的金额为"..count.."，余额"..sum, "红色")
		repeat
			XandY = map.RandXAndY(MapId)
		until
			XandY > -1

		fx = map.getX(XandY)
		fy = map.getY(XandY)
		--判断坐标是否正确
		if fx > -1 and fy > -1 then
			CreateBox(MapId, fx, fy, cdkey,name,count)
		end
	end

	char.talkToServer(-1, "[天降红包]玩家【"..char.getChar(charaindex,"名字").."】任性豪爽，在萨伊那斯全境发放了"..num.."个红包，共计"..total.."金币！大家快点去找吧！", "黄色")
		char.talkToServer(-1, "[天降红包]玩家【"..char.getChar(charaindex,"名字").."】任性豪爽，在萨伊那斯全境发放了"..num.."个红包，共计"..total.."金币！大家快点去找吧！", "黄色")
			char.talkToServer(-1, "[天降红包]玩家【"..char.getChar(charaindex,"名字").."】任性豪爽，在萨伊那斯全境发放了"..num.."个红包，共计"..total.."金币！大家快点去找吧！", "黄色")

end

function getIntPart(x)
    if x <= 0 then
       return math.ceil(x);
    end

    if math.ceil(x) == x then
       x = math.ceil(x);
    else
       x = math.ceil(x) - 1;
    end
    return x;
end

function CreateBox(fl, x, y, cdkey,name,count)
	local npcindex = npc.CreateNpc("红包", moneyimg, fl, x, y, 0)
	if char.check(npcindex) == 1 then
		char.setFunctionPointer(npcindex, "循环事件", "LoopBox", "")
		char.setFunctionPointer(npcindex, "对话事件", "TalkedBox", "")
		char.setFunctionPointer(npcindex, "窗口事件", "WindowTalkedBox", "")
		char.setInt(npcindex, "循环事件时间", 2000)
		char.setWorkChar(npcindex, "NPC临时1", cdkey)
		char.setWorkChar(npcindex, "NPC临时2", name)
		char.setWorkInt(npcindex, "NPC临时1", count)
		char.setWorkInt(npcindex,"NOTICE",120137)
	--	print("\n count= "..char.getWorkInt(npcindex, "NPC临时1"))
	end
end

function CreateAllBox()
	for i = 1,table.getn(boxlist) do

		repeat
			XandY = map.RandXAndY(MapId)
		until
			XandY > -1

		fx = map.getX(XandY)
		fy = map.getY(XandY)
		--判断坐标是否正确
		if fx > -1 and fy > -1 then
			CreateBox(MapId, fx, fy, boxlist[i])
		end
	end
end

function TalkedBox(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = "\n                  「 天降红包 」\n\n\n               是否打开面前的红包？"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

function WindowTalkedBox( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 1 then
			if select == 1 then
				local cdkey = char.getWorkChar(meindex, "NPC临时1")
				local name = char.getWorkChar(meindex, "NPC临时2")
				local count = char.getWorkInt(meindex, "NPC临时1")
				local ownerindex = getCharaindexFromCdkey(cdkey)
				if char.check(ownerindex) == 1 then
					char.TalkToCli(ownerindex, -1, "【系统提示】["..char.getChar(talkerindex, "名字").."]领取了您"..count .."金币红包！", "随机色")
				end
				sasql.setVipPoint(talkerindex, sasql.getVipPoint(talkerindex) + count);
				char.TalkToCli(talkerindex, -1, "恭喜您成功领取了[".. name .. "]分享的红包"..count.."金币！", "随机色")
				npc.DelNpc(meindex)
			end
		end
	end
end

function LoopBox(meindex)
	if strat == 1 then
		local timer = char.getWorkInt(meindex,"NPC临时2")
		timer = timer+1
		char.setWorkInt(meindex,"NPC临时2",timer)

		if math.mod(timer,(warptime*60/2)) == 0 then --超时改变位置
			repeat
				XandY = map.RandXAndY(MapId)
			until
				XandY > -1
			fx = map.getX(XandY)
			fy = map.getY(XandY)
			--判断坐标是否正确
			if fx > -1 and fy > -1 then
				char.WarpToSpecificPoint(meindex,MapId,fx,fy)
			end
		end
	else
		npc.DelNpc(meindex)
	end
end


function getCharaindexFromCdkey(cdkey)
	local i = 0
	local maxplayer = char.getPlayerMaxNum()
	for i = 0, maxplayer - 1 do
		if char.check(i) == 1 then
			if char.getChar(i, "账号") ==  cdkey then
				return i
			end
		end
	end
	return -1
end

function redmoney(charaindex, data)

end

function data()
	strat = 1
	--地图号
	MapId = 100
	--每几分钟改变一次位置 防卡
	warptime = 5
	--超时删除 分钟
	deltime = 60
	--红包形象
	moneyimg = 60009
end

function main()
	data()
	magic.addLUAListFunction("redmoney", "redmoney", "", 3, "[gm redmoney 指令]")
end
