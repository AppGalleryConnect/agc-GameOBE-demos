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
using Com.Huawei.Game.Gobes;

public struct CreatFaceParam
{
    public int index;
    public bool isOwner;
    public string name;
    public long status;
}
public class Face : MonoBehaviour
{
    public Text owner;
    public Text playName;
    public Text statusText;
    public GameObject dismissBtn;
    public GameObject kickBtn;

    public void RandomizeCharacter(CreatFaceParam param) {
        // 当前角色是否为房主
        bool roleIsOwner = param.name == Global.Room.roomInfo.OwnerId;

        playName.text = param.name;

        if (roleIsOwner)
        {
            owner.text = "房主";
            statusText.text = "";
        }
        else
        {
            statusText.text = param.status == 1 ? "已准备" : "未准备";
        }

        if (param.isOwner && roleIsOwner)
        {            
            dismissBtn.SetActive(true);
        }
        else if (param.isOwner && !roleIsOwner)
        {
            kickBtn.SetActive(true);
        }
    }

    public void DismissRoom() {
        Debug.Log("解散房间");
        Global.client.DismissRoom(res =>
        {
            if (res.RtnCode == 0)
            {
                Global.Room = null;
                Debug.Log("解散房间success");
            }
            else
            {
                Debug.Log("解散房间失败");
            }
        });
    }

    public void OnDissRoom() {
        Route.GoHall();
    }

    public void Kick()
    {
        RemovePlayerConfig removePlayerConfig = new RemovePlayerConfig()
        {
            PlayerId = playName.text,
        };

        Global.client.RemovePlayer(removePlayerConfig, res =>
        {
            if (res.RtnCode == 0) {
                Debug.Log("踢人success");
                GameObject.FindWithTag("RoomCanvas").GetComponent<RentRoom>().GetRoomInfo();
            }
            else {
                Debug.Log($"踢人fail {res.Msg}");
            }
        });
    }

    public void DeleteFace()
    {
        Destroy(gameObject);
    }
}
