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
using UnityEngine.UI;
using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Group;
using Com.Huawei.Game.Gobes.Utils;

public class TeamInfo : MonoBehaviour
{

    public Button Button = null;
    public Text TeamCode = null;
    public Dialog Dailog = null;
    // Start is called before the first frame update
    void Start()
    {
        InitListener();
    }

    void InitListener()
    {
        Button.onClick.AddListener(JoinTeam);
    }

    void JoinTeam()
    {
        JoinGroupConfig joinGroupConfig = new JoinGroupConfig()
        {
            GroupId = TeamCode.text,
            CustomPlayerStatus = "0",
            CustomPlayerProperties = Global.playerName
        };
        Debug.Log(CommonUtils.JsonSerializer(joinGroupConfig));
        try {
            Global.group = Global.client.JoinGroup(joinGroupConfig, JoinGroupCallback);
        } catch(SDKException e) {
            Debug.Log("加入队伍失败"+e.code + "|" + e.Message);
            OpenDialog("加入队伍失败"+Util.ExceptionMessage(e));
        }
    }

    public void JoinGroupCallback(CreateGroupBaseResponse response)
    {
        if (response.RtnCode == 0)
        {
            Debug.Log("加入队伍成功");
            Route.GoTeam();
        }
        else
        {
            Debug.Log("加入队伍失败"+response.RtnCode+"|"+response.Msg);
            OpenDialog("加入队伍失败"+Util.ErrorMessage(response));
        }
    }

    public void OpenDialog(string msg)
    {
        Dialog dialog = Instantiate(Dailog);
        dialog.Open("提示", msg);
    }
}
