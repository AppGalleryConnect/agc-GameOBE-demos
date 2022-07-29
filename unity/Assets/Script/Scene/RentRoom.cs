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
using UnityEngine;
using UnityEngine.UI;
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Utils;
using Newtonsoft.Json;

public class RentRoom : MonoBehaviour
{
    public Text appId;

    public Text roomId;

    public Text roomCode;

    public GameObject facePrefab;

    public GameObject playerParent;

    public GameObject prepareOrStartBtn;

    public GameObject message;

    public static bool isOwner = false;

    private const float pollTime = 2.0f;
    
    void Start() {
        InitListener();
        // 由于玩家切换准备状态无法感知，故通过轮询来
        InvokeRepeating("GetRoomInfo", 0f, pollTime);
    }

    public void InitListener() {
        Global.Room.OnJoin = (res) => {
            Debug.Log("加入后的回调" + JsonConvert.SerializeObject(res));
            UnityMainThread.wkr.AddJob(GetRoomInfo);
        };

        Global.Room.OnLeave = (res) => {
            if (Global.Room != null && Global.playerId != res.PlayerId) {
                UnityMainThread.wkr.AddJob(GetRoomInfo);
            } else {
                UnityMainThread.wkr.AddJob(Route.GoHall);
            }
        };

        Global.Room.OnDismiss = () => {
            UnityMainThread.wkr.AddJob(Route.GoHall);
        };

        Global.Room.OnStartSyncFrame = () => {
            SDKDebugLogger.Log("广播--游戏帧同步开始");
            Global.state = 1; // 帧同步状态 0停止帧同步，1开始帧同步
            Global.keyOperate = 1; // 按键操作限制 0限制操作，1允许操作
            UnityMainThread.wkr.AddJob(Route.GoGameView);
        };
    }

    private void RenderView()
    {
        const int xAxis = 92;
        const int yAxisRight = 120;

        appId.text = Global.Room.roomInfo.AppId;
        roomId.text = Global.Room.roomInfo.RoomId;
        roomCode.text = Global.Room.roomInfo.RoomCode;

        // 当前玩家是否为房主
        isOwner = Global.playerId == Global.Room.roomInfo.OwnerId;

        if (isOwner)
        {
            prepareOrStartBtn.GetComponentInChildren<Text>().text = "开始游戏";
            prepareOrStartBtn.GetComponent<Button>().interactable = Global.Room.roomInfo.Players.Length > 1;
        }

        // 渲染玩家
        gameObject.BroadcastMessage("DeleteFace", SendMessageOptions.DontRequireReceiver);
        foreach (PlayerInfo player in Global.Room.roomInfo.Players)
        {
            CreatFaceParam param;
            int index = Array.IndexOf(Global.Room.roomInfo.Players, player);
            int x = index < 1 ? -xAxis : xAxis;
            int y = yAxisRight;

            if (!isOwner && player.PlayerId != Global.Room.roomInfo.OwnerId)
            {
                prepareOrStartBtn.GetComponentInChildren<Text>().text = player.CustomPlayerStatus == 1 ? "取消准备" : "准备";
            }

            GameObject playerPrefab = Instantiate(facePrefab, playerParent.transform);
            playerPrefab.transform.localPosition = new Vector3(x, y, 0);
            param = new CreatFaceParam{ index = index, isOwner = isOwner, name = player.PlayerId, status = player.CustomPlayerStatus };
            playerPrefab.SendMessage("RandomizeCharacter", param, SendMessageOptions.DontRequireReceiver);
        }
    }

    public void LeaveRoom()
    {
        Debug.Log("离开房间");
        Global.client.LeaveRoom(res =>
        {
            if (res.RtnCode == 0)
            {
                this.ReLogin();
                Route.GoHall();
                Debug.Log("离开房间success");
            }
            else
            {
                Debug.Log("离开房间fail");
                CreateMessage(res.Msg);
            }
        });
    }

    public void PrepareOrStartGame()
    {
        if (isOwner)
        {
            if (!AllPlayersReady())
            {
                CreateMessage("玩家未准备");
                return;
            }
            Debug.Log("开始游戏");
            Global.Room.Update(res =>
            {
                if (res.RtnCode == 0)
                {
                    Debug.Log("开始游戏success");

                    Global.Room.StartFrameSync(response =>
                    {
                        Debug.Log(Util.ErrorMessage(response));
                    });
                }
                else
                {
                    Debug.Log("开始游戏fail");
                    CreateMessage(res.Msg);
                }
            });
        }
        else
        {
            Debug.Log("切换准备按钮");
            int playerChangeStatus = Global.player.CustomStatus == 1 ? 0 : 1;
            Global.player.UpdateCustomStatus(playerChangeStatus, res =>
            {
                if (res.RtnCode == 0)
                {
                    Debug.Log("切换准备状态success");
                    GetRoomInfo();
                }
                else
                {
                    Debug.Log("切换准备状态fail");
                    CreateMessage(res.Msg);
                }
            });
        }
    }

    public void GetRoomInfo()
    {
        Global.Room = Global.Room?.Update(res => {
            if (res.RtnCode == 0)
            {
                Global.Room.roomInfo = res.RoomInfo;
                RenderView();
            }
        });
    }

    private bool AllPlayersReady()
    {
        bool flag = true;
        foreach(PlayerInfo player in Global.Room.roomInfo.Players)
        {
            if (player.PlayerId != Global.Room.roomInfo.OwnerId && player.CustomPlayerStatus == 0)
            {
                flag = false;
                break;
            }
        }
        return flag;
    }

    private void CreateMessage(string tip)
    {
        GameObject MessageBox = Instantiate(message, prepareOrStartBtn.transform.parent);
        MessageBox.GetComponent<Message>().tip.text = tip;
    }
    
    void ReLogin() { 
        Global.client.Init(response => {});
    }
}
