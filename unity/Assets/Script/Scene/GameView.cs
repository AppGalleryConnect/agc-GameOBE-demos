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
using Newtonsoft.Json;
using com.huawei.game.gobes;
using System.Collections.Generic;
using com.huawei.game.gobes.utils;

public class GameView : MonoBehaviour {

    public Text gameId = null;

    public Text playerId = null;

    public FrameSyncView frameSyncView = null;

    public Reloading Loading = null;

    // 云朵初始帧
    private static int CloudFirstFrame = 100;

    // 出现云朵的频次
    private static readonly int _frequency = 50;

    public Boolean goRoom = false, goHall = false;

    // -1 断线中 0 断线重连 1 重连成功 2 重连失败
    private FrameSync.ReConnectState isReConnect = FrameSync.ReConnectState.reConnectionDefault;

    private float interval = 2f; // 每隔2秒执行一次
    private float count = 0;

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
        #endif
        this.InitView();
        this.InitListener();
    }

    void Update() {
        if (goHall) {
            goHall = false;
            Global.room = null;
            Route.GoHall();
        }
        if (goRoom) {
            goRoom = false;
            Route.GoRoom();
        }

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

        // 断线重连
        if (isReConnect == FrameSync.ReConnectState.reConnection) {
            Reloading loading = Instantiate(Loading);
            loading.Open("重连中...");
            isReConnect = FrameSync.ReConnectState.reConnectIng;
        }

        // 重连失败
        if (isReConnect == FrameSync.ReConnectState.reConnectFail) {
            this.ReLogin();
            Route.GoHall();
            FrameSync.frameSyncPlayerList.Clear();
            isReConnect = FrameSync.ReConnectState.reConnectionDefault;
        }

        // 重连成功
        if (isReConnect == FrameSync.ReConnectState.reConnectSuccess) {
            GameObject loading = GameObject.Find("/loading2(Clone)");
            Destroy(loading);
            isReConnect = FrameSync.ReConnectState.reConnectionDefault;
        }
    }

    void InitView() {
        RoomInfo roomInfo = Global.Room != null ? Global.Room.roomInfo : null;
        if (roomInfo != null) {
            this.gameId.text = roomInfo.roomId;
            this.playerId.text = Global.playerId;
            if (roomInfo.players != null && roomInfo.players.Length != FrameSync.frameSyncPlayerList.Count) {
                FrameSync.ReCalcFrameState();
            }
        }
    }

    void InitListener() {
        if (Global.Room != null) {
            Global.Room.OnRecvFrame = frames => OnRecvFrame(frames);
            Global.Room.OnDismiss = () => OnDismiss();
            Global.Room.OnDisconnect = playerInfo => OnDisconnect(playerInfo);
        }
    }

    // 1秒60帧去处理服务端传过来的帧信息
    public static void RecvFrameHandle(ServerFrameMessage frame) {
        long frameId = frame.CurrentRoomFrameId;
        float seed = frame.Ext != null ? frame.Ext.Seed : 0f;
        // 绘制随机云朵
        GetRandomCloud(frameId, seed);
        if (frame.FrameInfo != null && frame.FrameInfo.Length > 0) {
            if (frame.FrameInfo[0].PlayerId != "0") {
                Debug.Log("接受到帧数据：" + JsonConvert.SerializeObject(frame));
                FrameSync.PushFrames(frame);
                FrameSync.CalcFrame(frame);
            }
        }
    }

    // 绘制随机云朵
    static void GetRandomCloud(long currentRoomFrameId, float seed) {
        if (currentRoomFrameId >= CloudFirstFrame && currentRoomFrameId % _frequency == 0) {
            // 申请随机数，解析随机数，加入云朵
            RandomUtil.InitSeed((long)seed);
            double random = RandomUtil.GetRandom();
            int speed = (int)(random * 100);
            int y = (int)(random * 10000 - speed * 100);
            int x = (int)(random * 1000000 - speed * 10000 - y * 100);
            CloudList<FrameSync.Cloud>.CloudData<FrameSync.Cloud> cloudData =
                new CloudList<FrameSync.Cloud>.CloudData<FrameSync.Cloud>();
            cloudData.x = 0 - (x % Math.Abs(FrameSync._minX));
            cloudData.y = y % FrameSync._maxY;
            cloudData.speed = speed % FrameSync._maxY + 1;
            Debug.Log("seed值:" + seed + " 随机帧id:" + currentRoomFrameId + " 随机数序列:" +
                random + " 云朵数据:" + JsonConvert.SerializeObject(cloudData));
            FrameSync.cloudsList.Add(cloudData);
        }
    }

    // ====================广播====================
    // 获取服务端的帧数据
    void OnRecvFrame(List<ServerFrameMessage> frames) {
        if (frames != null && frames.Count > 0) {
            foreach (ServerFrameMessage frame in frames) {
                if (frame != null) {
                    RecvFrameHandle(frame);
                }
            }
        }
    }

    // 解散房间
    void OnDismiss() {
        Debug.Log("广播--解散房间");
        goHall = true;
    }

    // 断线重连
    void OnDisconnect(FramePlayerInfo playerInfo) {
        Debug.Log("广播--玩家掉线");
        if (playerInfo.PlayerId == Global.playerId) {
            isReConnect = FrameSync.ReConnectState.reConnection;
        }
    }

    void ReConnect() {
       
            // 没有超过重连时间，就进行重连操作
            try {
                Global.Room.Reconnect(response => {
                    if (response.RtnCode == 0) {
                        // 重连成功
                        Debug.Log("重连成功");
                        this.isReConnect = FrameSync.ReConnectState.reConnectSuccess;
                    }
                });
            } catch (SDKException e) {
                SDKDebugLogger.Log(e.Message);
                if (e.code == (int) ErrorCode.INVALID_ROOM || e.code == (int) ErrorCode.PLAYERS_EXCEEDS_ROOM_MAX
                    || e.code == (int) ErrorCode.INVALID_ROOM_STATUS) {
                    // 重连失败
                    Debug.Log("重连失败");
                    this.isReConnect = FrameSync.ReConnectState.reConnectFail;
                } else {
                    SDKDebugLogger.Log("游戏持续重连中...");
                }
            }
        }
    

    void ReLogin() {
        Global.client.Init(response => {});
    }

    void OnDestroy() {
        FrameSync.ClearFrames();
        #if UNITY_ANDROID
        SDKDebugLogger.Log("Unity Android Game End");
        Screen.orientation = ScreenOrientation.Portrait;
        #endif
    }

}
