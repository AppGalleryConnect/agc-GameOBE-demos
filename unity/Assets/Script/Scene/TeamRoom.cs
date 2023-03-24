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



using Com.Huawei.Game.Gobes;
using System.Collections;
using Com.Huawei.Game.Gobes.Store;
using Com.Huawei.Game.Gobes.Utils;
using UnityEngine;
using UnityEngine.UI;

public class TeamRoom : MonoBehaviour
{

    public Text PlayerOwnerName = null;

    public Text PlayerOneName = null;

    public Text PlayerTwoName = null;

    public Text PlayerThreeName = null;

    public Text PlayerOneStatus = null;

    public Text PlayerTwoStatus = null;

    public Text PlayerThreeStatus = null;

    public Button UnReadyBtnOne = null;

    public Button UnReadyBtnTwo = null;

    public Button UnReadyBtnThree = null;

    public Button ReadyBtnOne = null;

    public Button ReadyBtnTwo = null;

    public Button ReadyBtnThree = null;

    public Button StartBtn = null;

    public Button DisableStartBtn = null;

    public Dialog Dialog = null;

    public Reloading Loading = null;

    public static readonly int FontSize = 14;

    
    // -1 断线中 0 断线重连 1 重连成功 2 重连失败 
    private FrameSync.ReConnectState isReConnect = FrameSync.ReConnectState.reConnectionDefault;

    // 定时
    private float interval = 2f; // 每隔2秒执行一次
    private float count = 0;

    // Start is called before the first frame update
    void Start()
    {
        InitRoomView();
        InitListener();
        if(Global.Room.roomInfo.RoomStatus ==(int)RoomStatus.SYNCING ) {
            OnStartFrameSync();
        }
    }

    // ====================刷新房间信息====================
    // Update is called once per frame
    void Update()
    {
        // 定时任务
        count += Time.deltaTime;
        if (count >= interval)
        {
            count = 0;
            InitRoomView();
            if (isReConnect == FrameSync.ReConnectState.reConnectIng)
            {
                ReConnectRoom();
            }
        }
    }

    public void InitRoomView()
    {
        if (Global.Room != null)
        {
            Global.Room.Update(response =>
            {
                if (response.RtnCode == 0)
                {
                    UnityMainThread.wkr.AddJob(SetRoomView);
                }
            });
        }
    }

    void InitListener() {
        Util.SaveRoomType(FrameSync.RoomType.TEAMROOM);
        // 监听加入房间
        Global.Room.OnJoin = playerInfo => OnJoining();
        // 监听开始帧同步
        Global.Room.OnStartSyncFrame = () => OnStartFrameSync();
        // 断线重连
        Global.Room.OnDisconnect = playerInfo => OnDisconnect(playerInfo); // 断连监听
        // 离开房间
        Global.room.OnLeave = playerInfo => OnLeaving(playerInfo);
    }

    public void SetRoomView() {
        InitAllBtnActive();
        RoomInfo roomInfo = Global.Room != null ? Global.Room.roomInfo : null;
        Global.player = Global.Room._player;
        bool allPlayersStatus = true;
        if (roomInfo.Players.Length > 0) {
            string redTeam = "0";
            ArrayList players = new ArrayList();

            int playerNo = 1;

            for (int i = 0; i < roomInfo.Players.Length; i++) {
                PlayerInfo player = roomInfo.Players[i];
                if (player.IsRobot == 1)
                {
                    player.CustomPlayerStatus = 1;
                    player.CustomPlayerProperties = player.RobotName;
                }

                // 渲染在线玩家
  
                    // 非房主
                    if (player.PlayerId != roomInfo.OwnerId)
                    {
                        players.Add(player);
                        if (player.CustomPlayerStatus == 0)
                        {
                            allPlayersStatus = false;
                        }
                    }
                    else {
                        // 房主
                        PlayerOwnerName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;
                    }
                
                if (player.PlayerId == roomInfo.OwnerId)
                {
                    redTeam = player.TeamId;
                }

            }
            for (int i = 0; i < players.Count; i++)
            {
                PlayerInfo player = (PlayerInfo)players[i];
                if (player.TeamId == redTeam)
                {
                    SetRedPlayer(player);
                }
                else
                {
                    SetYellowPlayer(player, playerNo);
                    playerNo = 3;
                }
            }
        }
        if (roomInfo.OwnerId != Global.playerId)
        {
            StartBtn.gameObject.SetActive(false);
        }
        else
        {
            StartBtn.gameObject.SetActive(true);
            StartBtn.interactable = allPlayersStatus;
        }
    }

