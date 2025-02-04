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

public class ReopenGame : MonoBehaviour
{
    // Start is called before the first frame update

    public Text Title = null;

    public Text Contetnt = null;

    public Button BtnReopen;

    public Button BtnExit;

    private ReopenCallback Callback { get; set; }

    void Start()
    {
        InitListener();
    }

    void InitListener() {
        BtnReopen.onClick.AddListener(() => Reopen());
        BtnExit.onClick.AddListener(() => Exit());
    }

    public void Reopen() {
        // 处理确认回调事件
        if (Callback != null) {
            Callback.Reopen();
        }
        // 销毁dialog
        DialogDestroy();
    }

    public void Exit() {
        // 处理确认回调事件
        if (Callback != null)
        {
            Callback.Exit();
        }
        // 销毁dialog
        DialogDestroy();
    }

    // 打开对话框
    public void Open(String title, String content)
    {
        Title.text = title;
        Contetnt.text = content;
    }

    void DialogDestroy()
    {
        Destroy(gameObject);
        GameObject bg = GameObject.Find("/bg(Clone)");
        Destroy(bg);
    }

    // 添加事件监听
    public void AddEventListener(ReopenCallback cb) {
        Callback = cb;
    }
}
