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
using System.Collections.Generic;
using Com.Huawei.Game.Gobes.Utils;

public class GameView : MonoBehaviour {

    public Text gameId = null;

    public Text playerId = null;

    public FrameSyncView frameSyncView = null;

    public Reloading Loading = null;

    // 云朵初始帧
    private static int CloudFirstFrame = 100;

    // 出现云朵的频次
    private static readonly int _frequency = 50;
    
    // 圆圈显隐状态
    public static bool circleDisplay = true;

    public Boolean active = false;
    // -1 断线中 0 断线重连 1 重连成功 2 重连失败
    private FrameSync.ReConnectState isReConnect = FrameSync.ReConnectState.reConnectionDefault;

    private float interval = 2f; // 每隔2秒执行一次
    private float count = 0;

    public static List<ServerFrameMessage> frameMessages = new List<ServerFrameMessage>();

    // Start is called before the first frame update
    void Start() {
        Debug.Log("游戏进入刚开始调用方法start");
        #if UNITY_ANDROID
        SDKDebugLogger.Log("Unity Android Game Begin");
        Screen.orientation = ScreenOrientation.LandscapeRight;
        Screen.autorotateToLandscapeLeft = true;
        Screen.autorotateToLandscapeRight = true;
        Screen.autorotateToPortrait = false;
        Screen.autorotateToPortraitUpsideDown = false;
        Screen.sleepTimeout = SleepTimeout.NeverSleep;
        #endif
        InitView();
        InitListener();
    }

    void Update() {
        // 定时任务
        count += Time.deltaTime;
        if (count >= interval)
        {
            count = 0;
            if (isReConnect == FrameSync.ReConnectState.reConnectIng)
            {
                ReConnect();
            }
        }
        BatchRecvFrame(frameMessages);
    }

    void InitView() {
        RoomInfo roomInfo = Global.Room != null ? Global.Room.roomInfo : null;
        if (roomInfo != null) {
            gameId.text = roomInfo.RoomId;
            playerId.text = Global.playerId;
            if (roomInfo.Players != null && roomInfo.Players.Length != FrameSync.frameSyncPlayerList.Count) {
                FrameSync.ReCalcFrameState();
            }
        }
    }

    void InitListener() {
        if (Global.Room != null) {
            Global.Room.OnRecvFrame = frames => OnRecvFrame(frames);
            Global.Room.OnDismiss = () => OnDismiss();
            Global.Room.OnDisconnect = playerInfo => OnDisconnect(playerInfo);
            Global.Room.OnRequestFrameError = response => OnRequestFrameError(response);
        }
    }

    private void OnRequestFrameError(BaseResponse response)
    {
        if (response.RtnCode == (int)ErrorCode.CLIENT_COMMON_ERR)
        {
            UnityMainThread.wkr.AddJob(() =>
            {
                Reloading loading = Instantiate(Loading);
                loading.Open("重连中...");
                isReConnect = FrameSync.ReConnectState.reConnectIng;
            });
        }

        if (response.RtnCode == (int)ErrorCode.SDK_AUTO_REQUEST_FRAME_FAILED)
        {
            
            UnityMainThread.wkr.AddJob(() =>
            {
                if (!string.IsNullOrEmpty(Global.room.roomInfo.CustomRoomProperties) && Global.state == 1 )
                {
                    //初始化页面
                    string data = Global.room.roomInfo.CustomRoomProperties;
                    SaveToPropertiesInfo saveToPropertiesInfo = CommonUtils.JsonDeserializer<SaveToPropertiesInfo>(data);
                    List<PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player>> playerList = saveToPropertiesInfo.playerList;
      
                    foreach (PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> player in playerList)
                    {
                        FrameSync.SetPlayerCMD(player.id, player.state.cmd, player.x, player.y);
                    }
                    Global.client.ResetRoomFrameId(saveToPropertiesInfo.currentRoomFrameId, response =>
                    {
                        if (response.RtnCode!=0)
                        {
                            SDKDebugLogger.Log("重置房间帧id失败,code={0},failMsg={1}",response.RtnCode,response.Msg);
                        }
                        SDKDebugLogger.Log("重置房间帧id={0}",saveToPropertiesInfo.currentRoomFrameId);
                    });
                }
            });
        }
    }

    public static void UpdateCircleActive()
    {
        GameObject circle = GameObject.Find("Canvas/Content/FrameSync/GameCanvas/CircleSpecial").gameObject;
        Debug.Log("circle.activeSelf1:"+circle.activeSelf);
        if(circle.activeSelf.Equals(true))
        {
            Debug.Log("circle.activeSelf2:"+circle.activeSelf);
            circle.SetActive(false);
        }else{
            Debug.Log("circle.activeSelf3:"+circle.activeSelf);
            circle.SetActive(true);
            circle.GetComponent<Renderer>().material.color = Color.yellow;
        }
    }

    public static void UpdateBulletFly()
    {
        FrameSync.frameSyncBulletList.ForEach(bullet =>
        {
            // 计算移动后的 x、y
            int x= 0;
            int y= 0;
            switch (bullet.rotation) {
                case 0: // 向上
                    y = ++bullet.y;
                    x = bullet.x;
                    break;
                case 180: // 向下
                    y = --bullet.y;
                    x = bullet.x;
                    break;
                case 90: // 向左
                    x = --bullet.x;
                    y = bullet.y;
                    break;
                case -90: // 向右
                    x = ++bullet.x;
                    y = bullet.y;
                    break;
            }
            bullet.x = x;
            bullet.y = y;
        });
    }

