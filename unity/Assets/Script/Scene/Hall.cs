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


using UnityEngine;
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Utils;

public class Hall : MonoBehaviour
{
    public GameObject LoadingPre;

    public GameObject BackGroud;

    public Dialog Dailog;

    public bool Flag = true;

    public string Msg;

    // Update is called once per frame
    void Update()
    {
        if (!Flag)
        {
            Debug.Log("房间匹配失败");
            OpenFailWindow(Msg);
            Flag = true;
        }
        if (Global.room != null)
        {

            if (Global.isAsymmetric)
            {
                // 非对称匹配
                Route.GoAsymmetricRoom();
            }
            else
            {
                // 对称匹配
                Route.GoTeamRoom();
            }
        }
    }

    void Start()
    {
        InitListener();
    }

    public void InitListener()
    {
        Global.client.OnKickOff = () => showTips();
    }

    public void showTips()
    {
        Debug.Log("玩家被踢");
        UnityMainThread.wkr.AddJob(() => {
            OpenFailWindow("多端登录离线");
        });
    }
    //点击菜鸟区按钮
    public void OnOrdinaryRoomBtn()
    {
        Debug.Log("进入菜鸟区");
        Global.matchRule = "0";
        Route.GoMatch();
    }
    //点击高手区按钮
    public void OnExpertRoomBtn()
    {

        Debug.Log("进入高手区");
        Global.matchRule = "1";
        Route.GoMatch();
    }
    //点击快速匹配按钮
    public void OnFastMatchBtn()
    {
        Debug.Log("快速匹配");
        Debug.Log("弹出loading");
        GameObject loading = Instantiate(LoadingPre);
        GameObject bg = Instantiate(BackGroud);
        Debug.Log(Global.playerId);
        Debug.Log(Global.playerName);
        MatchPlayer();
    }

    void MatchPlayer() {

        MatchPlayerInfoParam matchPlayerInfoParam = new MatchPlayerInfoParam()
        {
            PlayerId = Global.playerId,
            MatchParams = Util.GetPlayerMatchParams()
        };

        // 需要根据是否非对称，选择对应的matchCode


        MatchTeamInfoParam matchTeamInfoParam = new MatchTeamInfoParam()
        {
            MatchParams = Util.getTeamMatchParams()
        };

        MatchPlayerConfig matchPlayerConfig = new MatchPlayerConfig()
        {
            MatchCode = Global.matchCode,
            PlayerInfo = matchPlayerInfoParam,
            TeamInfo = matchTeamInfoParam
        };
        PlayerConfig playerConfig = new PlayerConfig
        {
            CustomPlayerStatus = 0,
            CustomPlayerProperties = Util.getCustomPlayerProperties()
        };
        try
        {
            Global.client.MatchPlayer(matchPlayerConfig, playerConfig, response =>
            {
                if (response.RtnCode == 0)
                {
                    Debug.Log("MatchPlayer start");
                    Global.isOnlineMatch = true;
                    Util.SaveOnlineMatch(true);
                    Flag = true;
                }
                else
                {
                    Debug.Log("MatchPlayer failed");
                    Msg = "快速匹配失败"+Util.ErrorMessage(response);
                    Flag = false;
                }
                if (response.RtnCode == (int)ErrorCode.PLAYER_MATCH_CANCELED){
                    Msg = "快速匹配取消" + Util.ErrorMessage(response);
                }
            });
            Global.client.OnMatch = response =>
            {
                if (response.RtnCode == 0)
                {
                    Debug.Log("MatchPlayer success");
                    Global.Room = response.Room;
                    Global.player = response.Room._player;
                    Global.isOnlineMatch = true;
                    Util.SaveOnlineMatch(true);
                    Flag = true;
                }
                else
                {
                    Debug.Log("MatchPlayer failed");
                    Msg = "快速匹配失败"+Util.ErrorMessage(response);
                    Flag = false;
                }
                if (response.RtnCode == (int)ErrorCode.PLAYER_MATCH_CANCELED){
                    Msg = "快速匹配取消" + Util.ErrorMessage(response);
                }
            };
        }
        catch (SDKException e) {
            Msg = "快速匹配失败" + Util.ExceptionMessage(e);
            OpenFailWindow(Msg);
        }

    }

        //点击组队匹配按钮
        public void OnCreateTeamBtn()
    {
        if (!Util.IsInited())
        {
            OpenFailWindow("请先初始化 SDK");
            return;
        }
        CreateTeam();
    }

    private void CreateTeam() {
        Debug.Log("组队匹配");
        Debug.Log(Global.playerId);
        GameObject bg = Instantiate(BackGroud);
        CreateGroupConfig createGroupConfig = new CreateGroupConfig
        {
            MaxPlayers = 2,
            GroupName = "快乐小黑店",
            IsLock = 0,
            IsPersistent = 0,
            CustomPlayerStatus = "0",
            CustomPlayerProperties = Global.playerName,
            CustomGroupProperties = "快乐小黑店"
        };
        try
        {
            Global.group = Global.client.CreateGroup(createGroupConfig, CreateGroupCallback);
        }
        catch (SDKException e)
        {
            OpenFailWindow("创建小队失败" + Util.ExceptionMessage(e));
        }
    }

    public void CreateGroupCallback(CreateGroupBaseResponse res)   {
        if (res.RtnCode == 0)
        {
            Debug.Log("CreateGroup success");
            Global.group = res.Group;
            Route.GoTeam();
        }
        else
        {
            Debug.Log("CreateGroup failed");
            OpenFailWindow("创建小队失败" + Util.ErrorMessage(res));
        }

    }
    //点击加入队伍按钮
    public void OnJoinTeamBtn()
    {
        Debug.Log("加入队伍");
        Route.GoTeamInfoView();
    }

    public void OpenFailWindow(string FailMsg)
    {
        Debug.Log("弹出失败窗口");
        GameObject loading = GameObject.Find("/loading(Clone)");
        Destroy(loading);
        Dialog dialog = Instantiate(Dailog);
        dialog.Open("提示", FailMsg);
    }
}

