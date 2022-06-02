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
using com.huawei.game.gobes.Room;
using System;
using System.Collections;
using System.Collections.Generic;
using com.huawei.game.gobes.utils;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using static Dialog;


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

    private Boolean IsGame = false;

    private Boolean IsBegin = false;
    
    public Reloading Loading = null;
    
    // -1 断线中 0 断线重连 1 重连成功 2 重连失败 
    private FrameSync.ReConnectState isReConnect = FrameSync.ReConnectState.reConnectionDefault;

    public Boolean goHall = false;
    
    // 定时
    private float interval = 2f; // 每隔2秒执行一次
    private float count = 0;

    // Start is called before the first frame update
    void Start()
    {
        InitRoomView();
        InitListener();
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
        if (IsBegin)
        {
            OnStartFrameSync();
            IsBegin = false;
        }
        if (IsGame) {
            SceneManager.LoadScene("GameView");
            IsGame = false;
        }
        if (goHall) {
            goHall = false;
            GoHall();
        }
        // 断线重连
        if (isReConnect == FrameSync.ReConnectState.reConnection) {
            Reloading loading = Instantiate(Loading);
            loading.Open("重连中...");
            isReConnect = FrameSync.ReConnectState.reConnectIng;
        }
        
        // 重连失败
        if (isReConnect == FrameSync.ReConnectState.reConnectFail) {
            this.ReLogin();
            GoHall();
            isReConnect = FrameSync.ReConnectState.reConnectionDefault;
        }
        
        // 重连成功
        if (isReConnect == FrameSync.ReConnectState.reConnectSuccess) {
            GameObject loading = GameObject.Find("/loading2(Clone)");
            Destroy(loading);
            isReConnect = FrameSync.ReConnectState.reConnectionDefault;
        }
    }
    
    // 页面跳转
    private void GoHall()
    {
        SceneManager.LoadScene("Hall");
    }

    public void InitRoomView()
    {
        if (Global.Room != null)
        {
            Global.room.GetRoomDetail(response =>
            {
                if (response.RtnCode == 0)
                {
                    UnityMainThread.wkr.AddJob(SetRoomView);
                }
            });
        }
    }

    void InitListener() {
        // 监听加入房间
        Global.Room.OnJoin = playerInfo => OnJoining();
        // 监听开始帧同步
        Global.Room.OnStartSyncFrame = () => this.OnStartFrameSync();
        // 断线重连
        Global.Room.OnDisconnect = playerInfo => this.OnDisconnect(playerInfo); // 断连监听
        // 离开房间
        Global.room.OnLeave = playerInfo => this.OnLeaving(playerInfo);
    }

    public void SetRoomView() {
        InitAllBtnActive();
        RoomInfo roomInfo = Global.Room != null ? Global.Room.roomInfo : null;
        Global.player = Global.Room._player;
        bool allPlayersStatus = true;
        if (roomInfo.players.Length > 0) {
            string redTeam = "0";
            ArrayList players = new ArrayList();

            int playerNo = 1;

            for (int i = 0; i < roomInfo.players.Length; i++) {
                PlayerInfo player = roomInfo.players[i];
                // 渲染在线玩家
                if (player.Status == 1) {
                    // 非房主
                    if (player.PlayerId != roomInfo.ownerId)
                    {
                        players.Add(player);
                        if (player.CustomPlayerStatus == 0)
                        {
                            allPlayersStatus = false;
                        }
                    }
                    else {
                        // 房主
                        this.PlayerOwnerName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;
                    }
                }
                if (player.PlayerId == roomInfo.ownerId)
                {
                    redTeam = player.TeamId;
                }

            }
            for (int i = 0; i < players.Count; i++)
            {
                PlayerInfo player = (PlayerInfo)players[i];
                if (player.TeamId == redTeam)
                {
                    this.SetRedPlayer(player);
                }
                else
                {
                    this.SetYellowPlayer(player, playerNo);
                    playerNo = 3;
                }
            }
        }
        if (roomInfo.ownerId != Global.playerId)
        {
            this.StartBtn.gameObject.SetActive(false);
        }
        else
        {
            this.StartBtn.gameObject.SetActive(true);
            this.StartBtn.interactable = allPlayersStatus;
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
                    this.UnReadyBtnOne.gameObject.SetActive(isPlayerStatus);
                    this.ReadyBtnOne.gameObject.SetActive(!isPlayerStatus);     
                }
                this.PlayerOneStatus.text = isPlayerStatus ? "已准备" : "未准备";
                this.PlayerOneName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;


                break;
            case 3:
                if (player.PlayerId == Global.playerId) {
                    this.UnReadyBtnThree.gameObject.SetActive(isPlayerStatus);
                    this.ReadyBtnThree.gameObject.SetActive(!isPlayerStatus);
                }
                this.PlayerThreeStatus.text = isPlayerStatus ? "已准备" : "未准备";
                this.PlayerThreeName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;
                break;
        }
    }

    public void SetRedPlayer(PlayerInfo player) {
        bool isPlayerStatus = player.CustomPlayerStatus == 1 ? true : false;
        if (player.PlayerId == Global.playerId)
        {
            this.UnReadyBtnTwo.gameObject.SetActive(isPlayerStatus);
            this.ReadyBtnTwo.gameObject.SetActive(!isPlayerStatus);
        }
        this.PlayerTwoStatus.text = isPlayerStatus ? "已准备" : "未准备";
        this.PlayerTwoName.text = player.CustomPlayerProperties != null ? player.CustomPlayerProperties : player.PlayerId;
    }

    void ReConnectRoom() {
        // 没有超过重连时间，就进行重连操作
        try {
            // 没有超过重连时间，就进行重连操作
            Global.room.Reconnect(response => {
                if (response.RtnCode == 0) {
                    // 重连成功
                    Debug.Log("玩家重连成功");
                    this.isReConnect = FrameSync.ReConnectState.reConnectSuccess;
                } 
            });
        } catch (SDKException e){
            SDKDebugLogger.Log(e.Message);
            if (e.code == (int) ErrorCode.INVALID_ROOM || e.code == (int) ErrorCode.PLAYERS_EXCEEDS_ROOM_MAX 
                || e.code == (int) ErrorCode.INVALID_ROOM_STATUS) {
                // 重连失败
                Debug.Log("重连失败");
                this.isReConnect = FrameSync.ReConnectState.reConnectFail;
            } else {
                SDKDebugLogger.Log("玩家持续重连中...");
            }
        }
    }

    private void InitAllBtnActive() {
        this.PlayerOneStatus.text = "";
        this.PlayerTwoStatus.text = "";
        this.PlayerThreeStatus.text = "";
        this.ReadyBtnOne.gameObject.SetActive(false);
        this.ReadyBtnTwo.gameObject.SetActive(false);
        this.ReadyBtnThree.gameObject.SetActive(false);
        this.UnReadyBtnOne.gameObject.SetActive(false);
        this.UnReadyBtnTwo.gameObject.SetActive(false);
        this.UnReadyBtnThree.gameObject.SetActive(false);
        this.StartBtn.gameObject.SetActive(false);
        this.PlayerOwnerName.text = "";
        this.PlayerOneName.text = "";
        this.PlayerTwoName.text = "";
        this.PlayerThreeName.text = "";
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
                this.InitRoomView();
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
                this.InitRoomView();
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
        Global.room.GetRoomDetail(response => {
            if (response.RtnCode == 0)
            {
                int readyStatus = 1;
                PlayerInfo[] players = response.RoomInfo.players;
                foreach (PlayerInfo player in players)
                {
                    if (player.PlayerId != response.RoomInfo.ownerId)
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
                            IsBegin = true;
                            Debug.Log("开始帧同步成功");
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

    void ReLogin() { 
        Global.client.Init(response => {});
    }

    // ====================广播====================
    void OnJoining()
    {
        this.InitRoomView();
    }

    void OnLeaving(FramePlayerInfo playerInfo)
    {
        Debug.Log("广播--离开房间");
        if (Global.playerId == playerInfo.PlayerId)
        {
            this.ReLogin();
            goHall = true;
        }
        else
        {
            this.InitRoomView();
        }
    }

    void OnDisconnect(FramePlayerInfo playerInfo) {
        Debug.Log("广播--组队玩家掉线");
        if (playerInfo.PlayerId == Global.playerId)
        {
            isReConnect = FrameSync.ReConnectState.reConnection;
        }
    }

    void OnStartFrameSync()
    {
        Debug.Log("开始帧同步");
        Global.state = 1;
        Global.keyOperate = 1;
        this.IsGame = true; 
    }

}
