function ShowDlg(meindex, talkerindex, page )
	local token = "1               [style c=4]兑换称号名称[/style]"
	for i=1,6 do
		if i+(page-1)*6 > #title then
			break
		end
		token = token.. "\n                [style c=1]"..title[i][1].."[/style]"
	end
	local maxpage = math.ceil(#title/6);
	local button = 8;
	if maxpage == 1 then
	elseif page == 1 and page < maxpage then
		button = 40
	elseif page > 1 and page < maxpage then
		button = 56
	elseif page == maxpage then
		button = 24;
	end
	lssproto.windows(talkerindex, 2, button, page+10, char.getWorkInt(meindex, "对象"), token)
end

function getrecord(charaindex,str)
	sasql.query("select "..str.." from titlerecord where account = '"..char.getChar(charaindex,"账号").."'")
	sasql.free_result();
	sasql.store_result();
	if sasql.num_rows() > 0 then
		sasql.fetch_row();
		if sasql.data(1)*1 == 1 then
			return false
		else
			sasql.query("update titlerecord set "..str.."=1 where account='"..char.getChar(charaindex,"账号").."'")
			return true
		end
	else
        sasql.query("insert into titlerecord set account='"..char.getChar(charaindex,"账号").."', "..str.." =1")
		return true
	end
end

function getresult(charaindex)
	local totalwin,totallose = 0,0
	sasql.query("select Result from SoccerResult where Account = '"..char.getChar(charaindex,"账号").."'")
	sasql.free_result();
	sasql.store_result();
	if sasql.num_rows() > 0 then
		for i=1,sasql.num_rows() do
			sasql.fetch_row();
			if sasql.data(1) == "赢" then
				totalwin = totalwin + 1
			elseif sasql.data(1) == "输" then
				totallose = totallose + 1
			end
		end
    end
    return totalwin,totallose
end

function Talked(meindex, talkerindex , szMes, color )
	if npc.isFaceToFace(meindex, talkerindex) == 1 then
		ShowDlg(meindex, talkerindex, 1)
	end
end

function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if npc.isFaceToFace(meindex, talkerindex) == 1 and select ~= 8 then
		if seqno < 100 then
        	if select == 32 then
        	    ShowDlg(meindex, talkerindex, seqno-9)
        	elseif  select == 16 then
        	    ShowDlg(meindex, talkerindex, seqno-11)
        	else
        		local n = ((seqno-11)*6+data)
        		local token = "\n          "..title[n][1].."称号兑换条件：\n\n"
        		if n < 5 then
        			token = token.."          需要道具：".. item.getNameFromNumber(title[n][3])
        			.. "\n          兑换几率： 20%"
        		elseif n == 5 then
        			token = token.."          球赛竞猜[style c=6]总赢[/style]减去[style c=5]总输[/style]大于等于[style c=4]18[/style]"
        		elseif n == 6 then
        			token = token.."          球赛竞猜[style c=5]总输[/style]减去[style c=6]总赢[/style]大于等于[style c=4]18[/style]"
        		end
				lssproto.windows(talkerindex, 0, 12, n+100, char.getWorkInt( meindex, "对象"), token)
        	end
        else
			if char.findEmptyItemBox(talkerindex) > -1 then
				local n = seqno-100
				if n < 5 then
					if char.Finditem(talkerindex, title[n][3]) > 0 then
						if math.random(100) <= 20 then
							npc.AddItem(talkerindex, title[n][2])
							char.talkToAllServer("P|P|[兑换公告]恭喜" .. char.getChar(talkerindex, "名字") .. "人品爆发，幸运兑换" ..title[n][1].."称号！","")
						else
							char.TalkToCli(talkerindex, meindex, "很遗憾，本次兑换失败了。。。", 4)
						end
						return
					end
				elseif n == 5 or n == 6 then
					local win,lose = getresult(talkerindex)
					if n == 5 and win - lose > 17 then
						if getrecord(talkerindex,"DS") then
							npc.AddItem(talkerindex, title[n][2])
							char.talkToAllServer("P|P|[兑换公告]恭喜" .. char.getChar(talkerindex, "名字") .. "兑换" ..title[n][1].."称号！","")
						else
							lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n               [style c=4]您已经兑换过该称号了[/style]");
						end
						return
					elseif n == 6 and lose - win > 17 then
						if getrecord(talkerindex,"MD") then
							npc.AddItem(talkerindex, title[n][2])
							char.talkToAllServer("P|P|[兑换公告]恭喜" .. char.getChar(talkerindex, "名字") .. "兑换" ..title[n][1].."称号！","")
						else
							lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n               [style c=4]您已经兑换过该称号了[/style]");
						end
						return
					end
				end
				lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n                 [style c=4]兑换条件不足[/style]");
			else
				lssproto.windows(talkerindex, 0, 8, -1, char.getWorkInt( meindex, "对象"), "\n\n\n               [style c=4]请先整理下背包[/style]");
			end
        end
    end
end

function Create(name, metamo, floor, x, y, dir)
	local index = npc.CreateNpc(name, metamo, floor, x, y, dir)
	char.setFunctionPointer(index, "对话事件", "Talked", "")
	char.setFunctionPointer(index, "窗口事件", "WindowTalked", "")

end

function data()
	title = {{"大地精灵　", 25000, 2701}
				,{"水的精灵　", 25001, 2770}
				,{"火炎精灵　", 25002, 2707}
				,{"疾风精灵　", 25003, 2735}
				,{"奥萝拉的精灵", 25004, 29097}
				,{"彩虹的精灵", 25005, 29096}
				}
end

function main()
	data ()
	Create("称号兑换师", 41342, 2000, 50, 54, 4)
end
