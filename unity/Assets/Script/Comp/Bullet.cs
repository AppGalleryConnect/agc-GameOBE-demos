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

using System.Linq;
using Com.Huawei.Game.Gobes.Utils;
using UnityEngine;
public class Bullet : MonoBehaviour
{
    public int speed = 20;
    public bool isDie = true;
    public int bullectId = 0;
    public string playerId = "";
    
    public void initBullet(int x,int y,string PlayerId,int BullectId) {
        playerId = PlayerId;
        bullectId = BullectId;
        // 如果宽高超过边界，销毁子弹
        if(x > FrameSync._maxX || x < FrameSync._minX || y > FrameSync._maxY || y < FrameSync._minY){
            // 子弹数据销毁
            FrameSync.frameSyncBulletList = FrameSync.frameSyncBulletList.Where(item => !(item.playerId.Equals(PlayerId) && item.bulletId == BullectId)).ToList();
        }else{
            gameObject.transform.position = new Vector3(x, y, 0);
        }

    }
    
    /**
     * 碰撞检测
     * @param collision
     */
    public void OnTriggerEnter(Collider other)
    {
        Debug.Log("子弹碰撞2-----------------------------"+other.tag+"==="+other.gameObject.tag);
        if (FrameSync.PlayerTag.Equals(other.tag))
        {
            CollisionFrameList<FrameSync.CollisionFrameData>.CollisionFrameData<FrameSync.CollisionFrameData> collisionFrameData =
                new CollisionFrameList<FrameSync.CollisionFrameData>.CollisionFrameData<FrameSync.CollisionFrameData>();
            collisionFrameData.state = new FrameSync.CollisionFrameData();
            collisionFrameData.state.cmd = FrameSync.FrameSyncCmd.collide;
            collisionFrameData.otherTag = other.tag;//被碰撞体标签
            collisionFrameData.selfTag = FrameSync.BulletTag;//碰撞体标签
            collisionFrameData.playerId = playerId;
            collisionFrameData.bulletId = bullectId;
            
            string frameData = CommonUtils.JsonSerializer(collisionFrameData);
            // 调用SDK发送帧数据
            string[] frameDatas = new string[] { frameData };
            Global.Room.SendFrame(frameDatas, response => {});
        }
    }
}
