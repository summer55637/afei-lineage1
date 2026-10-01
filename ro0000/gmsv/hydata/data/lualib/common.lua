--解析分隔符,返回参数列表

local function _splitargs(data, delim)
	delim = delim or "|"
	data = data .. delim
	local pattern = "(.-)" .. delim
	local args = {}
	for v in string.gmatch(data, pattern) do
		table.insert(args, v)
	end
	return args
end

local function _debuglog(modulename)
	return function (...)
		local str = string.format(...)		--5.1这里对nil的处理不如5.3
		print(modulename, str)
	end
end

local function _errlog(modulename)
	return function (...)
		local str = string.format(...)
		print(modulename, str)
	end
end

local M = {
	SplitArgs = _splitargs,
	DebugLog = _debuglog,
	ErrLog = _errlog
}

return M
