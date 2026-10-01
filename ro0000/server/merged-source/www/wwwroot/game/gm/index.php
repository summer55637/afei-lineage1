<?php
require_once __DIR__ . '/bootstrap.php';

$error = '';
$characterName = isset($_GET['character_name']) ? trim((string) $_GET['character_name']) : '';
$accountInfo = null;
$items = array();

try {
    $db = gm_db();
    gm_install($db);

    if (!gm_is_logged_in() && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
        gm_verify_csrf();
        $username = gm_post_text('username', 64);
        $password = isset($_POST['password']) ? (string) $_POST['password'] : '';
        if (gm_login($username, $password)) {
            gm_flash('success', '登录成功。');
            header('Location: index.php');
            exit;
        }
        $error = '账号或密码错误。';
    }

    if (gm_is_logged_in() && $_SERVER['REQUEST_METHOD'] === 'POST') {
        gm_verify_csrf();
        $action = isset($_POST['action']) ? $_POST['action'] : '';

        if ($action === 'recharge') {
            $characterName = gm_validate_character_name(gm_post_text('character_name', 96));
            $vipPoint = gm_post_positive_int('vip_point', 2000000000);
            $payPoint = gm_post_positive_int('pay_point', 2000000000);
            $payTotal = gm_post_positive_int('pay_total', 2000000000);
            $rankPoint = gm_post_positive_int('rank_point', 2000000000);
            $remark = gm_post_text('remark', 120);

            if ($vipPoint + $payPoint + $payTotal + $rankPoint < 1) {
                throw new RuntimeException('至少填写一项充值数值。');
            }

            mysqli_query($db, 'START TRANSACTION');
            try {
                $current = gm_find_character($db, $characterName, true);
                if (!$current) {
                    throw new RuntimeException('未找到该角色名。');
                }
                $account = $current['Name'];

                $newVipPoint = (int) $current['VipPoint'] + $vipPoint;
                $newPayPoint = (int) $current['PayPoint'] + $payPoint;
                $newPayTotal = (int) $current['PayTotal'] + $payTotal;

                gm_execute(
                    $db,
                    'UPDATE `csalogin` SET `VipPoint` = ?, `PayPoint` = ?, `PayTotal` = ? WHERE `Name` = ?',
                    'iiis',
                    array($newVipPoint, $newPayPoint, $newPayTotal, $account)
                );

                if ($rankPoint > 0) {
                    gm_execute(
                        $db,
                        'INSERT INTO `paydata` (`cdkey`, `point`, `time`, `check`, `totalcheck`, `G_name`) VALUES (?, ?, NOW(), 0, 0, ?) ON DUPLICATE KEY UPDATE `point` = `point` + VALUES(`point`), `time` = NOW(), `G_name` = VALUES(`G_name`)',
                        'sis',
                        array($account, $rankPoint, 'GM后台')
                    );
                }

                if ($vipPoint > 0) {
                    $detail = $remark !== '' ? $remark : 'GM后台充值';
                    gm_execute(
                        $db,
                        'INSERT INTO `vippointlog` (`cdkey`, `point`, `oldpoint`, `newpoint`, `buff`, `time`) VALUES (?, ?, ?, ?, ?, NOW())',
                        'siiis',
                        array($account, $vipPoint, (int) $current['VipPoint'], $newVipPoint, $detail)
                    );
                }

                if ($payTotal > 0) {
                    gm_execute(
                        $db,
                        'INSERT INTO `paylog` (`id`, `cdkey`, `rmb`, `Time`, `check`) VALUES (?, ?, ?, NOW(), 1)',
                        'ssi',
                        array(gm_make_order_id(), $account, $payTotal)
                    );
                }

                gm_log_action(
                    $db,
                    'recharge',
                    $account,
                    $vipPoint,
                    $payPoint,
                    'pay_total=' . $payTotal . '; rank_point=' . $rankPoint . '; ' . $remark
                );
                mysqli_commit($db);
            } catch (Exception $e) {
                mysqli_rollback($db);
                throw $e;
            }

            gm_flash('success', '充值已完成：' . $account);
            header('Location: index.php?character_name=' . rawurlencode($characterName));
            exit;
        }

        if ($action === 'send_item') {
            $characterName = gm_validate_character_name(gm_post_text('character_name', 96));
            $itemOption = gm_post_text('item_option', 160);
            if (!preg_match('/^(\d+)\s*\|\s*(.*)$/u', $itemOption, $itemMatch)) {
                throw new RuntimeException('请从下拉框选择物品。');
            }
            $itemId = (int) $itemMatch[1];
            $item = gm_find_item($itemId);
            if (!$item) {
                throw new RuntimeException('所选物品不在物品清单中，请刷新页面后重试。');
            }
            $quantity = gm_post_positive_int('quantity', GM_MAX_ITEM_QUANTITY);
            $title = gm_post_text('title', 120);
            $content = gm_post_text('content', 240);

            if ($itemId < 0) {
                throw new RuntimeException('请选择正确的物品。');
            }
            if ($quantity < 1) {
                throw new RuntimeException('发放数量至少为 1。');
            }
            if ($title === '') {
                $title = 'GM 发放';
            }
            if ($content === '') {
                $content = 'GM 后台发放到背包。';
            }

            mysqli_query($db, 'START TRANSACTION');
            try {
                $current = gm_find_character($db, $characterName, true);
                if (!$current) {
                    throw new RuntimeException('未找到该角色名。');
                }
                if ((int) $current['Online'] !== 0) {
                    throw new RuntimeException('角色当前在线，请先下线后再发放到背包。');
                }
                $account = $current['Name'];

                $delivery = gm_give_item_to_bag($account, $item, $quantity);

                gm_log_action(
                    $db,
                    'send_item',
                    $account,
                    $itemId,
                    $quantity,
                    'bag_file; slots=' . implode(',', $delivery['slots']) . '; item=' . $item['name'] . '; remark=' . $title . '; ' . $content
                );
                mysqli_commit($db);
            } catch (Exception $e) {
                mysqli_rollback($db);
                throw $e;
            }

            gm_flash('success', '背包发放完成：' . $characterName . '，' . $item['name'] . '（' . $itemId . '）x ' . $quantity . '。请重新登录游戏查看。');
            header('Location: index.php?character_name=' . rawurlencode($characterName));
            exit;
        }
    }

    if (gm_is_logged_in()) {
        $items = gm_load_items();
    }

    if (gm_is_logged_in() && $characterName !== '') {
        $characterName = gm_validate_character_name($characterName);
        $accountInfo = gm_find_character($db, $characterName, false);
        if (!$accountInfo) {
            $error = '未找到角色名：' . $characterName;
        }
    }
} catch (Exception $e) {
    $error = $e->getMessage();
}

