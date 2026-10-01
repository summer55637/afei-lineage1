--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if seqno == 1 then
		if select == 1 then
			if char.getInt(talkerindex, "家族索引") > 0 then
				char.TalkToCli(talkerindex, -1, "请退出家族后再修改名字!", "随机色")
				return
			end
			if char.getChar(talkerindex,"新师徒数据") ~= "" then
				local myteacherdata = char.getChar(talkerindex,"新师徒数据")
				local myflg = other.atoi(other.getString(myteacherdata,"|",1))
				if myflg == 1 then
					char.TalkToCli(talkerindex, -1, "[温馨提示]您还有徒弟啊，修改名字就无法出师咯，请等待所有徒弟出师或者逐出师门后改名哟。", "随机色")
				else
					char.TalkToCli(talkerindex, -1, "[温馨提示]您必须退出师门后才能修改名字，否则将无法出师。", "随机色")
				end
				return
			end
			if npc.Free(meindex, talkerindex, "ITEM=21106") == 1 then
				len = string.len(data)
				if len <= 1 then
					char.TalkToCli(talkerindex, -1, "新名字不能小于1个字符,所以无法让你修改名字!", "随机色")
					return
				end
				if len > 16 then
					char.TalkToCli(talkerindex, -1, "新名字不能大于16个字符,所以无法让你修改名字!", "随机色")
					return
				end
				for i = 1, table.getn(filter) do
					len = string.find(data, filter[i])
					if len ~= nil then
						char.TalkToCli(talkerindex, -1, "你输入的新名字含有不允许的字符,所以无法让你修改名字!", "随机色")
						return
					end
				end
				npc.DelItem(talkerindex, "21106*1")
				char.setChar( talkerindex, "名字", data)
				char.Updata(talkerindex, "名字")
				char.TalkToCli(talkerindex, -1, "修改成功,你的新名字是:" .. char.getChar( talkerindex, "名字"), "随机色")
				for i = 0, 4 do
					petindex = char.getCharPet(talkerindex, i)
					if char.check(petindex) == 1 then
						if char.getChar( petindex, "主人账号") == char.getChar( talkerindex, "账号") then
							char.setChar( petindex, "主人名字", char.getChar( talkerindex, "名字"))
						end
					end
				end
				for i = 0, 14 do
					petindex = char.getCharPoolPet(talkerindex, i)
					if char.check(petindex) == 1 then
						if char.getChar( petindex, "主人账号") == char.getChar( talkerindex, "账号") then
							char.setChar( petindex, "主人名字", char.getChar( talkerindex, "名字"))
						end
					end
				end
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function fixname(itemindex, charaindex, toindex, haveitemindex)
	token = "　　　　　　　　「神奇改名笔」\n\n　　　请在窗口下方输入您要修改的名字\n\n　　　注意：本功能不支持一些特殊符号\n　　　　　　请尽量使用中文或全角字符"
	lssproto.windows(charaindex, "输入框", "确定|取消", 1, char.getWorkInt( npcindex, "对象"), token)
end
--只有在你需要把不同的引号、换行、反斜杠、或是零结束符这些字符置入字符串时， 你才必须使用转义符。可以用[[]]
function data()
	filter = {"gm","GM","ＧＭ","ＧM","管理员","!","","#"," ",":",",",";","`","|","&","+","-","\"",[[/]],[[\]],[[*]]
	}
end

function main()
	item.addLUAListFunction( "ITEM_FIXNAME", "fixname", "")
	data()
	Create("人物修改师", 16495, 777, 10, 10, 6)
end
