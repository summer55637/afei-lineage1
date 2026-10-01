--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if char.getInt(talkerindex,"骑宠") > -1 then
			token = "骑乘状态下无法更改人物形象"
			lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			return
		end
		local face = char.getInt(talkerindex,"头像号")
		local CharGraNo = other.NumAndNum(face,0xff0000)/0x10000;
		local CharMouthNo = other.NumAndNum(face,0xff00)/0x100;
		local CharEyeNo = other.NumAndNum(face,0xff);
		
		token = char.getInt(talkerindex,"原图像号") .. "|" .. CharGraNo.."|"..CharMouthNo.."|"..CharEyeNo
		lssproto.windows(talkerindex, 1001, "确定|取消", 0, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 0 then
			if data == "" then
				return
			end
			local playerimagicbuff = other.getString(data,"|",1)
			local playerfacenobuff = other.getString(data,"|",2)
			if playerimagicbuff == "" or playerfacenobuff == "" then
				return
			end
			if char.checkPlayerImageNumber(other.atoi(playerimagicbuff)) ~= 1 then
				return
			end
			if char.checkFaceImageNumber(other.atoi(playerimagicbuff),other.atoi(playerfacenobuff)) ~= 1 then
				return
			end
			token = "您确定要更换您的形象吗？"
				 .. "\n更换形象每次收取388金币"
			char.setWorkInt(talkerindex,"NPC临时15",other.atoi(playerimagicbuff))
			char.setWorkInt(talkerindex,"NPC临时16",other.atoi(playerfacenobuff))
			lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
		end
		if seqno == 1 then
			if select == 1 then
				local playerimagic = char.getWorkInt(talkerindex,"NPC临时15")
				local playerfaceno = char.getWorkInt(talkerindex,"NPC临时16")
				if char.checkPlayerImageNumber(playerimagic) ~= 1 then
					return
				end
				if char.checkFaceImageNumber(playerimagic,playerfaceno) ~= 1 then
					return
				end
				if char.getInt(talkerindex,"骑宠") > -1 then
					token = "骑乘状态下无法更改人物形象"
					lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
					return
				end
				if sasql.getVipPoint(talkerindex) < 388 then
					char.newMessageToCli(talkerindex,-1,"您金币不足388","白色")
					lssproto.windows(talkerindex, 1038, 0, -1, -1, "2")
					return
				end
				char.setInt(talkerindex,"图像号",playerimagic)
				char.setInt(talkerindex,"原图像号",playerimagic)
				char.setInt(talkerindex,"头像号",playerfaceno)
				local myvippoint = sasql.getVipPoint(talkerindex)
				sasql.setVipPoint(talkerindex,sasql.getVipPoint(talkerindex) - 388)
				other.CallFunction("setCostData", "data/ablua/npc/huodong/huodong.lua", {talkerindex,388})
				token = "insert into `VipPointLog` values ('" .. char.getChar(talkerindex,"账号") .. "'," .. -388 .. "," .. myvippoint .. "," .. myvippoint - 388 .. ",'更换人物形象扣除" .. 388 .. "金币',NOW())"
				sasql.query(token)
				char.newMessageToCli(talkerindex,-1,"扣除金币388","白色")
				char.complianceParameter(talkerindex)
				char.ToAroundChar(talkerindex)
				char.sendStatusString(talkerindex,"P")
				token = "更改形象成功"
					 .. "\n请重新登陆后查看"
				lssproto.windows(talkerindex, "对话框", "取消", 0, -1, token)
			end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	local index = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(index, "对话事件", "Talked", "")
	char.setFunctionPointer(index, "窗口事件", "WindowTalked", "")
end

function data()

end

function main()
	data()
	Create("美女", 26742, 1006, 18, 30, 6)
	Create("美女", 26742, 2006, 29, 20, 6)
	Create("美女", 26742, 3006, 27, 20, 6)
	Create("美女", 26742, 4006, 12, 26, 6)
end
