<?php
include("inc/config.php");
class Db{
    private $_db = null;//数据库连接句柄
    private $_table = null;//表名
    private $_where = null;//where条件
    private $_order = null;//order排序
    private $_limit = null;//limit限定查询
    private $_group = null;//group分组
	private $_DB_PAGE = null;
    private $_configs = array(
                'hostname' => '127.0.0.1',
				'dbname'   => '175sa',
				'username' => 'root',
				'password' => 'df31c1c74b3e16fa'
            );//数据库配置
 
    /**
     * 构造函数，连接数据库
     */
    public function __construct(){
        $link = $this->_db;
        if(!$link){
            $db = mysqli_connect($this->_configs['hostname'],$this->_configs['username'],$this->_configs['password'],$this->_configs['dbname']);
            mysqli_query($db,"set names utf8");
            if(!$db){
                $this->ShowException("错误信息".mysqli_connect_error());
            }
            $this->_db = $db;
        }
    }
 
    /**
     * 获取所有数据
     *
     * @param      <type>   $table  The table
     *
     * @return     boolean  All.
     */
    public function getAll($table=null){
        $link = $this->_db;
        if(!$link)return false;
        $sql = "SELECT * FROM {$table}";
        $data = mysqli_fetch_all($this->execute($sql));
        return $data;
    }
	
	public function sqls($sql=null){
        $link = $this->_db;
        if(!$link)return false;
        if(!$sql)return false;
        $data = mysqli_fetch_all($this->execute($sql),MYSQLI_ASSOC);
        return $data;
    }
	
    public function table($table){
        $this->_table = $table;
        return $this;
    }
 
    /**
     * 实现查询操作
     *
     * @param      string   $fields  The fields
     *
     * @return     boolean  ( description_of_the_return_value )
     */
    public function select($fields="*"){
        $fieldsStr = '';
        $link = $this->_db;
        if(!$link)return false;
        if(is_array($fields)){
            $fieldsStr = implode(',', $fields);
        }elseif(is_string($fields)&&!empty($fields)){
            $fieldsStr = $fields;
        }
        $sql = "SELECT {$fields} FROM {$this->_table} {$this->_where} {$this->_order} {$this->_limit}";
        $data = mysqli_fetch_all($this->execute($sql),MYSQLI_ASSOC);
        return $data;
    }
	 public function select_str($fields="*"){
        $fieldsStr = '';
        $link = $this->_db;
        if(!$link)return false;
        if(is_array($fields)){
            $fieldsStr = implode(',', $fields);
        }elseif(is_string($fields)&&!empty($fields)){
            $fieldsStr = $fields;
        }
        $sql = "SELECT {$fields} FROM {$this->_table} {$this->_where} {$this->_order} {$this->_limit}";
        return $sql;
    }
	/**
     * 实现查询操作
     *
     * @param      string   $fields  The fields
     *
     * @return     boolean  ( description_of_the_return_value )
     */
    public function find($fields="*"){
        $fieldsStr = '';
        $link = $this->_db;
        if(!$link)return false;
        if(is_array($fields)){
            $fieldsStr = implode(',', $fields);
        }elseif(is_string($fields)&&!empty($fields)){
            $fieldsStr = $fields;
        }
        $sql = "SELECT {$fields} FROM {$this->_table} {$this->_where} {$this->_order} {$this->_limit}";
        $data = mysqli_fetch_array($this->execute($sql));
        return $data;
    }
	public function find_str($fields="*"){
        $fieldsStr = '';
        $link = $this->_db;
        if(!$link)return false;
        if(is_array($fields)){
            $fieldsStr = implode(',', $fields);
        }elseif(is_string($fields)&&!empty($fields)){
            $fieldsStr = $fields;
        }
        $sql = "SELECT {$fields} FROM {$this->_table} {$this->_where} {$this->_order} {$this->_limit}";
       return $sql;
    }
 
    /**
     * order排序
     *
     * @param      string   $order  The order
     *
     * @return     boolean  ( description_of_the_return_value )
     */
    public function order($order=''){
        $orderStr = '';
        $link = $this->_db;
        if(!$link)return false;
        if(is_string($order)&&!empty($order)){
            $orderStr = "ORDER BY ".$order;
        }
        $this->_order = $orderStr;
        return $this;
    }
 
    /**
     * where条件
     *
     * @param      string  $where  The where
     *
     * @return     <type>  ( description_of_the_return_value )
     */
    public function where($where=''){
        $whereStr = '';
        $link = $this->_db;
        if(!$link)return $link;
        if(is_array($where)){
            foreach ($where as $key => $value) {
                if($value == end($where)){
                    $whereStr .= "`".$key."` = '".$value."'";
                }else{
                    $whereStr .= "`".$key."` = '".$value."' AND ";
                }
            }
            $whereStr = "WHERE ".$whereStr;
        }elseif(is_string($where)&&!empty($where)){
            $whereStr = "WHERE ".$where;
        }
        $this->_where = $whereStr;
        return $this;
    }
 
