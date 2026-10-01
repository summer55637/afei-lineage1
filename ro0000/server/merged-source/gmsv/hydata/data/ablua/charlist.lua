function FreeCharList(fd,resault,data)
	if resault == "successful" and data ~= "" then
		local buff = other.getString(data,"|",2)
		if buff == "" then
			return
		end
		buff = other.getStringFromEscaped(buff)
		local faceno = other.getString(buff,"|",2)
		local level = other.getString(buff,"|",3)
		local hp = other.getString(buff,"|",4)
		local str = other.getString(buff,"|",5)
		local tgh = other.getString(buff,"|",6)
		local dex = other.getString(buff,"|",7)
		local cdkey = net.getCdkey(fd)
		local connecttime = net.getconnecttime(fd)
		local logintype = net.getloginmark(fd)
		if logintype == 2 then--PC
			local key = other.md5(faceno .. level .. hp .. str .. connecttime .. cdkey)
			net.setNewDefaultKey(fd,key)
			--net.setFuncNum(fd,other.atoi(string.format("%d","0x" .. string.sub(key,2,2) .. string.sub(key,9,9) .. string.sub(key,18,18))) % 40)
			net.setFuncNum(fd,other.atoi(string.format("%d","0x" .. string.sub(key,20,20) .. string.sub(key,7,7) .. string.sub(key,15,15))) % 60)
		elseif logintype == 4 or logintype == 5 then--ÊÖ»ú
			local key = other.md5(level .. faceno .. connecttime .. tgh .. cdkey .. dex)
			net.setNewDefaultKey(fd,key)
			net.setFuncNum(fd,other.atoi(string.format("%d","0x" .. string.sub(key,20,20) .. string.sub(key,7,7) .. string.sub(key,15,15))) % 60)
		end
	end
end

function data()

end

function main()
	data()
end

