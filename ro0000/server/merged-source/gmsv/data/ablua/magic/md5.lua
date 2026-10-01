function md5(charaindex, data)
	if data == "" then
		return
	end
	message = other.getString(data, " ", 1)
	if message == "" then
		return
	end
	char.TalkToCli(charaindex, -1, other.md5(message), "Ëæ»úÉ«")
end

function main()
	magic.addLUAListFunction("md5", "md5", "", 1, "[md5 ÄÚÈİ]")
end

