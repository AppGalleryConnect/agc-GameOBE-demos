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

using com.huawei.game.gobes;
using com.huawei.game.gobes.Group;
using com.huawei.game.gobes.Player;
using com.huawei.game.gobes.Room;
using System;

public class Global {

    public static Client client = null;
    public static Player player = null;
    public static Group group = null;
    public static Room room = null;
    public static RoomInfo[] roomInfos = null;

    public static string gameId = Config.gameId;
    public static int state = 0; // 帧同步状态 0停止帧同步，1开始帧同步
    public static int keyOperate = 1; // 按键操作限制 0限制操作，1允许操作
    public static string playerId = "";
    public static string matchRule = "0"; // 匹配规则 0-菜鸟区，1-高手区
    public static int roomId = 0;
    public static Boolean isTeamMode = false;
    public static Boolean isOnlineMatch = false;
    public static string playerName = "";

    internal static Room Room { get => room; set => room = value; }
}
