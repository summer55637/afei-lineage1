function quithecheng(talkerindex)
	for i=0,23 do
		itemindex = char.getItemIndex(talkerindex,i)
		if item.check(itemindex) == 1 then
			for j=1,table.getn(noitemid) do
				if item.getInt(itemindex,"序号") == noitemid[j] then
					char.DelPileItemMess(talkerindex,i)
				end
			end
		end
	end
	return 0
end
function joinhecheng(talkerindex)
	if char.getWorkInt(talkerindex,"组队") ~= 0 then
		char.newMessageToCli(talkerindex,-1,"队伍中无法参赛","白色")
		return
	end
	for i=0,23 do
		itemindex = char.getItemIndex(talkerindex,i)
		if item.check(itemindex) == 1 then
			for j=1,table.getn(noitemid) do
				if item.getInt(itemindex,"序号") == noitemid[j] then
					char.newMessageToCli(talkerindex,-1,"身上带有参赛物品","白色")
					return
				end
			end
		end
	end
	if table.getn(hechengdata) > 0 then
		local zhao = 0
		for i=1,table.getn(hechengdata) do
			if char.getChar(talkerindex,"账号") == hechengdata[i][1] then
				zhao = i
				break
			end
		end
		if zhao == 0 then
			hechengdata[table.getn(hechengdata) + 1] = {char.getChar(talkerindex,"账号"),char.getChar(talkerindex,"名字"),0,other.time(),0}
		end
	else
		hechengdata[1] = {char.getChar(talkerindex,"账号"),char.getChar(talkerindex,"名字"),0,other.time(),0}
	end
	char.WarpToSpecificPoint(talkerindex,41012,143,134)
	if char.getInt(talkerindex,"等级") >= 80 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,614,0})
	end
end

function joinhecheng2(talkerindex)
	if char.getWorkInt(talkerindex,"组队") ~= 0 then
		char.newMessageToCli(talkerindex,-1,"队伍中无法参赛","白色")
		return
	end
	for i=0,4 do
		petindex = char.getCharPet(talkerindex,i)
		if char.check(petindex) == 1 then
			if char.getInt(petindex,"宠ID") == petid then
				char.newMessageToCli(talkerindex,-1,"身上带有参赛宠物","白色")
				return
			end
		end
	end
	if table.getn(zhuachongdata) > 0 then
		local zhao = 0
		for i=1,table.getn(zhuachongdata) do
			if char.getChar(talkerindex,"账号") == zhuachongdata[i][1] then
				zhao = i
				break
			end
		end
		if zhao == 0 then
			zhuachongdata[table.getn(zhuachongdata) + 1] = {char.getChar(talkerindex,"账号"),char.getChar(talkerindex,"名字"),0,other.time(),0}
		end
	else
		zhuachongdata[1] = {char.getChar(talkerindex,"账号"),char.getChar(talkerindex,"名字"),0,other.time(),0}
	end
	char.WarpToSpecificPoint(talkerindex,41011,3,12)
	if char.getInt(talkerindex,"等级") >= 80 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,615,0})
	end
end

function sortPointTimeDsc(a, b)
	if a[3] == b[3] then
		return a[4] < b[4]
	else
		return a[3] > b[3]
	end
end

function Loop(meindex)
	if ((tonumber(os.date("%w", os.time())) == 1 or tonumber(os.date("%w", os.time())) == 3 or tonumber(os.date("%w", os.time())) == 5 or tonumber(os.date("%w", os.time())) == 0) and tonumber(os.date("%H", os.time())) == 19) or other.time() <= gmstart1time then
		if start1 == 0 then
			hechengdata = {}
			start1 = 1
			char.talkToServer(-1, "合成比赛已经开始，请大家去娱乐互动线医院看看吧！", "黄色")
			char.talkToServer(-1, "合成比赛已经开始，请大家去娱乐互动线医院看看吧！", "黄色")
			char.talkToServer(-1, "合成比赛已经开始，请大家去娱乐互动线医院看看吧！", "黄色")
		end
	else
		if start1 == 1 then
			start1 = 0
			local maxplayer = char.getPlayerMaxNum() - 1
			for i=0,maxplayer do
				if char.check(i) == 1 then
					if char.getInt(i,"地图号") == char.getInt(meindex,"地图号") then
						char.WarpElderPosition(i)
					end
				end
			end
		end
	end
