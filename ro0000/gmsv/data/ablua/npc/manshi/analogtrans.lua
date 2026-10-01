function getIntPart(x)
    if x <= 0 then
       return math.ceil(x);
    end

    if math.ceil(x) == x then
       x = math.ceil(x);
    else
       x = math.ceil(x) - 1;
    end
    return x;
end

function PetTransManGetAns( total1, total2, LV, rank)
	ans=0
	TransLV = 100;
	total = 0.00;
	Fx=1;

	if LV > 130 then
		LV = 130
	end
	total = total1 / 100
	total = total*total*total*total*total; 
	if total < 1 then
		total = 0
	else 
		total= total*1.3 
	end

	Fx = math.ceil(((5-rank)*1.2)) - 1 +5 -- rank=0~6 所以 Fx最大=11(rank=0)最小=4(rank=6)
	ans = math.ceil(math.ceil(total)-1 + total2 + ((LV-TransLV)/Fx)) - 1 --42+150+30/11=194

	if ans > 150 then
		ans = 150
	end

	return ans;
end

function GetPetAnalog( vital, str, tgh, dex )
  sum = vital + str + tgh + dex
  
  local ranktbl = {{ 130, 2.5}
			    	,{ 100, 2.0}
			    	,{ 95, 1.5}
			    	,{ 90, 1.0}
			    	,{ 85, 0.5}
			    	,{ 0, 0.0}
    				}

  for i = 1, #ranktbl do
  	if sum > ranktbl[i][1] then
  		petrank = i
  		break
  	end
  end
  
	if petrank > 5 then
		petrank = 5
	end

  local RankRandTbl = {
		{ 450, 500 },
		{ 470, 520 },
		{ 490, 540 },
		{ 510, 560 },
		{ 530, 580 },
		{ 550, 600 },
	}

	local hp = 0
	local atk = 0
	local def = 0
	local quick = 0
	for i=1, 140 do
		ability = {0, 0, 0, 0}
		for i=1, 10 do
			rnd = math.random(4)
			ability[rnd] = ability[rnd] + 1
		end
		
		ivital = vital
		istr = str
		itgh = tgh
		idex = dex

		ivital = (ivital * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[1] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100
		istr = (istr * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[2] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100
		itgh = (itgh * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[3] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100
		idex = (idex * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2]) + ability[4] * math.random(RankRandTbl[petrank][1], RankRandTbl[petrank][2])) / 100

	  ihp = (ivital * 4 + istr + itgh + idex) * 0.01
	  iatk = (istr * 0.01 + itgh * 0.001 + ivital * 0.001 + idex * 0.0005)
	  idef = (itgh* 0.01 + istr * 0.001 + ivital * 0.001 + idex * 0.0005)
	  iquick = idex * 0.01
	  
	  hp = hp + ihp
	  atk = atk + iatk
	  def = def + idef
	  quick = quick + iquick
	end
	
	hp = hp / 140
	atk = atk / 140
	def = def / 140
	quick = quick / 140
	
	return hp, atk, def, quick
end


--NPC对话事件(NPC索引)
function Talked(meindex, talkerindex, szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then 
		token = "                『" .. char.getChar(meindex, "名字") .. "』\n\n我一眼就能看穿宠物的资质哦，来请教我吧！\n①此功能每次使用收费20声望。\n②预测转生需要身上携带满级玛蕾菲雅。\n③如果携带多只ＭＭ预测计算前面一只。\n\n  ★ 同意的话就继续吧 ★ 预测仅为参考 ★"
		lssproto.windows(talkerindex, "对话框", "确定|取消", 1, char.getWorkInt( meindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if select == 2 then
		return
	end
	if seqno == 1 then
		if seqno == 1 then
			token = "3                  『" .. char.getChar(meindex, "名字") .. "』\n\n    那么我们就开始吧，祝你好运：\n\n"
						--.."                〖预计转后能力值〗\n" 
						.."                〖转后成长值参考〗\n" 
						.."                〖查看MM喂石状态〗\n" 
			lssproto.windows(talkerindex, "选择框", "取消", 2, char.getWorkInt( meindex, "对象"), token)
		end
	elseif seqno == 2 then
		num = other.atoi(data)
		lssproto.windows(talkerindex, "宠物框", "取消", seqno + num, char.getWorkInt( meindex, "对象"), "")
	elseif seqno == 3 or seqno == 4 then
		if npc.Free(-1, talkerindex, "FAME<2000") == 1 then
			char.TalkToCli(talkerindex, meindex, "[错误提示]您的声望不足20点，无法为您预测宠物转生！", "随机色")
			return
		end
		for i = 0, 4 do
			petindex = char.getCharPet( talkerindex, i)
			if char.check(petindex) == 1 then
				if char.getInt( petindex, "宠ID") == 718 then
					if char.getInt( petindex, "等级") == 79 then
						num = other.atoi(data) - 1
						petNo = char.getCharPet(talkerindex, num)
						if char.check(petNo) == 1 then
							if char.getInt( petNo, "等级") < 80 then
								char.TalkToCli(talkerindex, meindex, "[错误提示]预测宠物等级必须80级以上！", "随机色")
								return
							end
							if char.getInt( petNo, "转数") > 0 then
								char.TalkToCli(talkerindex, meindex, "[错误提示]你都转过了还预测个啥呀？", "随机色")
								return
							end
							LevelUpPoint = char.getInt( petindex, "能力值")
							vital1 = char.getRightTo8(LevelUpPoint, 1)
							str1 = char.getRightTo8(LevelUpPoint, 2)
							tgh1 = char.getRightTo8(LevelUpPoint, 3)
							dex1 = char.getRightTo8(LevelUpPoint, 4)
							total1 = ( vital1 + str1 + tgh1 + dex1 )
							
							if  total1 > 150 then
								total1 = 150
							end
							
							LevelUpPoint = char.getInt( petNo, "能力值")
							
							petrank = char.getInt( petNo, "成长区间" )
							petLV = char.getInt( petNo, "等级")
							vital2 = char.getRightTo8(LevelUpPoint, 1)
							str2 = char.getRightTo8(LevelUpPoint, 2)
							tgh2 = char.getRightTo8(LevelUpPoint, 3)
							dex2 = char.getRightTo8(LevelUpPoint, 4)
							total2 = ( vital2 + str2 + tgh2 + dex2 )
							ans = PetTransManGetAns(total1, total2, petLV, petrank)
							
							total = total1 + (total2*4)
							
							vital = getIntPart(( ans * ( vital1 + (vital2*4) ) ) / total)
							str = getIntPart(( ans * ( str1 + (str2*4) ) ) / total)
							tgh = getIntPart(( ans * ( tgh1 + (tgh2*4) ) ) / total)
							dex = getIntPart(( ans * ( dex1 + (dex2*4) ) ) / total)
							
							
							if seqno == 3 then
								token = "                『" .. char.getChar(meindex, "名字") .. "』\n[" .. char.getChar(petNo, "名字") .. "] [Lv" .. char.getInt(petNo, "等级") .. "] 的四围能力值如下：\n宠物的值     MM的值     转后参考值\n"
								token = token .. string.format("体力：%-6d体力：%-6d体力：%d±2\n腕力：%-6d腕力：%-6d腕力：%d±2\n耐力：%-6d耐力：%-6d耐力：%d±2\n速度：%-6d速度：%-6d速度：%d±2\n★ 以上为宠物基本能力值，为成长的基础值\n", vital2, vital1, vital, str2, str1, str, tgh2, tgh1, tgh, dex2, dex1, dex)
							elseif seqno == 4 then
								hp1, atk1, def1, quick1 = GetPetAnalog(vital - 2, str - 2, tgh - 2, dex - 2)
								hp2, atk2, def2, quick2 = GetPetAnalog(vital + 2, str + 2, tgh + 2, dex + 2)
								develop1 = atk1 + def1 + quick1
								develop2 = atk2 + def2 + quick2
								token = "                『" .. char.getChar(meindex, "名字") .. "』\n[" .. char.getChar(petNo, "名字") .. "] [Lv" .. char.getInt(petNo, "等级") .. "] 转后成长预测如下\n          「最差预测」     「最好预测」\n"
								token = token .. string.format("  [血量]   %-10f       %f\n  [攻击]    %-10f       %f\n  [防御]    %-10f       %f\n  [敏捷]    %-10f       %f\n  [成长]    %-10f       %f", hp1, hp2, atk1, atk2, def1, def2, quick1, quick2, develop1, develop2)
							end
							lssproto.windows(talkerindex, "对话框", "确定", -1, char.getWorkInt( meindex, "对象"), token)
							npc.DelFame(talkerindex, 20)
							return
						end
					end
				end
			end
		end
		char.TalkToCli(talkerindex, -1, "[错误提示]你身上没有携带满级的玛蕾菲雅哦！", "随机色")
	elseif seqno == 5 then
		if npc.Free(-1, talkerindex, "FAME<2000") == 1 then
			char.TalkToCli(talkerindex, meindex, "[错误提示]您的声望不足20点，无法为您预测宠物转生！", "随机色")
			return
		end
		num = other.atoi(data) - 1
		petindex = char.getCharPet( talkerindex, num)
		if char.check(petindex) == 1 then
			if char.getInt( petindex, "宠ID") == 718 then
				LevelUpPoint = char.getInt( petindex, "能力值")
				vital1 = char.getRightTo8(LevelUpPoint, 1)
				str1 = char.getRightTo8(LevelUpPoint, 2)
				tgh1 = char.getRightTo8(LevelUpPoint, 3)
				dex1 = char.getRightTo8(LevelUpPoint, 4)
				token = "                『" .. char.getChar(meindex, "名字") .. "』\n [" .. char.getChar(petindex, "名字") .. "] [Lv" .. char.getInt(petindex, "等级") 
							.. "] \n         「当前喂养值」   「满石参考值」\n"
							.. string.format("　[水灵石]　　 %-17d50\n"
														.."　[火灵石]　　 %-17d50\n"
														.."　[地灵石]　　 %-17d50\n"
														.."　[风灵石]　　 %-17d50\n"
														.."★ 以上数据为喂养灵石的情况，仅供参考。\n",  vital1, str1, tgh1, dex1)
				lssproto.windows(talkerindex, "对话框", "确定", -1, char.getWorkInt( meindex, "对象"), token)
				npc.DelFame(talkerindex, 20)
			end
		end
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
	Create("宠物转生专家", 24967, 32021, 36, 30, 6)
	--Create("宠物转生专家", 24967, 2000, 56, 84, 6)

end

