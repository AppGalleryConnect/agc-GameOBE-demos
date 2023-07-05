/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2017 DragonBones team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *  2021.12.15-Changed method initPlayer
 *  2023.06.28-Changed method initPlayer
 *  2021.12.15-Changed method onCollisionEnter
 *             Copyright(C)2023. Huawei Technologies Co., Ltd. All rights reserved
 */

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

import global from "../../global";
import {
    Team,
    CollideTag,
    frameSyncPlayerInitList,
    colliderEventMap,
    frameSyncPlayerList,
    destroyedBulletSet
} from "../function/FrameSync";
import {PlayerData} from "../function/PlayerList";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Player extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.Sprite)
    icon1Sprite: cc.Sprite = null;

    @property(cc.Sprite)
    icon2Sprite: cc.Sprite = null;

    @property(cc.ProgressBar)
    hp: cc.ProgressBar = null;

    public cloudSize = 36;
    // 组件需要记录玩家id，后面有用
    playerId: string;

    action: cc.ActionInterval;

    public initPlayer(playerData: PlayerData) {
        this.node.name = playerData.playerId;
        this.playerId = playerData.playerId;
        this.hp.getComponent(cc.ProgressBar).progress = playerData.hp / global.planeMaxHp;

        if ((playerData.teamId == null && playerData.playerId === global.playerId) ||
            (playerData.teamId != null && playerData.teamId === Team.red)
        ) {
            this.icon1Sprite.node.active = true;
            this.icon2Sprite.node.active = false;
            this.icon1Sprite.node.angle = playerData.direction;
        }
        if ((playerData.teamId == null && playerData.playerId !== global.playerId) ||
            (playerData.teamId != null && playerData.teamId === Team.yellow))
        {
            this.icon2Sprite.node.active = true;
            this.icon1Sprite.node.active = false;
            this.icon2Sprite.node.angle = playerData.direction;
        }
        if (playerData.playerId === global.playerId) {
            this.label.string = '我';
        }
        else {
            if (playerData.robotName) {
                this.label.string = playerData.robotName;
            }
            else {
                this.label.string = playerData.playerId;
            }
        }

        this.node.x = playerData.x;
        this.node.y = playerData.y;
    }

    /**
     * 碰撞检测
     * @param other
     */
    onCollisionEnter (other, self) {
        if(other.tag == CollideTag.bullet){
            let bulletHead = other.node.name.split('_')[0];
            if (bulletHead == this.playerId) {
                return;
            }
            console.log(`Plane onCollisionEnter playerId: ${this.playerId}, selfTag: ${self.tag}, otherTag: ${other.tag},`);
            let syncPlayer = frameSyncPlayerList.players.find((p) => p.playerId == this.playerId);
            if(this.hp.getComponent(cc.ProgressBar).progress < 1){
                console.log('----残血被攻击----');
                let initPlayer = frameSyncPlayerInitList.players.find((p) => p.playerId == this.playerId);
                if(initPlayer){
                    syncPlayer.hp = global.planeMaxHp;
                    syncPlayer.x = initPlayer.x;
                    syncPlayer.y = initPlayer.y;
                    syncPlayer.direction = initPlayer.direction;
                }
            }
            else{
                console.log('----满血被攻击----');
                syncPlayer.hp = 1;
            }

            colliderEventMap.set(other.node.name, {
                playerId: this.playerId,
                bulletId: other.node.name,
                timeStamp: Date.now()
            });
            destroyedBulletSet.add(other.node.name);
            console.log('---------缓存碰撞事件---------');
        }
    }
}
