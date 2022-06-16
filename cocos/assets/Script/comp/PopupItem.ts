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
export default class PopupItem extends cc.Component {

    @property(cc.Label)
    keyLabel: cc.Label = null;

    @property(cc.EditBox)
    valueEdit: cc.EditBox = null;

    private label: string = '';
    private value: string = '';

    init (key:string,val:string): void {
        key = (key == undefined) ? '' : key;
        val = (val == undefined) ? '' : val;
        this.label = key;
        this.value = val;
        this.keyLabel.string = key;
        this.valueEdit.string = val;
    }

    updated() {
        this.keyLabel && this.keyLabel.string !== this.label && (this.keyLabel.string = this.label);
        this.valueEdit && this.valueEdit.string !== this.value && (this.valueEdit.string = this.value);
    }

}
