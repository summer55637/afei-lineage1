--丢弃宠物事件
function FreeCharLock( charaindex )
	if char.getInt(charaindex,"安全锁") == 1 then
		lssproto.windows(charaindex, "输入框", "确定|取消", "安全锁", -1, "【为了确保您的账号财产安全】\n【请输入您的安全码进行解锁】\n\n「PS」快捷解锁命令：/safe 安全密码")
		return 0
	elseif char.getInt(charaindex,"安全锁") == 2 then
		lssproto.windows(charaindex, "输入框", "确定|取消", "安全锁", -1, "由于您的账号在异地登录。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。")
		return 0
	elseif char.getInt(charaindex,"安全锁") == 3 then
		lssproto.windows(charaindex, "输入框", "确定|取消", "安全锁", -1, "由于您的账号密码过于简单。\n系统已经自动帮您上锁，确保账号安全。\n请输入您的安全密码进行解锁。")
		return 0
	end
	return 1
end

function data()
					 
end

function main()
	data()
end
