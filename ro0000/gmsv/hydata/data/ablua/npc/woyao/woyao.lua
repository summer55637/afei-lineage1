function ShowList(talkerindex,listindex)
	if listindex < 1 or listindex > #listdata then
		return 0
	end
	token = "L|" .. listindex .. "|" .. #listdata[listindex]
	for i=1,#listdata[listindex] do
		token = token .. "|" .. listdata[listindex][i][1] .. "|" .. listdata[listindex][i][2] .. "|" .. i .. "|" .. listdata[listindex][i][3] .. "|"
		if listdata[listindex][i][3] == 2 then
			token = token .. listdata[listindex][i][4]
		end
	end
	lssproto.windows(talkerindex, 1032, 8, 0, char.getWorkInt( npcindex, "对象"), token)
	return 0
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data == "" then
		return
	end
	local type = other.getString(data,"|",1)
	if type == "H" then
		local listindex = other.getString(data,"|",2)
		if listindex == "" then
			return
		end
		listindex = other.atoi(listindex)
		if listindex < 1 or listindex > #listdata then
			return
		end
		token = "L|" .. listindex .. "|" .. #listdata[listindex]
		for i=1,#listdata[listindex] do
			token = token .. "|" .. listdata[listindex][i][1] .. "|" .. listdata[listindex][i][2] .. "|" .. i .. "|" .. listdata[listindex][i][3] .. "|"
			if listdata[listindex][i][3] == 2 then
				token = token .. listdata[listindex][i][4]
			end
		end
		lssproto.windowsupdate(talkerindex, 1032, 8, 0, char.getWorkInt( meindex, "对象"), token)
	elseif type == "G" then
		local listindex = other.getString(data,"|",2)
		if listindex == "" then
			return
		end
		listindex = other.atoi(listindex)
		if listindex < 1 or listindex > #listdata then
			return
		end
		local dataindex = other.getString(data,"|",3)
		if dataindex == "" then
			return
		end
		dataindex = other.atoi(dataindex)
		if dataindex < 1 or dataindex > #listdata[listindex] then
			return
		end
		if listdata[listindex][dataindex][3] ~= 1 then
			return
		end
		token = "I|" .. dataindex .. "|" .. listdata[listindex][dataindex][4]
		lssproto.windowsupdate(talkerindex, 1032, 8, 0, char.getWorkInt( meindex, "对象"), token)
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)

	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end


