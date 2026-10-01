function TextCut(TempData,CutStr)
	TempData = TempData .. CutStr
	local t = {}
	local NowPosition = 1
	repeat
			local nexti = string.find(TempData, CutStr, NowPosition)
			table.insert(t, string.sub(TempData, NowPosition,nexti-string.len(CutStr)))
			NowPosition = nexti + string.len(CutStr)
	until NowPosition > string.len(TempData)
	return t
end


function LoadFamilyBadge(fd)
	lssproto.FamilyBadge(fd,BadgeBuff)
end

--[[function ReadFamilyBadgeData()
	local FileH;
	local TempData,ii;
	FileH = assert(io.open("./data/ablua/other/familybadge/data.txt", "r"))
	TempData = FileH:read("*a"); -- 读取所有内容
	FileH:close();
	BadgeBuff = BadgePrice.."|"
	if TempData ~= "" then
		ii = 0;
		TempData = TextCut(TempData,"\n");
		for b = 1,table.getn(TempData) do 
			if string.sub(TempData[b],1,1) ~= "#" then
				ii = ii + 1;
				FamilyBadgeData[ii] = tonumber(TempData[b]);
			end
		end
		for b=1,table.getn(FamilyBadgeData) do 
			if b~=table.getn(FamilyBadgeData) then
				BadgeBuff = BadgeBuff .. FamilyBadgeData[b].."|";
			else
				BadgeBuff = BadgeBuff .. FamilyBadgeData[b];
			end
		end
	end
end]]

function data()
	BadgePrice=1000
	FamilyBadgeData={59000,
59001,
59002,
59003,
59004,
59005,
59006,
59007,
59008,
59009,
59010,
59011,
59012,
59013,
59014,
59015,
59016,
59017,
59018,
59019,
59020,
59021,
59022,
59023,
59024,
59025,
59026,
59027,
59028,
59029,
59030,
59031,
59032,
59033,
59034,
59035,
59036,
59037,
59038,
59039,
59040,
59041,
59042,
59043,
59044,
59045,
59046,
59047,
59048,
59049,
59050,
}
	BadgeBuff= BadgePrice .. ""
	for i = 1,#FamilyBadgeData do
		BadgeBuff = BadgeBuff .. "|" .. FamilyBadgeData[i]
	end
	--ReadFamilyBadgeData()
	lssproto.GetFBData(FamilyBadgeData,BadgePrice)
end

function main()
	data()
end

