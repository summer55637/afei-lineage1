function FreeFdError(fd,funcid)
	--[[local charaindex = net.getCharaindex(fd)
	if char.check(charaindex) ~= 1 then
		return
	end
	token = "insert into `errorlog` values ('" .. char.getChar(charaindex,"ук╨е") .. "'," .. funcid .. ",NOW())"
	sasql.query(token)]]
end

function data()

end

function main()
	data()
end

