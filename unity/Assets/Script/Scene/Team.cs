/**
 * Copyright 2024. Huawei Technologies Co., Ltd. All rights reserved.
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

using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Utils;

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

    // 踢人
    public Button enableKickBtn = null;

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

    public bool Flag = true;

    // -1 断线中 0 断线重连 1 重连成功 2 重连失败
    private FrameSync.ReConnectState isReConnect = FrameSync.ReConnectState.reConnectionDefault;

    // 定时
    private float interval = 2f; // 每隔2秒执行一次

    private float count = 0;

    // Start is called before the first frame update
    void Start() {
        InitListener();
        Invoke("InitView", 0f);
    }

    void Update()
    {
        if (!Flag) {
            if (isOwner) {
                GameObject loading = GameObject.Find("/loading(Clone)");
                Destroy(loading);
                enableMatchBtn.GetComponent<Button>().enabled = true;
                enableMatchBtn.GetComponent<Button>().interactable = true;
            }
            else {
                GameObject playerLoading = GameObject.Find("/loading2(Clone)");
                Destroy(playerLoading);
            }
            Flag = true;
        }

        // 定时任务
        count += Time.deltaTime;
        if (count >= interval)
        {
            count = 0;
            InitView();
            if (isReConnect == FrameSync.ReConnectState.reConnectIng)
            {
                ReConnectGroup();
            }
        }
    }

    void ReConnectGroup() {
        try {
            Global.group.Reconnect(response => {
                if (response.RtnCode == 0) {
                    // 重连成功
                    Debug.Log("玩家重连小队成功");
                    UnityMainThread.wkr.AddJob(() => {
                        GameObject loading = GameObject.Find("/loading2(Clone)");
                        Destroy(loading);
                        isReConnect = FrameSync.ReConnectState.reConnectionDefault;
                    });
                }
            });
        } catch (SDKException e){
            SDKDebugLogger.Log(e.Message);
            if (e.code == (int) ErrorCode.GROUP_NOT_EXIST || e.code == (int) ErrorCode.CURRENT_GROUP_IS_LOCKED
                                                          || e.code == (int) ErrorCode.CURRENT_GROUP_IS_FULL) {
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
            teamCodeEditBox.text = group.GroupId;
            // 当前玩家数
            playerNum.text = group.Players == null ? "" : group.Players.Length.ToString();
        }
        Debug.Log("队伍code：" + group.GroupId);
        PlayerInfo owner = null;
        PlayerInfo player = null;
        if (group.Players!= null && group.Players.Length > 0) {
            // 获取队长玩家
            PlayerInfo[] players = group.Players;
            foreach (PlayerInfo playerInfo in players) {
                if (playerInfo != null) {
                    if (playerInfo.PlayerId == group.OwnerId) {
                        // 队长
                        owner = playerInfo;
                    } else {
                        // 非队长
                        player = playerInfo;
                    }
                }
            }
        }
        ownerName.text = owner == null ? "?" : owner.CustomPlayerProperties;
        playerName.text = player == null ? "?" : player.CustomPlayerProperties;

        // 根据是否队长显示按钮
        if (group.OwnerId == Global.playerId) { // 是队长
            isOwner = true;
            // 显示“解散队伍”和“快速匹配”按钮
            if (enableMatchBtn == null)
            {
                return;
            }
            enableMatchBtn.gameObject.SetActive(true);
            enableDismissBtn.gameObject.SetActive(true);
            enableKickBtn.gameObject.SetActive(true);
            // 隐藏“退出队伍”按钮
            enableLeaveBtn.gameObject.SetActive(false);
        } else {  // 不是队长
            // 隐藏“解散队伍”、“快速匹配”按钮
            isOwner = false;
            if (enableMatchBtn == null)
            {
                return;
            }
            enableMatchBtn.gameObject.SetActive(false);
            enableDismissBtn.gameObject.SetActive(false);
            enableKickBtn.gameObject.SetActive(false);
            // 显示“退出队伍”按钮
            enableLeaveBtn.gameObject.SetActive(true);
        }

        if (group.Players.Length == 1)
        {
            enableKickBtn.gameObject.SetActive(false);
        }

    }
    void InitListener() {
        // 绑定”解散队伍“按钮
        enableDismissBtn.onClick.AddListener(() => DismissGroup());
        // 绑定”退出队伍“按钮
        enableLeaveBtn.onClick.AddListener(() => LeaveGroup());
        // 绑定“快速匹配”按钮
        enableMatchBtn.onClick.AddListener(() => TeamMatch());
        // 绑定”踢人“按钮
        enableKickBtn.onClick.AddListener(() => kickPlayer());

        // 监听心跳事件（demo根据不同的事件，对数据或界面更新）
        Global.group.OnDismiss = OnDismiss;
        Global.group.OnLeave = playerInfo => OnLeave(playerInfo);
        Global.group.OnJoin = playerInfo => OnJoin(playerInfo);
        Global.group.OnMatchStart = OnTeamMatch;
        Global.group.OnUpdate = groupInfo => OnUpdate(groupInfo);
        Global.group.OnDisconnect = playerInfo => OnDisconnect(playerInfo);
    }

    /**
     * 监听“小队断线”
     */
    private void OnDisconnect(FramePlayerInfo playerInfo)
    {
        Debug.Log("广播--小队玩家掉线");
        if (playerInfo.PlayerId == Global.playerId) {
            UnityMainThread.wkr.AddJob(() => {
                Reloading loading = Instantiate(Loading);
                loading.Open("小队重连中...");
                isReConnect = FrameSync.ReConnectState.reConnectIng;
            });
        }
    }

    /**
     * 监听“更新队伍”
     */
    private void OnUpdate(GroupInfo groupInfo)
    {
       // 刷新页面
       SDKDebugLogger.Log("Receive GroupMessage OnUpdate");
       UnityMainThread.wkr.AddJob(InitView);
    }

    /**
     * 监听“解散队伍”
     */
    public void OnDismiss()
    {
        SDKDebugLogger.Log("Receive GroupMessage OnDismiss , groupId:{0}", Global.client.GetGroupId());
        UnityMainThread.wkr.AddJob(Route.GoHall);
    }

    /**
     * 监听“退出队伍”
     */
    void OnLeave(FramePlayerInfo playerInfo) {
        SDKDebugLogger.Log("Receive GroupMessage OnLeave , groupId:{0} , playerInfo:{1}",Global.client.GetGroupId(), playerInfo.PlayerId);
        if(playerInfo == null) {
            return;
        }
        if (playerInfo.PlayerId == Global.playerId)
        {
            // 是本人退出
            UnityMainThread.wkr.AddJob(Route.GoHall);
        }
        else
        {
            UnityMainThread.wkr.AddJob(InitView);
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
                Global.group = null;
                Route.GoHall();
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
                Route.GoHall();
            } else {
                Dialog dia = Instantiate(Dailog);
                dia.Open("提示", "退出队伍失败" + Util.ErrorMessage(response));
            }
        });
    }


    /**
     * 监听“加入队伍”
     */
    void OnJoin(FramePlayerInfo playerInfo) {
        SDKDebugLogger.Log("Receive GroupMessage OnJoin, groupId:{0} , playerInfo:{1}",
            Global.client.GetGroupId(), playerInfo.PlayerId);
        //更新队伍信息
        UnityMainThread.wkr.AddJob(InitView);
    }

    /**
    * 监听“组队匹配”--队友
    */
    void OnTeamMatch() {
        SDKDebugLogger.Log("Receive GroupMessage OnMatchStart ,groupId:{0} ",Global.client.GetGroupId());
        Debug.Log("isOwner:" + isOwner);
        Debug.Log("心跳：匹配开始通知");
        if (!isOwner) {
            // 如果不是队长就弹出匹配中
            UnityMainThread.wkr.AddJob(() => {
                Reloading loading = Instantiate(Loading);
                loading.Open("队员匹配中...");
            });
            PlayerInfo[] players = Global.group.groupInfo.Players;
            TeamMatchGroup(players);
        }
    }

    /**
     * 快速匹配--队长
     */
    void TeamMatch() {
        PlayerInfo[] players = Global.group.groupInfo.Players;
        enableMatchBtn.GetComponent<Button>().enabled = false;
        enableMatchBtn.GetComponent<Button>().interactable = false;
        Global.group.GetGroupDetail(response => {
            if (response.RtnCode == 0)
            {
                Global.group.groupInfo = response.GroupInfo;
                players = response.GroupInfo.Players;
                // 组队小队匹配
                TeamMatchGroup(players);
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

            matchPlayerInfoParam.PlayerId = players[i].PlayerId;

            Dictionary<string, string> matchParams = new Dictionary<string, string>();
            matchParams.Add("level", "2");
            matchPlayerInfoParam.MatchParams = matchParams;

            playerInfos[i] = matchPlayerInfoParam;
        }

        MatchGroupConfig matchGroupConfig = new MatchGroupConfig();
        matchGroupConfig.MatchCode = Global.matchCode;
        matchGroupConfig.PlayerInfos = playerInfos;

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
                else if ((int) ErrorCode.COMMON_OK == response.RtnCode) {
                    Debug.Log("MatchGroup start");
                    // 如果是队长就弹出匹配中
                    if (isOwner)
                    {
                        UnityMainThread.wkr.AddJob(() => {
                            Reloading loading = Instantiate(Loading);
                            loading.Open("组队匹配中...");
                        });
                    }

                }
                else
                // 匹配超时等其他匹配异常
                {
                    Debug.Log("匹配失败：RtnCode = " + Util.ErrorMessage(response));
                    Flag = false;

                }
            });
            Global.client.OnMatch = response =>
            {
                if ((int) ErrorCode.PLAYER_MATCH_CANCELED == response.RtnCode) {
                    // 匹配取消
                    Flag = false;
                }
                // 匹配成功
                else if ((int) ErrorCode.COMMON_OK == response.RtnCode ||
                         (int) ErrorCode.PLAYER_MATCH_CANCEL_WHEN_SUCCESS == response.RtnCode) {
                    Global.room = response.Room;
                    UnityMainThread.wkr.AddJob(Route.GoTeamRoom);
                }
                else
                    // 匹配超时等其他匹配异常
                {
                    Debug.Log("匹配失败：RtnCode = " + Util.ErrorMessage(response));
                    Flag = false;

                }
            };
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
                Global.group.groupInfo = response.GroupInfo;
                Debug.Log("获取最新的队伍信息成功");
                //有人加入队伍，需要刷新页面
                UnityMainThread.wkr.AddJob(InitView);
            } else {
                if (response.RtnCode == 101302)
                {   // 队伍不存在
                    Debug.Log("队伍不存在，返回大厅");
                    UnityMainThread.wkr.AddJob(Route.GoHall);
                    return;
                }
                // 退出队伍失败
                Debug.Log("获取最新的队伍信息失败" + Util.ErrorMessage(response));
            }
        });
   }

    /**
     *  队长踢人
     */
    void kickPlayer()
    {
        string playerId = null;
        PlayerInfo[] playerInfos = Global.group.groupInfo.Players;
        for (var i = 0; i < playerInfos.Length; i++)
        {
            if (playerInfos[i].PlayerId != Global.group.groupInfo.OwnerId)
            {
                playerId = playerInfos[i].PlayerId;
            }
        }

        RemoveGroupConfig removeGroupConfig = new RemoveGroupConfig
        {
            GroupId = Global.group.GetGroupId(),
            PlayerId = playerId
        };
        Global.group.RemovePlayer(removeGroupConfig , res =>
        {
            if (res.RtnCode == 0) {
                Debug.Log("踢人success");
                UnityMainThread.wkr.AddJob(InitView);
            }
            else {
                Debug.Log($"踢人fail {res.Msg}");
            }
        });
    }

    void OnDestroy()
    {
        Global.group.OnDisconnect = null;
        GameObject loading = GameObject.Find("/loading2(Clone)");
        Destroy(loading);
    }

}
