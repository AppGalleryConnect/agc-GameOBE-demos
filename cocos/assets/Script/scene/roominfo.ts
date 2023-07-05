/**
 * Copyright 2023. Huawei Technologies Co., Ltd. All rights reserved.
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
import {LockType} from "../commonValue";

// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class roominfo extends cc.Component {

    @property(cc.Button)
    cancelButton: cc.Button = null;

    @property(cc.Button)
    createRoomButton: cc.Button = null;

    @property(cc.EditBox)
    roomNameEdit: cc.EditBox = null;

    @property(cc.ToggleContainer)
    isPrivateRoom: cc.ToggleContainer = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Toggle)
    isLockRoom: cc.Toggle = null;

    start() {
        this.initListener();
        this.initDialog();
    }

    initListener() {
        this.cancelButton.node.on(cc.Node.EventType.TOUCH_START, () => this.cancel());
        this.createRoomButton.node.on(cc.Node.EventType.TOUCH_START, () => this.createRoom());
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    cancel() {
        Util.printLog("返回大厅");
        cc.director.loadScene("match");
    }

    createRoom() {
        if (!Util.isInited()) {
            return Util.printLog("请先初始化 SDK");
        }
        Util.printLog(`正在创建房间`);
        let isPrivate = 1; // 私有
        let toggles: cc.Toggle[] = this.isPrivateRoom.toggleItems;
        if (toggles && toggles.length > 0 && toggles[0].isChecked) {
            // 0公开
            isPrivate = 0;
        }
        // 创建（并加入）房间
        global.client.createRoom(
            {
                maxPlayers: 2,
                isPrivate: isPrivate,
                roomName: this.roomNameEdit.string,
                roomType: global.matchRule + "",
                matchParams: {
                    'matchRule': global.matchRule,
                    'matchRule2': global.matchRule,
                },
                customRoomProperties: '',
                isLock: this.isLockRoom.isChecked ? LockType.Locked : LockType.UnLocked
            },
            {customPlayerStatus: 0, customPlayerProperties: "111"}).then((room) => {
            // 创建房间成功
            Util.printLog("创建房间成功");
            global.room = room;
            global.player = room.player;
            cc.director.loadScene("room");
        }).catch((e) => {
            // 创建房间失败
            Dialog.open("提示", "创建房间失败" + Util.errorMessage(e));
        });
    }

    onDisable() {
        // 关闭对话框
        Dialog.close();
    }
}