    /**
     * group分组
     *
     * @param      string   $group  The group
     *
     * @return     boolean  ( description_of_the_return_value )
     */
    public function group($group=''){
        $groupStr = '';
        $link = $this->_db;
        if(!$link)return false;
        if(is_array($group)){
            $groupStr = "GROUP BY ".implode(',',$group);
        }elseif(is_string($group)&&!empty($group)){
            $groupStr = "GROUP BY ".$group;
        }
        $this->_group = $groupStr;
        return $this;
    }
 
    /**
     * limit限定查询
     *
     * @param      string  $limit  The limit
     *
     * @return     <type>  ( description_of_the_return_value )
     */
    public function limit($limit=''){
        $limitStr = '';
        $link = $this->_db;
        if(!$link)return $link;
        if(is_string($limit)&& !empty($limit)){
            $limitStr = "LIMIT ".$limit;
        }elseif(is_numeric($limit)){
            $limitStr = "LIMIT ".$limit;
        }
        $this->_limit = $limitStr;
        return $this;
    }
 
    /**
     * 执行sql语句
     *
     * @param      <type>   $sql    The sql
     *
     * @return     boolean  ( description_of_the_return_value )
     */
    public function execute($sql=null){
        $link = $this->_db;
        if(!$link)return false;
        $res = mysqli_query($this->_db,$sql);
        if(!$res){
            $errors = mysqli_error_list($this->_db);
            $this->ShowException("报错啦！<br/>错误号：".$errors[0]['errno']."<br/>SQL错误状态：".$errors[0]['sqlstate']."<br/>错误信息：".$errors[0]['error']);
            die();
        }
        return $res;
    }
 
    /**
     * 插入数据
     *
     * @param      <type>   $data   The data
     *
     * @return     boolean  ( description_of_the_return_value )
     */
    public function insert($data){
        $link = $this->_db;
        if(!$link)return false;
        if(is_array($data)){
            $keys = '';
            $values = '';
            foreach ($data as $key => $value) {
                $keys .= "`".$key."`,";
                $values .= "'".$value."',";
            }
            $keys = rtrim($keys,',');
            $values = rtrim($values,',');
        }
        $sql = "INSERT INTO `{$this->_table}`({$keys}) VALUES({$values})";
        mysqli_query($this->_db,$sql);
        $insertId = mysqli_insert_id($this->_db);
        return $insertId;
    }
  public function insert_str($data){
        $link = $this->_db;
        if(!$link)return false;
        if(is_array($data)){
            $keys = '';
            $values = '';
            foreach ($data as $key => $value) {
                $keys .= "`".$key."`,";
                $values .= "'".$value."',";
            }
            $keys = rtrim($keys,',');
            $values = rtrim($values,',');
        }
        $sql = "INSERT INTO `{$this->_table}`({$keys}) VALUES({$values})";
        
        return $sql;
    }
    /**
     * 更新数据
     *
     * @param      <type>  $data   The data
     *
     * @return     <type>  ( description_of_the_return_value )
     */
    public function update($data){
        $link = $this->_db;
        if(!$link)return $link;
        if(is_array($data)){
            $dataStr = '';
            foreach ($data as $key => $value) {
                $dataStr .= "`".$key."`='".$value."',";
            }
            $dataStr = rtrim($dataStr,',');
        }elseif(is_string($data)&&!empty($data)){
            $dataStr = $data;
        }
        $sql = "UPDATE `{$this->_table}` SET {$dataStr} {$this->_where} {$this->_limit}";
        $res = $this->execute($sql);
        return $res;
    }
   public function update_str($data){
        $link = $this->_db;
        if(!$link)return $link;
        if(is_array($data)){
            $dataStr = '';
            foreach ($data as $key => $value) {
                $dataStr .= "`".$key."`='".$value."',";
            }
            $dataStr = rtrim($dataStr,',');
        }elseif(is_string($data)&&!empty($data)){
            $dataStr = $data;
        }
        //$sql = "UPDATE `{$this->_table}` SET {$dataStr} {$this->_where} {$this->_order} {$this->_limit}";
        $sql = "UPDATE `{$this->_table}` SET {$dataStr} {$this->_where} {$this->_limit}";
        return $sql;
    }
    /**
     * 删除数据
     *
     * @return     <type>  ( description_of_the_return_value )
     */
    public function delete(){
        $link = $this->_db;
        if(!$link)return $link;
        $sql = "DELETE FROM `{$this->_table}` {$this->_where}";
        $res = $this->execute($sql);
        return $res;
    }
	/**
		 * 返回符合条件的记录条数
		 * @return [type] [description]
		 */
		public function count($field){
			return $this->find("count({$field})");
		}
	/**
		 * 字段数据求和
		 * @param  [type] $field [description]
		 * @return [type]		[description]
		 */
		public function sum($field){
			return $this->find("SUM({$field})");
		}
		
