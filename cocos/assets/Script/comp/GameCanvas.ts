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
 *  2021.12.15-Changed method initPlayersPool
 *  2021.12.15-Changed method setPlayers
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
import {PlayerData} from "../function/PlayerList";
import Player from "./Player";
import Cloud from "./Cloud";
import {CloudData} from "../function/CloudList";
import {BulletData} from "../function/BulletList";
import Bullet from "./Bullet";

const {ccclass, property} = cc._decorator;
let playersPool: cc.NodePool = null;
let cloudsPool: cc.NodePool = null;
let bullectsPool: cc.NodePool = null;
// 初始化对象池
function initPlayersPool(playerPrefab: cc.Prefab) {
    if (playersPool) {
        return;
    }
    playersPool = new cc.NodePool();
    let player = cc.instantiate(playerPrefab);
    playersPool.put(player);
}

function getFromPlayersPool(playerPrefab: cc.Prefab) {
    let player = null;
    if (playersPool.size() > 0) {
        player = playersPool.get();
    } else {
        player = cc.instantiate(playerPrefab);
    }

    return player;
}

function getFromCloudsPool(cloudPrefab: cc.Prefab) {
    let cloud = null;
    if (cloudsPool != null && cloudsPool.size() > 0) {
        cloud = cloudsPool.get();
    } else {
        cloud = cc.instantiate(cloudPrefab);
    }
    return cloud;
}

function removeToPlayerPool(player) {
    playersPool.put(player);
}

// 初始化对象池
function initBullectPool(bullectPrefab: cc.Prefab) {
    if (bullectsPool) {
        return;
    }
    bullectsPool = new cc.NodePool();
    let bullect = cc.instantiate(bullectPrefab);
    bullectsPool.put(bullect);
}

function getFromBullectPool(bullectPrefab: cc.Prefab) {
    let bullect = null;
    if (bullectsPool.size() > 0) {
        bullect = bullectsPool.get();
    } else {
        bullect = cc.instantiate(bullectPrefab);
    }
    return bullect;
}
function removeToBulletPool(bullet) {
    bullectsPool.put(bullet);
}

@ccclass
export default class GameCanvas extends cc.Component {

    @property(cc.Prefab)
    playerPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    cloudPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    circlePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    bullectPrefab: cc.Prefab = null;

    public players: Player[] = [];
    public clouds: Cloud[] = [];
    public bullets: Bullet[] = [];
    public tileSize = 40;
    public cloudSize = 36;
    public maxX = 19; // x轴最大值

    start() {
        initPlayersPool(this.playerPrefab);
        initBullectPool(this.bullectPrefab);
        cc.director.getCollisionManager().enabled = true;
    }

    setClouds(clouds: CloudData<any>[], dt) {
        if (!Array.isArray(clouds)) {
            clouds = [];
        }
        if (clouds && clouds.length > 0) {
            for (let i = this.clouds.length; i < clouds.length; i++) {
                this.clouds.push(getFromCloudsPool(this.cloudPrefab));
            }
            let cloudNum = clouds.length - 5;
            clouds.forEach((cloud, i) => {
                const cloudView = this.clouds[i].getComponent(Cloud);
                if (i > cloudNum) {
                    const {x, y} = this.convertPosition(cloud.x, cloud.y);
                    cloudView.node.parent = this.node;
                    if (x + cloud.offset >= (this.maxX * this.tileSize + this.cloudSize / 2)) {
                        // 销毁节点
                        cloudView.node.parent = null;
                    } else {
                        cloud.offset += cloud.speed * dt;
                        cloudView.initCloud(x + cloud.offset, y);
                    }
                } else {
                    // 销毁节点
                    cloudView.node.parent = null;
                }
            });
        }

    }

    setPlayers(playerData: PlayerData<any>[]) {
        if (!Array.isArray(playerData)) {
            playerData = [];
        }
        this.players.splice(playerData.length).forEach(player => removeToPlayerPool(player));
        for (let i = this.players.length; i < playerData.length; i++) {
            this.players.push(getFromPlayersPool(this.playerPrefab));
        }
        playerData.forEach((playerData, i) => {
            if (this.players[i]){
                const playerView = this.players[i].getComponent(Player);
                const {x, y} = this.convertPosition(playerData.x, playerData.y);
                playerView.node.parent = this.node;
                playerView.initPlayer(playerData.id, playerData.rotation, x, y, playerData.playerTeamId);
            }
        });
    }

    setBullets(bulletData: BulletData<any>[]) {
        if (!Array.isArray(bulletData)) {
            bulletData = [];
        }
        this.bullets.splice(bulletData.length).forEach(player => removeToBulletPool(player));
        for (let i = this.bullets.length; i < bulletData.length; i++) {
            this.bullets.push(getFromBullectPool(this.bullectPrefab));
        }
        bulletData.forEach((bulletData, i) => {
            if (this.bullets[i]){
                const bulletView = this.bullets[i].getComponent(Bullet);
                bulletView.node.parent = this.node;
                bulletView.initBullet(bulletData.x, bulletData.y, bulletData.playerId, bulletData.bulletId);
            }
        });
    }

    convertPosition(mapX: number, mapY: number) {
        const x = mapX * this.tileSize + this.tileSize / 2;
        const y = mapY * this.tileSize + this.tileSize / 2;
        return {x, y};
    }

}
