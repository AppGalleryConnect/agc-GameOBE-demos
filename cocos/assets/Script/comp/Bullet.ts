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
import {CollideTagEnum, frameSyncBulletList, FrameSyncCmd} from "../function/FrameSync";
import * as Util from "../../util";

const {ccclass, property} = cc._decorator;
/**
 * 子弹的逻辑
 */
@ccclass
export default class Bullet extends cc.Component {

    @property
    speed: number = 20;

    isDie: boolean = false;

    bullectId: number = 0;

    playerId: string = "";

    public initBullet(x = 0, y = 0, playerId, bulletId) {
        this.bullectId = bulletId;
        this.playerId = playerId;
        // 获取父组件的 宽高
        let width = this.node.parent.width;
        let height = this.node.parent.height;
        // 如果宽高超过父组件，销毁子弹
        if(x > width || x < 0 || y > height || y < 0){
            // 子弹数据销毁
            frameSyncBulletList.bullets = frameSyncBulletList.bullets.filter(item => !(item.playerId === playerId && item.bulletId === bulletId));
            return;
        }else{
            this.node.x = x;
            this.node.y = y;
        }

    }

    /**
     * 碰撞检测
     * @param other
     */
    onCollisionEnter (other, self) {
        if(other.tag == CollideTagEnum.aircraft){
            let otherTag: number = other.tag; // 碰到了谁
            let selfTag: number = self.tag; // 自己的碰撞标签
            let cmd: FrameSyncCmd = FrameSyncCmd.collide;
            let playerId: string = this.playerId;
            let bullectId: number = this.bullectId;
            const data: Object = {
                cmd, otherTag, selfTag, playerId, bullectId
            };
            let frameData: string = JSON.stringify(data);
            try{
                global.room.sendFrame(frameData);
            }
            catch (e) {
                Util.printLog('Bullet onCollisionEnter sendFrame err: ' + e);
            }
        }
    }


    start () {

    }

    // update (dt) {}
}
