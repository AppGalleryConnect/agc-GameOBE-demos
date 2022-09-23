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
 *             Copyright(C)2021. Huawei Technologies Co., Ltd. All rights reserved
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
import {Team, CollideTagEnum, FrameSyncCmd} from "../function/FrameSync";
import * as Util from "../../util";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Player extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.Sprite)
    icon1Sprite: cc.Sprite = null;

    @property(cc.Sprite)
    icon2Sprite: cc.Sprite = null;

    public cloudSize = 36;
    // 组件需要记录玩家id，后面有用
    playerId: string;

    public initPlayer(id: string, rotation: number, x = 0, y = 0, playerTeamId: string, robotName?: string) {

        this.playerId = id;

        if ((playerTeamId == null && id === global.playerId) || (playerTeamId != null && playerTeamId === Team.red)) {
            this.icon1Sprite.node.active = true;
            this.icon2Sprite.node.active = false;
            this.icon1Sprite.node.angle = rotation;
        }
        if ((playerTeamId == null && id !== global.playerId) || (playerTeamId != null && playerTeamId === Team.yellow)) {
            this.icon2Sprite.node.active = true;
            this.icon1Sprite.node.active = false;
            this.icon2Sprite.node.angle = rotation;
        }
        if (id === global.playerId) {
            id = "我";
        }
        if (robotName) {
            id = robotName;
        }
        this.label.string = id;
        this.node.x = x;
        this.node.y = y;
    }

    onCollisionEnter (other, self) {
        if(other.tag == CollideTagEnum.bullet){
            // 飞机被子弹击中后回到初始化位置
            let otherTag: number = other.tag; // 碰到了谁
            let selfTag: number = self.tag; // 自己的碰撞标签
            let cmd: FrameSyncCmd = FrameSyncCmd.collide;
            let playerId: string = this.playerId;
            const data: Object = {
                cmd, otherTag, selfTag, playerId
            };
            let frameData: string = JSON.stringify(data);
            try{
                global.room.sendFrame(frameData);
            }
            catch (e) {
                Util.printLog('Player onCollisionEnter sendFrame err: ' + e);
            }
        }
    }
}