function data()
	listdata = 
			{
				{--我要声望
				   {"每日跑环","玩家可前往进行每日跑环（每转110级以上可以参加，0转除外）",2,1001},
				   {"阎罗十殿","玩家可前往挑战阎罗（建议1转120以上，组队挑战）",2,1002},
				   {"乱舞PK","玩家可在每周五晚上8点前往参加（推荐等级每转130以上，0转除外",2,1003},
				 --  {"极品人转生","完成极品人要求的1.82任务转生时额外声望奖励",1,"[style c=5]完成极品人要求的1.82任务转生时额外声望奖励[/style]\n[style c=5]转生时等级大于120级 额外奖励200声望[/style]\n[style c=5]转生时等级大于130级 额外奖励300声望[/style]\n[style c=5]转生时等级大于135级 额外奖励400声望[/style]\n[style c=5]转生时等级大于140级 额外奖励500声望[/style]"},
				   {"练宠","携带宠物练级每个等级阶段都能获得声望奖励",1,"[style c=5]121 1点、122 1.5点、123 2点、124 2.5点、125 3点[/style]\n[style c=5]126 3.5点、127 4点、128 4.5点、129 5点、130 5.5点[/style]\n[style c=5]131 8点、132 10点、133 12点、134 14点、135 16点[/style]\n[style c=5]136 18点、137 20点、138 22点、139 28点、140 53点[/style]"},
				   {"日常","玩家可前往活动-日常，完成相关任务，获得大量声望",1,"[style c=5]玩家可前往活动-日常，完成相关任务，获得大量声望[/style]"},
                   {"每日签到","玩家可通过福利-每日签到领取声望",1,"[style c=5]玩家可通过福利-每日签到领取声望[/style]"},
				   {"合成比赛","玩家可在每周1、3、5、7晚上7点参与合成比赛，声望奖励等你拿",2,1007},
				   {"抓宠比赛","玩家可在每周2、4、6、7晚上7点参与抓宠比赛，声望奖励等你拿",2,1007}
				},-- {"","",,},
				{--我要活力
				   {"每日答题","玩家前往活动-日常或特色-参加每日答题，丰富奖励等着你",1,"[style c=5]玩家前往活动-日常或特色-参加每日答题[/style]\n[style c=5]丰富奖励等着你[/style]"},
				   {"小猪赛跑","玩家前往活动-特色-参加小猪赛跑有奖竞猜",1,"[style c=5]0转为8个小时一次[/style]\n[style c=5]1转为7个小时一次[/style]\n[style c=5]2转为6个小时一次[/style]\n[style c=5]3转为5个小时一次[/style]\n[style c=5]4转为4个小时一次[/style]\n[style c=5]5转为3个小时一次[/style]\n[style c=5]Ps:猜中第一名奖励20活力[/style]"},
				   {"装备兑换","玩家可通过阎罗挑战和派派送活动中获得的装备换取活力",1,"[style c=5]12-17级的装备可在挑战阎王NPC出兑换活力[/style]\n[style c=5]12级可兑换5点活力[/style]\n[style c=5]13级可兑换10点活力[/style]\n[style c=5]14级可兑换15点活力[/style]\n[style c=5]15级可兑换20点活力[/style]\n[style c=5]16级可兑换25点活力[/style]\n[style c=5]17级可兑换30点活力[/style]"},
				   {"在线活力","玩家每日在线可获得活力，转生越高获取的活力越高",1,"[style c=5]玩家每日在线可获得活力，转生越高获取的活力越高[/style]\n[style c=5]0转每日在线最高获得75活力[/style]\n[style c=5]1转每日在线最高获得100活力[/style]\n[style c=5]2转每日在线最高获得125活力[/style]\n[style c=5]3转每日在线最高获得150活力[/style]\n[style c=5]4转每日在线最高获得175活力[/style]\n[style c=5]5转每日在线最高获得200活力[/style]"},
				   {"每日签到","玩家可通过福利-每日签到领取活力",1,"[style c=5]玩家可通过福利-每日签到领取活力[/style]"}
				},
				{--我要经验
				   {"我要练级","玩家可通过便捷-贴心传送，传送至指定点挂机练级",1,"[style c=5]玩家可通过便捷-贴心传送[/style]\n[style c=5]传送至指定点挂机练级[/style]"},
				   {"领取福利","玩家可通过福利中领取经验果实",1,"[style c=5]1.首冲奖励[/style]\n[style c=5]2.每日福利[/style]\n[style c=5]3.等级达成[/style]\n[style c=5]4.每日签到[/style]"},
				   {"商城购买","玩家可通过商城购买经验果实",1,"[style c=5]玩家可通过商城购买经验果实[/style]"},
				   {"阎罗十殿","玩家可前往挑战阎罗（建议1转120以上，组队挑战）",2,1002},
				   {"兑换经验丹","玩家可前往渔村医院，与经验丹兑换师兑换LV1经验丹）",2,1009},
				   {"拜师系统","玩家可通过拜师系统拜师或收徒，徒弟出师，师傅可获得称号及奖励",1,"[style c=5]亲传2人 称号 良师益友 五倍经验3小时*3[/style]\n[style c=5]亲传6人 称号 诲人不倦 五倍经验3小时*3 500水晶*3[/style]\n[style c=5]亲传12人 称号 春风化雨 1000水晶*3 宠物碎片*2[/style]\n[style c=5]亲传20人 称号 匠心树人 2000水晶*3 宠物碎片*2[/style]\n[style c=5]亲传30人 称号 桃李满门 象卷*3 宠物碎片*3[/style]\n[style c=5]亲传50人 称号 先圣先师 宠物攻击特效*1[/style]"}
				},
				{--我要宠物
				   {"我要抓宠","玩家可通过便捷-贴心传送，传送至指定地点抓捕",1,"[style c=5]玩家可通过便捷-贴心传送[/style]\n[style c=5]传送至指定地点抓捕[/style]"},
				   {"兑换宠物","玩家可前往渔村医院，与宠物饲养大师兑换稀有宠物",2,1010}
				},
				{--我要素材
				   {"商店素材","玩家可在四大村庄24店购买商店素材",1,"[style c=5]                      商店素材[/style]\n[style c=5]1.合成材料可在萨村.卡村24店.卡坦村道具店购买[/style]\n[style c=5]2.料理材料可在渔村.加村24店购买[/style]"},
                   {"野外素材1","玩家可前往指定地点挂野外素材",1,"[style c=5]1.骨9:携带狩猎证在霍村-卡村之间打80呼拔拔[/style]\n[style c=5]2.骨10:携带狩猎证在吉鲁岛458.523打100拉奇鲁哥[/style]\n[style c=5]3.爪9:携带狩猎证在沙姆岛打80克克洛斯[/style]\n[style c=5]4.爪10:携带狩猎证在阿斯玛鲁矿山6楼打100奥卡洛斯[/style]\n[style c=5]5.牙9:携带狩猎证在玄黄洞前打80凯比特[/style]\n[style c=5]6.牙10:携带狩猎证在北吉鲁打100大象[/style]\n[style c=5]7.皮9:携带狩猎证在卡坦村门口打80达克尔[/style]\n[style c=5]8.皮10:携带狩猎证在五兄弟5楼打100野猪[/style]\n[style c=5]9.土9:携带采矿证在没落矿坑4楼打80超级特矿石[/style]\n[style c=5]10.土10:携带采矿证在无名洞窟3楼打100超级特矿石[/style]"},
				   {"野外素材2","玩家可前往指定地点挂野外素材",1,"[style c=5]1.石10:携带采矿证在无名洞窟3楼打100超级特矿石[/style]\n[style c=5]2.水晶9:携带采矿证在梦幻洞窟（晚）打80冒险者[/style]\n[style c=5]3.水晶10:携带采矿证在福村-库伊爷家间打100冒险者[/style]\n[style c=5]4.鳞9:携带采集证在碧青沙滩73.697打80克邦凯斯[/style]\n[style c=5]5.鳞10:携带采集证在北吉鲁地下通道3楼打100卡拉宝斯[/style]\n[style c=5]6.贝9:携带采集证在奇努伊海底通路打80加格[/style]\n[style c=5]7.贝10:携带采集证在福村海底通路打100鲨鱼[/style]\n[style c=5]8.壳9:携带采集证在柯奥山4楼打80石龟[/style]\n[style c=5]9.壳10:携带采集证在巴拿姆洞窟3楼打100石龟[/style]"},
				   {"野外素材3","玩家可前往指定地点挂野外素材",1,"[style c=5]1.叶9:携带园艺证在奇喀喀村外打80卡克尔[/style]\n[style c=5]2.叶10:携带园艺证在北吉鲁打100木[/style]\n[style c=5]3.木9:携带园艺证在加加门口打80木[/style]\n[style c=5]4.木10:携带园艺证在北吉鲁打100木[/style]\n[style c=5]5.花9:携带园艺证在奇喀喀村外打80巴克[/style]\n[style c=5]6.花10:携带园艺证在西吉鲁打100冒险者[/style]"},
				   {"高级素材","玩家可前往贴心传送，传送至指定地点挂高级素材",1,"[style c=5]                      高级素材[/style]\n[style c=5]玩家可使用贴心传送，传送至素材区挂素材[/style]\n[style c=5]需携带采矿证、园艺证、狩猎证、采集证其中1种[/style]"},
				   {"精灵草","玩家可以前往各大村庄购买1-8级精灵草",1,"[style c=5]                      精灵草[/style]\n[style c=5]塔姆塔姆村道具店：酒醉、睡眠草等级1-8[/style]\n[style c=5]柯奥村道具店：醉酒、睡眠草等级1-8[/style]\n[style c=5]霍特尔村道具店：石化、毒草等级1-8[/style]\n[style c=5]卡坦村道具店：花系列等级1-8[/style]\n[style c=5]卡坦迷幻洞NPC购买：混乱草等级1-8[/style]"}
				},
				{--我要石币
				   {"娱乐捕鱼","玩家可参加娱乐捕鱼（推荐等级10级以上），获得大量石币，推荐",2,1004},
				   {"阎罗十殿","玩家可前往挑战阎罗（建议1转120以上，组队挑战）",2,1002},
				  -- {"贩卖野生宠物","玩家可以通过捕捉各种野生宠，练至140贩卖给宠物店NPC。",1,"[style c=5]玩家可以通过贴心传送至野外不抓区域,[/style]\n[style c=5]抓捕野生宠物(稀有宠除外)[/style]\n[style c=5]练至140级，可贩卖给宠物商人换取石币。"},
				   {"贩卖龟壳","玩家通过贩卖龟壳来获取石币",1,"[style c=5]点击传送-抓宠-乌龟系，建议携带100级的野生雷龙[/style]\n[style c=5]第一个技能学习忠犬，可在萨姆吉尔村的24小时店出售[/style]\n[style c=5]获得可观的石币[/style]"},
				   {"商城购买","玩家可通过金币商城购买石币",1,"[style c=5]玩家可通过金币商城购买石币[/style]"},
				   {"领取福利","玩家可通过福利中领取石币",1,"[style c=5]1.首冲奖励[/style]\n[style c=5]2.等级达成[/style]\n[style c=5]3.每日签到[/style]"}
				},
				{--我要战点
				   {"族战","家族与家族之间的实力竞赛，战胜对方不仅可获得大量战点，庄园及蓝红暴龙骑乘资格奖励",1,"[style c=5]由族长下战书，争夺庄园模式分为3种:5v5 2v2 1v1[/style]\n[style c=5]萨村、渔村庄园均为5v5庄园，每方限定人数50[/style]\n[style c=5]加庄为2v2庄园,每方限定人数为50,族战场内只允许2人组队[/style]\n[style c=5]卡庄为1v1庄园,每方限定人数为50,族战场内不允许组队[/style]\n[style c=5]每次战斗胜利都会获得战点奖励。[/style]\n[style c=5]占有庄园的族长和成员均获得特殊骑宠-红蓝暴骑宠资格[/style]"},
				   {"每日签到","玩家可通过福利-每日签到领取福利",1,"[style c=5]玩家可通过福利-每日签到领取福利[/style]"}
				},
				{--我要装备
				    {"商城装备","玩家前往金币商城购买时效和永久的免气免修装备，可供玩家高效练级，PK不可使用",1,"[style c=5]玩家前往金币商城购买时效和永久的免气免修装备[/style]\n[style c=5]可供玩家高效练级，PK不可使用[/style]"},
					{"欢乐派派送","玩家通过活动页面参与抽奖活动",1,"[style c=5]玩家使用象券或1500金币可进行抽奖，奖品丰富[/style]\n[style c=5]每次抽奖都会赠送1点幸运值[/style]\n[style c=5]达到350幸运值赠送1颗宝石，宝石可兑换稀有皮肤[/style]"},
					{"商店装备","商店中有各种初级装备可供玩家练级，石币即可购买（强力建议出生赠送的新手装备）",1,"[style c=5]玩家可在四大村庄的武器店购买初级装备[/style]\n[style c=5]饰品可在福尔特村，柯奥村，霍特尔村，卡坦村购买[/style]"},
				    {"阎罗十殿","玩家可前往挑战阎罗（建议1转120以上，组队挑战）",2,1002},
					{"百人道场","玩家可以通过任务脚本前往百人道场顶楼（100级开启）",1,"[style c=5]1.玩家可通过脚本前往百人100层[/style]\n[style c=5]2.道场的商人NPC购买8级带精灵技能的帽子.铠.服.兜[/style]\n[style c=5]3.道场技屋NPC购买宠物技能双重突击[/style]"},
					{"龙域副本","玩家可在特定时间前往娱乐互动线渔村医院与龙域接引人对话参加活动",2,1006},
				    {"等级礼包","玩家可通过福利-等级礼包领取奖励",1,"[style c=5]玩家可通过福利-等级礼包领取奖励[/style]"}
				},
				{--我要水晶
				     {"每日签到","玩家前往福利-每日签到可获取水晶",1,"[style c=5]每日累积签到7、14、21、28天数，有水晶赠送[/style]"},
					 {"乱舞PK","玩家可在每周五晚上8点前往参加（推荐等级每转130以上，0转不可参加）",2,1003},
					 {"拜师系统","玩家可通过拜师系统拜师或收徒，徒弟出师，师傅可获得称号及奖励",1,"[style c=5]亲传2人 称号 良师益友 五倍经验3小时*3[/style]\n[style c=5]亲传6人 称号 诲人不倦 五倍经验3小时*3 500水晶*3[/style]\n[style c=5]亲传12人 称号 春风化雨 1000水晶*3 宠物碎片*2[/style]\n[style c=5]亲传20人 称号 匠心树人 2000水晶*3 宠物碎片*2[/style]\n[style c=5]亲传30人 称号 桃李满门 象卷*3 宠物碎片*3[/style]\n[style c=5]亲传50人 称号 先圣先师 宠物攻击特效*1[/style]"},
					 {"首冲奖励","玩家购买首冲奖励会赠送水晶",1,"[style c=5]玩家购买首冲奖励会赠送水晶[/style]"}
				},
				{--我要金币		
                     {"充值购买","玩家可在充值页面购买金币",1,"[style c=5]玩家可在充值页面购买金币[/style]"},
					 {"激情捕鱼","每周3,6晚上7点开放，7点30分结束，前三名可获得大量金币奖励",2,1004},
					 {"摆摊","玩家可在4大村庄内摆摊，贩卖装备、宠物、材料及道具都可获取金币，需收取一点手续费",1,"[style c=5]玩家可在4大村庄内摆摊，贩卖装备、宠物[/style]\n[style c=5]材料及道具都可获取金币，需收取一点手续费[/style]"}
				}
			}
end

function main()
	data()
	Create("我要奖励", 16130, 777, 16, 13, 6)
end