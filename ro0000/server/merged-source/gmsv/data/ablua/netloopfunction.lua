function getIntPart(x)
    if x <= 0 then
       return 0;
    end

    if math.ceil(x) == x then
       x = math.ceil(x);
    else
       x = math.ceil(x) - 1;
    end
    return x;
end

function NetLoopFunction()
	local ExpBaseDate = {{"20180824",1535126399}}
	local nWeekDay = tonumber(os.date("%w",  os.time()))
	local year = tonumber(os.date("%Y", os.time()))
	local month = string.format("%02d",tonumber(os.date("%m", os.time())))
	local day = string.format("%02d",tonumber(os.date("%d", os.time())))
	local hour = tonumber(os.date("%H", os.time()))
	local minite = tonumber(os.date("%M", os.time()))
	local today = year .. month .. day
	local todaybase = 0
	for i=1,#ExpBaseDate do
		if today == ExpBaseDate[i][1] then
			todaybase = ExpBaseDate[i][2]
			break
		end
	end
	if config.getGameservername() == "娱乐互动线" then
		config.set("battleexp=2")
		config.set("battleexptime=2")
	else
		if todaybase > 0 then
			config.set("battleexp=5")
			local exptime = todaybase - os.time()
			config.set("battleexptime=5" .. exptime)
		else
			config.set("battleexp=5")
			config.set("battleexptime=5")
		end
	end
	if looptime % 1 == 0 then
		messageu8cnt = messageu8cnt + 1
		if messageu8cnt < 1 or messageu8cnt > #messageu8 then
			messageu8cnt = 1
		end
		messageu8appstorecnt = messageu8appstorecnt + 1
		if messageu8appstorecnt < 1 or messageu8appstorecnt > #messageu8appstore then
			messageu8appstorecnt = 1
		end
		messagemecnt = messagemecnt + 1
		if messagemecnt < 1 or messagemecnt > #messageme then
			messagemecnt = 1
		end
	end
	local playeronlinenum = 0
	local maxplayer = char.getPlayerMaxNum()
	local randi = math.random(0,maxplayer - 1)
	local luckypoint = {100,200,500}
	local luckytype = math.random(100)
	local luckyret = {0,0}
	for i = 0, maxplayer - 1 do
		if char.check(i) == 1 then
			if char.getWorkInt(i,"离线") == 0 then
				if os.date("%x", os.time()) ~= os.date("%x", char.getWorkInt(i,"登陆时间")) then
					char.setWorkInt(i,"登陆时间",other.time())
					char.setInt(i,"签到在线时间",0)
					char.setInt(i,"签到FLG",0)
				end
				char.setInt(i,"签到在线时间",char.getInt(i,"签到在线时间") + 1)
				--[[if char.getWorkInt(i,"心跳时间") == 0 then
					char.setWorkInt(i,"心跳时间",other.time())
				else
					if char.getInt(i,"地图号") ~= 117 and string.len(char.getChar(i,"账号")) <= 8 then
						if other.time() - char.getWorkInt(i,"心跳时间") > 120 then
							char.WarpToSpecificPoint(i,117,289,168)
							char.DischargeParty(i, 1)
							--net.endOne(char.getFd(i))
							--char.logou(i)
							token = "insert into `speedlog` values ('" .. char.getChar(i,"账号") .. "',300,300,NOW())"
							sasql.query(token)
						end
					end
				end]]
				if looptime % 1 == 0 then
					if string.len(char.getChar(i,"账号")) > 8 then
						if net.getloginmark(char.getFd(i)) == 5 then
							char.TalkToCli(i,-1, messageu8appstore[messageu8appstorecnt], "随机色")
						else
							char.TalkToCli(i,-1, messageu8[messageu8cnt], "随机色")
						end
					else
						char.TalkToCli(i,-1, messageme[messagemecnt], "随机色")
					end
				end
			else
				if os.date("%x", os.time()) ~= os.date("%x", char.getWorkInt(i,"登陆时间")) then
					char.setWorkInt(i,"登陆时间",other.time())
					char.setInt(i,"签到在线时间",0)
					char.setInt(i,"签到FLG",0)
				end
			end
			if char.getInt(i, "遇敌几率时间") > 0 then
				local myenemyuptime = math.max(char.getInt(i, "遇敌几率时间") - 60,0)
				if myenemyuptime == 0 then
					char.setInt(i, "遇敌几率倍数",0)
					char.TalkToCli(i, -1, "[温馨提示]您的诱敌香时间已经到了哦，遇到低级捕捉宠物的概率恢复正常啦，还要就继续吃哟！", "随机色")
				end
				char.setInt(i, "遇敌几率时间",myenemyuptime)
			end
			playeronlinenum = playeronlinenum + 1
			if char.getWorkInt(i,"离线") < 1 and char.getInt(i,"地图号") ~= 60501 then
				if looptime % 3 == 0 then
					local vigordata = char.getChar(i,"活力时间")
					local vigordate = ""
					local vigornum = 0
					if vigordata == "" then
						vigordate = os.date("%Y%m%d",os.time())
					else
						vigordate = other.getString(vigordata,"|",1)
						vigornum = other.atoi(other.getString(vigordata,"|",2))
					end
					if vigordate ~= os.date("%Y%m%d",os.time()) then
						vigordate = os.date("%Y%m%d",os.time())
						vigornum = 0
					end
					if vigornum < vigormax[char.getInt(i,"转数") + 1] then
						char.setInt(i,"活力",char.getInt(i,"活力")+1)
						char.setChar(i,"活力时间",vigordate .. "|" .. vigornum + 1)
					end
				end
			elseif char.getWorkInt(i,"离线") == 1 then
				if looptime % 6 == 0 then
					char.setInt(i,"活力",char.getInt(i,"活力") - 1)
					char.setInt(i,"气势",char.getInt(i,"气势") + 100)
					saacproto.ACFixFMData(i,12,char.getInt(i,"气势"),"")
					other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {i,2,1})
				end
				if char.getInt(i,"活力") <= 0 then
					char.logou(i)
				end
			elseif char.getWorkInt(i,"离线") == 2 or char.getWorkInt(i,"离线") == 3 then
				if char.getWorkInt(i,"登陆时间") + 60*5 < other.time() then
					char.logou(i)
				end
			elseif char.getWorkInt(i,"离线") == 0 and char.getInt(i,"地图号") == 60501 and char.getWorkChar(i,"MM道具") ~= "" then
				local maxnum = 1440
				local zhaotype = 0
				for j=9,23 do
					local itemindex = char.getItemIndex(i, j)
					if item.check(itemindex) == 1 then
						if item.getChar(itemindex,"使用函数名") == "ITEM_MMEXP" and char.getWorkChar(i,"MM道具") == item.getChar(itemindex,"编码") then
							zhaotype = 1
							if char.getInt(i,"活力") <= 0 then
								char.setWorkChar(i,"MM道具","")
								zhaotype = 0
								char.WarpElderPosition(i)
								break
							end
							local itemdata = item.getChar(itemindex,"字段")
							local itemnum = 0
							local itemquick = 0
							local itemvigor = 0
							if itemdata ~= "" then
								itemnum = other.atoi(other.getString(itemdata,"|",1))
								itemquick = other.atoi(other.getString(itemdata,"|",2))
								itemvigor = other.atoi(other.getString(itemdata,"|",3))
								if itemnum < maxnum then
									if looptime % 2 == 0 then
										char.setInt(i,"活力",char.getInt(i,"活力") - 1)
										char.setInt(i,"气势",char.getInt(i,"气势") + 1 * 100)
										saacproto.ACFixFMData(i,12,char.getInt(i,"气势"),"")
										other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {i,2,1})
										itemvigor = itemvigor + 1
									end
									if itemquick == 1 then
										itemnum = itemnum + 2
									else
										itemnum = itemnum + 1
									end
									if itemnum > maxnum then
										itemnum = maxnum
									end
									item.setChar(itemindex,"字段",itemnum .. "|" .. itemquick .. "|" .. itemvigor)
									local z,x = math.modf(itemnum / maxnum)
									item.setChar(itemindex,"显示名",item.getChar(itemindex,"名称") .. "[" .. math.floor(z * 100 + x * 100) .."%]")
									item.UpdataItemOne(i,itemindex)
									token = "U|" .. math.floor(x * 100) .. "|" .. char.getInt(i,"活力") .. "|" .. itemvigor
									--lssproto.sendNewMapBattleInfo(char.getFd(i),3,token)
								else
									char.setWorkChar(i,"MM道具","")
									char.WarpElderPosition(i)
								end
							end
							break
						end
					end
				end
				if zhaotype == 0 then
					char.setWorkChar(i,"MM道具","")
				end
			end
		end
	end
	
	print("\nmax charaindex=" .. playeronlinenum .. "\n")
	
	--if looptime % 10 == 0 then
	--	token = message[math.random(#message)]
	--	char.talkToServer(-1, token, "随机色")
	--end
	looptime = looptime + 1
end

function data()
	vigormax = {75,100,125,150,175,200}
	messageu8 = {
				 "公益2.5，游戏问题可联系Q群客服，请微信号进微信群！"
				 ,"玩家在线即可获得离线时间，使用系统菜单的离线功能可实现离线挂机，详情可以加家族群咨询客服！"
				 ,"游戏注册请在游戏界面手机注册，验证码每天限止收发10条，同一个验证码10分钟内同一账号可登陆不同角色"
				 ,"账号请勿转借，会有盗号转移宠物装备风险，不建议进行账号交易，原注册人有帐号申诉权利！详情可以加家族群咨询客服。"
				 ,"游戏内只能输入英文无法打字，操作流程：手机设置—系统—输入法—安全输入关闭即可，联系客服咨询交流群"
				 ,"RMB回收J币说明:每月最后两天为统计转账，玩家可在统计日前向管理员提交回收金额申请提交支付宝账号，月底陆续发放到账" 
			}
	messageu8appstore = {
				 "公益2.5，游戏问题可联系Q群客服，请微信号进微信群！"
				 ,"线下交易有风险，建议不要进行任何线下交易，游戏纠纷请私下自行解决 Q交流群"
				 ,"遇到问题可以联系我们的在线客服，我们客服小哥哥小姐姐热诚为各位玩家服务！家族群！"
				 ,"账号仅限本人使用，请勿转借，会有盗号或转移宠物装备的风险。不建议进行账号交易，原注册人（绑定QQ和手机）有申诉权利！"
				 ,"游戏注册请在游戏界面手机注册，验证码每天限止收发10条，同一个验证码10分钟内同一账号可登陆不同角色" 
				 ,"游戏内置各种便捷功能，方便玩家体验游戏使用，抓宠、打材料、练级应有尽有，快试试吧。"
				 ,"本服主页http：//www.51boshao.com可在线查看各种攻略任务资料，公益2.5群（火）！"
				 ,"玩家在线即可获得离线时间，使用系统菜单的离线功能可实现离线挂机，队友先离线，队长不能在战斗中离线！"
				 ,"公益2.5，游戏问题可联系Q群客服！微信号，请微信号进微信群！"
				 ,"RMB回收J币说明:每月最后两天为统计转账，玩家可在统计日前向管理员提交回收金额申请提交支付宝账号，月底陆续发放到账"
				 ,"RMB回收J币说明:每月最后两天为统计转账，玩家可在统计日前向管理员提交回收金额申请提交支付宝账号，月底陆续发放到账"
				 ,"如果您支持本游戏，请告诉身边的朋友，一起来玩。大家多多宣传，让我们的游戏更加热闹和繁荣吧！"
			}
	messageme = {
				 "公益2.5，游戏问题可联系Q群客服！微信号，请微信号进微信群！"
				 ,"本服的一切宠物、装备均在游戏中获得，丰富的市场、耐玩的设置、贴心的服务、长久开放、持续更新、无限乐趣尽在石器时代！"
				 ,"本服主页http：//www.51boshao.com可在线查看各种攻略任务资料，官方1群（火）新2群（火）！"
				 ,"希望大家能把石器时代当成您在网上的家，一起打游戏、追回逝去的记忆，少一点纷争多一点和睦，我们一起营造温馨快乐的石器时代！"
				 ,"通过联系Q群客服，微信客服，也能进入官方微信交流群和微信交易群"
				 ,"公益2.5，游戏问题可联系Q群客服！微信号，请微信号进微信群！" 
				 ,"账号仅限本人使用，请勿转借，会有盗号或转移宠物装备的风险。不建议进行账号交易，原注册人（绑定QQ和手机）有申诉权利！"
				 ,"本服没有拍卖群并禁止个人组织任何形式的拍卖群，如有发现私人拍卖群请联系游戏管理员"
				 ,"游戏内置各种便捷功能，方便玩家体验游戏使用，抓宠、打材料、练级应有尽有，快试试吧。"
				 ,"遇到问题可以联系我们的在线客服，我们客服小哥哥小姐姐热诚为各位玩家服务！家族群！"
				 ,"活动线为庄园战，副本任务线，家族都有各种副本，活动举行，点击--界面活动--就可查看到各种活动副本详情"
				 ,"RMB回收J币说明:每月最后两天为统计转账，玩家可在统计日前向管理员提交回收金额申请提交支付宝账号，月底陆续发放到账"
				 ,"游戏注册请在游戏界面手机注册，验证码每天限止收发10条，同一个验证码10分钟内同一账号可登陆不同角色"
				 ,"公益2.5，游戏问题可联系Q群客服！微信号，请微信号进微信群！"
				 ,"如果您支持本游戏，请告诉身边的朋友，一起来玩。大家多多宣传，让我们的游戏更加热闹和繁荣吧！"
			}
	messageu8cnt = 0
	messageu8appstorecnt = 0
	messagemecnt = 0
	NetLoopFunction()
end


function main()
	looptime = 0
	dwtime = other.time() + 3600 * math.random(2,4)
	data()
end

