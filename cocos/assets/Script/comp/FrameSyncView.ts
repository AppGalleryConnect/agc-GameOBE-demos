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

import GameCanvas from "../comp/GameCanvas";
import {cloudsList, frameSyncBulletList, frameSyncPlayerList, reCalcFrameState} from "../function/FrameSync";
import global from "../../global";

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

    @property(GameCanvas)
    gameCanvas: GameCanvas = null;

    public onStopFrameButtonClick: () => any = null;
    public onUpButtonClick: () => any = null;
    public onDownButtonClick: () => any = null;
    public onLeftButtonClick: () => any = null;
    public onRightButtonClick: () => any = null;
    public onFireButtonClick: () => any = null;

    setEnableButtons(isEnabled: boolean) {
        this.stopFrameButton.node.opacity = isEnabled ? 255 : 0;
        this.stopFrameButton.node.active = isEnabled;
    }

    start() {
        this.stopFrameButton.node.on(cc.Node.EventType.TOUCH_START, this.onStopFrameButtonClickCallback, this);
        this.upButton.node.on(cc.Node.EventType.TOUCH_START, this.onUpButtonClickCallback, this);
        this.downButton.node.on(cc.Node.EventType.TOUCH_START, this.onDownButtonClickCallback, this);
        this.leftButton.node.on(cc.Node.EventType.TOUCH_START, this.onLeftButtonClickCallback, this);
        this.rightButton.node.on(cc.Node.EventType.TOUCH_START, this.onRightButtonClickCallback, this);
        // 绑定“攻击”按钮
        this.fireButton.node.on(cc.Node.EventType.TOUCH_START, this.onFireButtonClickCallback, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        reCalcFrameState();
    }

    update(dt) {
        // 绘制玩家
        this.gameCanvas.setPlayers(frameSyncPlayerList.players);
        // 绘制小云朵
        this.gameCanvas.setClouds(cloudsList.clouds, dt);

        // 绘制子弹
        this.gameCanvas.setBullets(frameSyncBulletList.bullets);
    }

    onStopFrameButtonClickCallback() {
        this.stopFrameButton.interactable && this.onStopFrameButtonClick && this.onStopFrameButtonClick();
    }

    onUpButtonClickCallback() {
        this.upButton.interactable && this.onUpButtonClick && this.onUpButtonClick();
    }

    onDownButtonClickCallback() {
        this.downButton.interactable && this.onDownButtonClick && this.onDownButtonClick();
    }

    onLeftButtonClickCallback() {
        this.leftButton.interactable && this.onLeftButtonClick && this.onLeftButtonClick();
    }

    onRightButtonClickCallback() {
        this.rightButton.interactable && this.onRightButtonClick && this.onRightButtonClick();
    }
    onFireButtonClickCallback() {
        this.fireButton.interactable && this.onFireButtonClick && this.onFireButtonClick();
    }

    onKeyDown(event) {
        if (global.state === 1 && global.keyOperate === 1) {
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

}
