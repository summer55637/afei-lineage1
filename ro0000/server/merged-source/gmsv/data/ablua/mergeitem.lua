--合成料理必然先行触发 
function FreeMergeItem( charaindex, data )	
	return 0
end

--料理合成判定回调（流程中） 在出结果itemid时候 可以控制是否允许生成
function FreeMergeItemCheck( charaindex, itemid )
	--print("FreeMergeItemCheck",itemid)
	if itemid >=14001 and itemid <=14300 
		or itemid >=14301 and itemid <=14600 
		or itemid >=14601 and itemid <=14900 
		or itemid >=14901 and itemid <=15200 
		or itemid >=15201 and itemid <=15500 
		or itemid >=15501 and itemid <=15800 
		or itemid >=15801 and itemid <=16100 
		or itemid >=16101 and itemid <=16400 
		or itemid >=16401 and itemid <=16700 
		or itemid >=16701 and itemid <=17000 
		or itemid >=17001 and itemid <=17500 
		or itemid >=17501 and itemid <=18000  then 
		return -1
	end
	return itemid
end

--合成料理成功回调 
function FreeMergeItemOk( charaindex,data )
    other.CallFunction("OnEventFinish","data/ablua/npc/stoneash/stoneash.lua",{charaindex,4,""})
    other.CallFunction("updateHuoyue", "data/ablua/npc/huoyue/huoyue.lua", {charaindex,9,1})
    char.newMessageToCli(charaindex, -1, "恭喜，成功了", "白色")

    if data == "" then
        return 0
    end
    --日常任务  合成 料理 成功才算次数 现已屏蔽
    local haveitemindex1 = other.getString(data,"|",1)
    local itemindex1 = char.getItemIndex(charaindex,haveitemindex1)
    if itemindex1 > -1 then
        local itemtype = item.getInt(itemindex1,"类型")
        if itemtype == 16 then 
            --合成 --豆丁狩猎卷每日任务(合成)
            other.CallFunction("updateDayTaskPlan", "data/ablua/npc/huodong1/15.lua", {charaindex, 11, 1})
        elseif itemtype == 20 then 
            --料理
        end
    end
    return 0
end

--合成料理失败回调
function FreeMergeItemFalse( charaindex,data )
	char.newMessageToCli(charaindex, -1, "真可惜，失败了", "白色")
end

function ShowWindows(talkerindex,data,flg)
	local type = other.getString(data,"|",1)
	if type == "P" then
		--显示配方总表：P|S|数量|名字1|...|名字N
		token = "P|S|" .. #itemdata
		for i=1,#itemdata do
			token = token .. "|" .. itemdata[i][1]
        end
        if flg == 1 then
            lssproto.windowsupdate(talkerindex, 1015, 0, 0, char.getWorkInt( npcindex, "对象"), token)
        else
            lssproto.windows(talkerindex, 1015, 0, 0, char.getWorkInt( npcindex, "对象"), token)
        end

	end
	return 0
end

