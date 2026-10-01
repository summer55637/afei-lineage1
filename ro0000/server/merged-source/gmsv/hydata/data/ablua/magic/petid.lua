function petid(charaindex, data)
	for i=1,5 do
		local petindex = char.getCharPet(charaindex, i - 1)
		if char.check(petindex) ~= 1 then
			char.TalkToCli(charaindex, -1, "[错误提示]宠物栏[" .. i .. "]是空的哦！", "黄色")
		else
			char.TalkToCli(charaindex, -1, "宠物栏[" .. i .. "][" .. char.getChar(petindex,"名字") .. "]长编号：" .. char.getInt(petindex,"宠ID"), "黄色")
		end
	end
end

function main()
	magic.addLUAListFunction("petid", "petid", "", 1, "查询宠物编号")
end

