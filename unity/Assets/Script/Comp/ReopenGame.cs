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
        this.InitListener();
    }

    void InitListener() {
        this.BtnReopen.onClick.AddListener(() => Reopen());
        this.BtnExit.onClick.AddListener(() => Exit());
    }

    public void Reopen() {
        // ����ȷ�ϻص��¼�
        if (this.Callback != null) {
            this.Callback.Reopen();
        }
        // ����dialog
        DialogDestroy();
    }

    public void Exit() {
        // ����ȷ�ϻص��¼�
        if (this.Callback != null)
        {
            this.Callback.Exit();
        }
        // ����dialog
        DialogDestroy();
    }

    // �򿪶Ի���
    public void Open(String title, String content)
    {
        this.Title.text = title;
        this.Contetnt.text = content;
    }

    void DialogDestroy()
    {
        Destroy(this.gameObject);
        GameObject bg = GameObject.Find("/bg(Clone)");
        Destroy(bg);
    }

    // ����¼�����
    public void AddEventListener(ReopenCallback Callback) {
        this.Callback = Callback;
    }
}
