function FreeFirstLockPet( charaindex, petindex )
	--[[for i = 1, table.getn(petlist) do
		if char.getInt(petindex, "原图像号") == petlist[i] then
			char.setChar(petindex, "名字", "*" .. char.getChar(petindex, "名字"))
			char.TalkToCli(charaindex, -1, char.getChar(petindex, "名字") .. "交易成功，系统自动将其进行绑定！", "随机色")
		end
	end]]
	char.setInt(petindex,"极品",0)
end

function FreeFirstLockItem( charaindex,itemindex )

end

function data()
	petlist = {1,1,1,1,1}
end

function main()
	data()
end

