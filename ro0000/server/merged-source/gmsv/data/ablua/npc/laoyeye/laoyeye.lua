function checkEmptPetNum(charaindex)
	EmptyPetNum = 0
	for i = 1, 5 do
		if char.getCharPet(charaindex, i - 1) == -1 then
			EmptyPetNum = EmptyPetNum + 1
		end
	end
	return EmptyPetNum
end
--NPC对话事件(NPC索引)
function Talked(talkerindex,type)
	if type == 1 then--1.1
		token = char.getChar(npcindex,"名字") .. "|4|HI~你好，年轻人。欢迎您来到《石器时代》尼斯大陆。|从您的眼中我看到了对力量的渴望以及感受到了你冒险的精神。|在您开始踏入尼斯大陆冒险之旅前，先给自己找一个可靠的伙伴吧。|先去找宠物店长，他会给予您帮助哦^-^"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 2 then--2.1
		token = char.getChar(npcindex,"名字") .. "|4|很好，年轻人，竟然有了守护兽作为伙伴|不过守护兽虽然强大，但你们之间需要默契的配合才能面对未知的危险哦|这里呢，我为你准备了一份特殊的训练，完成会给你丰富奖励哦|首先，先将你的宠物调整为战斗状态"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 3 then--2.3
		token = char.getChar(npcindex,"名字") .. "|2|接下来....|我会教你如何在战斗中与你的守护兽取得胜利，下面请你认真听我说哦，请在接下来的战斗中使用攻击，宠物攻击，自动攻击这三项指令"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 4 then--2.5
		token = char.getChar(npcindex,"名字") .. "|3|学的很快哦，相信你已经知道怎样攻击对方了吧，一定要记住哦，攻击才是最好的防守|当遇到过于强大的敌人时，或者自己的血量过少时，选择防御和逃跑也是个明智之举呢。|请您再接下来的战斗中使用防御和逃跑两个指令"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 5 then--2.7
		token = char.getChar(npcindex,"名字") .. "|1|光是提升等级是远远不够的，还需要将升级的点数进行配置，才能真正的强大噢，现在来教你如何配置点数。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 6 then--3.1
		token = char.getChar(npcindex,"名字") .. "|2|相信你已经学会了如何去战斗了吧，但何时使用哪种指令，掌握战斗的技巧，需要你慢慢体会了|希望你能努力学习，踏上王者的巅峰…..       这是一些小礼物，请收下吧。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 7 then--3.3
		token = char.getChar(npcindex,"名字") .. "|2|很棒的年轻人呢，哈哈~勇敢又聪明，你的身影让我想起了当年的英雄萨姆吉尔~~在尼斯大陆上我们人类并不孤单，与你的守护兽一起见证这块充满奇迹的大陆|对了，打开背包看看送你的礼物吧，使用后会让你更强大。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 8 then--4.1
		token = char.getChar(npcindex,"名字") .. "|1|在你正式出村踏上冒险前，还有一个技巧得教会你，刚才礼物中还有一件仪之铠，装备后就能使用咒术回复自己的生命值，并且可以通过战斗设置，在战斗中自动使用哦。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 9 then--5.1
		token = char.getChar(npcindex,"名字") .. "|4|.好了，现在你可以踏上自己的旅程了。|就如我刚开始所说的，这个世界有着太多的未知等着你去探险，但是想要获知更多的秘密，潜心修炼是必不可少的哦。|你可以继续跟着指引前往未知的练级地点进行修炼，当然也可以自行安排修行的路线。|等你变的更强时，我还会教你更多技巧。现在就去踏出属于你自己的第一步吧"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 11 then--6.1
		token = char.getChar(npcindex,"名字") .. "|4|勇敢的年轻人我们有一段时间不见了，看来你成长了许多，从你的眼神中我能看出，你的冒险热情依然没有丝毫的减退，哈哈。|现在我教你如何去料理与合成。正如你所看到的，我们的世界是个原始的大陆，同时也充满着无限可能的世界，我们可以用各种材料来制作对自己有帮助的物品。|赶紧去24小时便利店看看吧，那里有你需要的低级材料。。。啊！差点忘了，你得先去宠物店让你的宠物学习合成与料理技能才行的。|唉。。。人老啦，记性不如从前咯~~~~"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 12 then--7.1
		token = char.getChar(npcindex,"名字") .. "|4|怎么样？是不是觉得很神奇。我们生活在大自然中，当然也可以借助大自然的力量让我们得到一些便利。|好了，经过这段时间的历练，我觉得你可以去参加成人仪式了。|这是尼斯大陆上祖传下来的一项试炼，任何一个有作为的人，都是从这一步开始的，就连英雄萨姆吉尔也不例外哦。|请前往柯奥村，开始你的成人试炼之路吧~~"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 13 then--8.1
		token = char.getChar(npcindex,"名字") .. "|5|哦，年轻人~你竟然通过了试炼。|我现在能从你身上感受到蜕变，还记得当年我通过试炼后的那种兴奋。|终于可以踏上更加凶险的旅程了。|快看看刚刚获得的强力战宠吧。|我将教你如何让它带你驰聘沙场,骑上坐骑不仅拉风，也会使你更强大。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 14 then--8.3
		token = char.getChar(npcindex,"名字") .. "|1|现在我教你怎么增加你与宠物之间的亲密度哦，如果你的宠物忠诚度过低，宠物会不听你的指令，严重的可是会逃跑的"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 15 then--9.1
		token = char.getChar(npcindex,"名字") .. "|2|未来的前方有更多的试炼等着你去挑战哦。 |不过在这之前，你需要更好的提升自己的实力才行。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 16 then--10.1
		token = char.getChar(npcindex,"名字") .. "|3|HOHOHO~~看着你一天一天成长变强，真是一件开心的事情。看出来变强了很多嘛~~该教会你如何去捕捉新的宠物了|其实很简单，在战斗中使用抓捕技能就能捕捉宠物了，捕捉是有一定几率的，你的个人魅力与速度越高，更容易捕捉成功，怪物的血量越低也会提高捕捉成功率哦。|赶紧试试吧…对了，我为你准备了新的礼物呢"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 17 then--10.3
		token = char.getChar(npcindex,"名字") .. "|3|小伙子这武器来头还不小喔，可是我当年在尼斯大陆的神秘洞窟中发现的，陪伴了我一辈子|现在装备上之后是不是感觉自己更加强力了.需要说明的不是每把武器上都有精灵的喔|这把武器上的精灵是剧毒精灵，对你今后抓捕宠物有巨大帮助喔.HOHOHO~"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 18 then--10.4
		token = char.getChar(npcindex,"名字") .. "|3|恭喜你，已经学会了抓捕宠物，以后在外就可以抓捕自己喜爱的宠物了。|当然有些恐怖的生物你是抓不到的。|快来看下为你准备的奖励吧，可以让你的宠物瞬间变得强大。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 19 then--11.1
		token = char.getChar(npcindex,"名字") .. "|1|接下来你将会迎接下一个挑战，不过在这之前，你还是得先提升自己的实力会更好的面对挑战."
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 20 then--12.1
		token = char.getChar(npcindex,"名字") .. "|2|在吉鲁岛上流传着一个五兄弟的传说，他们会给路过的冒险者安排试炼，成功突破试炼的人，就可以获得稀有的奖励|你要不要去挑战一下呢？"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 21 then--13.1
		token = char.getChar(npcindex,"名字") .. "|4|原来是5个喜欢猜谜的人龙兄弟，这块大陆还真是不可思议呀。|有时候忘记纷争，忘记自己的职责，投身于自己的兴趣之中，未必不是一种幸事哦。|抱歉，人上了年纪了，就容易胡思乱想。你的冒险之心，还在熊熊的燃烧。准备好迎接下一个挑战了吗？|不过在这之前，还是要提升实力，因为下一个挑战将会非常的危险."
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 22 then--14.1
		token = char.getChar(npcindex,"名字") .. "|3|年轻人你的成长大家有目共睹，真是进步神速呢. |在尼斯大陆有种类繁多的宠物，我这里有本宠物图鉴要送给你，里面收录了所有宠物的抓捕和获取方法喔 .|我先教你如何使用宠物图鉴吧."
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 23 then--15.1
		token = char.getChar(npcindex,"名字") .. "|1|不要以为你现在已经够强大了，锻炼不可松懈，加油提升自己的等级吧。"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 24 then--16.1
		token = char.getChar(npcindex,"名字") .. "|2|在你成长的这一路上，想必也听过英雄萨姆吉尔的名字吧，他是这个尼斯大陆最受尊敬的英雄。|去追随他的足迹，完成他曾经完成的试炼，证明你也能成为这个大陆的传奇~~"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 25 then--16.3
		token = char.getChar(npcindex,"名字") .. "|4|你已经拥有足够的实力了，可以完成转生了，不过你要修炼极品人，还是远远不够的，建议首先将等级提升至131级。|这片大陆还有很多事迹等你去探索。你可以通过剧情任务去完成这些试炼，当你完成所有的剧情任务后再去转生，你会获得更强的实力。|更好的认识这个世界吧，让自己变的更强大，我陪伴你的日子也要告一段落了，我这个老头子只能给予你指引，前方的道路必须你自己去探索了~|好了，在不久的将来，我相信还会出现在你的面前，指引你达到更高的境界，到那时候再见吧.HOHOHO~~"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 26 then--10.7
		token = char.getChar(npcindex,"名字") .. "|2|我已经教会你如何抓宠了，怎么样宠物瞬间提升等级的感觉非常好吧。之后你也可以自己制作经验丹来瞬间提升你宠物的等级|现在还是来好好提升等级准备接下来的挑战吧"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 27 then--10.8.1
		token = char.getChar(npcindex,"名字") .. "|2|看来你已经掌握了不少技巧了，但是还远远不够，在尼斯大陆有一种货币叫“声望”，你可以拿声望换到强力的道具，对你今后的成长有功不可没的作用.|在你之前的成长中已经获得不菲的声望了，我教你如何使用声望."
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 28 then--10.8.3
		token = char.getChar(npcindex,"名字") .. "|3|刚刚让你购买物品是免修石，可以让你的武器永不磨损. |在尼斯大陆只有极为稀少的装备是不会损坏的，大部分装备损坏后是无法修理的|现在将你的进阶武器与免修石进行合成吧"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	elseif type == 29 then--14.3
		token = char.getChar(npcindex,"名字") .. "|3|看来你已经非常了解宠物图鉴的功能了，将来可以收集自己的宠物图鉴|在修炼等级之前，我先教你如何快速获取石币的方法吧，在尼斯大陆石币是必不可少的货币|之后你还想赚取石币可以前往娱乐互动线的玛丽娜丝村医院找捕鱼达人参加娱乐捕鱼来获取石币"
		lssproto.windows(talkerindex, 0, 8, type, char.getWorkInt( npcindex, "对象"), token)
	end
