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

using Com.Huawei.Game.Gobes;
using Com.Huawei.Game.Gobes.Utils;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Security.Cryptography;
using UnityEngine;

public class Util {

    private readonly static string _playerNameOption = "abcdefghijklmnopqrstuvwxyz";

    private readonly static string _openIdOption = "0123456789abcdefghijklmnopqrstuvwxyz";
    
    public readonly static string  _robotPrefix = "机器人";

    /**
     * 随机产生 openId
     */
    public static string MockOpenId() {
        return RandomString(_openIdOption, 28);
    }

    public static Boolean IsInited() {
        return Global.playerId != null && Global.playerId != "";
    }

    public static string MockPlayerName() {
        return RandomString(_playerNameOption, 6);
    }

    private static string RandomString(string option, int Length) {
        string outString = "";
        string inOptions = option;
        System.Random rd = new System.Random();
        for (int i = 0; i < Length; i++)
        {
            outString += inOptions.Substring((rd.Next(inOptions.Length)), 1);
        }

        return outString;
    }

    public static string ErrorMessage(BaseResponse error) {
            return (error != null) ? ":" + error.RtnCode + " | " + error.Msg : "";
    }

    public static string RollDice(int len)
    {
        byte[] bytes = null;
        if (len > 0 && len < 1024)
        {
            bytes = new byte[len];
            RandomNumberGenerator random = RandomNumberGenerator.Create();
            random.GetBytes(bytes);
        }
        return BitConverter.ToString(bytes);
    }

    public static string TimeStamp()
    {
        TimeSpan ts = DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, 0);
        return Convert.ToInt32(ts.TotalSeconds).ToString();
    }

    public static string ExceptionMessage(SDKException  e)
    {
        return (e != null) ? ":" + e.code + " | " + e.Message : "";
    }

    public static Dictionary<string, string> GetPlayerMatchParams()
    {
        Dictionary<string, string> matchParams = new Dictionary<string, string>();
        if (Global.isAsymmetric)
        {
            matchParams.Add("level", Global.level);
            matchParams.Add("age", Global.age);
            matchParams.Add("power", Global.power);
            matchParams.Add("skill", Global.skill);
            matchParams.Add("weapon", Global.weapon);
        }
        else
        {
            matchParams.Add("level", "2");
           
        }
        return matchParams;

    }

    public static Dictionary<string, string> getTeamMatchParams()
    {
        Dictionary<string, string> matchParams = new Dictionary<string, string>();
        if (Global.isAsymmetric)
        {
            matchParams.Add("teamNumber", Global.teamNumber);
            return matchParams;

        } else
        {
            return null;
        }
    }

    public static string getCustomPlayerProperties() {
       string playerName =  Global.playerName;
       string teamNumber = "0";
       string result = "";
    
       Dictionary<string, string> teamMatchParams = getTeamMatchParams();
        //非对称模式
        if (teamMatchParams != null)
        {
            teamMatchParams.TryGetValue("teamNumber", out teamNumber);
            AckData ackData = new AckData
            {
                PlayerName = playerName,
                TeamNumber = teamNumber
            };
            result = JsonConvert.SerializeObject(ackData);
        }
        else {
            result = playerName;
        }
       return result;
    }

    public static String MockRobotNameJson(string playerId)
    {
        AckData ackData = new AckData
        {
            PlayerName = _robotPrefix+playerId,
        };
        return JsonConvert.SerializeObject(ackData);
    }

}
