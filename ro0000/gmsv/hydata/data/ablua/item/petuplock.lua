function petunlock(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			for j = 1, table.getn(petlist) do
				if char.getInt(toindex, "原图像号") == petlist[j][1] then
					char.setChar(toindex, "名字", petlist[j][2])
					char.sendStatusString(charaindex, "K" .. i)
					char.TalkToCli(charaindex, -1, "成功为你的" .. char.getChar(toindex, "名字") .. "进行解锁！", "随机色")
					char.DelItem(charaindex, haveitemindex)
					return
				end
			end
		end
	end

	char.TalkToCli(charaindex, -1, "该物品只能给宠物使用！", "随机色")
end

function data()
	petlist = {{103020, "利则诺顿"}
						,{103021, "扬奇洛斯"}
						,{103022, "邦奇诺"}
						,{103023, "布鲁顿"}
						,{103024, "邦浦洛斯"}
						}

end


function main()
	data()
	item.addLUAListFunction( "ITEM_PETUNLOCK", "petunlock", "")
end
