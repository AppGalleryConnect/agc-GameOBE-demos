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

using System;
using UnityEngine;
using UnityEngine.UI;
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Store;
using Com.Huawei.Game.Gobes.Utils;
using Random = UnityEngine.Random;

public class RentRoom : MonoBehaviour
{
    public Text appId;

    public Text roomId;

    public Text roomCode;

    public GameObject facePrefab;

    public GameObject playerParent;

    public Button leaveBtn;

    public Button prepareOrStartBtn;
    
    public Toggle IsLock;

    public GameObject message;

    public GameObject commonHeader;

    public GameObject loadingHeader;

    public static bool isOwner = false;

    private bool bLoading = false;

    private float ownerProgressValue = 0f;

    private float commonPlayerProgressValue = 0f;

    void Start()
    {
        InitListener();

        Invoke("GetRoomInfo", 0f);

        if (Global.Room.roomInfo.RoomStatus == (int) RoomStatus.SYNCING)
        {
            OnStartFrameSync();
        }
    }

    public void InitListener()
    {
        Util.SaveRoomType(FrameSync.RoomType.ROOM);
        Global.Room.OnJoin = (res) =>
        {
            Debug.Log("加入后的回调" + CommonUtils.JsonSerializer(res));
            UnityMainThread.wkr.AddJob(GetRoomInfo);
        };

        Global.Room.OnLeave = (res) =>
        {
            if (Global.Room != null && Global.playerId != res.PlayerId)
            {
                UnityMainThread.wkr.AddJob(GetRoomInfo);
            }
            else
            {
                UnityMainThread.wkr.AddJob(Route.GoHall);
            }
        };

        Global.Room.OnDismiss = () => { UnityMainThread.wkr.AddJob(Route.GoHall); };

        Global.Room.OnStartSyncFrame = () => OnStartFrameSync();

        Global.Room.OnRecvFromServer = (data) => { OnReceiveFromServer(data); };

        Global.Room.OnUpdateCustomStatus = (status) =>
        {
            Debug.Log("OnUpdateCustomStatus " + status);
            UnityMainThread.wkr.AddJob(GetRoomInfo);
        };
        
        Global.Room.OnRoomPropertiesChange = (roomInfo) =>
        {
            Debug.Log("OnRoomPropertiesChange :" + CommonUtils.JsonSerializer(roomInfo));
            UnityMainThread.wkr.AddJob(GetRoomInfo);
        };

        IsLock.onValueChanged.AddListener(delegate { updateRoomProperties(IsLock.isOn); });
    }

    private void updateRoomProperties(bool isLock)
    {
        int isLockTag = isLock ? 1 : 0;
        if (Global.playerId ==Global.room.roomInfo.OwnerId && isLockTag!=Global.room.roomInfo.IsLock)
        {
            UpdateRoomPropertiesConfig updateRoomProperties = new UpdateRoomPropertiesConfig
            {
                IsLock = isLockTag,
                CustomRoomProperties =  Global.room.roomInfo.CustomRoomProperties == null?"":Global.room.roomInfo.CustomRoomProperties
            };
            Global.room.UpdateRoomProperties(updateRoomProperties, res =>
            {
                if (res.RtnCode == 0)
                {
                    Debug.Log("ChangeLockState Success");
                }
                else
                {
                    Debug.Log($"ChangeLockState failed {res.Msg}");
                }
            });
        }
    }
    
    private void OnReceiveFromServer(RecvFromServerInfo data)
    {
        // TODO根据返回值检测所有玩家加载进度是否都达到100%，是则切换至帧同步场景
        Debug.Log("接收到实时服务消息" + CommonUtils.JsonSerializer(data));
        RTMessage rtMessage = CommonUtils.JsonDeserializer<RTMessage>(data.Msg);

        if (rtMessage.playerId == Global.Room.roomInfo.OwnerId)
        {
            ownerProgressValue = rtMessage.progress;
        }
        else
        {
            commonPlayerProgressValue = rtMessage.progress;
        }

        UnityMainThread.wkr.AddJob(RenderView);

        if (rtMessage.playerId == Global.playerId && rtMessage.progress < 1)
        {
            UnityMainThread.wkr.AddJob(ReportPorgress);
        }

        if (ownerProgressValue >= 1f && commonPlayerProgressValue >= 1f)
        {
            UnityMainThread.wkr.AddJob(Route.GoGameView);
        }
    }

