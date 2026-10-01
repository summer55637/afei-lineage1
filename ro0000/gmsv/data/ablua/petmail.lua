function FreePetMail(charaindex,petindex)
	if char.getInt(petindex,"宠ID") ~= 1 and char.getInt(petindex,"宠ID") ~= 3 and char.getInt(petindex,"宠ID") ~= 212 and char.getInt(petindex,"宠ID") ~= 213 then
		char.TalkToCli(charaindex, -1, "[错误提示]邮寄道具只能使用渔村外抓捕的几种宠物（乌力、乌力斯坦、多利凯拉、贝恩达斯）", "随机色")
		return 0
	end
	return 1
end