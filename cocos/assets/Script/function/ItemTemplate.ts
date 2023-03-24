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

import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import Component = cc.Component;
import {RoomInfo} from "../../GOBE/GOBE";

@ccclass
export class ItemTemplate extends Component {
    @property
    public roomId: string = '';
    @property(cc.Label)
    public roomName: cc.Label | null = null;
    @property(cc.Label)
    public roomDesc: cc.Label | null = null;
    @property(cc.Label)
    public roomStatus: cc.Label | null = null;
    @property(cc.Node)
    public backGround: cc.Node | null = null;

    init(data: RoomInfo) {
        this.roomId = data.roomId;
        this.roomName.string = data.roomName.length > 20 ? data.roomName.slice(0,20) + "..." : data.roomName;
        this.roomDesc.string = data.roomId.length > 20 ? data.roomId.slice(0,20) : data.roomId;
        this.roomStatus.string = data.roomStatus==1?"游戏中":"空闲";

    }
}