    // 1秒60帧去处理服务端传过来的帧信息
    public static void RecvFrameHandle(ServerFrameMessage frame) {
        long frameId = frame.CurrentRoomFrameId;
        Global.currentRoomFrameId =  frame.CurrentRoomFrameId;
        //显示圆圈，持续100帧秒后消失
        if(frameId % 150 == 0)
        {
            circleDisplay = true;
        }
        if(frameId % 150 == 100)
        {
            circleDisplay = false;
        }
        
        //更新子弹
        if(frameId % 10 == 0){
            UpdateBulletFly();
        }
        
        float seed = frame.Ext != null ? frame.Ext.Seed : 0f;
        // 绘制随机云朵
        GetRandomCloud(frameId, seed);
        if (frame.FrameInfo != null && frame.FrameInfo.Length > 0) {
            Debug.Log("接受到帧数据：" + CommonUtils.JsonSerializer(frame));
            if (frame.FrameInfo[0].PlayerId != "0") {
                FrameSync.PushFrames(frame);
                FrameSync.CalcFrame(frame);
            }
        }
    }

    // 绘制随机云朵
    static void GetRandomCloud(long currentRoomFrameId, float seed) {
        if (currentRoomFrameId >= CloudFirstFrame && currentRoomFrameId % _frequency == 0) {
            // 申请随机数，解析随机数，加入云朵
            RandomUtils.InitSeed((long)seed);
            double random = RandomUtils.GetRandom();
            int speed = (int)(random * 100);
            int y = (int)(random * 10000 - speed * 100);
            int x = (int)(random * 1000000 - speed * 10000 - y * 100);
            CloudList<FrameSync.Cloud>.CloudData<FrameSync.Cloud> cloudData =
                new CloudList<FrameSync.Cloud>.CloudData<FrameSync.Cloud>();
            cloudData.x = 0 - (x % Math.Abs(FrameSync._minX));
            cloudData.y = y % FrameSync._maxY;
            cloudData.speed = speed % FrameSync._maxY + 1;
            Debug.Log("seed值:" + seed + " 随机帧id:" + currentRoomFrameId + " 随机数序列:" +
                random + " 云朵数据:" + CommonUtils.JsonSerializer(cloudData));
            FrameSync.cloudsList.Add(cloudData);
        }
    }

    // ====================广播====================
    // 获取服务端的帧数据
    void OnRecvFrame(List<ServerFrameMessage> frames)
    {
        //frameMessages = frames;
         if (frames != null && frames.Count > 0) {
             foreach (ServerFrameMessage frame in frames) {
                 if (frame != null) {
                     frameMessages.Add(frame);//RecvFrameHandle(frame);
                 }
             }
         }
    }

    void BatchRecvFrame(List<ServerFrameMessage> frames)
    {
        if (frames != null && frames.Count > 0)
        {
            if (frames.Count>1)
            {
                Debug.Log("处理多帧++++++++++++++");
                for (int i=0 ;i<Global.handleFrameRate;i++) {
                    if (i<frames.Count)
                    {
                        RecvFrameHandle(frames[i]);
                        frames.RemoveAt(i);
                        frameMessages = frames;
                    }
                }
            }
            else
            {
                if (frames[0] != null) {
                    RecvFrameHandle(frames[0]);
                    frameMessages.Clear();
                }
            }

        }
    }
    
    // 解散房间
    void OnDismiss() {
        Debug.Log("广播--解散房间");
        if (Global.isReconnect)
        {
            UnityMainThread.wkr.AddJob(Route.GoHall); 
        }
        if (Global.isTeamMode && !Global.isOnlineMatch) {
            // 组队匹配
            UnityMainThread.wkr.AddJob(Route.GoTeam);
        } else {
            // 在线匹配或者是组房匹配
            UnityMainThread.wkr.AddJob(Route.GoHall);
        }
    }

    // 断线重连
    void OnDisconnect(FramePlayerInfo playerInfo) {
        Debug.Log("广播--玩家掉线");
        if (playerInfo.PlayerId == Global.playerId) {
            UnityMainThread.wkr.AddJob(() => {
                Reloading loading = Instantiate(Loading);
                loading.Open("重连中...");
                isReConnect = FrameSync.ReConnectState.reConnectIng;
            });
        }
    }

    void ReConnect() {
        // 没有超过重连时间，就进行重连操作
        try {
            Global.Room.Reconnect(response => {
                if (response.RtnCode == 0) {
                    // 重连成功
                    Debug.Log("重连成功");
                    UnityMainThread.wkr.AddJob(() => {
                        GameObject loading = GameObject.Find("/loading2(Clone)");
                        Destroy(loading);
                        isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                    });
                }
                if (response.RtnCode == ((int)ErrorCode.SDK_NOT_IN_ROOM))
                {
                    Debug.Log("重连失败");
                    UnityMainThread.wkr.AddJob(() => {
                        Route.GoHall();
                        FrameSync.frameSyncPlayerList.Clear();
                        isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                    });
                }
            });
        } catch (SDKException e) {
            SDKDebugLogger.Log(e.Message);
            if (e.code == (int) ErrorCode.INVALID_ROOM || e.code == (int) ErrorCode.PLAYERS_EXCEEDS_ROOM_MAX
                || e.code == (int) ErrorCode.INVALID_ROOM_STATUS) {
                // 重连失败
                Debug.Log("重连失败");
                UnityMainThread.wkr.AddJob(() => {
                    Route.GoHall();
                    FrameSync.frameSyncPlayerList.Clear();
                    isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                });
            } else {
                SDKDebugLogger.Log("游戏持续重连中...");
            }
        }
    }

 

    void OnDestroy() {
        FrameSync.ClearFrames();
        #if UNITY_ANDROID
        SDKDebugLogger.Log("Unity Android Game End");
        Screen.orientation = ScreenOrientation.Portrait;
        Screen.sleepTimeout = SleepTimeout.SystemSetting;
        #endif
    }

}
