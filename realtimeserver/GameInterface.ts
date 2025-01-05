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

export interface GameBasicInfo {
    planeSize: number;
    planeHp: number;
    bulletSize: number;
    bulletSpeed: number;
}

/**
 * 本地游戏信息 飞机
 */
export interface Plane {
    playerId: string;           //玩家id
    x: number;                  //飞机座标x
    y: number;                  //飞机座标y
    direction: number;          // 0-上，1-左，2-下，3-右
    hp: number;                 // 2-满血，1-半血，0-死亡
    bullets: Map<string, Bullet>;
}

export interface Bullet {

    id: string;
    x: number;
    y: number;
    direction: number;   // 1-上，2-下，3-左，4-右
}

/**
 * 飞机初始化信息
 */
export interface PlaneInitInfo {
    playerId: string;
    position: {
        x: number;
        y: number;
    }
    direction: Direction;
}

/**
 * 游戏结算
 */
export interface GameEndInfo {
    count: number;
    value: string;
    isSend: boolean;
}

/**
 * 上行消息 游戏初始化信息 type=’initGame‘
 */
export interface GameInitInfo {
    type: string;
    planeSize: number;
    planeHp: number;
    bulletSize: number;
    bulletSpeed: number;
    playerArr: PlaneInitInfo[];
}

/**
 * 指令类型 枚举
 */
export const enum CmdType {
    planeFly = 0,               // 飞机飞行
    bulletFly = 1,              // 子弹飞行
    bulletDestroy = 2           // 子弹销毁
}

/**
 * 飞行方向 枚举
 */
export const enum Direction {
    up = 0,
    down = 180,
    left = 90,
    right = -90
}

/**
 * 上行消息 游戏指令
 */
export interface GameCmdInfo {
    cmd: CmdType;               // 指令类型
    playerId: string;           // 玩家id
    bulletId?: string;          // 子弹id
    x?: number;                 // x座标
    y?: number;                 // y座标
    direction?: Direction;      // 飞行方向
    hp?: number;                 // 飞机血量
}


// 以下为下行消息
export interface GameData {
    type: string;           //'Collide'
    playerId: string;
    bulletId: string;
    hp: number;
}

export interface GameInfo {
    playerId : string;
    planePos: {
        x: number;
        y: number;
    }
    planeDir: Direction;
    planeHp: number;
    isShoot: boolean;
    bulletArray: BulletInfo[];
}

export interface BulletInfo {
    bulletId: string;
    bulletPos: {
        x: number;
        y: number;
    }
    needDestroy: boolean;
}