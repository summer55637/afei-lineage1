function NetLoopFunction()
	if messageNum > 0 then
		if messageNowNum < messageNum then
			looptime = looptime + 1
			if math.mod(looptime,minute) == 0 then
				looptime =0;
				messageNowNum = messageNowNum +1;
				char.talkToAllServer("P|P|[星球][温馨提示]：" .. message.."|0","")
			end
		else
			messageNowNum =0;
			messageNum=0;
		end
	end
end

function gg(charaindex, data)
	message = other.getString(data, " ", 1)
	char.talkToAllServer("P|P|[星球][温馨提示]：" .. message.."|0","")
	messageNum = other.atoi(other.getString(data, " ", 2))--条数
	minute = other.atoi(other.getString(data, " ", 3))--间隔时间
	messageNowNum = 0;
	looptime = 0
end

function data()
	minute = 0
	messageNowNum = 0;
	looptime = 0
	messageNum=0
end

function main()
	data()
	magic.addLUAListFunction("gg", "gg", "", 1, "[公告 内容 数量 间隔(分钟)")
end

