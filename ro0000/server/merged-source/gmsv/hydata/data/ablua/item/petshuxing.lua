function petshuxing(itemindex, charaindex, toindex, haveitemindex)
	local data = item.getChar(itemindex, "字段")
	if data == "" then
		return
	end

	for i = 0, 4 do
		if toindex == char.getCharPet(charaindex, i) then
			if char.getInt(toindex,"宠ID") == 1047 then
				if data == "+" then
					if char.getInt(toindex,"水") == 100 then
						char.setInt(toindex,"水",90)
						char.setInt(toindex,"火",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"水") == 90 then
						char.setInt(toindex,"水",80)
						char.setInt(toindex,"火",20)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				elseif data == "-" then
					if char.getInt(toindex,"水") == 90 then
						char.setInt(toindex,"水",100)
						char.setInt(toindex,"火",0)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"水") == 80 then
						char.setInt(toindex,"水",90)
						char.setInt(toindex,"火",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 985 then
				if data == "+" then
					if char.getInt(toindex,"地") == 100 then
						char.setInt(toindex,"地",90)
						char.setInt(toindex,"水",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 90 then
						char.setInt(toindex,"地",80)
						char.setInt(toindex,"水",20)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				elseif data == "-" then
					if char.getInt(toindex,"地") == 90 then
						char.setInt(toindex,"地",100)
						char.setInt(toindex,"水",0)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 80 then
						char.setInt(toindex,"地",90)
						char.setInt(toindex,"水",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 986 then
				if data == "+" then
					if char.getInt(toindex,"火") == 100 then
						char.setInt(toindex,"火",90)
						char.setInt(toindex,"风",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"火") == 90 then
						char.setInt(toindex,"火",80)
						char.setInt(toindex,"风",20)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				elseif data == "-" then
					if char.getInt(toindex,"火") == 90 then
						char.setInt(toindex,"火",100)
						char.setInt(toindex,"风",0)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"火") == 80 then
						char.setInt(toindex,"火",90)
						char.setInt(toindex,"风",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 1048 then
				if data == "+" then
					if char.getInt(toindex,"风") == 100 then
						char.setInt(toindex,"风",90)
						char.setInt(toindex,"火",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"风") == 90 then
						char.setInt(toindex,"风",80)
						char.setInt(toindex,"火",20)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				elseif data == "-" then
					if char.getInt(toindex,"风") == 90 then
						char.setInt(toindex,"风",100)
						char.setInt(toindex,"火",0)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"风") == 80 then
						char.setInt(toindex,"风",90)
						char.setInt(toindex,"火",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 3040 then   --地50 水50
				if data == "机猫+" then
					if char.getInt(toindex,"地") == 100 then
						char.setInt(toindex,"地",90)
						char.setInt(toindex,"水",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 90 then
						char.setInt(toindex,"地",80)
						char.setInt(toindex,"水",20)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 80 then
						char.setInt(toindex,"地",70)
						char.setInt(toindex,"水",30)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 70 then
						char.setInt(toindex,"地",60)
						char.setInt(toindex,"水",40)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 60 then
						char.setInt(toindex,"地",50)
						char.setInt(toindex,"水",50)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 50 then
						char.setInt(toindex,"地",40)
						char.setInt(toindex,"水",60)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 40 then
						char.setInt(toindex,"地",30)
						char.setInt(toindex,"水",70)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 30 then
						char.setInt(toindex,"地",20)
						char.setInt(toindex,"水",80)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 20 then
						char.setInt(toindex,"地",10)
						char.setInt(toindex,"水",90)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 10 then
						char.setInt(toindex,"地",0)
						char.setInt(toindex,"水",100)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")			
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				elseif data == "机猫-" then
					if char.getInt(toindex,"地") == 90 then
						char.setInt(toindex,"地",100)
						char.setInt(toindex,"水",0)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 80 then
						char.setInt(toindex,"地",90)
						char.setInt(toindex,"水",10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					elseif char.getInt(toindex,"地") == 70 then
						char.setInt(toindex,"地",80)
						char.setInt(toindex,"水",20)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 60 then
						char.setInt(toindex,"地",70)
						char.setInt(toindex,"水",30)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 50 then
						char.setInt(toindex,"地",60)
						char.setInt(toindex,"水",40)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 40 then
						char.setInt(toindex,"地",50)
						char.setInt(toindex,"水",50)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 30 then
						char.setInt(toindex,"地",40)
						char.setInt(toindex,"水",60)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 20 then
						char.setInt(toindex,"地",30)
						char.setInt(toindex,"水",70)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
					elseif char.getInt(toindex,"地") == 10 then
						char.setInt(toindex,"地",20)
						char.setInt(toindex,"水",80)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")	
	                elseif char.getInt(toindex,"地") == 0 then
						char.setInt(toindex,"地",10)
						char.setInt(toindex,"水",90)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					else
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 4559 then--机械水年（水8火2）
				if data == "机械+" then
					if char.getInt(toindex,"火") == 40 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"水",char.getInt(toindex,"水")-10)
						char.setInt(toindex,"火",char.getInt(toindex,"火")+10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				elseif data == "机械-" then
					if char.getInt(toindex,"水") == 100 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"水",char.getInt(toindex,"水")+10)
						char.setInt(toindex,"火",char.getInt(toindex,"火")-10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 4560 then--机械地年（风2地8）
				if data == "机械+" then
					if char.getInt(toindex,"地") == 100 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"地",char.getInt(toindex,"地")+10)
						char.setInt(toindex,"风",char.getInt(toindex,"风")-10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				elseif data == "机械-" then
					if char.getInt(toindex,"风") == 40 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"地",char.getInt(toindex,"地")-10)
						char.setInt(toindex,"风",char.getInt(toindex,"风")+10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 4561 then--机械火年（火8风2）
				if data == "机械+" then
					if char.getInt(toindex,"风") == 40 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"火",char.getInt(toindex,"火")-10)
						char.setInt(toindex,"风",char.getInt(toindex,"风")+10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				elseif data == "机械-" then
					if char.getInt(toindex,"火") == 100 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"火",char.getInt(toindex,"火")+10)
						char.setInt(toindex,"风",char.getInt(toindex,"风")-10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				end
			elseif char.getInt(toindex,"宠ID") == 4562 then--机械风年（火2风8）
				if data == "机械+" then
					if char.getInt(toindex,"风") == 100 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"风",char.getInt(toindex,"风")+10)
						char.setInt(toindex,"火",char.getInt(toindex,"火")-10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				elseif data == "机械-" then
					if char.getInt(toindex,"火") == 40 then
						char.newMessageToCli(charaindex, -1, "当前属性不能使用该道具", "白色")
					else
						char.setInt(toindex,"风",char.getInt(toindex,"风")-10)
						char.setInt(toindex,"火",char.getInt(toindex,"火")+10)
						char.DelItem(charaindex, haveitemindex)
						char.complianceParameter(toindex)
						char.sendStatusString(charaindex,"K" .. i)
						char.newMessageToCli(charaindex, -1, "当前属性以改变", "白色")
					end
				end
			end
			return
		end
	end
end

function data()
	
end


function main()
	data()
	item.addLUAListFunction( "ITEM_PETSHUXING", "petshuxing", "")
end