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
import {PlayerInfo} from "../../GOBE/GOBE";
import Reloading from "../comp/Reloading";
import config from "../../config";
import Dialog from "../comp/Dialog";
import {sleep} from "../function/Common";
import Global from "../../global";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Team extends cc.Component {
    // 刷新队伍名称
    @property(cc.Button)
    updateBtn: cc.Button = null;
    // 队伍名称
    @property(cc.Label)
    teamName: cc.Label = null;
    // 当前玩家数
    @property(cc.Label)
    playerNum: cc.Label = null;
    // 解散房间
    @property(cc.Node)
    enableDismissBtn: cc.Node = null;
    // 快速匹配（可用）
    @property(cc.Node)
    enableMatchBtn: cc.Node = null;
    // 退出队伍
    @property(cc.Node)
    enableLeaveBtn: cc.Node = null;
    // 正在匹配加载界面
    @property(cc.Prefab)
    reloadingPrefab: cc.Prefab = null;
    // 队伍code
    @property(cc.EditBox)
    teamCodeEditBox: cc.EditBox = null;
    // 弹框
    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    // 是否是队长
    public isOwner = false;

    start() {
        this.initDialog();
        this.initView();
        this.initListener();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    /**
     * 界面初始化（全量更新）
     */
    initView() {
        const group = global.group;
        // 当前玩家数
        this.playerNum.string = String(group.players.length);
        // 队伍code
        this.teamCodeEditBox.string = group.id;
        Util.printLog("队伍code：" + group.id);
        this.teamName.string = '队伍名称：' + group.groupName;
        // 获取队长玩家
        let ownerPlayer: PlayerInfo = null;
        let players = group.players;
        global.player = group.player;
        for (const player of players) {
            if (player.playerId === group.ownerId) {
                ownerPlayer = player;
            }
        }
        //获取非队长玩家
        let playerInfos = players.filter(player => player.playerId !== group.ownerId);
        /* 玩家昵称赋值 */
        let bgRoomCmp = cc.find("Canvas/Main Camera/bg/bg_room");
        const cls: cc.Node[] = bgRoomCmp.children;
        let playerProperties = "";
        for (let i = 0; i < cls.length; ++i) {
            // 每次得先清空
            let nameNode = cls[i].getChildByName("name");
            let nameCmp = nameNode.getComponent(cc.Label);
            nameCmp.string = "";
            if (i == 0) {
                // 默认第一玩家节点就是队长，先赋值
                let nameNode = cls[i].getChildByName("name");
                let nameCmp = nameNode.getComponent(cc.Label);

                playerProperties = JSON.parse(ownerPlayer.customPlayerProperties);
                nameCmp.string = playerProperties["playerName"];
            } else {
                // 然后赋值其他玩家
                for (const player of playerInfos) {
                    let nameNode = cls[i].getChildByName("name");
                    let nameCmp = nameNode.getComponent(cc.Label);
                    playerProperties = JSON.parse(player.customPlayerProperties);
                    nameCmp.string = playerProperties["playerName"];
                }
            }
        }
        // 根据是否队长显示按钮
        if (group.ownerId === group.player.playerId) {    // 是队长
            this.isOwner = true;
            // 显示“解散队伍”和“快速匹配”按钮
            this.enableMatchBtn.active = true;
            this.enableDismissBtn.active = true;
            // 隐藏“退出队伍”按钮
            this.enableLeaveBtn.active = false;
            this.updateBtn.node.active = true;
        } else {  // 不是队长
            // 隐藏“解散队伍”、“快速匹配”按钮
            this.isOwner = false;
            this.enableMatchBtn.active = false;
            this.enableDismissBtn.active = false;
            // 显示“退出队伍”按钮
            this.enableLeaveBtn.active = true;
            this.updateBtn.node.active = false;
        }
        // 设置加载Dialog
        const relaodingNode = cc.instantiate(this.reloadingPrefab) as cc.Node;
        relaodingNode.parent = this.node;
    }

    initListener() {
        // 绑定”解散队伍“按钮
        this.enableDismissBtn.on(cc.Node.EventType.TOUCH_START, () => this.dismissGroup());
        // 绑定”退出队伍“按钮
        this.enableLeaveBtn.on(cc.Node.EventType.TOUCH_START, () => this.leaveGroup());
        // 绑定“快速匹配”按钮
        this.enableMatchBtn.on(cc.Node.EventType.TOUCH_START, () => this.teamMatch());
        // 更新队伍名称
        this.updateBtn.node.on(cc.Node.EventType.TOUCH_START, () => this.updateTeamName());

        // 清除group绑定事件
        this.clearListener()

        // 监听心跳事件（demo根据不同的事件，对数据或界面更新）
        global.group.onDismiss(() => this.onDismiss());
        global.group.onLeave((playerInfo) => this.onLeave(playerInfo));
        global.group.onJoin((playerInfo) => this.onJoin(playerInfo));
        global.group.onMatchStart(() => this.onTeamMatch());
        global.group.onUpdate((groupInfo) => this.onUpdate(groupInfo));
        // 断线重连
        global.group.onDisconnect((playerInfo: PlayerInfo) => this.onDisconnect(playerInfo)); // 断连监听
    }

    updateTeamName() {
        const name = `随机队伍${Math.floor(Math.random() * 90 + 10)}`;
        global.group.updateGroup({groupName: name}).then(() => {
            console.log(`更新小队名称为${name}`);
        });
    }

    onUpdate(groupInfo) {
        this.teamName.string = '队伍名称：' + groupInfo.groupName;
        console.log('更新队伍名称成功: ' + groupInfo.groupName);
    }

    clearListener() {
        global.group.onDismiss.clear();
        global.group.onLeave.clear();
        global.group.onJoin.clear();
        global.group.onMatchStart.clear();
    }

    /**
     * 解散队伍
     */
    dismissGroup() {
        Util.printLog(`正在解散队伍`);
        global.client.dismissGroup().then(() => {
            Util.printLog("解散队伍成功");
            global.group = null;
            cc.director.loadScene("hall");
        }).catch((e) => {
            Dialog.open("提示", "解散队伍失败" + Util.errorMessage(e));
        });
    }

    /**
     * 监听“解散队伍”
     */
    onDismiss() {
        Util.printLog("队伍已解散");
        global.group = null;
        cc.director.loadScene("hall");
    }

    /**
     * 退出队伍
     */
    leaveGroup() {
        Util.printLog(`正在退出队伍`);
        global.client.leaveGroup().then(() => {
            Util.printLog("退出队伍成功");
            global.group = null;
            cc.director.loadScene("hall");
        }).catch((e) => {
            Dialog.open("提示", "退出队伍失败" + Util.errorMessage(e));
        });
    }

    /**
     * 监听“退出队伍”
     */
    onLeave(playerInfo) {
        console.log('触发了离开小队的消息');
        // 当前操作人id（比如是谁退出了队伍）
        let operator = playerInfo.playerId;
        if (operator == global.playerId) {  // 是本人退出
            cc.director.loadScene("hall");
        } else {
            this.updateGroup();
        }
    }

    /**
     * 监听“加入队伍”
     */
    onJoin(serverEvent) {
        Util.printLog("加入队伍: " + JSON.stringify(serverEvent));
        //更新队伍信息
        this.updateGroup();
    }

    /**
     * 快速匹配
     */
    teamMatch() {
        let players = global.group.players;
        global.client.group.query().then((group) => {
            global.group = group;
            players = group.players;
            // 组队小队匹配
            this.teamMatchGroup(players);
            Reloading.open("匹配中。。。", this.isOwner, () => {
                if (this.isOwner) {
                    // 队长
                    this.cancelTeamMatch();
                }
            });
        }).catch((e) => {
            Util.printLog("快速匹配失败" + Util.errorMessage(e));
            Reloading.close();
        });
    }

    /**
     * 取消快速匹配
     */
     cancelTeamMatch() {
        global.client.cancelMatch().then((res) => {
            Util.printLog('取消匹配成功');
        }).catch((err) => {
            Util.printLog('取消匹配失败');
        })
    }

    /**
     * 监听“组队匹配”
     */
    onTeamMatch() {
        Util.printLog('isOwner:' + this.isOwner);
        Util.printLog('心跳：匹配开始通知');
        if (!this.isOwner) {
            // 如果不是队长就弹出匹配中
            Reloading.open("队员匹配中。。。", false);
            global.client.matchQuery();
        }
    }

    // 组队小队匹配
    private teamMatchGroup(players) {
        let playerInfos = [];
        for (const p of players) {
            let player = {
                playerId: p.playerId,
                matchParams: {"level": "2"}
            };
            playerInfos.push(player);
        }
        // 传递“昵称”作为玩家自定义属性
        let playerName: string = global.playerName;
        let data: Object = {
            playerName
        };
        let customPlayerProperties: string = JSON.stringify(data);
        // 调用GOBE的matchGroup方法发起组队匹配
        global.client.matchGroup({
                playerInfos: playerInfos,
                matchCode: config.matchCode
            },
            {customPlayerStatus: 0, customPlayerProperties: customPlayerProperties}).then((res) => {
            Util.printLog('组队匹配开始');
        }).catch((e) => {
            Util.printLog('队员匹配失败:' + Util.errorMessage(e));
            Reloading.close();
        });
    }

    /**
     * 更新队伍信息
     */
    updateGroup() {
        global.client.group.query().then((group) => {
            global.group = group;
            Util.printLog("获取最新的队伍信息成功");
            //有人加入队伍，需要刷新页面
            this.initView();
        }).catch((e) => {
            if (e.code == 101302) {   // 队伍不存在
                Util.printLog("队伍不存在，返回大厅");
                cc.director.loadScene("hall");
                return;
            }
            // 退出队伍失败
            Util.printLog("获取最新的队伍信息失败" + Util.errorMessage(e));
        });
    }

    onDisable() {
        Reloading.close();
        if (global.group) {
            global.group.removeAllListeners();
        }
    }

     async onDisconnect(playerInfo: PlayerInfo) {
        Util.printLog("玩家掉线");
        if (playerInfo.playerId === global.playerId) {
            Global.isGroupConnected = false;
           await this.reConnectGroup();
        }
    }

     async reConnectGroup() {
        while (!Global.isGroupConnected){
            // 没有超过重连时间，就进行重连操作
            await global.group.reconnect().then(() => {
                Global.isGroupConnected = true;
                Util.printLog("玩家重连小队成功");
            }).catch((error) => {
               if (!error.code || error.code === 91002) {
                   // 加入房间请求不通就继续重连
                   Util.printLog("玩家重连小队失败，重新尝试");
               }
               if (error.code && (error.code === 101205 || error.code === 101206 || error.code === 101202)) {
                   // 无法加入房间需要退出到大厅
                   Util.printLog("玩家重连小队失败");
                   cc.director.loadScene("hall");
               }
           });
            await sleep(2000).then();
        }
    }
}
