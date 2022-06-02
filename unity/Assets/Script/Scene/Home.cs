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

using UnityEngine;
using UnityEngine.SceneManagement;
using com.huawei.game.gobes;
using UnityEngine.UI;
using System;
using System.Security.Cryptography;
using System.Text;
using com.huawei.game.gobes.config;
using com.huawei.game.gobes.utils;

public class Home : MonoBehaviour
{
    public Button Button = null;
    public Dialog Dailog = null;

    // Start is called before the first frame update
    void Start()
    {
        InitSDKLog();
        InitSDK();
        InitListener();
    }

    // Update is called once per frame
    void Update()
    {

    }

    // 初始化SDK日志
    void InitSDKLog() {
        if (Config.isOpenSDKLog)
        {
            String curTimeStamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString();
            string Path = Application.persistentDataPath;
            SDKDebugLogger.LogCallBack = (log) =>
            {
                FileUtil.AppendContentToFile(Path + "/" + curTimeStamp + "/sdklog/sdklog.log", log);
                Debug.Log(log);
            };
            SDKDebugLogger.APILogCallBack = (apiLog) =>
            {
                FileUtil.AppendContentToFile(Path + "/" + curTimeStamp + "/sdklog/sdkapilog.log", apiLog);
                Debug.Log(apiLog);
            };
        }
    }

    void InitListener()
    {
        this.Button.onClick.AddListener(() => GoHall());
    }

    void InitSDK()
    {
        if (Util.IsInited())
        {
            Debug.Log("SDK 已经初始化，无需重复操作");
            return;
        }
        Debug.Log("SDK 需要初始化");
        RtsaConfig.CaFilePath = Application.persistentDataPath + "/rtsa-config/012-DigiCert-Global-Root-CA.cer";
        RtsaConfig.GrsRootPath = Application.persistentDataPath + "/rtsa-config/cert/nk-grs";
        RtsaConfig.LogPath = Application.persistentDataPath + "/" + RtsaConfig.LogPath;
        Func<Signature> func = CreateSignature;

        ClientConfig clientConfig = new ClientConfig()
        {
            ClientAppId = Config.gameId,
            ClientOpenId = Config.openId,
            ClientId = Config.clientId,
            ClientSecret = Config.clientSecret,
            CreateSignature = func
        };

        Client client = new Client(clientConfig);
        Debug.Log("SDK 正在初始化");
        try
        {
            client.Init(response =>
            {
                if (response.RtnCode == 0)
                {
                    Debug.Log("鉴权成功");
                    Global.client = client;
                    Global.playerId = client.GetPlayerId();
                    // demo生成昵称保存到global
                    Global.playerName = Util.MockPlayerName();
                    Debug.Log(Global.playerId);
                }
                else
                {
                    Debug.Log("鉴权失败"+response.RtnCode+"|"+response.Msg);
                    OpenDialog(Util.ErrorMessage(response));
                }
            });
        }
        catch(SDKException e)
        {
            Debug.Log("鉴权失败"+e.code+"|"+e.Message);
            OpenDialog(Util.ExceptionMessage(e));
        }
    }

    void GoHall()
    {
        {
            if (Util.IsInited())
            {
                Debug.Log("跳转场景");
                SceneManager.LoadScene("Hall");
            }
            else
            {
                OpenDialog("鉴权失败");
            }

        }
    }

    private static Signature CreateSignature()
    {
        Signature signature = new Signature();

        string nonce = Util.RollDice(32).Replace("-","");
        string timeStamp = Util.TimeStamp();
        string str = $"appId={Config.gameId}&nonce={nonce}&openId={Config.openId}&timestamp={timeStamp}";
        var hmacsha256 = new HMACSHA256(Encoding.ASCII.GetBytes(Config.gameSecret));
        var hashBytes = hmacsha256.ComputeHash(Encoding.ASCII.GetBytes(str));

        signature.Sign = Convert.ToBase64String(hashBytes);
        signature.Nonce = nonce;
        signature.Timestamp = timeStamp;
        return signature;
    }

    public void OpenDialog(string msg)
    {
        Dialog dialog = Instantiate(Dailog);
        dialog.Open("提示", msg);
    }

}
