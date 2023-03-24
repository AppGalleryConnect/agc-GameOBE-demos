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
 *             Copyright(C)2023. Huawei Technologies Co., Ltd. All rights reserved
 */

import global from "../../global";
import * as Util from "../../util";
import {
    calcFrame,
    clearFrames,
    Cloud,
    cloudsList, frameSyncBulletList,
    FrameSyncCmd,
    frameSyncPlayerList,
    pushFrames,
    reCalcFrameState,
    resetFrameSyncPlayerList,
} from "../function/FrameSync";
import FrameSyncView from "../comp/FrameSyncView";
import ReopenGame from "../comp/ReopenGame";
import Dialog from "../comp/Dialog";
import Reloading from "../comp/Reloading";
import {PlayerInfo, Room} from "../../GOBE/GOBE";
import {CloudData} from "../function/CloudList";
import GameCanvas from "../comp/GameCanvas";
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

    start() {
        this.initView();
        this.initListener();
        // 模拟机器人AI任务
        this.initRobotSchedule();
        // 房主定时同步roomInfo中的customRoomProperties任务
        this.initSyncRoomPropSchedule();
    }

    initView() {
        this.setRoomView();
        // 帧同步
        this.frameSyncView.onUpButtonClick = () => this.sendFrame(FrameSyncCmd.up);
        this.frameSyncView.onDownButtonClick = () => this.sendFrame(FrameSyncCmd.down);
        this.frameSyncView.onLeftButtonClick = () => this.sendFrame(FrameSyncCmd.left);
        this.frameSyncView.onRightButtonClick = () => this.sendFrame(FrameSyncCmd.right);
        this.frameSyncView.onStopFrameButtonClick = () => this.stopGame();
        this.frameSyncView.onFireButtonClick = () => this.sendFireFrame();
        this.frameSyncView.onLeaveButtonClick= () => this.watcherLeaveRoom();
        this.frameSyncView.setEnableButtons(global.playerId === global.room.ownerId);
        this.frameSyncView.setWatcherButtons(!global.isWatcher);
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
        }
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
        // 组装玩家位置和方向信息
        let frameSyncPlayerArr = [];
        frameSyncPlayerList.players.forEach((p) => {
            let cmd: FrameSyncCmd;
            switch (p.rotation) {
                case 0:
                    cmd = FrameSyncCmd.up
                    break;
                case 90:
                    cmd = FrameSyncCmd.left
                    break;
                case 180:
                    cmd = FrameSyncCmd.down
                    break;
                case -90:
                    cmd = FrameSyncCmd.right
                    break;
                // no default
            }
            let item = {
                playerId: p.id,
                x: p.x,
                y: p.y,
                rotation: p.rotation,
                cmd,
                robotName: p.robotName
            }
            frameSyncPlayerArr.push(item);
        });
        const roomProperties = {
            roomType: global.roomType,
            frameSyncPlayerArr: frameSyncPlayerArr,
            curFrameId: global.curHandleFrameId
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
        let player = frameSyncPlayerList.players.find(p => p.id === playerId);
        let res = {
            x: player.x,
            y: player.y,
            rotation: player.rotation,
            cmd: 0
        };
        // 机器人过中线若干步长时，随时可能发生转向
        switch (player.rotation) {
            case 0:
                if (res.y >= 6 + Math.floor(Math.random() * 5)) {
                    res = this.selectRandomRotation([90, 180, -90], res.x, res.y, res.cmd);
                } else {
                    res.y++;
                    res.cmd = FrameSyncCmd.up
                }
                break;
            case 180:
                if (res.y <= Math.floor(Math.random() * 6)) {
                    res = this.selectRandomRotation([90, 0, -90], res.x, res.y, res.cmd);
                } else {
                    res.y--;
                    res.cmd = FrameSyncCmd.down
                }
                break;
            case 90:
                if (res.x <= Math.floor(Math.random() * 6)) {
                    res = this.selectRandomRotation([0, 180, -90], res.x, res.y, res.cmd);
                } else {
                    res.x--;
                    res.cmd = FrameSyncCmd.left
                }
                break;
            case -90:
                if (res.x >= 10 + Math.floor(Math.random() * 10)) {
                    res = this.selectRandomRotation([90, 180, 0], res.x, res.y, res.cmd);
                } else {
                    res.x++;
                    res.cmd = FrameSyncCmd.right
                }
                break;
            // no default
        }
        // 如果是机器人帧，组装机器人playerId
        const data: Object = Object.assign(res, {playerId: player.id});
        let frameData: string = JSON.stringify(data);
        try{
            global.room.sendFrame(frameData);
        }
        catch (e) {
            Util.printLog('mockRobotMove sendFrame err: ' + e);
        }
    }

    // 选择随机方向转向
    selectRandomRotation(rArr, x, y, cmd) {
        let r = rArr[Math.floor(Math.random() * rArr.length)];
        switch (r) {
            case 0:
                y >= 10 ? y = 10 : y++;
                cmd = FrameSyncCmd.up;
                break;
            case 180:
                y <= 0 ? y = 0 : y--;
                cmd = FrameSyncCmd.down;
                break;
            case 90:
                x <= 0 ? x = 0 : x--;
                cmd = FrameSyncCmd.left;
                break;
            case -90:
                x >= 19 ? x = 19 : x++;
                cmd = FrameSyncCmd.right;
                break;
            // no default
        }
        return {rotation: r, x, y, cmd};
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
        }).catch((e) => {
            // 停止帧同步失败
            Util.printLog("停止帧同步失败");
            Dialog.open("提示", "停止帧同步失败" + Util.errorMessage(e));
        });
    }

    // SDK 发送帧消息
    sendFrame(cmd: FrameSyncCmd) {
        let playerList = frameSyncPlayerList.players;
        const playerId = global.playerId;
        let x: number = 0;
        let y: number = 0;
        let rotation: number = 0;
        playerList.forEach((p) => {
            if (p.id == playerId) {
                x = p.x;
                y = p.y;
                rotation = p.rotation;
                cmd === FrameSyncCmd.up && (y >= 10 ? y = 10 : y++);
                cmd === FrameSyncCmd.down && (y <= 0 ? y = 0 : y--);
                cmd === FrameSyncCmd.left && (x <= 0 ? x = 0 : x--);
                cmd === FrameSyncCmd.right && (x >= 19 ? x = 19 : x++);
                return;
            }
        });
        const data: Object = {
            cmd, x, y, rotation
        };
        let frameData: string = JSON.stringify(data);
        try{
            global.room.sendFrame(frameData);
        }
        catch (e) {
            Util.printLog('sendFrame err: ' + e);
        }
    }

    /**
     * 攻击指令帧发送
     */
    sendFireFrame() {
        let playerId = global.playerId;
        // 当前玩家信息
        let playerData = frameSyncPlayerList.players.find(p => p.id === playerId);
        let rotation: number = playerData.rotation;
        let bulletId: number = global.bulletId++;
        // 为了计算子弹x、y实际大小，需要获取组件“GameCanvas”的属性“tileSize”
        let parent = cc.find('Canvas/Content/FrameSync/GameCanvas');
        const gameCanvas = parent.getComponent(GameCanvas);
        let tileSize = gameCanvas.tileSize;
        // 计算x、y实际大小
        let x = playerData.x * tileSize + tileSize / 2;
        let y = playerData.y * tileSize + tileSize / 2;
        let divergeSize = 30; // 子弹在飞机头上方一段距离生成。
        switch (playerData.rotation) {
            case 0: // 向上
                y = y + divergeSize;
                break;
            case 180: // 向下
                y = y - divergeSize;
                break;
            case 90: // 向左
                x = x - divergeSize;
                break;
            case -90: // 向右
                x = x + divergeSize;
                break;
            // no default
        }
        let cmd: FrameSyncCmd = FrameSyncCmd.fire;
        const data: Object = {
            cmd, playerId, bulletId, x, y, rotation
        };
        let frameData: string = JSON.stringify(data);
        try{
            global.room.sendFrame(frameData);
        }
        catch (e) {
            Util.printLog('sendFireFrame sendFrame err: ' + e);
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
            reCalcFrameState();
        }
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
            const cloud: CloudData<Cloud> = {
                x: x % 17, y: y % 5 + 5, offset: 0, speed: speed + 70
            };
            Util.printLog("seed值:" + seed + " 随机帧id:" + currentRoomFrameId + " 随机数序列:" +
                random + " 云朵数据:" + JSON.stringify(cloud));
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
            //显示圆圈，持续5秒后消失
            let circle = cc.find('Canvas/Content/FrameSync/GameCanvas/CircleSpecial');
            if (circle.active == true) {
                circle.active = false;
            } else {
                circle.active = true;
                circle.color = cc.color(237, 247, 7, 255);
            }
        }
        // 更新子弹
        if (framesId % 10 == 0) {
            this.updateBulletFly();
        }
        // 获取随机云朵
        let seed = (frame.ext) ? frame.ext.seed : null;
        this.getRandomCloud(framesId, seed);
        if (frame.frameInfo && frame.frameInfo.length > 0) {
            if (frame.frameInfo[0].playerId !== "0") {
                Util.printLog(JSON.stringify(frame.frameInfo))
                pushFrames(frame);
                calcFrame(frame);
            }
        }
    }

    /**
     * 更新子弹飞行
     * @private
     */
    private updateBulletFly() {
        let bulletList = frameSyncBulletList.bullets;
        bulletList.forEach((bullet) => {
            // 计算移动后的 x、y
            let x: number = 0;
            let y: number = 0;
            let speed: number = 15;
            switch (bullet.rotation) {
                case 0: // 向上
                    y = bullet.y + speed;
                    x = bullet.x;
                    break;
                case 180: // 向下
                    y = bullet.y - speed;
                    x = bullet.x;
                    break;
                case 90: // 向左
                    x = bullet.x - speed;
                    y = bullet.y;
                    break;
                case -90: // 向右
                    x = bullet.x + speed;
                    y = bullet.y;
                    break;
                // no default
            }
            bullet.x = x;
            bullet.y = y;
        });

    }

    // ====================SDK广播====================
    onReceiveFrame(frame) {
        // 本次接收帧存入“未处理帧”数组中,只负责接收,不处理数据
        global.unhandleFrames = global.unhandleFrames.concat(frame);
    }

    /**
     * 按游戏帧率处理接收到的帧（每秒60次）
     */
    update() {
        if (global.unhandleFrames.length > 0) {
            if (global.unhandleFrames.length > 1) {  // 未处理的帧如果大于1,表示补帧
                for (let i = 0; i < config.handleFrameRate; i++) {
                    if (global.unhandleFrames[0]) {
                        this.receiveFrameHandle(global.unhandleFrames[0]);
                        global.curHandleFrameId = global.unhandleFrames[0].currentRoomFrameId;
                        global.unhandleFrames.shift();
                    }
                }
            } else {  // 正常处理
                this.receiveFrameHandle(global.unhandleFrames[0]);
                global.unhandleFrames.shift();
            }
        }
    }

    onStopFrameSync() {
        Util.printLog("SDK广播--停止帧同步");
        // 清空帧数据
        global.unhandleFrames = [];
        // 清空roomProperties
        if(global.room.ownerId === global.client.playerId) {
            global.room.updateRoomProperties({customRoomProperties: ''});
        }
        global.curHandleFrameId = 0;
        frameSyncBulletList.bullets = [];
        resetFrameSyncPlayerList();
        if (!global.isTeamMode) {
            // 上报结算结果0或1
            if (global.isWatcher){
                this.watcherLeaveRoom();
            }else{
                global.client.room.sendToServer(JSON.stringify({
                    playerId: global.client.playerId,
                    type: "GameEnd",
                    value: Math.random() > 0.5 ? 1 : 0
                }));
                cc.director.loadScene("gameend");
            }
        } else {
            this.leaveRoom();
            if (global.isOnlineMatch) {
                // 在线匹配
                global.isOnlineMatch = false;
                cc.director.loadScene("hall");
            } else {
                // 组房匹配
                cc.director.loadScene("team");
            }
        }
    }

    onDismiss() {
        Util.printLog("SDK广播--解散房间");
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
            global.isWatcher = false;
            global.roomType = RoomType.NULL;
            global.player.updateCustomProperties("clear");
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
            if (player.id != playerInfo.playerId) {
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
            cc.director.loadScene("hall");
        } else {
            // 没有超过重连时间，就进行重连操作
            while (!global.isConnected){
                // 1秒重连一次，防止并发过大游戏直接卡死
                await sleep(1000).then();
                global.room.reconnect().then(() => {
                    Util.printLog("reconnect success");
                }).catch((error) => {
                    Util.printLog("reconnect err");
                });
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
