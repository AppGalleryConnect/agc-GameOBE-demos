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
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Utils;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.UI;

public class AsymmetricRoom : MonoBehaviour
{
    public Text PlayerOneName = null;

    public Text PlayerTwoName = null;

    public Text PlayerThreeName = null;
    
    public Text PlayerFourName = null;

    public Text PlayerOneStatus = null;

    public Text PlayerTwoStatus = null;

    public Text PlayerThreeStatus = null;
    
    public Text PlayerFourStatus = null;

    public Button UnReadyBtnOne = null;

    public Button UnReadyBtnTwo = null;

    public Button UnReadyBtnThree = null;

    public Button UnReadyBtnFour = null;

    public Button ReadyBtnOne = null;

    public Button ReadyBtnTwo = null;

    public Button ReadyBtnThree = null;
    
    public Button ReadyBtnFour = null;

    public Button StartBtn = null;

    public Dialog Dialog = null;
    
    public static readonly int FontSize = 14;
    
    // -1 断线中 0 断线重连 1 重连成功 2 重连失败 
    private FrameSync.ReConnectState isReConnect = FrameSync.ReConnectState.reConnectionDefault;

    public Reloading Loading = null;

    // 定时
    private float interval = 2f; // 每隔2秒执行一次
    private float count = 0;
    
    // Start is called before the first frame update
    void Start()
    {
        InitRoomView();
        InitListener();
        // 由于玩家切换准备状态无法感知，故通过轮询来
        InvokeRepeating("InitRoomView", 0f, interval);
    }

    // Update is called once per frame
    void Update()
    {
        // 定时任务
        count += Time.deltaTime;
        if (count >= interval)
        {
            count = 0;
            if (isReConnect == FrameSync.ReConnectState.reConnectIng)
            {
                ReConnectRoom();
            }
        }
    }

    private void InitListener() {
        // 监听加入房间
        Global.room.OnJoin = playerInfo => OnJoining();
        // 监听开始帧同步
        Global.room.OnStartSyncFrame = () => this.OnStartFrameSync();
        // 断线重连
        Global.room.OnDisconnect = playerInfo => this.OnDisconnect(playerInfo); // 断连监听
        // 离开房间
        Global.room.OnLeave = playerInfo => this.OnLeaving(playerInfo);
    }

    private void InitRoomView() {
        if (Global.room != null)
        {
            Global.room.Update(response =>
            {
                if (response.RtnCode == 0)
                {
                    UnityMainThread.wkr.AddJob(SetRoomView);
                }
            });
        }
    }

    private void SetRoomView()
    {
        this.InitAllBtnActive();
        RoomInfo roomInfo = Global.room != null ? Global.room.roomInfo : null;
        PlayerInfo[] playerInfos = roomInfo.Players;
        Boolean ownerIsRed = true;
        string ownerTeamId ="";
        int allReadyCount = 0;
        int playerNumber = 1;
        for (int i = 0; i < playerInfos.Length; i++)
        {
            if (playerInfos[i].IsRobot == 1)
            {
                playerInfos[i].CustomPlayerStatus = 1;
                playerInfos[i].CustomPlayerProperties = Util.MockRobotNameJson(playerInfos[i].PlayerId);
            }

            if (playerInfos[i].PlayerId == roomInfo.OwnerId)
            {
                // 房主玩家
                ownerTeamId = playerInfos[i].TeamId;
                // 房主在红队还是黄队
                string ownerProperties = playerInfos[i].CustomPlayerProperties;
                AckData ackData = JsonConvert.DeserializeObject<AckData>(ownerProperties);
                int ack = int.Parse(ackData.TeamNumber);
                if (0 < ack && ack < 11)
                {
                    // 房主在黄队：渲染黄队1为房主
                    this.PlayerFourName.text = ackData.PlayerName;
                    this.ReadyBtnFour.gameObject.SetActive(false);
                    this.UnReadyBtnFour.gameObject.SetActive(false);
                    this.PlayerFourStatus.text = "房主";
                    ownerIsRed = false;
                }
                else
                {
                    // 房主在红队：渲染红队1为房主
                    this.PlayerOneName.text = ackData.PlayerName;
                    this.ReadyBtnOne.gameObject.SetActive(false);
                    this.UnReadyBtnOne.gameObject.SetActive(false);
                    this.PlayerOneStatus.text = "房主";

                }
            }
        }
       
        for (int i = 0; i < playerInfos.Length; i++)
        {
          
            //房主为黄队，渲染红队
            if (!ownerIsRed && playerInfos[i].TeamId != ownerTeamId)
            {
                allReadyCount = this.DrawRedPlayer(playerInfos[i], allReadyCount, playerNumber);
                playerNumber++;
            }
            //房主在红队,渲染房主外成员
            if (ownerIsRed && playerInfos[i].TeamId == ownerTeamId && playerInfos[i].PlayerId != roomInfo.OwnerId)
            {
                playerNumber++;
                allReadyCount = this.DrawRedPlayer(playerInfos[i], allReadyCount, playerNumber);
            }
            //房主在红队,渲染黄队
            if (ownerIsRed && playerInfos[i].TeamId != ownerTeamId )
            {
                allReadyCount = this.DrawYellowPlayer(playerInfos[i], allReadyCount);
            }
        }

        // 渲染“开始游戏按钮”
        if (roomInfo.OwnerId != Global.playerId)
        {
            // 非房主
            this.StartBtn.gameObject.SetActive(false);
        }
        else
        {
            //是否当前玩家
            //除了房主以外的3个人准备就绪
            Boolean allReadyStatus = allReadyCount == 3 ? true : false;
            this.StartBtn.gameObject.SetActive(true);
            this.StartBtn.interactable = allReadyStatus;
        }
    }

