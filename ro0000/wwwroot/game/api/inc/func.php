<?php
define('MAGIC_QUOTES_GPC', function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc());

function daddslashes($string, $force = 1) {
	if(is_array($string)) {
		foreach($string as $key => $val) {
			unset($string[$key]);
			$string[addslashes($key)] = daddslashes($val, $force);
		}
	} else {
		$string = addslashes($string);
	}
	return $string;
}
if(!MAGIC_QUOTES_GPC) {
$_GET = daddslashes($_GET);
$_POST = daddslashes($_POST);
$_COOKIE = daddslashes($_COOKIE);
}
function Error($msg) {
echo("
   <Script>
   window.alert(\"$msg\")
   history.go(-1)
   </Script>"); 
   exit;

}
function tiaozhuan($msg,$goto) {
echo("
   <Script>
   window.alert(\"$msg\");
   window.location.href=\"$goto\";
   </Script>"); 
   exit;

}

function post_check($value) { 
	if(!$value) return ""; 
    if(!get_magic_quotes_gpc()) {
        // 进行过滤   
        $value = addslashes($value);
    } 
    $value = str_replace("_", "\_", $value); 
    $value = str_replace("%", "\%", $value); 
    $value = nl2br($value); 
    $value = htmlspecialchars($value); 
    return $value; 

}
function check_param($value=null) {
    $str = 'select|insert|and|or|update|delete|\'|\/\*|\*|\.\.\/|\.\/|union|into|load_file|outfile';
    if(!$value) {
        exit('没有参数！');
    }elseif(eregi($str, $value)) {
        exit('参数非法！');
    }
    return true;
}
function isAlNum($str) {
	if(preg_match('/^[0-9]\d*$/',$str)) return 0;
	return 1;
}
function isemail( $str ) {
if( preg_match("/^([0-9A-Za-z\\-_\\.]+)@([0-9a-z]+\\.[a-z]{2,3}(\\.[a-z]{2})?)$/i", $str) ) return 0;
else return 1; 
}
function isdata( $str ) {
if( preg_match("/^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})$/", $str) ) return 0;
else return 1; 
}
function ismomey( $str ) {
	if (strlen($str) <1){
	return 1; 
	}
if( preg_match("/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/", $str) ){
	return 0;
}else{
	return 1; 
}


}
function ismomeysf( $str ) {
if( preg_match("/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/", $str) ){
	return 0;
}else{
	return 1; 
}


}
function datajia($str,$strb,$dd){
	$fgdata=explode("-",$str);
	$fgdatab=explode("-",$strb);
	if( (int)$fgdata[0] = (int)$fgdatab[0] and (int)$fgdata[1] = (int)$fgdatab[1] ){
		return $strb;
	}else{
		$mjia=(int)$fgdata[1] + 1;
		return $fgdata[0].'-'.$mjia.'-'.$dd;
	}	
}
function add_data($str,$rizi){
	$dd=date("Y-m-d 10:00:00",strtotime("{$str} + {$rizi} day"));
	return $dd;
}
function daydiff($stra,$strb){
    $startdate=strtotime($stra);
    $enddate=strtotime($strb);
    $days=round(($enddate-$startdate)/3600/24);
return $days;
}
function dayover($stra,$strb){
    $startdate=strtotime($stra);
    $enddate=strtotime($strb);
    if($enddate>=$startdate){
		return 1;
	}else{
		return 0;
	}
}
function dataformat($str){
	if($str){
	return date('d/m/Y',strtotime($str));
	}else{
		return "";
	}
}

function checknext($lun,$gid,$nextime,$jiage,$endtime,$dayadd,$over=0)
{	
	$db = new Db();
	$oks=0;
	if($over==1){
		$cet=dayover($endtime,date( "YmdHis" ));
		$okss=2;//结束
	}else{
		$cet=dayover($nextime,date( "YmdHis" ));
		$okss=1;//下一轮
	}
	if($cet==1){
		$oks=$okss;
	}
	
	if($oks>0){
		$player = $db->table('`userdata`')->where("`gid`={$gid} and `lun`={$lun}")->limit()->order('zt asc,momey desc,uptime asc')->select();
		$id=0;
		$winsm=$jiage;
		$winterm=0;
		$dies=0;
		$zts=0;
		$uids=0;
		foreach($player as $key => $rs){
			$zt=$rs['zt'];
			if($key==0){
				$id=$rs['id'];
				$uids=$rs['uid'];
				$winterm=$jiage-$rs['momey'];
				$dies=$rs['dead']+1;
				$rs['dead']=$dies;
				if($dies >= $rs['fenshu']){
					$zts=1;
					$zt=1;
				}
				
			}else{
				$fs=$rs['fenshu'] - $rs['dead'];
				if( $fs < 1){
					$hwin=$jiage * $rs['fenshu'];
				}else{
					$hwin=($winterm * $fs) + ($jiage * $rs['dead']);
				}
				$winsm=$winsm+$hwin;
				$db->table('userdata')->where("`id` = {$rs['id']}")->update(array('wins'=>$hwin * -1 ));
				
			}
			
			if($oks==1){
					$db->table('userdata')->insert(array(
						'gid'=>$gid,
						'uid'=>$rs['uid'],
						'uname'=>$rs['uname'],
						'sex'=>$rs['sex'],
						'pass'=>$rs['pass'],
						'dead'=>$rs['dead'],
						'fenshu'=>$rs['fenshu'],
						'lv'=>$rs['lv'],
						'lun'=>$lun+1,
						'zt'=>$zt,
						'momey'=>0,
						'uptime'=>date( "YmdHis" ),
						'urlid'=>$rs['urlid']
						));
			}
			
		}
		$db->table('userdata')->where("`id` = {$id}")->update(array('wins'=>$winsm,'win_lun'=>$lun,'dead'=>$dies,'zt'=>$zts));
		if($oks==1){
			$db->table('gamedata')->where("`id` = {$gid}")->update(array('lun'=>$lun+1,'nexttime'=>add_data($nextime,$dayadd)));
		}else{
			$db->table('gamedata')->where("`id` = {$gid}")->update(array('zt'=>2));
			//$db->sqls("UPDATE `user` SET `nowgame`=`nowgame`-1 WHERE `id` = {$uids}");
		}
		return 1;
	}else{
		return 0;
	}
}
/**
 * [array_group_by ]
 * @param  [type] $arr [二维数组]
 * @param  [type] $key [键名]
 * @return [type]      [新的二维数组]
 */
function array_group_by($arr, $key){
    $grouped = array();
    foreach ($arr as $value) {
        $grouped[$value[$key]][] = $value;
    }
    if (func_num_args() > 2) {
        $args = func_get_args();
        foreach ($grouped as $key => $value) {
            $parms = array_merge($value, array_slice($args, 2, func_num_args()));
            $grouped[$key] = call_user_func_array('array_group_by', $parms);
        }
    }
    return $grouped;
}
/**
 * [array_by ]
 * @param  [type] $arr [二维数组]
 * @param  [type] $key [键名]
 * @param  [type] $val [值名]
 * @return [type]      [新的二维数组]
 */
function array_by($arr, $key,$val){
    $grouped = array();
    foreach ($arr as $value) {
        $grouped[$value[$key]]= $value[$val];
    }
    return $grouped;
}
/**
		 * 输出json格式数据（脚本中断）
		 * @param  [type] $data [description]
		 * @return [type]       [description]
		 */
function json($data=null){
	ob_end_clean();
	header('Content-Type:application/json; charset=utf-8');
	die(json_encode($data,JSON_UNESCAPED_UNICODE));
}

function getip_dl() {
   if (getenv("HTTP_CLIENT_IP") && strcasecmp(getenv("HTTP_CLIENT_IP"), "unknown"))
   $ip = getenv("HTTP_CLIENT_IP");

   else if (getenv("HTTP_X_FORWARDED_FOR") && strcasecmp(getenv("HTTP_X_FORWARDED_FOR"), "unknown"))
   $ip = getenv("HTTP_X_FORWARDED_FOR");

   else if (getenv("REMOTE_ADDR") && strcasecmp(getenv("REMOTE_ADDR"), "unknown"))
   $ip = getenv("REMOTE_ADDR");

   else if (isset($_SERVER['REMOTE_ADDR']) && $_SERVER['REMOTE_ADDR'] && strcasecmp($_SERVER['REMOTE_ADDR'], "unknown"))
   $ip = $_SERVER['REMOTE_ADDR'];

   else
   $ip = "";

   return($ip);
}