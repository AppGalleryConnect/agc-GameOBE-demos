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
 *  2021.12.15-Changed enum FrameSyncCmd
 *  2021.12.15-Changed method setDefaultFrameState
 *  2021.12.15-Changed method setPlayerCMD
 *  2021.12.15-Changed method calcFrame
 *             Copyright(C)2021. Huawei Technologies Co., Ltd. All rights reserved
 */

import {PlayerList, PlayerData} from "./PlayerList";
import global from "../../global";
import {CloudList} from "./CloudList";
import {BulletData, BulletList} from "./BulletList";
import Circle from "../comp/Circle";

let frames: GOBE.ServerFrameMessage[] = [];

export enum FrameSyncCmd {
    up = 1,
    down = 2,
    left = 3,
    right = 4,
    fire = 5,
    collide = 7, // 碰撞指令
}
// 碰撞体tag(要和组件中属性保持一致.因为不知道如何重组件中获取.所以在这里定义)
export enum CollideTagEnum {
    bullet = 0,
    circle = 1,
    aircraft = 2,
}

export enum Team {
    red = "0",
    yellow = "1"
}

export interface Player {
    cmd: FrameSyncCmd,
    dir: 1 | -1,
    lastUpdateFrameId: number,
}

export interface Cloud {
    x: 0,
    y: 0,
    offset: 0,
    speed: 0;
}

export interface Bullet {
    playerId: "",
    bulletId: 0,
    x: 0,
    y: 0,
    rotation: 0,
}
export const frameSyncBulletList: BulletList<Bullet> = {
    bullets: []
};

export const cloudsList: CloudList<Cloud> = {
    clouds: []
};

export const frameSyncPlayerList: PlayerList<Player> = {
    players: []
};


// 记录玩家初始化的位置，以便飞机被子弹击中后回到初始化位置
export const frameSyncPlayerInitList: PlayerList<Player> = {
    players: []
};

export function clearFrames() {
    frames = [];
}

export function pushFrames(frame: GOBE.ServerFrameMessage) {
    frames.push(frame);
}

export function requestFrame(framesId: number) {
    let beginFrameId = frames.length === 0 ? 0 : frames[frames.length - 1].currentRoomFrameId;
    let requestFrameSize = framesId - beginFrameId;
    // 如果请求超过1000帧，就每1000帧去补帧
    if (requestFrameSize > 1000) {
        let count = Math.floor(requestFrameSize / 1000);
        for (let i = 0; i < count; i++) {
            cc.log("补帧beginFrameId:" + beginFrameId + ",1000");
            global.room.requestFrame(beginFrameId, 1000);
            beginFrameId = beginFrameId + 1000;
        }
        if (framesId - beginFrameId > 0) {
            cc.log("补尾部的帧beginFrameId:" + beginFrameId + "," + (framesId - beginFrameId));
            global.room.requestFrame(beginFrameId, framesId - beginFrameId);
        }
    } else {
        cc.log("请求补帧beginFrameId:" + beginFrameId + "," + "requestFrameSize:" + requestFrameSize);
        global.room.requestFrame(beginFrameId, requestFrameSize);
    }
}

export function reCalcFrameState() {
    setDefaultFrameState();
    frames.forEach(frame => {
        calcFrame(frame);
    });
}

function initPlayer(x: number, y: number, playerId: string, rotation: number, cmd: FrameSyncCmd, playerTeamId: string) {
    const player: PlayerData<Player> = {
        x: x, y: y, id: playerId, rotation: rotation, playerTeamId: playerTeamId,
        state: {
            cmd: cmd,
            dir: 1,
            lastUpdateFrameId: 1
        },
    };
    frameSyncPlayerList.players.push(player);
    frameSyncPlayerInitList.players.push(player);
}

function roomMatch(redTeamId: any, roomInfo) {
    // 房间匹配
    roomInfo.players.forEach((p, i) => {
        if (roomInfo.ownerId != p.playerId) {
            // 如果不是房主
            initPlayer(19, 0, p.playerId, 90, FrameSyncCmd.left, null);
        } else {
            // 如果是房主
            initPlayer(0, 10, roomInfo.ownerId, -90, FrameSyncCmd.right, null);
        }
    });
}

