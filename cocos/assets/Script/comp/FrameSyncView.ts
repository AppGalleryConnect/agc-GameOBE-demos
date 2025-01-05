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
 *  2021.12.15-Changed method setEnableButtons
 *  2021.12.15-Changed method onKeyDown
 *  2023.03.21-Add method setWatcherButtons
 *  2023.03.21-Changed method start
 *  2023.03.21-Add method onLeaveButtonClickCallback
 *  2023.06.28-Changed method start
 *  2023.06.28-Add method setButtons
 *  2023.06.28-Add method onQuitButtonClick
 *  2023.06.28-Add method onQuitButtonClickCallback
 *  2023.06.28-Add method calcFrame
 *  2023.06.28-Add method processServerInfo
 *  2023.06.28-Add method reCalcFrameState
 *  2023.06.28-Add method updateBullet
 *             Copyright(C)2024. Huawei Technologies Co., Ltd. All rights reserved
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

import GameCanvas from "../comp/GameCanvas";
import {
    cloudsList,
    CmdType,
    colliderEventMap,
    destroyedBulletSet,
    frames,
    frameSyncPlayerList,
    GameSceneType,
    setDefaultFrameState,
    updatePlayerData
} from "../function/FrameSync";
import global from "../../global";
import {BulletData} from "../function/BulletList";

const {ccclass, property} = cc._decorator;

@ccclass
export default class FrameSyncView extends cc.Component {

    @property(cc.Button)
    stopFrameButton: cc.Button = null;

    @property(cc.Button)
    upButton: cc.Button = null;

    @property(cc.Button)
    downButton: cc.Button = null;

    @property(cc.Button)
    leftButton: cc.Button = null;

    @property(cc.Button)
    rightButton: cc.Button = null;

    @property(cc.Button)
    fireButton: cc.Button = null;

    @property(cc.Button)
    leaveButton: cc.Button = null;

    @property(cc.Button)
    quitButton: cc.Button = null;

    @property(GameCanvas)
    gameCanvas: GameCanvas = null;

    public onStopFrameButtonClick: () => any = null;
    public onUpButtonClick: () => any = null;
    public onDownButtonClick: () => any = null;
    public onLeftButtonClick: () => any = null;
    public onRightButtonClick: () => any = null;
    public onFireButtonClick: () => any = null;
    public onLeaveButtonClick: () => any = null;
    public onQuitButtonClick: () => any = null;

    setEnableButtons(isEnabled: boolean) {
        this.stopFrameButton.node.opacity = isEnabled ? 255 : 0;
        this.stopFrameButton.node.active = isEnabled;
    }

    setWatcherButtons(isEnabled: boolean) {
        this.upButton.node.opacity = isEnabled ? 255 : 0;
        this.upButton.node.active = isEnabled;
        this.downButton.node.opacity = isEnabled ? 255 : 0;
        this.downButton.node.active = isEnabled;
        this.leftButton.node.opacity = isEnabled ? 255 : 0;
        this.leftButton.node.active = isEnabled;
        this.rightButton.node.opacity = isEnabled ? 255 : 0;
        this.rightButton.node.active = isEnabled;
        this.fireButton.node.opacity = isEnabled ? 255 : 0;
        this.fireButton.node.active = isEnabled;
        this.leaveButton.node.opacity = isEnabled ? 0 : 255;
        this.leaveButton.node.active = !isEnabled;
        this.quitButton.node.opacity = isEnabled ? 0 : 255;
        this.quitButton.node.active = !isEnabled;
    }

    setButtons(type: GameSceneType, isOwner = false) {
        this.upButton.node.active = type == GameSceneType.FOR_GAME;
        this.downButton.node.active = type == GameSceneType.FOR_GAME;
        this.leftButton.node.active = type == GameSceneType.FOR_GAME;
        this.rightButton.node.active = type == GameSceneType.FOR_GAME;
        this.fireButton.node.active = type == GameSceneType.FOR_GAME;
        this.stopFrameButton.node.active = type == GameSceneType.FOR_GAME && isOwner;
        this.leaveButton.node.active = type == GameSceneType.FOR_WATCHER;
        this.quitButton.node.active = type == GameSceneType.FOR_RECORD;
    }

    start() {
        switch (global.gameSceneType) {
            case GameSceneType.FOR_RECORD:
                this.quitButton.node.on(cc.Node.EventType.TOUCH_START, this.onQuitButtonClickCallback, this);
                break;
            case GameSceneType.FOR_WATCHER:
                this.leaveButton.node.on(cc.Node.EventType.TOUCH_START, this.onLeaveButtonClickCallback, this);
                break;
            case GameSceneType.FOR_GAME:
                // 绘制玩家
                this.gameCanvas.setPlayers(frameSyncPlayerList.players);
                // 停止帧同步按钮监听
                this.stopFrameButton.node.on(cc.Node.EventType.TOUCH_START, this.onStopFrameButtonClickCallback, this);
                // 攻击按钮监听
                this.fireButton.node.on(cc.Node.EventType.TOUCH_START, this.onFireButtonClickCallback, this);
                // 上下左右按钮按下监听
                this.upButton.node.on(cc.Node.EventType.TOUCH_START, this.onUpButtonTouchStart, this);
                this.downButton.node.on(cc.Node.EventType.TOUCH_START, this.onDownButtonTouchStart, this);
                this.leftButton.node.on(cc.Node.EventType.TOUCH_START, this.onLeftButtonTouchStart, this);
                this.rightButton.node.on(cc.Node.EventType.TOUCH_START, this.onRightButtonTouchStart, this);
                // 键盘上下左右按钮，按下抬起事件监听
                cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
                break;
                // no default
        }
        this.reCalcFrameState();
    }