end

function Loop3(meindex)
	if ((tonumber(os.date("%w", os.time())) == 2 or tonumber(os.date("%w", os.time())) == 4 or tonumber(os.date("%w", os.time())) == 6 or tonumber(os.date("%w", os.time())) == 0) and tonumber(os.date("%H", os.time())) == 19) or other.time() <= gmstart2time then
		if start2 == 0 then
			zhuachongdata = {}
			start2 = 1
			char.talkToServer(-1, "抓宠比赛已经开始，大家去娱乐互动线医院看看吧！", "黄色")
			char.talkToServer(-1, "抓宠比赛已经开始，大家去娱乐互动线医院看看吧！", "黄色")
			char.talkToServer(-1, "抓宠比赛已经开始，大家去娱乐互动线医院看看吧！", "黄色")
		end
	else
		if start2 == 1 then
			start2 = 0
			local maxplayer = char.getPlayerMaxNum() - 1
			for i=0,maxplayer do
				if char.check(i) == 1 then
					if char.getInt(i,"地图号") == char.getInt(meindex,"地图号") then
						char.WarpElderPosition(i)
					end
				end
			end
		end
	end
end
--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if start1 == 1 then
			token = char.getChar(meindex, "名字") .. "|参赛选手请将打到的素材\n合成为合成枪10\n交给我\n即可获得积分|2|提交道具|查看排名"
			lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
		end
	end
end