end

--NPC窗口事件(NPC索引)
function WindowTalked ( meindex, talkerindex, seqno, select, data)
	if data ~= "C|" then
		return
	end
	if seqno == 1 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,306,1})
	elseif seqno == 2 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,301,1})
	elseif seqno == 3 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,301,3})
	elseif seqno == 4 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,301,5})
	elseif seqno == 5 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,301,7})
	elseif seqno == 6 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,302,1})
	elseif seqno == 7 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,302,3})
	elseif seqno == 8 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,303,1})
	elseif seqno == 9 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,308,2})
	elseif seqno == 11 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,309,1})
	elseif seqno == 13 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,305,1})
	elseif seqno == 14 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,305,3})
	elseif seqno == 15 then
		lssproto.windows(talkerindex, 1039, 0, 0, -1, "602|1")
	elseif seqno == 16 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,304,1})
	elseif seqno == 17 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,304,3})
	elseif seqno == 18 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,304,5})	
	elseif seqno == 19 then
		lssproto.windows(talkerindex, 1039, 0, 0, -1, "603|1")
	elseif seqno == 21 then
		lssproto.windows(talkerindex, 1039, 0, 0, -1, "604|1")
	elseif seqno == 22 then
		--弹出宠物图鉴
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,310,1})
	elseif seqno == 23 then
		char.Additem(talkerindex,21008)
		lssproto.windows(talkerindex, 1039, 0, 0, -1, "605|1")
	elseif seqno == 26 then
		lssproto.windows(talkerindex, 1039, 0, 0, -1, "616|1")
	elseif seqno == 27 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,311,1})
	elseif seqno == 28 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,311,4})
	elseif seqno == 29 then
		other.CallFunction("NewPlayerFlg","data/ablua/newplayer.lua",{talkerindex,312,1})
	end
end


function Create(name, metamo, floor, x, y, dir)
	--创建NPC(NPC名字，图像号，地图号，坐标X，坐标Y，方向号)将返回一个NPC索引
	npcindex = npc.CreateNpc(name, metamo, floor, x, y, dir)
	--设置事件触发(NPC索引，事件，执行函数，执行函数文件路径)
	--char.setFunctionPointer(npcindex, "对话事件", "Talked", "")
	char.setFunctionPointer(npcindex, "窗口事件", "WindowTalked", "")
end

function data()
	
end

function main()
	data()
	Create("老爷爷", 16016, 777, 16, 13, 4)
end