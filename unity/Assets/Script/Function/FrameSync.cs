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
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;
using com.huawei.game.gobes;
using com.huawei.game.gobes.Room;

public class FrameSync {

    public static List<ServerFrameMessage> frames = new List<ServerFrameMessage>();

    // X，Y轴最大最小的坐标
    public static readonly int _minX = -10, _maxX = 13, _minY = -7, _maxY = 5;

    // 断线重连状态
    public enum ReConnectState {
        reConnectionDefault = -1, // 默认状态
        reConnection = 0, // 断线重连
        reConnectSuccess = 1, // 重连成功
        reConnectFail = 2, // 重连失败
        reConnectIng = 3 // 重连中
    };
    
    // 游戏帧同步命令
    public enum FrameSyncCmd {
        up = 1,
        down = 2,
        left = 3,
        right = 4,
    };

    // 队伍 0红队 1黄队
    public enum GameTeam {
        red = 0,
        yellow = 1,
    };

    // 玩家
    public class Player {
        public FrameSyncCmd cmd { get; set; }
        public int lastUpdateFrameId { get; set; }
    }

    // 云朵
    public class Cloud {
        public int x { get; set; } = 0;
        public int y { get; set; } = 0;
        public int offset { get; set; } = 0;
        public int speed { get; set; } = 0;
    }

    // 初始化本地玩家和云朵数据
    public static List<PlayerList<Player>.PlayerData<Player>> frameSyncPlayerList = new PlayerList<Player>().Players;

    public static List<CloudList<Cloud>.CloudData<Cloud>> cloudsList = new CloudList<Cloud>().Clouds;

    // 游戏结束--清空本地帧数据
    public static void ClearFrames() {
        frames.Clear();
    }

    // 游戏中存储帧数据到本地
    public static void PushFrames(ServerFrameMessage frame) {
        frames.Add(frame);
    }

    // 重新计算帧同步数据
    public static void ReCalcFrameState() {
        SetDefaultFrameState();
        if (frames != null && frames.Count > 0) {
            foreach (ServerFrameMessage frame in frames) {
                CalcFrame(frame);
            }
        }
    }

    // 计算帧同步数据
    public static void CalcFrame(ServerFrameMessage frame) {
        if (frame.CurrentRoomFrameId == 1) {
            SetDefaultFrameState();
        }
        if (frame.FrameInfo == null || frame.FrameInfo.Length <= 0) {
            return;
        }
        foreach (FrameInfo frameItem in frame.FrameInfo) {
            string[] frameData = frameItem.Data;
            if (frameData != null && frameData.Length > 0) {
                foreach (string data in frameData)
                {
                    PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> player =
                        JsonConvert.DeserializeObject<PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player>>(data);
                    SetPlayerCMD(frameItem.PlayerId, player.state.cmd, player.x, player.y);
                }
            }
        }
    }

    // 设置初始化的帧同步状态
    static void SetDefaultFrameState() {
        RoomInfo roomInfo = Global.Room != null ? Global.Room.roomInfo : null;
        if (roomInfo != null) {
            // 获取红队id
            string redTeamId = GetRedTeamId(roomInfo);
            if (redTeamId == null) {
                // 房间匹配功能
                Global.isTeamMode = false;
                RoomMatch(redTeamId, roomInfo);
            }
            if (redTeamId != null) {
                // 组队匹配功能
                Global.isTeamMode = true;
                TeamMatch(redTeamId, roomInfo);
            }
        }
    }

    // 组队匹配
    static void TeamMatch(string redTeamId, RoomInfo roomInfo) {
        int yellowYCoordinates = _minY;
        int redYCoordinates = _maxY;
        if (roomInfo != null && roomInfo.players != null && roomInfo.players.Length > 0)
        {
            foreach (PlayerInfo player in roomInfo.players)
            {
                if (redTeamId == player.TeamId)
                {
                    // 初始化红队的位置、方向
                    InitPlayer(_minX, redYCoordinates, player.PlayerId, -90, FrameSyncCmd.right, GameTeam.red.ToString());
                    redYCoordinates--;
                }
                else
                {
                    // 初始化黄队的位置、方向
                    InitPlayer(_maxX, yellowYCoordinates, player.PlayerId, 90, FrameSyncCmd.left, GameTeam.yellow.ToString());
                    yellowYCoordinates++;
                }
            }
        }
    }

    // 房间匹配
    static void RoomMatch(string redTeamId, RoomInfo roomInfo) {
        if (roomInfo != null && roomInfo.players != null && roomInfo.players.Length > 0)
        {
            // 初始化每个玩家的位置、方向
            foreach (PlayerInfo player in roomInfo.players)
            {
                if (roomInfo.ownerId != null && roomInfo.ownerId != player.PlayerId)
                {
                    // 如果不是房主
                    InitPlayer(_maxX, _minY, player.PlayerId, 90, FrameSyncCmd.left, null);
                }
                else
                {
                    // 如果是房主
                    InitPlayer(_minX, _maxY, player.PlayerId, -90, FrameSyncCmd.right, null);
                }
            }
        }
    }

    // 初始化玩家的坐标、方向、命令、玩家队伍
    static void InitPlayer(int x, int y, string playerId, int rotation, FrameSyncCmd cmd, string playerTeamId) {
        // 初始化用户信息
        PlayerList<Player>.PlayerData<Player> player = new PlayerList<Player>.PlayerData<Player>();
        foreach (PlayerList<Player>.PlayerData<Player> playerInfo in frameSyncPlayerList) {
            if (playerInfo.id == playerId) {
                player = playerInfo;
                break;
            }
        }
        player.x = x;
        player.y = y;
        player.id = playerId;
        player.rotation = rotation;
        player.playerTeamId = playerTeamId;
        // 初始化用户状态信息
        Player PlayerExtData = new Player();
        PlayerExtData.cmd = cmd;
        player.state = PlayerExtData;
        // 将用户存入本地内存
        frameSyncPlayerList.Add(player);
    }

    // 获取红队队长的TeamId
    static string GetRedTeamId(RoomInfo roomInfo) {
        string redTeamId = null;
        if (roomInfo != null && roomInfo.players != null && roomInfo.players.Length > 0) {
            foreach (PlayerInfo player in roomInfo.players){
                if (roomInfo.ownerId != null && roomInfo.ownerId == player.PlayerId)
                {
                    // 如果是房主
                    redTeamId = player.TeamId;
                    break;
                }
            }
        }
        return redTeamId;
    }

    // 设置玩家的操作命令、位置信息
    static void SetPlayerCMD(string playerId, FrameSyncCmd cmd, int x, int y) {
        if (frameSyncPlayerList != null && frameSyncPlayerList.Count > 0) {
            foreach (PlayerList<Player>.PlayerData<Player> player in frameSyncPlayerList)
            {
                if (player.id == playerId)
                {
                    PlayerList<Player>.PlayerData<Player> playerInfo = player;
                    playerInfo.state.cmd = cmd;
                    playerInfo.x = x;
                    playerInfo.y = y;
                    switch (cmd)
                    {
                        case FrameSyncCmd.up:
                            playerInfo.rotation = 0;
                            break;
                        case FrameSyncCmd.down:
                            playerInfo.rotation = 180;
                            break;
                        case FrameSyncCmd.left:
                            playerInfo.rotation = 90;
                            break;
                        case FrameSyncCmd.right:
                            playerInfo.rotation = -90;
                            break;
                        default:
                            break;
                    }
                    break;
                }
            }
        }
    }

}
