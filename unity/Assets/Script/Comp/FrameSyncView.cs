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
using UnityEngine;
using UnityEngine.UI;
using Newtonsoft.Json;
using Com.Huawei.Game.Gobes;
using UnityEngine.SceneManagement;

public class FrameSyncView : MonoBehaviour, ICallback, ReopenCallback
{
    // 上、下、左、右、停止游戏按键
    public Button upButton = null;

    public Button downButton = null;

    public Button leftButton = null;

    public Button rightButton = null;

    public Button stopFrameButton = null;

    public Button fireButton = null;
    // 重开一局预制件
    public ReopenGame reopenGame = null;

    // 重开一局弹框
    public ReopenGameDialog reopenGameDialog = null;

    // 错误提示弹框
    public Dialog dialog = null;

    // 游戏画布
    public GameCanvas gameCanvas = null;

    
    private static int[] arr1 = {-90, 180, 90};
    private static int[] arr2 = {90, -90, 0};
    private static int[] arr3 = {180, 0, -90};
    private static int[] arr4 = {90, 0, 180};
    
 

    // Start is called before the first frame update
    void Start() {
        this.InitView();
        this.InitListener();
        this.InitRobotSchedule();
    }

  

    void InitView() {
        if (Global.Room == null || Global.Room.roomInfo == null ||
            Global.Room.roomInfo.OwnerId != Global.playerId) {
            this.stopFrameButton.gameObject.SetActive(false);
        }
        FrameSync.ReCalcFrameState();
    }

    // Update is called once per frame
    void Update() {
        float dt = Time.deltaTime;
       
        if (Input.GetKeyDown(KeyCode.A)) {
            this.SendFrame(FrameSync.FrameSyncCmd.left);
        }
        if (Input.GetKeyDown(KeyCode.D)) {
            this.SendFrame(FrameSync.FrameSyncCmd.right);
        }
        if (Input.GetKeyDown(KeyCode.W)) {
            this.SendFrame(FrameSync.FrameSyncCmd.up);
        }
        if (Input.GetKeyDown(KeyCode.S)) {
            this.SendFrame(FrameSync.FrameSyncCmd.down);
        }
        if (Input.GetKeyDown(KeyCode.K)) {
            this.SendFireFrame(FrameSync.FrameSyncCmd.fire);
        }
        
        // 绘制玩家
        this.gameCanvas.SetPlayers(FrameSync.frameSyncPlayerList);
        // 绘制云朵
        this.gameCanvas.SetClouds(FrameSync.cloudsList, dt);
        // 绘制子弹
        this.gameCanvas.setBullets(FrameSync.frameSyncBulletList);
        // 绘制圆圈
        this.gameCanvas.SetCircle(GameView.circleDisplay);
    }

    void InitListener() {
        this.upButton.onClick.AddListener(() => {
            this.SendFrame(FrameSync.FrameSyncCmd.up);
        });
        this.downButton.onClick.AddListener(() => {
            this.SendFrame(FrameSync.FrameSyncCmd.down);
        });
        this.leftButton.onClick.AddListener(() => {
            this.SendFrame(FrameSync.FrameSyncCmd.left);
        });
        this.rightButton.onClick.AddListener(() => {
            this.SendFrame(FrameSync.FrameSyncCmd.right);
        });
        this.stopFrameButton.onClick.AddListener(() => {
            this.StopGame();
        });
        this.fireButton.onClick.AddListener(() =>
        {
            this.SendFireFrame(FrameSync.FrameSyncCmd.fire);
        });
        
        if (Global.Room != null) {
            Global.Room.OnStopSyncFrame = () => this.OnStopFrameSync();
            Global.Room.OnLeave = playerInfo => OnLeave(playerInfo);
        }
    }
    
      private void InitRobotSchedule()
    {

        //玩家在线且为房主，调用机器人定时任务执行
        if (Global.state==1 && Global.playerId == Global.Room.roomInfo.OwnerId)
        {
            InvokeRepeating("RobotRandomMove",2f,1f);
        }
    }

