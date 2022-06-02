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
using com.huawei.game.gobes.utils;
using static Dialog;

public class Cancel : MonoBehaviour
{

    public Dialog Dailog;

    public Button CancelButton;

    public Text Msg;


    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
      
            
        
    }

    public void CancelFastMatchBtn()
    {
        Msg.text = "取消中。。。";
        CancelButton.gameObject.SetActive(false);

        //调用client.cancelMatch()
        try
        {
            Global.client.CancelMatch();
        }
        catch (SDKException e){
            Debug.Log("CancelMatch failed");
            OpenFailWindow("取消快速匹配失败" + Util.ExceptionMessage(e));
        }
    }

    public void OpenFailWindow(string msg)
    {
        Debug.Log("弹出失败窗口");
        GameObject loading = GameObject.Find("/loading(Clone)");
        Destroy(loading);
        Dialog dai = Instantiate(Dailog);
        dai.Open("提示", msg);
    }
}

