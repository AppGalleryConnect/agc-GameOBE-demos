/**
 * Copyright 2024. Huawei Technologies Co., Ltd. All rights reserved.
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

import {Game} from "./Game";

export class GameManage {
    #gameMapping = new Map();

    public saveGame(roomId: string, game: Game) {
        this.#gameMapping.set(roomId, game);
    }

    public getGame(roomId: string): Game {
        return this.#gameMapping.get(roomId) ?? undefined;
    }

    public removeGame(roomId: string) {
        this.#gameMapping.delete(roomId);
    }
}

export default new GameManage();