    private  void RobotRandomMove()
    {
        
        foreach (PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> player in FrameSync.frameSyncPlayerList)
        {
            if (player.isRobot == 1)
            {
                MockRobotMove(player);
                string frameData = JsonConvert.SerializeObject(player);
                // 调用SDK发送帧数据
                string[] frameDatas = new string[] { frameData };
                Debug.Log("发送机器人帧：" + frameData);
                Global.Room.SendFrame(frameDatas, response => {});
            }
        }
        
    }
    
    private  void MockRobotMove(PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> playerInfo)
    {
        
        switch (playerInfo.state.cmd)
        {
            case FrameSync.FrameSyncCmd.up:
                if(playerInfo.y >= Math.Floor(RandomUtils.GetRandom() * -4)) {
                    SelectRandomRotation(arr1, playerInfo);
                }
                else {
                    playerInfo.y++;
                    playerInfo.state.cmd = FrameSync.FrameSyncCmd.up;
                }
                break;
            case FrameSync.FrameSyncCmd.down:
                if(playerInfo.y <=  Math.Floor(RandomUtils.GetRandom() * 2)) {
                    SelectRandomRotation(arr2, playerInfo);
                }
                else {
                    playerInfo.y--;
                    playerInfo.state.cmd = FrameSync.FrameSyncCmd.down;
                }
                break;
            case FrameSync.FrameSyncCmd.left:
                if(playerInfo.x <= Math.Floor(RandomUtils.GetRandom() * 10)) {
                    SelectRandomRotation(arr3, playerInfo);
                }
                else {
                    playerInfo.x--;
                    playerInfo.state.cmd = FrameSync.FrameSyncCmd.left;
                }
                break;
            case FrameSync.FrameSyncCmd.right:
                if(playerInfo.x >= Math.Floor(RandomUtils.GetRandom() * -7)) {
                    SelectRandomRotation(arr4, playerInfo);
                }
                else {
                    playerInfo.x++;
                    playerInfo.state.cmd = FrameSync.FrameSyncCmd.right;
                }
                break;
                
        }
    }

    private  void SelectRandomRotation(int[] arr,PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> playerInfo)
    {
        int rotation = arr[(int)Math.Floor(RandomUtils.GetRandom() * arr.Length)];
        switch (rotation)
        {
            case 0 :
                playerInfo.y = (playerInfo.y >= FrameSync._maxY ? FrameSync._maxY : ++playerInfo.y);
                playerInfo.state.cmd = FrameSync.FrameSyncCmd.up;
                break;
            case 180 :
                playerInfo.y = (playerInfo.y <= FrameSync._minY ? FrameSync._minY : --playerInfo.y);
                playerInfo.state.cmd = FrameSync.FrameSyncCmd.down;
                break;
            case 90:
                playerInfo.x = (playerInfo.x <= FrameSync._minX ? FrameSync._minX : --playerInfo.x);
                playerInfo.state.cmd = FrameSync.FrameSyncCmd.left;
                break;
            case -90:
                playerInfo.x = (playerInfo.x >= FrameSync._maxX ? FrameSync._maxX : ++playerInfo.x);
                playerInfo.state.cmd = FrameSync.FrameSyncCmd.right;
                break;
        }
    }


