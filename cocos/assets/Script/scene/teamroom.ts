/**
 * Copyright 2024. Huawei Technologies Co., Ltd. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as Util from "../../util";
import {RoomType} from "../commonValue";
import global from "../../global";
import Dialog from "../comp/Dialog";
import {PlayerInfo} from "../../GOBE/GOBE";
import {setRoomType, sleep} from "../function/Common";
import {GameSceneType} from "../function/FrameSync";


export enum PlayerOnline {
    online = 1,  // 在线
    offline = 3,  // 离线
}

export enum Player {
    one = 1,  // 玩家1
    two = 2,  // 玩家2
    three = 3,// 玩家3
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class TeamRoom extends cc.Component {

    @property(cc.Label)
    ownerName: cc.Label = null;

    @property(cc.Label)
    playerOneName: cc.Label = null;

    @property(cc.Label)
    playerTwoName: cc.Label = null;

    @property(cc.Label)
    playerThreeName: cc.Label = null;

    @property(cc.Node)
    unReadyOneBtn: cc.Node = null;

    @property(cc.Node)
    readyOneBtn: cc.Node = null;

    @property(cc.Node)
    unReadyTwoBtn: cc.Node = null;

    @property(cc.Node)
    readyTwoBtn: cc.Node = null;

    @property(cc.Node)
    unReadyThreeBtn: cc.Node = null;

    @property(cc.Node)
    readyThreeBtn: cc.Node = null;

    @property(cc.Node)
    disableBtnStart: cc.Node = null;

    @property(cc.Node)
    enableBtnStart: cc.Node = null;

    @property(cc.Label)
    playerOneStatus: cc.Label = null;

    @property(cc.Label)
    playerTwoStatus: cc.Label = null;

    @property(cc.Label)
    playerThreeStatus: cc.Label = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    start() {
        this.initView();
        this.initListener();
        this.initSchedule();
        if(global.room.isSyncing){
            global.gameSceneType = GameSceneType.FOR_GAME;
            cc.director.loadScene("game");
        }
    }

    initView() {
        this.initDialog();
        this.initRoomView();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    initRoomView() {
        if (global.room) {
            // 偶尔网络波动，不跳转到大厅，不然其他用户的显示会有问题
            global.room.update().then(() => this.setRoomView());
        }
    }

    setRoomView() {
        this.initAllBtnActive();
        const roomInfo = global.room;
        let allPlayersStatus = true;
        if (roomInfo.players.length > 0) {
            let redTeam = "0";
            let players = [];
            let playerNo = 1;
            for (let i = 0; i < roomInfo.players.length; i++) {
                let player = roomInfo.players[i];
                if (player.status === PlayerOnline.online || player.isRobot === 1) {
                    // 渲染在线玩家
                    if (player.playerId !== roomInfo.ownerId) {
                        // 非房主
                        players.push(player);
                        if (player.customPlayerStatus === 0) {
                            allPlayersStatus = false;
                        }
                    } else {
                        // 房主
                        let playerProperties = JSON.parse(player.customPlayerProperties);
                        this.ownerName.string = playerProperties["playerName"] ?
                            playerProperties["playerName"] : player.playerId;
                    }
                }
                if (player.playerId === roomInfo.ownerId) {
                    redTeam = player.teamId;
                }
            }
            for (let i = 0; i < players.length; i++) {
                let player = players[i];
                if (player.teamId === redTeam) {
                    this.setRedPlayer(player);
                } else {
                    this.setYellowPlayer(player, playerNo);
                    playerNo = 3;
                }
            }
        }
        if (roomInfo.ownerId !== global.playerId) {
            this.disableBtnStart.active = false;
            this.enableBtnStart.active = false;
        } else {
            this.disableBtnStart.active = !allPlayersStatus;
            this.enableBtnStart.active = allPlayersStatus;
        }
    }

    private setYellowPlayer(player, playerNo: number) {
        let isPlayerStatus = player.customPlayerStatus === 1;
        let playerName: string;

        if (player.isRobot === 1) {
            playerName = player.robotName || `机器人${player.playerId}`;
            switch (playerNo) {
                case 1:
                    this.playerOneName.fontSize = 10;
                    this.playerOneStatus.string = "已准备";
                    this.playerOneName.string = playerName;
                    this.unReadyOneBtn.active = false;
                    this.readyOneBtn.active = false;
                    break;
                case 3:
                    this.playerThreeName.fontSize = 10;
                    this.playerThreeStatus.string = "已准备";
                    this.playerThreeName.string = playerName;
                    this.unReadyThreeBtn.active = false;
                    this.readyThreeBtn.active = false;
                    break;
            }
        } else {
            let playerProperties = JSON.parse(player.customPlayerProperties);
            playerName = playerProperties["playerName"];
            switch (playerNo) {
                case 1:
                    if (player.playerId === global.playerId) {
                        this.unReadyOneBtn.active = isPlayerStatus;
                        this.readyOneBtn.active = !(isPlayerStatus);
                    }
                    this.playerOneStatus.string = isPlayerStatus ? "已准备" : "未准备";
                    this.playerOneName.string = playerName ?
                        playerName : player.playerId;
                    break;
                case 3:
                    if (player.playerId === global.playerId) {
                        this.unReadyThreeBtn.active = isPlayerStatus;
                        this.readyThreeBtn.active = !(isPlayerStatus);
                    }
                    this.playerThreeStatus.string = isPlayerStatus ? "已准备" : "未准备";
                    this.playerThreeName.string = playerName ?
                        playerName : player.playerId;
                    break;
            }
        }
    }

    private setRedPlayer(player) {
        if (player.isRobot === 1) {
            this.playerTwoName.fontSize = 10;
            this.playerTwoStatus.string = "已准备";
            this.playerTwoName.string = player.robotName || `机器人${player.playerId}`;
            this.unReadyTwoBtn.active = false;
            this.readyTwoBtn.active = false;
        } else {
            let isPlayerStatus = player.customPlayerStatus === 1;
            if (player.playerId === global.playerId) {
                this.unReadyTwoBtn.active = isPlayerStatus;
                this.readyTwoBtn.active = !(isPlayerStatus);
            }
            this.playerTwoStatus.string = isPlayerStatus ? "已准备" : "未准备";
            let playerProperties = JSON.parse(player.customPlayerProperties);
            this.playerTwoName.string = playerProperties["playerName"] ?
                playerProperties["playerName"] : player.playerId;
        }

    }

    initListener() {
        this.unReadyOneBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.readyOneBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());
        this.unReadyTwoBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.readyTwoBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());
        this.unReadyThreeBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.readyThreeBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());
        this.enableBtnStart.on(cc.Node.EventType.TOUCH_START, () => this.startTeamGame());

        // 监听加入房间
        global.room.onJoin(() => this.onJoining());
        // 监听开始帧同步
        global.room.onStartFrameSync(() => this.onStartFrameSync());
        // 断线重连
        global.room.onDisconnect((playerInfo: PlayerInfo) => this.onDisconnect(playerInfo)); // 断连监听
        // 离开房间
        global.room.onLeave((playerInfo) => this.onLeaving(playerInfo))
    }

    async onDisconnect(playerInfo: PlayerInfo) {
        Util.printLog("玩家掉线");
        if (playerInfo.playerId === global.playerId) {
            global.isConnected = false;
            this.reConnectRoom();
        }
    }

    async reConnectRoom() {
        // 没有超过重连时间，就进行重连操作
        while (!global.isConnected){
            await global.room.reconnect().then(() => {
                global.isConnected = true;
                Util.printLog("玩家重连房间成功");
            }).catch((error) => {
                if (!error.code || error.code === 91002) {
                    // 加入房间请求不通就继续重连
                    Util.printLog("玩家重连房间失败，重新尝试");
                }
                if (error.code && (error.code === 101117 || error.code === 101107 || error.code === 101120)) {
                    // 无法加入房间需要退出到大厅
                    Util.printLog("玩家重连房间失败");
                    cc.director.loadScene("hall");
                }
            });
            await sleep(2000).then();
        }
    }

    leaveRoom() {
        Util.printLog(`正在退出房间`);
        global.client.leaveRoom().then((client) => {
            // 退出房间成功
            global.roomType = RoomType.NULL;
            global.client = client;
            Util.printLog("退出房间成功");
        }).catch((e) => {
            // 退出房间失败
            Dialog.open("提示", "退出房间失败" + Util.errorMessage(e));
        });
    }

    initAllBtnActive() {
        this.unReadyOneBtn.active = false;
        this.readyOneBtn.active = false;
        this.playerOneStatus.string = "";
        this.unReadyTwoBtn.active = false;
        this.readyTwoBtn.active = false;
        this.playerTwoStatus.string = "";
        this.unReadyThreeBtn.active = false;
        this.readyThreeBtn.active = false;
        this.playerThreeStatus.string = "";

        this.ownerName.string = "";
        this.playerOneName.string = "";
        this.playerTwoName.string = "";
        this.playerThreeName.string = "";

        this.disableBtnStart.active = false;
        this.enableBtnStart.active = false;
    }

    // 准备
    ready() {
        Util.printLog("准备");
        let ready = 1;
        global.player.updateCustomStatus(ready);
        // 修改玩家自定义状态
        this.initRoomView();
    }

    // 取消准备
    cancelReady() {
        Util.printLog("取消准备");
        let unready = 0;
        global.player.updateCustomStatus(unready);
        // 修改玩家自定义状态
        this.initRoomView();
    }

    // 开始组队匹配游戏
    startTeamGame() {
        Util.printLog(`开始组队匹配游戏`);
        global.room.update().then((room) => {
            let readyStatus = 1;
            room.players.forEach(function (player) {
                if (player.playerId != room.ownerId) {
                    // @ts-ignore
                    if (player.customPlayerStatus === 0) {
                        readyStatus = 0;
                        return;
                    }
                }
            });
            if (readyStatus === 0) {
                Dialog.open("提示", "还有玩家未准备，请稍后！");
            } else {
                global.room.startFrameSync().then(() => {
                    // 开始帧同步成功
                    Util.printLog("开始帧同步成功");
                }).catch((e) => {
                    // 开始帧同步失败
                    Dialog.open("提示", "开始帧同步失败" + Util.errorMessage(e));
                });
            }
        });
    }

    onDisable() {
        // 关闭对话框
        Dialog.close();
        if (global.room) {
            global.room.removeAllListeners();
        }
    }

    // ====================定时去刷新房间信息====================
    initSchedule() {
        // 以秒为单位的时间间隔
        let interval = 2;
        // 开始延时
        let delay = 5;
        this.schedule(function () {
            this.initRoomView();
        }, interval, cc.macro.REPEAT_FOREVER, delay);
    }

    // ====================广播====================
    onJoining() {
        setRoomType(RoomType.TwoVTwo);
        this.initRoomView()
    }

    onLeaving(playerInfo: PlayerInfo) {
        Util.printLog("广播--离开房间");
        if (global.playerId === playerInfo.playerId) {
            cc.director.loadScene("hall");
        } else {
            this.initRoomView()
        }
    }

    onStartFrameSync() {
        Util.printLog("广播--开始帧同步");
        global.gameSceneType = GameSceneType.FOR_GAME;
        cc.director.loadScene("game");
    }

}