    private void RenderView()
    {
        const int xAxis = 92;
        const int yAxisRight = 120;

        appId.text = Global.Room.roomInfo.AppId;
        roomId.text = Global.Room.roomInfo.RoomId;
        roomCode.text = Global.Room.roomInfo.RoomCode;
        IsLock.GetComponent<Toggle>().enabled = false;
        // 当前玩家是否为房主
        isOwner = Global.playerId == Global.Room.roomInfo.OwnerId;

        IsLock.isOn = Global.room.roomInfo.IsLock == Decimal.One;
        if (isOwner)
        {
            prepareOrStartBtn.GetComponentInChildren<Text>().text = "开始游戏";
            prepareOrStartBtn.GetComponent<Button>().interactable =
                Global.Room.roomInfo.Players.Length > 1 && !bLoading;
            IsLock.GetComponent<Toggle>().enabled = true;

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
            playerPrefab.name = player.PlayerId;
            playerPrefab.transform.localPosition = new Vector3(x, y, 0);
            param = new CreatFaceParam
            {
                index = index,
                isOwner = isOwner,
                name = player.PlayerId,
                loadingStatus = bLoading,
                progressValue = player.PlayerId == Global.Room.roomInfo.OwnerId
                    ? ownerProgressValue
                    : commonPlayerProgressValue,
                status = player.CustomPlayerStatus
            };
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

                    Global.Room.StartFrameSync(response => { Debug.Log(Util.ErrorMessage(response)); });
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
        Global.Room = Global.Room?.Update(res =>
        {
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
        foreach (PlayerInfo player in Global.Room.roomInfo.Players)
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
        GameObject MessageBox = Instantiate(message, GameObject.Find("Canvas").transform);
        MessageBox.GetComponent<Message>().tip.text = tip;
    }

    private void OnStartFrameSync()
    {
        SDKDebugLogger.Log("广播--游戏帧同步开始");
        Global.state = 1; // 帧同步状态 0停止帧同步，1开始帧同步
        Global.keyOperate = 1; // 按键操作限制 0限制操作，1允许操作
        // 先进入加载
        foreach (PlayerInfo player in Global.Room.roomInfo.Players)
            if (Global.playerId == player.PlayerId)
            {
                if (player.CustomPlayerProperties != null && player.CustomPlayerProperties.Equals("watcher"))
                {
                    Global.isWatcher = true;
                    Route.GoGameView();
                }
                else
                {
                    UnityMainThread.wkr.AddJob(StartLoading);
                }
            }
    }

    private void StartLoading()
    {
        Debug.Log("Enter StartLoading");
        bLoading = true;
        commonHeader.SetActive(false);
        loadingHeader.SetActive(true);
        leaveBtn.GetComponent<Button>().interactable = false;
        UnityMainThread.wkr.AddJob(GetRoomInfo);
        prepareOrStartBtn.GetComponent<Button>().interactable = false;
        InitServerGameData();
        
        // 开始上报自己的加载进度
        ReportPorgress();
    }

    private void InitServerGameData()
    {
        RTInitGameMessage msg = new RTInitGameMessage()
        {
            type = "InitGame",
            planeSize = 0, // 飞机尺寸，圆形，半径为15像素
            planeHp = 0, // 飞机生命值
            bulletSize = 0, // 子弹尺寸，圆形，半径为4像素
            bulletSpeed = 0, // 子弹步长
            playerArr = new[] {new PlaneInitInfo()
            {
                playerId=Global.client.GetPlayerId(),
                direction = FrameSync.FrameSyncCmd.up,
                position = new Position()
                {
                    x = 0, y = 0
                }
            }},
        };

        SendToServerInfo info = new SendToServerInfo()
        {
            Msg = CommonUtils.JsonSerializer(msg)
        };
        Global.Room.SendToServer(info, (res) =>
        {
            if (res == 0)
            {
                Debug.Log("上报游戏初始化成功=" + info.Msg);
            }
            else
            {
                Debug.LogError("上报游戏初始化成功失败");
            }
        });
    }

    private void ReportPorgress()
    {
        float step = 0.1f * ((Random.Range(1, 12345) % 4) + 1);
        float baseValue = isOwner ? ownerProgressValue : commonPlayerProgressValue;
        float sliderValue = baseValue + step > 1 ? 1 : baseValue + step;

        RTMessage rtMsg = new RTMessage();
        rtMsg.type = "Progress";
        rtMsg.playerId = Global.playerId;
        rtMsg.progress = sliderValue;
        rtMsg.platform = "unity3d";

        SendToServerInfo info = new SendToServerInfo()
        {
            Msg = CommonUtils.JsonSerializer(rtMsg)
        };
        Global.Room.SendToServer(info, (res) =>
        {
            if (res == 0)
            {
                Debug.Log("上报加载进度成功" + CommonUtils.JsonSerializer(rtMsg));
            }
            else
            {
                Debug.LogError("上报加载进度失败");
            }
        });
    }
}