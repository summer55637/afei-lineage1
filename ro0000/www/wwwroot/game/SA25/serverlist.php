<?php
header('Content-type:text/html;charset=utf-8');
$V=(int)$_GET["version"];
$p=(int)$_GET['platform'];
$channel=$_GET['channel'];

if(empty($channel) or $channel=="" ){
    exit(0);
}

$serverlist = array(
		array('name'=>urlencode('源码屋'),
			  'list'=>array(
				array(
					'name'=>urlencode('冰河石器'),'ip'=>'192.168.8.128','port'=>4065,'type'=>1
				),
				array(
					'name'=>urlencode('冰河石器2'),'ip'=>'192.168.8.128','port'=>4065,'type'=>1
			  )
			  )
		)
	);

echo urldecode(json_encode($serverlist));
