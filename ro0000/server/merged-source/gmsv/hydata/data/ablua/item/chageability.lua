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

function chageabilty (itemindex, charaindex, toindex, haveitemindex)
	local point = char.getInt(charaindex, "技能点")
	local vital = getIntPart(char.getInt(charaindex, "体力")  / 100)
	local str = getIntPart(char.getInt(charaindex, "腕力") / 100)
	local tgh = getIntPart(char.getInt(charaindex, "耐力") / 100)
	local dex = getIntPart(char.getInt(charaindex, "速度") / 100)
	local sum = vital + str + tgh + dex + point

	char.setInt(charaindex, "技能点", (sum - 10) )
	char.setInt(charaindex, "体力", 1000)
	char.setInt(charaindex, "腕力", 0)
	char.setInt(charaindex, "耐力", 0)
	char.setInt(charaindex, "速度", 0)

	char.complianceParameter(charaindex)
	char.sendStatusString(charaindex, "P")
	char.Skillupsend(charaindex)

	char.DelItem(charaindex, haveitemindex)
	char.TalkToCli(charaindex, meindex, "清洗能力完毕，请原登你的人物已便显示！", "随机色")
end

function data()

end

function main()
	item.addLUAListFunction( "ITEM_CHAGEABLITY", "chageabilty", "")
end