$flash = gm_take_flash();
$csrf = gm_csrf_token();
?>
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>石器时代 GM 后台</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; background: #f2f5f7; color: #1d2939; font: 14px/1.5 Arial, "Microsoft YaHei", sans-serif; letter-spacing: 0; }
a { color: inherit; }
.shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
.topbar { background: #152a3a; color: #fff; }
.topbar .shell { min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.brand { font-size: 20px; font-weight: 700; white-space: nowrap; }
.operator { display: flex; align-items: center; gap: 12px; color: #cbd5df; }
.link-button { color: #fff; text-decoration: none; border: 1px solid #5d7280; border-radius: 4px; padding: 6px 10px; }
.content { padding: 24px 0 40px; }
.notice { margin-bottom: 16px; border: 1px solid; border-radius: 6px; padding: 10px 12px; }
.notice.success { color: #0f5f43; background: #e8f7ef; border-color: #9fdbc0; }
.notice.error { color: #9f1f1f; background: #fff1f0; border-color: #f1b4af; }
.panel { background: #fff; border: 1px solid #d8e0e5; border-radius: 6px; padding: 18px; margin-bottom: 18px; }
.panel h2 { margin: 0 0 16px; font-size: 17px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: start; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { min-width: 0; }
label { display: block; margin-bottom: 5px; font-weight: 600; color: #344054; }
input, textarea { width: 100%; border: 1px solid #b8c5cd; border-radius: 4px; padding: 9px 10px; font: inherit; color: #1d2939; background: #fff; }
textarea { min-height: 82px; resize: vertical; }
input:focus, textarea:focus { outline: 2px solid #8cc7dc; outline-offset: 1px; border-color: #438aa6; }
.item-picker { position: relative; }
.item-menu { position: absolute; z-index: 20; top: calc(100% + 4px); left: 0; right: 0; display: none; border: 1px solid #b8c5cd; border-radius: 4px; background: #fff; box-shadow: 0 8px 18px rgba(19, 42, 58, .16); overflow: hidden; }
.item-scroll { height: 280px; overflow-y: auto; }
.item-spacer { position: relative; min-height: 1px; }
.item-results { position: absolute; left: 0; right: 0; top: 0; }
.item-choice { display: block; width: 100%; min-height: 34px; border: 0; border-radius: 0; padding: 7px 10px; color: #1d2939; background: #fff; text-align: left; font-weight: 400; }
.item-choice:hover, .item-choice:focus { background: #eaf5f9; color: #12485e; outline: 0; }
.item-empty { padding: 10px; color: #667085; }
.actions { display: flex; gap: 10px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
button { appearance: none; border: 1px solid #176b88; border-radius: 4px; padding: 9px 14px; color: #fff; background: #19769a; font: inherit; font-weight: 600; cursor: pointer; }
button:hover { background: #145f7c; }
.account-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
.stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.stat { border: 1px solid #dbe4e9; border-radius: 5px; padding: 12px; background: #f9fbfc; min-width: 0; }
.stat span { display: block; color: #667085; font-size: 12px; }
.stat strong { display: block; margin-top: 4px; overflow-wrap: anywhere; font-size: 18px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 720px; }
th, td { padding: 10px 8px; border-bottom: 1px solid #e3e8eb; text-align: left; vertical-align: top; }
th { color: #475467; background: #f7f9fa; font-weight: 600; white-space: nowrap; }
td { overflow-wrap: anywhere; }
.login { width: min(420px, calc(100% - 32px)); margin: 10vh auto; }
.login .panel { box-shadow: 0 10px 24px rgba(19, 42, 58, .08); }
@media (max-width: 760px) {
    .shell { width: min(100% - 20px, 1180px); }
    .topbar .shell { min-height: 58px; }
    .brand { font-size: 17px; }
    .grid, .field-grid, .stats { grid-template-columns: 1fr; }
    .content { padding-top: 14px; }
    .panel { padding: 14px; }
}
</style>
</head>
<body>
<?php if (!gm_is_logged_in()): ?>
<main class="login">
    <section class="panel">
        <h2>石器时代 GM 后台</h2>
        <?php if ($error !== ''): ?><div class="notice error"><?php echo gm_h($error); ?></div><?php endif; ?>
        <form method="post">
            <input type="hidden" name="action" value="login">
            <input type="hidden" name="csrf" value="<?php echo gm_h($csrf); ?>">
            <div class="field">
                <label for="username">账号</label>
                <input id="username" name="username" autocomplete="username" required>
            </div>
            <div class="field" style="margin-top:12px">
                <label for="password">密码</label>
                <input id="password" type="password" name="password" autocomplete="current-password" required>
            </div>
            <div class="actions">
                <button type="submit">登录</button>
            </div>
        </form>
    </section>
</main>
<?php else: ?>
<header class="topbar">
    <div class="shell">
        <div class="brand">石器时代 GM 后台</div>
        <div class="operator"><span><?php echo gm_h($_SESSION['gm_operator']); ?></span><a class="link-button" href="logout.php">退出</a></div>
    </div>
</header>
<main class="shell content">
    <?php if ($flash): ?><div class="notice <?php echo gm_h($flash['type']); ?>"><?php echo gm_h($flash['message']); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="notice error"><?php echo gm_h($error); ?></div><?php endif; ?>

    <section class="panel">
            <h2>角色查询</h2>
            <form method="get">
                <div class="account-row">
                <input name="character_name" value="<?php echo gm_h($characterName); ?>" maxlength="96" placeholder="输入角色名">
                <button type="submit">查询</button>
                </div>
            </form>
        <?php if ($accountInfo): ?>
        <div class="stats" style="margin-top:16px">
            <div class="stat"><span>游戏账号</span><strong><?php echo gm_h($accountInfo['Name']); ?></strong></div>
            <div class="stat"><span>角色名</span><strong><?php echo gm_h($accountInfo['OnlineName'] !== '' ? $accountInfo['OnlineName'] : '-'); ?></strong></div>
            <div class="stat"><span>金币 (VipPoint)</span><strong><?php echo gm_h($accountInfo['VipPoint']); ?></strong></div>
            <div class="stat"><span>积分 (PayPoint)</span><strong><?php echo gm_h($accountInfo['PayPoint']); ?></strong></div>
            <div class="stat"><span>累计充值 (PayTotal)</span><strong><?php echo gm_h($accountInfo['PayTotal']); ?></strong></div>
        </div>
        <?php endif; ?>
    </section>

    <div class="grid">
        <section class="panel">
            <h2>充值加点</h2>
            <form method="post">
                <input type="hidden" name="action" value="recharge">
                <input type="hidden" name="csrf" value="<?php echo gm_h($csrf); ?>">
                <div class="field">
                    <label for="recharge_character_name">角色名</label>
                    <input id="recharge_character_name" name="character_name" value="<?php echo gm_h($characterName); ?>" maxlength="96" required>
                </div>
                <div class="field-grid" style="margin-top:12px">
                    <div class="field"><label for="vip_point">金币 (VipPoint)</label><input id="vip_point" name="vip_point" inputmode="numeric" value="0"></div>
                    <div class="field"><label for="pay_point">积分 (PayPoint)</label><input id="pay_point" name="pay_point" inputmode="numeric" value="0"></div>
                    <div class="field"><label for="pay_total">累计充值 (PayTotal)</label><input id="pay_total" name="pay_total" inputmode="numeric" value="0"></div>
                    <div class="field"><label for="rank_point">活动积分 (PayData)</label><input id="rank_point" name="rank_point" inputmode="numeric" value="0"></div>
                </div>
                <div class="field" style="margin-top:12px">
                    <label for="recharge_remark">备注</label>
                    <input id="recharge_remark" name="remark" maxlength="120">
                </div>
                <div class="actions"><button type="submit">确认充值</button></div>
            </form>
        </section>

</main>
<?php endif; ?>
<?php if (gm_is_logged_in()): ?>
<script>
(function () {
    var search = document.getElementById('item_search');
    var value = document.getElementById('item_option');
    var menu = document.getElementById('item_menu');
    var scroll = document.getElementById('item_scroll');
    var spacer = document.getElementById('item_spacer');
    var results = document.getElementById('item_results');
    var form = search ? search.form : null;
    if (!search || !value || !menu || !scroll || !spacer || !results || !form) {
        return;
    }

    var items = <?php echo str_replace('</', '<\/', json_encode($items)); ?>;
    var filtered = items;
    var rowHeight = 34;
    var renderBuffer = 8;

    function itemText(item) {
        return item.id + ' | ' + item.name;
    }

    function selectItem(item) {
        var text = itemText(item);
        search.value = text;
        value.value = text;
        menu.style.display = 'none';
    }

    function render() {
        var start = Math.max(0, Math.floor(scroll.scrollTop / rowHeight) - renderBuffer);
        var visible = Math.ceil(scroll.clientHeight / rowHeight) + renderBuffer * 2;
        var end = Math.min(filtered.length, start + visible);
        var html = '';
        var i;

        spacer.style.height = Math.max(1, filtered.length * rowHeight) + 'px';
        results.style.transform = 'translateY(' + (start * rowHeight) + 'px)';

        if (filtered.length === 0) {
            results.style.transform = 'translateY(0)';
            html = '<div class="item-empty">没有匹配的物品</div>';
        } else {
            for (i = start; i < end; i++) {
                html += '<button class="item-choice" type="button" data-index="' + i + '">' + itemText(filtered[i]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</button>';
            }
        }
        results.innerHTML = html;
    }

    function filterItems(resetScroll) {
        var query = search.value.toLowerCase();
        var i;
        var item;
        filtered = [];
        value.value = '';

        for (i = 0; i < items.length; i++) {
            item = items[i];
            if (query === '' || String(item.id).indexOf(query) !== -1 || item.name.toLowerCase().indexOf(query) !== -1) {
                filtered.push(item);
            }
        }

        if (resetScroll) {
            scroll.scrollTop = 0;
        }
        render();
    }

    search.onfocus = function () {
        menu.style.display = 'block';
        filterItems(false);
    };
    search.oninput = function () {
        menu.style.display = 'block';
        filterItems(true);
    };
    search.onkeydown = function (event) {
        if (event.keyCode === 13 && filtered.length > 0) {
            event.preventDefault();
            selectItem(filtered[0]);
        }
    };
    scroll.onscroll = render;
    results.onclick = function (event) {
        var target = event.target;
        var index;
        while (target && target !== results && !target.getAttribute('data-index')) {
            target = target.parentNode;
        }
        if (!target || target === results) {
            return;
        }
        index = parseInt(target.getAttribute('data-index'), 10);
        if (!isNaN(index) && filtered[index]) {
            selectItem(filtered[index]);
        }
    };
    document.addEventListener('click', function (event) {
        if (!menu.parentNode.contains(event.target)) {
            menu.style.display = 'none';
        }
    });
    form.onsubmit = function (event) {
        if (value.value === '') {
            event.preventDefault();
            alert('请从物品列表中选择一项。');
        }
    };
    filterItems(true);
}());
</script>
<?php endif; ?>
</body>
</html>
