function ShowList(talkerindex)
	if string.len(char.getChar(talkerindex,"账号")) <= 8 then
		return 0
	end
	local playerquestion = char.getInt(talkerindex,"U8问卷调查")
	for i=1,table.getn(questionid) do
		if questionid[i] == 1 then
			if char.getInt(talkerindex,"转数") >= 1 then
				if other.DataAndData(playerquestion,0) == 0 then
					lssproto.windows(talkerindex, 1037, 0, 0, char.getWorkInt(npcindex,"对象"), "https://www.51boshao.com/?/jq/28673463.aspx|1")
					return 0
				end
			end
		end
	end
	return 0
end

function getQuestionType(talkerindex)
	if string.len(char.getChar(talkerindex,"账号")) <= 8 then
		lssproto.S(talkerindex,"R|0")
		return 0
	end
	local playerquestion = char.getInt(talkerindex,"U8问卷调查")
	for i=1,table.getn(questionid) do
		if questionid[i] == 1 then
			if char.getInt(talkerindex,"转数") >= 1 then
				if other.DataAndData(playerquestion,0) == 0 then
					lssproto.S(talkerindex,"R|1")
					return 0
				end
			end
		end
	end
	lssproto.S(talkerindex,"R|0")
	return 0
end

function WindowTalked( meindex, talkerindex, seqno, select, data)
	if string.len(char.getChar(talkerindex,"账号")) <= 8 then
		return 0
	end
	if data == "" then
		return
	end
	num = other.atoi(data)
	if num < 1 or num > 32 then
		return
	end
	local playerquestion = char.getInt(talkerindex,"U8问卷调查")
	if num == 1 then
		if char.getInt(talkerindex,"转数") < 1 then
			return
		end
		if other.DataAndData(playerquestion,num - 1) == 0 then
			playerquestion = other.DataOrData(playerquestion,num - 1)
			char.setInt(talkerindex,"U8问卷调查",playerquestion)
			getQuestionType(talkerindex)
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	questionid = {1}
end

function main()
	data()
	Create("U8问卷调查", 100000, 777, 17, 13, 4)
end
