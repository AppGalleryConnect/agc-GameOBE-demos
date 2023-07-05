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

import {
    Bullet,
    Direction,
    GameBasicInfo,
    GameCmdInfo,
    GameData, GameEndInfo,
    GameInitInfo,
    Plane,
    PlaneInitInfo
} from "./GameInterface";
import GOBERTS from "./GOBERTS";

export class Game {
    planeInfo: Map<string, Plane>;     //playerId 为key

    gameBasicInfo: GameBasicInfo;

    #roomId: string;

    logger: any;
    gameEnd: GameEndInfo;
    #frameClock: any = null;

    #frameInterval: number;

    #direction = [[0, 1], [-1, 0], [0, -1], [1, 0]];

    public constructor(initInfo: GameInitInfo, logger: any, frameInterval: number, roomId: string) {
        this.gameBasicInfo = {
            planeSize: initInfo.planeSize,
            planeHp: initInfo.planeHp,
            bulletSize: initInfo.bulletSize,
            bulletSpeed: initInfo.bulletSpeed,
        };
        this.planeInfo = new Map<string, Plane>();
        this.logger = logger;
        this.#frameInterval = frameInterval;
        this.#roomId = roomId;
        this.gameEnd = {
            count: 0,
            value: '',
            isSend: false
        }
    }

    /**
     * 初始化飞机
     */
    public initPlane(planeInitInfo: PlaneInitInfo) {
        let plane: Plane = {
            playerId: planeInitInfo.playerId,
            x: planeInitInfo.position.x,
            y: planeInitInfo.position.y,
            direction: this.transferDir(planeInitInfo.direction),
            hp: this.gameBasicInfo.planeHp,
            bullets: new Map<string, Bullet>(),
        }
        this.planeInfo.set(planeInitInfo.playerId, plane);
    }

    /**
     * 更新飞机信息
     * @param gameCmdInfo 飞机信息 包含playerId，x，y，direction，hp
     */
    public updatePlane(gameCmdInfo: GameCmdInfo) {
        let plane = this.planeInfo.get(gameCmdInfo.playerId);
        if (plane === undefined) {
            this.logger.warn('updatePlane, playerId:' + gameCmdInfo.playerId + 'not exist');
            return;
        }
        // @ts-ignore
        plane.x = gameCmdInfo.x;
        // @ts-ignore
        plane.y = gameCmdInfo.y;
        // @ts-ignore
        plane.hp = gameCmdInfo.hp;
    }

    /**
     * 更新子弹信息
     * @param gameCmdInfo 子弹信息 包含playerId，bulletId，x，y，direction
     */
    public updateBullet(gameCmdInfo: GameCmdInfo) {
        let plane = this.planeInfo.get(gameCmdInfo.playerId);
        if (plane === undefined) {
            this.logger.warn('updateBullet, playerId:' + gameCmdInfo.playerId + 'not exist');
            return;
        }
        // @ts-ignore
        let bullet = plane.bullets.get(gameCmdInfo.bulletId);
        if (bullet === undefined) {
            const newBullet: Bullet = {
                // @ts-ignore
                id: gameCmdInfo.bulletId,
                // @ts-ignore
                x: gameCmdInfo.x,
                // @ts-ignore
                y: gameCmdInfo.y,
                // @ts-ignore
                direction: this.transferDir(gameCmdInfo.direction),
            }
            // @ts-ignore
            plane.bullets.set(gameCmdInfo.bulletId, newBullet);
        } else {
            // @ts-ignore
            bullet.x = gameCmdInfo.x;
            // @ts-ignore
            bullet.y = gameCmdInfo.y;
        }

    }

    /**
     * 销毁子弹
     * @param gameCmdInfo 销毁信息 包含playerId和bulletId
     */
    public destroyBullet(gameCmdInfo: GameCmdInfo) {
        let plane = this.planeInfo.get(gameCmdInfo.playerId);
        if (plane === undefined) {
            this.logger.warn('destroyBullet, playerId:' + gameCmdInfo.playerId + 'not exist');
            return;
        }
        // @ts-ignore
        plane.bullets.delete(gameCmdInfo.bulletId);
    }

    /**
     * 方向映射
     * @param direction 枚举值
     * @private 方向数组index
     */
    private transferDir(direction: Direction) : number {
        return ((direction + 360) % 360) / 90;
    }

    /**
     * 碰撞检测
     * @param planeA
     * @param args
     */
    public collided(planeA: Plane, args: GOBERTS.ActionArgs){
        this.planeInfo.forEach((planeB) => {
            if (planeA === planeB) return true;
            // 飞机A和飞机B的子弹碰撞检测
            planeB.bullets.forEach((bullet)=> {
                let distance = Math.sqrt(Math.pow(bullet.x - planeA.x, 2) + Math.pow(bullet.y - planeA.y, 2));
                if (distance <= this.gameBasicInfo.planeSize + this.gameBasicInfo.bulletSize) {
                    planeA.hp = Math.max(1, planeA.hp) - 1;
                    planeB.bullets.delete(bullet.id);
                    let gameData: GameData = {type: 'Collide', playerId: planeA.playerId, bulletId: bullet.id, hp: planeA.hp};
                    args.SDK.sendData(JSON.stringify(gameData)).then().catch(err => {
                        args.SDK.log.error('send Collide fail, roomId:' + this.#roomId + 'err:' + err);
                    });
                    return true;
                }
            })
        })
    }

    public startFrameClock(args: GOBERTS.ActionArgs) {
        if (this.#frameClock !== null) return;
        this.#frameClock = setInterval(() => {
            this.planeInfo.forEach((plane) => {
                // 碰撞检测
                this.collided(plane, args);
            });
        }, this.#frameInterval);
    }

    public stopFrameClock() {
        clearInterval(this.#frameClock);
        this.#frameClock = null;
    }
}