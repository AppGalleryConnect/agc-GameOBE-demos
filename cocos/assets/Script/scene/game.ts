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
 *  2021.12.15-Changed method initView
 *  2021.12.15-Changed method initListener
 *  2021.12.15-Changed method sendFrame
 *  2021.12.15-Changed method setRoomView
 *             Copyright(C)2021. Huawei Technologies Co., Ltd. All rights reserved
 */

import global from "../../global";
import * as Util from "../../util";
import {
    calcFrame,
    clearFrames,
    Cloud,
    cloudsList, frameSyncBulletList,
    FrameSyncCmd,
    frameSyncPlayerList,
    pushFrames,
    reCalcFrameState,
} from "../function/FrameSync";
import FrameSyncView from "../comp/FrameSyncView";
import ReopenGame from "../comp/ReopenGame";
import Dialog from "../comp/Dialog";
import Reloading from "../comp/Reloading";
import {PlayerInfo, Room} from "../../GOBE/GOBE";
import {CloudData} from "../function/CloudList";
import GameCanvas from "../comp/GameCanvas";
import config from "../../config";



const {ccclass, property} = cc._decorator;
let framesId = 0;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Label)
    gameIdLabel: cc.Label = null;

    @property(cc.Label)
    playerIdLabel: cc.Label = null;

    @property(cc.Prefab)
    reopenGamePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    reloadingPrefab: cc.Prefab = null;

    // ??????????????????
    @property(FrameSyncView)
    public frameSyncView: FrameSyncView = null;

    // ???????????????
    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;

    // ???????????????
    public randomFrame = 100;

    // ?????????????????????
    public frequency = 50;

    // ?????????????????????
    public robotIntervalTask = null;

    start() {
        this.initView();
        this.initListener();
        this.initRobotSchedule();
    }

    initView() {
        this.setRoomView();
        // ?????????
        this.frameSyncView.onUpButtonClick = () => this.sendFrame(FrameSyncCmd.up);
        this.frameSyncView.onDownButtonClick = () => this.sendFrame(FrameSyncCmd.down);
        this.frameSyncView.onLeftButtonClick = () => this.sendFrame(FrameSyncCmd.left);
        this.frameSyncView.onRightButtonClick = () => this.sendFrame(FrameSyncCmd.right);
        this.frameSyncView.onStopFrameButtonClick = () => this.stopGame();
        this.frameSyncView.onFireButtonClick = () => this.sendFireFrame();
        this.frameSyncView.setEnableButtons(global.playerId === global.room.ownerId);
        // ??????????????????????????????
        const reopenGameNode = cc.instantiate(this.reopenGamePrefab) as cc.Node;
        reopenGameNode.parent = this.node;
        // ??????dialog
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
        // ????????????Dialog
        const relaodingNode = cc.instantiate(this.reloadingPrefab) as cc.Node;
        relaodingNode.parent = this.node;
    }

    initListener() {
        // ????????????
        if (global.room) {
            global.room.onRecvFrame((frame: GOBE.RecvFrameMessage | GOBE.RecvFrameMessage[]) => {
                this.onRecvFrame(frame);
            });
            global.room.onStopFrameSync(() => this.onStopFrameSync());
            global.room.onDismiss(() => this.onDismiss());
            global.room.onLeave((playerInfo) => this.onLeave(playerInfo));
            global.room.onDisconnect((playerInfo: PlayerInfo) => this.onDisconnect(playerInfo)); // ????????????
            global.room.onJoin((playerInfo: PlayerInfo) => this.onJoin(playerInfo)); // ????????????
        }
    }

    initRobotSchedule() {
        let robotArr = global.room.players.filter(player => player.isRobot === 1);
        if (global.state === 1 &&
            global.playerId === global.room.ownerId &&
            robotArr.length > 0) {
            this.robotIntervalTask = setInterval(this.mockRobotAI,500, this, robotArr);
        }
    }

    mockRobotAI(self, robotArr) {
        robotArr.forEach(robot => self.mockRobotMove(robot.playerId));
    }

    mockRobotMove(playerId) {
        let player = frameSyncPlayerList.players.find(p => p.id === playerId);
        let res = {
            x: player.x,
            y: player.y,
            rotation: player.rotation,
            cmd: 0
        };
        // ????????????????????????????????????????????????????????????
        switch (player.rotation) {
            case 0:
                if(res.y >= 6 + Math.floor(Math.random() * 5)) {
                    res = this.selectRandomRotation([90,180,-90], res.x, res.y, res.cmd);
                }
                else {
                    res.y++;
                    res.cmd = FrameSyncCmd.up
                }
                break;
            case 180:
                if(res.y <= Math.floor(Math.random() * 6)) {
                    res = this.selectRandomRotation([90,0,-90], res.x, res.y, res.cmd);
                }
                else {
                    res.y--;
                    res.cmd = FrameSyncCmd.down
                }
                break;
            case 90:
                if(res.x <= Math.floor(Math.random() * 6)) {
                    res = this.selectRandomRotation([0,180,-90], res.x, res.y, res.cmd);
                }
                else {
                    res.x--;
                    res.cmd = FrameSyncCmd.left
                }
                break;
            case -90:
                if(res.x >= 10 + Math.floor(Math.random() * 10)) {
                    res = this.selectRandomRotation([90,180,0], res.x, res.y, res.cmd);
                }
                else {
                    res.x++;
                    res.cmd = FrameSyncCmd.right
                }
                break;
            // no default
        }
        // ???????????????????????????????????????playerId
        const data: Object = Object.assign(res, {playerId: player.id});
        let frameData: string = JSON.stringify(data);
        global.room.sendFrame(frameData);
    }

    // ????????????????????????
    selectRandomRotation(rArr, x, y, cmd) {
        let r = rArr[Math.floor(Math.random() * rArr.length)];
        switch (r) {
            case 0:
                y >= 10 ? y = 10 : y++;
                cmd = FrameSyncCmd.up;
                break;
            case 180:
                y <= 0 ? y = 0 : y--;
                cmd = FrameSyncCmd.down;
                break;
            case 90:
                x <= 0 ? x = 0 : x--;
                cmd = FrameSyncCmd.left;
                break;
            case -90:
                x >= 19 ? x = 19 : x++;
                cmd = FrameSyncCmd.right;
                break;
            // no default
        }
        return {rotation: r, x, y, cmd};
    }

    // ????????????
    stopGame() {
        global.keyOperate = 0;
        Dialog.open("??????", "????????????????????????", () => {
            Dialog.close();
            this.stopFrameSync();
        }, () => {
            global.keyOperate = 1;
            Dialog.close();
        });
    }

    // SDK ???????????????
    stopFrameSync() {
        global.room.stopFrameSync().then(() => {
            // ???????????????????????????????????????
            if (this.robotIntervalTask) {
                clearInterval(this.robotIntervalTask);
            }
            // ?????????????????????
            Util.printLog("?????????????????????");
            if (!global.isTeamMode) {
                // ??????????????????????????????????????????
                this.reopenGame();
            }
        }).catch((e) => {
            // ?????????????????????
            Util.printLog("?????????????????????");
            Dialog.open("??????", "?????????????????????" + Util.errorMessage(e));
        });
    }

    // ????????????
    reopenGame() {
        ReopenGame.open("??????", "?????????????????????????????????????????????", () => {
            global.room.update().then((room) => {
                if (this.isInRoom(room)) {
                    cc.director.loadScene("room");
                } else {
                    cc.director.loadScene("hall");
                }
            }).catch((e) => {
                cc.director.loadScene("hall");
            });
        }, () => {
            this.leaveRoom();
            cc.director.loadScene("hall");
        });
    }
    // SDK ???????????????
    sendFrame(cmd: FrameSyncCmd) {
        let playerList = frameSyncPlayerList.players;
        const playerId = global.playerId;
        let x: number = 0;
        let y: number = 0;
        let rotation: number = 0;
        playerList.forEach((p, i) => {
            if (p.id == playerId) {
                x = p.x;
                y = p.y;
                rotation = p.rotation;
                cmd === FrameSyncCmd.up && (y >= 10 ? y = 10 : y++);
                cmd === FrameSyncCmd.down && (y <= 0 ? y = 0 : y--);
                cmd === FrameSyncCmd.left && (x <= 0 ? x = 0 : x--);
                cmd === FrameSyncCmd.right && (x >= 19 ? x = 19 : x++);
                return;
            }
        });
        const data: Object = {
            cmd, x, y, rotation
        };
        let frameData: string = JSON.stringify(data);
        global.room.sendFrame(frameData);
    }

    /**
     * ?????????????????????
     */
    sendFireFrame() {
        let playerId = global.playerId;
        // ??????????????????
        let playerData = frameSyncPlayerList.players.find(p => p.id === playerId);
        let x: number = 0;
        let y: number = 0;
        let rotation: number = playerData.rotation;
        let bulletId: number = global.bulletId ++;
        // ??????????????????x???y????????????????????????????????????GameCanvas???????????????tileSize???
        let parent = cc.find('Canvas/Content/FrameSync/GameCanvas');
        const gameCanvas = parent.getComponent(GameCanvas);
        let tileSize = gameCanvas.tileSize;
        // ??????x???y????????????
        x = playerData.x * tileSize + tileSize / 2;
        y= playerData.y * tileSize + tileSize / 2;
        let divergeSize = 30; // ?????????????????????????????????????????????
        switch (playerData.rotation) {
            case 0: // ??????
                y = y + divergeSize;
                break;
            case 180: // ??????
                y = y - divergeSize;
                break;
            case 90: // ??????
                x = x - divergeSize;
                break;
            case -90: // ??????
                x = x + divergeSize;
                break;
            // no default
        }
        let cmd: FrameSyncCmd = FrameSyncCmd.fire;
        const data: Object = {
            cmd, playerId, bulletId, x, y, rotation
        };
        let frameData: string = JSON.stringify(data);
        global.room.sendFrame(frameData);
    }

    onDisable() {
        clearFrames();
        // ???????????????
        Dialog.close();
        Reloading.close();
        ReopenGame.close();
        if (global.room) {
            global.room.removeAllListeners();
        }
    }

    setRoomView() {
        const roomInfo = global.room;
        // ??????????????????
        this.gameIdLabel.string = roomInfo.roomId;
        this.playerIdLabel.string = global.playerId;
        // ????????????????????????????????????
        if (roomInfo.players.length !== frameSyncPlayerList.players.length) {
            reCalcFrameState();
        }
    }

    onDisconnect(playerInfo: PlayerInfo) {
        Util.printLog("????????????");
        if (playerInfo.playerId === global.playerId) {
            Reloading.open("?????????????????????", false);
            this.reConnect();
        }
    }

    // ??????????????????
    private getRandomCloud(currentRoomFrameId: number, seed: number) {
        if ((currentRoomFrameId >= this.randomFrame) && (currentRoomFrameId % this.frequency === 0)) {
            // ????????????????????????????????????????????????
            // @ts-ignore
            const random = new window.GOBE.RandomUtils(Math.floor(seed)).getNumber();
            let speed = Math.floor(random * 100);
            let y = Math.floor(random * 10000 - speed * 100);
            let x = Math.floor(random * 1000000 - speed * 10000 - y * 100);
            const cloud: CloudData<Cloud> = {
                x: x % 17, y: y % 5 + 5, offset: 0, speed: speed + 70
            };
            Util.printLog("seed???:" + seed + " ?????????id:" + currentRoomFrameId + " ???????????????:" +
                random + " ????????????:" + JSON.stringify(cloud));
            cloudsList.clouds.push(cloud);
            this.randomFrame += this.frequency;
        }
    }

    /**
     * ???????????????
     * @param frame
     * @private
     */
    private recvFrameHandle(frame: GOBE.RecvFrameMessage) {
        framesId = frame.currentRoomFrameId;
        if(framesId % 150 == 0){
            //?????????????????????5????????????
            let circle = cc.find('Canvas/Content/FrameSync/GameCanvas/CircleSpecial');
            if(circle.active == true){
                circle.active = false;
            }else{
                circle.active = true;
                circle.color = cc.color(237,247,7,255);
            }
        }
        // ????????????
        if(framesId % 10 == 0){
            this.updateBulletFly();
        }
        // ??????????????????
        let seed = (frame.ext) ? frame.ext.seed : null;
        this.getRandomCloud(framesId, seed);
        if (frame.frameInfo && frame.frameInfo.length > 0) {
            if (frame.frameInfo[0].playerId !== "0") {
                Util.printLog(JSON.stringify(frame.frameInfo))
                pushFrames(frame);
                calcFrame(frame);
            }
        }
    }

    /**
     * ??????????????????
     * @private
     */
    private updateBulletFly(){
        let bulletList = frameSyncBulletList.bullets;
        bulletList.forEach((bullet, i) => {
            // ?????????????????? x???y
            let x: number = 0;
            let y: number = 0;
            let speed: number = 15;
            switch (bullet.rotation) {
                case 0: // ??????
                    y = bullet.y + speed;
                    x = bullet.x;
                    break;
                case 180: // ??????
                    y = bullet.y - speed;
                    x = bullet.x;
                    break;
                case 90: // ??????
                    x = bullet.x - speed;
                    y = bullet.y;
                    break;
                case -90: // ??????
                    x = bullet.x + speed;
                    y = bullet.y;
                    break;
                // no default
            }
            bullet.x = x;
            bullet.y = y;
        });

    }
    // ====================SDK??????====================
    onRecvFrame(frame: GOBE.RecvFrameMessage | GOBE.RecvFrameMessage[]) {
        // ????????????????????????????????????????????????,???????????????,???????????????
        global.unhandleFrames = global.unhandleFrames.concat(frame);
    }

    /**
     * ?????????????????????????????????????????????60??????
     */
    update() {
        if(global.unhandleFrames.length > 0){
            if(global.unhandleFrames.length > 1){  // ???????????????????????????1,????????????
                for (let i = 0; i < config.handleFrameRate; i++) {
                    if(global.unhandleFrames[0]){
                        this.recvFrameHandle(global.unhandleFrames[0]);
                        global.unhandleFrames.shift();
                    }
                }
            }else{  // ????????????
                this.recvFrameHandle(global.unhandleFrames[0]);
                global.unhandleFrames.shift();
            }
        }
    }

    onStopFrameSync() {
        Util.printLog("SDK??????--???????????????");
        this.unready();
        // ???????????????
        global.unhandleFrames = [];
        frameSyncBulletList.bullets = [];
        if (!global.isTeamMode) {
            this.reopenGame();
        } else {
            this.leaveRoom();
            if (global.isOnlineMatch) {
                // ????????????
                global.isOnlineMatch = false;
                cc.director.loadScene("hall");
            } else {
                // ????????????
                cc.director.loadScene("team");
            }
        }
    }

    onDismiss() {
        Util.printLog("SDK??????--????????????");
        cc.director.loadScene("hall");
    }

    onLeave(playerInfo: PlayerInfo) {
        Util.printLog("SDK??????--????????????");
        if (global.isTeamMode) {
            // ????????????????????????????????????
            this.reCalPlayers(playerInfo);
        } else {
            cc.director.loadScene("room");
        }
    }

    private unready() {
        global.state = 0;
        global.player.updateCustomStatus(0).then(() => {
            Util.printLog("?????????????????????????????????");
        }).catch((e) => {
            // ?????????????????????????????????
            Util.printLog("??????????????????");
        });
    }

    private leaveRoom() {
        Util.printLog(`??????????????????`);
        global.client.leaveRoom().then(() => {
            // ??????????????????
            Util.printLog("??????????????????");
        }).catch((e) => {
            // ??????????????????
            Dialog.open("??????", "??????????????????" + Util.errorMessage(e));
        });
    }

    /*
     * ????????????????????????????????????
     * playerInfo ????????????????????????
     */
    private reCalPlayers(playerInfo: PlayerInfo) {
        let players = [];
        frameSyncPlayerList.players.forEach(function (player) {
            if (player.id != playerInfo.playerId) {
                players.push(player);
            }
        });
        frameSyncPlayerList.players = players;
    }

    onJoin(playerInfo: PlayerInfo) {
        Util.printLog("????????????");
        if (playerInfo.playerId === global.playerId) {
            Util.printLog("??????????????????id:" + playerInfo.playerId);
            global.room.update().then((room) => {
                let isInRoom = this.isInRoom(room);
                if (isInRoom) {
                    Reloading.close();
                } else {
                    cc.director.loadScene("hall");
                }
            }).catch((e) => {
                cc.director.loadScene("hall");
            });
        }
    }

    reConnect() {
        if (global.isTeamMode) {
            cc.director.loadScene("hall");
        } else {
            // ????????????????????????????????????????????????
            global.room.reconnect().then(() => {
                Util.printLog("??????????????????");
            }).catch((error) => {
                if (!error.code) {
                    // ???????????????????????????????????????
                    this.reConnect();
                    return;
                }
                if (error.code != 0) {
                    // ???????????????????????????????????????
                    this.reLogin();
                    cc.director.loadScene("hall");
                }
            });
        }
    }

    isInRoom(room: Room): boolean {
        const players: PlayerInfo[] = room.players;
        if (players) {
            for (let i = 0; i < players.length; ++i) {
                if (players[i].playerId === global.playerId) {
                    return true;
                }
            }
        }
        return false
    }

    reLogin() {
        global.client.init();
    }

}
