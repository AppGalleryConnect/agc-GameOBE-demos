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

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerList<T> {

    public class PlayerData<T>
    {
        public int x { get; set; }
        public int y { get; set; }
        public string id { get; set; }
        public int rotation { get; set; }
        public string playerTeamId { get; set; }
        public T state { get; set; }
        public int isRobot { get; set; }
    }

    public List<PlayerData<T>> Players = new List<PlayerData<T>>(); 
   
}
