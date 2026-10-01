local string = string
local table = table
local sasql = sasql
local common = require "data/lualib/common"
local ErrLog = common.ErrLog("MYUSERDB")

local function _exec(cmd, bretdata)
	local ret = sasql.query_userdb(cmd)
	if ret == 1 then
		if bretdata then
			sasql.free_result_userdb()
			sasql.store_result_userdb()
			local rownum = sasql.num_rows_userdb()
			local filednum = sasql.num_fields_userdb()
			if rownum > 0 then
				local data = {}
				for i=1, rownum do
					sasql.fetch_row_userdb()
					local o = {}
					for j=1, filednum do
						table.insert(o, sasql.data_userdb(j))
					end
					table.insert(data, o)
				end
				return true, data
			end
		end
		return true
	else
		ErrLog("DBError! sql:%s", cmd)
		return false
	end
end

local function _selectDB(tbname, outkey, inkey)
	local outstr = outkey and '`' .. table.concat(outkey, "`, `") .. '`' or "*"
	local sqlstr
	if inkey then
		local intb = {}
		for k, v in pairs(inkey) do
			table.insert(intb, string.format("`%s`='%s'", k, v))
		end
		sqlstr = string.format("select %s from `%s` where %s", outstr, tbname, table.concat(intb, " and "))
	else
		sqlstr = string.format("select %s from `%s`", outstr, tbname)
	end
	return _exec(sqlstr, true)
end

local function _deleteDB(tbname, inkey)
	local sqlstr
	if inkey then
		local intb = {}
		for k, v in pairs(inkey) do
			table.insert(intb, string.format("`%s`='%s'", k, v))
		end
		sqlstr = string.format("delete from `%s` where %s", tbname, table.concat(intb, " and "))
	else
		sqlstr = string.format("delete from `%s`", tbname)
	end
	return _exec(sqlstr)
end

local function _insertDB(tbname, ...)
	local values = {...}
	local sqlstr = string.format("insert into `%s` values ('%s')", tbname, table.concat(values, "', '"))
	return _exec(sqlstr)
end

local function _updateDB(tbname, upkey, inkey)
	local sqlstr
	local uptb = {}
	for k, v in pairs(upkey) do
		table.insert(uptb, string.format("`%s`='%s'", k, v))
	end
	if inkey then
		local intb = {}
		for k, v in pairs(inkey) do
			table.insert(intb, string.format("`%s`='%s'", k, v))
		end
		sqlstr = string.format("update `%s` set %s where %s", tbname, table.concat(uptb, " , "), table.concat(intb, " and "))
	else
		sqlstr = string.format("update `%s` set %s", tbname, table.concat(uptb, " , "))
	end
	return _exec(sqlstr)
end

local function _VipPointLog(...)
	return _exec(string.format("insert into `VipPointLog` values ('%s', '%s', '%s', '%s', '%s', NOW())", ...))
end

local M = {
	select = _selectDB,
	insert = _insertDB,
	delete = _deleteDB,
	update = _updateDB,
	exec = _exec,

	VipPointLog = _VipPointLog
}

return M