    public void SetYellowPlayer(PlayerInfo player, int playerNo)
    {
        bool isPlayerStatus = player.CustomPlayerStatus == 1 ? true :false;
        string playerStatus = player.CustomPlayerProperties;

        switch (playerNo)
        {
            case 1:

                if (player.PlayerId == Global.playerId) {
                    UnReadyBtnOne.gameObject.SetActive(isPlayerStatus);
                    ReadyBtnOne.gameObject.SetActive(!isPlayerStatus);     
                }
                PlayerOneStatus.text = isPlayerStatus ? "已准备" : "未准备";
                if (player.IsRobot==1)
                {
                    PlayerOneName.fontSize = FontSize;
                }
                PlayerOneName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;
                break;
            case 3:
                if (player.PlayerId == Global.playerId) {
                    UnReadyBtnThree.gameObject.SetActive(isPlayerStatus);
                    ReadyBtnThree.gameObject.SetActive(!isPlayerStatus);
                }
                PlayerThreeStatus.text = isPlayerStatus ? "已准备" : "未准备";
                if (player.IsRobot==1)
                {
                    PlayerThreeName.fontSize = FontSize;
                }
                PlayerThreeName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;
                break;
        }
    }

    public void SetRedPlayer(PlayerInfo player) {
        bool isPlayerStatus = player.CustomPlayerStatus == 1 ? true : false;
        if (player.PlayerId == Global.playerId)
        {
            UnReadyBtnTwo.gameObject.SetActive(isPlayerStatus);
            ReadyBtnTwo.gameObject.SetActive(!isPlayerStatus);
        }
        PlayerTwoStatus.text = isPlayerStatus ? "已准备" : "未准备";
        if (player.IsRobot==1)
        {
            PlayerTwoName.fontSize = FontSize;
        }
        PlayerTwoName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;
    }

    void ReConnectRoom() {
        // 没有超过重连时间，就进行重连操作
        try {
            // 没有超过重连时间，就进行重连操作
            Global.room.Reconnect(response => {
                if (response.RtnCode == 0) {
                    // 重连成功
                    Debug.Log("玩家重连成功");
                    UnityMainThread.wkr.AddJob(() => {
                        GameObject loading = GameObject.Find("/loading2(Clone)");
                        Destroy(loading);
                        isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                    });
                }
                if (response.RtnCode == ((int)ErrorCode.SDK_NOT_IN_ROOM))
                {
                    Debug.Log("玩家重连失败");
                    UnityMainThread.wkr.AddJob(() => {
                        Route.GoHall();
                        isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                    });
                }
            });
        } catch (SDKException e){
            SDKDebugLogger.Log(e.Message);
            if (e.code == (int) ErrorCode.INVALID_ROOM || e.code == (int) ErrorCode.PLAYERS_EXCEEDS_ROOM_MAX 
                || e.code == (int) ErrorCode.INVALID_ROOM_STATUS) {
                // 重连失败
                Debug.Log("重连失败");
                UnityMainThread.wkr.AddJob(() => {
                    Route.GoHall();
                    isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                });
            } else {
                SDKDebugLogger.Log("玩家持续重连中...");
            }
        }
    }

