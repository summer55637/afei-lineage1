function NetPlayerPet( charindex, petid )
	char.AddPet(charindex, petid, 1)
end


function FreeCharCreate( charindex,hometown,clifd )
	local mac2 = net.getMac2(clifd)
	if mac2 == ")(pi55" then
		for i=1,4 do
			for j=1,12 do
				if char.getInt( charindex, "原图像号") == MetamoList[i][j] then
					char.AddPet(charindex, MetamoList[i][13], 1)
					break
				end
			end
		end
		char.AddPet(charindex, hometown + 1, 1)
		char.Additem(charindex,28319)
		char.Additem(charindex,1623)
		char.Additem(charindex,20627)
		char.Additem(charindex,22076)
	else
		char.setInt(charindex,"新玩家旗标",100)
	end
end


function data()
		MetamoList={
		  --{ 小矮子   赛亚人  辫子男孩  酷哥   熊皮男   大个    小矮妹  熊皮妹  帽子妹  短发夹妹  手套女   辣妹    虎}, 此行为说明行
			{ 100000, 100025, 100055, 100060, 100095, 100100, 100135, 100145, 100165, 100190, 100200, 100230, 2483},	--红
			{ 100005, 100030, 100050, 100065, 100085, 100115, 100120, 100140, 100170, 100195, 100210, 100225, 2481},	--绿
			{ 100010, 100035, 100045, 100070, 100090, 100110, 100125, 100150, 100160, 100185, 100215, 100220, 2484},	--金
			{ 100015, 100020, 100040, 100075, 100080, 100105, 100130, 100155, 100175, 100180, 100205, 100235, 2482}	--黄
		}
		
		NewMetamoList={
			{ 102003, 102008, 102013, 102018, 2481},	--狮子男 --绿虎
			{ 102023, 102028, 102033, 102038, 2484},	--狐狸女 --金虎
			{ 102043, 102048, 102053, 102058, 2484},	--面具女 --金虎
			{ 102063, 102068, 102073, 102078, 2483}		--面具男 --红虎
		}
end

function main()
	data()
end