function Talked2(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		token = char.getChar(meindex, "名字") .. "|选择您要服务|2|合成比赛|抓宠比赛"
		lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end

function Talked3(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if start2 == 1 then
			token = char.getChar(meindex, "名字") .. "|参赛选手请捕捉\n多利诺布斯\n交给我\n即可获得比赛积分|2|提交宠物|查看排名"
			lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
		end
	end
end


--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if start1 == 0 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num == 1 then
				lssproto.windows(talkerindex, 1025, 8, 1, char.getWorkInt( meindex, "对象"), "1")
			elseif num == 2 then
				--查看排名
				playernum = math.min(table.getn(hechengdata),10)
				token = "L|" .. playernum
				for i=1,playernum do
					token = token .. "|" .. hechengdata[i][2] .. "|" .. hechengdata[i][3]
				end
				lssproto.windows(talkerindex, 1027, 8, 0, -1, token)
			end
		elseif seqno == 1 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 9 or num > 23 then
				return
			end
			itemindex = char.getItemIndex(talkerindex,num)
			if item.check(itemindex) == 1 then
				if item.getInt(itemindex,"序号") == itemid then
					char.DelItem(talkerindex,num)
					char.newMessageToCli(talkerindex,-1,"提交道具成功","白色")
					for i=1,table.getn(hechengdata) do
						if char.getChar(talkerindex,"账号") == hechengdata[i][1] then
							hechengdata[i][3] = hechengdata[i][3] + 1
							hechengdata[i][4] = other.time()
							char.newMessageToCli(talkerindex,-1,"当前得分" .. hechengdata[i][3],"白色")
							table.sort(hechengdata, sortPointTimeDsc)
							break
						end
					end
				end
			end
		end
	end
end

function WindowTalked2 ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		if seqno == 0 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num == 1 then
				if start1 == 1 then
					token = char.getChar(meindex, "名字") .. "|选择您要服务|2|参加比赛|查看排名"
					lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
				else
					token = char.getChar(meindex, "名字") .. "|选择您要服务|2|领取奖励|查看排名"
					lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
				end
			elseif num == 2 then
				if start2 == 1 then
					token = char.getChar(meindex, "名字") .. "|选择您要服务|2|参加比赛|查看排名"
					lssproto.windows(talkerindex, "新选择框", 8, 2, char.getWorkInt( meindex, "对象"), token)
				else
					token = char.getChar(meindex, "名字") .. "|选择您要服务|2|领取奖励|查看排名"
					lssproto.windows(talkerindex, "新选择框", 8, 2, char.getWorkInt( meindex, "对象"), token)
				end 
			end
		elseif seqno == 1 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num == 1 then
				if start1 == 1 then
					joinhecheng(talkerindex)
				else
					local zhao = 0
					for i=1,table.getn(hechengdata) do
						if char.getChar(talkerindex,"账号") == hechengdata[i][1] then
							zhao = i
							break
						end
					end
					if zhao == 0 then
						char.newMessageToCli(talkerindex,-1,"你没有参加比赛","白色")
						return
					end
					if hechengdata[zhao][5] == 1 then
						char.newMessageToCli(talkerindex,-1,"您已经领取过奖励了","白色")
						return
					end
					if zhao <= 3 then
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + zhandiandata[zhao] * hechengdata[zhao][3]*100)
						hechengdata[zhao][5] = 1
						char.newMessageToCli(talkerindex,-1,"领取" .. zhandiandata[zhao] * hechengdata[zhao][3] .. "声望成功","白色")
						char.sendStatusString(talkerindex,"P")
					else
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + zhandiandata[4] * hechengdata[zhao][3]*100)
						hechengdata[zhao][5] = 1
						char.newMessageToCli(talkerindex,-1,"领取" .. zhandiandata[4] * hechengdata[zhao][3] .. "声望成功","白色")
						char.sendStatusString(talkerindex,"P")
					end
				end
			elseif num == 2 then
				playernum = math.min(table.getn(hechengdata),10)
				token = "L|" .. playernum
				for i=1,playernum do
					token = token .. "|" .. hechengdata[i][2] .. "|" .. hechengdata[i][3]
				end
				lssproto.windows(talkerindex, 1027, 8, 0, -1, token)
			end
		elseif seqno == 2 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num == 1 then
				if start2 == 1 then
					joinhecheng2(talkerindex)
				else
					local zhao = 0
					for i=1,table.getn(zhuachongdata) do
						if char.getChar(talkerindex,"账号") == zhuachongdata[i][1] then
							zhao = i
							break
						end
					end
					if zhao == 0 then
						char.newMessageToCli(talkerindex,-1,"你没有参加比赛","白色")
						return
					end
					if zhuachongdata[zhao][5] == 1 then
						char.newMessageToCli(talkerindex,-1,"您已经领取过奖励了","白色")
						return
					end
					if zhao <= 3 then
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + zhandiandata2[zhao] * zhuachongdata[zhao][3]*100)
						zhuachongdata[zhao][5] = 1
						char.newMessageToCli(talkerindex,-1,"领取" .. zhandiandata2[zhao] * zhuachongdata[zhao][3] .. "声望成功","白色")
						char.sendStatusString(talkerindex,"P")
					else
						char.setInt(talkerindex,"声望",char.getInt(talkerindex,"声望") + zhandiandata2[4] * zhuachongdata[zhao][3]*100)
						zhuachongdata[zhao][5] = 1
						char.newMessageToCli(talkerindex,-1,"领取" .. zhandiandata2[4] * zhuachongdata[zhao][3] .. "声望成功","白色")
						char.sendStatusString(talkerindex,"P")
					end
				end
			elseif num == 2 then
				playernum = math.min(table.getn(zhuachongdata),10)
				token = "L|" .. playernum
				for i=1,playernum do
					token = token .. "|" .. zhuachongdata[i][2] .. "|" .. zhuachongdata[i][3]
				end
				lssproto.windows(talkerindex, 1027, 8, 0, -1, token)
			end
		end
	end
end

