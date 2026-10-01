--此LUA是离线判断时间和扣除时间还有下线后记录上一次在线期间产生的个人信息!
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

function FreeCharLogout( charindex )
	if char.getWorkInt(charindex,"段位临时") == 1 then
		char.setWorkInt(charindex, "离线",3)
		net.endOne(char.getFd(charindex))
		return 0
	end
	if char.getWorkInt(charindex, "离线") == 1 then
		other.setLuaPLayerNum(other.getLuaPLayerNum()-1)
	end
	if char.getInt(charindex, "地图号") == 40013 or char.getInt(charindex, "地图号") == 40014 or char.getInt(charindex, "地图号") == 40015 then
		char.WarpElderPosition(charindex)
	end
	return 1
	
end

function data()

end

function main()
	data()
end
