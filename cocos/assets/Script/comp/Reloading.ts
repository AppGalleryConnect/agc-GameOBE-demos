/**
 * Copyright 2022. Huawei Technologies Co., Ltd. All rights reserved.
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

// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Reloading extends cc.Component {

    @property(cc.Label)
    content: cc.Label = null;

    @property(cc.Button)
    cancelButton: cc.Button = null;

    // 取消按钮回调函数
    public static onCancel: () => any = null;

    private static node: cc.Node = null;
    private static isOpen: boolean = false;
    private static cancelBtnEnable: boolean = false;
    private static content = null;

    public static open(content: string, cancelBtnEnable: boolean, onCancel?: () => any) {
        Reloading.content = content;
        Reloading.isOpen = true;
        Reloading.cancelBtnEnable = cancelBtnEnable;
        Reloading.onCancel = onCancel || null;
        Reloading.node && (Reloading.node.active = true);
    }

    public static close() {
        Reloading.content = "";
        Reloading.isOpen = false;
        Reloading.cancelBtnEnable = false;
        Reloading.onCancel = null;
        Reloading.node && (Reloading.node.active = false);
    }

    start() {
        Reloading.node = this.node;
        this.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
        }, this, true);

        this.cancelButton.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            Reloading.onCancel && Reloading.onCancel();
            Reloading.close();
        });
    }

    update(dt) {
        this.content && this.content.string !== Reloading.content && (this.content.string = Reloading.content);
        this.cancelButton && (this.cancelButton.node.active = Reloading.cancelBtnEnable);
        this.node && (this.node.active = Reloading.isOpen);
    }

}