function openWindows(talkerindex)
    ShowWindows(talkerindex,"P|",2)
	return 0
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	local type = other.getString(data,"|",1)
	if type == "P" then
		local type2 = other.getString(data,"|",2)
		if type2 == "S" then
			--显示配方分表：P|PS|总表索引|分表数量|道具图像1|道具名字1|...|道具图像N|道具名字N
			local pnum = other.getString(data,"|",3)
			if pnum == "" then
				return
			end
			pnum = other.atoi(pnum)
			if pnum < 1 or pnum > #itemdata then
				return
			end
			token = "P|PS|" .. pnum .. "|" .. #itemdata[pnum][2]
			for i=1,#itemdata[pnum][2] do
				token = token .. "|" .. item.getgraNoFromITEMtabl(itemdata[pnum][2][i][1]) .. "|" .. item.getSecretNameFromNumber(itemdata[pnum][2][i][1]).. "|" .. item.getItemInfoFromNumber(itemdata[pnum][2][i][1])
			end
			lssproto.windowsupdate(talkerindex, 1015, 0, 1, char.getWorkInt( meindex, "对象"), token)
        elseif type2 == "PS" then
			local pnum = other.getString(data,"|",3)
			if pnum == "" then
				return
			end
			pnum = other.atoi(pnum)
			if pnum < 1 or pnum > #itemdata then
				return
			end
			local pnum2 = other.getString(data,"|",4)
			if pnum2 == "" then
				return
			end
			pnum2 = other.atoi(pnum2)
			if pnum2 < 1 or pnum2 > #itemdata[pnum][2] then
				return
            end
            local jiagongFlag = 1
            if char.getInt(talkerindex,"石币") < itemdata[pnum][2][pnum2][2] then
                jiagongFlag = 0
			end
            if char.getInt(talkerindex,"活力") < itemdata[pnum][2][pnum2][3] then
                jiagongFlag = 0
            end
			for i=1,#itemdata[pnum][2][pnum2][5] do
                if npc.Free(-1,talkerindex,"ITEM=" .. itemdata[pnum][2][pnum2][5][i][1] .. "*" .. itemdata[pnum][2][pnum2][5][i][2]) ~= 1 then
                    jiagongFlag = 0
				end
			end
			token = "P|PSN|" .. pnum .. "|" .. pnum2 .. "|" .. itemdata[pnum][2][pnum2][2] .. "|" .. itemdata[pnum][2][pnum2][3] .. "|" .. itemdata[pnum][2][pnum2][4] .. "|" .. #itemdata[pnum][2][pnum2][5] .. "|" .. jiagongFlag
			for i=1,#itemdata[pnum][2][pnum2][5] do
				token = token .. "|" .. item.getgraNoFromITEMtabl(itemdata[pnum][2][pnum2][5][i][1]) .. "|" .. item.getSecretNameFromNumber(itemdata[pnum][2][pnum2][5][i][1]) .. "|" .. item.getItemInfoFromNumber(itemdata[pnum][2][pnum2][5][i][1]) .. "|" .. itemdata[pnum][2][pnum2][5][i][2]
			end
			lssproto.windowsupdate(talkerindex, 1015, 0, 1, char.getWorkInt( meindex, "对象"), token)
		elseif type2 == "G" then
			local pnum = other.getString(data,"|",3)
			if pnum == "" then
				return
			end
			pnum = other.atoi(pnum)
			if pnum < 1 or pnum > #itemdata then
				return
			end
			local pnum2 = other.getString(data,"|",4)
			if pnum2 == "" then
				return
			end
			pnum2 = other.atoi(pnum2)
			if pnum2 < 1 or pnum2 > #itemdata[pnum][2] then
				return
            end
            if char.getInt(talkerindex,"石币") < itemdata[pnum][2][pnum2][2] then
				char.newMessageToCli(talkerindex, -1, "您的石币不足", "白色")
				return
			end
			if char.getInt(talkerindex,"活力") < itemdata[pnum][2][pnum2][3] then
				char.newMessageToCli(talkerindex, -1, "您的活力不足", "白色")
				return
			end
			for i=1,#itemdata[pnum][2][pnum2][5] do
				if npc.Free(-1,talkerindex,"ITEM=" .. itemdata[pnum][2][pnum2][5][i][1] .. "*" .. itemdata[pnum][2][pnum2][5][i][2]) ~= 1 then
					char.newMessageToCli(talkerindex, -1, "您的道具不足", "白色")
					return
				end
			end
            char.setInt(talkerindex,"石币",char.getInt(talkerindex,"石币") - itemdata[pnum][2][pnum2][2])
            other.CallFunction("useStoneLog","data/ablua/useItemRecord.lua",{talkerindex,-itemdata[pnum][2][pnum2][2],"配方加工"})
			char.setInt(talkerindex,"活力",char.getInt(talkerindex,"活力") - itemdata[pnum][2][pnum2][3])
            --日常任务 消耗活力
            other.CallFunction("OnDailyEvent", "data/ablua/npc/daily/daily.lua", {talkerindex, 10, itemdata[pnum][2][pnum2][3]})
            --豆丁狩猎卷每日任务(消耗活力)
            other.CallFunction("updateDayTaskPlan", "data/ablua/npc/huodong1/15.lua", {talkerindex, 10, itemdata[pnum][2][pnum2][3]})
			for i=1,#itemdata[pnum][2][pnum2][5] do
				npc.DelItem(talkerindex, itemdata[pnum][2][pnum2][5][i][1] .. "*" .. itemdata[pnum][2][pnum2][5][i][2])
			end
            if other.Random(1,100) <= itemdata[pnum][2][pnum2][4] then
                -- char.Additem(talkerindex,itemdata[pnum][2][pnum2][1])
                --发奖励
                other.CallFunction("sendReward","data/ablua/useItemRecord.lua",{talkerindex, itemdata[pnum][2][pnum2][1], 1, 1, debug.getinfo(1).source, debug.getinfo(1).currentline})
            else
                char.newMessageToCli(talkerindex, -1, "您的配方加工失败了", "白色")
            end
		end
	end
