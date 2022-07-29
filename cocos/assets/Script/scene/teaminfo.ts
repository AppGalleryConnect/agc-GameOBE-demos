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

const {ccclass, property} = cc._decorator;

@ccclass
export default class TeamInfo extends cc.Component {

    // 队伍code
    @property(cc.EditBox)
    teamCode: cc.EditBox = null;
    // 日志信息
    @property(cc.Label)
    logTip: cc.Label = null;
    // ”加入队伍“按钮
    @property(cc.Button)
    entryTeamBtn: cc.Button = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    // ”退出“按钮
    @property(cc.Button)
    quitBtn: cc.Button = null;

    private lockSubmit: boolean = false;

    start() {
        // 绑定“加入队伍”按钮
        this.entryTeamBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.joinTeam());
        this.quitBtn.node.on(cc.Node.EventType.TOUCH_END, () => cc.director.loadScene("hall"));
        this.initDialog();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    async joinTeam() {
        let groupId = this.teamCode.string;
        if (!groupId) {
            return this.logTip.string = `请输入正确的队伍号`;
        }
        this.lockSubmit = true;
        Util.printLog(`正在加入队伍，队伍CODE：${groupId}`);

        let data = {
            playerName: global.playerName
        };

        await global.client.joinGroup(
            groupId,
            {
                customPlayerStatus: 0,
                customPlayerProperties: JSON.stringify(data),
            },
        ).then((group) => {
            Util.printLog("加入队伍成功");
            global.group = group;
            this.lockSubmit = false;
            cc.director.loadScene("team");
        }).catch((e) => {
            this.lockSubmit = false;
            this.logTip.string = "场景报错：房间已满，无法加入！";
            Dialog.open("提示", "加入队伍失败" + Util.errorMessage(e));
        });
    }


}