function WindowTalked3 ( meindex, talkerindex, seqno, select, data)
	if select == 2 or select == 8 then
		return
	end
	if start2 == 0 then
		return
	end
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		if seqno == 0 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num == 1 then
				lssproto.windows(talkerindex, "宠物框", 8, 1, char.getWorkInt( meindex, "对象"), "")
			elseif num == 2 then
				--查看排名
				playernum = math.min(table.getn(zhuachongdata),10)
				token = "L|" .. playernum
				for i=1,playernum do
					token = token .. "|" .. zhuachongdata[i][2] .. "|" .. zhuachongdata[i][3]
				end
				lssproto.windows(talkerindex, 1027, 8, 0, -1, token)
			end
		elseif seqno == 1 then
			if data == "" then
				return
			end
			num = other.atoi(data)
			if num < 1 or num > 5 then
				return
			end
			petindex = char.getCharPet(talkerindex,num - 1)
			if char.check(petindex) == 1 then
				if char.getInt(petindex,"宠ID") == petid then
					char.DelPet(talkerindex,petindex)
					char.newMessageToCli(talkerindex,-1,"提交宠物成功","白色")
					for i=1,table.getn(zhuachongdata) do
						if char.getChar(talkerindex,"账号") == zhuachongdata[i][1] then
							zhuachongdata[i][3] = zhuachongdata[i][3] + 1
							zhuachongdata[i][4] = other.time()
							char.newMessageToCli(talkerindex,-1,"当前得分" .. zhuachongdata[i][3],"白色")
							table.sort(zhuachongdata, sortPointTimeDsc)
							break
						end
					end
				end
			end
		end
	end
end

function bisai(charaindex, data)
	if data == "" then
		return
	end
	if other.atoi(data) == 1 then
		gmstart1time = other.time() + 3600
		char.newMessageToCli(charaindex,-1,"开启合成比赛","白色")
	elseif other.atoi(data) == 2 then
		gmstart2time = other.time() + 3600
		char.newMessageToCli(charaindex,-1,"开启抓宠比赛","白色")
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
	char.setFunctionPointer(npcindex, "循环事件", "Loop", "")
	char.setInt(npcindex, "循环事件时间", 60000)
end

function Create2(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex2 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex2, "对话事件", "Talked2", "")
	char.setFunctionPointer(npcindex2, "窗口事件", "WindowTalked2", "")
end

function Create3(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex3 = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex3, "对话事件", "Talked3", "")
	char.setFunctionPointer(npcindex3, "窗口事件", "WindowTalked3", "")
	char.setFunctionPointer(npcindex3, "循环事件", "Loop3", "")
	char.setInt(npcindex3, "循环事件时间", 60000)
end

