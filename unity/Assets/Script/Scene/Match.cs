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
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Utils;

public class Match : MonoBehaviour
{

    public GameObject LoadingPre;

    public GameObject BackGroud;

    public Dialog Dailog;

    public string Msg;

    public bool Flag = true;

    // Update is called once per frame
    void Update()
    {
        if (!Flag) {
            Debug.Log("房间匹配失败");
            OpenFailWindow();
            Flag = true;
        }
        if (Global.room != null) {
            Route.GoRoom();
        }
    }

    //点击创建房间
    public void CreateRoomBtn()
    {
        Debug.Log("创建房间");
        Route.GoCreateRoom();
    }
    //点击加入房间
    public void JoinRoomBtn()
    {
        Debug.Log("加入房间");
        Route.GoRoomList();
    }

    //点击快速匹配
    public void RoomMatchBtn() {
        if (!Util.IsInited())
        {
            Msg = "请先初始化 SDK";
            OpenFailWindow();
            return;
        }
        MatchRoom();
    }

    void MatchRoom() {
        Debug.Log("房间匹配");
        GameObject bg = Instantiate(BackGroud);
        GameObject loding = Instantiate(LoadingPre);
        Dictionary<string, string> matchParams = new Dictionary<string, string>();
        matchParams.Add("matchRule", Global.matchRule);
        matchParams.Add("matchRule2", Global.matchRule);

        MatchRoomConfig matchRoomConfig = new MatchRoomConfig
        {
            MatchParams = matchParams,
            RoomType = Global.matchRule,
            CustomRoomProperties = Global.matchRule,
            MaxPlayers = 2,
        };

        PlayerConfig playerConfig = new PlayerConfig
        {
            CustomPlayerStatus = 0,
            CustomPlayerProperties = "",
        };
        try
        {
            Global.client.MatchRoom(matchRoomConfig, playerConfig, response =>
            {
                if (response.RtnCode == 0)
                {
                    Debug.Log("roommatch success");
                    Global.room = response.Room;
                    Global.player = response.Room._player;
                    Flag = true;
                }
                else
                {
                    Debug.Log("roommatch failed");
                    Msg = "房间匹配失败"+Util.ErrorMessage(response);
                    Flag = false;
                }
            });
        }
        catch (SDKException e) {
            Msg = "房间匹配失败" + Util.ExceptionMessage(e);
            OpenFailWindow();
        }
    }

    public void OpenFailWindow()
    {
        Debug.Log("弹出失败窗口");
        GameObject loading2 = GameObject.Find("/loading2(Clone)");
        Destroy(loading2);
        Dialog dialog = Instantiate(Dailog);
        dialog.Open("提示", Msg);
    }

}

