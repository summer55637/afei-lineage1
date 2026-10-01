function getdata(charaindex,tl,wl,nl,sd)
    local token = "79级自定义MM|目前属性(50为满):\n体力："..tl.."\n腕力："..wl.."\n耐力："..nl.."\n敏捷："..sd.."|5|制造MM"
    if tl == 50 then
        token = token.."|〖体力为0〗"
    else
        token = token.."|〖体力为满〗"
    end
    if wl == 50 then
        token = token.."|〖腕力为0〗"
    else
        token = token.."|〖腕力为满〗"
    end
    if nl == 50 then
        token = token.."|〖耐力为0〗"
    else
        token = token.."|〖耐力为满〗"
    end
    if sd == 50 then
        token = token.."|〖敏捷为0〗"
    else
        token = token.."|〖敏捷为满〗"
    end
    return token
end

function CustomMM(itemindex, charaindex, toindex, haveitemindex)
    if char.findEmptyPetBox(charaindex) > 0 then
        char.setWorkInt(charaindex, "NPC临时1",50)
        char.setWorkInt(charaindex, "NPC临时2",50)
        char.setWorkInt(charaindex, "NPC临时3",50)
        char.setWorkInt(charaindex, "NPC临时4",50)
        lssproto.windows(charaindex, "新选择框", 8, 0, char.getWorkInt(npcindex, "对象"), getdata(charaindex,50,50,50,50))
    else
        lssproto.windows(charaindex, 0, 1, 0, char.getWorkInt(npcindex, "对象"), "\n\n\n               [style c=4]请先清理下宠物栏哦[/style]")
    end
end

function WindowTalked (meindex, talkerindex, seqno, select, data)
    if select ~= 8 then
        if seqno == 0 then
            if data*1 > 1 then
                char.setWorkInt(talkerindex, "NPC临时"..(data-1),char.getWorkInt(talkerindex, "NPC临时"..(data-1)) + 50)
                if char.getWorkInt(talkerindex, "NPC临时"..(data-1)) > 50 then
                    char.setWorkInt(talkerindex, "NPC临时"..(data-1),0)
                end
                lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象") 
                ,getdata(talkerindex,char.getWorkInt(talkerindex, "NPC临时1"),char.getWorkInt(talkerindex, "NPC临时2")
                ,char.getWorkInt(talkerindex, "NPC临时3"),char.getWorkInt(talkerindex, "NPC临时4")))
            elseif data*1 == 1 then
                local token = "79级自定义MM|体力："..char.getWorkInt(talkerindex, "NPC临时1")
                .."\n腕力："..char.getWorkInt(talkerindex, "NPC临时2")
                .."\n耐力："..char.getWorkInt(talkerindex, "NPC临时3")
                .."\n敏捷："..char.getWorkInt(talkerindex, "NPC临时4")
                .."\n确定制造吗？|2|制造MM|重新选择"
                lssproto.windows(talkerindex, "新选择框", 8, 1, char.getWorkInt( meindex, "对象"), token)
            end
        elseif seqno == 1 then
            if data*1 == 2 then
                lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象") 
                ,getdata(talkerindex,char.getWorkInt(talkerindex, "NPC临时1"),char.getWorkInt(talkerindex, "NPC临时2")
                ,char.getWorkInt(talkerindex, "NPC临时3"),char.getWorkInt(talkerindex, "NPC临时4")))
            elseif data*1 == 1 then
                if char.findEmptyPetBox(talkerindex) > 0 then
                    npc.DelItem(talkerindex, "20837*1")
                    local MMindex = char.AddPet(talkerindex,1479,1)
                    while char.getInt(MMindex, "等级") < 79 do
                        LevelUpPoint = other.NumLeftToNum(char.getWorkInt(talkerindex, "NPC临时1"),24)
                        + other.NumLeftToNum(char.getWorkInt(talkerindex, "NPC临时2"),16)
                        + other.NumLeftToNum(char.getWorkInt(talkerindex, "NPC临时3"),8)
                        + other.NumLeftToNum(char.getWorkInt(talkerindex, "NPC临时4"),0)
                        char.setInt(MMindex, "能力值", LevelUpPoint)
                        char.PetLevelUp(MMindex)
                        char.setInt(MMindex,"可变AI",math.max(-10000,math.min(10000,char.getInt(MMindex,"可变AI") + 500)))
                        char.setInt(MMindex, "等级", char.getInt(MMindex, "等级") + 1)
                    end
                    char.setInt(MMindex,"可变AI",10000)
                    char.complianceParameter(MMindex)
                    char.setInt( MMindex, "HP", char.getWorkInt( MMindex, "最大HP" ))
                    char.TalkToCli(talkerindex, -1, "获得玛蕾菲雅。", 4)
                    for i=0,4 do
                        local petindex = char.getCharPet(talkerindex, i)
                        if char.check(petindex) == 1 and petindex == MMindex then
                            char.sendStatusString(talkerindex, "K"..i)
                        end
                    end
                end
            end
        end
    end
end

function Create(name, metamo, floor, x, y, dir)
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function main()
	Create("MM大师", 101156, 777, 15, 13, 4)
	item.addLUAListFunction( "ITEM_CUSTOM_MM", "CustomMM", "")
end