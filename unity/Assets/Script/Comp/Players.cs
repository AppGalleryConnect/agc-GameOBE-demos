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

using Com.Huawei.Game.Gobes.Utils;
using UnityEngine;
using UnityEngine.UI;
using static FrameSync;
using static PlayerList<FrameSync.Player>;

public class Players : MonoBehaviour {

    public Text label = null;

    public GameObject icon1Sprite = null;

    public GameObject icon2Sprite = null;

    public string playerId;

    // 初始化玩家/红队/黄队的位置和方向
    public void InitPlayer(PlayerData<FrameSync.Player> player , string id)
    {
        playerId = id;
        if ((player.playerTeamId == null && id == Global.playerId) || (player.playerTeamId !=null && GameTeam.red.ToString().Equals(player.playerTeamId) )) {
            icon1Sprite.SetActive(true);
            icon2Sprite.SetActive(false);
            icon1Sprite.transform.eulerAngles = new Vector3(0, 0, player.rotation);
        }
        if ((player.playerTeamId == null && id != Global.playerId) || (player.playerTeamId != null && GameTeam.yellow.ToString().Equals(player.playerTeamId))) {
            icon1Sprite.SetActive(false);
            icon2Sprite.SetActive(true);
            icon2Sprite.transform.eulerAngles = new Vector3(0, 0, player.rotation);
        }
        if (id == Global.playerId) {
            id = "我";
        }

        if (player.isRobot == 1)
        {
            label.text = player.robotName;
        }
        else
        {
            label.text = id;
        }


        gameObject.transform.position = new Vector3(player.x, player.y, 0);
    }

    /**
     * 碰撞检测
     * @param collision
     */
    public void OnTriggerEnter(Collider other)
    {
        Debug.Log("飞机碰撞2-----------------------------"+other.tag+"==="+other.gameObject.tag);
        if (FrameSync.BulletTag.Equals(other.tag))
        {
            CollisionFrameList<FrameSync.CollisionFrameData>.CollisionFrameData<FrameSync.CollisionFrameData> collisionFrameData =
                new CollisionFrameList<FrameSync.CollisionFrameData>.CollisionFrameData<FrameSync.CollisionFrameData>();
            collisionFrameData.state = new FrameSync.CollisionFrameData();
            collisionFrameData.state.cmd = FrameSync.FrameSyncCmd.collide;
            collisionFrameData.otherTag = other.tag;//被碰撞体标签
            collisionFrameData.selfTag = FrameSync.PlayerTag;//碰撞体标签
            collisionFrameData.playerId = playerId;

            string frameData = CommonUtils.JsonSerializer(collisionFrameData);
            // 调用SDK发送帧数据
            string[] frameDatas = new string[] { frameData };
            Global.Room.SendFrame(frameDatas, response => {});
        }
    }

}
