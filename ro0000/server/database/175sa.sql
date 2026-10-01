-- MySQL dump 10.13  Distrib 5.7.39, for Linux (x86_64)
--
-- Host: localhost    Database: 175sa
-- ------------------------------------------------------
-- Server version	5.7.39-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `132title`
--

DROP TABLE IF EXISTS `132title`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `132title` (
  `index` int(11) NOT NULL AUTO_INCREMENT,
  `cdkey` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mac` varchar(64) NOT NULL,
  `flg` int(11) NOT NULL,
  PRIMARY KEY (`index`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `132title`
--

LOCK TABLES `132title` WRITE;
/*!40000 ALTER TABLE `132title` DISABLE KEYS */;
/*!40000 ALTER TABLE `132title` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `achievement`
--

DROP TABLE IF EXISTS `achievement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achievement` (
  `cdkey` varchar(16) NOT NULL,
  `data1` tinyint(1) NOT NULL DEFAULT '0',
  `data2` tinyint(1) NOT NULL DEFAULT '0',
  `data3` tinyint(1) NOT NULL DEFAULT '0',
  `data4` tinyint(1) NOT NULL DEFAULT '0',
  `data5` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievement`
--

LOCK TABLES `achievement` WRITE;
/*!40000 ALTER TABLE `achievement` DISABLE KEYS */;
/*!40000 ALTER TABLE `achievement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announce`
--

DROP TABLE IF EXISTS `announce`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announce` (
  `buff` varchar(256) NOT NULL,
  `color` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `check` tinyint(4) NOT NULL,
  KEY `check` (`check`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announce`
--

LOCK TABLES `announce` WRITE;
/*!40000 ALTER TABLE `announce` DISABLE KEYS */;
/*!40000 ALTER TABLE `announce` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `apppay`
--

DROP TABLE IF EXISTS `apppay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `apppay` (
  `orderid` varchar(64) NOT NULL,
  `realmoney` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cdkey` varchar(64) DEFAULT NULL,
  `apptime` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`orderid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apppay`
--

LOCK TABLES `apppay` WRITE;
/*!40000 ALTER TABLE `apppay` DISABLE KEYS */;
/*!40000 ALTER TABLE `apppay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `autopk`
--

DROP TABLE IF EXISTS `autopk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `autopk` (
  `cdkey` varchar(32) NOT NULL,
  `name` varchar(32) DEFAULT NULL,
  `date` int(11) DEFAULT '0',
  `score` int(11) NOT NULL DEFAULT '0',
  `check` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autopk`
--

LOCK TABLES `autopk` WRITE;
/*!40000 ALTER TABLE `autopk` DISABLE KEYS */;
/*!40000 ALTER TABLE `autopk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `autopkdata`
--

DROP TABLE IF EXISTS `autopkdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `autopkdata` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `time` timestamp NOT NULL,
  `partycdkey` varchar(16) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `partycdkey` (`partycdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autopkdata`
--

LOCK TABLES `autopkdata` WRITE;
/*!40000 ALTER TABLE `autopkdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `autopkdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backtime`
--

DROP TABLE IF EXISTS `backtime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backtime` (
  `unicode` varchar(32) NOT NULL COMMENT '唯一unicode',
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `petid` int(11) NOT NULL,
  `petname` varchar(32) NOT NULL,
  `old4v` varchar(64) NOT NULL,
  `new4v` varchar(64) NOT NULL,
  `cost` int(11) NOT NULL,
  `trans` int(11) DEFAULT '0' COMMENT '回炉前转生数',
  `old4vdata` varchar(100) DEFAULT NULL COMMENT '回炉前属性',
  `old4vchar` varchar(100) DEFAULT NULL COMMENT '回炉前属性初始值',
  PRIMARY KEY (`unicode`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backtime`
--

LOCK TABLES `backtime` WRITE;
/*!40000 ALTER TABLE `backtime` DISABLE KEYS */;
/*!40000 ALTER TABLE `backtime` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `baodian`
--

DROP TABLE IF EXISTS `baodian`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `baodian` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` int(11) NOT NULL,
  `flg2` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baodian`
--

LOCK TABLES `baodian` WRITE;
/*!40000 ALTER TABLE `baodian` DISABLE KEYS */;
/*!40000 ALTER TABLE `baodian` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boxlog`
--

DROP TABLE IF EXISTS `boxlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `boxlog` (
  `cdkey` varchar(16) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boxlog`
--

LOCK TABLES `boxlog` WRITE;
/*!40000 ALTER TABLE `boxlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `boxlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `capturepet`
--

DROP TABLE IF EXISTS `capturepet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `capturepet` (
  `unicode` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `id` int(11) DEFAULT NULL,
  `name` varchar(32) CHARACTER SET gbk DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `lv` int(11) DEFAULT NULL,
  `hp` int(11) DEFAULT NULL,
  `attack` int(11) DEFAULT NULL,
  `def` int(11) DEFAULT NULL,
  `quick` int(11) DEFAULT NULL,
  `sum` double DEFAULT NULL,
  `author` varchar(32) CHARACTER SET gbk DEFAULT NULL,
  `cdkey` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `check` tinyint(1) DEFAULT NULL,
  `inserttime` datetime NOT NULL,
  PRIMARY KEY (`unicode`),
  KEY `id` (`id`),
  KEY `type` (`type`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `capturepet`
--

LOCK TABLES `capturepet` WRITE;
/*!40000 ALTER TABLE `capturepet` DISABLE KEYS */;
/*!40000 ALTER TABLE `capturepet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cashdraw`
--

DROP TABLE IF EXISTS `cashdraw`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cashdraw` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cdkey` varchar(35) NOT NULL,
  `rolename` varchar(35) NOT NULL COMMENT '角色名',
  `name` varchar(30) NOT NULL COMMENT '支付宝姓名',
  `account` varchar(35) DEFAULT NULL COMMENT '支付宝账号',
  `mac` varchar(20) DEFAULT NULL,
  `servername` varchar(20) DEFAULT NULL,
  `count` int(11) NOT NULL,
  `rate` float(11,2) NOT NULL,
  `before` int(11) DEFAULT NULL,
  `after` int(11) DEFAULT NULL,
  `time` int(11) NOT NULL COMMENT '申请时间',
  `status` tinyint(3) unsigned DEFAULT '0' COMMENT '0为未处理 1为成功 2为失败',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cashdraw`
--

LOCK TABLES `cashdraw` WRITE;
/*!40000 ALTER TABLE `cashdraw` DISABLE KEYS */;
/*!40000 ALTER TABLE `cashdraw` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cdkey`
--

DROP TABLE IF EXISTS `cdkey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cdkey` (
  `id` int(11) NOT NULL,
  `cdkey` varchar(16) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cdkey`
--

LOCK TABLES `cdkey` WRITE;
/*!40000 ALTER TABLE `cdkey` DISABLE KEYS */;
/*!40000 ALTER TABLE `cdkey` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chartrans`
--

DROP TABLE IF EXISTS `chartrans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chartrans` (
  `cdkey` varchar(12) NOT NULL,
  `tran` int(11) DEFAULT NULL,
  `tran1` int(11) DEFAULT NULL,
  `tran2` int(11) DEFAULT NULL,
  `tran3` int(11) DEFAULT NULL,
  `tran4` int(11) DEFAULT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chartrans`
--

LOCK TABLES `chartrans` WRITE;
/*!40000 ALTER TABLE `chartrans` DISABLE KEYS */;
/*!40000 ALTER TABLE `chartrans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `check`
--

DROP TABLE IF EXISTS `check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `check` (
  `itemcode` varchar(64) NOT NULL,
  `usecdkey` varchar(32) DEFAULT NULL,
  `usename` varchar(32) DEFAULT NULL,
  `usemac` varchar(64) DEFAULT NULL,
  `cdkey` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `mac` varchar(64) NOT NULL,
  `type` varchar(32) NOT NULL,
  `oldvalue` int(11) NOT NULL,
  `value` int(11) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `usetime` timestamp NULL DEFAULT NULL,
  `check` int(11) NOT NULL,
  PRIMARY KEY (`itemcode`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `check`
--

LOCK TABLES `check` WRITE;
/*!40000 ALTER TABLE `check` DISABLE KEYS */;
/*!40000 ALTER TABLE `check` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consign`
--

DROP TABLE IF EXISTS `consign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consign` (
  `cdkey` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `title` varchar(32) NOT NULL,
  `fl` int(11) NOT NULL,
  `fx` int(11) NOT NULL,
  `fy` int(11) NOT NULL,
  `serverid` int(11) NOT NULL,
  `image` int(11) NOT NULL,
  `flag` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consign`
--

LOCK TABLES `consign` WRITE;
/*!40000 ALTER TABLE `consign` DISABLE KEYS */;
/*!40000 ALTER TABLE `consign` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `costdata`
--

DROP TABLE IF EXISTS `costdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `costdata` (
  `cdkey` varchar(16) NOT NULL,
  `point` int(11) NOT NULL DEFAULT '0',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `check` int(11) DEFAULT '0',
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `costdata`
--

LOCK TABLES `costdata` WRITE;
/*!40000 ALTER TABLE `costdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `costdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `costdaydata`
--

DROP TABLE IF EXISTS `costdaydata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `costdaydata` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(10) NOT NULL,
  `point` int(11) DEFAULT '0',
  `time` int(11) DEFAULT '0',
  `check` int(11) DEFAULT '0',
  `totalcheck` int(11) DEFAULT '0',
  `name` varchar(50) DEFAULT NULL COMMENT '角色名',
  PRIMARY KEY (`cdkey`,`date`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `point` (`point`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `costdaydata`
--

LOCK TABLES `costdaydata` WRITE;
/*!40000 ALTER TABLE `costdaydata` DISABLE KEYS */;
/*!40000 ALTER TABLE `costdaydata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csalogin`
--

DROP TABLE IF EXISTS `csalogin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `csalogin` (
  `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `MasterId` int(10) unsigned NOT NULL,
  `Name` varchar(16) DEFAULT '' COMMENT '玩家账号',
  `PassWord` varchar(255) DEFAULT NULL COMMENT '密码',
  `SafePasswd` varchar(32) DEFAULT NULL COMMENT '安全码',
  `IP` varchar(16) NOT NULL DEFAULT '-' COMMENT '登陆IP',
  `RegIP` varchar(16) NOT NULL DEFAULT '-' COMMENT '注册IP',
  `RegTime` timestamp NULL DEFAULT NULL COMMENT '注册时间',
  `LoginTime` timestamp NULL DEFAULT NULL COMMENT '最后登陆时间',
  `OnlineName` varchar(30) DEFAULT '' COMMENT '在线人物名称',
  `Online` tinyint(4) DEFAULT '0' COMMENT '在线状态',
  `Offline` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否离线',
  `Path` varchar(16) DEFAULT NULL COMMENT '文件目录',
  `ServerName` char(32) NOT NULL,
  `ServerId` int(11) DEFAULT NULL,
  `GroupId` int(11) DEFAULT NULL,
  `GroupName` varchar(32) DEFAULT NULL,
  `RmbPoint` int(11) unsigned zerofill DEFAULT '00000000000' COMMENT '现金',
  `PayTotal` int(11) DEFAULT '0' COMMENT '总额',
  `VipPoint` int(11) DEFAULT '0' COMMENT '点劵',
  `PayPoint` int(11) DEFAULT '0' COMMENT '积分',
  `PetPoint` int(11) NOT NULL DEFAULT '0' COMMENT '回炉点',
  `MAC1` char(38) DEFAULT NULL COMMENT '机器码1',
  `MAC2` char(128) DEFAULT NULL COMMENT '机器码2',
  `MAC3` char(64) DEFAULT NULL COMMENT '是否有摄像头',
  `QQ` varchar(16) NOT NULL DEFAULT '10000',
  `NeiCe` int(11) NOT NULL DEFAULT '0',
  `TuiJianQQ` varchar(16) DEFAULT '10000' COMMENT '电话',
  `uid` varchar(48) NOT NULL DEFAULT 'shiqishidai',
  `token` varchar(96) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `playeruid` varchar(16) NOT NULL,
  PRIMARY KEY (`Id`) USING BTREE,
  KEY `Path` (`Path`) USING BTREE,
  KEY `QQ` (`QQ`) USING BTREE,
  KEY `MAC1` (`MAC1`) USING BTREE,
  KEY `MAC2` (`MAC2`) USING BTREE,
  KEY `IP` (`IP`) USING BTREE,
  KEY `MAC3` (`MAC3`) USING BTREE,
  KEY `Online` (`Online`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE,
  KEY `OnlineName` (`OnlineName`) USING BTREE,
  KEY `Offline` (`Offline`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4436 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csalogin`
--

LOCK TABLES `csalogin` WRITE;
/*!40000 ALTER TABLE `csalogin` DISABLE KEYS */;
/*!40000 ALTER TABLE `csalogin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csaloginmaster`
--

DROP TABLE IF EXISTS `csaloginmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `csaloginmaster` (
  `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `Name` varchar(16) DEFAULT NULL,
  `PassWord` varchar(255) DEFAULT NULL,
  `ReferralCode` varchar(50) DEFAULT '',
  `api_token` varchar(80) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`Id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1242 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csaloginmaster`
--

LOCK TABLES `csaloginmaster` WRITE;
/*!40000 ALTER TABLE `csaloginmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `csaloginmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csamastertype`
--

DROP TABLE IF EXISTS `csamastertype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `csamastertype` (
  `id` int(11) NOT NULL,
  `type` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csamastertype`
--

LOCK TABLES `csamastertype` WRITE;
/*!40000 ALTER TABLE `csamastertype` DISABLE KEYS */;
/*!40000 ALTER TABLE `csamastertype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csshopdata`
--

DROP TABLE IF EXISTS `csshopdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `csshopdata` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` tinyint(1) NOT NULL DEFAULT '0',
  `flg2` tinyint(1) NOT NULL DEFAULT '0',
  `flg3` tinyint(1) NOT NULL DEFAULT '0',
  `flg4` tinyint(1) NOT NULL DEFAULT '0',
  `flg5` tinyint(1) NOT NULL DEFAULT '0',
  `flg6` tinyint(1) NOT NULL DEFAULT '0',
  `paytotal` int(11) DEFAULT '0',
  `dayTime` varchar(32) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csshopdata`
--

LOCK TABLES `csshopdata` WRITE;
/*!40000 ALTER TABLE `csshopdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `csshopdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csshopnum`
--

DROP TABLE IF EXISTS `csshopnum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `csshopnum` (
  `id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `buynum` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `date` varchar(10) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csshopnum`
--

LOCK TABLES `csshopnum` WRITE;
/*!40000 ALTER TABLE `csshopnum` DISABLE KEYS */;
/*!40000 ALTER TABLE `csshopnum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csxsshopdata`
--

DROP TABLE IF EXISTS `csxsshopdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `csxsshopdata` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` tinyint(1) NOT NULL DEFAULT '0',
  `flg2` tinyint(1) NOT NULL DEFAULT '0',
  `flg3` tinyint(1) NOT NULL DEFAULT '0',
  `flg4` tinyint(1) NOT NULL DEFAULT '0',
  `flg5` tinyint(1) NOT NULL DEFAULT '0',
  `flg6` tinyint(1) NOT NULL DEFAULT '0',
  `flg7` tinyint(1) NOT NULL DEFAULT '0',
  `Dltotal` int(11) DEFAULT '0',
  `Rwtotal` int(11) DEFAULT '0',
  `dayTime` varchar(32) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csxsshopdata`
--

LOCK TABLES `csxsshopdata` WRITE;
/*!40000 ALTER TABLE `csxsshopdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `csxsshopdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csxsshopnum`
--

DROP TABLE IF EXISTS `csxsshopnum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `csxsshopnum` (
  `id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `buynum` int(11) NOT NULL,
  `price` varchar(256) NOT NULL DEFAULT '0',
  `date` varchar(10) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `type` (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csxsshopnum`
--

LOCK TABLES `csxsshopnum` WRITE;
/*!40000 ALTER TABLE `csxsshopnum` DISABLE KEYS */;
/*!40000 ALTER TABLE `csxsshopnum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `damages`
--

DROP TABLE IF EXISTS `damages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `damages` (
  `cdkey` varchar(16) NOT NULL,
  `date` int(11) DEFAULT NULL,
  `damage` int(11) DEFAULT NULL,
  `check` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `damages`
--

LOCK TABLES `damages` WRITE;
/*!40000 ALTER TABLE `damages` DISABLE KEYS */;
/*!40000 ALTER TABLE `damages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daysign`
--

DROP TABLE IF EXISTS `daysign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daysign` (
  `cdkey` varchar(16) NOT NULL,
  `date` int(11) NOT NULL DEFAULT '0',
  `today` int(11) DEFAULT '0',
  `1` tinyint(4) DEFAULT '0' COMMENT '本月1号',
  `2` tinyint(4) DEFAULT '0' COMMENT '本月2号',
  `3` tinyint(4) DEFAULT '0' COMMENT '本月3号',
  `4` tinyint(4) DEFAULT '0' COMMENT '本月4号',
  `5` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `6` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `7` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `8` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `9` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `10` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `11` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `12` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `13` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `14` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `15` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `16` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `17` tinyint(4) DEFAULT NULL COMMENT '本月x号',
  `18` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `19` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `20` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `21` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `22` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `23` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `24` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `25` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `26` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `27` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `28` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `29` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `30` tinyint(4) DEFAULT '0' COMMENT '本月x号',
  `data1` int(11) DEFAULT '0',
  `data2` int(11) DEFAULT '0',
  `buCnt` int(11) DEFAULT '0',
  `Retroactive` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daysign`
--

LOCK TABLES `daysign` WRITE;
/*!40000 ALTER TABLE `daysign` DISABLE KEYS */;
INSERT INTO `daysign` VALUES ('f4564523d9hh',202211,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
/*!40000 ALTER TABLE `daysign` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daysignseven`
--

DROP TABLE IF EXISTS `daysignseven`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daysignseven` (
  `cdkey` varchar(16) NOT NULL,
  `date` int(11) DEFAULT '0',
  `data` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daysignseven`
--

LOCK TABLES `daysignseven` WRITE;
/*!40000 ALTER TABLE `daysignseven` DISABLE KEYS */;
/*!40000 ALTER TABLE `daysignseven` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daysignseven2`
--

DROP TABLE IF EXISTS `daysignseven2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daysignseven2` (
  `cdkey` varchar(16) NOT NULL,
  `date` int(11) DEFAULT '0',
  `data` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daysignseven2`
--

LOCK TABLES `daysignseven2` WRITE;
/*!40000 ALTER TABLE `daysignseven2` DISABLE KEYS */;
/*!40000 ALTER TABLE `daysignseven2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daysignseven3`
--

DROP TABLE IF EXISTS `daysignseven3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daysignseven3` (
  `cdkey` varchar(16) NOT NULL,
  `date` int(11) DEFAULT '0',
  `data` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daysignseven3`
--

LOCK TABLES `daysignseven3` WRITE;
/*!40000 ALTER TABLE `daysignseven3` DISABLE KEYS */;
/*!40000 ALTER TABLE `daysignseven3` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dice`
--

DROP TABLE IF EXISTS `dice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice` (
  `id` int(11) NOT NULL,
  `cdkey` varchar(16) NOT NULL,
  `type` varchar(12) NOT NULL,
  `flg` varchar(12) NOT NULL,
  `point` int(11) NOT NULL,
  `num` int(11) NOT NULL DEFAULT '0',
  `winpoint` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dice`
--

LOCK TABLES `dice` WRITE;
/*!40000 ALTER TABLE `dice` DISABLE KEYS */;
/*!40000 ALTER TABLE `dice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dicedata`
--

DROP TABLE IF EXISTS `dicedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dicedata` (
  `cdkey` varchar(16) NOT NULL,
  `type` int(11) NOT NULL,
  `point` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dicedata`
--

LOCK TABLES `dicedata` WRITE;
/*!40000 ALTER TABLE `dicedata` DISABLE KEYS */;
/*!40000 ALTER TABLE `dicedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dicelog`
--

DROP TABLE IF EXISTS `dicelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dicelog` (
  `type` int(11) NOT NULL,
  `winpoint` int(11) NOT NULL,
  `losepoint` int(11) NOT NULL,
  PRIMARY KEY (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dicelog`
--

LOCK TABLES `dicelog` WRITE;
/*!40000 ALTER TABLE `dicelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `dicelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dwpkdata`
--

DROP TABLE IF EXISTS `dwpkdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dwpkdata` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `trans` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `point` int(11) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `point` (`point`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dwpkdata`
--

LOCK TABLES `dwpkdata` WRITE;
/*!40000 ALTER TABLE `dwpkdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `dwpkdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `errorlog`
--

DROP TABLE IF EXISTS `errorlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `errorlog` (
  `cdkey` varchar(16) NOT NULL,
  `func` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `errorlog`
--

LOCK TABLES `errorlog` WRITE;
/*!40000 ALTER TABLE `errorlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `errorlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `famelog`
--

DROP TABLE IF EXISTS `famelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `famelog` (
  `cdkey` varchar(16) NOT NULL,
  `oldfame` int(11) NOT NULL,
  `newfame` int(11) NOT NULL,
  `file` varchar(64) NOT NULL,
  `line` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `famelog`
--

LOCK TABLES `famelog` WRITE;
/*!40000 ALTER TABLE `famelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `famelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fameshop`
--

DROP TABLE IF EXISTS `fameshop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fameshop` (
  `cdkey` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `itemid` int(11) NOT NULL,
  `itemname` varchar(32) NOT NULL,
  `itemnum` int(11) NOT NULL,
  `time` timestamp NOT NULL,
  `oldpoint` int(11) NOT NULL DEFAULT '0',
  `newpoint` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fameshop`
--

LOCK TABLES `fameshop` WRITE;
/*!40000 ALTER TABLE `fameshop` DISABLE KEYS */;
/*!40000 ALTER TABLE `fameshop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `firstpayreward`
--

DROP TABLE IF EXISTS `firstpayreward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `firstpayreward` (
  `cdkey` varchar(50) DEFAULT NULL,
  `pay_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firstpayreward`
--

LOCK TABLES `firstpayreward` WRITE;
/*!40000 ALTER TABLE `firstpayreward` DISABLE KEYS */;
INSERT INTO `firstpayreward` VALUES ('e7fa56ea5853','2022-11-29 18:15:55');
/*!40000 ALTER TABLE `firstpayreward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fish`
--

DROP TABLE IF EXISTS `fish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fish` (
  `cdkey` varchar(12) NOT NULL,
  `date` varchar(11) DEFAULT NULL,
  `time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `num` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fish`
--

LOCK TABLES `fish` WRITE;
/*!40000 ALTER TABLE `fish` DISABLE KEYS */;
/*!40000 ALTER TABLE `fish` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmjiangdata`
--

DROP TABLE IF EXISTS `fmjiangdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmjiangdata` (
  `id` int(11) DEFAULT NULL,
  `cdkey` varchar(32) DEFAULT NULL,
  `check` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmjiangdata`
--

LOCK TABLES `fmjiangdata` WRITE;
/*!40000 ALTER TABLE `fmjiangdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmjiangdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmpkdata`
--

DROP TABLE IF EXISTS `fmpkdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmpkdata` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `fmname` varchar(32) NOT NULL,
  `type` int(11) NOT NULL,
  `win` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`,`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmpkdata`
--

LOCK TABLES `fmpkdata` WRITE;
/*!40000 ALTER TABLE `fmpkdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmpkdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmpointdata`
--

DROP TABLE IF EXISTS `fmpointdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmpointdata` (
  `id` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `jiangtime` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmpointdata`
--

LOCK TABLES `fmpointdata` WRITE;
/*!40000 ALTER TABLE `fmpointdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmpointdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmpointjiang`
--

DROP TABLE IF EXISTS `fmpointjiang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmpointjiang` (
  `fmid` int(11) NOT NULL,
  `data1` int(11) NOT NULL,
  `data2` int(11) NOT NULL,
  `data3` int(11) NOT NULL,
  PRIMARY KEY (`fmid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmpointjiang`
--

LOCK TABLES `fmpointjiang` WRITE;
/*!40000 ALTER TABLE `fmpointjiang` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmpointjiang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmpopitem`
--

DROP TABLE IF EXISTS `fmpopitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmpopitem` (
  `num` int(11) DEFAULT '0',
  KEY `num` (`num`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmpopitem`
--

LOCK TABLES `fmpopitem` WRITE;
/*!40000 ALTER TABLE `fmpopitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmpopitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmpopitemfromfamily`
--

DROP TABLE IF EXISTS `fmpopitemfromfamily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmpopitemfromfamily` (
  `fmindex` int(11) NOT NULL,
  `fmname` varchar(32) DEFAULT NULL,
  `num` int(11) DEFAULT '0',
  `time` int(11) DEFAULT '0',
  `flg1` int(11) DEFAULT '0',
  `flg2` int(11) DEFAULT '0',
  PRIMARY KEY (`fmindex`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmpopitemfromfamily`
--

LOCK TABLES `fmpopitemfromfamily` WRITE;
/*!40000 ALTER TABLE `fmpopitemfromfamily` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmpopitemfromfamily` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmpopitemfromplayer`
--

DROP TABLE IF EXISTS `fmpopitemfromplayer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmpopitemfromplayer` (
  `cdkey` varchar(16) NOT NULL,
  `num` int(11) DEFAULT '0',
  `flg` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmpopitemfromplayer`
--

LOCK TABLES `fmpopitemfromplayer` WRITE;
/*!40000 ALTER TABLE `fmpopitemfromplayer` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmpopitemfromplayer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmrank`
--

DROP TABLE IF EXISTS `fmrank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmrank` (
  `Index` int(11) NOT NULL,
  `Name` varchar(32) NOT NULL,
  `Point` int(11) NOT NULL,
  PRIMARY KEY (`Index`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmrank`
--

LOCK TABLES `fmrank` WRITE;
/*!40000 ALTER TABLE `fmrank` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmrank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fmzhengba`
--

DROP TABLE IF EXISTS `fmzhengba`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fmzhengba` (
  `fmindex` smallint(6) NOT NULL,
  `fmname` varchar(24) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `flg` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`fmindex`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fmzhengba`
--

LOCK TABLES `fmzhengba` WRITE;
/*!40000 ALTER TABLE `fmzhengba` DISABLE KEYS */;
/*!40000 ALTER TABLE `fmzhengba` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `getpasscode`
--

DROP TABLE IF EXISTS `getpasscode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `getpasscode` (
  `cdkey` varchar(32) NOT NULL,
  `phone` varchar(13) NOT NULL,
  `code` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `phone` (`phone`) USING BTREE,
  KEY `code` (`code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `getpasscode`
--

LOCK TABLES `getpasscode` WRITE;
/*!40000 ALTER TABLE `getpasscode` DISABLE KEYS */;
/*!40000 ALTER TABLE `getpasscode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `getphonecode`
--

DROP TABLE IF EXISTS `getphonecode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `getphonecode` (
  `cdkey` varchar(32) NOT NULL,
  `phone` varchar(13) NOT NULL,
  `code` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `phone` (`phone`) USING BTREE,
  KEY `code` (`code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `getphonecode`
--

LOCK TABLES `getphonecode` WRITE;
/*!40000 ALTER TABLE `getphonecode` DISABLE KEYS */;
/*!40000 ALTER TABLE `getphonecode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift`
--

DROP TABLE IF EXISTS `gift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gift` (
  `cdkey` varchar(16) NOT NULL,
  `data1` int(11) NOT NULL DEFAULT '0',
  `data2` int(11) NOT NULL DEFAULT '0',
  `data3` int(11) NOT NULL DEFAULT '0',
  `data4` int(11) NOT NULL DEFAULT '0',
  `data5` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift`
--

LOCK TABLES `gift` WRITE;
/*!40000 ALTER TABLE `gift` DISABLE KEYS */;
/*!40000 ALTER TABLE `gift` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giftdata`
--

DROP TABLE IF EXISTS `giftdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `giftdata` (
  `cdkey` varchar(16) NOT NULL,
  `check` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giftdata`
--

LOCK TABLES `giftdata` WRITE;
/*!40000 ALTER TABLE `giftdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `giftdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giftdata2`
--

DROP TABLE IF EXISTS `giftdata2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `giftdata2` (
  `cdkey` varchar(16) NOT NULL,
  `flg` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giftdata2`
--

LOCK TABLES `giftdata2` WRITE;
/*!40000 ALTER TABLE `giftdata2` DISABLE KEYS */;
/*!40000 ALTER TABLE `giftdata2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gold`
--

DROP TABLE IF EXISTS `gold`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gold` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(64) NOT NULL,
  `gold` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gold`
--

LOCK TABLES `gold` WRITE;
/*!40000 ALTER TABLE `gold` DISABLE KEYS */;
/*!40000 ALTER TABLE `gold` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hacklog`
--

DROP TABLE IF EXISTS `hacklog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hacklog` (
  `cdkey` varchar(16) DEFAULT NULL,
  `type` varchar(16) DEFAULT NULL,
  `time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hacklog`
--

LOCK TABLES `hacklog` WRITE;
/*!40000 ALTER TABLE `hacklog` DISABLE KEYS */;
/*!40000 ALTER TABLE `hacklog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `halo`
--

DROP TABLE IF EXISTS `halo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `halo` (
  `cdkey` varchar(16) NOT NULL,
  `index` tinyint(4) DEFAULT '0',
  `flg1` int(11) DEFAULT '0',
  `flg2` int(11) DEFAULT '0',
  `flg3` int(11) DEFAULT '0',
  `time1` int(11) DEFAULT '0',
  `time2` int(11) DEFAULT '0',
  `time3` int(11) DEFAULT '0',
  `time4` int(11) DEFAULT '0',
  `time5` int(11) DEFAULT '0',
  `time6` int(11) DEFAULT '0',
  `time7` int(11) DEFAULT '0',
  `time8` int(11) DEFAULT '0',
  `time9` int(11) DEFAULT '0',
  `time10` int(11) DEFAULT '0',
  `time11` int(11) DEFAULT '0',
  `time12` int(11) DEFAULT '0',
  `time13` int(11) DEFAULT '0',
  `time14` int(11) DEFAULT '0',
  `time15` int(11) DEFAULT '0',
  `time16` int(11) DEFAULT '0',
  `time17` int(11) DEFAULT '0',
  `time18` int(11) DEFAULT '0',
  `time19` int(11) DEFAULT '0',
  `time20` int(11) DEFAULT '0',
  `time21` int(11) DEFAULT '0',
  `time22` int(11) DEFAULT '0',
  `time23` int(11) DEFAULT '0',
  `time24` int(11) DEFAULT '0',
  `time25` int(11) DEFAULT '0',
  `time26` int(11) DEFAULT '0',
  `time27` int(11) DEFAULT '0',
  `time28` int(11) DEFAULT '0',
  `time29` int(11) DEFAULT '0',
  `time30` int(11) DEFAULT '0',
  `time31` int(11) DEFAULT '0',
  `time32` int(11) DEFAULT '0',
  `time33` int(11) DEFAULT '0',
  `time34` int(11) DEFAULT '0',
  `time35` int(11) DEFAULT '0',
  `time36` int(11) DEFAULT '0',
  `time37` int(11) DEFAULT '0',
  `time38` int(11) DEFAULT '0',
  `time39` int(11) DEFAULT '0',
  `time40` int(11) DEFAULT '0',
  `time41` int(11) DEFAULT '0',
  `time42` int(11) DEFAULT '0',
  `time43` int(11) DEFAULT '0',
  `time44` int(11) DEFAULT '0',
  `time45` int(11) DEFAULT '0',
  `time46` int(11) DEFAULT '0',
  `time47` int(11) DEFAULT '0',
  `time48` int(11) DEFAULT '0',
  `time49` int(11) DEFAULT '0',
  `time50` int(11) DEFAULT '0',
  `time51` int(11) DEFAULT '0',
  `time52` int(11) DEFAULT '0',
  `time53` int(11) DEFAULT '0',
  `time54` int(11) DEFAULT '0',
  `time55` int(11) DEFAULT '0',
  `time56` int(11) DEFAULT '0',
  `time57` int(11) DEFAULT '0',
  `time58` int(11) DEFAULT '0',
  `time59` int(11) DEFAULT '0',
  `time60` int(11) DEFAULT '0',
  `time61` int(11) DEFAULT '0',
  `time62` int(11) DEFAULT '0',
  `time63` int(11) DEFAULT '0',
  `time64` int(11) DEFAULT '0',
  `time65` int(11) DEFAULT '0',
  `time66` int(11) DEFAULT '0',
  `time67` int(11) DEFAULT '0',
  `time68` int(11) DEFAULT '0',
  `time69` int(11) DEFAULT '0',
  `time70` int(11) DEFAULT '0',
  `time71` int(11) DEFAULT '0',
  `time72` int(11) DEFAULT '0',
  `time73` int(11) DEFAULT '0',
  `time74` int(11) DEFAULT '0',
  `time75` int(11) DEFAULT '0',
  `time76` int(11) DEFAULT '0',
  `time77` int(11) DEFAULT '0',
  `time78` int(11) DEFAULT '0',
  `time79` int(11) DEFAULT '0',
  `time80` int(11) DEFAULT '0',
  `time81` int(11) DEFAULT '0',
  `time82` int(11) DEFAULT '0',
  `time83` int(11) DEFAULT '0',
  `time84` int(11) DEFAULT '0',
  `time85` int(11) DEFAULT '0',
  `time86` int(11) DEFAULT '0',
  `time87` int(11) DEFAULT '0',
  `time88` int(11) DEFAULT '0',
  `time89` int(11) DEFAULT '0',
  `time90` int(11) DEFAULT '0',
  `time91` int(11) DEFAULT '0',
  `time92` int(11) DEFAULT '0',
  `time93` int(11) DEFAULT '0',
  `time94` int(11) DEFAULT '0',
  `time95` int(11) DEFAULT '0',
  `time96` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `halo`
--

LOCK TABLES `halo` WRITE;
/*!40000 ALTER TABLE `halo` DISABLE KEYS */;
/*!40000 ALTER TABLE `halo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `huiludata`
--

DROP TABLE IF EXISTS `huiludata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `huiludata` (
  `cdkey` varchar(16) NOT NULL,
  `point` int(11) NOT NULL DEFAULT '0',
  `time` timestamp NULL DEFAULT NULL,
  `check` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `huiludata`
--

LOCK TABLES `huiludata` WRITE;
/*!40000 ALTER TABLE `huiludata` DISABLE KEYS */;
/*!40000 ALTER TABLE `huiludata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `huoyue`
--

DROP TABLE IF EXISTS `huoyue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `huoyue` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(10) NOT NULL,
  `num` int(11) NOT NULL,
  `flg` int(11) NOT NULL,
  `flg2` int(11) NOT NULL,
  `data1` int(11) NOT NULL,
  `data2` int(11) NOT NULL,
  `data3` int(11) NOT NULL,
  `data4` int(11) NOT NULL,
  `data5` int(11) NOT NULL,
  `data6` int(11) NOT NULL,
  `data7` int(11) NOT NULL,
  `data8` int(11) NOT NULL,
  `data9` int(11) NOT NULL,
  `data10` int(11) NOT NULL,
  `data11` int(11) NOT NULL,
  `data12` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `huoyue`
--

LOCK TABLES `huoyue` WRITE;
/*!40000 ALTER TABLE `huoyue` DISABLE KEYS */;
INSERT INTO `huoyue` VALUES ('2ebe4f5f5b4h','20221129',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),('a48a4hd49d5a','20240516',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),('cd55628ac8af','20221129',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),('e7fa56ea5853','20230209',15,0,8,0,0,0,99,1,0,0,0,0,0,0,0),('f4564523d9hh','20221129',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
/*!40000 ALTER TABLE `huoyue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemlog`
--

DROP TABLE IF EXISTS `itemlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `itemlog` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `itemname` varchar(32) NOT NULL,
  `type` varchar(32) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemlog`
--

LOCK TABLES `itemlog` WRITE;
/*!40000 ALTER TABLE `itemlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itempetgetdata`
--

DROP TABLE IF EXISTS `itempetgetdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `itempetgetdata` (
  `cdkey` varchar(16) DEFAULT NULL,
  `name` varchar(32) DEFAULT NULL,
  `translevel` varchar(32) DEFAULT NULL,
  `id` int(11) DEFAULT NULL,
  `idname` varchar(64) DEFAULT NULL,
  `buff` varchar(128) DEFAULT NULL,
  `time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itempetgetdata`
--

LOCK TABLES `itempetgetdata` WRITE;
/*!40000 ALTER TABLE `itempetgetdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `itempetgetdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemshop`
--

DROP TABLE IF EXISTS `itemshop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `itemshop` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` tinyint(1) NOT NULL DEFAULT '0',
  `flg2` tinyint(1) NOT NULL DEFAULT '0',
  `flg3` tinyint(1) NOT NULL DEFAULT '0',
  `flg4` tinyint(1) NOT NULL DEFAULT '0',
  `flg5` tinyint(1) NOT NULL DEFAULT '0',
  `paytotal` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemshop`
--

LOCK TABLES `itemshop` WRITE;
/*!40000 ALTER TABLE `itemshop` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemshop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemshop2`
--

DROP TABLE IF EXISTS `itemshop2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `itemshop2` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` tinyint(1) NOT NULL DEFAULT '0',
  `flg2` tinyint(1) NOT NULL DEFAULT '0',
  `flg3` tinyint(1) NOT NULL DEFAULT '0',
  `flg4` tinyint(1) NOT NULL DEFAULT '0',
  `flg5` tinyint(1) NOT NULL DEFAULT '0',
  `paytotal` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemshop2`
--

LOCK TABLES `itemshop2` WRITE;
/*!40000 ALTER TABLE `itemshop2` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemshop2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemshopnum`
--

DROP TABLE IF EXISTS `itemshopnum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `itemshopnum` (
  `id` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `sellnum` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemshopnum`
--

LOCK TABLES `itemshopnum` WRITE;
/*!40000 ALTER TABLE `itemshopnum` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemshopnum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemshopnum2`
--

DROP TABLE IF EXISTS `itemshopnum2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `itemshopnum2` (
  `id` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `sellnum` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemshopnum2`
--

LOCK TABLES `itemshopnum2` WRITE;
/*!40000 ALTER TABLE `itemshopnum2` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemshopnum2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jibaobuydata`
--

DROP TABLE IF EXISTS `jibaobuydata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jibaobuydata` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(10) NOT NULL,
  `check` tinyint(1) NOT NULL,
  `paytotal` int(11) NOT NULL,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `date` (`date`) USING BTREE,
  KEY `check` (`check`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jibaobuydata`
--

LOCK TABLES `jibaobuydata` WRITE;
/*!40000 ALTER TABLE `jibaobuydata` DISABLE KEYS */;
/*!40000 ALTER TABLE `jibaobuydata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jibaogift`
--

DROP TABLE IF EXISTS `jibaogift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jibaogift` (
  `cdkey` varchar(16) NOT NULL,
  `data` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jibaogift`
--

LOCK TABLES `jibaogift` WRITE;
/*!40000 ALTER TABLE `jibaogift` DISABLE KEYS */;
/*!40000 ALTER TABLE `jibaogift` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jibaopaiming`
--

DROP TABLE IF EXISTS `jibaopaiming`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jibaopaiming` (
  `id` int(11) NOT NULL,
  `name` varchar(32) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jibaopaiming`
--

LOCK TABLES `jibaopaiming` WRITE;
/*!40000 ALTER TABLE `jibaopaiming` DISABLE KEYS */;
/*!40000 ALTER TABLE `jibaopaiming` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jibaopaydata`
--

DROP TABLE IF EXISTS `jibaopaydata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jibaopaydata` (
  `cdkey` varchar(16) NOT NULL,
  `point` int(11) NOT NULL DEFAULT '0',
  `time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jibaopaydata`
--

LOCK TABLES `jibaopaydata` WRITE;
/*!40000 ALTER TABLE `jibaopaydata` DISABLE KEYS */;
/*!40000 ALTER TABLE `jibaopaydata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `klongxy`
--

DROP TABLE IF EXISTS `klongxy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `klongxy` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(10) NOT NULL,
  `num` int(11) NOT NULL,
  `num1` int(11) NOT NULL,
  `flg1` int(11) NOT NULL,
  `flg2` int(11) NOT NULL,
  `flg3` int(11) NOT NULL,
  `flg4` int(11) NOT NULL,
  `flg5` int(11) NOT NULL,
  `data1` int(11) NOT NULL,
  `data2` int(11) NOT NULL,
  `data3` int(11) NOT NULL,
  `data4` int(11) NOT NULL,
  `data5` int(11) NOT NULL,
  `data6` int(11) NOT NULL,
  `data7` int(11) NOT NULL,
  `data8` int(11) NOT NULL,
  `data9` int(11) NOT NULL,
  `data10` int(11) NOT NULL,
  `data11` int(11) NOT NULL,
  `data12` int(11) NOT NULL,
  `data13` int(11) NOT NULL,
  `data14` int(11) NOT NULL,
  `data15` int(11) NOT NULL,
  `data16` int(11) NOT NULL,
  `data17` int(11) NOT NULL,
  `data18` int(11) NOT NULL,
  `data19` int(11) NOT NULL,
  `data20` int(11) NOT NULL,
  `data21` int(11) NOT NULL,
  `data22` int(11) NOT NULL,
  `data23` int(11) NOT NULL,
  `data24` int(11) NOT NULL,
  `data25` int(11) NOT NULL,
  `data26` int(11) NOT NULL,
  `data27` int(11) NOT NULL,
  `data28` int(11) NOT NULL,
  `data29` int(11) NOT NULL,
  `data30` int(11) NOT NULL,
  `data31` int(11) NOT NULL,
  `zjl` int(11) NOT NULL,
  `jl` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `klongxy`
--

LOCK TABLES `klongxy` WRITE;
/*!40000 ALTER TABLE `klongxy` DISABLE KEYS */;
/*!40000 ALTER TABLE `klongxy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `langitem`
--

DROP TABLE IF EXISTS `langitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `langitem` (
  `cdkey` varchar(16) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `langitem`
--

LOCK TABLES `langitem` WRITE;
/*!40000 ALTER TABLE `langitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `langitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `levelitemdata`
--

DROP TABLE IF EXISTS `levelitemdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `levelitemdata` (
  `cdkey` varchar(16) NOT NULL DEFAULT '',
  `check` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `levelitemdata`
--

LOCK TABLES `levelitemdata` WRITE;
/*!40000 ALTER TABLE `levelitemdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `levelitemdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `levelitemnum`
--

DROP TABLE IF EXISTS `levelitemnum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `levelitemnum` (
  `id` int(11) NOT NULL,
  `trans` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `maxnum` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `levelitemnum`
--

LOCK TABLES `levelitemnum` WRITE;
/*!40000 ALTER TABLE `levelitemnum` DISABLE KEYS */;
/*!40000 ALTER TABLE `levelitemnum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lock`
--

DROP TABLE IF EXISTS `lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lock` (
  `Name` varchar(64) NOT NULL,
  `time` int(11) DEFAULT '0',
  PRIMARY KEY (`Name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lock`
--

LOCK TABLES `lock` WRITE;
/*!40000 ALTER TABLE `lock` DISABLE KEYS */;
/*!40000 ALTER TABLE `lock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locklog`
--

DROP TABLE IF EXISTS `locklog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `locklog` (
  `cdkey` varchar(16) NOT NULL,
  `type` varchar(16) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locklog`
--

LOCK TABLES `locklog` WRITE;
/*!40000 ALTER TABLE `locklog` DISABLE KEYS */;
/*!40000 ALTER TABLE `locklog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maclogin`
--

DROP TABLE IF EXISTS `maclogin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `maclogin` (
  `mac1` varchar(128) NOT NULL,
  `mac2` varchar(128) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cdkey` varchar(16) NOT NULL,
  `logincnt` int(11) NOT NULL,
  `onlinetime` int(11) NOT NULL,
  `ceshicnt` int(11) NOT NULL DEFAULT '0',
  `qq` varchar(16) DEFAULT NULL,
  `tjqq` varchar(16) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `mac1` (`mac1`) USING BTREE,
  KEY `mac2` (`mac2`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maclogin`
--

LOCK TABLES `maclogin` WRITE;
/*!40000 ALTER TABLE `maclogin` DISABLE KEYS */;
/*!40000 ALTER TABLE `maclogin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail`
--

DROP TABLE IF EXISTS `mail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mail` (
  `id` int(11) NOT NULL,
  `cdkey` varchar(32) NOT NULL,
  PRIMARY KEY (`id`,`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail`
--

LOCK TABLES `mail` WRITE;
/*!40000 ALTER TABLE `mail` DISABLE KEYS */;
/*!40000 ALTER TABLE `mail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maildata`
--

DROP TABLE IF EXISTS `maildata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `maildata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) DEFAULT '0',
  `cdkey` varchar(16) DEFAULT NULL,
  `buff1` varchar(255) DEFAULT NULL,
  `buff2` varchar(255) DEFAULT NULL,
  `data` int(11) DEFAULT '0',
  `sendtime` int(11) DEFAULT '0',
  `endtime` int(11) DEFAULT '0',
  `check` int(11) DEFAULT '0',
  `deleamill` int(11) DEFAULT '0',
  `buff3` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY ```cdkey``` (`cdkey`) USING BTREE,
  KEY ```type``` (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maildata`
--

LOCK TABLES `maildata` WRITE;
/*!40000 ALTER TABLE `maildata` DISABLE KEYS */;
/*!40000 ALTER TABLE `maildata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `makedata`
--

DROP TABLE IF EXISTS `makedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `makedata` (
  `cdkey` varchar(16) NOT NULL,
  `Makenum` int(11) NOT NULL,
  `sellnum` int(11) NOT NULL,
  `PointPay` int(11) NOT NULL,
  `ShuiJing` int(11) NOT NULL,
  `dayTime` varchar(32) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `makedata`
--

LOCK TABLES `makedata` WRITE;
/*!40000 ALTER TABLE `makedata` DISABLE KEYS */;
/*!40000 ALTER TABLE `makedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mmexp`
--

DROP TABLE IF EXISTS `mmexp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mmexp` (
  `cdkey` varchar(16) NOT NULL,
  `time1` int(11) NOT NULL DEFAULT '0',
  `hour1` int(11) NOT NULL DEFAULT '0',
  `itemuid1` varchar(32) NOT NULL,
  `lockState1` int(11) NOT NULL,
  `time2` int(11) NOT NULL DEFAULT '0',
  `hour2` int(11) NOT NULL DEFAULT '0',
  `itemuid2` varchar(32) NOT NULL,
  `lockState2` int(11) NOT NULL,
  `time3` int(11) NOT NULL DEFAULT '0',
  `hour3` int(11) NOT NULL DEFAULT '0',
  `itemuid3` varchar(32) NOT NULL,
  `lockState3` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mmexp`
--

LOCK TABLES `mmexp` WRITE;
/*!40000 ALTER TABLE `mmexp` DISABLE KEYS */;
INSERT INTO `mmexp` VALUES ('e7fa56ea5853',0,0,'0',1,0,0,'0',1,0,0,'0',1);
/*!40000 ALTER TABLE `mmexp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mofame`
--

DROP TABLE IF EXISTS `mofame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mofame` (
  `cdkey` varchar(12) NOT NULL,
  `date` varchar(12) DEFAULT NULL,
  `num` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mofame`
--

LOCK TABLES `mofame` WRITE;
/*!40000 ALTER TABLE `mofame` DISABLE KEYS */;
/*!40000 ALTER TABLE `mofame` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `molog`
--

DROP TABLE IF EXISTS `molog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `molog` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `molog`
--

LOCK TABLES `molog` WRITE;
/*!40000 ALTER TABLE `molog` DISABLE KEYS */;
/*!40000 ALTER TABLE `molog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mousedata`
--

DROP TABLE IF EXISTS `mousedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mousedata` (
  `cdkey` varchar(16) NOT NULL,
  `itemid` int(11) NOT NULL,
  `date` varchar(10) NOT NULL,
  `check` int(11) NOT NULL,
  `open` int(11) NOT NULL,
  KEY `cdkey` (`cdkey`) USING BTREE COMMENT '账号',
  KEY `check` (`check`) USING BTREE COMMENT '检索'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mousedata`
--

LOCK TABLES `mousedata` WRITE;
/*!40000 ALTER TABLE `mousedata` DISABLE KEYS */;
/*!40000 ALTER TABLE `mousedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mowangcnt`
--

DROP TABLE IF EXISTS `mowangcnt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mowangcnt` (
  `cdkey` varchar(32) NOT NULL,
  `date` varchar(11) DEFAULT NULL,
  `cnt` int(11) DEFAULT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mowangcnt`
--

LOCK TABLES `mowangcnt` WRITE;
/*!40000 ALTER TABLE `mowangcnt` DISABLE KEYS */;
/*!40000 ALTER TABLE `mowangcnt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mysteryshop`
--

DROP TABLE IF EXISTS `mysteryshop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mysteryshop` (
  `cdkey` varchar(32) NOT NULL,
  `totalrefresh` int(11) NOT NULL,
  `refreshcost` int(11) NOT NULL,
  `weekrefresh` int(11) NOT NULL,
  `yearweek` varchar(16) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `itemid1` int(11) NOT NULL,
  `discount1` int(11) NOT NULL,
  `costtype1` int(11) NOT NULL,
  `cost1` int(11) NOT NULL,
  `itemid2` int(11) NOT NULL,
  `discount2` int(11) NOT NULL,
  `costtype2` int(11) NOT NULL,
  `cost2` int(11) NOT NULL,
  `itemid3` int(11) NOT NULL,
  `discount3` int(11) NOT NULL,
  `costtype3` int(11) NOT NULL,
  `cost3` int(11) NOT NULL,
  `itemid4` int(11) NOT NULL,
  `discount4` int(11) NOT NULL,
  `costtype4` int(11) NOT NULL,
  `cost4` int(11) NOT NULL,
  `itemid5` int(11) NOT NULL,
  `discount5` int(11) NOT NULL,
  `costtype5` int(11) NOT NULL,
  `cost5` int(11) NOT NULL,
  `itemid6` int(11) NOT NULL,
  `discount6` int(11) NOT NULL,
  `costtype6` int(11) NOT NULL,
  `cost6` int(11) NOT NULL,
  `itemid7` int(11) NOT NULL,
  `discount7` int(11) NOT NULL,
  `costtype7` int(11) NOT NULL,
  `cost7` int(11) NOT NULL,
  `itemid8` int(11) NOT NULL,
  `discount8` int(11) NOT NULL,
  `costtype8` int(11) NOT NULL,
  `cost8` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mysteryshop`
--

LOCK TABLES `mysteryshop` WRITE;
/*!40000 ALTER TABLE `mysteryshop` DISABLE KEYS */;
/*!40000 ALTER TABLE `mysteryshop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mysteryshoplog`
--

DROP TABLE IF EXISTS `mysteryshoplog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mysteryshoplog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cdkey` int(11) NOT NULL,
  `name` varchar(32) NOT NULL,
  `itemid` int(11) NOT NULL,
  `itemname` varchar(32) NOT NULL,
  `costtype` int(11) NOT NULL,
  `discount` int(11) NOT NULL,
  `cost` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mysteryshoplog`
--

LOCK TABLES `mysteryshoplog` WRITE;
/*!40000 ALTER TABLE `mysteryshoplog` DISABLE KEYS */;
/*!40000 ALTER TABLE `mysteryshoplog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newfb`
--

DROP TABLE IF EXISTS `newfb`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newfb` (
  `Account` char(16) DEFAULT NULL,
  `Name` char(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `FBdata` char(6) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newfb`
--

LOCK TABLES `newfb` WRITE;
/*!40000 ALTER TABLE `newfb` DISABLE KEYS */;
/*!40000 ALTER TABLE `newfb` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `niandidata`
--

DROP TABLE IF EXISTS `niandidata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `niandidata` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` tinyint(1) NOT NULL DEFAULT '0',
  `flg2` tinyint(1) NOT NULL DEFAULT '0',
  `flg3` tinyint(1) NOT NULL DEFAULT '0',
  `flg4` tinyint(1) NOT NULL DEFAULT '0',
  `flg5` tinyint(1) NOT NULL DEFAULT '0',
  `paytotal` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `niandidata`
--

LOCK TABLES `niandidata` WRITE;
/*!40000 ALTER TABLE `niandidata` DISABLE KEYS */;
/*!40000 ALTER TABLE `niandidata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `niandinum`
--

DROP TABLE IF EXISTS `niandinum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `niandinum` (
  `id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `sellnum` int(11) NOT NULL,
  `buynum` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `niandinum`
--

LOCK TABLES `niandinum` WRITE;
/*!40000 ALTER TABLE `niandinum` DISABLE KEYS */;
/*!40000 ALTER TABLE `niandinum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onlinebuy`
--

DROP TABLE IF EXISTS `onlinebuy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onlinebuy` (
  `CostPasswd` varchar(32) NOT NULL,
  `CostStr` varchar(64) DEFAULT NULL,
  `cdkey` varchar(32) DEFAULT NULL,
  `CostTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `check` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`CostPasswd`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onlinebuy`
--

LOCK TABLES `onlinebuy` WRITE;
/*!40000 ALTER TABLE `onlinebuy` DISABLE KEYS */;
/*!40000 ALTER TABLE `onlinebuy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onlinecost`
--

DROP TABLE IF EXISTS `onlinecost`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onlinecost` (
  `CostPasswd` varchar(32) NOT NULL,
  `CostVal` int(11) NOT NULL,
  `PayVal` int(11) NOT NULL,
  `cdkey` varchar(32) DEFAULT NULL,
  `CostTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `check` tinyint(1) NOT NULL DEFAULT '1',
  `creator` varchar(32) DEFAULT NULL,
  UNIQUE KEY `CostPasswd` (`CostPasswd`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onlinecost`
--

LOCK TABLES `onlinecost` WRITE;
/*!40000 ALTER TABLE `onlinecost` DISABLE KEYS */;
/*!40000 ALTER TABLE `onlinecost` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paipaisonginfo`
--

DROP TABLE IF EXISTS `paipaisonginfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paipaisonginfo` (
  `cdkey` varchar(32) NOT NULL COMMENT '账号',
  `name` varchar(32) NOT NULL COMMENT '名字',
  `nowpoint` int(11) NOT NULL DEFAULT '0' COMMENT '可用积分',
  `maxpoint` int(11) NOT NULL DEFAULT '0' COMMENT '最大积分',
  `flg` int(11) NOT NULL DEFAULT '0',
  `check` int(11) NOT NULL DEFAULT '0' COMMENT '领奖标记',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后时间',
  `count1` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量1',
  `count2` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量2',
  `count3` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量3',
  `count4` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量4',
  `count5` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量5',
  `count6` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量6',
  `count7` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量7',
  `count8` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量8',
  `count9` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量9',
  `count10` int(11) NOT NULL DEFAULT '0' COMMENT '兑换数量10',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='来吉卡积分排行/兑换活动';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paipaisonginfo`
--

LOCK TABLES `paipaisonginfo` WRITE;
/*!40000 ALTER TABLE `paipaisonginfo` DISABLE KEYS */;
/*!40000 ALTER TABLE `paipaisonginfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paipaisonglog`
--

DROP TABLE IF EXISTS `paipaisonglog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paipaisonglog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cdkey` varchar(32) DEFAULT NULL,
  `name` varchar(42) DEFAULT NULL,
  `itemId` int(11) DEFAULT NULL,
  `itemName` varchar(42) DEFAULT NULL,
  `itemLevel` int(11) DEFAULT NULL,
  `LuckPoin` int(11) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rare` int(11) DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paipaisonglog`
--

LOCK TABLES `paipaisonglog` WRITE;
/*!40000 ALTER TABLE `paipaisonglog` DISABLE KEYS */;
/*!40000 ALTER TABLE `paipaisonglog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paipaisonglucklog`
--

DROP TABLE IF EXISTS `paipaisonglucklog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paipaisonglucklog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cdkey` varchar(32) DEFAULT NULL,
  `name` varchar(42) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paipaisonglucklog`
--

LOCK TABLES `paipaisonglucklog` WRITE;
/*!40000 ALTER TABLE `paipaisonglucklog` DISABLE KEYS */;
/*!40000 ALTER TABLE `paipaisonglucklog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paipaisongpoolitem`
--

DROP TABLE IF EXISTS `paipaisongpoolitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paipaisongpoolitem` (
  `cdkey` varchar(16) NOT NULL,
  `ITEM_ID` int(11) NOT NULL,
  `ITEM_DAMAGEBREAK` int(11) NOT NULL,
  `ITEM_USEPILENUMS` int(11) NOT NULL,
  `ITEM_DAMAGECRUSHE` int(11) NOT NULL,
  `ITEM_MAXDAMAGECRUSHE` int(11) NOT NULL,
  `ITEM_OTHERDAMAGE` int(11) NOT NULL,
  `ITEM_OTHERDEFC` int(11) NOT NULL,
  `ITEM_ATTACKNUM_MIN` int(11) NOT NULL,
  `ITEM_ATTACKNUM_MAX` int(11) NOT NULL,
  `ITEM_MODIFYATTACK` int(11) NOT NULL,
  `ITEM_MODIFYDEFENCE` int(11) NOT NULL,
  `ITEM_MODIFYQUICK` int(11) NOT NULL,
  `ITEM_MODIFYHP` int(11) NOT NULL,
  `ITEM_MODIFYMP` int(11) NOT NULL,
  `ITEM_MODIFYLUCK` int(11) NOT NULL,
  `ITEM_MODIFYCHARM` int(11) NOT NULL,
  `ITEM_MODIFYAVOID` int(11) NOT NULL,
  `ITEM_MODIFYATTRIB` int(11) NOT NULL,
  `ITEM_MODIFYATTRIBVALUE` int(11) NOT NULL,
  `ITEM_MODIFYARRANGE` int(11) NOT NULL,
  `ITEM_MODIFYSEQUENCE` int(11) NOT NULL,
  `ITEM_ATTACHPILE` int(11) NOT NULL,
  `ITEM_HITRIGHT` int(11) NOT NULL,
  `ITEM_NEGLECTGUARD` int(11) NOT NULL,
  `ITEM_POISON` int(11) NOT NULL,
  `ITEM_PARALYSIS` int(11) NOT NULL,
  `ITEM_SLEEP` int(11) NOT NULL,
  `ITEM_STONE` int(11) NOT NULL,
  `ITEM_DRUNK` int(11) NOT NULL,
  `ITEM_CONFUSION` int(11) NOT NULL,
  `ITEM_CRITICAL` int(11) NOT NULL,
  `ITEM_COLOER` int(11) NOT NULL,
  `ITEM_MERGEFLG` int(11) NOT NULL,
  `ITEM_NAME` varchar(64) NOT NULL,
  `ITEM_SECRETNAME` varchar(64) NOT NULL,
  `ITEM_EFFECTSTRING` varchar(128) NOT NULL,
  `ITEM_ARGUMENT` varchar(128) NOT NULL,
  `ITEM_UNIQUECODE` varchar(64) NOT NULL,
  `ITEM_BASEIMAGENUMBER` int(11) NOT NULL DEFAULT '-1',
  `uid` varchar(16) NOT NULL DEFAULT '',
  `ITEM_LOCKED` tinyint(4) DEFAULT '0',
  `ITEM_USETIME` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ITEM_UNIQUECODE`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE,
  KEY `ITEM_ID` (`ITEM_ID`) USING BTREE,
  KEY `ITEM_USEPILENUMS` (`ITEM_USEPILENUMS`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paipaisongpoolitem`
--

LOCK TABLES `paipaisongpoolitem` WRITE;
/*!40000 ALTER TABLE `paipaisongpoolitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `paipaisongpoolitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paipaisongsell`
--

DROP TABLE IF EXISTS `paipaisongsell`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paipaisongsell` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cdkey` varchar(32) DEFAULT NULL,
  `name` varchar(42) DEFAULT NULL,
  `poinstr` varchar(24) DEFAULT NULL,
  `num` int(11) DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `oldpoin` int(11) DEFAULT NULL,
  `nowpoin` int(11) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paipaisongsell`
--

LOCK TABLES `paipaisongsell` WRITE;
/*!40000 ALTER TABLE `paipaisongsell` DISABLE KEYS */;
/*!40000 ALTER TABLE `paipaisongsell` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pauctioninfo`
--

DROP TABLE IF EXISTS `pauctioninfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pauctioninfo` (
  `cdkey` varchar(12) DEFAULT NULL,
  `name` varchar(32) DEFAULT NULL,
  `effect` varchar(128) DEFAULT NULL,
  `cost` int(11) DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `info` varchar(64) DEFAULT NULL,
  `string` varchar(64) DEFAULT NULL,
  `day` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pauctioninfo`
--

LOCK TABLES `pauctioninfo` WRITE;
/*!40000 ALTER TABLE `pauctioninfo` DISABLE KEYS */;
/*!40000 ALTER TABLE `pauctioninfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pay_log`
--

DROP TABLE IF EXISTS `pay_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pay_log` (
  `sdorderno` varchar(20) NOT NULL,
  `total_fee` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `remark` varchar(50) NOT NULL,
  `paytime` varchar(32) NOT NULL,
  `status` tinyint(4) NOT NULL,
  UNIQUE KEY `sdorderno` (`sdorderno`),
  KEY `status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pay_log`
--

LOCK TABLES `pay_log` WRITE;
/*!40000 ALTER TABLE `pay_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `pay_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paydata`
--

DROP TABLE IF EXISTS `paydata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paydata` (
  `cdkey` varchar(16) NOT NULL,
  `point` int(11) NOT NULL DEFAULT '0',
  `time` timestamp NULL DEFAULT NULL,
  `check` int(11) DEFAULT '0',
  `totalcheck` int(11) DEFAULT '0',
  `G_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paydata`
--

LOCK TABLES `paydata` WRITE;
/*!40000 ALTER TABLE `paydata` DISABLE KEYS */;
/*!40000 ALTER TABLE `paydata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paydaydata`
--

DROP TABLE IF EXISTS `paydaydata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paydaydata` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(10) NOT NULL,
  `point` int(11) DEFAULT '0',
  `time` int(11) DEFAULT '0',
  `check` int(11) DEFAULT '0',
  `totalcheck` int(11) DEFAULT '0',
  `G_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`cdkey`,`date`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `point` (`point`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paydaydata`
--

LOCK TABLES `paydaydata` WRITE;
/*!40000 ALTER TABLE `paydaydata` DISABLE KEYS */;
/*!40000 ALTER TABLE `paydaydata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paylog`
--

DROP TABLE IF EXISTS `paylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paylog` (
  `id` varchar(128) NOT NULL,
  `cdkey` varchar(16) NOT NULL,
  `rmb` int(11) NOT NULL,
  `Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `check` int(11) DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paylog`
--

LOCK TABLES `paylog` WRITE;
/*!40000 ALTER TABLE `paylog` DISABLE KEYS */;
/*!40000 ALTER TABLE `paylog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paylogali`
--

DROP TABLE IF EXISTS `paylogali`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paylogali` (
  `id` varchar(128) NOT NULL,
  `payid` varchar(128) DEFAULT NULL,
  `cdkey` varchar(16) NOT NULL,
  `money` int(11) NOT NULL,
  `createtime` timestamp NULL DEFAULT NULL,
  `finishtime` timestamp NULL DEFAULT NULL,
  `check` int(11) DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paylogali`
--

LOCK TABLES `paylogali` WRITE;
/*!40000 ALTER TABLE `paylogali` DISABLE KEYS */;
/*!40000 ALTER TABLE `paylogali` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paylogyj`
--

DROP TABLE IF EXISTS `paylogyj`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paylogyj` (
  `id` varchar(128) NOT NULL,
  `payid` varchar(128) DEFAULT NULL,
  `cdkey` varchar(16) NOT NULL,
  `money` int(11) NOT NULL,
  `createtime` timestamp NULL DEFAULT NULL,
  `finishtime` timestamp NULL DEFAULT NULL,
  `check` int(11) DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paylogyj`
--

LOCK TABLES `paylogyj` WRITE;
/*!40000 ALTER TABLE `paylogyj` DISABLE KEYS */;
/*!40000 ALTER TABLE `paylogyj` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paytotaldata`
--

DROP TABLE IF EXISTS `paytotaldata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paytotaldata` (
  `cdkey` varchar(16) NOT NULL,
  `check` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paytotaldata`
--

LOCK TABLES `paytotaldata` WRITE;
/*!40000 ALTER TABLE `paytotaldata` DISABLE KEYS */;
/*!40000 ALTER TABLE `paytotaldata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petbilling`
--

DROP TABLE IF EXISTS `petbilling`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petbilling` (
  `petId` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `name` varchar(32) NOT NULL,
  `imageId` int(11) NOT NULL,
  `lv` int(11) NOT NULL,
  `di` int(11) NOT NULL,
  `shui` int(11) NOT NULL,
  `huo` int(11) NOT NULL,
  `feng` int(11) NOT NULL,
  `hp` int(11) NOT NULL,
  `attack` int(11) NOT NULL,
  `def` int(11) NOT NULL,
  `quick` int(11) NOT NULL,
  `oldlv` int(11) NOT NULL,
  `oldhp` int(11) NOT NULL,
  `oldattack` int(11) NOT NULL,
  `olddef` int(11) NOT NULL,
  `oldquick` int(11) NOT NULL,
  `zhuhp` int(11) NOT NULL,
  `zhustr` int(11) NOT NULL,
  `zhuvgh` int(11) NOT NULL,
  `zhudex` int(11) NOT NULL,
  `unicode` varchar(32) NOT NULL DEFAULT '',
  `author` varchar(32) NOT NULL DEFAULT '无',
  `vital` int(11) DEFAULT '0',
  `str` int(11) DEFAULT '0',
  `tough` int(11) DEFAULT '0',
  `dex` int(11) DEFAULT '0',
  `cdkey` varchar(32) NOT NULL,
  PRIMARY KEY (`petId`,`type`) USING BTREE,
  KEY `unicode` (`unicode`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petbilling`
--

LOCK TABLES `petbilling` WRITE;
/*!40000 ALTER TABLE `petbilling` DISABLE KEYS */;
/*!40000 ALTER TABLE `petbilling` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petchangepk`
--

DROP TABLE IF EXISTS `petchangepk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petchangepk` (
  `cdkey` varchar(16) NOT NULL,
  `Name` varchar(30) DEFAULT '' COMMENT '人物名称',
  `cost` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `totalcheck` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE COMMENT '账号',
  KEY `OnlineName` (`Name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petchangepk`
--

LOCK TABLES `petchangepk` WRITE;
/*!40000 ALTER TABLE `petchangepk` DISABLE KEYS */;
/*!40000 ALTER TABLE `petchangepk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petdata`
--

DROP TABLE IF EXISTS `petdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petdata` (
  `petno` int(11) NOT NULL,
  `oldlv` int(11) NOT NULL,
  `oldminhp` int(11) NOT NULL,
  `oldminstr` int(11) NOT NULL,
  `oldmintgh` int(11) NOT NULL,
  `oldmindex` int(11) NOT NULL,
  `oldmaxhp` int(11) NOT NULL,
  `oldmaxstr` int(11) NOT NULL,
  `oldmaxtgh` int(11) NOT NULL,
  `oldmaxdex` int(11) NOT NULL,
  `petlv` int(11) NOT NULL,
  `petminhp` int(11) NOT NULL,
  `petminstr` int(11) NOT NULL,
  `petmintgh` int(11) NOT NULL,
  `petmindex` int(11) NOT NULL,
  `petmaxhp` int(11) NOT NULL,
  `petmaxstr` int(11) NOT NULL,
  `petmaxtgh` int(11) NOT NULL,
  `petmaxdex` int(11) NOT NULL,
  PRIMARY KEY (`petno`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petdata`
--

LOCK TABLES `petdata` WRITE;
/*!40000 ALTER TABLE `petdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `petdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petlock`
--

DROP TABLE IF EXISTS `petlock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petlock` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(8) NOT NULL,
  `cnt` int(11) DEFAULT '0',
  `index` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petlock`
--

LOCK TABLES `petlock` WRITE;
/*!40000 ALTER TABLE `petlock` DISABLE KEYS */;
/*!40000 ALTER TABLE `petlock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petlockdata`
--

DROP TABLE IF EXISTS `petlockdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petlockdata` (
  `cdkey` varchar(32) NOT NULL,
  `phone` varchar(16) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petlockdata`
--

LOCK TABLES `petlockdata` WRITE;
/*!40000 ALTER TABLE `petlockdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `petlockdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petnametype`
--

DROP TABLE IF EXISTS `petnametype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petnametype` (
  `name` varchar(64) NOT NULL,
  `petid` int(11) NOT NULL,
  PRIMARY KEY (`petid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petnametype`
--

LOCK TABLES `petnametype` WRITE;
/*!40000 ALTER TABLE `petnametype` DISABLE KEYS */;
INSERT INTO `petnametype` VALUES ('帖拉所伊朵',304);
/*!40000 ALTER TABLE `petnametype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petpointshop`
--

DROP TABLE IF EXISTS `petpointshop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petpointshop` (
  `cdkey` varchar(16) NOT NULL,
  `1` tinyint(1) NOT NULL DEFAULT '0',
  `2` tinyint(1) NOT NULL DEFAULT '0',
  `3` tinyint(1) NOT NULL DEFAULT '0',
  `4` tinyint(1) NOT NULL DEFAULT '0',
  `5` tinyint(1) NOT NULL DEFAULT '0',
  `6` tinyint(1) NOT NULL DEFAULT '0',
  `7` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `1` (`1`) USING BTREE,
  KEY `2` (`2`) USING BTREE,
  KEY `3` (`3`) USING BTREE,
  KEY `4` (`4`) USING BTREE,
  KEY `5` (`5`) USING BTREE,
  KEY `6` (`6`) USING BTREE,
  KEY `7` (`7`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petpointshop`
--

LOCK TABLES `petpointshop` WRITE;
/*!40000 ALTER TABLE `petpointshop` DISABLE KEYS */;
/*!40000 ALTER TABLE `petpointshop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petracedata`
--

DROP TABLE IF EXISTS `petracedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petracedata` (
  `id` varchar(64) NOT NULL,
  `cdkey` varchar(16) NOT NULL,
  `time` int(11) NOT NULL,
  `playerselect` tinyint(4) NOT NULL,
  `resultselect` tinyint(4) NOT NULL,
  `jiang` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petracedata`
--

LOCK TABLES `petracedata` WRITE;
/*!40000 ALTER TABLE `petracedata` DISABLE KEYS */;
/*!40000 ALTER TABLE `petracedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petrank`
--

DROP TABLE IF EXISTS `petrank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petrank` (
  `unicode` varchar(32) NOT NULL,
  `unicode2` varchar(32) NOT NULL,
  `petid` int(11) NOT NULL,
  `sourceid` int(11) NOT NULL,
  `name` varchar(32) NOT NULL,
  `ilv` int(11) NOT NULL,
  `ihp` int(11) NOT NULL,
  `iattack` int(11) NOT NULL,
  `idef` int(11) NOT NULL,
  `iquick` int(11) NOT NULL,
  `hp` int(11) NOT NULL,
  `attack` int(11) NOT NULL,
  `def` int(11) NOT NULL,
  `quick` int(11) NOT NULL,
  `sum` double NOT NULL,
  `growth` double NOT NULL,
  `zhp` int(11) NOT NULL,
  `zattack` int(11) NOT NULL,
  `zdef` int(11) NOT NULL,
  `zquick` int(11) NOT NULL,
  `skill1` int(11) NOT NULL,
  `skill2` int(11) NOT NULL,
  `skill3` int(11) NOT NULL,
  `skill4` int(11) NOT NULL,
  `skill5` int(11) NOT NULL,
  `skill6` int(11) NOT NULL,
  `skill7` int(11) NOT NULL,
  `skill8` int(11) NOT NULL,
  `skill9` int(11) NOT NULL,
  `skill10` int(11) NOT NULL,
  `skill11` int(11) NOT NULL,
  `author` varchar(32) NOT NULL,
  `cdkey` varchar(32) NOT NULL,
  `check` int(11) NOT NULL DEFAULT '0',
  `inserttime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`unicode`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petrank`
--

LOCK TABLES `petrank` WRITE;
/*!40000 ALTER TABLE `petrank` DISABLE KEYS */;
/*!40000 ALTER TABLE `petrank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petsystem`
--

DROP TABLE IF EXISTS `petsystem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petsystem` (
  `petid` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `maxnum` int(11) NOT NULL,
  PRIMARY KEY (`petid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petsystem`
--

LOCK TABLES `petsystem` WRITE;
/*!40000 ALTER TABLE `petsystem` DISABLE KEYS */;
/*!40000 ALTER TABLE `petsystem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petsystemlog`
--

DROP TABLE IF EXISTS `petsystemlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petsystemlog` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `petname` varchar(32) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petsystemlog`
--

LOCK TABLES `petsystemlog` WRITE;
/*!40000 ALTER TABLE `petsystemlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `petsystemlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petup`
--

DROP TABLE IF EXISTS `petup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petup` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `petname` varchar(32) NOT NULL,
  `petno` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petup`
--

LOCK TABLES `petup` WRITE;
/*!40000 ALTER TABLE `petup` DISABLE KEYS */;
/*!40000 ALTER TABLE `petup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phonesn`
--

DROP TABLE IF EXISTS `phonesn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `phonesn` (
  `Phone` varchar(16) NOT NULL,
  `Num` int(11) NOT NULL,
  `Cdkey` varchar(32) NOT NULL,
  `ItemId` int(11) NOT NULL,
  `check` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`Phone`) USING BTREE,
  KEY `Cdkey` (`Cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phonesn`
--

LOCK TABLES `phonesn` WRITE;
/*!40000 ALTER TABLE `phonesn` DISABLE KEYS */;
/*!40000 ALTER TABLE `phonesn` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pkdasai`
--

DROP TABLE IF EXISTS `pkdasai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pkdasai` (
  `session` smallint(6) DEFAULT NULL,
  `account1` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name1` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account2` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name2` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account3` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name3` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account4` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name4` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account5` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name5` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account6` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name6` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account7` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name7` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account8` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name8` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account9` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name9` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account10` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name10` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account11` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name11` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account12` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name12` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account13` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name13` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account14` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name14` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account15` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name15` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `account16` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `name16` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `champion` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `flag1` tinyint(1) DEFAULT NULL,
  `second` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `flag2` tinyint(1) DEFAULT NULL,
  `third` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `flag3` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pkdasai`
--

LOCK TABLES `pkdasai` WRITE;
/*!40000 ALTER TABLE `pkdasai` DISABLE KEYS */;
/*!40000 ALTER TABLE `pkdasai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pkdata`
--

DROP TABLE IF EXISTS `pkdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pkdata` (
  `cdkey` varchar(16) NOT NULL,
  `type` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pkdata`
--

LOCK TABLES `pkdata` WRITE;
/*!40000 ALTER TABLE `pkdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `pkdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playerdata`
--

DROP TABLE IF EXISTS `playerdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playerdata` (
  `cdkey` varchar(32) NOT NULL,
  `uid` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `face` int(11) NOT NULL,
  `lv` int(11) NOT NULL,
  `trn` int(11) NOT NULL,
  `fmindex` int(11) NOT NULL,
  `fmname` varchar(32) NOT NULL,
  `fmsprite` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playerdata`
--

LOCK TABLES `playerdata` WRITE;
/*!40000 ALTER TABLE `playerdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `playerdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playerquestion`
--

DROP TABLE IF EXISTS `playerquestion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playerquestion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cdkey` varchar(16) NOT NULL,
  `questionid` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `questionid` (`questionid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playerquestion`
--

LOCK TABLES `playerquestion` WRITE;
/*!40000 ALTER TABLE `playerquestion` DISABLE KEYS */;
/*!40000 ALTER TABLE `playerquestion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pooldata`
--

DROP TABLE IF EXISTS `pooldata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pooldata` (
  `cdkey` varchar(16) NOT NULL,
  `petnum` int(11) NOT NULL,
  `itemnum` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pooldata`
--

LOCK TABLES `pooldata` WRITE;
/*!40000 ALTER TABLE `pooldata` DISABLE KEYS */;
INSERT INTO `pooldata` VALUES ('e7fa56ea5853',10,15),('f4564523d9hh',10,15);
/*!40000 ALTER TABLE `pooldata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poolitem`
--

DROP TABLE IF EXISTS `poolitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poolitem` (
  `cdkey` varchar(16) NOT NULL COMMENT '账号',
  `ITEM_ID` int(11) NOT NULL COMMENT '序号',
  `ITEM_DAMAGEBREAK` int(11) NOT NULL COMMENT '物品使用次数',
  `ITEM_USEPILENUMS` int(11) NOT NULL COMMENT '物品堆叠次数',
  `ITEM_DAMAGECRUSHE` int(11) NOT NULL COMMENT '最小度',
  `ITEM_MAXDAMAGECRUSHE` int(11) NOT NULL COMMENT '最大度',
  `ITEM_OTHERDAMAGE` int(11) NOT NULL COMMENT '伤',
  `ITEM_OTHERDEFC` int(11) NOT NULL COMMENT '吸',
  `ITEM_ATTACKNUM_MIN` int(11) NOT NULL COMMENT '最小攻击',
  `ITEM_ATTACKNUM_MAX` int(11) NOT NULL COMMENT '最大攻击',
  `ITEM_MODIFYATTACK` int(11) NOT NULL COMMENT '攻',
  `ITEM_MODIFYDEFENCE` int(11) NOT NULL COMMENT '防',
  `ITEM_MODIFYQUICK` int(11) NOT NULL COMMENT '敏',
  `ITEM_MODIFYHP` int(11) NOT NULL COMMENT 'HP',
  `ITEM_MODIFYMP` int(11) NOT NULL COMMENT 'MP',
  `ITEM_MODIFYLUCK` int(11) NOT NULL COMMENT '运气',
  `ITEM_MODIFYCHARM` int(11) NOT NULL COMMENT '魅力',
  `ITEM_MODIFYAVOID` int(11) NOT NULL COMMENT '回避',
  `ITEM_MODIFYATTRIB` int(11) NOT NULL COMMENT '属性',
  `ITEM_MODIFYATTRIBVALUE` int(11) NOT NULL COMMENT '属性比例',
  `ITEM_MODIFYARRANGE` int(11) NOT NULL COMMENT '格档',
  `ITEM_MODIFYSEQUENCE` int(11) NOT NULL COMMENT '次序',
  `ITEM_ATTACHPILE` int(11) NOT NULL COMMENT '负重',
  `ITEM_HITRIGHT` int(11) NOT NULL COMMENT '命中',
  `ITEM_NEGLECTGUARD` int(11) NOT NULL COMMENT '忽防',
  `ITEM_POISON` int(11) NOT NULL COMMENT '毒耐',
  `ITEM_PARALYSIS` int(11) NOT NULL COMMENT '麻耐',
  `ITEM_SLEEP` int(11) NOT NULL COMMENT '睡耐',
  `ITEM_STONE` int(11) NOT NULL COMMENT '石耐',
  `ITEM_DRUNK` int(11) NOT NULL COMMENT '酒耐',
  `ITEM_CONFUSION` int(11) NOT NULL COMMENT '混耐',
  `ITEM_CRITICAL` int(11) NOT NULL COMMENT '会心',
  `ITEM_COLOER` int(11) NOT NULL COMMENT '颜色',
  `ITEM_MERGEFLG` int(11) NOT NULL COMMENT '合成',
  `ITEM_NAME` varchar(64) NOT NULL COMMENT '名称',
  `ITEM_SECRETNAME` varchar(64) NOT NULL COMMENT '显示名',
  `ITEM_EFFECTSTRING` varchar(128) NOT NULL COMMENT '说明',
  `ITEM_ARGUMENT` varchar(128) NOT NULL COMMENT '字段',
  `ITEM_UNIQUECODE` varchar(64) NOT NULL COMMENT '编码',
  `ITEM_BASEIMAGENUMBER` int(11) NOT NULL DEFAULT '-1' COMMENT '图号',
  `ITEM_LOCKED` tinyint(4) DEFAULT '0' COMMENT '安全锁',
  `ITEM_USETIME` int(11) NOT NULL DEFAULT '0' COMMENT '物品时间',
  `ITEM_MAGICID` int(11) DEFAULT '-1' COMMENT '精灵',
  `ITEM_TYPECODE` varchar(64) NOT NULL COMMENT '类型代码',
  `ITEM_INLAYCODE` varchar(64) NOT NULL COMMENT '镶嵌代码',
  `uid` varchar(16) NOT NULL DEFAULT '',
  PRIMARY KEY (`ITEM_UNIQUECODE`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE,
  KEY `ITEM_ID` (`ITEM_ID`) USING BTREE,
  KEY `ITEM_USEPILENUMS` (`ITEM_USEPILENUMS`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poolitem`
--

LOCK TABLES `poolitem` WRITE;
/*!40000 ALTER TABLE `poolitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `poolitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poolpet`
--

DROP TABLE IF EXISTS `poolpet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poolpet` (
  `cdkey` varchar(16) NOT NULL,
  `CHAR_PETID` int(11) NOT NULL,
  `CHAR_BASEIMAGENUMBER` int(11) NOT NULL,
  `CHAR_BASEBASEIMAGENUMBER` int(11) NOT NULL,
  `CHAR_DIR` int(11) NOT NULL,
  `CHAR_LV` int(11) NOT NULL,
  `CHAR_VITAL` int(11) NOT NULL,
  `CHAR_STR` int(11) NOT NULL,
  `CHAR_TOUGH` int(11) NOT NULL,
  `CHAR_DEX` int(11) NOT NULL,
  `CHAR_MODAI` int(11) NOT NULL,
  `CHAR_VARIABLEAI` int(11) NOT NULL,
  `CHAR_EARTHAT` int(11) NOT NULL,
  `CHAR_WATERAT` int(11) NOT NULL,
  `CHAR_FIREAT` int(11) NOT NULL,
  `CHAR_WINDAT` int(11) NOT NULL,
  `CHAR_SLOT` int(11) NOT NULL,
  `CHAR_CRITIAL` int(11) NOT NULL,
  `CHAR_DEADCOUNT` int(11) NOT NULL,
  `CHAR_DAMAGECOUNT` int(11) NOT NULL,
  `CHAR_WHICHTYPE` int(11) NOT NULL,
  `CHAR_EXP` int(11) NOT NULL,
  `CHAR_LASTTALKELDER` int(11) NOT NULL,
  `CHAR_ALLOCPOINT` int(11) NOT NULL,
  `CHAR_PETRANK` int(11) NOT NULL,
  `CHAR_TRANSMIGRATION` int(11) NOT NULL,
  `CHAR_PETFAMILY` int(11) NOT NULL,
  `CHAR_LIMITLEVEL` int(11) NOT NULL,
  `CHAR_BEATITUDE` int(11) NOT NULL,
  `CHAR_NOFAME` int(11) NOT NULL,
  `CHAR_SUPER` int(11) NOT NULL,
  `PETSKILL1` int(11) NOT NULL,
  `PETSKILL2` int(11) NOT NULL,
  `PETSKILL3` int(11) NOT NULL,
  `PETSKILL4` int(11) NOT NULL,
  `PETSKILL5` int(11) NOT NULL,
  `PETSKILL6` int(11) NOT NULL,
  `PETSKILL7` int(11) NOT NULL,
  `CHAR_NAME` varchar(64) NOT NULL,
  `CHAR_USERPETNAME` varchar(64) NOT NULL,
  `CHAR_NEWNAME` varchar(32) NOT NULL,
  `CHAR_PET_4V` varchar(32) NOT NULL,
  `CHAR_UNIQUECODE` varchar(64) NOT NULL,
  `CHAR_ATTACK_EFFECT` int(11) NOT NULL DEFAULT '0',
  `CHAR_LOCKED` tinyint(4) DEFAULT '0',
  `CHAR_LOWRIDEPETS` int(11) DEFAULT '0',
  `CHAR_LOWRIDEPETS1` int(11) DEFAULT '0',
  `CHAR_HIGHRIDEPET2` int(11) DEFAULT '0',
  `CHAR_CAPTURE_DATA` varchar(64) NOT NULL,
  `CHAR_PETTRN_4V` varchar(64) NOT NULL,
  PRIMARY KEY (`CHAR_UNIQUECODE`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poolpet`
--

LOCK TABLES `poolpet` WRITE;
/*!40000 ALTER TABLE `poolpet` DISABLE KEYS */;
/*!40000 ALTER TABLE `poolpet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qzxbitemshopnum`
--

DROP TABLE IF EXISTS `qzxbitemshopnum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qzxbitemshopnum` (
  `id` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `sellnum` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qzxbitemshopnum`
--

LOCK TABLES `qzxbitemshopnum` WRITE;
/*!40000 ALTER TABLE `qzxbitemshopnum` DISABLE KEYS */;
/*!40000 ALTER TABLE `qzxbitemshopnum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redmoney`
--

DROP TABLE IF EXISTS `redmoney`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `redmoney` (
  `cdkey` varchar(32) NOT NULL,
  `objtype` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `total` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redmoney`
--

LOCK TABLES `redmoney` WRITE;
/*!40000 ALTER TABLE `redmoney` DISABLE KEYS */;
/*!40000 ALTER TABLE `redmoney` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ridetime`
--

DROP TABLE IF EXISTS `ridetime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ridetime` (
  `cdkey` varchar(16) NOT NULL,
  `time1` int(11) NOT NULL,
  `time2` int(11) NOT NULL,
  `time3` int(11) NOT NULL,
  `time4` int(11) NOT NULL,
  `time5` int(11) NOT NULL,
  `time6` int(11) NOT NULL,
  `time7` int(11) NOT NULL,
  `time8` int(11) NOT NULL,
  `time9` int(11) NOT NULL,
  `time10` int(11) NOT NULL,
  `time11` int(11) NOT NULL,
  `time12` int(11) NOT NULL,
  `time13` int(11) NOT NULL,
  `time14` int(11) NOT NULL,
  `time15` int(11) NOT NULL,
  `time16` int(11) NOT NULL,
  `time17` int(11) NOT NULL,
  `time18` int(11) NOT NULL,
  `time19` int(11) NOT NULL,
  `time20` int(11) NOT NULL,
  `time21` int(11) NOT NULL,
  `time22` int(11) NOT NULL,
  `time23` int(11) NOT NULL,
  `time24` int(11) NOT NULL,
  `time25` int(11) NOT NULL,
  `time26` int(11) NOT NULL,
  `time27` int(11) NOT NULL,
  `time28` int(11) NOT NULL,
  `time29` int(11) NOT NULL,
  `time30` int(11) NOT NULL,
  `time31` int(11) NOT NULL,
  `time32` int(11) NOT NULL,
  `time33` int(11) NOT NULL,
  `time34` int(11) NOT NULL,
  `time35` int(11) NOT NULL,
  `time36` int(11) NOT NULL,
  `time37` int(11) NOT NULL,
  `time38` int(11) NOT NULL,
  `time39` int(11) NOT NULL,
  `time40` int(11) NOT NULL,
  `time41` int(11) NOT NULL,
  `time42` int(11) NOT NULL,
  `time43` int(11) NOT NULL,
  `time44` int(11) NOT NULL,
  `time45` int(11) NOT NULL,
  `time46` int(11) NOT NULL,
  `time47` int(11) NOT NULL,
  `time48` int(11) NOT NULL,
  `time49` int(11) NOT NULL,
  `time50` int(11) NOT NULL,
  `time51` int(11) NOT NULL,
  `time52` int(11) NOT NULL,
  `time53` int(11) NOT NULL,
  `time54` int(11) NOT NULL,
  `time55` int(11) NOT NULL,
  `time56` int(11) NOT NULL,
  `time57` int(11) NOT NULL,
  `time58` int(11) NOT NULL,
  `time59` int(11) NOT NULL,
  `time60` int(11) NOT NULL,
  `time61` int(11) NOT NULL,
  `time62` int(11) NOT NULL,
  `time63` int(11) NOT NULL,
  `time64` int(11) NOT NULL,
  `time65` int(11) NOT NULL,
  `time66` int(11) NOT NULL,
  `time67` int(11) NOT NULL,
  `time68` int(11) NOT NULL,
  `time69` int(11) NOT NULL,
  `time70` int(11) NOT NULL,
  `time71` int(11) NOT NULL,
  `time72` int(11) NOT NULL,
  `time73` int(11) NOT NULL,
  `time74` int(11) NOT NULL,
  `time75` int(11) NOT NULL,
  `time76` int(11) NOT NULL,
  `time77` int(11) NOT NULL,
  `time78` int(11) NOT NULL,
  `time79` int(11) NOT NULL,
  `time80` int(11) NOT NULL,
  `time81` int(11) NOT NULL,
  `time82` int(11) NOT NULL,
  `time83` int(11) NOT NULL,
  `time84` int(11) NOT NULL,
  `time85` int(11) NOT NULL,
  `time86` int(11) NOT NULL,
  `time87` int(11) NOT NULL,
  `time88` int(11) NOT NULL,
  `time89` int(11) NOT NULL,
  `time90` int(11) NOT NULL,
  `time91` int(11) NOT NULL,
  `time92` int(11) NOT NULL,
  `time93` int(11) NOT NULL,
  `time94` int(11) NOT NULL,
  `time95` int(11) NOT NULL,
  `time96` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ridetime`
--

LOCK TABLES `ridetime` WRITE;
/*!40000 ALTER TABLE `ridetime` DISABLE KEYS */;
/*!40000 ALTER TABLE `ridetime` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ridexb`
--

DROP TABLE IF EXISTS `ridexb`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ridexb` (
  `cdkey` varchar(16) DEFAULT '' COMMENT '玩家账号',
  `CsPoint` int(11) DEFAULT '0' COMMENT '传说币',
  `SsPoint` int(11) DEFAULT '0' COMMENT '史诗币'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ridexb`
--

LOCK TABLES `ridexb` WRITE;
/*!40000 ALTER TABLE `ridexb` DISABLE KEYS */;
/*!40000 ALTER TABLE `ridexb` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safedata`
--

DROP TABLE IF EXISTS `safedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `safedata` (
  `cdkey` varchar(32) NOT NULL,
  `newsafe` varchar(128) NOT NULL,
  `oldsafe` varchar(128) NOT NULL,
  `flg` tinyint(4) NOT NULL DEFAULT '0',
  `FixTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `newsafe` (`newsafe`) USING BTREE,
  KEY `oldsafe` (`oldsafe`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safedata`
--

LOCK TABLES `safedata` WRITE;
/*!40000 ALTER TABLE `safedata` DISABLE KEYS */;
/*!40000 ALTER TABLE `safedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saledata`
--

DROP TABLE IF EXISTS `saledata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `saledata` (
  `id` int(11) NOT NULL,
  `num` int(11) DEFAULT NULL,
  `buy` int(11) DEFAULT NULL,
  `sell` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saledata`
--

LOCK TABLES `saledata` WRITE;
/*!40000 ALTER TABLE `saledata` DISABLE KEYS */;
/*!40000 ALTER TABLE `saledata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salehuan`
--

DROP TABLE IF EXISTS `salehuan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `salehuan` (
  `orderid` varchar(64) NOT NULL,
  `cdkey` varchar(16) DEFAULT NULL,
  `rmbpoint` int(11) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `check` int(11) DEFAULT NULL,
  PRIMARY KEY (`orderid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salehuan`
--

LOCK TABLES `salehuan` WRITE;
/*!40000 ALTER TABLE `salehuan` DISABLE KEYS */;
/*!40000 ALTER TABLE `salehuan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salejianglog`
--

DROP TABLE IF EXISTS `salejianglog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `salejianglog` (
  `name` varchar(32) DEFAULT NULL,
  `itemname` varchar(32) DEFAULT NULL,
  `time` int(11) DEFAULT '0',
  KEY `name` (`name`) USING BTREE,
  KEY `time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salejianglog`
--

LOCK TABLES `salejianglog` WRITE;
/*!40000 ALTER TABLE `salejianglog` DISABLE KEYS */;
/*!40000 ALTER TABLE `salejianglog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `serverdata`
--

DROP TABLE IF EXISTS `serverdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `serverdata` (
  `id` int(11) NOT NULL,
  `status` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serverdata`
--

LOCK TABLES `serverdata` WRITE;
/*!40000 ALTER TABLE `serverdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `serverdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shengdan`
--

DROP TABLE IF EXISTS `shengdan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shengdan` (
  `cdkey` varchar(16) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `time3` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shengdan`
--

LOCK TABLES `shengdan` WRITE;
/*!40000 ALTER TABLE `shengdan` DISABLE KEYS */;
/*!40000 ALTER TABLE `shengdan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shengdandata`
--

DROP TABLE IF EXISTS `shengdandata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shengdandata` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` tinyint(1) NOT NULL DEFAULT '0',
  `flg2` tinyint(1) NOT NULL DEFAULT '0',
  `flg3` tinyint(1) NOT NULL DEFAULT '0',
  `flg4` tinyint(1) NOT NULL DEFAULT '0',
  `flg5` tinyint(1) NOT NULL DEFAULT '0',
  `paytotal` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shengdandata`
--

LOCK TABLES `shengdandata` WRITE;
/*!40000 ALTER TABLE `shengdandata` DISABLE KEYS */;
/*!40000 ALTER TABLE `shengdandata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shengdannum`
--

DROP TABLE IF EXISTS `shengdannum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shengdannum` (
  `id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `sellnum` int(11) NOT NULL,
  `buynum` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shengdannum`
--

LOCK TABLES `shengdannum` WRITE;
/*!40000 ALTER TABLE `shengdannum` DISABLE KEYS */;
/*!40000 ALTER TABLE `shengdannum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `showlogin`
--

DROP TABLE IF EXISTS `showlogin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `showlogin` (
  `Name` varchar(16) NOT NULL,
  `openid` varchar(64) NOT NULL,
  `token` varchar(64) NOT NULL,
  PRIMARY KEY (`Name`) USING BTREE,
  UNIQUE KEY `openid` (`openid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `showlogin`
--

LOCK TABLES `showlogin` WRITE;
/*!40000 ALTER TABLE `showlogin` DISABLE KEYS */;
/*!40000 ALTER TABLE `showlogin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `showpaylog`
--

DROP TABLE IF EXISTS `showpaylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `showpaylog` (
  `orderid` varchar(64) NOT NULL,
  `payid` varchar(64) NOT NULL,
  `cdkey` varchar(16) NOT NULL,
  `point` int(11) NOT NULL,
  `time` bigint(20) NOT NULL,
  `finishtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `check` int(11) DEFAULT '0',
  PRIMARY KEY (`orderid`) USING BTREE,
  UNIQUE KEY `payid` (`payid`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `showpaylog`
--

LOCK TABLES `showpaylog` WRITE;
/*!40000 ALTER TABLE `showpaylog` DISABLE KEYS */;
/*!40000 ALTER TABLE `showpaylog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shuniancheck`
--

DROP TABLE IF EXISTS `shuniancheck`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shuniancheck` (
  `cdkey` varchar(255) NOT NULL,
  `check` int(11) NOT NULL,
  `mid` varchar(11) NOT NULL,
  UNIQUE KEY `mid` (`mid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shuniancheck`
--

LOCK TABLES `shuniancheck` WRITE;
/*!40000 ALTER TABLE `shuniancheck` DISABLE KEYS */;
/*!40000 ALTER TABLE `shuniancheck` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shuniandata`
--

DROP TABLE IF EXISTS `shuniandata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shuniandata` (
  `cdkey` varchar(16) NOT NULL,
  `flg1` tinyint(1) NOT NULL DEFAULT '0',
  `flg2` tinyint(1) NOT NULL DEFAULT '0',
  `flg3` tinyint(1) NOT NULL DEFAULT '0',
  `flg4` tinyint(1) NOT NULL DEFAULT '0',
  `flg5` tinyint(1) NOT NULL DEFAULT '0',
  `paytotal` int(11) DEFAULT '0',
  `dayTime` varchar(32) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shuniandata`
--

LOCK TABLES `shuniandata` WRITE;
/*!40000 ALTER TABLE `shuniandata` DISABLE KEYS */;
/*!40000 ALTER TABLE `shuniandata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shuniannum`
--

DROP TABLE IF EXISTS `shuniannum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shuniannum` (
  `id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `itemid` int(11) NOT NULL,
  `num` int(11) NOT NULL,
  `sellnum` int(11) NOT NULL,
  `buynum` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `date` varchar(10) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shuniannum`
--

LOCK TABLES `shuniannum` WRITE;
/*!40000 ALTER TABLE `shuniannum` DISABLE KEYS */;
/*!40000 ALTER TABLE `shuniannum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skin`
--

DROP TABLE IF EXISTS `skin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `skin` (
  `cdkey` varchar(16) NOT NULL,
  `index` tinyint(4) DEFAULT '0',
  `flg1` int(11) DEFAULT '0',
  `flg2` int(11) DEFAULT '0',
  `flg3` int(11) DEFAULT '0',
  `time1` int(11) DEFAULT '0',
  `time2` int(11) DEFAULT '0',
  `time3` int(11) DEFAULT '0',
  `time4` int(11) DEFAULT '0',
  `time5` int(11) DEFAULT '0',
  `time6` int(11) DEFAULT '0',
  `time7` int(11) DEFAULT '0',
  `time8` int(11) DEFAULT '0',
  `time9` int(11) DEFAULT '0',
  `time10` int(11) DEFAULT '0',
  `time11` int(11) DEFAULT '0',
  `time12` int(11) DEFAULT '0',
  `time13` int(11) DEFAULT '0',
  `time14` int(11) DEFAULT '0',
  `time15` int(11) DEFAULT '0',
  `time16` int(11) DEFAULT '0',
  `time17` int(11) DEFAULT '0',
  `time18` int(11) DEFAULT '0',
  `time19` int(11) DEFAULT '0',
  `time20` int(11) DEFAULT '0',
  `time21` int(11) DEFAULT '0',
  `time22` int(11) DEFAULT '0',
  `time23` int(11) DEFAULT '0',
  `time24` int(11) DEFAULT '0',
  `time25` int(11) DEFAULT '0',
  `time26` int(11) DEFAULT '0',
  `time27` int(11) DEFAULT '0',
  `time28` int(11) DEFAULT '0',
  `time29` int(11) DEFAULT '0',
  `time30` int(11) DEFAULT '0',
  `time31` int(11) DEFAULT '0',
  `time32` int(11) DEFAULT '0',
  `time33` int(11) DEFAULT '0',
  `time34` int(11) DEFAULT '0',
  `time35` int(11) DEFAULT '0',
  `time36` int(11) DEFAULT '0',
  `time37` int(11) DEFAULT '0',
  `time38` int(11) DEFAULT '0',
  `time39` int(11) DEFAULT '0',
  `time40` int(11) DEFAULT '0',
  `time41` int(11) DEFAULT '0',
  `time42` int(11) DEFAULT '0',
  `time43` int(11) DEFAULT '0',
  `time44` int(11) DEFAULT '0',
  `time45` int(11) DEFAULT '0',
  `time46` int(11) DEFAULT '0',
  `time47` int(11) DEFAULT '0',
  `time48` int(11) DEFAULT '0',
  `time49` int(11) DEFAULT '0',
  `time50` int(11) DEFAULT '0',
  `time51` int(11) DEFAULT '0',
  `time52` int(11) DEFAULT '0',
  `time53` int(11) DEFAULT '0',
  `time54` int(11) DEFAULT '0',
  `time55` int(11) DEFAULT '0',
  `time56` int(11) DEFAULT '0',
  `time57` int(11) DEFAULT '0',
  `time58` int(11) DEFAULT '0',
  `time59` int(11) DEFAULT '0',
  `time60` int(11) DEFAULT '0',
  `time61` int(11) DEFAULT '0',
  `time62` int(11) DEFAULT '0',
  `time63` int(11) DEFAULT '0',
  `time64` int(11) DEFAULT '0',
  `time65` int(11) DEFAULT '0',
  `time66` int(11) DEFAULT '0',
  `time67` int(11) DEFAULT '0',
  `time68` int(11) DEFAULT '0',
  `time69` int(11) DEFAULT '0',
  `time70` int(11) DEFAULT '0',
  `time71` int(11) DEFAULT '0',
  `time72` int(11) DEFAULT '0',
  `time73` int(11) DEFAULT '0',
  `time74` int(11) DEFAULT '0',
  `time75` int(11) DEFAULT '0',
  `time76` int(11) DEFAULT '0',
  `time77` int(11) DEFAULT '0',
  `time78` int(11) DEFAULT '0',
  `time79` int(11) DEFAULT '0',
  `time80` int(11) DEFAULT '0',
  `time81` int(11) DEFAULT '0',
  `time82` int(11) DEFAULT '0',
  `time83` int(11) DEFAULT '0',
  `time84` int(11) DEFAULT '0',
  `time85` int(11) DEFAULT '0',
  `time86` int(11) DEFAULT '0',
  `time87` int(11) DEFAULT '0',
  `time88` int(11) DEFAULT '0',
  `time89` int(11) DEFAULT '0',
  `time90` int(11) DEFAULT '0',
  `time91` int(11) DEFAULT '0',
  `time92` int(11) DEFAULT '0',
  `time93` int(11) DEFAULT '0',
  `time94` int(11) DEFAULT '0',
  `time95` int(11) DEFAULT '0',
  `time96` int(11) DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skin`
--

LOCK TABLES `skin` WRITE;
/*!40000 ALTER TABLE `skin` DISABLE KEYS */;
INSERT INTO `skin` VALUES ('e7fa56ea5853',1,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
/*!40000 ALTER TABLE `skin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smscode`
--

DROP TABLE IF EXISTS `smscode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `smscode` (
  `phone` bigint(20) NOT NULL,
  `code` int(11) NOT NULL,
  `sendtime` int(11) NOT NULL,
  PRIMARY KEY (`phone`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smscode`
--

LOCK TABLES `smscode` WRITE;
/*!40000 ALTER TABLE `smscode` DISABLE KEYS */;
INSERT INTO `smscode` VALUES (17531149070,152468,1669653807);
/*!40000 ALTER TABLE `smscode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `snhatch`
--

DROP TABLE IF EXISTS `snhatch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snhatch` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `num` int(11) NOT NULL,
  `num2` int(11) NOT NULL,
  `check` tinyint(4) NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `check` (`check`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snhatch`
--

LOCK TABLES `snhatch` WRITE;
/*!40000 ALTER TABLE `snhatch` DISABLE KEYS */;
/*!40000 ALTER TABLE `snhatch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `snkainl`
--

DROP TABLE IF EXISTS `snkainl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snkainl` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(10) NOT NULL,
  `num` int(11) NOT NULL,
  `flg1` int(11) NOT NULL,
  `flg2` int(11) NOT NULL,
  `flg3` int(11) NOT NULL,
  `flg4` int(11) NOT NULL,
  `data1` int(11) NOT NULL,
  `data2` int(11) NOT NULL,
  `data3` int(11) NOT NULL,
  `data4` int(11) NOT NULL,
  `data5` int(11) NOT NULL,
  `jl` int(11) NOT NULL,
  `data6` int(11) NOT NULL,
  `data7` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snkainl`
--

LOCK TABLES `snkainl` WRITE;
/*!40000 ALTER TABLE `snkainl` DISABLE KEYS */;
/*!40000 ALTER TABLE `snkainl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `snnopetitem`
--

DROP TABLE IF EXISTS `snnopetitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snnopetitem` (
  `CostPasswd` varchar(32) NOT NULL,
  `PetId` int(11) NOT NULL DEFAULT '0',
  `ItemId` int(11) NOT NULL DEFAULT '0',
  `cdkey` varchar(32) DEFAULT NULL,
  `cdkey2` varchar(32) DEFAULT NULL,
  `CostTime` timestamp NULL DEFAULT NULL,
  `check` tinyint(1) DEFAULT '1',
  `buff` varchar(64) DEFAULT NULL,
  `type` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`CostPasswd`) USING BTREE,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `type` (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snnopetitem`
--

LOCK TABLES `snnopetitem` WRITE;
/*!40000 ALTER TABLE `snnopetitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `snnopetitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `snpetbilling`
--

DROP TABLE IF EXISTS `snpetbilling`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snpetbilling` (
  `cdkey` varchar(16) NOT NULL,
  `petId` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `petname` varchar(32) NOT NULL,
  `unicode` varchar(32) NOT NULL DEFAULT '',
  `name` varchar(32) NOT NULL DEFAULT '无',
  `sumarray` int(11) DEFAULT '0',
  `num` int(11) NOT NULL,
  `check` int(11) NOT NULL,
  PRIMARY KEY (`petId`,`type`) USING BTREE,
  KEY `unicode` (`unicode`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snpetbilling`
--

LOCK TABLES `snpetbilling` WRITE;
/*!40000 ALTER TABLE `snpetbilling` DISABLE KEYS */;
/*!40000 ALTER TABLE `snpetbilling` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `speedlog`
--

DROP TABLE IF EXISTS `speedlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `speedlog` (
  `cdkey` varchar(16) NOT NULL,
  `speedtime` int(11) NOT NULL,
  `speedcnt` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `speedlog`
--

LOCK TABLES `speedlog` WRITE;
/*!40000 ALTER TABLE `speedlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `speedlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stardata`
--

DROP TABLE IF EXISTS `stardata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stardata` (
  `cdkey` varchar(16) NOT NULL,
  `itemid` int(11) NOT NULL,
  `date` varchar(10) NOT NULL,
  `check` int(11) NOT NULL,
  `open` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stardata`
--

LOCK TABLES `stardata` WRITE;
/*!40000 ALTER TABLE `stardata` DISABLE KEYS */;
/*!40000 ALTER TABLE `stardata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `starnum`
--

DROP TABLE IF EXISTS `starnum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `starnum` (
  `date` varchar(10) NOT NULL,
  `num` int(11) NOT NULL,
  `maxnum` int(11) NOT NULL,
  PRIMARY KEY (`date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `starnum`
--

LOCK TABLES `starnum` WRITE;
/*!40000 ALTER TABLE `starnum` DISABLE KEYS */;
/*!40000 ALTER TABLE `starnum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `streetdata`
--

DROP TABLE IF EXISTS `streetdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `streetdata` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(64) NOT NULL,
  `image` int(11) NOT NULL,
  `floor` int(11) NOT NULL,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  `server` int(11) NOT NULL,
  `index` int(11) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `streetdata`
--

LOCK TABLES `streetdata` WRITE;
/*!40000 ALTER TABLE `streetdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `streetdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `streetitem`
--

DROP TABLE IF EXISTS `streetitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `streetitem` (
  `cdkey` varchar(16) NOT NULL,
  `check` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `ITEM_ID` int(11) NOT NULL,
  `ITEM_DAMAGEBREAK` int(11) NOT NULL,
  `ITEM_USEPILENUMS` int(11) NOT NULL,
  `ITEM_DAMAGECRUSHE` int(11) NOT NULL,
  `ITEM_MAXDAMAGECRUSHE` int(11) NOT NULL,
  `ITEM_OTHERDAMAGE` int(11) NOT NULL,
  `ITEM_OTHERDEFC` int(11) NOT NULL,
  `ITEM_ATTACKNUM_MIN` int(11) NOT NULL,
  `ITEM_ATTACKNUM_MAX` int(11) NOT NULL,
  `ITEM_MODIFYATTACK` int(11) NOT NULL,
  `ITEM_MODIFYDEFENCE` int(11) NOT NULL,
  `ITEM_MODIFYQUICK` int(11) NOT NULL,
  `ITEM_MODIFYHP` int(11) NOT NULL,
  `ITEM_MODIFYMP` int(11) NOT NULL,
  `ITEM_MODIFYLUCK` int(11) NOT NULL,
  `ITEM_MODIFYCHARM` int(11) NOT NULL,
  `ITEM_MODIFYAVOID` int(11) NOT NULL,
  `ITEM_MODIFYATTRIB` int(11) NOT NULL,
  `ITEM_MODIFYATTRIBVALUE` int(11) NOT NULL,
  `ITEM_MODIFYARRANGE` int(11) NOT NULL,
  `ITEM_MODIFYSEQUENCE` int(11) NOT NULL,
  `ITEM_ATTACHPILE` int(11) NOT NULL,
  `ITEM_HITRIGHT` int(11) NOT NULL,
  `ITEM_NEGLECTGUARD` int(11) NOT NULL,
  `ITEM_POISON` int(11) NOT NULL,
  `ITEM_PARALYSIS` int(11) NOT NULL,
  `ITEM_SLEEP` int(11) NOT NULL,
  `ITEM_STONE` int(11) NOT NULL,
  `ITEM_DRUNK` int(11) NOT NULL,
  `ITEM_CONFUSION` int(11) NOT NULL,
  `ITEM_CRITICAL` int(11) NOT NULL,
  `ITEM_COLOER` int(11) NOT NULL,
  `ITEM_MERGEFLG` int(11) NOT NULL,
  `ITEM_NAME` varchar(64) NOT NULL,
  `ITEM_SECRETNAME` varchar(64) NOT NULL,
  `ITEM_EFFECTSTRING` varchar(128) NOT NULL,
  `ITEM_ARGUMENT` varchar(128) NOT NULL,
  `ITEM_UNIQUECODE` varchar(64) NOT NULL,
  `ITEM_BASEIMAGENUMBER` int(11) NOT NULL DEFAULT '-1',
  `ITEM_MAGICID` int(11) DEFAULT '-1',
  `ITEM_TYPECODE` varchar(64) NOT NULL,
  `ITEM_INLAYCODE` varchar(64) NOT NULL,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `check` (`check`) USING BTREE,
  KEY `ITEM_UNIQUECODE` (`ITEM_UNIQUECODE`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `streetitem`
--

LOCK TABLES `streetitem` WRITE;
/*!40000 ALTER TABLE `streetitem` DISABLE KEYS */;
INSERT INTO `streetitem` VALUES ('f4564523d9hh',0,111,22407,-1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,'宠技罐头','宠技罐头','可习得宠技-手下留情的罐头','626','1669654177i21100',24047,-1,'',''),('e7fa56ea5853',0,9999,17645,-1,1,400000,400000,0,0,0,0,0,35,0,0,0,0,0,0,4,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,'合成服 13 [风]','合成服 13 [风]','防+30?  [风]                 治愈的精灵 Lv4','','1669659009i41100',21089,3,'','');
/*!40000 ALTER TABLE `streetitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `streetlog`
--

DROP TABLE IF EXISTS `streetlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `streetlog` (
  `sellcdkey` varchar(16) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `name` varchar(64) NOT NULL,
  `num` int(11) NOT NULL,
  `point` int(11) NOT NULL,
  `buycdkey` varchar(16) NOT NULL,
  `buyname` varchar(32) NOT NULL,
  `time` int(11) NOT NULL,
  KEY `time` (`time`) USING BTREE,
  KEY `sellcdkey` (`sellcdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `streetlog`
--

LOCK TABLES `streetlog` WRITE;
/*!40000 ALTER TABLE `streetlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `streetlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `streetpet`
--

DROP TABLE IF EXISTS `streetpet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `streetpet` (
  `cdkey` varchar(16) NOT NULL,
  `check` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `CHAR_PETID` int(11) NOT NULL,
  `CHAR_BASEIMAGENUMBER` int(11) NOT NULL,
  `CHAR_BASEBASEIMAGENUMBER` int(11) NOT NULL,
  `CHAR_DIR` int(11) NOT NULL,
  `CHAR_LV` int(11) NOT NULL,
  `CHAR_VITAL` int(11) NOT NULL,
  `CHAR_STR` int(11) NOT NULL,
  `CHAR_TOUGH` int(11) NOT NULL,
  `CHAR_DEX` int(11) NOT NULL,
  `CHAR_MODAI` int(11) NOT NULL,
  `CHAR_VARIABLEAI` int(11) NOT NULL,
  `CHAR_EARTHAT` int(11) NOT NULL,
  `CHAR_WATERAT` int(11) NOT NULL,
  `CHAR_FIREAT` int(11) NOT NULL,
  `CHAR_WINDAT` int(11) NOT NULL,
  `CHAR_SLOT` int(11) NOT NULL,
  `CHAR_CRITIAL` int(11) NOT NULL,
  `CHAR_DEADCOUNT` int(11) NOT NULL,
  `CHAR_DAMAGECOUNT` int(11) NOT NULL,
  `CHAR_WHICHTYPE` int(11) NOT NULL,
  `CHAR_EXP` int(11) NOT NULL,
  `CHAR_LASTTALKELDER` int(11) NOT NULL,
  `CHAR_ALLOCPOINT` int(11) NOT NULL,
  `CHAR_PETRANK` int(11) NOT NULL,
  `CHAR_TRANSMIGRATION` int(11) NOT NULL,
  `CHAR_PETFAMILY` int(11) NOT NULL,
  `CHAR_LIMITLEVEL` int(11) NOT NULL,
  `CHAR_BEATITUDE` int(11) NOT NULL,
  `CHAR_NOFAME` int(11) NOT NULL,
  `CHAR_SUPER` int(11) NOT NULL,
  `PETSKILL1` int(11) NOT NULL,
  `PETSKILL2` int(11) NOT NULL,
  `PETSKILL3` int(11) NOT NULL,
  `PETSKILL4` int(11) NOT NULL,
  `PETSKILL5` int(11) NOT NULL,
  `PETSKILL6` int(11) NOT NULL,
  `PETSKILL7` int(11) NOT NULL,
  `CHAR_NAME` varchar(64) NOT NULL,
  `CHAR_USERPETNAME` varchar(64) NOT NULL,
  `CHAR_NEWNAME` varchar(32) NOT NULL,
  `CHAR_PET_4V` varchar(32) NOT NULL,
  `CHAR_UNIQUECODE` varchar(64) NOT NULL,
  `buycdkey` varchar(32) NOT NULL DEFAULT '',
  `CHAR_ATTACK_EFFECT` int(11) NOT NULL DEFAULT '0',
  `CHAR_LOWRIDEPETS` int(11) DEFAULT '0',
  `CHAR_LOWRIDEPETS1` int(11) DEFAULT '0',
  `CHAR_HIGHRIDEPET2` int(11) DEFAULT '0',
  `CHAR_CAPTURE_DATA` varchar(64) NOT NULL,
  `CHAR_PETTRN_4V` varchar(64) NOT NULL,
  KEY `cdkey` (`cdkey`) USING BTREE,
  KEY `check` (`check`) USING BTREE,
  KEY `CHAR_UNIQUECODE` (`CHAR_UNIQUECODE`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `streetpet`
--

LOCK TABLES `streetpet` WRITE;
/*!40000 ALTER TABLE `streetpet` DISABLE KEYS */;
/*!40000 ALTER TABLE `streetpet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studentdata`
--

DROP TABLE IF EXISTS `studentdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `studentdata` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `uid` varchar(12) NOT NULL,
  `faceimage` int(11) NOT NULL,
  `trans` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `buff` varchar(128) NOT NULL,
  `teachercdkey` varchar(16) NOT NULL,
  `check` tinyint(4) NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE,
  KEY `teachercdkey` (`teachercdkey`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `check` (`check`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studentdata`
--

LOCK TABLES `studentdata` WRITE;
/*!40000 ALTER TABLE `studentdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `studentdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacherdata`
--

DROP TABLE IF EXISTS `teacherdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teacherdata` (
  `cdkey` varchar(16) NOT NULL,
  `name` varchar(32) NOT NULL,
  `uid` varchar(12) NOT NULL,
  `faceimage` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `fmname` varchar(32) NOT NULL,
  `good` int(11) NOT NULL,
  `bad` int(11) NOT NULL,
  `qq` varchar(12) NOT NULL,
  `studentnum` int(11) NOT NULL,
  `starttime` int(11) NOT NULL,
  `endtime` int(11) NOT NULL,
  `endnum` int(11) NOT NULL,
  `buff` varchar(128) NOT NULL,
  `check` tinyint(4) NOT NULL,
  `kicktime` int(11) NOT NULL DEFAULT '0',
  `jiang` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE,
  UNIQUE KEY `uid` (`uid`) USING BTREE,
  KEY `check` (`check`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacherdata`
--

LOCK TABLES `teacherdata` WRITE;
/*!40000 ALTER TABLE `teacherdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacherdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transdata`
--

DROP TABLE IF EXISTS `transdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transdata` (
  `cdkey` varchar(16) NOT NULL,
  `trans` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `cdkey` (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transdata`
--

LOCK TABLES `transdata` WRITE;
/*!40000 ALTER TABLE `transdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `transdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tribedata`
--

DROP TABLE IF EXISTS `tribedata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tribedata` (
  `name` varchar(64) NOT NULL,
  `imageno` int(11) NOT NULL,
  `fmid1` int(11) NOT NULL,
  `fmid2` int(11) NOT NULL,
  `fmid3` int(11) NOT NULL,
  `tmpfmid1` int(11) NOT NULL,
  `tmpfmid2` int(11) NOT NULL,
  `tmpfmid3` int(11) NOT NULL,
  `tmpfmid4` int(11) NOT NULL,
  `tmpfmid5` int(11) NOT NULL,
  PRIMARY KEY (`name`) USING BTREE,
  UNIQUE KEY `fmid1` (`fmid1`) USING BTREE,
  UNIQUE KEY `fmid2` (`fmid2`) USING BTREE,
  UNIQUE KEY `fmid3` (`fmid3`) USING BTREE,
  UNIQUE KEY `tmpfmid1` (`tmpfmid1`) USING BTREE,
  UNIQUE KEY `tmpfmid2` (`tmpfmid2`) USING BTREE,
  UNIQUE KEY `tmpfmid3` (`tmpfmid3`) USING BTREE,
  UNIQUE KEY `tmpfmid4` (`tmpfmid4`) USING BTREE,
  UNIQUE KEY `tmpfmid5` (`tmpfmid5`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tribedata`
--

LOCK TABLES `tribedata` WRITE;
/*!40000 ALTER TABLE `tribedata` DISABLE KEYS */;
/*!40000 ALTER TABLE `tribedata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tuijiang`
--

DROP TABLE IF EXISTS `tuijiang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tuijiang` (
  `MasterId` int(11) NOT NULL,
  `check` int(11) DEFAULT '0',
  PRIMARY KEY (`MasterId`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tuijiang`
--

LOCK TABLES `tuijiang` WRITE;
/*!40000 ALTER TABLE `tuijiang` DISABLE KEYS */;
/*!40000 ALTER TABLE `tuijiang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uid`
--

DROP TABLE IF EXISTS `uid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uid` (
  `uid` varchar(16) NOT NULL,
  PRIMARY KEY (`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uid`
--

LOCK TABLES `uid` WRITE;
/*!40000 ALTER TABLE `uid` DISABLE KEYS */;
/*!40000 ALTER TABLE `uid` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unlockip`
--

DROP TABLE IF EXISTS `unlockip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unlockip` (
  `ip` varchar(16) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unlockip`
--

LOCK TABLES `unlockip` WRITE;
/*!40000 ALTER TABLE `unlockip` DISABLE KEYS */;
/*!40000 ALTER TABLE `unlockip` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vippointlog`
--

DROP TABLE IF EXISTS `vippointlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vippointlog` (
  `cdkey` varchar(16) NOT NULL,
  `point` int(11) NOT NULL,
  `oldpoint` int(11) NOT NULL,
  `newpoint` int(11) NOT NULL,
  `buff` varchar(128) NOT NULL,
  `time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vippointlog`
--

LOCK TABLES `vippointlog` WRITE;
/*!40000 ALTER TABLE `vippointlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `vippointlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vipshop`
--

DROP TABLE IF EXISTS `vipshop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vipshop` (
  `cdkey` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `itemid` int(11) NOT NULL,
  `itemname` varchar(32) NOT NULL,
  `itemnum` int(11) NOT NULL,
  `time` timestamp NOT NULL,
  `oldpoint` int(11) NOT NULL DEFAULT '0',
  `newpoint` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vipshop`
--

LOCK TABLES `vipshop` WRITE;
/*!40000 ALTER TABLE `vipshop` DISABLE KEYS */;
INSERT INTO `vipshop` VALUES ('e7fa56ea5853','单机石器',20900,'地狱通行证',1,'2022-11-28 17:25:33',99999999,99999879),('e7fa56ea5853','单机石器',20900,'地狱通行证',1,'2022-11-28 18:09:45',99999879,99999759),('e7fa56ea5853','单机石器',22077,'陪练雕像(永久)',2,'2023-02-09 08:09:52',99974959,99972959);
/*!40000 ALTER TABLE `vipshop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weixin`
--

DROP TABLE IF EXISTS `weixin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `weixin` (
  `cdkey` varchar(16) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `time` int(11) NOT NULL,
  `check` tinyint(1) NOT NULL,
  UNIQUE KEY `cdkey` (`cdkey`,`type`,`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weixin`
--

LOCK TABLES `weixin` WRITE;
/*!40000 ALTER TABLE `weixin` DISABLE KEYS */;
/*!40000 ALTER TABLE `weixin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wenming`
--

DROP TABLE IF EXISTS `wenming`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wenming` (
  `cdkey` varchar(16) NOT NULL,
  `date` varchar(8) NOT NULL,
  `cnt` tinyint(4) DEFAULT '0',
  `maxcnt` tinyint(4) DEFAULT '1',
  `endtime` int(11) DEFAULT '0',
  `id` varchar(16) NOT NULL,
  `data1` int(11) NOT NULL,
  `data2` int(11) NOT NULL,
  `data3` int(11) NOT NULL,
  `data4` int(11) NOT NULL,
  `data5` int(11) NOT NULL,
  `data6` int(11) NOT NULL,
  `data7` int(11) DEFAULT '-1',
  `data8` int(11) DEFAULT '-1',
  `data9` int(11) DEFAULT '-1',
  PRIMARY KEY (`cdkey`) USING BTREE,
  KEY `endtime` (`endtime`) USING BTREE,
  KEY `id` (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wenming`
--

LOCK TABLES `wenming` WRITE;
/*!40000 ALTER TABLE `wenming` DISABLE KEYS */;
/*!40000 ALTER TABLE `wenming` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wenmingfirst`
--

DROP TABLE IF EXISTS `wenmingfirst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wenmingfirst` (
  `cdkey` varchar(16) NOT NULL,
  `type` tinyint(4) NOT NULL,
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wenmingfirst`
--

LOCK TABLES `wenmingfirst` WRITE;
/*!40000 ALTER TABLE `wenmingfirst` DISABLE KEYS */;
/*!40000 ALTER TABLE `wenmingfirst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `yamakinginfo`
--

DROP TABLE IF EXISTS `yamakinginfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yamakinginfo` (
  `cdkey` varchar(32) NOT NULL COMMENT '账号',
  `name` varchar(32) NOT NULL COMMENT '名字',
  `nowpoint` int(11) NOT NULL DEFAULT '0' COMMENT '可用积分',
  `maxpoint` int(11) NOT NULL DEFAULT '0' COMMENT '最大积分',
  `flg` int(11) NOT NULL DEFAULT '0',
  `check` int(11) NOT NULL DEFAULT '0' COMMENT '领奖标记',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后时间',
  `dayTime` int(11) NOT NULL,
  `dayData` int(11) NOT NULL,
  `data` int(11) NOT NULL,
  `data1` int(11) NOT NULL DEFAULT '0' COMMENT '领奖标记1',
  `data2` int(11) NOT NULL DEFAULT '0' COMMENT '领奖标记2',
  `data3` int(11) NOT NULL DEFAULT '0' COMMENT '领奖标记3',
  `data4` int(11) NOT NULL DEFAULT '0' COMMENT '领奖标记4',
  `data5` int(11) NOT NULL DEFAULT '0' COMMENT '领奖标记5',
  `flg1` int(11) NOT NULL DEFAULT '0',
  `flg2` int(11) NOT NULL DEFAULT '0',
  `flg3` int(11) NOT NULL DEFAULT '0',
  `flg4` int(11) NOT NULL DEFAULT '0',
  `flg5` int(11) NOT NULL DEFAULT '0',
  `flg6` int(11) NOT NULL DEFAULT '0',
  `flg7` int(11) NOT NULL DEFAULT '0',
  `count1` int(11) NOT NULL DEFAULT '0',
  `count2` int(11) NOT NULL DEFAULT '0',
  `count3` int(11) NOT NULL DEFAULT '0',
  `count4` int(11) NOT NULL DEFAULT '0',
  `count5` int(11) NOT NULL DEFAULT '0',
  `count6` int(11) NOT NULL DEFAULT '0',
  `count7` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='魔王积分/兑换活动';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yamakinginfo`
--

LOCK TABLES `yamakinginfo` WRITE;
/*!40000 ALTER TABLE `yamakinginfo` DISABLE KEYS */;
/*!40000 ALTER TABLE `yamakinginfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zhounianqing`
--

DROP TABLE IF EXISTS `zhounianqing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `zhounianqing` (
  `cdkey` varchar(32) NOT NULL,
  `cnt` int(11) NOT NULL COMMENT '周年庆',
  PRIMARY KEY (`cdkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zhounianqing`
--

LOCK TABLES `zhounianqing` WRITE;
/*!40000 ALTER TABLE `zhounianqing` DISABLE KEYS */;
/*!40000 ALTER TABLE `zhounianqing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database '175sa'
--

--
-- Dumping routines for database '175sa'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-08 15:27:03