function data()
	noitemid = {11839,11819,4470,4200,4201,4202,4203,4204,4205,4206,4207,4208,4209,4210,4211,4212,4213,4214,4215,4216,4217,4218,4219,4220,4221,4222,4223,4224,4225,4226,4227,
	              4228,4229,4230,4231,4232,4233,4234,4235,4236,4237,4238,4239,4240,4241,4242,4243,4244,4245,4246,4247,4248,4249,4250,4251,4252,4253,4254,4255,4256,4257,4258,
				  4259,4260,4261,4262,4263,4264,4265,4266,4267,4268,4269,4270,4271,4272,4273,4274,4275,4276,4277,4278,4279,4280,4281,4282,4283,4284,4285,4286,4287,4288,4289,
				  4290,4291,4292,4293,4294,4295,4296,4297,4298,4299,4300,4301,4302,4303,4304,4305,4306,4307,4308,4309,4310,4311,4312,4313,4314,4315,4316,4317,4318,4319,4320,
				  4321,4322,4323,4324,4325,4326,4327,4328,4329,4330,4331,4332,4333,4334,4335,4336,4337,4338,4339,4340,4341,4342,4343,4344,4345,4346,4347,4348,4349,4350,4351,
				  4352,4353,4354,4355,4356,4357,4358,4359,4360,4361,4362,4363,4364,4365,4366,4367,4368,4369,4370,4371,4372,4373,4374,4375,4376,4377,4378,4379,4380,4381,4382,
				  4383,4384,4385,4386,4387,4388,4389,4390,4391,4392,4393,4394,4395,4396,4397,4398,4399,4400,4401,4402,4403,4404,4405,4406,4407,4408,4409,4410,4411,4412,4413,
				  4414,4415,4416,4417,4418,4419,4420,4421,4422,4423,4424,4425,4426,4427,4428,4429,4430,4431,4432,4433,4434,4435,4436,4437,4438,4439,4440,4441,4442,4443,4444,
				  4445,4446,4447,4448,4449,4450,4451,4452,4453,4454,4455,4456,4457,4458,4459,4460,4461,4462,4463,4464,4465,4466,4467,4468,4469,11897,11898,11899,270,
				  11800,11801,11802,11803,11804,11805,11806,11807,11808,11809,11810,11811,11812,11813,11814,11815,11816,11817,11818,11819,11830,11831,11832,
				  11833,11834,11835,11836,11837,11838,11839,11890,11891,11892,11893,11894,11895,11896,12030,12031,12032,12033,12034,12035,12036,12037,12038,12039,3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012,3013,3014,3015,3016,
				  3017,3018,3019,3020,3021,3022,3023,3024,3025,3026,3027,3028,3029,3030,3031,3032,3033,3034,3035,3036,3037,3038,3039,3040,3041,3042,3043,3044,3045,3046,3047,3048,3049,3050,3051,3052,3053,3054,3055,3056,3057,3058,3059,3060,3061,3062,
				  3063,3064,3065,3066,3067,3068,3069,3070,3071,3072,3073,3074,3075,3076,3077,3078,3079,3080,3081,3082,3083,3084,3085,3086,3087,3088,3089,3090,3091,3092,3093,3094,3095,3096,3097,3098,3099,3100,3101,3102,3103,3104,3105,3106,3107,3108,
				  3109,3110,3111,3112,3113,3114,3115,3116,3117,3118,3119,3120,3121,3122,3123,3124,3125,3126,3127,3128,3129,3130,3131,3132,3133,3134,3135,3136,3137,3138,3139,3140,3141,3142,3143,3144,3145,3146,3147,3148,3149,3150,3151,3152,3153,3154,
				  3155,3156,3157,3158,3159,3160,3161,3162,3163,3164,3165,3166,3167,3168,3169,3170,3171,3172,3173,3174,3175,3176,3177,3178,3179,3180,3181,3182,3183,3184,3185,3186,3187,3188,3189,3190,3191,3192,3193,3194,3195,3196,3197,3198,3199,3200,
			      3201,3202,3203,3204,3205,3206,3207,3208,3209,3210,3211,3212,3213,3214,3215,3216,3217,3218,3219,3220,3221,3222,3223,3224,3225,3226,3227,3228,3229,3230,3231,3232,3233,3234,3235,3236,3237,3238,3239,3240,3241,3242,3243,3244,3245,3246,
				  3247,3248,3249,3250,3251,3252,3253,3254,3255,3256,3257,3258,3259,3260,3261,3262,3263,3264,3265,3266,3267,3268,3269,3270,3271,3272,3273,3274,3275,3276,3277,3278,1512,220,2465,2470
				}
	itemid = 4470
	zhandiandata = {5,4,3,2}
	petid = 211
	zhandiandata2 = {4,3,2,1}
end

function main()
	data()
	if config.getGameservername() == "娱乐互动线" then
		Create("活动管理员", 26917, 41012, 138, 130, 4)
		Create2("活动管理员", 60181, 2005, 18, 8, 6)
		Create3("活动管理员", 26917, 41011, 7, 4, 4)
	end
	hechengdata = {}
	zhuachongdata = {}
	start1 = 0
	start2 = 0
	gmstart1time = 0
	gmstart2time = 0
	magic.addLUAListFunction("bisai", "bisai", "", 3, "测试专用命令")
end
