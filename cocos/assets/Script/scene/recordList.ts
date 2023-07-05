/**
 * Copyright 2023. Huawei Technologies Co., Ltd. All rights reserved.
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

import global from "../../global";
import * as Util from "../../util";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RecordList extends cc.Component {
    @property(cc.Button)
    quitBtn: cc.Button = null;

    @property(cc.Prefab)
    dialogPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    recordPrefab: cc.Prefab = null;

    @property(cc.Node)
    listContent: cc.Node = null;

    @property(cc.Layout)
    layOut: cc.Layout = null;

    start() {
        this.initView();
        this.queryRecordList();
        this.initListener();
    }

    initView() {
        this.initDialog();
    }

    initDialog() {
        // 设置对话框
        const dialogNode = cc.instantiate(this.dialogPrefab) as cc.Node;
        dialogNode.parent = this.node;
    }

    initListener() {
        this.quitBtn.node.on(cc.Node.EventType.TOUCH_END, () => cc.director.loadScene("hall"));
    }

    queryRecordList() {
        Util.printLog(`正在查询战绩列表`);
        this.layOut.node.removeAllChildren(true);
        global.client.queryRecordList(0, 10)
            .then((res) => {
                if(res.recordInfos.length > 0){
                    global.recordInfos = res.recordInfos;
                    for(let i = 0; i < global.recordInfos.length; i++) {
                        global.recordPlayerIdMap.set(global.recordInfos[i].recordId, global.recordInfos[i].playerIds);
                    }
                    this.refreshList();
                }
                Util.printLog(`查询战绩列表成功`);
                console.log('queryRecordList success res: ' + JSON.stringify(res));
            })
            .catch((err) => {
                global.recordInfos = [];
                Util.printLog(`查询战绩列表失败 err: ${err}`);
            });
    }

    refreshList() {
        if (global.recordInfos) {
            const nums: number = global.recordInfos.length;
            if (nums <= 7) {
                this.listContent.height = 530;
            } else {
                this.listContent.height = nums * 70;
            }
        }
        for (let i = 0; i < global.recordInfos.length; ++i) {
            const item = cc.instantiate(this.recordPrefab);
            this.layOut.node.addChild(item);
            item.getComponent('RecordItem').init(global.recordInfos[i]);
        }
    }

}
