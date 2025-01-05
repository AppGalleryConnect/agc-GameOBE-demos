/*
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

import configs from "./config";
import {RoomType} from "./Script/commonValue";
import {RecordInfo, RoomInfo} from "./GOBE/GOBE";

class GlobalData {
    public gameId: string = configs.gameId;
    public room: GOBE.Room = null;
    public player: GOBE.Player = null;
    public playerId: string = null;
    public client: GOBE.Client = null;
    public matchRule: string = '0'; // 匹配规则 0-菜鸟区，1-高手区
    public roomInfos: RoomInfo[] = null;
    public roomId: string = null;
    public group: GOBE.Group = null;
    public isTeamMode: boolean = false;
    public isOnlineMatch: boolean = false;
    public isWatcher: boolean = false;
    public playerName: string = "";
    public bulletId: number = 0;
    public unhandleFrames: GOBE.RecvFrameMessage[] = []; //未处理的帧
    public unProcessedServerInfo: GOBE.RecvFromServerInfo[] = []; //未处理的实时消息
    public curHandleFrameId: number = 0; // 当前处理到的帧id
    public roomType: RoomType = RoomType.NULL;    // 房间类型，区分1v1、2v2、3v1类型房间，重连时用\

    public isConnected: boolean = false; // 长链是否是连接状态，默认false
    public jumpType: number = 0; // 跳转方式 1-小队跳转 2-房间跳转

    public isGroupConnected: boolean = false; // 长链是否是连接状态，默认false

    public planeSize: number = 15;            // 飞机尺寸，圆形，半径为15像素
    public planeStepPixel: number = 20;       // 飞机每步移动像素
    public planeHp: number = 2;               // 飞机当前生命值
    public planeMaxHp: number = 2;            // 飞机最大生命值
    public bulletSize: number = 4;            // 子弹尺寸，圆形，半径为4像素
    public bulletStepPixel: number =  30;     // 子弹步长，30像素每秒
    public bulletInitOffset = 30;             // 子弹射出时与飞机的偏移量
    public bulletMaxX = 800;
    public bulletMaxY = 452;
    public bgMaxX: number = 780;              // 飞行背景x最大值
    public bgMinX: number = 20;               // 飞行背景x最小值
    public bgMaxY: number = 420;              // 飞行背景y最大值
    public bgMinY: number = 20;               // 飞行背景y最小值
    public redPlayer1StartPos = {x: 20, y: 420};    // 红色方一号玩家起始位置
    public yellowPlayer1StartPos = {x: 780, y: 20}; // 黄色方一号玩家起始位置
    public playerYStartOffset = 40;                 // 同一方飞机Y轴起始偏移量

    public clearColliderCacheInterval = 2000;       //清理碰撞缓存周期，2s
    public rollbackFrameCount = 100;           // 回退帧数量

    public isRequestFrameStatus = false;      // 当前是否为补帧状态

    // 回放相关
    public recordInfos: RecordInfo[] = [];     // 对战记录列表
    public recordPlayerIdMap = new Map();      // 回放玩家列表 key: recordId, value: playerIds
    public gameSceneType = 0;                  // 默认为空
    public recordRoomInfo = null;              // 当前回放记录的房间基本信息
}

export default new GlobalData();
