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
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using com.huawei.game.gobes;
using com.huawei.game.gobes.Group;
using com.huawei.game.gobes.utils;
using Newtonsoft.Json;

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

    // Update is called once per frame
    void Update()
    {

    }

    void InitListener()
    {
        this.Button.onClick.AddListener(() => JoinTeam());
    }

    void JoinTeam()
    {
        //Debug.Log(teamCode.text);
        JoinGroupConfig joinGroupConfig = new JoinGroupConfig()
        {
            groupId = TeamCode.text,
            customPlayerStatus = "0",
            customPlayerProperties = Global.playerName
        };
        Debug.Log(JsonConvert.SerializeObject(joinGroupConfig));
        try {
            Global.client.JoinGroup(joinGroupConfig, response =>
            {
                if (response.RtnCode == 0)
                {
                    Debug.Log("加入队伍成功");
                    Global.group = new Group(Global.client, response.GroupInfo);
                    Debug.Log("跳转场景team");
                    SceneManager.LoadScene("team");
                }
                else
                {
                    Debug.Log("加入队伍失败"+response.RtnCode+"|"+response.Msg);
                    OpenDialog(Util.ErrorMessage(response));
                }
            });
        } catch(SDKException e) {
            Debug.Log("加入队伍失败"+e.code + "|" + e.Message);
            OpenDialog(Util.ExceptionMessage(e));
        }
    }

    public void OpenDialog(string msg)
    {
        Dialog dialog = Instantiate(Dailog);
        dialog.Open("提示", msg);
    }
}
