/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *  2021.12.15-Changed method initView
 *  2021.12.15-Changed method initListener
 *  2021.12.15-Changed method sendFrame
 *  2021.12.15-Changed method setRoomView
 *  2023.03.21-Changed method initView
 *  2023.03.21-Changed method initListener
 *  2023.03.21-Changed method syncRoomProp
 *  2023.03.21-Add method stopFrameSync
 *  2023.03.21-Add method onConnect
 *  2023.03.21-Changed method onStopFrameSync
 *  2023.03.21-Changed method leaveRoom
 *  2023.03.21-Changed method reConnect
 *  2023.06.28-Changed method start
 *  2023.06.28-Changed method initView
 *  2023.06.28-Add method reportPlayerInfo
 *  2023.06.28-Add method processColliderCache
 *  2023.06.28-Changed method syncRoomProp
 *  2023.06.28-Changed method mockRobotMove
 *  2023.06.28-Changed method selectRandomRotation
 *  2023.06.28-Changed method stopFrameSync
 *  2023.06.28-Add method sendPlaneFlyFrame
 *  2023.06.28-Add method sendBulletFlyFrame
 *  2023.06.28-Add method planeCanFly
 *  2023.06.28-Add method planeCanFlyOrFire
 *  2023.06.28-Changed method setRoomView
 *  2023.06.28-Add method setRecordRoomView
 *  2023.06.28-Add method quitRecord
 *  2023.06.28-Changed method getRandomCloud
 *  2023.06.28-Changed method receiveFrameHandle
 *  2023.06.28-Add method onReceiveFromServer
 *  2023.06.28-Changed method update
 *  2023.06.28-Changed method onStopFrameSync
 *  2023.06.28-Changed method onDismiss
 *  2023.06.28-Changed method watcherLeaveRoom
 *  2023.06.28-Changed method reCalPlayers
 *  2023.06.28-Changed method onJoin
 *  2023.06.28-Changed method reConnect
 *  2023.06.28-Deleted method updateBulletFly
 *  2023.06.28-Deleted method sendFireFrame
 *  2024.12.16-Changed method reConnect
 *  2024.12.16-Changed method syncRoomProp
 *  2024.12.16-Changed method onDisconnect
 *  2024.12.16-Changed method onStopFrameSync
 *
 *             Copyright(C)2024. Huawei Technologies Co., Ltd. All rights reserved
 */

import global from "../../global";
import * as Util from "../../util";
import {
    clearFrames,
    cloudsList,
    CmdType,
    colliderEventMap,
    destroyedBulletSet,
    Direction,
    frameSyncPlayerInitList,
    frameSyncPlayerList,
    GameSceneType,
    pushFrames,
    resetFrameSyncPlayerList,
} from "../function/FrameSync";
import FrameSyncView from "../comp/FrameSyncView";
import ReopenGame from "../comp/ReopenGame";
import Dialog from "../comp/Dialog";
import Reloading from "../comp/Reloading";
import {PlayerInfo, RecvFromServerInfo, Room} from "../../GOBE/GOBE";
import {CloudData} from "../function/CloudList";
import config from "../../config";
import {RoomType} from "../commonValue";
import {sleep} from "../function/Common";

