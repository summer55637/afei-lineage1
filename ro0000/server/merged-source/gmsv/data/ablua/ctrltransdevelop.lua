function FreeCtrlTransDevelop( petindex, id )
	local rnd = math.random(100)
		if char.getWorkInt( petindex, "NPC临时1") == 3344 then
			num = 4
		elseif char.getInt(petindex,"极品") >= 8 and char.getInt(petindex,"极品") <= 10 then
			if id == 0 then
				if rnd > 74 then
					num = 4
				elseif rnd > 50 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 72 then
					num = 4
				elseif rnd > 45 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 74 then
					num = 4
				elseif rnd > 50 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 74 then
					num = 4
				elseif rnd > 50 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") >= 15 and char.getInt(petindex,"极品") <= 18 then
			if id == 0 then
				if rnd > 72 then
					num = 4
				elseif rnd > 48 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 71 then
					num = 4
				elseif rnd > 48 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 72 then
					num = 4
				elseif rnd > 48 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 72 then
					num = 4
				elseif rnd > 48 then
					num = 3
				elseif rnd > 20 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") >= 25 and char.getInt(petindex,"极品") <= 29 then
			if id == 0 then
				if rnd > 72 then
					num = 4
				elseif rnd > 45 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 70 then
					num = 4
				elseif rnd > 42 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 72 then
					num = 4
				elseif rnd > 45 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 72 then
					num = 4
				elseif rnd > 45 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") >= 35 and char.getInt(petindex,"极品") <= 40 then
			if id == 0 then
				if rnd > 71 then
					num = 4
				elseif rnd > 35 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 69 then
					num = 4
				elseif rnd > 32 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 71 then
					num = 4
				elseif rnd > 35 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 71 then
					num = 4
				elseif rnd > 35 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") == 99 or char.getInt(petindex,"极品") == 167 or char.getInt(petindex,"极品") == 267 or char.getInt(petindex,"极品") == 380 or char.getInt(petindex,"极品") == 450 then
			if id == 0 then
				if rnd > 30 then
					num = 4
				elseif rnd > 20 then
					num = 3
				elseif rnd > 5 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 20 then
					num = 4
				elseif rnd > 10 then
					num = 3
				elseif rnd > 1 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 50 then
					num = 4
				elseif rnd > 22 then
					num = 3
				elseif rnd > 5 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 30 then
					num = 4
				elseif rnd > 15 then
					num = 3
				elseif rnd > 2 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") == 420 or char.getInt(petindex,"极品") == 666 or char.getInt(petindex,"极品") == 315 or char.getInt(petindex,"极品") == 238 or char.getInt(petindex,"极品") == 546 then
			if id == 0 then
				if rnd > 20 then
					num = 4
				elseif rnd > 10 then
					num = 3
				elseif rnd > 1 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 17 then
					num = 4
				elseif rnd > 10 then
					num = 3
				elseif rnd > 1 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 25 then
					num = 4
				elseif rnd > 10 then
					num = 3
				elseif rnd > 1 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 25 then
					num = 4
				elseif rnd > 15 then
					num = 3
				elseif rnd > 2 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") >= 700 then
			if id == 0 then
				if rnd > 55 then
					num = 4
				else
					num = 3
				end
			elseif id == 1 then
				if rnd > 55 then
					num = 4
				else
					num = 3
				end
			elseif id == 2 then
				if rnd > 55 then
					num = 4
				else
					num = 3
				end
			elseif id == 3 then
				if rnd > 55 then
					num = 4
				else
					num = 3
				end
			end
		elseif char.getInt(petindex,"极品") >= 250 then
			if id == 0 then
				if rnd > 62 then
					num = 4
				elseif rnd > 30 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 55 then
					num = 4
				elseif rnd > 25 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 60 then
					num = 4
				elseif rnd > 30 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 60 then
					num = 4
				elseif rnd > 30 then
					num = 3
				elseif rnd > 10 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") >= 150 then
			if id == 0 then
				if rnd > 66 then
					num = 4
				elseif rnd > 33 then
					num = 3
				elseif rnd > 12 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 61 then
					num = 4
				elseif rnd > 33 then
					num = 3
				elseif rnd > 12 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 65 then
					num = 4
				elseif rnd > 33 then
					num = 3
				elseif rnd > 12 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 65 then
					num = 4
				elseif rnd > 33 then
					num = 3
				elseif rnd > 12 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") >= 100 then
			if id == 0 then
				if rnd > 69 then
					num = 4
				elseif rnd > 35 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 64 then
					num = 4
				elseif rnd > 35 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 67 then
					num = 4
				elseif rnd > 35 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 67 then
					num = 4
				elseif rnd > 35 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		elseif char.getInt(petindex,"极品") >= 45 then
			if id == 0 then
				if rnd > 71 then
					num = 4
				elseif rnd > 40 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 69 then
					num = 4
				elseif rnd > 38 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 70 then
					num = 4
				elseif rnd > 40 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 70 then
					num = 4
				elseif rnd > 40 then
					num = 3
				elseif rnd > 15 then
					num = 2
				elseif rnd > 0 then
					num = 1
				else
					num = 0
				end
			end
		else
			if id == 0 then
				if rnd > 77 then
					num = 4
				elseif rnd > 53 then
					num = 3
				elseif rnd > 24 then
					num = 2
				elseif rnd > 3 then
					num = 1
				else
					num = 0
				end
			elseif id == 1 then
				if rnd > 76 then
					num = 4
				elseif rnd > 52 then
					num = 3
				elseif rnd > 23 then
					num = 2
				elseif rnd > 2 then
					num = 1
				else
					num = 0
				end
			elseif id == 2 then
				if rnd > 78 then
					num = 4
				elseif rnd > 55 then
					num = 3
				elseif rnd > 24 then
					num = 2
				elseif rnd > 3 then
					num = 1
				else
					num = 0
				end
			elseif id == 3 then
				if rnd > 78 then
					num = 4
				elseif rnd > 55 then
					num = 3
				elseif rnd > 24 then
					num = 2
				elseif rnd > 3 then
					num = 1
				else
					num = 0
				end
			end
		end
		return num

	
end

function data()
	
end

function main()
	data()
end

