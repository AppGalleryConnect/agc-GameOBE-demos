/*
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

import global from "./global";
import config from "./config";
import {LoginType} from "./Script/commonValue";

/**
 * 随机产生 openId
 */
export function mockOpenId(loginType: LoginType) {
    let str: string;
    if(loginType === LoginType.Account) {
        str = cc.sys.localStorage.getItem('openId');
        if(!str) {
            str = randomStr();
            cc.sys.localStorage.setItem('openId', str);
        }
    }
    else {
        str = randomStr();
    }
    return str;
}

function randomStr(){
    let str = Date.now().toString(36);

    for (let i = 0; i < 7; i++) {
        str += Math.ceil(Math.random() * (10 ** 4)).toString(36);
    }

    return str;
}

// 在非对称匹配规则下，队伍编号值为1的表示1人队的一方 ， 队伍编号值为11的表示3人队的一方
export function mockTeamNumber() {
    return Math.random() < 0.5 ? 1 : 11;
}

export function getPlayerMatchParams() {
    if (config.asymmetric) {
        return {'level': 3, "def": 1};
    } else {
        return {'level': 2};
    }
}

export function getTeamMatchParams() {
    if (config.asymmetric) {
        return {
            matchParams: {"teamNumber": mockTeamNumber()}
        };
    } else {
        return null;
    }
}

/**
 * 获取玩家自定义属性
 */
export function getCustomPlayerProperties() {
    let playerName: string = global.playerName;
    let ack: number = 0;
    let data: Object;
    const teamMatchParams = getTeamMatchParams();
    if (teamMatchParams) {    //非对称匹配传的player属性
        ack = teamMatchParams.matchParams.teamNumber;
        data = {
            ack, playerName
        }
    } else {     // 对称匹配传的属性。
        data = {
            playerName
        }
    }
    let customPlayerProperties: string = JSON.stringify(data);
    return customPlayerProperties;
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
    return !!global.client?.playerId;
}

/**
 * 显示log
 * @param logStr
 */
export function printLog(logStr: string) {
    return cc.log(logStr);
}

/**
 * 报错信息统一处理
 * @param error
 */
export function errorMessage(error: any) {
    return (error && error.code && error.message) ? ":" + error.code + " | " + error.message : "";
}

/**
 * 通过文件的arrayBuffer获取文件的sha256值
 * @param arrayBuffer
 */
export async function getFileHash(arrayBuffer: ArrayBuffer) {
    // Blob转ArrayBuffer
    // const arrayBuffer = await blob.arrayBuffer();
    // 计算消息的哈希值
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    // 将缓冲区转换为字节数组
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // 将字节数组转换为十六进制字符串 (hashHex)
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}


export function download(remoteUrl: string) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = async function (e) {
            if (xhr.readyState != 4) {
                return;
            }
            if (xhr.status == 200) {
                const response = xhr.response;
                if (response) {
                    /*const blob = new Blob([response], {
                        type: 'application/zip,charset-UTF-8',
                    });*/

                    /*// H5解决方案
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = decodeURI(fileName);
                    link.click();
                    URL.revokeObjectURL(url);*/

                    resolve(response);
                }
                else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                    });
                }
            }
        };

        xhr.onerror = function (e) {
            console.log('----下载出错----' + e);
            reject(e);
        };

        xhr.open('GET', remoteUrl, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    });
}

/**
 * 时间戳转Date
 * @param milliSecond
 */
export function getDate(milliSecond: number){
    let date = new Date(milliSecond);
    let year = date.getFullYear() + '-';
    let month = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
    let day = date.getDate() + ' ';
    let hour = date.getHours() + ':';
    let minutes = date.getMinutes() + ':';
    let second = date.getSeconds();
    return year + month + day + hour + minutes + second;
}
