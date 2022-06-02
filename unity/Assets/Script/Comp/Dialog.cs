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

public class Dialog : MonoBehaviour
{
    // Start is called before the first frame update

    public Text Title = null;

    public Text Contetnt = null;

    public Button BtnConfirm;


    void Start()
    {
      
        this.InitListener();
    }

    // Update is called once per frame
    void Update()
    {
        
    }

   
    void InitListener() {

      
        this.BtnConfirm.onClick.AddListener(() => Dispear());

    }

    // �򿪶Ի���
    public void Open(String title,String content) {
        this.Title.text = title;
        this.Contetnt.text = content;
    }

    void Dispear()
    {
        Destroy(this.gameObject);
        GameObject bg = GameObject.Find("/bg(Clone)");
        Destroy(bg);
    }
}
