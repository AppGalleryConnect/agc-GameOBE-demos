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
import Dialog from "../comp/Dialog";
import {RoomInfo} from "../../GOBE/GOBE";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RoomList extends cc.Component {

    @property(cc.Node)
    listContent: cc.Node = null;

    @property(cc.Button)
    entryRoomBtn: cc.Button = null;

    @property(cc.EditBox)
    entryRoomEdit: cc.EditBox = null;

    @property(cc.Button)
    entryRoomByCodeBtn: cc.Button = null;

    @property(cc.Button)
    quitBtn: cc.Button = null;

    @property(cc.EditBox)
    entryRoomByCodeEdit: cc.EditBox = null;

    @property(cc.Layout)
    layOut: cc.Layout = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    private lockSubmit: boolean = false;

    start() {
        this.initView();
        this.queryData();
        this.initListener();
        this.initSchedule();
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
        this.entryRoomBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.joinRoom());
        this.entryRoomByCodeBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.joinRoom());
        this.quitBtn.node.on(cc.Node.EventType.TOUCH_END, () => cc.director.loadScene("hall"));
    }

    async joinRoom() {
        let target: string = null;
        Util.printLog('房间Id' + this.entryRoomEdit.string);
        let roomId = this.entryRoomEdit.string;
        Util.printLog('房间Code' + this.entryRoomByCodeEdit.string);
        let roomCode = this.entryRoomByCodeEdit.string;

        if (roomId) {
            target = roomId;
        } else if (roomCode) {
            target = roomCode;
        } else {
            return Util.printLog(`请输入正确的房间ID或房间Code`);
        }

        this.lockSubmit = true;
        Util.printLog(`正在加入房间，房间ID或房间Code：${target}`);
        await global.client.joinRoom(target,
            {customPlayerStatus: 0, customPlayerProperties: ""}).then((room) => {
            Util.printLog("加入房间成功");
            global.room = room;
            global.player = room.player;
            this.lockSubmit = false;
            this.loadRoomScene();
        }).catch((e) => {
            this.lockSubmit = false;
            Dialog.open("提示", "加入房间失败" + Util.errorMessage(e));
        });
    }

    loadRoomScene() {
        this.lockSubmit = true;
        cc.director.loadScene("room");
    }

    queryData() {
        global.client.getAvailableRooms({
            roomType: global.matchRule
        }).then((infos) => {
            Util.printLog("查询房间列表成功");
            global.roomInfos = infos.rooms;
            this.freshList();
            this.changeList()
        }).catch((e) => {
            // 查询房间列表失败
            Util.printLog("查询房间列表失败" + Util.errorMessage(e));
            global.roomInfos = []
            this.freshList();
            this.changeList()
        })
    }

    freshList() {
        let scriptComponent = this.layOut.getComponent("ItemList")
        scriptComponent.fresh();
        const cls: cc.Node[] = scriptComponent.node.children;
        for (let i = 0; i < cls.length; ++i) {
            const backGround = cls[i].getComponent("ItemTemplate").backGround
            backGround.on(cc.Node.EventType.TOUCH_START, () => this.freshEdit(global.roomInfos[i]));
        }
    }

    freshEdit(data: RoomInfo) {
        this.entryRoomEdit.string = data.roomId;
        this.entryRoomByCodeEdit.string = data.roomCode;
    }

    changeList() {
        if (global.roomInfos) {
            const nums: number = global.roomInfos.length;
            if (nums <= 10) {
                this.listContent.height = 480
            } else {
                this.listContent.height = 480 + (nums - 10) * 47
            }
        }
    }

    onDisable() {
        // 关闭对话框
        Dialog.close();
    }

    // ====================定时去刷新房间列表信息====================
    initSchedule() {
        // 以秒为单位的时间间隔
        let interval = 2;
        // 开始延时
        let delay = 5;
        this.schedule(function () {
            this.queryData();
        }, interval, cc.macro.REPEAT_FOREVER, delay);
    }
}
