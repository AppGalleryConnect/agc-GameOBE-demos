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
using static FrameSync;

public class Players : MonoBehaviour {

    public Text label = null;

    public GameObject icon1Sprite = null;

    public GameObject icon2Sprite = null;

    // 初始化玩家/红队/黄队的位置和方向
    public void InitPlayer(string id, int rotation, int x, int y, string playerTeamId) {
        if ((playerTeamId == null && id == Global.playerId) || (playerTeamId !=null && GameTeam.red.ToString().Equals(playerTeamId) )) {
            this.icon1Sprite.SetActive(true);
            this.icon2Sprite.SetActive(false);
            this.icon1Sprite.transform.eulerAngles = new Vector3(0, 0, rotation);
        }
        if ((playerTeamId == null && id != Global.playerId) || (playerTeamId != null && GameTeam.yellow.ToString().Equals(playerTeamId))) {
            this.icon1Sprite.SetActive(false);
            this.icon2Sprite.SetActive(true);
            this.icon2Sprite.transform.eulerAngles = new Vector3(0, 0, rotation);
        }
        if (id == Global.playerId) {
            id = "我";
        }
        this.label.text = id;
        this.gameObject.transform.position = new Vector3(x, y, 0);
    }

}
