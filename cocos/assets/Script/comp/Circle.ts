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
import {CollideTagEnum, FrameSyncCmd} from "../function/FrameSync";
import * as Util from "../../util";

const {ccclass, property} = cc._decorator;
/**
 * 圆圈的逻辑
 */
@ccclass
export default class Circle extends cc.Component {

    // LIFE-CYCLE CALLBACKS:
    update (dt) {

    }

    /**
     * 碰撞检测
     * @param other
     */
    onCollisionEnter (other, self) {
        if(other.tag == CollideTagEnum.aircraft){
            cc.log("飞机碰撞了圆圈");
            // 飞机碰撞了圆圈,圆圈变色.构建圆圈变色指令(x,y color )
            let otherTag: number = other.tag; // 碰到了谁
            let selfTag: number = self.tag; // 自己的碰撞标签
            let cmd: FrameSyncCmd = FrameSyncCmd.collide;
            const data: Object = {
                cmd, otherTag, selfTag
            };
            let frameData: string = JSON.stringify(data);
            try{
                global.room.sendFrame(frameData);
            }
            catch (e) {
                Util.printLog('Circle onCollisionEnter sendFrame err: ' + e);
            }
        }
    }

    /***
     * 飞机碰撞到圆圈后,圆圈变色
     */
    changeColor() {
        this.node.color = cc.color(238,8,11,255);
    }

    start () {

    }

}
