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

export enum LoginType {
    Guest = 0,          // 游客登录 每次登录账号随机
    Account = 1,        // 账号登录 每次登录账号固定
}

export enum RoomType {
    NULL = 0,
    OneVOne = 1,        // 1 V 1 类型房间
    TwoVTwo = 2,        // 2 V 2 类型房间
    ThreeVOne = 3,      // 3 V 1 类型房间
}

export enum LockType {
    UnLocked = 0,
    Locked = 1,
}
