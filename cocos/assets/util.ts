/*
 * Copyright 2021. Huawei Technologies Co., Ltd. All rights reserved.
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

import global from "./global";

/**
 * 随机产生 openId
 */
export function mockOpenId() {
    let str = Date.now().toString(36);

    for (let i = 0; i < 7; i++) {
        str += Math.ceil(Math.random() * (10 ** 4)).toString(36);
    }

    return str;
}

export function mockPlayerName(): string {
    let outString: string = '';
    let inOptions: string = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 6; i++) {
        outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
    }
    return outString;
}


/**
 * 判断 MGOBE SDK 是否初始化完成
 */
export function isInited(): boolean {
    // 初始化成功后才有玩家ID
    return !!global.playerId;
}

/**
 * 显示log
 * @param logStr
 */
export function printLog(logStr: string) {
    return cc.log(logStr);
}
