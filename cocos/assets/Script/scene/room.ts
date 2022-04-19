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

import global from "../../global";
import * as Util from "../../util";
import {PlayerInfo} from "../../GOBE/GOBE";
import Dialog from "../comp/Dialog";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Room extends cc.Component {

    @property(cc.EditBox)
    houseIdEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    roomIdEditBox: cc.EditBox = null;

    @property(cc.Node)
    enableStartGameBtn: cc.Node = null;

    @property(cc.Node)
    disableStartGameBtn: cc.Node = null;

    @property(cc.Node)
    enableReadyBtn: cc.Node = null;

    @property(cc.Node)
    cancelReadyBtn: cc.Node = null;

    @property(cc.Node)
    enableLeaveBtn: cc.Node = null;

    //解散房间
    @property(cc.Node)
    enableDismissBtn: cc.Node = null;

    @property(cc.Node)
    disableLeaveBtn: cc.Node = null;

    @property(cc.Label)
    owner_id: cc.Label = null;

    @property(cc.Label)
    player_id: cc.Label = null;

    @property(cc.Label)
    player_ready_status: cc.Label = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Node)
    kickPersonBtn: cc.Node = null;

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

    initListener() {
        this.enableLeaveBtn.on(cc.Node.EventType.TOUCH_START, () => this.leaveRoom());
        this.enableStartGameBtn.on(cc.Node.EventType.TOUCH_START, () => this.startGame());

        this.enableReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());
        this.cancelReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());

        this.kickPersonBtn.on(cc.Node.EventType.TOUCH_START, () => this.kickPerson());
        //绑定“解散房间”事件
        this.enableDismissBtn.on(cc.Node.EventType.TOUCH_START, () => this.dismissRoom());

        global.room.onJoin(() => this.onJoining())
        global.room.onLeave((playerInfo) => this.onLeaving(playerInfo))
        global.room.onDismiss(() => this.onDismiss());

        // SDK 开始帧同步
        global.room.onStartFrameSync(() => this.onStartFrameSync())
    }

    // 准备
    ready() {
        Util.printLog(`准备就绪`);
        let ready = 1;
        global.player.setCustomStatus(ready).then(() => {
            // 修改玩家自定义状态
            this.initRoomView();
        }).catch((e) => {
            // 修改玩家自定义状态失败
            Util.printLog("准备就绪失败");
        });
    }

    // 取消准备
    cancelReady() {
        Util.printLog(`取消准备`);
        let unready = 0;
        global.player.setCustomStatus(unready).then(() => {
            // 修改玩家自定义状态
            this.initRoomView();
        }).catch((e) => {
            // 修改玩家自定义状态失败
            Util.printLog("取消准备失败");
        });
    }

    // 踢人
    kickPerson() {
        let playerId = "";
        global.room.players.forEach(function (player) {
            if (player.playerId != global.room.ownerId) {
                playerId = player.playerId;
            }
        });
        global.room.kickPlayer(playerId).then(() => {
            // 踢人成功
            Util.printLog("踢人成功");
            this.initRoomView();
        }).catch((e) => {
            // 踢人失败
            Util.printLog("踢人失败");
        });
    }

    initRoomView() {
        if (global.room) {
            global.room.update().then(() => this.setRoomView()).catch((error) => {
                if (error.code && error.code === 101005) {
                    cc.director.loadScene("match");
                }
            });
        }
    }

    setRoomView() {
        const roomInfo = global.room;
        let playerId = "";
        let readyStatus = 0;
        if (roomInfo.players.length == 2) {
            roomInfo.players.forEach(function (player) {
                if (player.playerId != roomInfo.ownerId) {
                    playerId = player.playerId;
                    // @ts-ignore
                    readyStatus = player.customPlayerStatus;
                }
            });
        }
        // 设置文本标签
        this.player_id.string = playerId;
        this.owner_id.string = roomInfo.ownerId === undefined ? "" : roomInfo.ownerId;
        this.houseIdEditBox.string = "游戏id：" + (global.gameId || "");
        this.roomIdEditBox.string = "联机房间id：" + (roomInfo.roomId || "");
        let isOwner = (roomInfo.ownerId === global.playerId);
        this.initDefaultBtn(isOwner);
        if (roomInfo.players.length == 2) {
            // 设置玩家准备后，玩家或者房主按钮的变化
            this.setPlayerOrOwnerByReadyBtn(readyStatus === 1, isOwner);
        }
    }

    // 初始化默认按钮 是否显示 true是显示，false不显示
    initDefaultBtn(isOwner: boolean) {
        // false非房主没有“开始游戏按钮”  true房主有“开始游戏按钮”
        this.enableStartGameBtn.active = isOwner;
        this.disableStartGameBtn.active = isOwner;
        // false非房主没有“踢人按钮”  true房主有“踢人按钮”
        this.kickPersonBtn.active = isOwner;
        // false非房主没有“解散房间”  true房主有“解散按钮”
        this.enableDismissBtn.active = isOwner;
        this.enableReadyBtn.active = !isOwner;
        this.enableLeaveBtn.active = true;
        this.disableLeaveBtn.active = false;
        this.cancelReadyBtn.active = false;
        if (isOwner) {
            // 房主
            this.kickPersonBtn.active = false; // 默认不显示
            this.enableStartGameBtn.active = false; // 默认不显示
            this.player_ready_status.string = ""; // 默认不显示
        }
    }

    // 设置玩家准备后，玩家或者房主按钮的变化
    setPlayerOrOwnerByReadyBtn(enable: boolean, isOwner: boolean) {
        if (!isOwner) {
            // true已准备 false未准备
            this.enableReadyBtn.active = !enable;
            this.cancelReadyBtn.active = enable;
            this.enableLeaveBtn.active = !enable;
            this.disableLeaveBtn.active = enable;
        } else {
            this.kickPersonBtn.active = true;
            // true已准备 false未准备
            this.disableStartGameBtn.active = !enable;
            this.enableStartGameBtn.active = enable;
        }
        this.player_ready_status.string = enable ? "已准备" : "未准备";
    }

    leaveRoom() {
        Util.printLog(`正在退出房间`);
        global.client.leaveRoom().then((client) => {
            // 退出房间成功
            Util.printLog("退出房间成功");
        }).catch((e) => {
            // 退出房间失败
            Util.printLog("退出房间失败");
        });
    }

    /**
     * 解散房间
     */
    dismissRoom() {
        Util.printLog(`正在解散房间`);
        global.client.dismissRoom().then((client) => {
            // 退出房间成功
            Util.printLog("解散房间成功");
        }).catch((e) => {
            // 退出房间失败
            Util.printLog("解散房间失败");
        });
    }

    startGame() {
        Util.printLog(`正在开始游戏`);
        global.room.update().then((room) => {
            let readyStatus = 0;
            room.players.forEach(function (player) {
                if (player.playerId != room.ownerId) {
                    // @ts-ignore
                    readyStatus = player.customPlayerStatus;
                    return;
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
                    Util.printLog("开始帧同步失败");
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

    // ====================SDK广播====================
    onJoining() {
        Util.printLog("SDK广播--加入房间");
        this.initRoomView()
    }

    onLeaving(playerInfo: PlayerInfo) {
        Util.printLog("SDK广播--离开房间");
        if (global.room) {
            if (global.playerId != playerInfo.playerId) {
                this.initRoomView()
            } else {
                this.relogin();
                cc.director.loadScene("hall");
            }
        } else {
            this.relogin();
            cc.director.loadScene("hall");
        }
    }

    onDismiss() {
        global.room = null;
        cc.director.loadScene("hall");
    }

    onStartFrameSync() {
        global.state = 1;
        global.keyOperate = 1;
        cc.director.loadScene("game");
    }

    relogin() {
        global.client.init();
    }
}
