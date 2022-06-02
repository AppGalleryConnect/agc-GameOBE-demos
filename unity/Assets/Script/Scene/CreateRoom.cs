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

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using com.huawei.game.gobes;
using com.huawei.game.gobes.Room;

public class CreateRoom : MonoBehaviour
{
    private string roomName;

    // 0:公开房间,1:私有房间
    private int isOpen = 0;


    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {

    }

    // 点击创建房间按钮
    public void OnCreateRoom()
    {
        // 获取表单的值
        roomName = GameObject.Find("Canvas/RoomName/Text (Legacy)").GetComponent<Text>().text;

        // 访问后台获取返回值
        CreateRoomConfig createRoomConfig = new CreateRoomConfig();
        createRoomConfig.RoomName = roomName;
        createRoomConfig.RoomType = Global.matchRule;
        createRoomConfig.IsPrivate = isOpen;
        createRoomConfig.MaxPlayers = 2;
        Dictionary<string, string> matchParams = new Dictionary<string, string>();
        matchParams.Add("matchRule", Global.matchRule);
        matchParams.Add("matchRule2", Global.matchRule);
        createRoomConfig.MatchParams = matchParams;

        PlayerConfig playerConfig = new PlayerConfig();
        playerConfig.CustomPlayerStatus = 0;
        playerConfig.CustomPlayerProperties = "";

        Global.Room = Global.client.CreateRoom(createRoomConfig, playerConfig, response => {

            if (response.RtnCode != 0)
            {
                return;
            }
            // 跳转到房间
            SceneManager.LoadScene("Room");
        });
        Global.player = Global.Room._player;
        Debug.Log(Global.Room.roomInfo);
    }

    // 点击取消创建房间按钮
    public void OnCancelRoom()
    {
        SceneManager.LoadScene("Match");
    }

    // 修改房间是否为公开
    public void OnUpdateOpen(bool isOpen)
    {
        this.isOpen = isOpen ? 0 : 1;
    }

}