    // 调用SDK 发送帧消息
    public void SendFrame(FrameSync.FrameSyncCmd cmd) {
        if (KeyOperateLimit()) {
            return;
        }
        List<PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player>> playerList = FrameSync.frameSyncPlayerList;
        string playerId = Global.playerId;
        if (playerList != null && playerList.Count > 0) {
            for (int i = 0; i < playerList.Count; i++) {
                PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> player = playerList[i];
                if (player.id == playerId) {
                    int x = player.x;
                    int y = player.y;
                    switch (cmd) {
                        case FrameSync.FrameSyncCmd.up:
                            player.y = (y >= FrameSync._maxY ? FrameSync._maxY : ++y);
                            break;
                        case FrameSync.FrameSyncCmd.down:
                            player.y = (y <= FrameSync._minY ? FrameSync._minY : --y);
                            break;
                        case FrameSync.FrameSyncCmd.left:
                            player.x = (x <= FrameSync._minX ? FrameSync._minX : --x);
                            break;
                        case FrameSync.FrameSyncCmd.right:
                            player.x = (x >= FrameSync._maxX ? FrameSync._maxX : ++x);
                            break;
                        default:
                            break;
                    }
                    player.state.cmd = cmd;
                    string frameData = JsonConvert.SerializeObject(player);
                    // 调用SDK发送帧数据
                    string[] frameDatas = new string[] { frameData };
                    Global.Room.SendFrame(frameDatas, response => {});
                    break;
                }
            }
        }
    }

    // 攻击指令帧发送
    void SendFireFrame(FrameSync.FrameSyncCmd cmd)
    {
        if (KeyOperateLimit())
        {
            return;
        }

        List<PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player>> playerList = FrameSync.frameSyncPlayerList;
        string playerId = Global.playerId;
        if (playerList != null && playerList.Count > 0)
        {
            for (int i = 0; i < playerList.Count; i++)
            {
                PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> player = playerList[i];
                if (player.id == playerId)
                {
                    BulletList<FrameSync.Bullet>.BulletData<FrameSync.Bullet> bulletList =
                        new BulletList<FrameSync.Bullet>.BulletData<FrameSync.Bullet>();
                    bulletList.rotation = player.rotation;
                    bulletList.bulletId = Global.bulletId++;
                    bulletList.state = new FrameSync.Bullet();
                    bulletList.state.cmd = cmd;
                    bulletList.playerId = player.id;
                    bulletList.x = player.x;
                    bulletList.y = player.y;
                    // 计算子弹x、y实际大小
                    int x = player.x;
                    int y = player.y;
                    // 子弹在飞机头上方一段距离生成。
                    switch (bulletList.rotation)
                    {
                        case 0: // 向上
                            bulletList.y = ++y;
                            break;
                        case 180: // 向下
                            bulletList.y = --y;
                            break;
                        case 90: // 向左
                            bulletList.x = --x;
                            break;
                        case -90: // 向右
                            bulletList.x = ++x;
                            break;
                    }

                    string frameData = JsonConvert.SerializeObject(bulletList);
                    // 调用SDK发送帧数据
                    string[] frameDatas = new string[] { frameData };
                    Global.Room.SendFrame(frameDatas, response => {});
                    break;
                }
            }
        }
    }

    // 停止游戏
    void StopGame() {
        if (KeyOperateLimit()) {
            return;
        }
        Global.keyOperate = 0;
        ReopenGameDialog dialog = Instantiate(reopenGameDialog);
        // 设置监听器
        dialog.AddEventListener(this);
        // 设置弹框文本
        dialog.Open("提示", "确定要停止游戏？");
    }

    public void Cancel() {
        Debug.Log("取消停止游戏");
        Global.keyOperate = 1;
    }

    public void Confirm() {
        Debug.Log("确认停止游戏");
        // 停止游戏
        StopFrameSync();
    }

    // 停止游戏
    void StopFrameSync() {
        Global.Room.StopFrameSync(response => {
            Debug.Log("停止游戏中");
            if (response.RtnCode != 0) {
                Dialog dia = Instantiate(dialog);
                CancelInvoke("RobotRandomMove");
                dia.Open("提示", "停止帧同步失败" + Util.ErrorMessage(response));
            }
        });
    }

    void ReopenGame() {
        // 调用SDK停止帧同步方法
        ReopenGame doalog = Instantiate(reopenGame);
        // 设置监听器
        doalog.AddEventListener(this);
        doalog.Open("提示", "游戏已结束，还想要重开一局吗？");
    }

