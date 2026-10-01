function FreeLock( data )
	token = "select `time` from `Lock` where `Name`='" .. data .. "'"
	ret = sasql.query(token)
	if ret ~= 1 then
		return -1
	end
	sasql.free_result()
	sasql.store_result()
	if sasql.num_rows() > 0 then
		sasql.fetch_row()
		local locktime = other.atoi(sasql.data(1))
		if locktime <= 0 then
			return 1
		elseif locktime >= other.time() then
			return locktime
		else
			sasql.query("delete from `Lock` where `Name`='" .. data .. "'")
		end
	end
	return 0
end

function data()

end

function main()
	data()
end