    //渲染红队玩家
    private int DrawRedPlayer(PlayerInfo player,int  allReadyCount, int playerNumber)
    {
        AckData customPlayerProperties = JsonConvert.DeserializeObject<AckData>(player.CustomPlayerProperties);
        Boolean isPlayerStatus = player.CustomPlayerStatus == 1 ? true : false;
        switch (playerNumber) {
            case 1:
                if (player.IsRobot==1)
                {
                    this.PlayerOneName.fontSize = FontSize;
                    this.PlayerOneName.text = customPlayerProperties.PlayerName;
                }
                else
                { 
                    this.PlayerOneName.text = customPlayerProperties.PlayerName;
                }
                
                if (player.PlayerId == Global.playerId)
                {    // 当前玩家才考虑按钮的显示与隐藏 
                    this.UnReadyBtnOne.gameObject.SetActive(isPlayerStatus);  // "取消准备"按钮激活
                    this.ReadyBtnOne.gameObject.SetActive(!isPlayerStatus); // "准备"按钮隐藏
                }
                this.PlayerOneStatus.text = isPlayerStatus ? "已准备" : "未准备";
                if (isPlayerStatus)
                {
                    allReadyCount++;
                }
                break;
            case 2:
                if (player.IsRobot==1)
                {
                    this.PlayerTwoName.fontSize = FontSize;
                    this.PlayerTwoName.text = customPlayerProperties.PlayerName;
                }
                else
                { 
                    this.PlayerTwoName.text = customPlayerProperties.PlayerName;
                }
                
                if (player.PlayerId == Global.playerId)
                {    // 当前玩家才考虑按钮的显示与隐藏
                    this.UnReadyBtnTwo.gameObject.SetActive(isPlayerStatus);  // "取消准备"按钮激活
                    this.ReadyBtnTwo.gameObject.SetActive(!isPlayerStatus); // "准备"按钮隐藏
                }
                this.PlayerTwoStatus.text = isPlayerStatus ? "已准备" : "未准备";
                if (isPlayerStatus)
                {
                    allReadyCount++;
                }
                break;
            case 3:
                if (player.IsRobot==1)
                {
                    this.PlayerThreeName.fontSize = FontSize;
                    this.PlayerThreeName.text = customPlayerProperties.PlayerName;
                }
                else
                { 
                    this.PlayerThreeName.text = customPlayerProperties.PlayerName;
                }
                if (player.PlayerId == Global.playerId)
                {    // 当前玩家才考虑按钮的显示与隐藏
                    this.UnReadyBtnThree.gameObject.SetActive(isPlayerStatus);  // "取消准备"按钮激活
                    this.ReadyBtnThree.gameObject.SetActive(!isPlayerStatus); // "准备"按钮隐藏
                }
                this.PlayerThreeStatus.text = isPlayerStatus ? "已准备" : "未准备";
                if (isPlayerStatus)
                {
                    allReadyCount++;
                }
                break;
        }

     
        return allReadyCount;
    }
    //渲染黄队玩家
    private int DrawYellowPlayer(PlayerInfo player, int allReadyCount) {
        AckData customPlayerProperties = JsonConvert.DeserializeObject<AckData>(player.CustomPlayerProperties);
        Boolean isPlayerStatus = player.CustomPlayerStatus == 1 ? true : false;
        if (player.IsRobot==1)
        {
            this.PlayerFourName.fontSize = FontSize;
            this.PlayerFourName.text = customPlayerProperties.PlayerName;
        }
        else
        { 
            this.PlayerFourName.text = customPlayerProperties.PlayerName;
        }
        
        if (player.PlayerId == Global.playerId)
        {    // 当前玩家才考虑按钮的显示与隐藏 
            this.UnReadyBtnFour.gameObject.SetActive(isPlayerStatus);  // "取消准备"按钮激活
            this.ReadyBtnFour.gameObject.SetActive(!isPlayerStatus); // "准备"按钮隐藏
        }
        this.PlayerFourStatus.text = isPlayerStatus ? "已准备" : "未准备";
        if (isPlayerStatus)
        {
            allReadyCount++;
        }
        return allReadyCount;
    }