    // 重开一局
    public void Reopen() {
        Global.room.Update(response => {
            // 判断玩家是否还在房间内
            RoomInfo room = response.RoomInfo;
            Boolean inroom = IsInRoom(room);
            if (response.RtnCode != 0 || !inroom) {
                Debug.Log("退出房间");
                UnityMainThread.wkr.AddJob(Route.GoHall);
            }
            if (inroom) {
                Debug.Log("重开一局");
                UnityMainThread.wkr.AddJob(Route.GoRoom);
            }
        });
    }

    // 退出房间
    public void Exit() {
        LeaveRoom();
    }

    // 用户是否还在房间中
    Boolean IsInRoom(RoomInfo room) {
        PlayerInfo[] players = room.Players;
        if (players != null && players.Length > 0) {
            foreach (PlayerInfo player in players) {
                if (player.PlayerId == Global.playerId) {
                    return true;
                }
            }
        }
        return false;
    }

    // 按钮操作限制
    Boolean KeyOperateLimit() {
        return Global.keyOperate == 0;
    }
        
    private void Unready() {
        Global.state = 0;
        Global.player.UpdateCustomStatus(0, response => {
            if (response.RtnCode != 0) {
                Dialog dia = Instantiate(dialog);
                dia.Open("提示", "取消准备失败" + Util.ErrorMessage(response));
            }
        });
    }

    void LeaveRoom() {
        Debug.Log("正在退出房间");
        Global.client.LeaveRoom(response => {
            if (response.RtnCode == 0) {
                Debug.Log("退出房间成功");
                if (Global.isTeamMode && !Global.isOnlineMatch) {
                    // 组队匹配
                    UnityMainThread.wkr.AddJob(Route.GoTeam);
                } else {
                    // 在线匹配或者组房模式
                    if (Global.isOnlineMatch) {
                        // 在线匹配
                        Global.isOnlineMatch = false;
                    }
                    UnityMainThread.wkr.AddJob(Route.GoHall);
                }
            } else {
                Dialog dia = Instantiate(dialog);
                dia.Open("提示", "退出房间失败" + Util.ErrorMessage(response));
            }
        });
    }
    
    // 重新计算房间内的人员信息 
    void ReCalPlayers(FramePlayerInfo playerInfo) {
        List<PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player>> players = new 
            List<PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player>>();
        foreach(PlayerList<FrameSync.Player>.PlayerData<FrameSync.Player> player in FrameSync.frameSyncPlayerList) {
            if (player.id != playerInfo.PlayerId) {
                players.Add(player);
            }
        }
        FrameSync.frameSyncPlayerList = players;
    }

    // ====================广播====================
    void OnStopFrameSync() {
        Debug.Log("停止帧同步");
        // 取消准备
        this.Unready();
        if (!Global.isTeamMode) {
            // 房间匹配模式下，需要重开一局
            UnityMainThread.wkr.AddJob(() => {
                this.ReopenGame();
                FrameSync.frameSyncPlayerList.Clear();
                FrameSync.frameSyncBulletList.Clear();
            });
        } else {
            FrameSync.frameSyncPlayerList.Clear();
            FrameSync.frameSyncBulletList.Clear();
            this.LeaveRoom();
        }
    }

    // 离开房间
    void OnLeave(FramePlayerInfo playerInfo) {
        Debug.Log("广播--离开房间");
        // 重新计算房间内的人员信息
        if (playerInfo.PlayerId != Global.playerId) {
            this.ReCalPlayers(playerInfo);
        } else {
            if (Global.isTeamMode && !Global.isOnlineMatch) {
                // 组队匹配
                UnityMainThread.wkr.AddJob(Route.GoTeam);
            } else {
                // 在线匹配或者组房模式
                UnityMainThread.wkr.AddJob(Route.GoHall);
            }
        }
    }

}
