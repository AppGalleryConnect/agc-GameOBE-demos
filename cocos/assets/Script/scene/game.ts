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
 *             Copyright(C)2021. Huawei Technologies Co., Ltd. All rights reserved
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
} from "../function/FrameSync";
import FrameSyncView from "../comp/FrameSyncView";
import ReopenGame from "../comp/ReopenGame";
import Dialog from "../comp/Dialog";
import Reloading from "../comp/Reloading";
import {PlayerInfo, Room} from "../../GOBE/GOBE";
import {CloudData} from "../function/CloudList";
import GameCanvas from "../comp/GameCanvas";
import {BulletData} from "../function/BulletList";
import {PlayerData} from "../function/PlayerList";
import Circle from "../comp/Circle";



const {ccclass, property} = cc._decorator;
let framesId = 0;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Label)
    gameIdLabel: cc.Label = null;

    @property(cc.Label)
    playerIdLabel: cc.Label = null;

    @property(cc.Prefab)
    reopenGamePrefab: cc.Prefab = null;

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

    start() {
        this.initView();
        this.initListener();
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
        this.frameSyncView.setEnableButtons(global.playerId === global.room.ownerId);
        // 设置重开一局游戏弹框
        const reopenGameNode = cc.instantiate(this.reopenGamePrefab) as cc.Node;
        reopenGameNode.parent = this.node;
        // 设置dialog
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
        // 设置加载Dialog
        const relaodingNode = cc.instantiate(this.reloadingPrefab) as cc.Node;
        relaodingNode.parent = this.node;
    }

    initListener() {
        // 监听房间
        if (global.room) {
            global.room.onRecvFrame((frame: GOBE.ServerFrameMessage) => {
                this.onRecvFrame(frame);
            });
            global.room.onStopFrameSync(() => this.onStopFrameSync());
            global.room.onDismiss(() => this.onDismiss());
            global.room.onLeave((playerInfo) => this.onLeave(playerInfo));
            global.room.onDisconnect((playerInfo: PlayerInfo) => this.onDisconnect(playerInfo)); // 断连监听
            global.room.onJoin((playerInfo: PlayerInfo) => this.onJoin(playerInfo)); // 进行补帧
        }
    }

    // 停止游戏
    stopGame() {
        global.keyOperate = 0;
        Dialog.open("提示", "确定要停止游戏？", () => {
            Dialog.close();
            this.stopFrameSync();
        }, () => {
            global.keyOperate = 1;
            Dialog.close();
        });
    }

    // SDK 停止帧同步
    stopFrameSync() {
        global.room.stopFrameSync().then(() => {
            // 停止帧同步成功
            Util.printLog("停止帧同步成功");
            if (!global.isTeamMode) {
                // 房间匹配模式下，需要重开一局
                this.reopenGame();
            }
        }).catch((e) => {
            // 停止帧同步失败
            Util.printLog("停止帧同步失败");
            Dialog.open("提示", "停止帧同步失败" + Util.errorMessage(e));
        });
    }

    // 重开一局
    reopenGame() {
        ReopenGame.open("提示", "游戏已结束，还想要重开一局吗？", () => {
            global.room.update().then((room) => {
                if (this.isInRoom(room)) {
                    cc.director.loadScene("room");
                } else {
                    cc.director.loadScene("hall");
                }
            }).catch((e) => {
                cc.director.loadScene("hall");
            });
        }, () => {
            this.leaveRoom();
            cc.director.loadScene("hall");
        });
    }
    // SDK 发送帧消息
    sendFrame(cmd: FrameSyncCmd) {
        let playerList = frameSyncPlayerList.players;
        const playerId = global.playerId;
        let x: number = 0;
        let y: number = 0;
        let rotation: number = 0;
        playerList.forEach((p, i) => {
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
        global.room.sendFrame(frameData);
    }

    /**
     * 攻击指令帧发送
     */
    sendFireFrame() {
        let playerId = global.playerId;
        // 当前玩家信息
        let playerData = frameSyncPlayerList.players.find(p => p.id === playerId);
        let x: number = 0;
        let y: number = 0;
        let rotation: number = playerData.rotation;
        let bulletId: number = global.bulletId ++;
        // 为了计算子弹x、y实际大小，需要获取组件“GameCanvas”的属性“tileSize”
        let parent = cc.find('Canvas/Content/FrameSync/GameCanvas');
        const gameCanvas = parent.getComponent(GameCanvas);
        let tileSize = gameCanvas.tileSize;
        // 计算x、y实际大小
        x = playerData.x * tileSize + tileSize / 2;
        y= playerData.y * tileSize + tileSize / 2;
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
        }
        let cmd: FrameSyncCmd = FrameSyncCmd.fire;
        const data: Object = {
            cmd, playerId, bulletId, x, y, rotation
        };
        let frameData: string = JSON.stringify(data);
        global.room.sendFrame(frameData);
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
    private recvFrameHandle(frame: GOBE.ServerFrameMessage) {
        framesId = frame.currentRoomFrameId;
        if(framesId % 150 == 0){
            //显示圆圈，持续5秒后消失
            let circle = cc.find('Canvas/Content/FrameSync/GameCanvas/CircleSpecial');
            if(circle.active == true){
                circle.active = false;
            }else{
                circle.active = true;
                circle.color = cc.color(237,247,7,255);
            }

        }
        // 更新子弹
        if(framesId % 10 == 0){
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
    private updateBulletFly(){
        let bulletList = frameSyncBulletList.bullets;
        bulletList.forEach((bullet, i) => {
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
            }
            bullet.x = x;
            bullet.y = y;
        });

    }




// ====================SDK广播====================
    onRecvFrame(frame: GOBE.ServerFrameMessage | GOBE.ServerFrameMessage[]) {
        if (frame instanceof Array) {
            if (frame && frame.length > 0) {
                Util.printLog("补帧数据开始");
                frame.forEach((frameData) => {
                    this.recvFrameHandle(frameData);
                });
            }
        } else {
            this.recvFrameHandle(frame);
        }
    }

    onStopFrameSync() {
        Util.printLog("SDK广播--停止帧同步");
        this.unready();
        if (!global.isTeamMode) {
            this.reopenGame();
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
        global.state = 0;
        global.player.updateCustomStatus(0).then(() => {
            Util.printLog("修改玩家自定义状态成功");
        }).catch((e) => {
            // 修改玩家自定义状态失败
            Util.printLog("取消准备失败");
        });
    }

    private leaveRoom() {
        Util.printLog(`正在退出房间`);
        global.client.leaveRoom().then(() => {
            // 退出房间成功
            Util.printLog("退出房间成功");
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
                cc.director.loadScene("hall");
            });
        }
    }

    reConnect() {
        if (global.isTeamMode) {
            cc.director.loadScene("hall");
        } else {
            // 没有超过重连时间，就进行重连操作
            global.room.reconnect().then(() => {
                Util.printLog("玩家重连成功");
            }).catch((error) => {
                if (!error.code) {
                    // 加入房间请求不通就继续重连
                    this.reConnect();
                    return;
                }
                if (error.code != 0) {
                    // 无法加入房间需要退出到大厅
                    this.reLogin();
                    cc.director.loadScene("hall");
                }
            });
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

    reLogin() {
        global.client.init();
    }

}
