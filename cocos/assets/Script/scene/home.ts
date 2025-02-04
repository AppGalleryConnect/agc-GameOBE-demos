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

import configs from "../../config";
import {LoginType, RoomType} from "../commonValue";
import * as Util from "../../util";
import global from "../../global";
import Dialog from "../comp/Dialog";
import config from "../../config";
import Reloading from "../comp/Reloading";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Home extends cc.Component {
    @property(cc.Sprite)
    loginByGuestBtn: cc.Sprite = null;

    @property(cc.Sprite)
    loginByAccountBtn: cc.Sprite = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.EditBox)
    accessTokenEdit: cc.EditBox = null;

    async start() {
        this.initDialog();
        this.initListener();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    initListener() {
        this.loginByGuestBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.initSDK(LoginType.Guest));
        this.loginByAccountBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.initSDK(LoginType.Account));
    }

    initSDK(loginType: LoginType) {
        if (Util.isInited()) {
            return Util.printLog("SDK 已经初始化，无需重复操作");
        }
        let clientConfig = {
            appId: configs.gameId,
            openId: Util.mockOpenId(loginType), // 区别不同用户
            clientId: configs.clientId,
            clientSecret: configs.clientSecret,
            accessToken: this.accessTokenEdit.string,
            appVersion: '1.10.111',
        };
        if (cc.sys.ANDROID === cc.sys.platform) {
            clientConfig = Object.assign(clientConfig, {
                platform: window.GOBE.PlatformType.ANDROID,
                cerPath: cc.url.raw('resources/endpoint-cert.cer'),
            })
        }
        window.GOBE.Logger.level = window.GOBE.LogLevel.DEBUG;
        global.client = new window.GOBE.Client(clientConfig);
        global.client.onInitResult((resultCode) => this.onInitResult(resultCode));
        global.client.onMatch((onMatchResponse) => this.onMatch(onMatchResponse));
        Util.printLog("正在初始化 SDK");
        global.client.init().catch((e) => {
            Util.printLog('init err: ' + e);
            // 鉴权失败
            Dialog.open("提示", "初始化失败，请重新刷新页面");
        });
    }

    // 初始化监听回调
    onInitResult(resultCode: number) {
        if(resultCode === window.GOBE.ErrorCode.COMMON_OK){
            global.playerId = global.client.playerId;
            // demo生成昵称保存到global
            global.playerName = Util.mockPlayerName();
            Util.printLog('init success');
            if (global.client.lastRoomId || global.client.lastGroupId){
                if(global.client.lastRoomId) {
                    Util.printLog('房间Id' + global.client.lastRoomId);
                    global.client.joinRoom(global.client.lastRoomId,
                        {customPlayerStatus: 0, customPlayerProperties: ""}).then((room) => {
                        Util.printLog("加入房间成功");
                        global.room = room;
                        global.player = room.player;
                        Util.printLog('玩家id ：' + global.player.playerId + '  房主id ：' + global.room.ownerId);
                        // 重置帧id
                        let roomProp = JSON.parse(global.room.customRoomProperties);
                        global.isOnlineMatch = roomProp.isOnlineMatch;
                        Util.printLog("isOnlineMatch:"+global.isOnlineMatch);
                        if (roomProp.curFrameId) {
                            room.resetRoomFrameId(roomProp.curFrameId);
                        }
                        if (roomProp.roomType) {
                            global.roomType = roomProp.roomType;
                            if(roomProp.roomType === RoomType.OneVOne) {
                                global.jumpType = RoomType.OneVOne;
                                cc.director.loadScene("room");
                            } else if (roomProp.roomType === RoomType.TwoVTwo) {
                                global.jumpType = RoomType.TwoVTwo;
                                cc.director.loadScene("teamroom");
                            } else if (roomProp.roomType === RoomType.ThreeVOne) {
                                global.jumpType = RoomType.ThreeVOne;
                                cc.director.loadScene("asymmetricroom");
                            }else{
                                global.jumpType = RoomType.OneGroup;
                            }
                        }
                    }).catch((e) => {
                        Util.printLog('加入房间失败，roomId： ' + global.client.lastRoomId);
                        Dialog.open("提示", "加入房间失败" + Util.errorMessage(e));
                        global.client.leaveRoom().then(() => {
                            Util.printLog("leaveRoom success");
                            global.roomType = RoomType.NULL;
                        });
                        cc.director.loadScene("hall");
                    });
                }
                if (global.client.lastGroupId){
                    //global.roomType = RoomType.NULL;
                    // 检测是否要进行group重连
                    console.log('lastGroupId存在：' + global.client.lastGroupId);
                    global.client.joinGroup(global.client.lastGroupId).then((group) => {
                        global.group = group;
                        global.player = group.player;
                        if (!global.client.lastRoomId || global.jumpType === RoomType.OneGroup)
                            cc.director.loadScene("team");
                    });
                }
            } else{
                cc.director.loadScene("hall");
            }
            window.GOBE.Logger.level = window.GOBE.LogLevel.DEBUG;
            Util.printLog('init success');
        } else {
            Util.printLog('init failed');
        }
    }

    onMatch(res){
        Util.printLog('触发匹配');
        Util.printLog(global.group.customGroupProperties);
        if (res.rtnCode === 0) {
            Util.printLog('在线匹配成功:' + res.room);
            global.room = res.room;
            global.player = res.room.player;
            global.group = global.client.group;
            cc.director.loadScene(config.asymmetric ? "asymmetricroom" : "teamroom");
            Reloading.close();
        } else {
            Util.printLog("在线匹配失败" + Util.errorMessage(res));
            Reloading.close();
        }
    }

    onDisable() {
        // 关闭对话框
        Dialog.close();
    }
}
