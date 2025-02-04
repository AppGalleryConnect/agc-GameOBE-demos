﻿/**
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

public class RTMessage
{
    public string type { get; set; }
    public string playerId { get; set; }
    public float progress { get; set; }
    public string platform  { get; set; }
}

public class Position
{
    public int x { get; set; }
    public int y { get; set; }
}

public class PlaneInitInfo
{
    public string playerId { get; set; }
    public Position position { get; set; }
    public FrameSync.FrameSyncCmd direction { get; set; }
}

public class RTInitGameMessage
{
    public string type { get; set; }
    public int planeSize { get; set; }
    public int planeHp { get; set; }
    public int bulletSize  { get; set; }
    public int bulletSpeed  { get; set; }
    public PlaneInitInfo[] playerArr  { get; set; }
}

public class RTSendGameEnd
{
    public string type { get; set; }
    public string playerId { get; set; }
    public int value { get; set; }
}

public class RTRecvGameEnd
{
    public string type { get; set; }
    public int result { get; set; }
}