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

using Com.Huawei.Game.Gobes.Utils;
using UnityEngine;

public class Circle : MonoBehaviour 
{
    public void initCircle()
    {
        this.gameObject.transform.position = new Vector3(2, -1, 0);
        this.gameObject.GetComponent<Renderer>().material.color = Color.yellow;
    }

    /***
     * 飞机碰撞到圆圈后,圆圈变色
     */
    public void ChangeColor()
    {
        this.gameObject.GetComponent<Renderer>().material.color = Color.red;
    }
    
    /**
     * 碰撞检测
     * @param collision
     */
    public void OnTriggerEnter(Collider other)
    {
        Debug.Log("圆圈碰撞2-----------------------------"+other.tag+"==="+other.gameObject.tag);
        if (FrameSync.PlayerTag.Equals(other.tag))
        {
            CollisionFrameList<FrameSync.CollisionFrameData>.CollisionFrameData<FrameSync.CollisionFrameData> collisionFrameData =
                new CollisionFrameList<FrameSync.CollisionFrameData>.CollisionFrameData<FrameSync.CollisionFrameData>();
            collisionFrameData.state = new FrameSync.CollisionFrameData();
            collisionFrameData.state.cmd = FrameSync.FrameSyncCmd.collide;
            collisionFrameData.otherTag = other.tag;//被碰撞体标签
            collisionFrameData.selfTag = FrameSync.CircleTag;//碰撞体标签

            string frameData = CommonUtils.JsonSerializer(collisionFrameData);
            // 调用SDK发送帧数据
            string[] frameDatas = new string[] { frameData };
            Global.Room.SendFrame(frameDatas, response => {});
        }
    }
}