    private void InitAllBtnActive() {
        PlayerOneStatus.text = "";
        PlayerTwoStatus.text = "";
        PlayerThreeStatus.text = "";
        ReadyBtnOne.gameObject.SetActive(false);
        ReadyBtnTwo.gameObject.SetActive(false);
        ReadyBtnThree.gameObject.SetActive(false);
        UnReadyBtnOne.gameObject.SetActive(false);
        UnReadyBtnTwo.gameObject.SetActive(false);
        UnReadyBtnThree.gameObject.SetActive(false);
        StartBtn.gameObject.SetActive(false);
        PlayerOwnerName.text = "";
        PlayerOneName.text = "";
        PlayerTwoName.text = "";
        PlayerThreeName.text = "";
    }

    // 准备
    public void Ready()
    {
        Debug.Log("准备");
        int ready = 1;
        Global.player.UpdateCustomStatus(ready, response =>
        {
            if (response.RtnCode == 0) {
                // 修改玩家自定义状态
                InitRoomView();
            } else {
                // 修改玩家自定义状态失败
                Dialog.Open("提示", "准备就绪失败" + Util.ErrorMessage(response));
            }
        });
    }

    // 取消准备
    public void CancelReady(){
        Debug.Log("取消准备");
        int unready = 0;
        Global.player.UpdateCustomStatus(unready, response =>
        {
            if (response.RtnCode == 0)
            {
                // 修改玩家自定义状态
                InitRoomView();
            } else {
                // 修改玩家自定义状态失败
                Dialog.Open("提示", "取消准备失败" + Util.ErrorMessage(response));
            }
        });
    }

    // 开始组队匹配游戏
    public void StartTeamGame()
    {
        Debug.Log("开始组队匹配游戏");
        Global.Room.Update(response => {
            if (response.RtnCode == 0)
            {
                int readyStatus = 1;
                PlayerInfo[] players = response.RoomInfo.Players;
                foreach (PlayerInfo player in players)
                {
                    if (player.IsRobot == 1)
                    {
                        player.CustomPlayerStatus = 1;
                    }

                    if (player.PlayerId != response.RoomInfo.OwnerId)
                    {
                        if (player.CustomPlayerStatus == 0)
                        {
                            readyStatus = 0;
                            return;
                        }
                    }
                }
                if (readyStatus == 0)
                {
                    Dialog.Open("提示", "还有玩家未准备，请稍后！");
                }
                else
                {
                    Global.room.StartFrameSync(res => {
                        if (res.RtnCode == 0)
                        {
                            // 开始帧同步成功
                            Debug.Log("开始帧同步成功");
                            UnityMainThread.wkr.AddJob(() => {
                                OnStartFrameSync();
                            });
                        }
                        else
                        {
                            // 开始帧同步失败
                            Dialog.Open("提示", "开始帧同步失败" + Util.ErrorMessage(res));
                        }
                    });
                }
            }
        });
    }
    

    // ====================广播====================
    void OnJoining()
    {
        InitRoomView();
    }

    void OnLeaving(FramePlayerInfo playerInfo)
    {
        Debug.Log("广播--离开房间");
        if (Global.playerId == playerInfo.PlayerId)
        {
            UnityMainThread.wkr.AddJob(Route.GoHall);
        }
        else
        {
            InitRoomView();
        }
    }

    void OnDisconnect(FramePlayerInfo playerInfo) {
        Debug.Log("广播--组队玩家掉线");
        if (playerInfo.PlayerId == Global.playerId) {
            UnityMainThread.wkr.AddJob(() => {
                Reloading loading = Instantiate(Loading);
                loading.Open("重连中...");
                isReConnect = FrameSync.ReConnectState.reConnectIng;
            });
        }
    }

    void OnStartFrameSync() {
        Debug.Log("开始帧同步");
        Global.state = 1;
        Global.keyOperate = 1;
        UnityMainThread.wkr.AddJob(Route.GoGameView);
    }

}
