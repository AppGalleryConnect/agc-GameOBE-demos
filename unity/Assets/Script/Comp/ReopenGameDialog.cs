/**
 * Copyright 2023. Huawei Technologies Co., Ltd. All rights reserved.
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
        InitListener();
    }

    void InitListener()
    {
        BtnConfirm.onClick.AddListener(() => DialogConfirm());
        BtnCancel.onClick.AddListener(() => DialogCancel());
    }

    // �򿪶Ի���
    public void Open(String title, String content)
    {
        Title.text = title;
        Contetnt.text = content;
    }

    public void DialogConfirm() {
        // ����ȷ�ϻص��¼�
        if (Callback != null) {
            Callback.Confirm();
        }
        // ����dialog
        DialogDestroy();
    }

    public void DialogCancel() {
        if (Callback != null) {
            // ����ȡ���ص��¼�
            Callback.Cancel();
        }
        // ����dialog
        DialogDestroy();
    }

    void DialogDestroy()
    {
        Destroy(gameObject);
        GameObject bg = GameObject.Find("/bg(Clone)");
        Destroy(bg);
    }

    // ����¼�����
    public void AddEventListener(ICallback Callback) {
        this.Callback = Callback;
    }
}
