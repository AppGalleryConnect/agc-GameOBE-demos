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

using System.Collections.Generic;
using Com.Huawei.Game.Gobes.Model;

public class PlayerList<T> {

    [DataContract]
    public class PlayerData<T>
    {
        [DataMember]
        public int x { get; set; }
        [DataMember]
        public int y { get; set; }
        [DataMember]
        public string id { get; set; }
        [DataMember]
        public int rotation { get; set; }
        [DataMember]
        public string playerTeamId { get; set; }
        [DataMember]
        public T state { get; set; }
        [DataMember]
        public int isRobot { get; set; }
        [DataMember]
        public string robotName { get; set; }
    }

    public List<PlayerData<T>> Players = new List<PlayerData<T>>(); 
   
}