const {ccclass, property} = cc._decorator;
let framesId = 0;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Label)
    gameIdLabel: cc.Label = null;

    @property(cc.Label)
    playerIdLabel: cc.Label = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    reloadingPrefab: cc.Prefab = null;

    // 初始化帧同步
    @property(FrameSyncView)
    public frameSyncView: FrameSyncView = null;

    // 子弹预制件
    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;

    // 云朵初始帧
    public randomFrame = 100;

    // 出现云朵的频次
    public frequency = 50;

    // 机器人定时任务
    public robotIntervalTask = null;

    // 房主定时同步玩家信息任务
    public syncRoomPropTask = null;

    // 清理碰撞缓存事件任务
    public colliderEventTask = null;

    start() {
        if (global.gameSceneType == GameSceneType.FOR_RECORD) {
            this.setRecordRoomView();
        }
        else {
            this.initView();
            this.initListener();
            // 房主上报各个玩家起始位置信息
            this.reportPlayerInfo();
            // 模拟机器人AI任务
            this.initRobotSchedule();
            // 房主定时同步roomInfo中的customRoomProperties任务
            this.initSyncRoomPropSchedule();
            // 开启碰撞缓存事件检测
            this.processColliderCache();
        }
    }

    initView() {
        this.setRoomView();
        // 帧同步
        this.frameSyncView.onUpButtonClick = () => this.sendPlaneFlyFrame(Direction.up);
        this.frameSyncView.onDownButtonClick = () => this.sendPlaneFlyFrame(Direction.down);
        this.frameSyncView.onLeftButtonClick = () => this.sendPlaneFlyFrame(Direction.left);
        this.frameSyncView.onRightButtonClick = () => this.sendPlaneFlyFrame(Direction.right);
        this.frameSyncView.onStopFrameButtonClick = () => this.stopGame();
        this.frameSyncView.onFireButtonClick = () => this.sendBulletFlyFrame();
        this.frameSyncView.onLeaveButtonClick= () => this.watcherLeaveRoom();
        this.frameSyncView.setButtons(global.gameSceneType, global.playerId === global.room.ownerId);
        // 设置dialog
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
        // 设置加载Dialog
        const reloadingNode = cc.instantiate(this.reloadingPrefab) as cc.Node;
        reloadingNode.parent = this.node;
    }

    initListener() {
        // 监听房间
        if (global.room) {
            global.room.onRecvFrame((frame) => this.onReceiveFrame(frame));
            global.room.onStopFrameSync(() => this.onStopFrameSync());
            global.room.onDismiss(() => this.onDismiss());
            global.room.onLeave((playerInfo) => this.onLeave(playerInfo));
            // 上线通知监听
            global.room.onConnect((playerInfo: PlayerInfo) => this.onConnect(playerInfo));
            // 断线通知监听
            global.room.onDisconnect((playerInfo: PlayerInfo) => this.onDisconnect(playerInfo));
            global.room.onJoin((playerInfo: PlayerInfo) => this.onJoin(playerInfo)); // 进行补帧
            global.room.onRequestFrameError((err) => this.onRequestFrameError(err));// 补帧失败回调
            global.room.onRecvFromServer((serverInfo: RecvFromServerInfo) => this.onReceiveFromServer(serverInfo));
        }
    }

    // 上报各个玩家起始位置信息
    reportPlayerInfo() {
        // 如果是房主，上报公共参数以及所有玩家初始位置
        if(global.playerId == global.room.ownerId) {
            let playerInfoArr = [];
            frameSyncPlayerInitList.players.forEach((player) => {
                let playerInfo = {
                    playerId: player.playerId,
                    position:{
                        x: player.x,
                        y: player.y,
                    },
                    direction: player.direction
                }
                playerInfoArr.push(playerInfo);
            });
            let data = {
                type: 'InitGame',
                planeSize: global.planeSize,          // 飞机尺寸，圆形，半径为15像素
                planeHp: global.planeMaxHp,           // 飞机生命值
                bulletSize: global.bulletSize,        // 子弹尺寸，圆形，半径为4像素
                bulletSpeed: global.bulletStepPixel,  // 子弹步长
                playerArr: playerInfoArr
            }
            console.log('-----reportPlayerInfo----' + JSON.stringify(data));
            global.room.sendToServer(JSON.stringify(data));
            let frameData: string = JSON.stringify({
                cmd: CmdType.syncRoomInfo,
                roomInfo: {
                    roomId: global.room.roomId,
                    roomType: global.roomType,
                    ownerId: global.room.ownerId,
                    players: frameSyncPlayerInitList.players
                },
            });
            console.log('----syncRoomInfo---' + frameData);
            global.room.sendFrame(frameData);
        }
    }

    processColliderCache() {
        this.colliderEventTask = setInterval(() => {
            // let needRollback = false;
            let values = Object.values(colliderEventMap);
            for(let i = 0; i < values.length; i++) {
                // 碰撞事件存在时间超过2秒，说明前后端对该事件的认定不一致，需要回滚
                if(Date.now() - values[i].timeStamp >= global.clearColliderCacheInterval){
                    let frameId = global.curHandleFrameId > global.rollbackFrameCount ?
                        global.curHandleFrameId - global.rollbackFrameCount : 1;
                    console.log('-----重置帧ID为' + (frameId));
                    colliderEventMap.clear();
                    destroyedBulletSet.forEach((bulletId) => {
                        this.frameSyncView.gameCanvas.destroyBullet(bulletId.toString());
                    });
                    destroyedBulletSet.clear();
                    global.room.resetRoomFrameId(frameId);
                    break;
                }
            }
        }, 200);
    }

    onRequestFrameError(err) {
        if (err.code === 10002) {
            // 重置帧id
            let roomProp = JSON.parse(global.room.customRoomProperties);
            if(roomProp.curFrameId) {
                global.room.resetRoomFrameId(roomProp.curFrameId);
                Util.printLog('已重置frameId-----------------------------------');
            }
        }
    }

    initSyncRoomPropSchedule() {
        if (global.room.isSyncing && global.playerId === global.room.ownerId) {
            this.syncRoomPropTask = setInterval(this.syncRoomProp, 1_000);
        }
    }

    syncRoomProp() {
        let roomProperties;
        if(global.room.customRoomProperties) {
            roomProperties = {
                ...JSON.parse(global.room.customRoomProperties),
                frameSyncPlayerArr: frameSyncPlayerList.players,
                curFrameId: global.curHandleFrameId
            }
        }
        else {
            roomProperties = {
                roomType: global.roomType,
                isOnlineMatch:global.isOnlineMatch,
                frameSyncPlayerArr: frameSyncPlayerList.players,
                curFrameId: global.curHandleFrameId
            }
        }
        global.room.updateRoomProperties({customRoomProperties: JSON.stringify(roomProperties)});
    }

    initRobotSchedule() {
        let robotArr = global.room.players.filter(player => player.isRobot === 1);
        if (global.room.isSyncing &&
            global.playerId === global.room.ownerId &&
            robotArr.length > 0) {
            this.robotIntervalTask = setInterval(this.mockRobotAI, 500, this, robotArr);
        }
    }

    mockRobotAI(self, robotArr) {
        robotArr.forEach(robot => self.mockRobotMove(robot.playerId));
    }

    mockRobotMove(playerId) {
        try{
            let player = frameSyncPlayerList.players.find(p => p.playerId === playerId);
            let newDir = player.direction;
            // 机器人过中线若干步长时，随时可能发生转向
            switch (player.direction) {
                case Direction.up:
                    if (player.y >= 300) {
                        newDir = this.selectRandomRotation([Direction.down, Direction.left, Direction.right]);
                    }
                    break;
                case Direction.down:
                    if (player.y <= 100) {
                        newDir = this.selectRandomRotation([Direction.up, Direction.left, Direction.right]);
                    }
                    break;
                case Direction.left:
                    if (player.x <= 100) {
                        newDir = this.selectRandomRotation([Direction.up, Direction.down, Direction.right]);
                    }
                    break;
                case Direction.right:
                    if (player.x >= 600) {
                        newDir = this.selectRandomRotation([Direction.up, Direction.down, Direction.left]);
                    }
                    break;
                // no default
            }
            let frame = {
                type: CmdType.planeFly,
                roomId: global.room.roomId,
                playerId: player.playerId,
                direction: newDir,
            };
            let frameData: string = JSON.stringify(frame);
            global.room.sendToServer(frameData);
        }
        catch (e) {
            Util.printLog('mockRobotMove sendToServer err: ' + e);
        }
    }

    // 选择随机方向转向
    selectRandomRotation(dirArr) {
        return dirArr[Math.floor(Math.random() * dirArr.length)];
    }

    // 停止游戏
    stopGame() {
        Dialog.open("提示", "确定要停止游戏？", () => {
            Dialog.close();
            this.stopFrameSync();
        }, () => {
            Dialog.close();
        });
    }

    // SDK 停止帧同步
    stopFrameSync() {
        global.room.stopFrameSync().then(() => {
            // 帧同步停止后清理机器人任务
            if (this.robotIntervalTask) {
                clearInterval(this.robotIntervalTask);
            }
            //停止同步玩家信息
            if (this.syncRoomPropTask) {
                clearInterval(this.syncRoomPropTask);
            }
            if(this.colliderEventTask){
                clearInterval(this.colliderEventTask);
            }
        }).catch((e) => {
            // 停止帧同步失败
            Util.printLog("停止帧同步失败");
            Dialog.open("提示", "停止帧同步失败" + Util.errorMessage(e));
        });
    }

    // SDK 发送帧消息
    sendPlaneFlyFrame(dir: Direction) {
        try {
            let player = frameSyncPlayerList.players.find((p) => p.playerId == global.playerId);
            if (!player) {
                return;
            }
            // 如果飞机在飞行边界，且机头朝向边界，无法继续前进
            if(!this.planeCanFly(player.x, player.y, player.direction, dir)) {
                return;
            }
            let x: number = player.x;
            let y: number = player.y;
            switch (dir) {
                case Direction.up:
                    y = (player.y + global.planeStepPixel) > global.bgMaxY ? global.bgMaxY : player.y + global.planeStepPixel;
                    break;
                case Direction.down:
                    y = (player.y - global.planeStepPixel) < global.bgMinY ? global.bgMinY : player.y - global.planeStepPixel;
                    break;
                case Direction.left:
                    x = (player.x - global.planeStepPixel) < global.bgMinX ? global.bgMinX : player.x - global.planeStepPixel;
                    break;
                case Direction.right:
                    x = (player.x + global.planeStepPixel) > global.bgMaxX ? global.bgMaxX : player.x + global.planeStepPixel;
                    break;
            }
            let frameData: string = JSON.stringify({
                cmd: CmdType.planeFly,
                playerId: global.playerId,
                x,
                y,
                direction: dir,
                hp: player.hp
            });
            console.log('----sendPlaneFlyFrame---' + frameData);
            global.room.sendFrame(frameData);
        }
        catch (e) {
            Util.printLog('sendPlaneFlyFrame err: ' + e);
        }
    }

    /**
     * 攻击指令发送
     */
    sendBulletFlyFrame() {
        try{
            // 当前玩家信息
            let player = frameSyncPlayerList.players.find(p => p.playerId == global.playerId);
            if (!player) {
                return;
            }
            // 如果飞机在飞行边界，且机头朝向边界，不能发射子弹
            if(!this.planeCanFlyOrFire(player.x, player.y, player.direction)) {
                return;
            }
            global.bulletId++;
            // 子弹在飞机头前方一段距离生成。
            let x = player.x;
            let y = player.y;
            let divergeSize = global.bulletInitOffset;
            switch (player.direction) {
                case Direction.up: // 向上
                    y = (player.y + divergeSize) > global.bgMaxY ? global.bgMaxY : player.y + divergeSize;
                    break;
                case Direction.down: // 向下
                    y = (player.y - divergeSize) < global.bgMinY ? global.bgMinY : player.y - divergeSize;
                    break;
                case Direction.left: // 向左
                    x = (player.x - divergeSize) < global.bgMinX ? global.bgMinX : player.x - divergeSize;
                    break;
                case Direction.right: // 向右
                    x = (player.x + divergeSize) > global.bgMaxX ? global.bgMaxX : player.x + divergeSize;
                    break;
                // no default
            }
            let frameData: string = JSON.stringify({
                cmd: CmdType.bulletFly,
                playerId: global.playerId,
                bulletId: global.playerId + '_' + global.bulletId,
                x,
                y,
                direction:player.direction
            });
            console.log('----sendBulletFlyFrame---' + frameData);
            global.room.sendFrame(frameData);
        }
        catch (e) {
            Util.printLog('sendFireToServer err: ' + e);
        }
    }

    // 检测飞机是否能继续飞行
    planeCanFly(x: number, y: number, curDir: Direction, tarDir: Direction) {
        if(curDir == tarDir){
            switch (curDir) {
                case Direction.up:
                    return y < global.bgMaxY;
                case Direction.down:
                    return y > global.bgMinY;
                case Direction.left:
                    return x > global.bgMinX;
                case Direction.right:
                    return x < global.bgMaxX;
                // no default
            }
        }
        return true;
    }

    // 检测飞机是否能发射子弹
    planeCanFlyOrFire(x: number, y: number, dir: Direction) {
        switch (dir) {
            case Direction.up:
                return y < global.bgMaxY;
            case Direction.down:
                return y > global.bgMinY;
            case Direction.left:
                return x > global.bgMinX;
            case Direction.right:
                return x < global.bgMaxX;
            // no default
        }
    }

    onDisable() {
        clearFrames();
        // 关闭对话框
        Dialog.close();
        Reloading.close();
        ReopenGame.close();
        if (global.room) {
            global.room.removeAllListeners();
        }
    }

    setRoomView() {
        const roomInfo = global.room;
        // 设置文本标签
        this.gameIdLabel.string = roomInfo.roomId;
        this.playerIdLabel.string = global.playerId;
        // 房间人数变化，重新计算帧
        if (roomInfo.players.length !== frameSyncPlayerList.players.length) {
            this.frameSyncView.reCalcFrameState();
        }
    }

    // 设置回放场景
    setRecordRoomView() {
        this.gameIdLabel.string = global.recordRoomInfo.roomId;
        this.playerIdLabel.string = global.playerId;
        this.frameSyncView.setButtons(GameSceneType.FOR_RECORD);
        this.frameSyncView.onQuitButtonClick= () => this.quitRecord();
    }

    // 退出回放
    quitRecord() {
        global.gameSceneType = GameSceneType.FOR_NULL;
        frameSyncPlayerInitList.players = [];
        frameSyncPlayerList.players = [];
        global.recordRoomInfo = null;
        global.roomType = RoomType.NULL;
        cc.director.loadScene("hall");
    }

    onConnect(playerInfo: PlayerInfo) {
        if (playerInfo.playerId === global.playerId) {
            global.isConnected = true;
            Util.printLog("玩家在线了");
        } else {
            Util.printLog("房间内其他玩家上线了，playerId:" + playerInfo.playerId);
        }
    }

    onDisconnect(playerInfo: PlayerInfo) {
        Util.printLog("玩家掉线");
        if (playerInfo.playerId === global.playerId) {
            global.isConnected = false;
            Reloading.open("正在重连。。。", false);
            this.reConnect();
        }
    }

    // 获取随机云朵
    private getRandomCloud(currentRoomFrameId: number, seed: number) {
        if ((currentRoomFrameId >= this.randomFrame) && (currentRoomFrameId % this.frequency === 0)) {
            // 申请随机数，解析随机数，加入云朵
            // @ts-ignore
            const random = new window.GOBE.RandomUtils(Math.floor(seed)).getNumber();
            let speed = Math.floor(random * 100);
            let y = Math.floor(random * 10000 - speed * 100);
            let x = Math.floor(random * 1000000 - speed * 10000 - y * 100);
            const cloud: CloudData = {
                x: x % 17, y: y % 5 + 5, offset: 0, speed: speed + 70
            };
            /*Util.printLog("seed值:" + seed + " 随机帧id:" + currentRoomFrameId + " 随机数序列:" +
                random + " 云朵数据:" + JSON.stringify(cloud));*/
            cloudsList.clouds.push(cloud);
            this.randomFrame += this.frequency;
        }
    }

    /**
     * 接收帧处理
     * @param frame
     * @private
     */
    private receiveFrameHandle(frame) {
        framesId = frame.currentRoomFrameId;
        if (framesId % 150 == 0) {
            // 显示圆圈，持续5秒后消失
            let circle = cc.find('Canvas/Content/FrameSync/GameCanvas/CircleSpecial');
            if (circle.active == true) {
                circle.active = false;
            } else {
                circle.active = true;
                circle.color = cc.color(237, 247, 7, 255);
            }
        }
        // 获取随机云朵
        let seed = (frame.ext) ? frame.ext.seed : null;
        this.getRandomCloud(framesId, seed);
        // 处理帧内容
        if (frame.frameInfo && frame.frameInfo.length > 0) {
            if (frame.frameInfo[0].playerId !== "0") {
                pushFrames(frame);
                this.frameSyncView.calcFrame(frame);
            }
        }
    }

    private receiveServerInfoHandle(serverInfo: GOBE.RecvFromServerInfo) {
        this.frameSyncView.processServerInfo(serverInfo);
    }

    // 接收帧广播消息
    onReceiveFrame(frame) {
        // 本次接收帧存入“未处理帧”数组中,只负责接收,不处理数据
        global.unhandleFrames = global.unhandleFrames.concat(frame);
    }

    // 接收实时服务器消息
    onReceiveFromServer(serverInfo) {
        global.unProcessedServerInfo = global.unProcessedServerInfo.concat(serverInfo);
    }

    /**
     * 按游戏帧率处理接收到的帧（每秒60次）
     */
    update() {
        // 处理帧广播消息
        if (global.unhandleFrames.length > 0) {
            if(global.gameSceneType == GameSceneType.FOR_RECORD) {
                this.receiveFrameHandle(global.unhandleFrames[0]);
                global.unhandleFrames.shift();
            }
            else {
                if (global.unhandleFrames.length > 1) {  // 未处理的帧如果大于1,表示补帧
                    global.isRequestFrameStatus = true;
                    for (let i = 0; i < config.handleFrameRate; i++) {
                        if (global.unhandleFrames[0]) {
                            this.receiveFrameHandle(global.unhandleFrames[0]);
                            global.curHandleFrameId = global.unhandleFrames[0].currentRoomFrameId;
                            global.unhandleFrames.shift();
                        }
                    }
                } else {  // 正常处理
                    global.isRequestFrameStatus = false;
                    this.receiveFrameHandle(global.unhandleFrames[0]);
                    global.unhandleFrames.shift();
                }
            }
        }
        // 处理实时消息
        if (global.unProcessedServerInfo.length > 0) {
            if (global.unProcessedServerInfo[0]) {
                this.receiveServerInfoHandle(global.unProcessedServerInfo[0]);
                global.unProcessedServerInfo.shift();
            }
        }
    }

    onStopFrameSync() {
        Util.printLog("SDK广播--停止帧同步");
        frameSyncPlayerList.players = [];
        frameSyncPlayerInitList.players = [];
        // 清空帧数据
        global.unhandleFrames = [];
        // 清空roomProperties
        if(global.room.ownerId === global.client.playerId) {
            global.room.updateRoomProperties({customRoomProperties: ''});
        }
        global.curHandleFrameId = 0;
        resetFrameSyncPlayerList();
        if (!global.isTeamMode) {
            // 上报结算结果0或1
            if (global.gameSceneType == GameSceneType.FOR_WATCHER){
                this.watcherLeaveRoom();
            }else{
                cc.director.loadScene("gameend");
            }
        } else {
            this.leaveRoom();
            if (global.isOnlineMatch) {
                // 在线匹配
                global.isOnlineMatch = false;
                global.gameSceneType = GameSceneType.FOR_NULL;
                cc.director.loadScene("hall");
                this.node.destroy();
            } else {
                // 组房匹配
                cc.director.loadScene("team");
                this.node.destroy();
            }
        }
    }

    onDismiss() {
        Util.printLog("SDK广播--解散房间");
        global.gameSceneType = GameSceneType.FOR_NULL;
        cc.director.loadScene("hall");
    }

    onLeave(playerInfo: PlayerInfo) {
        Util.printLog("SDK广播--离开房间");
        if (global.isTeamMode) {
            // 重新计算房间内的人员信息
            this.reCalPlayers(playerInfo);
        } else {
            cc.director.loadScene("room");
        }
    }

    private unready() {
        global.player.updateCustomStatus(0);
    }

    private leaveRoom() {
        Util.printLog(`正在退出房间`);
        global.client.leaveRoom().then(() => {
            // 退出房间成功
            Util.printLog("退出房间成功");
            global.roomType = RoomType.NULL;
        }).catch((e) => {
            // 退出房间失败
            Dialog.open("提示", "退出房间失败" + Util.errorMessage(e));
        });
    }

    private watcherLeaveRoom() {
        Util.printLog(`正在退出观战房间`);
        global.client.leaveRoom().then(() => {
            Util.printLog("退出观战房间成功");
            global.roomType = RoomType.NULL;
            global.player.updateCustomProperties("clear");
            global.gameSceneType = GameSceneType.FOR_NULL;
            cc.director.loadScene("hall");
        }).catch((e) => {
            // 退出房间失败
            Dialog.open("提示", "退出房间失败" + Util.errorMessage(e));
        });
    }

    /*
     * 重新计算房间内的人员信息
     * playerInfo 离开房间的人信息
     */
    private reCalPlayers(playerInfo: PlayerInfo) {
        let players = [];
        frameSyncPlayerList.players.forEach(function (player) {
            if (player.playerId != playerInfo.playerId) {
                players.push(player);
            }
        });
        frameSyncPlayerList.players = players;
    }

    onJoin(playerInfo: PlayerInfo) {
        Util.printLog("重连成功");
        if (playerInfo.playerId === global.playerId) {
            Util.printLog("重连加入玩家id:" + playerInfo.playerId);
            global.room.update().then((room) => {
                let isInRoom = this.isInRoom(room);
                if (isInRoom) {
                    Reloading.close();
                } else {
                    global.gameSceneType = GameSceneType.FOR_NULL;
                    cc.director.loadScene("hall");
                }
            }).catch((e) => {
                Util.printLog("update err: " + e);
                cc.director.loadScene("hall");
            });
        }
    }

    async reConnect() {
        if (global.isTeamMode) {
            global.gameSceneType = GameSceneType.FOR_NULL;
            cc.director.loadScene("hall");
        } else {
            // 没有超过重连时间，就进行重连操作
            while (!global.isConnected){
                global.room.reconnect().then(() => {
                    Util.printLog("reconnect success");
                }).catch((error) => {
                    Util.printLog("reconnect err");
                });
                // 2秒重连一次，防止并发过大游戏直接卡死
                await sleep(2000).then();
            }
        }
    }

    isInRoom(room: Room): boolean {
        const players: PlayerInfo[] = room.players;
        if (players) {
            for (let i = 0; i < players.length; ++i) {
                if (players[i].playerId === global.playerId) {
                    return true;
                }
            }
        }
        return false
    }
}
