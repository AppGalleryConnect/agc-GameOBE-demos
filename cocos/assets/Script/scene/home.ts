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

import configs from "../../config";

import * as Util from "../../util";
import global from "../../global";
import Dialog from "../comp/Dialog";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Home extends cc.Component {
    @property(cc.Sprite)
    button: cc.Sprite = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    start() {
        this.initDialog();
        this.initListener();
        this.initSDK();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    async initSDK() {

        if (Util.isInited()) {
            return Util.printLog("SDK 已经初始化，无需重复操作");
        }

        // @ts-ignore
        const client = new window.GOBE.Client({
            appId: configs.gameId,
            openId: configs.openId, // 区别不同用户
            channel: configs.channel,
            clientId: configs.clientId,
            clientSecret: configs.clientSecret
        });

        Util.printLog("正在初始化 SDK");
        client.init().then(() => {
            // 鉴权成功
            Util.printLog("鉴权成功");
            global.playerId = client.playerId;
            global.client = client;
            // demo生成昵称保存到global
            global.playerName = Util.mockPlayerName();
        }).catch((e) => {
            // 鉴权失败
            Dialog.open("提示", "鉴权失败" + Util.errorMessage(e));
        });
    }

    initListener() {
        this.button.node.on(cc.Node.EventType.TOUCH_START, () => this.goHall());
    }

    goHall() {
        if (Util.isInited()) {
            cc.director.loadScene("hall")
        } else {
            Dialog.open("提示", "鉴权失败，请重新刷新页面");
        }
    }

    onDisable() {
        // 关闭对话框
        Dialog.close();
    }

}