		/**
		 * 返回最大值
		 * @param  [type] $field [description]
		 * @return [type]		[description]
		 */
		public function max($field){
			return $this->find("MAX({$field})");
		}
		
		/**
		 * 返回最小值
		 * @param  [type] $field [description]
		 * @return [type]		[description]
		 */
		public function min($field){
			return $this->find("MIN({$field})");
		}
		
		/**
		 * 返回平均值
		 * @param  [type] $field [description]
		 * @return [type]		[description]
		 */
		public function avg($field){
			return $this->find("AVG({$field})");
		}
 /**
		 * 数据分页
		 * @param  [type]  $num	  [每页数据量]
		 * @param  integer $pageRoll [返回的最大的分页数量]
		 * @param  boolean $page	 [当前页码]
		 * @return [type]			[description]
		 */
		public function page($num,$pageRoll=10,$page=false){	
			$link = $this->_db;
			if(!$link)return $link;		
			$page || ($page = empty($_GET['p']) ? 1 : $_GET['p']);
			$start = ($page - 1) * $num;
			$stop = $num;
			$this->_DB_PAGE= null;
			$starttime = microtime(true);
			$sql = "SELECT COUNT(*) FROM {$this->_table} {$this->_where} {$this->_order}";
			$data = mysqli_fetch_array($this->execute($sql));
			$this->_DB_PAGE['total'] = $data[0];
			//debug::pdotime(microtime(true) - $starttime);
			$this->_DB_PAGE['li'] = [];
			$this->_DB_PAGE['pages_num'] = !empty($this->_DB_PAGE['total']) ? (INT)ceil($this->_DB_PAGE['total'] / $num) : 1;
			$args = $_GET;
			if($this->_DB_PAGE['pages_num'] > 1){
				$Pnow = intval($pageRoll / 2);
				if($page > $Pnow && $this->_DB_PAGE['pages_num'] > $pageRoll){
					$i = $page - $Pnow;
					$Pend = $i + $pageRoll - 1;
					$Pend > $this->_DB_PAGE['pages_num'] && ($Pend = $this->_DB_PAGE['pages_num']) && ($i = $Pend - $pageRoll + 1);
				}else{
					$i = 1;
					$Pend = $pageRoll > $this->_DB_PAGE['pages_num'] ? $this->_DB_PAGE['pages_num'] : $pageRoll;
				}
				for($i;$i<=$Pend;$i++){
					$args['p'] = $i;
					$this->_DB_PAGE['li'][$i] = $page == $i ? 'javascript:;' :  '?'.http_build_query($args);
				}
			}
			$this->_DB_PAGE['nowpage'] = $page;
			if($page > 1){
				$args['p'] = $page - 1;
				$this->_DB_PAGE['prev'] =  '?'.http_build_query($args);
			}else{
				$this->_DB_PAGE['prev'] = 'javascript:;';
			}
			if($page < $this->_DB_PAGE['pages_num']){
				$args['p'] = $page + 1;
				$this->_DB_PAGE['next'] = '?'.http_build_query($args);
			}else{
				$this->_DB_PAGE['next'] = 'javascript:;';
			}
			$args['p'] = 1;
			$this->_DB_PAGE['start'] = $page > 1 ? '?'.http_build_query($args) : 'javascript:;';
			$args['p'] = $this->_DB_PAGE['pages_num'];
			$this->_DB_PAGE['end'] = $page == $this->_DB_PAGE['pages_num'] ? 'javascript:;' : '?'.http_build_query($args);
			return $this->limit($start.",".$stop);
		}
		/**
		 * 获取分页数据
		 * @return [array] [description]
		 */
		public function getPage(){
			return $this->_DB_PAGE??null;
		}
    /**
     * 异常信息输出
     *
     * @param      <type>  $var    The variable
     */
    private function ShowException($var){
        if(is_bool($var)){
            var_dump($var);
        }else if(is_null($var)){
            var_dump(NULL);
        }else{
            echo "<pre style='position:relative;z-index:1000;padding:10px;border-radius:5px;background:#F5F5F5;border:1px solid #aaa;font-size:14px;line-height:18px;opacity:0.9;'>".print_r($var,true)."</pre>";
        }
    }
 
}
