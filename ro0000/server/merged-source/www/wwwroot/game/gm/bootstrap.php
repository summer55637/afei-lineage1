<?php
require_once __DIR__ . '/config.php';

if (session_id() === '') {
    session_name('game_gm');
    session_start();
}

function gm_db()
{
    static $db = null;

    if ($db instanceof mysqli) {
        return $db;
    }

    $db = mysqli_connect(GM_DB_HOST, GM_DB_USER, GM_DB_PASSWORD, GM_DB_NAME);
    if (!$db) {
        throw new RuntimeException('数据库连接失败：' . mysqli_connect_error());
    }

    mysqli_set_charset($db, 'utf8');
    return $db;
}

function gm_install($db)
{
    $sql = "CREATE TABLE IF NOT EXISTS `" . GM_LOG_TABLE . "` (
        `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        `operator_name` varchar(64) NOT NULL,
        `action_type` varchar(32) NOT NULL,
        `account` varchar(16) NOT NULL,
        `value1` int(11) NOT NULL DEFAULT '0',
        `value2` int(11) NOT NULL DEFAULT '0',
        `detail` varchar(255) NOT NULL DEFAULT '',
        `ip` varchar(64) NOT NULL DEFAULT '',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `account_created_at` (`account`, `created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8";

    if (!mysqli_query($db, $sql)) {
        throw new RuntimeException('创建 GM 日志表失败：' . mysqli_error($db));
    }

}