    update(dt) {
        // 绘制玩家
        this.gameCanvas.setPlayers(frameSyncPlayerList.players);
        // 绘制小云朵
        this.gameCanvas.setClouds(cloudsList.clouds, dt);
    }

    onStopFrameButtonClickCallback() {
        this.stopFrameButton.interactable && this.onStopFrameButtonClick && this.onStopFrameButtonClick();
    }

    onLeaveButtonClickCallback() {
        this.leaveButton.interactable && this.onLeaveButtonClick && this.onLeaveButtonClick();
    }

    onQuitButtonClickCallback() {
        this.leaveButton.interactable && this.onQuitButtonClick && this.onQuitButtonClick();
    }

    onUpButtonTouchStart() {
        this.upButton.interactable && this.onUpButtonClick && this.onUpButtonClick();
    }

    onDownButtonTouchStart() {
        this.downButton.interactable && this.onDownButtonClick && this.onDownButtonClick();
    }

    onLeftButtonTouchStart() {
        this.leftButton.interactable && this.onLeftButtonClick && this.onLeftButtonClick();
    }

    onRightButtonTouchStart() {
        this.rightButton.interactable && this.onRightButtonClick && this.onRightButtonClick();
    }

    onFireButtonClickCallback() {
        this.fireButton.interactable && this.onFireButtonClick && this.onFireButtonClick();
    }

    onKeyDown(event) {
        if (global.room.isSyncing) {
            switch (event && event.keyCode) {
                case 87:
                    return this.onUpButtonClick();
                case 83:
                    return this.onDownButtonClick();
                case 65:
                    return this.onLeftButtonClick();
                case 68:
                    return this.onRightButtonClick();
                case 75: // 按键“k”
                    return this.onFireButtonClick();
            }
        }
    }

    calcFrame(frame: GOBE.ServerFrameMessage) {
        if (frame.currentRoomFrameId === 1) {
            setDefaultFrameState();
        }
        if (frame.frameInfo && frame.frameInfo.length > 0) {
            frame.frameInfo.forEach(frameItem => {
                let frameData: string[] = frameItem.data;
                if (frameData && frameData.length > 0) {
                    frameData.forEach(data => {
                        let obj = JSON.parse(data);
                        switch (obj.cmd) {
                            case CmdType.planeFly:
                                console.log('------receive planeFly frame----' + JSON.stringify(obj));
                                updatePlayerData(obj.playerId,obj.x, obj.y, obj.hp, obj.direction);
                                break;
                            case CmdType.bulletFly:
                                console.log('------receive bulletFly frame----' + JSON.stringify(obj));
                                this.updateBullet(obj);
                                break;
                            case CmdType.bulletDestroy:
                                console.log('------receive bulletDestroy frame----' + JSON.stringify(obj));
                                this.gameCanvas.destroyBullet(obj.bulletId);
                                break;
                                // no default
                        }
                    });
                }
            });
        }
    }

    // 处理实时消息
    processServerInfo(serverInfo: GOBE.RecvFromServerInfo) {
        if(serverInfo.msg) {
            console.log('----收到实时消息----' + serverInfo.msg);
            let sInfo = JSON.parse(serverInfo.msg);
            if(sInfo && sInfo.type == 'Collide') {
                // 如果缓存中有碰撞事件，则清理缓存
                if(colliderEventMap.get(sInfo.bulletId)) {
                    console.log('----前后端状态一致---');
                    colliderEventMap.delete(sInfo.bulletId);
                }
                // 若缓存中没有碰撞事件，则回滚
                else {
                    colliderEventMap.clear();
                    destroyedBulletSet.clear();
                    let frameId = global.curHandleFrameId > global.rollbackFrameCount ?
                        global.curHandleFrameId - global.rollbackFrameCount : 1;
                    console.log(`---------回滚${global.rollbackFrameCount}帧---------`);
                    global.room.resetRoomFrameId(frameId);
                    global.isRequestFrameStatus = true;
                }
            }
        }
    }

    reCalcFrameState() {
        setDefaultFrameState();
        frames.forEach(frame => {
            this.calcFrame(frame);
        });
    }

    // 刷新子弹
    updateBullet(obj) {
        let bullet: BulletData = {
            playerId: obj.playerId,
            bulletId: obj.bulletId,
            x: obj.x,
            y: obj.y,
            direction: obj.direction,
            needDestroy: false
        }
        this.gameCanvas.setBullet(bullet);
    }
}