    // 开始组队匹配游戏
    public void StartTeamGame()
    {
        Debug.Log("开始组队匹配游戏");
        Global.room.Update(response => {
            if (response.RtnCode == 0) {
                int readyStatus = 1;
                PlayerInfo[] players = response.RoomInfo.Players;
                foreach (PlayerInfo player in players) {
                    if ( player.IsRobot ==1) {
                        player.CustomPlayerStatus = 1;
                    }

                    if (player.PlayerId != response.RoomInfo.OwnerId) {
                        if (player.CustomPlayerStatus == 0) {
                            readyStatus = 0;
                            return;
                        }
                    }
                }
                if (readyStatus == 0) {
                    Dialog.Open("提示", "还有玩家未准备，请稍后！");
                } else {
                    Global.room.StartFrameSync(res => {
                        if (res.RtnCode == 0) {
                            // 开始帧同步成功
                            UnityMainThread.wkr.AddJob(() => {
                                OnStartFrameSync();
                            });
                            Debug.Log("开始帧同步成功");
                        } else {
                            // 开始帧同步失败
                            Dialog.Open("提示", "开始帧同步失败" + Util.ErrorMessage(res));
                        }
                    });
                }
            }
        });
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



    private void ReConnectRoom() {
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
                        this.ReLogin();
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
                    this.ReLogin();
                    Route.GoHall();
                    isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                });
            } else {
                SDKDebugLogger.Log("玩家持续重连中...");
            }
        }
    }

    private void ReLogin()
    {
        Global.client.Init(response => { });
    }


    //=====================广播=====================
    private void OnLeaving(FramePlayerInfo playerInfo)
    {
        Debug.Log("广播--离开房间");
        if (Global.playerId == playerInfo.PlayerId)
        {
            Global.client.Init(response => {});
            UnityMainThread.wkr.AddJob(() => Route.GoHall());
        }
        else
        {
            this.InitRoomView();
        }
    }

    private void OnDisconnect(FramePlayerInfo playerInfo)
    {
        Debug.Log("广播--组队玩家掉线");
        if (playerInfo.PlayerId == Global.playerId)
        {
            UnityMainThread.wkr.AddJob(() => {
                Reloading loading = Instantiate(Loading);
                loading.Open("重连中...");
                isReConnect = FrameSync.ReConnectState.reConnectIng;
            });
        }
    }

    private void OnStartFrameSync()
    {     
        Debug.Log("广播--开始帧同步");
        Global.state = 1;
        Global.keyOperate = 1;
        UnityMainThread.wkr.AddJob(() => Route.GoGameView());
    }

    private void OnJoining()
    {
        this.InitRoomView();
    }

    /**
    * 主要是为了清空之前的值
    */
    private void InitAllBtnActive(){
        this.PlayerOneName.text = "";
        this.PlayerOneStatus.text = "";
        this.ReadyBtnOne.gameObject.SetActive(false);
        this.UnReadyBtnOne.gameObject.SetActive(false);

        this.PlayerTwoName.text = "";
        this.PlayerTwoStatus.text = "";
        this.ReadyBtnTwo.gameObject.SetActive(false);
        this.UnReadyBtnTwo.gameObject.SetActive(false);

        this.PlayerThreeName.text = "";
        this.PlayerThreeStatus.text = "";
        this.ReadyBtnThree.gameObject.SetActive(false);
        this.UnReadyBtnThree.gameObject.SetActive(false);

        this.PlayerFourName.text = "";
        this.PlayerFourStatus.text = "";
        this.ReadyBtnFour.gameObject.SetActive(false);
        this.UnReadyBtnFour.gameObject.SetActive(false);
    }

}
