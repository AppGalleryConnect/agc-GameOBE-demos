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
using Com.Huawei.Game.Gobes.Store;
using Com.Huawei.Game.Gobes.Utils;

public class RoomList : MonoBehaviour
{
    public GameObject content;

    public GameObject itemPrefb;

    public GameObject codeInput;

    public GameObject idInput;

    public GameObject message;

    public Button QueryIdleRoomButton = null;

    private RoomInfo[] roomList;

    private const int limit = 20;

    void Start()
    {
        GetList();
        InitListener();
    }

    private void InitListener()
    {
        QueryIdleRoomButton.onClick.AddListener(() => GetIdleList());
    }

    public void RenderList(GetAvailableRoomsBaseResponse res)
    {
        if (res.RtnCode == 0)
        {
            // 删除旧列表
            for (int i = 0; i < content.transform.childCount; i++)
            {
                Destroy(content.transform.GetChild(i).gameObject);
            }

            roomList = res.Rooms;
            foreach (RoomInfo room in roomList)
            {
                GameObject itemRoom = Instantiate(itemPrefb, content.transform);
                itemRoom.SendMessage("RenderItem", room, SendMessageOptions.DontRequireReceiver);
            }

            Debug.Log($"获取房间列表成功,有{res.Count}条，当前从第{res.Offset}秒开始");
        }
        else
        {
            Debug.Log("获取房间列表失败");
            CreateMessage(res.Msg);
        }
    }

    public void JoinByCode()
    {
        string roomCode = codeInput.GetComponent<InputField>().text;
        var customPlayerProperties = "";
        if (roomCode == null)
        {
            Debug.Log("请输入房间code");
            return;
        }

        foreach (RoomInfo room in roomList)
        {
            if (roomCode == room.RoomCode)
            {
                customPlayerProperties = room.RoomStatus == (int) RoomStatus.SYNCING ? "watcher" : "";
            }
        }

        JoinRoomConfig joinRoomReq = new JoinRoomConfig()
        {
            RoomCode = roomCode
        };
        PlayerConfig playerInfo = new PlayerConfig()
        {
            CustomPlayerStatus = 0,
            CustomPlayerProperties = customPlayerProperties
        };
        try
        {
            Global.room = Global.client.JoinRoom(joinRoomReq, playerInfo, JoinRoomCallback);

        }
        catch (SDKException e)
        {
            CreateMessage(Util.ExceptionMessage(e));
        }
    }

    public void JoinById(string joinRoomId)
    {
        string roomId = idInput.GetComponent<InputField>().text;
        string realRoomId = string.IsNullOrEmpty(joinRoomId) ? roomId : joinRoomId;
        if (string.IsNullOrEmpty(realRoomId))
        {
            CreateMessage("请输入房间号");
            return;
        }

        var customPlayerProperties = "";
        foreach (RoomInfo room in roomList)
        {
            if (realRoomId == room.RoomId)
            {
                customPlayerProperties = room.RoomStatus == (int) RoomStatus.SYNCING ? "watcher" : "";
            }
        }

        JoinRoomConfig joimRoomReq = new JoinRoomConfig()
        {
            RoomId = realRoomId
        };
        PlayerConfig playerInfo = new PlayerConfig()
        {
            CustomPlayerStatus = 0,
            CustomPlayerProperties = customPlayerProperties
        };
        try
        {
            Global.room = Global.client.JoinRoom(joimRoomReq, playerInfo, JoinRoomCallback);
        }
        catch (SDKException e)
        {
            CreateMessage(Util.ExceptionMessage(e));
        }
    }

    public void JoinByClick(string joinRoomId)
    {
        string roomId = idInput.GetComponent<InputField>().text;
        string realRoomId = string.IsNullOrEmpty(joinRoomId) ? roomId : joinRoomId;
        if (string.IsNullOrEmpty(realRoomId))
        {
            CreateMessage("请输入房间号");
            return;
        }

        var customPlayerProperties = "";
        foreach (RoomInfo room in roomList)
        {
            if (realRoomId == room.RoomId)
            {
                customPlayerProperties = room.RoomStatus == (int) RoomStatus.SYNCING ? "watcher" : "";
            }
        }

        JoinRoomConfig joimRoomReq = new JoinRoomConfig()
        {
            RoomId = string.IsNullOrEmpty(joinRoomId) ? roomId : joinRoomId
        };
        PlayerConfig playerInfo = new PlayerConfig()
        {
            CustomPlayerStatus = 0,
            CustomPlayerProperties = customPlayerProperties
        };
        try
        {
            Global.room = Global.client.JoinRoom(joimRoomReq, playerInfo, JoinRoomCallback);
            Global.player = Global.room._player;
        }
        catch (SDKException e)
        {
            CreateMessage(Util.ExceptionMessage(e));
        }
    }

    public void JoinRoomCallback(JoinRoomBaseResponse res)
    {
        if (res.RtnCode == 0)
        {
            Debug.Log("加入房间GoRoom");
            Global.room = res.Room;
            Global.player = Global.room._player;
            Route.GoRoom();
        }
        else
        {
            Debug.Log("加入房间失败");
            CreateMessage(res.Msg);
        }
    }

    public void Back()
    {
        Route.GoHall();
    }

    public void RefreshList()
    {
        GetList();
    }

    private void GetList()
    {
        GetAvailableRoomsConfig getRoomReq = new GetAvailableRoomsConfig()
        {
            RoomType = Global.matchRule,
            Limit = limit,
            Sync = true,
            RoomTypeList = new List<string>
            {
                "0","1"
            }
        };
        Global.client.GetAvailableRooms(getRoomReq, RenderList);
    }

    private void GetIdleList()
    {
        GetAvailableRoomsConfig getRoomReq = new GetAvailableRoomsConfig()
        {
            RoomType = Global.matchRule,
            Limit = limit,
            Sync = false,
            RoomTypeList = new List<string>
            {
                "0","1"
            }
        };
        Global.client.GetAvailableRooms(getRoomReq, RenderList);
    }

    private void CreateMessage(string tip)
    {
        GameObject MessageBox = Instantiate(message, content.transform.parent.parent);
        MessageBox.GetComponent<Message>().tip.text = tip;
    }
}