function gm_h($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function gm_is_logged_in()
{
    return !empty($_SESSION['gm_logged_in']);
}

function gm_login($username, $password)
{
    if ($username === GM_ADMIN_USERNAME && $password === GM_ADMIN_PASSWORD) {
        session_regenerate_id(true);
        $_SESSION['gm_logged_in'] = 1;
        $_SESSION['gm_operator'] = GM_ADMIN_USERNAME;
        return true;
    }

    return false;
}

function gm_logout()
{
    $_SESSION = array();
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function gm_csrf_token()
{
    if (empty($_SESSION['gm_csrf'])) {
        if (function_exists('random_bytes')) {
            $_SESSION['gm_csrf'] = bin2hex(random_bytes(32));
        } elseif (function_exists('openssl_random_pseudo_bytes')) {
            $_SESSION['gm_csrf'] = bin2hex(openssl_random_pseudo_bytes(32));
        } else {
            $_SESSION['gm_csrf'] = sha1(uniqid(mt_rand(), true));
        }
    }

    return $_SESSION['gm_csrf'];
}

function gm_verify_csrf()
{
    $token = isset($_POST['csrf']) ? $_POST['csrf'] : '';
    if ($token === '' || empty($_SESSION['gm_csrf']) || $token !== $_SESSION['gm_csrf']) {
        throw new RuntimeException('页面已过期，请刷新后重试。');
    }
}

function gm_flash($type, $message)
{
    $_SESSION['gm_flash'] = array('type' => $type, 'message' => $message);
}

function gm_take_flash()
{
    if (empty($_SESSION['gm_flash'])) {
        return null;
    }

    $flash = $_SESSION['gm_flash'];
    unset($_SESSION['gm_flash']);
    return $flash;
}

function gm_post_text($key, $maxLength)
{
    $value = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    if (strlen($value) > $maxLength) {
        throw new RuntimeException('输入内容过长。');
    }
    return $value;
}

function gm_post_positive_int($key, $maxValue)
{
    $value = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    if ($value === '') {
        return 0;
    }
    if (!preg_match('/^\d+$/', $value)) {
        throw new RuntimeException('数值只能填写非负整数。');
    }

    $number = (int) $value;
    if ($number < 0 || $number > $maxValue) {
        throw new RuntimeException('数值超出允许范围。');
    }

    return $number;
}

function gm_validate_character_name($characterName)
{
    if ($characterName === '' || strlen($characterName) > 96) {
        throw new RuntimeException('角色名不能为空，且不能超过 96 个字节。');
    }
    if (preg_match('/[\x00-\x1F\x7F]/', $characterName)) {
        throw new RuntimeException('角色名包含非法字符。');
    }
    return $characterName;
}

function gm_find_character($db, $characterName, $forUpdate)
{
    $sql = 'SELECT `Name`, `OnlineName`, `Online`, `VipPoint`, `PayPoint`, `PayTotal` FROM `csalogin` WHERE `OnlineName` = ? ORDER BY `Name` LIMIT 2';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = mysqli_prepare($db, $sql);
    if (!$stmt) {
        throw new RuntimeException('角色名查询准备失败：' . mysqli_error($db));
    }

    mysqli_stmt_bind_param($stmt, 's', $characterName);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_bind_result($stmt, $name, $onlineName, $online, $vipPoint, $payPoint, $payTotal);
    $rows = array();
    while (mysqli_stmt_fetch($stmt)) {
        $rows[] = array(
            'Name' => $name,
            'OnlineName' => $onlineName,
            'Online' => $online,
            'VipPoint' => $vipPoint,
            'PayPoint' => $payPoint,
            'PayTotal' => $payTotal
        );
    }
    mysqli_stmt_close($stmt);

    if (count($rows) > 1) {
        throw new RuntimeException('找到多个同名角色，请先处理重名角色后再操作。');
    }

    return count($rows) === 1 ? $rows[0] : null;
}

function gm_load_items()
{
    static $items = null;

    if ($items !== null) {
        return $items;
    }

    $path = __DIR__ . '/items.json';
    if (!is_readable($path)) {
        throw new RuntimeException('物品清单不存在，请联系管理员。');
    }

    $decoded = json_decode(file_get_contents($path), true);
    if (!is_array($decoded)) {
        throw new RuntimeException('物品清单格式错误，请重新生成。');
    }

    $items = array();
    foreach ($decoded as $item) {
        if (!is_array($item) || !isset($item['id']) || !isset($item['name'])) {
            continue;
        }

        $id = (int) $item['id'];
        if ($id < 0 || $id > 999999) {
            continue;
        }

        $items[] = array(
            'id' => $id,
            'name' => trim((string) $item['name']) !== '' ? trim((string) $item['name']) : '未命名物品'
        );
    }

    if (!$items) {
        throw new RuntimeException('物品清单为空，请重新生成。');
    }

    return $items;
}

function gm_find_item($itemId)
{
    foreach (gm_load_items() as $item) {
        if ((int) $item['id'] === (int) $itemId) {
            return $item;
        }
    }

    return null;
}

function gm_char_file_path($account)
{
    $account = (string) $account;
    if ($account === '' || preg_match('/[\/\\\\\x00-\x1F\x7F]/', $account)) {
        throw new RuntimeException('账号格式不正确，无法定位角色存档。');
    }

    $bucket = 0;
    $bytes = strlen($account);
    for ($i = 0; $i < $bytes; $i++) {
        $bucket = ($bucket + ord($account[$i])) & 0xff;
    }

    $path = rtrim(GM_SAAC_CHAR_DIR, '/\\') . '/0x' . dechex($bucket) . '/' . $account . '.0.char';
    if (!is_file($path) || !is_readable($path)) {
        throw new RuntimeException('未找到角色存档：' . $account . '。请确认角色已创建且游戏服已落盘。');
    }

    return $path;
}

function gm_char_value($value)
{
    $value = trim((string) $value);
    $value = str_replace(array('\\', "\r", "\n"), '', $value);
    return $value;
}

function gm_make_char_item($item, $slot, $serial)
{
    $name = gm_char_value($item['name']);
    if ($name === '') {
        $name = '未命名物品';
    }

    return '\\aitem' . (int) $slot
        . '=id=' . (int) $item['id']
        . '\\zna=' . $name
        . '\\zsn=' . $name
        . '\\zen=GM后台发放'
        . '\\zucode=' . (int) $serial . 'i' . (int) $slot . '1100';
}

function gm_give_item_to_bag($account, $item, $quantity)
{
    $path = gm_char_file_path($account);
    $handle = @fopen($path, 'c+b');
    if (!$handle) {
        throw new RuntimeException('角色存档不可写。请给网站运行用户授予该目录的写权限。');
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        throw new RuntimeException('角色存档当前被占用，请稍后重试。');
    }

    try {
        rewind($handle);
        $content = stream_get_contents($handle);
        if ($content === false || $content === '') {
            throw new RuntimeException('角色存档为空或读取失败，未执行发放。');
        }

        $emptySlots = array();
        for ($slot = 9; $slot <= 23; $slot++) {
            if (!preg_match('/\\\\aitem' . $slot . '=/', $content)) {
                $emptySlots[] = $slot;
            }
        }

        if (count($emptySlots) < (int) $quantity) {
            throw new RuntimeException('角色背包空位不足：剩余 ' . count($emptySlots) . ' 格，需要 ' . (int) $quantity . ' 格。');
        }

        $serial = time();
        $tokens = array();
        $usedSlots = array();
        for ($i = 0; $i < (int) $quantity; $i++) {
            $slot = $emptySlots[$i];
            $tokens[] = gm_make_char_item($item, $slot, $serial + $i);
            $usedSlots[] = $slot;
        }

        $insertAt = strpos($content, '\\apet0=');
        if ($insertAt === false) {
            $insertAt = strpos($content, '\\aDATAEND=');
        }
        if ($insertAt === false) {
            throw new RuntimeException('角色存档格式不兼容，未执行发放。');
        }

        $updated = substr($content, 0, $insertAt)
            . implode('', $tokens)
            . substr($content, $insertAt);

        $backupDir = __DIR__ . '/backups/char';
        if (!is_dir($backupDir) && !@mkdir($backupDir, 0750, true) && !is_dir($backupDir)) {
            throw new RuntimeException('无法创建存档备份目录，未执行发放。');
        }
        $backupPath = $backupDir . '/' . basename($path) . '.' . date('YmdHis') . '.bak';
        if (@file_put_contents($backupPath, $content, LOCK_EX) === false) {
            throw new RuntimeException('无法创建存档备份，未执行发放。');
        }

        if (ftruncate($handle, 0) === false || fseek($handle, 0, SEEK_SET) !== 0 || fwrite($handle, $updated) !== strlen($updated)) {
            throw new RuntimeException('写入角色存档失败，未完成发放。');
        }
        fflush($handle);

        return array(
            'slots' => $usedSlots,
            'backup' => $backupPath
        );
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}


function gm_execute($db, $sql, $types, $params)
{
    $stmt = mysqli_prepare($db, $sql);
    if (!$stmt) {
        throw new RuntimeException('SQL 准备失败：' . mysqli_error($db));
    }

    if ($types !== '') {
        $bind = array($stmt, $types);
        foreach ($params as $key => $value) {
            $bind[] = &$params[$key];
        }
        call_user_func_array('mysqli_stmt_bind_param', $bind);
    }

    if (!mysqli_stmt_execute($stmt)) {
        $message = mysqli_stmt_error($stmt);
        mysqli_stmt_close($stmt);
        throw new RuntimeException('SQL 执行失败：' . $message);
    }

    mysqli_stmt_close($stmt);
}

function gm_log_action($db, $type, $account, $value1, $value2, $detail)
{
    $operator = isset($_SESSION['gm_operator']) ? $_SESSION['gm_operator'] : 'admin';
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    gm_execute(
        $db,
        'INSERT INTO `' . GM_LOG_TABLE . '` (`operator_name`, `action_type`, `account`, `value1`, `value2`, `detail`, `ip`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        'sssiiss',
        array($operator, $type, $account, $value1, $value2, $detail, $ip)
    );
}

function gm_make_order_id()
{
    return 'GM' . date('YmdHis') . mt_rand(100000, 999999);
}

function gm_recent_logs($db)
{
    $result = mysqli_query(
        $db,
        'SELECT `operator_name`, `action_type`, `account`, `value1`, `value2`, `detail`, `ip`, `created_at` FROM `' . GM_LOG_TABLE . '` ORDER BY `id` DESC LIMIT 20'
    );

    $rows = array();
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }
        mysqli_free_result($result);
    }
    return $rows;
}
