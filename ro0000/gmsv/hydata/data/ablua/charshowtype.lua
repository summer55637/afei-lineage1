--环境包显示
function FreeCharShowType( charaindex1,charaindex2 )
	if charaindex1 == charaindex2 then
		return 1
	end
	if char.getInt(charaindex1, "类型") == 1 and char.getInt(charaindex2, "类型") == 1 then
		if char.getInt(charaindex2,"地图号") >= 40030 and char.getInt(charaindex2,"地图号") <= 40034 then
			if char.getWorkChar(charaindex1,"NPC临时1") ~= char.getWorkChar(charaindex2,"NPC临时1") then
				return 0
			end
		end
	end
	if char.getFlg(charaindex2, "屏蔽") == 1 and (char.getInt(charaindex1, "类型") == 1 or char.getInt(charaindex1, "类型") == 52) then
        if char.getWorkInt(charaindex2, "组队") == 0 then
            return 0
        elseif char.getWorkInt(charaindex2, "组队") == 1 then
            for i = 1,5 do
                if char.getWorkInt(charaindex2, "队员" .. i) == charaindex1 and char.getWorkInt(charaindex2, "队员" .. i) ~= -1 then
                    return 1
                end
            end
            return 0
        elseif char.getWorkInt(charaindex2, "组队") == 2 then
            local teamindex = char.getWorkInt(charaindex2, "队员1")

            for i = 1,5 do
                if char.getWorkInt(teamindex, "队员" .. i) == charaindex1 and char.getWorkInt(teamindex, "队员" .. i) ~= -1 then
                    return 1
                end
			end
            return 0
        end
    elseif char.getFlg(charaindex2, "队伍满员") == 1 then
        if char.getWorkInt(charaindex1, "组队") == 0 then
            return 1
        else
            if char.getWorkInt(charaindex2, "组队") == 1 then
                for i = 1,5 do
                    if char.getWorkInt(charaindex2, "队员" .. i) == charaindex1 and char.getWorkInt(charaindex2, "队员" .. i) ~= -1 then
                        return 1
                    end
                end

                if char.getWorkInt(charaindex1, "组队") == 1 then
                    local partynum = 0

                    for i = 1,5 do
                        if char.getWorkInt(charaindex1, "队员" .. i) ~= -1 then
                            partynum = partynum + 1
                        end
                    end

                    if partynum >= 5 then
                        return 0
                    end

                    return 1
                elseif char.getWorkInt(charaindex1, "组队") == 2 then
                    local partynum = 0
                    local teamindex = char.getWorkInt(charaindex1, "队员1")

                    for i = 1,5 do
                        if char.getWorkInt(teamindex, "队员" .. i) ~= -1 then
                            partynum = partynum + 1
                        end
                    end

                    if partynum >= 5 then
                        return 0
                    end

                    return 1
                end
            elseif char.getWorkInt(charaindex2, "组队") == 2 then
                local teamindex = char.getWorkInt(charaindex2, "队员1")

                for i = 1,5 do
                    if char.getWorkInt(teamindex, "队员" .. i) == charaindex1 and char.getWorkInt(teamindex, "队员" .. i) ~= -1 then
                        return 1
                    end
                end

                if char.getWorkInt(charaindex1, "组队") == 1 then
                    local partynum = 0

                    for i = 1,5 do
                        if char.getWorkInt(charaindex1, "队员" .. i) ~= -1 then
                            partynum = partynum + 1
                        end
                    end

                    if partynum >= 5 then
                        return 0
                    end

                    return 1
                elseif char.getWorkInt(charaindex1, "组队") == 2 then
                    local partynum = 0
                    local teamindex = char.getWorkInt(charaindex1, "队员1")

                    for i = 1,5 do
                        if char.getWorkInt(teamindex, "队员" .. i) ~= -1 then
                            partynum = partynum + 1
                        end
                    end

                    if partynum >= 5 then
                        return 0
                    end

                    return 1
                end
            end
        end
    end
	return 1
end

function data()
					 
end

function main()
	data()
end
