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
using static CloudList<FrameSync.Cloud>;
using static PlayerList<FrameSync.Player>;

public class GameCanvas : MonoBehaviour {

    // 初始化玩家对象池
    public List<GameObject> playersPool = new List<GameObject>();
    // 初始化云朵对象池
    Dictionary<int, GameObject> cloudDictionnary = new Dictionary<int, GameObject>();

    // 玩家预制件
    public GameObject playerPrefab;

    // 云朵预制件
    public GameObject cloudPrefab;

    // Start is called before the first frame update
    void Start() {
    }

    public void SetPlayers(List<PlayerData<FrameSync.Player>> players)
    {
        if (playerPrefab == null) {
            return;
        }
        if (players == null || players.Count <= 0) {
            return;
        }
        if (playersPool.Count != players.Count) {
            // 清空预制件
            if (playersPool.Count != 0)
            {
                foreach (GameObject player in playersPool)
                {
                    Destroy(player);
                }
                playersPool.Clear();
            }
            // 重新初始化预制件
            for (int i = 0; i < players.Count; i++) {
                GameObject playerGameObject = Instantiate(playerPrefab);
                playersPool.Add(playerGameObject);
            }
        }
        // 绘制玩家
        for (int index = 0; index < players.Count; index++) {
            PlayerData<FrameSync.Player> player = players[index];
            Players playerView = playersPool[index].GetComponent<Players>();
            playerView.InitPlayer(player.id, player.rotation, player.x, player.y, player.playerTeamId);
        }

    }

    public void SetClouds(List<CloudData<FrameSync.Cloud>> clouds, float dt)
    {
        if (cloudPrefab == null)
        {
            return;
        }
        if (clouds == null || clouds.Count <= 0)
        {
            return;
        }
        // 绘制云朵
        for (int index = 0; index < clouds.Count; index++)
        {
            // 初始化预制件
            CloudData<FrameSync.Cloud> cloud = clouds[index];
            if (!cloudDictionnary.ContainsKey(index)) {
                GameObject cloudGameObject = Instantiate(cloudPrefab);
                cloudDictionnary.Add(index, cloudGameObject);
            }
            float offset = cloud.x + cloud.offset;
            // 根据位置绘制云朵
            if (offset > FrameSync._maxX)
            {
                // 如果超出X轴就销毁预制件
                GameObject cloudGameObject = cloudDictionnary[index];
                Destroy(cloudGameObject);
                cloudDictionnary.Remove(index);
            }
            else
            {
                // 如果没有超过最大X轴，拿到预制件进行绘制云朵
                GameObject cloudGameObject = cloudDictionnary[index];
                Clouds cloudView = cloudGameObject.GetComponent<Clouds>();
                cloud.offset += cloud.speed * dt;
                cloudView.InitCloud(offset, cloud.y);
            }
        }
    }
    
}
