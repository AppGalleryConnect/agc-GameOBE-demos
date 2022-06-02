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

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class ReopenGameDialog : MonoBehaviour
{
    // Start is called before the first frame update

    public Text Title = null;

    public Text Contetnt = null;

    public Button BtnConfirm;

    public Button BtnCancel;

    private ICallback Callback { get; set; }

    void Start()
    {
        this.InitListener();
    }

    void InitListener()
    {
        this.BtnConfirm.onClick.AddListener(() => DialogConfirm());
        this.BtnCancel.onClick.AddListener(() => DialogCancel());
    }

    // 打开对话框
    public void Open(String title, String content)
    {
        this.Title.text = title;
        this.Contetnt.text = content;
    }

    public void DialogConfirm() {
        // 处理确认回调事件
        if (this.Callback != null) {
            this.Callback.Confirm();
        }
        // 销毁dialog
        DialogDestroy();
    }

    public void DialogCancel() {
        if (this.Callback != null) {
            // 处理取消回调事件
            this.Callback.Cancel();
        }
        // 销毁dialog
        DialogDestroy();
    }

    void DialogDestroy()
    {
        Destroy(this.gameObject);
        GameObject bg = GameObject.Find("/bg(Clone)");
        Destroy(bg);
    }

    // 添加事件监听
    public void AddEventListener(ICallback Callback) {
        this.Callback = Callback;
    }
}
