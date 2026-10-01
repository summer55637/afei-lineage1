
function Talked(meindex, talkerindex, szMes, color )
    --temindex = char.Additem(talkerindex,16672)

                            --item.setInt(itemindex,"敏",-8)
                            --item.setInt(itemindex,"防",42)
                            --item.setInt(itemindex,"毒耐",0)
                            --item.setInt(itemindex,"睡耐",24)
                            --item.setInt(itemindex,"石耐",24)
                            --item.setInt(itemindex,"混耐",0)
    if npc.isFaceToFace(meindex, talkerindex) == 1 then
        local token = "1   \n转宠\n查看档次"
        lssproto.windows(talkerindex, 2, 8, 0, char.getWorkInt( meindex, "对象"), token)
    end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
    if npc.isFaceToFace(meindex, talkerindex) == 1 then  
        if seqno == 0 then
            if data*1 == 1 then
                lssproto.windows(talkerindex, 3, 8, 1, char.getWorkInt( meindex, "对象"), 1)
            elseif data*1 == 2 then
                lssproto.windows(talkerindex, 3, 8, 2, char.getWorkInt( meindex, "对象"), 1)
            end
        elseif seqno == 1 then
            local petindex = char.getCharPet(talkerindex, data-1)
            local array = char.getInt(petindex, "宠ID")
            local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
            local vital = enemytemp.getInt(tempno, "体力") + 2
            local str = enemytemp.getInt(tempno, "腕力") + 2
            local tgh = enemytemp.getInt(tempno, "耐力") + 2
            local dex = enemytemp.getInt(tempno, "速度") + 2
            char.setInt(petindex, "能力值", char.getLiftTo8(vital, 1) + char.getLiftTo8(str, 2) + char.getLiftTo8(tgh, 3) + char.getLiftTo8(dex, 4))
            --[[for j=1,139 do
                char.PetLevelUp(petindex)
                char.setInt(petindex,"等级",char.getInt(petindex,"等级") + 1)
                char.complianceParameter(petindex)
            end]]
            char.setInt(petindex, "等级", 140)
            char.setInt(petindex, "转数", 0)
            char.setWorkInt(petindex,"NPC临时1",3344)
            char.PetTrans(talkerindex,petindex,50,50,50,50)
            for j=1,139 do
                char.PetLevelUp(petindex)
                char.setInt(petindex,"等级",char.getInt(petindex,"等级") + 1)
                char.complianceParameter(petindex)
            end
            char.sendStatusString(talkerindex, "K" .. data-1);
            char.sendStatusString(talkerindex, "W" .. data-1);
            --[[local MMindex = char.AddPet(talkerindex,1479,1)
            local LevelUpPoint = other.NumLeftToNum(0,24)
            + other.NumLeftToNum(50,16)
            + other.NumLeftToNum(50,8)
            + other.NumLeftToNum(50,0)
            char.setInt(MMindex, "能力值", LevelUpPoint)
            char.setInt(MMindex,"等级",79)
            char.setInt(MMindex,"体力",19768+math.random(-200,200))
            char.setInt(MMindex,"腕力",19793+math.random(-200,200))
            char.setInt(MMindex,"耐力",19827+math.random(-200,200))
            char.setInt(MMindex,"速度",19897+math.random(-200,200))
            char.setInt(MMindex,"可变AI",10000)
            char.complianceParameter(MMindex)
            char.setInt( MMindex, "HP", char.getWorkInt( MMindex, "最大HP" ))
            char.TalkToCli(talkerindex, -1, "获得玛蕾菲雅。", 4)
            npc.AddItem(talkerindex, 22005)
            for i=0,4 do
                local petindex = char.getCharPet(talkerindex, i)
                if char.check(petindex) == 1 and petindex == MMindex then
                    char.sendStatusString(talkerindex, "K"..i)
                end
            end]]
        elseif seqno == 2 then
            local token = ""
            local petindex = char.getCharPet(talkerindex, data-1)
            local LevelUpPoint = char.getInt(petindex, "能力值")
            local vital = char.getRightTo8(LevelUpPoint, 1)
            local str = char.getRightTo8(LevelUpPoint, 2)
            local tgh = char.getRightTo8(LevelUpPoint, 3)
            local dex = char.getRightTo8(LevelUpPoint, 4)
            local array = char.getInt(petindex, "宠ID")
            local tempno = enemytemp.getEnemyTempArrayFromTempNo(array)
            if char.getInt(petindex,"宠ID") == 718 then
                token = "                 『[style c=5]" .. char.getChar(petindex, "名字") .. "[/style]』\n" .. char.getChar(petindex, "名字") .. " Lv" .. char.getInt(petindex, "等级") .. " 的四围档次如下：\n你的宠物        未转参考值\n"
                token = token .. string.format("[style c=1]体力：[/style]%-10d极品值：%d\n[style c=6]腕力：[/style]%-10d极品值：%d\n[style c=5]耐力：[/style]%-10d极品值：%d\n[style c=4]速度：[/style]%-10d极品值：%d\n[style c=10]四项为50则是满石（转宠只和MM档次有关）[/style]\n", vital, 50, str, 50,  tgh, 50, dex, 50)
                lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token)
            else
                token = "                 『[style c=5]" .. char.getChar(petindex, "名字") .. "[/style]』\n" .. char.getChar(petindex, "名字") .. " Lv" .. char.getInt(petindex, "等级") .. " 的四围档次如下：\n你的宠物        未转参考值\n"
                token = token .. string.format("[style c=1]体力：[/style]%-10d极品值：%d\n[style c=6]腕力：[/style]%-10d极品值：%d\n[style c=5]耐力：[/style]%-10d极品值：%d\n[style c=4]速度：[/style]%-10d极品值：%d\n[style c=10]宠物档次越高，转生后档次会越高[/style]\n", vital,enemytemp.getInt(tempno, "体力")+2, str,enemytemp.getInt(tempno, "腕力")+2,  tgh, enemytemp.getInt(tempno, "耐力")+2, dex, enemytemp.getInt(tempno, "速度")+2)
                lssproto.windows(talkerindex, 0, 1, -1, char.getWorkInt(meindex, "对象"), token)
            end
        end 
    end
end

function Create(name, metamo, floor, x, y, dir)
    local npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir);
    char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
    char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function main()
    Create("test", 26977, 777, 45, 29, 6)
end

