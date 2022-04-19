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
 *  2022.1.4-Changed method open
 *  2022.1.4-Changed method close
 *             Copyright(C)2022. Huawei Technologies Co., Ltd. All rights reserved
 */
// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Dialog extends cc.Component {

    @property(cc.Label)
    titleLabel: cc.Label = null;

    @property(cc.Label)
    contentLabel: cc.Label = null;

    @property(cc.Button)
    confirmButton: cc.Button = null;

    @property(cc.Button)
    cancelButton: cc.Button = null;

    // 确认按钮回调函数
    public static onConfirm: () => any = null;
    // 取消按钮回调函数
    public static onCancel: () => any = null;

    // 对话框标题
    public static title: string = "";
    // 对话框内容
    public static content: string = "";

    private static isOpen: boolean = false;
    private static node: cc.Node = null;

    // 打开对话框
    public static open(title: string, content: string, onConfirm?: () => any, onCancel?: () => any) {
        Dialog.onConfirm = onConfirm || null;
        Dialog.onCancel = onCancel || null;
        Dialog.isOpen = true;
        Dialog.title = title;
        Dialog.content = content;
        Dialog.node && (Dialog.node.active = true);
    }

    // 关闭对话框
    public static close() {
        Dialog.onConfirm = null;
        Dialog.onCancel = null;
        Dialog.isOpen = false;
        Dialog.title = "";
        Dialog.content = "";
        Dialog.node && (Dialog.node.active = false);
    }

    start() {
        Dialog.node = this.node;

        this.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            if (event.target !== this.confirmButton.node && event.target !== this.cancelButton.node) {
                event.stopPropagation();
            }
        }, this, true);

        this.confirmButton.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            Dialog.onConfirm && Dialog.onConfirm();
            Dialog.close();
        });

        this.cancelButton.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            Dialog.onCancel && Dialog.onCancel();
            Dialog.close();
        });
    }

    update(dt) {
        this.titleLabel && this.titleLabel.string !== Dialog.title && (this.titleLabel.string = Dialog.title);
        this.contentLabel && this.contentLabel.string !== Dialog.content && (this.contentLabel.string = Dialog.content);
        this.node && (this.node.active = Dialog.isOpen);
    }

}
