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

import global from "../../global";
import * as Util from "../../util";
import {
    PlatformType,
    PlayerInfo,
    RecvFromServerInfo,
    RoomInfo,
    UpdateCustomPropertiesResponse,
    UpdateCustomStatusResponse
} from "../../GOBE/GOBE";
import Dialog from "../comp/Dialog";
import {LockType, RoomType} from "../commonValue";
import {setRoomType, sleep} from "../function/Common";
import Button = cc.Button;
import Label = cc.Label;
import {GameSceneType} from "../function/FrameSync";
import error = cc.error;
import {errorMessage} from "../../util";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Room extends cc.Component {

    @property(cc.EditBox)
    houseIdEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    roomIdEditBox: cc.EditBox = null;

    @property(cc.Node)
    startBtn: cc.Node = null;

    @property(cc.Node)
    enableReadyBtn: cc.Node = null;

    @property(cc.Node)
    cancelReadyBtn: cc.Node = null;

    @property(cc.Node)
    leaveBtn: cc.Node = null;

    //解散房间
    @property(cc.Node)
    dismissBtn: cc.Node = null;

    @property(cc.Node)
    owner: cc.Node = null;

    @property(cc.Node)
    commonPlayer: cc.Node = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Node)
    kickBtn: cc.Node = null;

    @property(cc.Node)
    sendBtn: cc.Node = null;

    @property(cc.EditBox)
    chatBox: cc.EditBox = null;

    @property(Label)
    chatContent: Label = null;

    @property(cc.Node)
    loadingTip: cc.Node = null;

    @property(cc.Toggle)
    isLockRoom: cc.Toggle = null;

    @property(cc.Label)
    isLockText: cc.Label = null;

    // 实际的房主的item节点
    ownerItem = null;

    // 实际的普通玩家的item节点
    playerItem = null;

    // 是否是加载状态
    isLoadingStatus = false;

    start() {
        this.initView();
        this.initListener();
        this.initSchedule();
        if(global.room.isSyncing){
            this.onDirectStartFrameSync();
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
        cc.resources.load("prefab/player_item", (err, prefab: cc.Prefab) => {
            if (err == null && prefab) {
                this.ownerItem = cc.instantiate(prefab);
                this.owner.addChild(this.ownerItem);
                this.playerItem = cc.instantiate(prefab);
                this.commonPlayer.addChild(this.playerItem);
            }
            else {
                console.error("load resources err :" + err);
            }
        });
    }

    initListener() {
        this.enableReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.ready());
        this.cancelReadyBtn.on(cc.Node.EventType.TOUCH_START, () => this.cancelReady());
        this.sendBtn.on(cc.Node.EventType.TOUCH_START, () => this.sendContent());
        this.isLockRoom.node.on(cc.Node.EventType.TOUCH_START, () => this.lockRoom());
        global.room.onJoin(() => this.onJoining());
        global.room.onLeave((playerInfo) => this.onLeaving(playerInfo));
        global.room.onDismiss(() => this.onDismiss());
        global.room.onUpdateCustomStatus((playerInfo: UpdateCustomStatusResponse) => this.onUpdateCustomStatus(playerInfo))
        global.room.onUpdateCustomProperties((playerInfo: UpdateCustomPropertiesResponse) => this.onUpdateCustomProperties(playerInfo))
        global.room.onRoomPropertiesChange((roomInfo: RoomInfo) => this.onRoomPropertiesChange(roomInfo))
        global.room.onDisconnect((playerInfo: PlayerInfo) => this.onDisconnect(playerInfo)); // 断连监听
        global.room.onConnect((playerInfo) => this.onConnect(playerInfo));
        // SDK 开始帧同步
        global.room.onStartFrameSync(() => this.onStartFrameSync());
        global.room.onRecvFromServer((receiveFromServerInfo) => this.onReceiveFromGameServer(receiveFromServerInfo));
    }

    // 设置开始按钮
    setStartBtn(active, enable = false){
        this.startBtn.active = active;
        this.startBtn.getComponent(Button).interactable = enable;
        if(enable){
            this.startBtn.off(cc.Node.EventType.TOUCH_START);
            this.startBtn.on(cc.Node.EventType.TOUCH_START, () => this.startGame());
        }
        else{
            this.startBtn.off(cc.Node.EventType.TOUCH_START);
        }
    }

    // 设置离开按钮
    setLeaveBtn(active, enable){
        this.leaveBtn.active = active;
        this.leaveBtn.getComponent(Button).interactable = enable;
        if(enable){
            this.leaveBtn.off(cc.Node.EventType.TOUCH_START);
            this.leaveBtn.on(cc.Node.EventType.TOUCH_START, () => this.leaveRoom());
        }
        else{
            this.leaveBtn.off(cc.Node.EventType.TOUCH_START);
        }
    }

    // 设置踢人按钮
    setKickBtn(active, enable = false){
        this.kickBtn.active = active;
        this.kickBtn.getComponent(Button).interactable = enable;
        if(enable){
            this.kickBtn.off(cc.Node.EventType.TOUCH_START);
            this.kickBtn.on(cc.Node.EventType.TOUCH_START, () => this.kickPerson());
        }
        else{
            this.kickBtn.off(cc.Node.EventType.TOUCH_START);
        }
    }

    // 设置解散按钮
    setDismissBtn(active, enable = false){
        this.dismissBtn.active = active;
        this.dismissBtn.getComponent(Button).interactable = enable;
        if(enable){
            this.dismissBtn.off(cc.Node.EventType.TOUCH_START);
            this.dismissBtn.on(cc.Node.EventType.TOUCH_START, () => this.dismissRoom());
        }
        else{
            this.dismissBtn.off(cc.Node.EventType.TOUCH_START);
        }
    }

    // 修改自定义状态回调
    onUpdateCustomStatus(playerInfo: UpdateCustomStatusResponse) {
        console.log('玩家 ' + playerInfo.playerId + ' 修改状态为 ' + playerInfo.customStatus);
        let enable = playerInfo.customStatus === 1;
        if (playerInfo.playerId === global.playerId) {
            this.enableReadyBtn.active = !enable;
            this.cancelReadyBtn.active = enable;
            this.setLeaveBtn(true, !enable)
        } else {
            this.setStartBtn(true, enable);
        }
        this.playerItem.getChildByName('player_ready_status').getComponent(Label).string = enable ? "已准备" : "未准备";
        this.initRoomView();
    }

    // 修改自定义属性回调
    onUpdateCustomProperties(playerInfo: UpdateCustomPropertiesResponse) {
        let name = "自己 : ";
        if (playerInfo.playerId !== global.playerId) {
            name = "对手 : "
        }
        this.chatContent.string += '\n' + name + playerInfo.customProperties;
    }

    //发送聊天内容
    sendContent() {
        global.player.updateCustomProperties(this.chatBox.string);
        this.chatBox.string = '';
    }

    // 修改房间属性回调
    onRoomPropertiesChange(roomInfo: RoomInfo) {
        // TODO拿到roomInfo重置本地数据，刷新页面
        console.log('onRoomPropertiesChange ' + JSON.stringify(roomInfo));
        this.isLockRoom.isChecked = roomInfo.isLock == LockType.Locked;
    }

    // 准备
    ready() {
        Util.printLog(`准备就绪`);
        let ready = 1;
        global.player.updateCustomStatus(ready);
    }

    // 取消准备
    cancelReady() {
        Util.printLog(`取消准备`);
        let unready = 0;
        global.player.updateCustomStatus(unready);
    }

    // 锁定与解锁房间
    lockRoom() {
        if (global.room && global.room.ownerId === global.room.playerId) {
            global.room.updateRoomProperties({roomType: 'lock-type' , isLock: !this.isLockRoom.isChecked ? LockType.Locked : LockType.UnLocked});
        }
    }

    // 踢人
    kickPerson() {
        let playerId = "";
        global.room.players.forEach(function (player) {
            if (player.playerId != global.room.ownerId) {
                playerId = player.playerId;
            }
        });
        global.room.removePlayer(playerId).then(() => {
            // 踢人成功
            Util.printLog("踢人成功");
            this.initRoomView();
        }).catch((e) => {
            // 踢人失败
            Dialog.open("提示", "踢人失败" + Util.errorMessage(e));
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
                    readyStatus = player.customPlayerStatus;
                }
            });
        }
        // 设置文本标签
        let ownerItem = this.owner.getChildByName('player_item');
        let playerItem = this.commonPlayer.getChildByName('player_item');
        ownerItem.getChildByName('name').getComponent(Label).string = roomInfo.ownerId === undefined ? "" : roomInfo.ownerId;
        playerItem.getChildByName('name').getComponent(Label).string = playerId;
        ownerItem.getChildByName('owner_flag').active = true;
        playerItem.getChildByName('owner_flag').active = false;
        this.ownerItem.getChildByName('player_ready_status').active = false;
        this.loadingTip.active = this.isLoadingStatus;
        if (this.isLoadingStatus) {
            this.loadingTip.active = this.isLoadingStatus;
        }
        else {
            this.houseIdEditBox.string = "游戏id：" + (global.gameId || "");
            this.roomIdEditBox.string = "联机房间id：" + (roomInfo.roomId || "");
        }

        this.initDefaultBtn(
            roomInfo.ownerId === global.playerId,
            roomInfo.players.length,
            readyStatus === 1,
            roomInfo.isLock == LockType.Locked
        );
    }

    // 初始化默认按钮
    initDefaultBtn(isOwner: boolean, playerCount: number, commonPlayerReady: boolean, isLock: boolean) {
        // 房间只有一人时，肯定为房主
        if(playerCount === 1){
            this.enableReadyBtn.active = false;
            this.cancelReadyBtn.active = false;
            // 房主有开始按钮，但人没齐时不注册监听，不响应
            this.setStartBtn(true);
            // 一开始只有房主，默认不显示踢人按钮
            this.setKickBtn(false);
            // 房主才有解散按钮，只在按钮存在即可解散，即有响应
            this.setDismissBtn(true, true)
            // 房主和非房主均有离开按钮
            this.setLeaveBtn(true,true);
            this.playerItem.getChildByName('player_ready_status').getComponent(Label).string = "";
            // 房主显示是否锁定房间的checkBox
            this.isLockRoom.node.active = true;
            this.isLockRoom.isChecked = isLock;
            this.isLockText.string = '是否锁定房间';
        } else {
            // 房间有两人时，得看是初始化房主还是非房主的界面
            if (isOwner) {
                this.enableReadyBtn.active = false;
                this.cancelReadyBtn.active = false;
                // 房主显示是否锁定房间的checkBox
                this.isLockRoom.node.active = true;
                this.isLockRoom.isChecked = isLock;
                this.isLockText.string = '是否锁定房间';
                // 加载状态时，非房主肯定是已准备状态
                if (this.isLoadingStatus) {
                    this.setStartBtn(true);
                    this.setKickBtn(true);
                    this.setDismissBtn(true);
                    this.setLeaveBtn(true,false);
                } else {
                    // 非加载状态时，要看非房主的准备状态
                    this.setStartBtn(true, commonPlayerReady);
                    this.setKickBtn(true, true);
                    this.setDismissBtn(true, true);
                    this.setLeaveBtn(true,true);
                }
            } else {
                // 非房主
                this.enableReadyBtn.active = !commonPlayerReady;
                this.cancelReadyBtn.active = commonPlayerReady;
                // 非房主不显示是否锁定房间的checkBox
                this.isLockRoom.node.active = false;
                this.isLockText.string = isLock ? '房间已锁定' : '房间未锁定';
                this.setStartBtn(false);
                this.setKickBtn(false);
                this.setDismissBtn(false);
                this.setLeaveBtn(true, !commonPlayerReady);
            }
            this.playerItem.getChildByName('player_ready_status').getComponent(Label).string = commonPlayerReady ? "已准备" : "未准备";
        }
    }

    leaveRoom() {
        Util.printLog(`正在退出房间`);
        global.client.leaveRoom().then((client) => {
            // 退出房间成功
            Util.printLog("退出房间成功");
            global.roomType = RoomType.NULL;
            global.client = client;
            cc.director.loadScene("hall");
        }).catch((e) => {
            // 退出房间失败
            Dialog.open("提示", "退出房间失败" + Util.errorMessage(e));
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
            global.roomType = RoomType.NULL;
            global.client = client;
            cc.director.loadScene("hall");
        }).catch((e) => {
            // 退出房间失败
            Dialog.open("提示", "解散房间失败" + Util.errorMessage(e));
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
                // 全部加载完毕则开始帧同步
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

    startLoading() {
        // 加载过程中不允许解散、退出、踢人操作
        this.setDismissBtn(true);
        this.setKickBtn(true);
        this.setLeaveBtn(true, false);
        this.setStartBtn(true);
        this.cancelReadyBtn.getComponent(Button).interactable = false;

        this.houseIdEditBox.string = "";
        this.roomIdEditBox.string = "";
        this.isLoadingStatus = true;
        this.loadingTip.active = true;
        let ownerProgress = this.ownerItem.getChildByName('progressBar');
        let playerProgress = this.playerItem.getChildByName('progressBar');

        ownerProgress.active = true;
        ownerProgress.getComponent(cc.ProgressBar).progress = 0;

        this.playerItem.getChildByName('player_ready_status').active = false;
        playerProgress.active = true;
        playerProgress.getComponent(cc.ProgressBar).progress = 0;
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
        // 加入房间后，设置好房间类型
        setRoomType(RoomType.OneVOne);
        this.initRoomView()
    }

    onLeaving(playerInfo: PlayerInfo) {
        Util.printLog("SDK广播--离开房间");
        if (global.playerId != playerInfo.playerId) {
            this.initRoomView();
        } else {
            global.roomType = RoomType.NULL;
            cc.director.loadScene("hall");
        }
    }

    onDismiss() {
        global.room = null;
        global.roomType = RoomType.NULL;
        cc.director.loadScene("hall");
    }

    onStartFrameSync() {
        this.startLoading();
        this.mockLoadingProgress(this);
    }

    onDirectStartFrameSync() {
        global.room.players.forEach(function (player) {
            if (global.playerId == player.playerId) {
                if (player.customPlayerProperties != null && player.customPlayerProperties=="watcher")
                {
                    global.gameSceneType = GameSceneType.FOR_WATCHER;
                    cc.director.loadScene("game");
                    return;
                }
            }
        });
        global.gameSceneType = GameSceneType.FOR_GAME;
        cc.director.loadScene("game");
    }

    mockLoadingProgress(self) {
        let increment = 0.1 * (Math.ceil(Math.random() * 12345 + 1) % 4);
        let progress = (global.client.playerId === global.client.room.ownerId) ?
            self.ownerItem.getChildByName('progressBar').getComponent(cc.ProgressBar).progress :
            self.playerItem.getChildByName('progressBar').getComponent(cc.ProgressBar).progress;
        progress = (progress + increment > 1) ? 1 : progress + increment;
        global.client.room.sendToServer(JSON.stringify({
            playerId: global.client.playerId,
            type: "Progress",
            progress
        }));
    }

    onConnect(playerInfo: PlayerInfo) {
        if (playerInfo.playerId === global.playerId) {
            global.isConnected = true;
            Util.printLog("玩家在线了");
        } else {
            Util.printLog("房间内其他玩家上线了，playerId:" + playerInfo.playerId);
        }
    }

    async onDisconnect(playerInfo: PlayerInfo) {
        if (playerInfo.playerId === global.playerId) {
            global.isConnected = false;
            Util.printLog("玩家掉线，playerId : " + playerInfo.playerId);
            if (global.isTeamMode) {
                cc.director.loadScene("hall");
            } else {
                // 没有超过重连时间，就进行重连操作
                while (!global.isConnected){
                    await global.room.reconnect().then(() => {
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
                    // 2秒重连一次，防止并发过大游戏直接卡死
                    await sleep(2000).then();
                }
            }
        } else {
            Util.printLog("房间内其他玩家掉线，playerId : " + playerInfo.playerId);
        }
    }

    // 接收实时服务器消息
    onReceiveFromGameServer(data: RecvFromServerInfo) {
        let self = this;
        if (data.msg) {
            let parseMsg = JSON.parse(data.msg);
            let progress = parseMsg.progress;
            let playerId = parseMsg.playerId;
            if (progress) {
                // 此处要区分玩家，针对不同玩家渲染独立的progressBar
                if (playerId === global.client.room.ownerId) {
                    this.ownerItem.getChildByName('progressBar').getComponent(cc.ProgressBar).progress = progress;
                    this.ownerItem.getChildByName('label').getComponent(Label).string = Math.floor(progress * 100) + "%";
                    this.ownerItem.getChildByName('label').active = true;
                } else {
                    this.playerItem.getChildByName('progressBar').getComponent(cc.ProgressBar).progress = progress;
                    this.playerItem.getChildByName('label').getComponent(Label).string = Math.floor(progress * 100) + "%";
                    this.playerItem.getChildByName('label').active = true;
                }

            }
            const randomSec = Math.ceil(Math.random() * 1000);
            if (progress < 1 && playerId === global.client.room.playerId) {
                setTimeout(self.mockLoadingProgress, randomSec, self);
            }
        }

        // 检测是否都已加载完毕
        if (this.ownerItem.getChildByName('progressBar').getComponent(cc.ProgressBar).progress === 1 &&
            this.playerItem.getChildByName('progressBar').getComponent(cc.ProgressBar).progress === 1) {
            this.isLoadingStatus = false;
            global.gameSceneType = GameSceneType.FOR_GAME;
            cc.director.loadScene("game");
        }
    }
}
