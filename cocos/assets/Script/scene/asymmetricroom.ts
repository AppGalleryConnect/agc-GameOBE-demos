/**
 * Copyright 2022. Huawei Technologies Co., Ltd. All rights reserved.
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
import global from "../../global";
import Dialog from "../comp/Dialog";
import {PlayerInfo} from "../../GOBE/GOBE";

export enum PlayerOnline {
    online = 1,  // 在线
    offline = 3,  // 离线
}

export enum Player {
    one = 1,  // 玩家1
    two = 2,  // 玩家2
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class AsymmetricRoom extends cc.Component {

    /*红色方玩家1*/
    @property(cc.Label)
    redOneName: cc.Label = null; // 昵称

    @property(cc.Node)
    redOneReadyBtn: cc.Node = null; // 准备按钮

    @property(cc.Node)
    redOneUnReadyBtn: cc.Node = null; // 取消准备按钮

    @property(cc.Label)
    redOneStatus: cc.Label = null; // 准备状态标签

    /*红色方玩家2*/
    @property(cc.Label)
    redTwoName: cc.Label = null;

    @property(cc.Node)
    redTwoReadyBtn: cc.Node = null;

    @property(cc.Node)
    redTwoUnReadyBtn: cc.Node = null;

    @property(cc.Label)
    redTwoStatus: cc.Label = null;

    /*红色方玩家3*/
    @property(cc.Label)
    redThreeName: cc.Label = null;

    @property(cc.Node)
    redThreeReadyBtn: cc.Node = null;

    @property(cc.Node)
    redThreeUnReadyBtn: cc.Node = null;

    @property(cc.Label)
    redThreeStatus: cc.Label = null;

    /*黄方玩家1*/
    @property(cc.Label)
    yellowOneName: cc.Label = null; // 昵称

    @property(cc.Node)
    yellowOneReadyBtn: cc.Node = null; // 准备按钮

    @property(cc.Node)
    yellowOneUnReadyBtn: cc.Node = null; // 取消准备按钮

    @property(cc.Label)
    yellowOneStatus: cc.Label = null; // 准备状态标签

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null; // 对话框

    @property(cc.Node)
    disableBtnStart: cc.Node = null;   // 开始游戏按钮

    @property(cc.Node)
    enableBtnStart: cc.Node = null;

    start() {
        this.initView();
        this.initListener();
        this.initSchedule();
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
        // 获取进入房间的所有玩家（可能有人还在加载，所以不一定是4个人）
        const players = roomInfo.players;
        // 房主玩家
        const ownerPlayer = players.find(p => p.playerId === roomInfo.ownerId);
        let ownerTeamId: string =  ownerPlayer.teamId;
        // 房主在红队还是黄队？
        let ownerProperties = JSON.parse(ownerPlayer.customPlayerProperties);
        let ack: number = ownerProperties["ack"];
        let allReadyCount: number = 0;
        if(0 < ack && ack < 11){    // 根据assets/util.ts中ack的值,表示的是1人队的一方
            // 房主在黄队：渲染黄队1为房主
            this.yellowOneName.string = ownerProperties["playerName"];
            this.yellowOneReadyBtn.active = false;
            this.yellowOneUnReadyBtn.active = false;
            this.yellowOneStatus.string = "房主";
            //渲染红队
            const redTeamPlayers = players.filter(p => p.teamId !== ownerTeamId);
            if(redTeamPlayers[0]){
                allReadyCount = this.drawRedOne(redTeamPlayers[0], allReadyCount);
            }
            if(redTeamPlayers[1]){
                allReadyCount = this.drawRedTwo(redTeamPlayers[1], allReadyCount);
            }
            if(redTeamPlayers[2]){
                allReadyCount = this.drawRedThree(redTeamPlayers[2], allReadyCount);
            }
        }else{
            // 房主在红队：渲染红队1为房主
            this.redOneName.string = ownerProperties["playerName"];
            this.redOneReadyBtn.active = false;
            this.redOneUnReadyBtn.active = false;
            this.redOneStatus.string = "房主";
            // 除房主以外的其他红队成员
            const redTeamPlayers = players.filter(p => p.teamId === ownerTeamId
                && p.playerId !== roomInfo.ownerId);
            if(redTeamPlayers[0]){
                allReadyCount = this.drawRedTwo(redTeamPlayers[0], allReadyCount);
            }
            if(redTeamPlayers[1]){
                allReadyCount = this.drawRedThree(redTeamPlayers[1], allReadyCount);
            }
            // 渲染黄队
            const yellowTeamPlayers = players.filter(p => p.teamId !== ownerTeamId);
            if(yellowTeamPlayers[0]){
                allReadyCount = this.drawYellowOne(yellowTeamPlayers[0], allReadyCount);
            }
        }
        // 渲染“开始游戏按钮”
        if(roomInfo.ownerId === global.playerId){   //是否当前玩家
            //除了房主以外的3个人准备就绪
            let allReadyStatus = allReadyCount === 3;
            this.disableBtnStart.active = !allReadyStatus;
            this.enableBtnStart.active = allReadyStatus;
        }else{  // 非房主
            this.disableBtnStart.active = false;
            this.enableBtnStart.active = false;
        }
    }

    /**
     *  渲染黄1玩家
     * @param player
     * @param allReadyCount
     * @private
     */
    private drawYellowOne(player: PlayerInfo, allReadyCount: number) {
        let playerProperties = JSON.parse(player.customPlayerProperties);
        this.yellowOneName.string = playerProperties["playerName"];
        let isPlayerStatus = player.customPlayerStatus === 1; // 玩家已准备
        if(player.playerId === global.playerId){    // 当前玩家才考虑按钮的显示与隐藏
            this.yellowOneUnReadyBtn.active = isPlayerStatus;  // "取消准备"按钮激活
            this.yellowOneReadyBtn.active = !(isPlayerStatus); // "准备"按钮隐藏
        }
        this.yellowOneStatus.string = isPlayerStatus ? "已准备" : "未准备";
        if (isPlayerStatus) {
            allReadyCount ++ ;
        }
        return allReadyCount;
    }

    /**
     * 渲染红1玩家
     * @param player
     * @param allReadyCount
     * @private
     */
    private drawRedOne(player: PlayerInfo, allReadyCount: number) {
        let playerProperties = JSON.parse(player.customPlayerProperties);
        this.redOneName.string = playerProperties["playerName"];
        let isPlayerStatus = player.customPlayerStatus === 1; // 玩家已准备
        if(player.playerId === global.playerId){    // 当前玩家才考虑按钮的显示与隐藏
            this.redOneUnReadyBtn.active = isPlayerStatus;  // "取消准备"按钮激活
            this.redOneReadyBtn.active = !(isPlayerStatus); // "准备"按钮隐藏
        }
        this.redOneStatus.string = isPlayerStatus ? "已准备" : "未准备";
        if (isPlayerStatus) {
            allReadyCount ++ ;
        }
        return allReadyCount;
    }

    /**
     * 渲染红2位置玩家
     * @param player
     * @param allReadyCount
     * @private
     */
    private drawRedTwo(player: PlayerInfo, allReadyCount: number) {
        let playerProperties = JSON.parse(player.customPlayerProperties);
        this.redTwoName.string = playerProperties["playerName"];
        let isPlayerStatus = player.customPlayerStatus === 1; // 玩家已准备
        if(player.playerId === global.playerId){
            this.redTwoUnReadyBtn.active = isPlayerStatus;  // "取消准备"按钮激活
            this.redTwoReadyBtn.active = !(isPlayerStatus); // "准备"按钮隐藏
        }
        this.redTwoStatus.string = isPlayerStatus ? "已准备" : "未准备";
        if (isPlayerStatus) {
            allReadyCount ++ ;
        }
        return allReadyCount;
    }

    /**
     * 渲染红3位置玩家
     * @param player
     * @param allReadyCount
     * @private
     */
    private drawRedThree(player: PlayerInfo, allReadyCount: number) {
        let playerProperties = JSON.parse(player.customPlayerProperties);
        this.redThreeName.string = playerProperties["playerName"];
        let isPlayerStatus = player.customPlayerStatus === 1; // 玩家已准备
        if(player.playerId === global.playerId){
            this.redThreeUnReadyBtn.active = isPlayerStatus;  // "取消准备"按钮激活
            this.redThreeReadyBtn.active = !(isPlayerStatus); // "准备"按钮隐藏
        }
        this.redThreeStatus.string = isPlayerStatus ? "已准备" : "未准备";
        if (isPlayerStatus) {
            allReadyCount ++ ;
        }
        return allReadyCount;
    }

    initListener() {
        this.redOneUnReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.redOneReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());

        this.redTwoUnReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.redTwoReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());

        this.redThreeUnReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.redThreeReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());

        this.yellowOneUnReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.yellowOneReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());

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

    onDisconnect(playerInfo: PlayerInfo) {
        Util.printLog("玩家掉线");
        if (playerInfo.playerId === global.playerId) {
            this.reConnectRoom();
        }
    }

    reConnectRoom() {
        // 没有超过重连时间，就进行重连操作
        global.room.reconnect().then(() => {
            Util.printLog("玩家重连成功");
        }).catch((error) => {
            if (!error.code) {
                // 加入房间请求不通就继续重连
                this.reConnectRoom();
                return;
            }
            if (error.code != 0) {
                // 无法加入房间需要退出到大厅
                cc.director.loadScene("hall");
            }
        });
    }

    leaveRoom() {
        Util.printLog(`正在退出房间`);
        global.client.leaveRoom().then((client) => {
            // 退出房间成功
            Util.printLog("退出房间成功");
        }).catch((e) => {
            // 退出房间失败
            Dialog.open("提示", "退出房间失败" + Util.errorMessage(e));
        });
    }

    /**
     * 主要是为了清空之前的值
     */
    initAllBtnActive() {
        this.redOneName.string = "";
        this.redOneStatus.string = "";
        this.redOneReadyBtn.active = false;
        this.redOneUnReadyBtn.active = false;

        this.redTwoName.string = "";
        this.redTwoStatus.string = "";
        this.redTwoReadyBtn.active = false;
        this.redTwoUnReadyBtn.active = false;

        this.redThreeName.string = "";
        this.redThreeStatus.string = "";
        this.redThreeReadyBtn.active = false;
        this.redThreeUnReadyBtn.active = false;

        this.yellowOneName.string = "";
        this.yellowOneStatus.string = "";
        this.yellowOneReadyBtn.active = false;
        this.yellowOneUnReadyBtn.active = false;

        this.disableBtnStart.active = false;
        this.enableBtnStart.active = false;
    }

    // 准备
    ready() {
        Util.printLog("准备");
        let ready = 1;
        global.player.updateCustomStatus(ready).then(() => {
            // 修改玩家自定义状态
            this.initRoomView();
        }).catch((e) => {
            // 修改玩家自定义状态失败
            Dialog.open("提示", "准备就绪失败" + Util.errorMessage(e));
        });
    }

    // 取消准备
    cancelReady() {
        Util.printLog("取消准备");
        let unready = 0;
        global.player.updateCustomStatus(unready).then(() => {
            // 修改玩家自定义状态
            this.initRoomView();
        }).catch((e) => {
            // 修改玩家自定义状态失败
            Dialog.open("提示", "取消准备失败" + Util.errorMessage(e));
        });
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

    relogin() {
        global.client.init();
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
        this.initRoomView();
    }

    onLeaving(playerInfo: PlayerInfo) {
        Util.printLog("广播--离开房间");
        if (global.playerId === playerInfo.playerId) {
            this.relogin();
            cc.director.loadScene("hall");
        } else {
            this.initRoomView();
        }
    }

    onStartFrameSync() {
        Util.printLog("广播--开始帧同步");
        global.state = 1;
        global.keyOperate = 1;
        cc.director.loadScene("game");
    }

}
