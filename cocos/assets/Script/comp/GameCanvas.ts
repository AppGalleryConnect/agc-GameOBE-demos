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
 *  2023.06.28-Changed method getFromPlayersPool
 *  2023.06.28-Deleted method initBullectPool
 *  2023.06.28-Deleted method getFromBullectPool
 *  2023.06.28-Changed method start
 *  2023.06.28-Changed method setClouds
 *  2023.06.28-Changed method setPlayers
 *  2023.06.28-Changed method setBullet
 *  2023.06.28-Add method destroyBullet
 *             Copyright(C)2023. Huawei Technologies Co., Ltd. All rights reserved
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
import {
    destroyedBulletSet,
    frameSyncPlayerInitList
} from "../function/FrameSync";
import global from "../../global";

const {ccclass, property} = cc._decorator;
let playersPool: cc.NodePool = null;
let cloudsPool: cc.NodePool = null;
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
    /*let player;
    if (playersPool.size() > 0) {
        player = playersPool.get();
    } else {
        player = cc.instantiate(playerPrefab);
    }

    return player;*/
    let player = cc.instantiate(playerPrefab);
    return player;
}

function getFromCloudsPool(cloudPrefab: cc.Prefab) {
    let cloud;
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

@ccclass
export default class GameCanvas extends cc.Component {

    @property(cc.Prefab)
    playerPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    cloudPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    circlePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;

    public players: cc.Node[] = [];
    public clouds: Cloud[] = [];
    public tileSize = 40;
    public cloudSize = 36;
    public maxX = 19; // x轴最大值

    start() {
        initPlayersPool(this.playerPrefab);
        cc.director.getCollisionManager().enabled = true;
    }

    setClouds(clouds: CloudData[], dt) {
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

    setPlayers(playerArr: PlayerData[]) {
        if (!Array.isArray(playerArr)) {
            playerArr = [];
        }
        this.players.splice(playerArr.length).forEach(player => removeToPlayerPool(player));
        for (let i = this.players.length; i < playerArr.length; i++) {
            this.players.push(getFromPlayersPool(this.playerPrefab));
        }
        playerArr.forEach((player, i) => {
            if (this.players[i]){
                const playerView = this.players[i].getComponent(Player);
                playerView.node.parent = this.node;
                if(player.hp == 0 && player.isShoot) {
                    let tempPlayer = frameSyncPlayerInitList.players.find(p => p.playerId == player.playerId);
                    player.hp = global.planeMaxHp;
                    player.x = tempPlayer.x;
                    player.y = tempPlayer.y;
                }
                playerView.initPlayer(player);
            }
        });
    }

    setBullet(bulletData: BulletData) {
        let bullet = this.node.getChildByName(bulletData.bulletId.toString());
        if(bullet) {
            console.log('---------移动子弹------');
            let bulletView = bullet.getComponent(Bullet);
            bulletView.updatePos(bulletData);
        } else {
            // 若为刚销毁的子弹，说明已经发生过碰撞，无需再创建了
            if(!destroyedBulletSet.has(bulletData.bulletId)) {
                console.log('---------创建子弹------');
                bullet = cc.instantiate(this.bulletPrefab);
                bullet.parent = this.node;
                let bulletView = bullet.getComponent(Bullet);
                bulletView.initBullet(bulletData);
            }
        }
    }

    destroyBullet(bulletId: string) {
        let bullet = this.node.getChildByName(bulletId);
        if(bullet) {
            let bulletView = bullet.getComponent(Bullet);
            bulletView.destroyBullet();
        }
    }

    convertPosition(mapX: number, mapY: number) {
        const x = mapX * this.tileSize + this.tileSize / 2;
        const y = mapY * this.tileSize + this.tileSize / 2;
        return {x, y};
    }

}
