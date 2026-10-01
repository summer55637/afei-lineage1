function Showlist(meindex, talkerindex, page)
    local maxpage = math.ceil(#petrequire/7)
    local button = 8
    if  page == maxpage then
    elseif page == 1 and page < maxpage then
        button = 40
    elseif page > 1 and page < maxpage then
        button = 56
    elseif page == maxpage then
        button = 24
    end
    local token = "1            请选择需要进化的宠物"
    for i=1+((page-1)*7),page*7 do
        token = token.."\n               [style c=5]"..enemytemp.getEnemyTempNameFromEnemyID(petrequire[i][1]).."[/style]"
        if i == #petrequire then
            break
        end
    end
    char.setWorkInt(talkerindex, "NPC临时1", page)
    lssproto.windows(talkerindex, 2, button, page+10, char.getWorkInt(meindex, "对象"), token);
end

function Talked(meindex, talkerindex , szMes, color )
    if npc.isFaceToFace(meindex, talkerindex) == 1 then
        local token = char.getChar(meindex, "名字") .. 
        "|梦宠兑换员，想要提高自己\n的能力吗？只要有了自己的\n梦幻宠物，一切都能做到|1|『兑换圣兽级宠物』"
        lssproto.windows(talkerindex, "新选择框", 8, 0, char.getWorkInt( meindex, "对象"), token)
    end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
    if select == 8 or npc.isFaceToFace(meindex, talkerindex) ~= 1 then
        return;
    end
    if seqno == 0 then
        if other.atoi(data) == 1 then
            Showlist(meindex, talkerindex, 1)
        end
    elseif seqno == 2 then
        lssproto.windows(talkerindex, 3, 8, 3, char.getWorkInt(meindex, "对象"), "      请选择需要进化的宠物");
    elseif seqno == 3 then
        if select ~= 2 then
            char.setWorkInt(talkerindex, "NPC临时2",other.atoi(data))
            lssproto.windows(talkerindex, 3, 8, 4, char.getWorkInt(meindex, "对象"), "      请选择需要进化的宠物");
        end
    elseif seqno == 4 then
        if select ~= 2 then
            char.setWorkInt(talkerindex, "NPC临时3",other.atoi(data))
            if char.getWorkInt(talkerindex, "NPC临时"..seqno-2) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-2) then
                lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt(meindex, "对象"), "\n\n\n              你已经选过了该宠物");
            else
                lssproto.windows(talkerindex, 3, 8, 5, char.getWorkInt(meindex, "对象"), "      请选择需要进化的宠物");
            end
        end
    elseif seqno == 5 then
        if select ~= 2 then
            char.setWorkInt(talkerindex, "NPC临时4",other.atoi(data))
            if char.getWorkInt(talkerindex, "NPC临时"..seqno-2) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-2) 
            or char.getWorkInt(talkerindex, "NPC临时"..seqno-3) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-3) then
                lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt(meindex, "对象"), "\n\n\n              你已经选过了该宠物");
            else
                lssproto.windows(talkerindex, 3, 8, 6, char.getWorkInt(meindex, "对象"), "      请选择需要进化的宠物");
            end
        end
        lssproto.windows(talkerindex, 3, 8, 6, char.getWorkInt(meindex, "对象"), "      请选择需要进化的宠物");
    elseif seqno == 6 then
        if select ~= 2 then
            char.setWorkInt(talkerindex, "NPC临时5",other.atoi(data))
            if char.getWorkInt(talkerindex, "NPC临时"..seqno-2) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-2)
            or char.getWorkInt(talkerindex, "NPC临时"..seqno-3) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-3)
            or char.getWorkInt(talkerindex, "NPC临时"..seqno-4) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-4) then
                lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt(meindex, "对象"), "\n\n\n              你已经选过了该宠物");
            else
                lssproto.windows(talkerindex, 3, 8, 7, char.getWorkInt(meindex, "对象"), "      请选择需要进化的宠物");
            end
        end
    elseif seqno == 7 then
        if select ~= 2 then
            char.setWorkInt(talkerindex, "NPC临时6",other.atoi(data))
            if char.getWorkInt(talkerindex, "NPC临时"..seqno-2) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-2)
            or char.getWorkInt(talkerindex, "NPC临时"..seqno-3) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-3)
            or char.getWorkInt(talkerindex, "NPC临时"..seqno-4) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-4)
            or char.getWorkInt(talkerindex, "NPC临时"..seqno-5) > 0 and char.getWorkInt(talkerindex, "NPC临时"..seqno-1) == char.getWorkInt(talkerindex, "NPC临时"..seqno-5) then
                lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt(meindex, "对象"), "\n\n\n              你已经选过了该宠物");
            else
                local token = "                 [style c=5]你选择了宠物[/style]\n"
                for i=2,6 do
                    if char.getWorkInt(talkerindex, "NPC临时"..i) > 0 then
                        local petindex = char.getCharPet(talkerindex, char.getWorkInt(talkerindex, "NPC临时"..i)-1)
                        local value = math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷"))
                        token = token.."\n          [style c=10]"..char.getChar(petindex, "名字").."[/style] 评分: "..value
                    end
                end
                token = token.."\n                 [style c=6]是否进行进化[/style]"
                lssproto.windows(talkerindex, 0, 12, 8, char.getWorkInt(meindex, "对象"), token);
            end
        end
    elseif seqno == 8 then
        local itemrequire = ""
        for i=1,#petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3] do
            itemrequire = itemrequire.."ITEM="..petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3][i][1].."*"..petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3][i][2]
            if i ~= #petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3] then
                itemrequire = itemrequire.."&"
            end
        end
        if npc.Free(meindex, talkerindex,itemrequire) == 1 then
            local petcheck = {}
            for i=2,6 do
                if char.getWorkInt(talkerindex, "NPC临时"..i) > 0 then
                    local petindex = char.getCharPet(talkerindex, char.getWorkInt(talkerindex, "NPC临时"..i)-1)
                    if char.check(petindex) == 1 then
                        local value = math.floor(char.getWorkInt(petindex, "最大HP") / 4 + char.getWorkInt(petindex, "攻击") + char.getWorkInt(petindex, "防御") + char.getWorkInt(petindex, "敏捷"))
                        table.insert(petcheck,{char.getInt(petindex,"宠ID"),value})
                    end
                end
            end
            for i=1,#petrequire[char.getWorkInt(talkerindex, "NPC临时1")][2] do
                for n=1,#petcheck do
                    if petcheck[n][1] == enemytemp.getEnemyTempIDFromEnemyID(petrequire[char.getWorkInt(talkerindex, "NPC临时1")][2][i][1]) then
                        if petcheck[n][2] >= petrequire[char.getWorkInt(talkerindex, "NPC临时1")][2][i][2] then
                            table.remove(petcheck,n)
                            break
                        end
                    end
                end
            end
            if #petcheck == 0 then 
                local itemrequire = ""
                for i=1,#petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3] do
                    itemrequire = itemrequire..petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3][i][1].."*"..petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3][i][2]
                    if i ~= #petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3] then
                        itemrequire = itemrequire..","
                    end
                end
                npc.DelItem(talkerindex, itemrequire)
                for i=2,6 do
                    if char.getWorkInt(talkerindex, "NPC临时"..i) > 0 then
                        char.DelPet(talkerindex, char.getCharPet(talkerindex, char.getWorkInt(talkerindex, "NPC临时"..i)-1))
                    end
                end
                npc.AddPet(talkerindex, petrequire[char.getWorkInt(talkerindex, "NPC临时1")][1], 1)
            else
                lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt(meindex, "对象"), "\n\n\n                所需宠物条件不足");
            end
        else
            lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt(meindex, "对象"), "\n\n\n                 所需材料不足");
        end
    elseif seqno > 10 then
        if select == 32 then
            Showlist(meindex, talkerindex,seqno-10)
        elseif select == 16 then
            Showlist(meindex, talkerindex,seqno-11)
        elseif other.atoi(data) > 0 then
            char.setWorkInt(talkerindex, "NPC临时2",0)
            char.setWorkInt(talkerindex, "NPC临时3",0)
            char.setWorkInt(talkerindex, "NPC临时4",0)
            char.setWorkInt(talkerindex, "NPC临时5",0)
            char.setWorkInt(talkerindex, "NPC临时6",0)
            char.setWorkInt(talkerindex, "NPC临时1",(char.getWorkInt(talkerindex, "NPC临时1")-1)*7+other.atoi(data))
            local token = "              进化『" .. enemytemp.getEnemyTempNameFromEnemyID(petrequire[char.getWorkInt(talkerindex, "NPC临时1")][1]) .. "』条件"
            for i=1,#petrequire[char.getWorkInt(talkerindex, "NPC临时1")][2] do
                token = token .." \n        [style c=10]"..enemytemp.getEnemyTempNameFromEnemyID(petrequire[char.getWorkInt(talkerindex, "NPC临时1")][2][i][1]).."[/style] 评分 "
                .."[style c=1]"..petrequire[char.getWorkInt(talkerindex, "NPC临时1")][2][i][2].."[/style]"
            end
            for i=1,#petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3] do
                token = token .." \n        [style c=3]"..item.getNameFromNumber(petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3][i][1]).."[/style] 数量 "
                .."[style c=4]"..petrequire[char.getWorkInt(talkerindex, "NPC临时1")][3][i][2].."[/style]"
            end
            lssproto.windows(talkerindex, 0, 12, 7-#petrequire[char.getWorkInt(talkerindex, "NPC临时1")][2], char.getWorkInt(meindex, "对象"), token);
        end
    end
end

function Create(name, metamo, floor, x, y, dir)
    local npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
    char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
    char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
    petrequire = {
        {3057,{{350,1335}},{{21113,30},{29062,20},{21044,1},{21045,1},{21046,1},{21047,1}}}
        ,{3052,{{351,1315}},{{21113,30},{29062,20},{21044,1},{21045,1},{21046,1},{21047,1}}}
        ,{3038,{{352,1320}},{{21113,30},{29062,20},{21044,1},{21045,1},{21046,1},{21047,1}}} 
        ,{3037,{{353,1310}},{{21113,30},{29062,20},{21044,1},{21045,1},{21046,1},{21047,1}}}
        --,{2057,{{3042,1420},{1558,1410}},{{21113,20},{28461,20}}}
        --,{2058,{{3044,1420},{1558,1410}},{{21113,20},{28461,20}}}
    }
    --emeyID号 格式:{    { 兑换宠物号   ,   { {需要宠物号,评分},{需要宠物号,评分} }   ,   { {需要道具,数量},{需要道具,数量} } }    }
end

function main()
    data()
    Create("「梦暴兑换」", 100909, 2005, 18, 24, 6)
end