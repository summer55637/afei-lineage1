--配置表csv格式读取器

-- local String2Table
local function ConvertData(dtype, data)
	if dtype == "int" then
		local numdata = tonumber(data)
		return numdata and math.floor(numdata)
	elseif dtype == "text" then
		return data or ""
	-- elseif dtype == "LIST<INT>" then
	-- 	return String2Table(data,"|","INT")
	-- elseif dtype == "LIST<STRING>" then
	-- 	return String2Table(data,"|","STRING")
	-- elseif dtype == "LIST<FLOAT>" then
	-- 	return String2Table(data,"|","FLOAT")
	else
		error(string.format("ERROR!!!!!: %s is invalid data format", tostring(dtype)))
	end
end

-- String2Table = function(content, split, dtype)
-- 	assert(type(content) == "string")
-- 	if string.sub(content,#content) ~= split then
-- 		content = content .. split 			--末尾补一个分隔符
-- 	end
-- 	local ret = {}
-- 	for element in string.gmatch(content, "(.-)"..split) do
-- 		table.insert(ret, ConvertData(dtype,element))
-- 	end
-- 	return ret
-- end

local function _read(filename, delim)
	local file, msg = io.open(filename)
	if not file then
		error(msg)
	end
	--handle bom head
	local bom = file:read(3)
	local b,o,m = string.byte(bom, 1, 3)
	if b == 239 and o == 187 and m == 191 then
		print("跳过BOM头")
	else
		file:seek("set", 0)
	end
	------------------------------------------
	local data = {}
	local t_type = {}		--类型
	local t_comment = {}	--字段说明
	local t_key = {}		--键值

	delim = delim or ","								--默认逗号分隔符
	--local pattern = "([^" .. delim .."]*)"				--捕获分隔的内容(5.1版本不能用)
	local pattern = "(.-)" .. delim							--捕获分隔的内容(5.1版本)

	local row, datacount, fieldnum = 0, 0, 0
	for line in file:lines() do
		line = line .. delim								--for 5.1 version match
		row = row + 1
		if row == 1 then
			for v in string.gmatch(line, pattern) do			--键值
				table.insert(t_key, v)
				fieldnum = fieldnum + 1
			end
		-- elseif row == 2 then									--类型
		-- 	for aa in string.gmatch(line, pattern) do
		-- 		table.insert(t_type,aa)
		-- 	end
		-- elseif row == 3 then
		-- 	for aa in string.gmatch(line, pattern) do			--字段说明
		-- 		table.insert(t_comment,aa)
		-- 	end
		else
			local rowdata = {}
			local col = 0
			for v in string.gmatch(line, pattern) do
				col = col + 1
				local key = assert(t_key[col])
				rowdata[key] = tonumber(v) or v			--目前只有number和string两种
				-- local success, value = pcall(ConvertData, t_type[col], aa)
				-- if success then
				-- 	rowdata[t_key[col]] = value
				-- else
				-- 	error(string.format("配置表: %s 字段错误!\n内容: %s \n行号: %s 列号: %s", filename, aa, row, col))
				-- end
			end
			assert(col == fieldnum)
			local ttindex = rowdata[t_key[1]]
			if ttindex then
				if data[ttindex] then
					error(string.format("配置表: %s 有重复索引! 值: %s", filename, ttindex))
				end
				data[ttindex] = rowdata 				--默认第一列为key
			else
				error(string.format("配置表:%s 发现无效数据, 行: %d", filename, row))
			end
			datacount = datacount + 1
		end
	end
	file:close()
	return data, datacount
end

local M = {}
M.Read = _read
return M