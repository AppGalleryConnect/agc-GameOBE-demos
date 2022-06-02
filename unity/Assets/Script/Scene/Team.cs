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
using UnityEngine.UI;
using com.huawei.game.gobes;
using com.huawei.game.gobes.Group;
using com.huawei.game.gobes.utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class Team : MonoBehaviour
{
    public Text ownerName = null;

    public Text playerName = null;

    // 当前玩家数
    public Text playerNum = null;

    // 解散房间
    public Button enableDismissBtn = null;

    // 快速匹配（可用）
    public Button enableMatchBtn = null;

    // 退出队伍
    public Button enableLeaveBtn = null;

    // 队伍code
    public Text teamCodeEditBox = null;

    // 弹框
    public Dialog Dailog;

    // 队员加载
    public Reloading Loading;
    
    // 加载
    public GameObject LoadingPre;

    // 是否是队长
    public bool isOwner = false;
    
    // 跳转页面
    private static Boolean goTeamRoom = false, goHall = false;
    
    public bool Flag = true;

    public bool PlayerMatch = false;
    
    // 定时
    private float interval = 2f; // 每隔2秒执行一次

    // Start is called before the first frame update
    void Start() {
        goHall = false;
        InitListener();
        InvokeRepeating("InitView", 0f, interval);
    }

    void Update()
    {
        if (goHall) {
            goHall = false;
            GoHall();
        }
        if (goTeamRoom) {
            goTeamRoom = false;
            GoTeamRoom();
        }
        if (!Flag) {
            if (isOwner) {
                GameObject loading = GameObject.Find("/loading(Clone)");
                Destroy(loading);
                this.enableMatchBtn.GetComponent<Button>().enabled = true;
                this.enableMatchBtn.GetComponent<Button>().interactable = true;
            }
            else {
                GameObject playerLoading = GameObject.Find("/loading2(Clone)");
                Destroy(playerLoading);
            }
            Flag = true;
        }

        if (PlayerMatch) {
            Reloading loading = Instantiate(Loading);
            loading.Open("队员匹配中...");
            PlayerMatch = false;
        }
    }

    // 页面跳转
    private void GoHall()
    {
        Route.GoHall();
    }

    private void GoTeamRoom()
    {
        Route.GoTeamRoom();
    }

    /**
      * 界面初始化（全量更新）
      */
    void InitView() {
        if (Global.group == null || Global.group.groupInfo == null) {
            return;
        }
        var group = Global.group.groupInfo;
        
        // 队伍code
        if (teamCodeEditBox != null)
        {
            this.teamCodeEditBox.text = group.groupId;
            // 当前玩家数
            this.playerNum.text = group.players == null ? "" : group.players.Length.ToString();
        }
        Debug.Log("队伍code：" + group.groupId);
        PlayerInfo owner = null;
        PlayerInfo player = null;
        if (group.players!= null && group.players.Length > 0) {
            // 获取队长玩家
            PlayerInfo[] players = group.players;
            foreach (PlayerInfo playerInfo in players) {
                if (playerInfo != null) {
                    if (playerInfo.PlayerId == group.ownerId) {
                        // 队长
                        owner = playerInfo;
                    } else {
                        // 非队长
                        player = playerInfo;
                    }
                }
            }
        }
        this.ownerName.text = owner == null ? "?" : owner.CustomPlayerProperties;
        this.playerName.text = player == null ? "?" : player.CustomPlayerProperties;

        // 根据是否队长显示按钮
        if (group.ownerId == Global.playerId) { // 是队长
            this.isOwner = true;
            // 显示“解散队伍”和“快速匹配”按钮
            if (enableMatchBtn == null)
            {
                return;
            }
            this.enableMatchBtn.gameObject.SetActive(true);
            this.enableDismissBtn.gameObject.SetActive(true);
            // 隐藏“退出队伍”按钮
            this.enableLeaveBtn.gameObject.SetActive(false);
        } else {  // 不是队长
            // 隐藏“解散队伍”、“快速匹配”按钮
            this.isOwner = false;
            if (enableMatchBtn == null)
            {
                return;
            }
            this.enableMatchBtn.gameObject.SetActive(false);
            this.enableDismissBtn.gameObject.SetActive(false);
            // 显示“退出队伍”按钮
            this.enableLeaveBtn.gameObject.SetActive(true);
        }

    }
    void InitListener() {
        // 绑定”解散队伍“按钮
        this.enableDismissBtn.onClick.AddListener(() => this.DismissGroup());
        // 绑定”退出队伍“按钮
        this.enableLeaveBtn.onClick.AddListener(() => this.LeaveGroup());
        // 绑定“快速匹配”按钮
        this.enableMatchBtn.onClick.AddListener(() => this.TeamMatch());

        // 监听心跳事件（demo根据不同的事件，对数据或界面更新）
        Global.group.OnDismiss = OnDismiss;
        Global.group.OnLeave = OnLeave;
        Global.group.OnJoin = OnJoin;
        Global.group.OnMatchStart = OnTeamMatch;
    }

    /**
     * 监听“解散队伍”
     */
    public void OnDismiss(ServerEvent serverEvent) {
        Debug.Log("队伍已解散");
        Global.group = null;
        goHall = true;
    }

    /**
     * 监听“退出队伍”
     */
    void OnLeave(ServerEvent serverEvent) {
        if(serverEvent == null) {
            return;
        }
        JObject parseEventParam = null;
        if (serverEvent.EventParam != "") {
            parseEventParam = JsonConvert.DeserializeObject<JObject>(serverEvent.EventParam);
        }

        // 当前操作人id（比如是谁退出了队伍）
        string operatorId = "";
        if (parseEventParam["group"] != null && parseEventParam["group"]["players"] != null &&
            parseEventParam["group"]["players"][0] != null && parseEventParam["group"]["players"][0]["playerId"] != null) {
            operatorId = parseEventParam["group"]["players"][0]["playerId"].ToString();
        }
        if (operatorId == Global.playerId) {  
            // 是本人退出
            goHall = true;
        } else {
            this.UpdateGroup();
        }
    }

    /**
     * 解散队伍
     */
    void DismissGroup() {
        Debug.Log("正在解散队伍");
        DismissGroupConfig dismissGroupConfig = new DismissGroupConfig {
            GroupId = Global.group.GetGroupId()
        };
        Global.client.DismissGroup(dismissGroupConfig, response => {
            if (response.RtnCode == 0) {
                Debug.Log("解散队伍成功");
            }
            else {
                Dialog dia = Instantiate(Dailog);
                dia.Open("提示", "解散队伍失败" + Util.ErrorMessage(response));
            }
        });
    }

    /**
     * 退出队伍
     */
    void LeaveGroup() {
        Debug.Log("正在退出队伍");
        LeaveGroupConfig dismissGroupConfig = new LeaveGroupConfig
        {
            GroupId = Global.group.GetGroupId()
        };
        Global.client.LeaveGroup(dismissGroupConfig, response => {
            if (response.RtnCode == 0) {
                Debug.Log("正在退出队伍");
            } else {
                Dialog dia = Instantiate(Dailog);
                dia.Open("提示", "退出队伍失败" + Util.ErrorMessage(response));
            }
        });
    }


    /**
     * 监听“加入队伍”
     */
    void OnJoin(ServerEvent serverEvent) {
        Debug.Log("加入队伍");
        //更新队伍信息
        this.UpdateGroup();
    }

    /**
    * 监听“组队匹配”--队友
    */
    void OnTeamMatch(ServerEvent serverEvent) {
        Debug.Log("isOwner:" + this.isOwner);
        Debug.Log("心跳：匹配开始通知，serverEvent =" + serverEvent);
        if (!this.isOwner && serverEvent.EventType == "1") {
            // 如果不是队长就弹出匹配中
            PlayerMatch = true;
            PlayerInfo[] players = Global.group.groupInfo.players;
            this.TeamMatchGroup(players);
        }
    }

    /**
     * 快速匹配--队长
     */
    void TeamMatch() {
        GameObject loading = Instantiate(LoadingPre);
        PlayerInfo[] players = Global.group.groupInfo.players;
        this.enableMatchBtn.GetComponent<Button>().enabled = false;
        this.enableMatchBtn.GetComponent<Button>().interactable = false;
        Global.group.GetGroupDetail(response => {
            if (response.RtnCode == 0)
            {
                Global.group = new Group(response.GroupInfo);
                players = response.GroupInfo.players;
                // 组队小队匹配
                this.TeamMatchGroup(players);
            } else {
                Flag = false;
                Debug.Log("快速匹配失败" + Util.ErrorMessage(response));
            }
        });
    }

    private void TeamMatchGroup(PlayerInfo[] players) {
        MatchPlayerInfoParam[] playerInfos = new MatchPlayerInfoParam[players.Length];
        
        for (int i = 0; i < players.Length; i++) {
            MatchPlayerInfoParam matchPlayerInfoParam = new MatchPlayerInfoParam();

            matchPlayerInfoParam.playerId = players[i].PlayerId;

            Dictionary<string, string> matchParams = new Dictionary<string, string>();
            matchParams.Add("level", "2");
            matchPlayerInfoParam.matchParams = matchParams;

            playerInfos[i] = matchPlayerInfoParam;
        }

        MatchGroupConfig matchGroupConfig = new MatchGroupConfig();
        matchGroupConfig.matchCode = Config.matchCode;
        matchGroupConfig.playerInfos = playerInfos;

        PlayerConfig playerConfig = new PlayerConfig();
        playerConfig.CustomPlayerStatus = 0;
        playerConfig.CustomPlayerProperties = Global.playerName;

        try {
            Global.client.MatchGroup(matchGroupConfig, playerConfig, response => {
                Debug.Log("组队匹配中：" + Util.ErrorMessage(response));
                if ((int) ErrorCode.PLAYER_MATCH_CANCELED == response.RtnCode) {
                    // 匹配取消
                    Flag = false;
                }
                // 匹配成功
                else if ((int) ErrorCode.COMMON_OK == response.RtnCode || 
                         (int) ErrorCode.PLAYER_MATCH_CANCEL_WHEN_SUCCESS == response.RtnCode) {
                    Global.room = response.room;
                    goTeamRoom = true;
                }
                else
                // 匹配超时等其他匹配异常
                {
                    Debug.Log("匹配失败：RtnCode = " + Util.ErrorMessage(response));
                    Flag = false;
              
                }
            });
        }  catch (SDKException e) {
            // SDK 报错
            Debug.Log("SDK 报错：" + Util.ExceptionMessage(e));
            Flag = false;
        }
    }

    /**
    * 更新队伍信息
    */
   void UpdateGroup() {
        Global.group.GetGroupDetail(response => {
            if (response.RtnCode == 0) {
                Global.group = new Group(response.GroupInfo);
                Debug.Log("获取最新的队伍信息成功");
                //有人加入队伍，需要刷新页面
                UnityMainThread.wkr.AddJob(InitView);
            } else {
                if (response.RtnCode == 101302)
                {   // 队伍不存在
                    Debug.Log("队伍不存在，返回大厅");
                    goHall = true;
                    return;
                }
                // 退出队伍失败
                Debug.Log("获取最新的队伍信息失败" + Util.ErrorMessage(response));
            }
        });
   }

}
