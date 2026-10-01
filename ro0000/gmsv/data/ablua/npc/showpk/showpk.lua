--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "                 " .. char.getChar(meindex, "名字") .. "\n        ≡ 您的战绩成绩单已经打印好了 ≡"
			.. "\n                  PK  次  数：" .. char.getInt(talkerindex, "PK次数")
			.. "\n                  PK  赢  数：" .. char.getInt(talkerindex, "PK赢数")
			.. "\n                  PK  败  数：" .. char.getInt(talkerindex, "PK败数")
			.. "\n                  PK  连  胜：" .. char.getInt(talkerindex, "PK连胜")
			.. "\n                  PK  连  败：" .. char.getInt(talkerindex, "PK连败")
			.. "\n                  PK最高连胜：" .. char.getInt(talkerindex, "PK最高连胜")

		lssproto.windows(talkerindex, "对话框", 8, 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 

	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end


function main()
	Create("「 格斗鉴定师 」", 70153, 2005, 20, 1, 4)
end

