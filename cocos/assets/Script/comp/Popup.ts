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

const {ccclass, property} = cc._decorator;

@ccclass
export default class Popup extends cc.Component {

    @property(cc.Label)
    titleLabel: cc.Label = null;

    @property(cc.Button)
    confirmButton: cc.Button = null;

    @property(cc.Button)
    cancelButton: cc.Button = null;

    @property(cc.Prefab)
    popupItem: cc.Prefab = null;

    // 标题
    public title: string = "";
    // 内容对象
    public content: object = {};
    // 是否打开
    public isOpen: boolean = false;
    // 确认
    public onConfirm: (content) => any = null;
    // 取消
    public onCancel: () => any = null;

    onLoad() {
        // 绑定事件
        this.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            if (event.target !== this.confirmButton.node && event.target !== this.cancelButton.node) {
                event.stopPropagation();
            }
        }, this, true);
        // 绑定确认事件
        this.confirmButton.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            this.updateContent();
            this.onConfirm && this.onConfirm(this.content);
            this.close();
        }, this);
        // 绑定取消事件
        this.cancelButton.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event) => {
            this.onCancel && this.onCancel();
            this.close();
        }, this);
    }
    
    update() {
        this.titleLabel && this.titleLabel.string !== this.title && (this.titleLabel.string = this.title);
        this.node && (this.node.active = this.isOpen);
    }

    // 打开对话框
    public open(title: string, content: object, onConfirm?: () => any, onCancel?: () => any) {
        this.onConfirm = onConfirm || null;
        this.onCancel = onCancel || null;
        this.isOpen = true;
        this.title = title;
        this.content = content;
        this.node && (this.node.active = true);
        this.createNode();
    }

    // 关闭对话框
    public close() {
        this.onConfirm = null;
        this.onCancel = null;
        this.isOpen = false;
        this.title = "";
        this.content = {};
        this.node && (this.node.active = false);
        this.node.children.forEach(i => i.name == 'popup_item' && i.destroy())
    }

    public createNode() {
        const d = this.content;
        let y = -35;
        for(let k in d){
            let item = cc.instantiate(this.popupItem);
            var itemScript = item.getComponent('PopupItem');
            // 初始化预制件数据
            itemScript.init(k,d[k]); 
            this.node.addChild(item);
            item.setPosition(0,y);
            y += 45;
        }
    }

    public updateContent(){
        let items = this.node.children.filter(i => i.name == 'popup_item');
        items.forEach(i => {
            console.log(i);
            const k = i.children[0].getComponent(cc.Label).string;
            const v = i.children[1].getComponent(cc.EditBox).string;
            this.content[k] = v;
        })
    }
}
