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
import {RoomType} from "../commonValue";


export function setRoomType(roomType: RoomType) {
    global.roomType = roomType;
    if (global.room && global.room.ownerId === global.room.playerId) {
        let roomProp;
        if (global.client.room.customRoomProperties) {
            roomProp = JSON.parse(global.client.room.customRoomProperties);
            roomProp.roomType = roomType;
        } else {
            roomProp = {roomType: roomType};
        }
        global.room.updateRoomProperties({customRoomProperties: JSON.stringify(roomProp)});
    }
}

/**
 * 休眠second秒
 * @param second
 * @private
 */
export function sleep(second: number) {
    return new Promise((resolve) => setTimeout(resolve, second));
}
