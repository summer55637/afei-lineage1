function ItemToPlayerPetFunction( charindex, fromitemindex, fromid, toitemindex, data)
	local buf1
	local buf2={"腕力成长率","耐久力成长率","速度成长率","体力成长率","能力"}
	local buf3={"大幅提高","略为提高","略为减少"}
	local work={0,0,0,0}
	local num={"攻","防","敏","HP"}
	local itemtype=0
	local LevelUpPoint=0
	local petrank=0
	local maxnums=50
	--char.TalkToCli(charindex, -1, "实际验证码:"..char.getWorkInt(charindex, "计时器").." | 输入验证码:"..data, "随机色")
	for i = 0, 4 do
		if toitemindex == char.getCharPet(charindex, i) then
			if char.getInt(toitemindex, "宠ID") == 718 or char.getInt(toitemindex, "宠ID") == 401 then
				if char.getInt(toitemindex, "等级") < 74 then
					char.TalkToCli(charindex, toitemindex, "给我的吗？好美丽的项链喔！〈能力起了变化〉", "随机色")
					LevelUpPoint = char.getInt(toitemindex,"能力值")
					petrank = char.getInt( toitemindex, "成长区间" )
					work[4]=other.NumRightToNum(LevelUpPoint,24)
					work[1]=other.NumRightToNum(LevelUpPoint,16)
					work[2]=other.NumRightToNum(LevelUpPoint,8)
					work[3]=other.NumRightToNum(LevelUpPoint,0)
					for j=1,4 do
						buf1="0"
						itemtype = item.getInt( fromitemindex, num[j])
						work[j] = work[j] + itemtype
						if work[j] > maxnums then
							buf1 = buf2[j] .. " 已经达到最高了。"
							work[j] = maxnums
						elseif work[j] < 0 then
							buf1 = buf2[j] .. " 已经到最低了哦。"
							work[j] = 0
						else
							if itemtype > 0 then
								if itemtype > 2 then
									buf1 = buf2[j] .. " " .. buf3[1] .. " 。"
								else
									buf1 = buf2[j] .. " " .. buf3[2] .. " 。"
								end
							elseif itemtype < 0 then
								buf1 = buf2[j] .. " " .. buf3[3] .. " 。"
							end
						end
						if string.len(buf1)>2 then
							char.TalkToCli(charindex, toitemindex, buf1, "随机色")
						end
						if work[j] < 0 then
							work[j] = 0
						end
					end
					LevelUpPoint = other.NumLeftToNum(work[4],24) + other.NumLeftToNum(work[1],16) + other.NumLeftToNum(work[2],8) + other.NumLeftToNum(work[3],0)
					char.setInt( toitemindex, "能力值", LevelUpPoint)
					char.setInt( toitemindex, "成长区间", petrank)
					char.DelItem( charindex, fromid)
					char.sendStatusString(charindex,"K" .. i)
					return 0
				end
			end
		end
	end
	return 1
end

function useRandEditBase(itemindex, charaindex, toindex, haveitemindex)
	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex, "宠ID") == 718 or char.getInt(toindex, "宠ID") == 401 then
				if char.getInt(toindex, "等级") < 74 then
					char.setWorkInt(charaindex, "使用道具索引", itemindex)
					char.setWorkInt(charaindex, "被使用道具索引", toindex)
					char.setWorkInt(charaindex, "计时器", 0)
					ItemToPlayerPetFunction(charaindex,itemindex,haveitemindex,toindex,0)
					return 0
				end
			end
		end
	end
	return 1
end

function main()
	item.addLUAListFunction( "ITEM_useRandEditBase", "useRandEditBase", "")
end