end

function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	--种类名称,{道具ID,{需要道具1,2,3,4}}
	itemdata = {
                    {"矿石配方(祝福宝石)",
                        {
                            --幸运无瑕疵珍珠
                            {21022,1000000,20,10,{{21023,1},{21004,10}}}
                            --幸运无瑕红宝石
                            ,{21018,1000000,20,10,{{21023,1},{21000,10}}}
                            --幸运无瑕蓝宝石
                            ,{21019,1000000,20,10,{{21023,1},{21001,10}}}
                            --幸运无瑕绿宝石
                            ,{21020,1000000,20,10,{{21023,1},{21002,10}}}
                            --幸运无瑕黄宝石
                            ,{21021,1000000,20,10,{{21023,1},{21003,10}}}
                        }
                    },

                    {"矿石配方(灵魂宝石)",
                        {
                            --幸运无瑕疵珍珠
                            {21022,1000000,20,30,{{21024,1},{21004,10}}}
                            --幸运无瑕红宝石
                            ,{21018,1000000,20,30,{{21024,1},{21000,10}}}
                            --幸运无瑕蓝宝石
                            ,{21019,1000000,20,30,{{21024,1},{21001,10}}}
                            --幸运无瑕绿宝石
                            ,{21020,1000000,20,30,{{21024,1},{21002,10}}}
                            --幸运无瑕黄宝石
                            ,{21021,1000000,20,30,{{21024,1},{21003,10}}}

                        }
                    },
                    {"矿石配方(天佑宝石)",
                        {
                            --幸运无瑕疵珍珠
                            {21022,1000000,20,100,{{21025,1},{21004,10}}}
                            --幸运无瑕红宝石
                            ,{21018,1000000,20,100,{{21025,1},{21000,10}}}
                            --幸运无瑕蓝宝石
                            ,{21019,1000000,20,100,{{21025,1},{21001,10}}}
                            --幸运无瑕绿宝石
                            ,{21020,1000000,20,100,{{21025,1},{21002,10}}}
                            --幸运无瑕黄宝石
                            ,{21021,1000000,20,100,{{21025,1},{21003,10}}}

                        }
                    },

                    {"装备一级配方",
                        {
                            --全职绿一级
                            {21090,2000000,100,100,{{21006,10}}}
                            --蓝
                            ,{21091,2000000,100,100,{{21007,10}}}
                            --红
                            ,{21092,2000000,100,100,{{21005,10}}}
                            --黄
                            ,{21093,2000000,100,100,{{21008,10}}}

                        }
                    },
                    {"装备二级配方",
                        {
                            --全职绿一级
                            {21094,5000000,150,100,{{21010,10}}}
                            --蓝
                            ,{21095,5000000,150,100,{{21011,10}}}
                            --红
                            ,{21096,5000000,150,100,{{21012,10}}}
                            --黄
                            ,{21097,5000000,150,100,{{21013,10}}}
                        }

                    },
                    {"装备三级配方",
                    {
                        --全职绿一级
                        {21098,8000000,200,40,{{21014,10}}}
                        --蓝
                        ,{21099,8000000,200,40,{{21015,10}}}
                        --红
                        ,{21100,8000000,200,40,{{21016,10}}}
                        --黄
                        ,{21101,8000000,200,40,{{21017,10}}}
                    }

                    },
                    -- {"宝石配方",
                    -- {
                    --     --itemdata[pnum][2][i][1]
                    --     --全职绿一级
                    --     {21024,1000000,50,100,{{21023,3}}}
                    --     --蓝
                    --     ,{21025,2000000,100,100,{{21024,5}}}
                    --     --红
                    --     ,{21026,2000000,100,100,{{21024,5}}}
                    -- }

                    -- }
                }
end

function main()
	data()
	Create("合成配方", 100000, 777, 13, 16, 6)
end

