function FreeMergeItem( charaindex, data )
	if data == "" then
		return 0
	end
	local itemhaveindex = {}
	local itembuff = ""
	for i=1,15 do
		itembuff = other.getString(data,"|",i)
		if itembuff == "" then
			break
		end
		itemhaveindex[i] = other.atoi(itembuff)
	end
	local cnt1 = {0,0}
	local cnt2 = {0,0}
	local cnt3 = {0,0}
	for i=1,table.getn(itemhaveindex) do
		itemindex = char.getItemIndex(charaindex,itemhaveindex[i])
		if item.check(itemindex) == 1 then
			if item.getInt(itemindex,"ÐòºÅ") == 28321 then
				cnt1[1] = 1
			elseif item.getInt(itemindex,"ÐòºÅ") == 28322 then
				cnt1[2] = 1
			elseif item.getInt(itemindex,"ÐòºÅ") == 28317 then
				cnt2[1] = 1
			elseif item.getInt(itemindex,"ÐòºÅ") == 28323 then
				cnt2[2] = 1
			elseif item.getInt(itemindex,"ÐòºÅ") == 28318 then
				cnt3[1] = 1
			elseif item.getInt(itemindex,"ÐòºÅ") == 28320 then
				cnt3[2] = 1
			end
		end
	end
	if cnt1[1] == 1 and cnt1[2] == 1 then
		for i=1,table.getn(itemhaveindex) do
			char.DelItem(charaindex,itemhaveindex[i])
		end
		char.Additem(charaindex,28317)
		return 1
	elseif cnt2[1] == 1 and cnt2[2] == 1 then
		for i=1,table.getn(itemhaveindex) do
			char.DelItem(charaindex,itemhaveindex[i])
		end
		char.Additem(charaindex,28319)
		return 1
	elseif cnt3[1] == 1 and cnt3[2] == 1 then
		for i=1,table.getn(itemhaveindex) do
			char.DelItem(charaindex,itemhaveindex[i])
		end
		char.Additem(charaindex,28319)
		return 1
	end
	return 0
end

function FreeMergeItemOk( charaindex )
	other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,9,1})
end

function data()
	
end

function main()
	data()
end

