/*
 * Copyright 2021. Huawei Technologies Co., Ltd. All rights reserved.
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

import configs from "./config";
import {RoomInfo} from "./GOBE/GOBE";

class GlobalData {
    public gameId: string = configs.gameId;
    public room: GOBE.Room = null;
    public state: number = null; // 帧同步状态 0停止帧同步，1开始帧同步
    public keyOperate: number = 1; // 按键操作限制 0限制操作，1允许操作
    public player: GOBE.Player = null;
    public playerId: string = null;
    public client: GOBE.Client = null;
    public matchRule: string = '0'; // 匹配规则 0-菜鸟区，1-高手区
    public roomInfos: RoomInfo[] = null;
    public roomId: number = null;
    public group: GOBE.Group = null;
    public isTeamMode: boolean = false;
    public isOnlineMatch: boolean = false;
    public playerName: string = "";
    public bulletId: number = 0;
}

export default new GlobalData();
