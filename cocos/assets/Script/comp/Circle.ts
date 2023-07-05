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
const {ccclass} = cc._decorator;
/**
 * 圆圈的逻辑
 */
@ccclass
export default class Circle extends cc.Component {
    /***
     * 飞机碰撞到圆圈后,圆圈变色
     */
    changeColor() {
        this.node.color = cc.color(238,8,11,255);
    }
}