function teamMatch(redTeamId: any, roomInfo) {
    // 组队匹配
    let yellowYCoordinates = 0;
    let redYCoordinates = 10;
    roomInfo.players.forEach((p, i) => {
        if (redTeamId === p.teamId) {
            // 红队
            initPlayer(0, redYCoordinates, p.playerId, -90, FrameSyncCmd.right, Team.red);
            redYCoordinates--;
        } else {
            // 黄队
            initPlayer(19, yellowYCoordinates, p.playerId, 90, FrameSyncCmd.left, Team.yellow);
            yellowYCoordinates++;
        }
    });
}

function getRedTeamId(roomInfo) {
    let redTeamId = null;
    roomInfo.players.forEach((p, i) => {
        if (roomInfo.ownerId === p.playerId) {
            // 如果是房主
            redTeamId = p.teamId;
            return;
        }
    });
    return redTeamId;
}

export function setDefaultFrameState() {
    const roomInfo = global.room;
    frameSyncPlayerList.players = [];
    let redTeamId = getRedTeamId(roomInfo);
    if (redTeamId === undefined || redTeamId === null) {
        global.isTeamMode = false;
        roomMatch(redTeamId, roomInfo);
    }
    if (redTeamId !== undefined && redTeamId !== null) {
        global.isTeamMode = true;
        teamMatch(redTeamId, roomInfo);
    }
}

function setPlayerCMD(id: string, cmd: FrameSyncCmd, x: number, y: number) {
    const player = frameSyncPlayerList.players.find(p => p.id === id) || {state: {}} as PlayerData<Player>;
    player.state.cmd = cmd;
    player.x = x;
    player.y = y;
    cmd === FrameSyncCmd.up && (player.rotation = 0);
    cmd === FrameSyncCmd.down && (player.rotation = 180);
    cmd === FrameSyncCmd.left && (player.rotation = 90);
    cmd === FrameSyncCmd.right && (player.rotation = -90);

}

/**
 * 创建子弹数据
 * @param obj
 */
function createBulletData(obj) {
    const bullet: BulletData<Bullet> = {
        playerId: obj["playerId"],
        bulletId: obj["bulletId"],
        x: obj["x"],
        y: obj["y"],
        rotation: obj["rotation"],
    };
    frameSyncBulletList.bullets.push(bullet);
}



function handleCollide(obj) {
    // 圆圈和飞机的碰撞
    if(obj["otherTag"] === CollideTagEnum.aircraft && obj["selfTag"] === CollideTagEnum.circle){
        let circle = cc.find('Canvas/Content/FrameSync/GameCanvas/CircleSpecial');
        const circleTs = circle.getComponent(Circle);
        circleTs.changeColor();
    }
    // 子弹碰撞飞机(飞机发出的指令) - 飞机回到原点
    if (obj["selfTag"] === CollideTagEnum.aircraft && obj["otherTag"] === CollideTagEnum.bullet){
        const playerInit = frameSyncPlayerInitList.players.find(p => p.id === obj["playerId"]) || {state: {}} as PlayerData<Player>;
        const player = frameSyncPlayerList.players.find(p => p.id === obj["playerId"]) || {state: {}} as PlayerData<Player>;
        player.x = playerInit.x;
        player.y = playerInit.y;
    }
    // 子弹碰撞飞机(子弹发出的指令) - 子弹销毁
    if (obj["selfTag"] === CollideTagEnum.bullet && obj["otherTag"] === CollideTagEnum.aircraft){
        frameSyncBulletList.bullets = frameSyncBulletList.bullets.filter(item => !(item.playerId === obj["playerId"]
            && item.bulletId === obj["bulletId"]));
    }
}


export function calcFrame(frame: GOBE.ServerFrameMessage) {
    if (frame.currentRoomFrameId === 1) {
        setDefaultFrameState();
    }
    if (frame.frameInfo && frame.frameInfo.length > 0) {
        frame.frameInfo.forEach(frameItem => {
            let frameData: string[] = frameItem.data;
            if (frameData && frameData.length > 0) {
                frameData.forEach(data => {
                    let obj = JSON.parse(data);
                    switch (obj["cmd"]) {
                        case FrameSyncCmd.fire:
                            createBulletData(obj);
                            break;
                        case FrameSyncCmd.collide:
                            handleCollide(obj);
                            break;
                        default:
                            if(obj["playerId"]) {
                                setPlayerCMD(obj["playerId"], obj["cmd"], obj["x"], obj["y"]);
                            } else {
                                setPlayerCMD(frameItem.playerId, obj["cmd"], obj["x"], obj["y"]);
                            }
                    }
                });
            }
        });
    }
}
