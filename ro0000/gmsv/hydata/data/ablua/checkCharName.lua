function checkCharName(charaindex,Name)
	local petindex;
	for i=0,4 do 
		petindex = char.getCharPet(charaindex,i);
		if char.check(petindex) == 1 then
			local petname = char.getChar(petindex,"主人");
			for b = 1, #filter do
				str, len = string.find(petname, filter[b])
				if len~=nil and len > 0 then
					char.setChar(petindex,"主人","");
				end
			end
		end
	end
	print("[checkCharName]0",charaindex,Name)
	if char.getInt(charaindex,"家族索引") > -1 then
		if char.getInt(charaindex,"家族地位") == 3 then
			checkFamilyName(charaindex,char.getChar(charaindex,"家族"))
		end
	end
	
	for i = 1, #filter do
		str, len = string.find(Name, filter[i])
		if len~=nil and len > 0 then
			if charaindex ~= -1 then
				char.TalkToCli(charaindex, -1, "您的游戏名有特殊字符！请联系客服修改您的游戏名！", "红色")
				char.TalkToCli(charaindex, -1, "您的游戏名有特殊字符！请联系客服修改您的游戏名！", "红色")
				char.TalkToCli(charaindex, -1, "您的游戏名有特殊字符！请联系客服修改您的游戏名！", "红色")
				char.TalkToCli(charaindex, -1, "您的游戏名有特殊字符！请联系客服修改您的游戏名！", "红色")
				char.TalkToCli(charaindex, -1, "您的游戏名有特殊字符！请联系客服修改您的游戏名！", "红色")
			end
			return 1
		end
	end
	if charaindex == -1 then
		token = "select * from `CSAlogin` where `OnlineName`='" .. Name .. "'"
		ret = sasql.query(token)
		if ret == 1 then
			sasql.free_result()
			sasql.store_result()
			sqlnum = sasql.num_rows()
			print("[checkCharName]1",token,sqlnum)
			if sqlnum > 0 then
				return 1
			end
		end
	end
	print("[checkCharName]2",charaindex,Name)
	return 0
end

function checkFamilyName(charaindex,Name)
	for i = 1, #filter do
		str, len = string.find(Name, filter[i])
		if len~=nil and len > 0 then
			if charaindex ~= -1 then
				char.TalkToCli(charaindex, -1, "您的家族名有特殊字符！请联系客服修改您的家族名", "红色")
				char.TalkToCli(charaindex, -1, "您的家族名有特殊字符！请联系客服修改您的家族名", "红色")
				char.TalkToCli(charaindex, -1, "您的家族名有特殊字符！请联系客服修改您的家族名", "红色")
				char.TalkToCli(charaindex, -1, "您的家族名有特殊字符！请联系客服修改您的家族名", "红色")
				char.TalkToCli(charaindex, -1, "您的家族名有特殊字符！请联系客服修改您的家族名", "红色")
			end
			return 1
		end
	end
	return 0;
end

function data()
	filter = {
						""
						,"#"
						}
end

function main()
	data()
end
