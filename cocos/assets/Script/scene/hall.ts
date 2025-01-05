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
import Dialog from "../comp/Dialog";
import Reloading from "../comp/Reloading";
import config from "../../config";
import {LockType} from "../commonValue";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Hall extends cc.Component {

    @property(cc.Sprite)
    ordinaryRoomBtn: cc.Sprite = null;

    @property(cc.Sprite)
    expertRoomBtn: cc.Sprite = null;

    // 组队匹配
    @property(cc.Sprite)
    teamMatchBtn: cc.Sprite = null;

    // 快速匹配（可用）
    @property(cc.Sprite)
    fastMatchBtn: cc.Sprite = null;

    // 加入队伍
    @property(cc.Sprite)
    joinTeamBtn: cc.Sprite = null;

    // 战绩回放
    @property(cc.Sprite)
    recordBtn: cc.Sprite = null;

    // 正在匹配加载界面
    @property(cc.Prefab)
    reloadingPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    private lockSubmit: boolean = false;

    start() {
        this.initView();
        this.initListener();
        this.initDialog();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    /**
     * 界面初始化
     */
    initView() {
        // 设置加载Dialog
        const reloadingNode = cc.instantiate(this.reloadingPrefab) as cc.Node;
        reloadingNode.parent = this.node;
    }

    initListener() {
        this.ordinaryRoomBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.onOrdinaryRoomBtn());
        this.expertRoomBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.onExpertRoomBtn());
        this.teamMatchBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.onTeamMatchBtn());
        this.joinTeamBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.onJoinTeamBtn());
        this.fastMatchBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.onMatchPlayer());
        this.recordBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.onRecordList());

        // 绑定在线/组队匹配监听事件
        global.client.onMatch.clear();
        global.client.onMatch((onMatchResponse) => this.onMatch(onMatchResponse));
        global.client.onKickOff(()=>this.onKickOff())
    }

    /**
     * “战绩回放”按钮点击事件
     */
    onRecordList() {
        cc.director.loadScene('recordList');
        /*global.client.queryRecordList(1, 8).then((res) => {
            console.log('queryRecordList success res: ' + JSON.stringify(res));
        }).catch((err) => {
            console.log('queryRecordList err: ' + err);
        })*/
    }

    /**
     * “普通房间”按钮点击事件
     */
    onOrdinaryRoomBtn() {
        Util.printLog(`正在进入菜鸟区`);
        global.matchRule = '0';
        cc.director.loadScene("match");
    }

    /**
     * “高手房间”按钮点击事件
     */
    onExpertRoomBtn() {
        Util.printLog(`正在进入高手区`);
        global.matchRule = '1';
        cc.director.loadScene("match");
    }

    onTeamMatchBtn() {
        if (!Util.isInited()) {
            return Util.printLog("请先初始化 SDK");
        }
        !this.lockSubmit && this.teamMatch();
    }

    /**
     * 组队匹配（创建队伍）
     */
    teamMatch() {
        let data = {
            playerName: global.playerName
        };
        global.client.createGroup({
            maxPlayers: 2,
            groupName: "快乐小黑店",
            customGroupProperties: "",
            isLock: LockType.UnLocked,    // 是否禁止加入 0:不禁止 1:禁止 默认0
            isPersistent: 0,    // 是否持久化 0:不持久化 1:持久化 默认0
        }, {
            customPlayerStatus: 0,
            customPlayerProperties: JSON.stringify(data),
        }).then((group) => {
            Util.printLog("队伍创建成功");
            global.group = group;
            this.lockSubmit = false;
            cc.director.loadScene("team");
        }).catch((e) => {
            this.lockSubmit = false;
            Dialog.open("提示", "组队匹配失败" + Util.errorMessage(e));
        });
    }

    /**
     * 加入队伍
     */
    onJoinTeamBtn() {
        cc.director.loadScene("teaminfo");
    }

    onDisable() {
        // 关闭对话框
        Dialog.close();
    }

    /**
     * “快速匹配”按钮
     * 进行在线匹配
     */
    async onMatchPlayer() {
        Util.printLog("玩家 " + global.playerId + " 进行在线匹配");
        let player = {
            playerId: global.playerId,
            matchParams: Util.getPlayerMatchParams()
        };
        this.lockSubmit = true;
        Reloading.open("匹配中。。。", true, () => {
            this.cancelTeamMatch();
        });
        // 调用GOBE的matchPlayer发起在线匹配
        global.client.matchPlayer(
            {
                playerInfo: player,
                teamInfo: Util.getTeamMatchParams(),
                matchCode: config.asymmetric ? config.asymmetricMatchCode : config.matchCode
            }, {customPlayerStatus: 0, customPlayerProperties: Util.getCustomPlayerProperties()}).then((res) => {
            // 匹配开始
            global.isOnlineMatch = true;
            Util.printLog("在线匹配开始")
        }).catch((e) => {
            this.lockSubmit = false;
            Util.printLog("在线匹配失败" + Util.errorMessage(e));
            Util.printLog(e.code);
            Reloading.close();
        });
    }

    onMatch(res){
        if (res.rtnCode === 0) {
            Util.printLog('在线匹配成功:' + res.room);
            global.room = res.room;
            global.player = res.room.player;
            cc.director.loadScene(config.asymmetric ? "asymmetricroom" : "teamroom");
            Reloading.close();
        } else {
            this.lockSubmit = false;
            Util.printLog("在线匹配失败" + Util.errorMessage(res));
            Reloading.close();
        }
    }

    /**
     * 取消快速匹配
     */
    cancelTeamMatch() {
        global.client.cancelMatch().then(() => {
            global.isOnlineMatch = false;
            Util.printLog('取消匹配成功');
        }).catch(() => {
            Util.printLog('取消匹配失败');
        })
    }

    private onKickOff() {
        Util.printLog('多端登录，玩家离线');
    }
}
