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
import {RoomType} from "../commonValue";
import * as Util from "../../util";
import global from "../../global";
import ReopenGame from "../comp/ReopenGame";
import Dialog from "../comp/Dialog";
import {PlayerInfo, Room, RecvFromServerInfo} from "../../GOBE/GOBE";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameEnd extends cc.Component {
    @property(cc.Label)
    endText: cc.Label = null;

    @property(cc.Node)
    leaveBtn: cc.Node = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    reopenGamePrefab: cc.Prefab = null;

    start() {
        this.initDialog();
        this.initListener();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;

        // 设置重开一局游戏弹框
        const reopenGameNode = cc.instantiate(this.reopenGamePrefab) as cc.Node;
        reopenGameNode.parent = this.node;
    }

    initListener() {
        this.leaveBtn.on(cc.Node.EventType.TOUCH_START, () => this.leaveRoom());
        global.room.onRecvFromServer((serverInfo) => this.onReceiveFromServer(serverInfo));
    }

    onReceiveFromServer(data: RecvFromServerInfo) {
        Util.printLog('onReceiveFromServer:'+JSON.stringify(data));
        if (data.msg) {
            let res = JSON.parse(data.msg);
            if (res.type === "GameEnd") {
                this.endText.string = res.result === 0 ? "结算正常" : "结算异常";
            }
        } else {
            this.endText.string = "结算异常";
        }
    }

    leaveRoom() {
        if (!global.isTeamMode) {
            this.reopenGame();
        } else {
            cc.director.loadScene("hall");
        }
    }

    // 重开一局
    reopenGame() {
        ReopenGame.open("提示", "游戏已结束，需要重开一局吗？", () => {
            global.room.update().then((room) => {
                if (this.isInRoom(room)) {
                    cc.director.loadScene("room");
                } else {
                    global.roomType = RoomType.NULL;
                    cc.director.loadScene("hall");
                }
            }).catch((e) => {
                Util.printLog("update err: " + e);
                cc.director.loadScene("hall");
            });
        }, () => {
            global.client.leaveRoom().then(() => {
                // 退出房间成功
                Util.printLog("退出房间成功");
                global.roomType = RoomType.NULL;
                cc.director.loadScene("hall");
            }).catch((e) => {
                // 退出房间失败
                Dialog.open("提示", "退出房间失败" + Util.errorMessage(e));
            });
        });
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
