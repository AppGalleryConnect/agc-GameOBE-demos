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
export default class ReopenGame extends cc.Component {

    @property(cc.Label)
    titleLabel: cc.Label = null;

    @property(cc.Label)
    contentLabel: cc.Label = null;

    @property(cc.Button)
    reOpenButton: cc.Button = null;

    @property(cc.Button)
    exitButton: cc.Button = null;

    // 确认按钮回调函数
    public static onReopen: () => any = null;
    // 取消按钮回调函数
    public static onExit: () => any = null;

    // 对话框标题
    public static title: string = "";
    // 对话框内容
    public static content: string = "";

    private static isOpen: boolean = false;
    private static node: cc.Node = null;

    // 打开对话框
    public static open(title: string, content: string, onReopen?: () => any, onExit?: () => any) {
        ReopenGame.onReopen = onReopen || null;
        ReopenGame.onExit = onExit || null;
        ReopenGame.isOpen = true;
        ReopenGame.title = title;
        ReopenGame.content = content;
        ReopenGame.node && (ReopenGame.node.active = true);
    }

    // 关闭对话框
    public static close() {
        ReopenGame.onReopen = null;
        ReopenGame.onExit = null;
        ReopenGame.isOpen = false;
        ReopenGame.title = "";
        ReopenGame.content = "";
        ReopenGame.node && (ReopenGame.node.active = false);
    }

    start() {
        ReopenGame.node = this.node;

        this.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            if (event.target !== this.reOpenButton.node && event.target !== this.exitButton.node) {
                event.stopPropagation();
            }
        }, this, true);

        this.reOpenButton.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            ReopenGame.onReopen && ReopenGame.onReopen();
            ReopenGame.close();
        });

        this.exitButton.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            ReopenGame.onExit && ReopenGame.onExit();
            ReopenGame.close();
        });
    }

    update(dt) {
        this.titleLabel && this.titleLabel.string !== ReopenGame.title && (this.titleLabel.string = ReopenGame.title);
        this.contentLabel && this.contentLabel.string !== ReopenGame.content && (this.contentLabel.string = ReopenGame.content);
        this.node && (this.node.active = ReopenGame.isOpen);
    }

}
