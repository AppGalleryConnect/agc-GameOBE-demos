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
import Reloading from "../comp/Reloading";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Match extends cc.Component {

    @property(cc.Sprite)
    createRoomButton: cc.Sprite = null;

    @property(cc.Sprite)
    joinRoomButton: cc.Sprite = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Sprite)
    matchRoomBtn: cc.Sprite = null;

    static cacertNativeUrl = "";
    private lockSubmit: boolean = false;
    private timer = undefined;

    //“正在匹配”遮罩
    @property(cc.Prefab)
    matchingPrefab: cc.Prefab = null;

    start() {
        this.initView();
        this.initListener();
    }

    initView() {
        this.initDialog();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    initListener() {
        this.createRoomButton.node.on(cc.Node.EventType.TOUCH_START, () => this.onCreateRoomNodeClick());
        this.joinRoomButton.node.on(cc.Node.EventType.TOUCH_START, () => this.showJoinRoomEle());
        // 监听“快速匹配”按钮
        this.matchRoomBtn.node.on(cc.Node.EventType.TOUCH_START, () => !this.lockSubmit && this.onMatchRoom());
        // 初始化“正在匹配”遮罩
        const matchingNode = cc.instantiate(this.matchingPrefab) as cc.Node;
        matchingNode.parent = this.node;
    }

    onCreateRoomNodeClick() {
        if (!Util.isInited()) {
            return Util.printLog("请先初始化 SDK");
        }
        !this.lockSubmit && this.createRoom();
    }

    onDisable() {
        // 关闭对话框
        Dialog.close();
        // 场景销毁时一定要清理回调，避免引用UI时报错
        clearInterval(this.timer);
        Reloading.close();
    }

    // SDK 创建房间
    async createRoom() {
        cc.director.loadScene("roominfo");
    }

    showJoinRoomEle() {
        cc.director.loadScene("roomlist");
    }

    loadRoomScene() {
        this.lockSubmit = true;
        cc.director.loadScene("room");
    }

    /**
     * “快速匹配”按钮
     * 进行房间匹配
     */
    async onMatchRoom() {
        this.lockSubmit = true;
        Reloading.open("匹配中。。。", false);
        global.client.matchRoom({
            matchParams: {
                'matchRule': global.matchRule,
                'matchRule2': global.matchRule,
            },
            roomType: global.matchRule,
            customRoomProperties: global.matchRule,
            maxPlayers: 2,
        }, {customPlayerStatus: 0, customPlayerProperties: ""}).then((room) => {
            Reloading.close();
            Util.printLog("房间匹配成功");
            global.room = room;
            global.player = room.player;
            this.lockSubmit = false;
            //转入room场景
            cc.director.loadScene("room");
        }).catch((e) => {
            Reloading.close();
            this.lockSubmit = false;
            Dialog.open("提示", "房间匹配失败" + Util.errorMessage(e));
        });
    }
}
