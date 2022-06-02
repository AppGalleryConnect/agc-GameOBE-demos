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
using UnityEngine.SceneManagement;

public class Route {

    // 页面跳转
    public static void GoHome() {
        SceneManager.LoadScene("Home");
    }
    
    public static void GoHall() {
        Global.Room = null;
        SceneManager.LoadScene("Hall");
    }

    public static void GoRoom() {
        SceneManager.LoadScene("Room");
    }
    
    public static void GoRoomList() {
        SceneManager.LoadScene("RoomList");
    }
    
    public static void GoCreateRoom() {
        SceneManager.LoadScene("CreateRoom");
    }
    
    public static void GoMatch() {
        SceneManager.LoadScene("Match");
    }

    public static void GoTeam() {
        SceneManager.LoadScene("team");
    }
    
    public static void GoTeamInfoView() {
        SceneManager.LoadScene("TeamInfoView");
    }

    public static  void GoTeamRoom() {
        SceneManager.LoadScene("teamroom");
    }

    public static void GoGameView() {
        SceneManager.LoadScene("GameView");
    }

}
