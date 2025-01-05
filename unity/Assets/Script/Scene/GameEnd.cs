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

using System;
using UnityEngine;
using UnityEngine.UI;
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Utils;
using Random = UnityEngine.Random;

public class GameEnd : MonoBehaviour, ReopenCallback
{
    public Text endText;

    public Button leaveBtn;

    public GameObject message;

    // 重开一局预制件
    public ReopenGame reopenGame = null;

    void Start() {
        InitListener();
    }

    public void InitListener() {
        leaveBtn.onClick.AddListener(() => Leave());

        Global.Room.OnRecvFromServer = (data) =>
        {
            OnReceiveFromServer(data);
        };

        ReportGameEnd();
    }

    private void ReportGameEnd()
    {
        // 上报随机结果【0，1】
        RTSendGameEnd endMsg = new RTSendGameEnd();
        endMsg.type = "GameEnd";
        endMsg.playerId = Global.client.GetPlayerId();
        endMsg.value = Random.Range(0, 2);
        SendToServerInfo info = new SendToServerInfo()
        {
            Msg =  CommonUtils.JsonSerializer(endMsg)
        };
        Global.room.SendToServer(info, (res) =>
        {
            if (res == 0)
            {
                Debug.Log("上报结果内容成功, msg = "+ info.Msg);
            }
            else
            {
                Debug.LogError("上报结果内容失败");
            }
        });
    }

    private void OnReceiveFromServer(RecvFromServerInfo data)
    {
        Debug.Log("接收到结算消息" + CommonUtils.JsonSerializer(data));
        RTRecvGameEnd rtRecvMsg= CommonUtils.JsonDeserializer<RTRecvGameEnd>(data.Msg);
        if (rtRecvMsg.type == "GameEnd")
        {
            UnityMainThread.wkr.AddJob(() => RefreshResult(rtRecvMsg.result));
        }
    }

    public void RefreshResult(int result)
    {
        endText.text = result == 1 ? "结算异常" : "结算正常";
    }


    public void Leave()
    {
        Debug.Log("离开房间");

        if (!Global.isTeamMode)
        {
            UnityMainThread.wkr.AddJob(() => {
                ReopenGame();
            });
        }
        else
        {
            UnityMainThread.wkr.AddJob(() => {
                LeaveRoom();
            });
        }
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
                Route.GoHall();
            }
            if (inroom) {
                Debug.Log("重开一局");
                Route.GoRoom();
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

    void LeaveRoom() {
        Global.client.LeaveRoom(res =>
        {
            if (res.RtnCode == 0)
            {
                // ReLogin();
                Route.GoHall();
                Debug.Log("离开房间success");
            }
            else
            {
                Debug.Log("离开房间fail");
                CreateMessage(res.Msg);
            }
        });
    }


    private void CreateMessage(string tip)
    {
        GameObject MessageBox = Instantiate(message, GameObject.Find("Canvas").transform);
        MessageBox.GetComponent<Message>().tip.text = tip;
    }

}
