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


using UnityEngine;
using UnityEngine.SceneManagement;
using static Dialog;
using com.huawei.game.gobes;
using com.huawei.game.gobes.Group;
using System.Collections.Generic;
using com.huawei.game.gobes.utils;
using System.Threading;

public class Hall : MonoBehaviour
{
    // Start is called before the first frame update


    public GameObject LoadingPre;

    public GameObject BackGroud;

    public Dialog Dailog;

    public bool Flag = true;

    public string Msg;

    void Start()
    {

    }

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
            SceneManager.LoadScene("teamroom");
        }
    }


    //点击菜鸟区按钮
    public void OnOrdinaryRoomBtn()
    {
        Debug.Log("进入菜鸟区");
        Global.matchRule = "0";
        SceneManager.LoadScene("Match");
    }
    //点击高手区按钮
    public void OnExpertRoomBtn()
    {

        Debug.Log("进入高手区");
        Global.matchRule = "1";
        SceneManager.LoadScene("Match");
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

        Dictionary<string, string> matchParams = new Dictionary<string, string>();
        matchParams.Add("level", "2");

        MatchPlayerInfoParam matchPlayerInfoParam = new MatchPlayerInfoParam()
        {
            playerId = Global.playerId,
            matchParams = matchParams
        };
        MatchPlayerConfig matchPlayerConfig = new MatchPlayerConfig()
        {
            matchCode = Config.matchCode,
            playerInfo = matchPlayerInfoParam
        };
        PlayerConfig playerConfig = new PlayerConfig
        {
            CustomPlayerStatus = 0,
            CustomPlayerProperties = Global.playerName,
        };
        try
        {
            Global.client.MatchPlayer(matchPlayerConfig, playerConfig, response =>
            {
                if (response.RtnCode == 0)
                {
                    Debug.Log("MatchPlayer Success");
                    Global.Room = response.room;
                    Global.player = response.room._player;
                    Global.isOnlineMatch = true;
                    Flag = true;
                }
                else
                {
                    Debug.Log("MatchPlayer failed");
                    Msg = "快速匹配失败"+Util.ErrorMessage(response);
                    Flag = false;
                }
                if (response.RtnCode == 104205) {
                    Msg = "快速匹配取消" + Util.ErrorMessage(response);
                }
            });
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

            maxPlayers = 2,
            groupName = "快乐小黑店",
            isLock = 0,
            isPersistent = 0,
            customPlayerStatus = "0",
            customPlayerProperties = Global.playerName,
            customGroupProperties = "快乐小黑店"
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
            SceneManager.LoadScene("team");
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
        SceneManager.LoadScene("TeamInfoView");
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

