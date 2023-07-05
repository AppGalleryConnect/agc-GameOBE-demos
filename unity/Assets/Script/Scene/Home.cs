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

using UnityEngine;
using Com.Huawei.Game.Gobes;
using UnityEngine.UI;
using System;
using Com.Huawei.Game.Gobes.Config;
using Com.Huawei.Game.Gobes.Store;
using Com.Huawei.Game.Gobes.Utils;
using NLog;
using LogLevel = Com.Huawei.Game.Gobes.Utils.LogLevel;

public class Home : MonoBehaviour
{
    public Button Button = null;
    public Button ClearButton = null;
    public Dialog Dailog = null;
    public Dropdown GameIdDropDown;
    public InputField GameIdInput;
    public Dropdown ClientIdDropDown;
    public InputField ClientIdInput;
    public Dropdown ClientSecrectDropDown;
    public InputField ClientSecrectInput;
    public Dropdown MatchCodeDropDown;
    public InputField MatchCodeInput;
    public InputField AccessTokenInput;
    public Toggle FairMatchToggle;
    public Toggle IsGuestLogin;
    public bool isPass = false;
    public InputField handleFrameRateInput;
    public Text EnvName;

#if !UNITY_WEBGL || UNITY_EDITOR
    public static NLog.Logger runLogger = LogManager.GetLogger("runLog");

    public static NLog.Logger sdkDebuggerLogger = NLog.LogManager.GetLogger("sdkDebuggerLog");

    public static NLog.Logger requestOutLogger = NLog.LogManager.GetLogger("requestOutLog");
#endif

    public Client Client;
    // Start is called before the first frame update
    void Start()
    {
        InitSDKLog();
        InitListener();
    }

    // 初始化SDK日志
    void InitSDKLog() {
        if (!Config.isOpenSDKLog) return;
        SDKDebugLogger.SDKLogLevel = LogLevel.DEBUG;
#if UNITY_WEBGL || UNITY_EDITOR
        SDKDebugLogger.LogCallBack = (log, level) =>
        {
            switch (level)
            {
                case LogLevel.ERROR:
                    Debug.LogError(log);
                    break;
                default:
                    Debug.Log(log);
                    break;
            }
        };
        SDKDebugLogger.APILogCallBack = apilog => { Debug.Log(apilog);};
#else
        SDKLog.SDKLogTarget = "file";
        SDKLog.InitSDKLog(NLog.LogLevel.Debug);
        SDKDebugLogger.LogCallBack = (log, level) =>
        {
            switch (level)
            {
                case LogLevel.ERROR:
                    runLogger.Error(log);
                    break;
                case LogLevel.DEBUG:
                    runLogger.Debug(log);
                    break;
                default:
                    sdkDebuggerLogger.Info(log);
                    break;
            }
        };
        SDKDebugLogger.APILogCallBack = apilog => { requestOutLogger.Info(apilog);};

#endif

        SDKCommonConfig.GOBE_STORAGE_PATH = Application.persistentDataPath +"/gobe";
    }

    void InitListener()
    {
        Button.onClick.AddListener(() => GoHall());
        ClearButton.onClick.AddListener(() => DeleteOpenId());
        GameIdDropDown.onValueChanged.AddListener(delegate { OnGameIdChanged(0); });
        GameIdInput.onValueChanged.AddListener(delegate { OnGameIdChanged(1); });
        ClientIdDropDown.onValueChanged.AddListener(delegate { OnClientIdChanged(0); });
        ClientIdInput.onValueChanged.AddListener(delegate { OnClientIdChanged(1); });
        ClientSecrectDropDown.onValueChanged.AddListener(delegate { OnClientSecretChanged(0); });
        ClientSecrectInput.onValueChanged.AddListener(delegate { OnClientSecretChanged(1); });
        MatchCodeDropDown.onValueChanged.AddListener(delegate { OnMatchCodeChanged(0); });
        MatchCodeInput.onValueChanged.AddListener(delegate { OnMatchCodeChanged(1); });
    }
    void InitSDK()
    {
        if (Util.IsInited())
        {
            Debug.Log("SDK 已经初始化，无需重复操作");
            return;
        }
        ChooseOpenIdType();
        Debug.Log("openId:"+Config.openId);
        Debug.Log("SDK 需要初始化");
        Global.gameId = GameIdDropDown.value == 0 ? GameIdInput.text : GameIdDropDown.options[GameIdDropDown.value].text.Split('(')[0];
        Global.matchCode = MatchCodeDropDown.value == 0 ? MatchCodeInput.text : MatchCodeDropDown.options[MatchCodeDropDown.value].text;
        Global.isAsymmetric = !FairMatchToggle.isOn;
        int num2 = 3;
        if (int.TryParse(handleFrameRateInput.text, out num2))
        {
            Global.handleFrameRate = num2;
        }
        Debug.Log("SDK 正在初始化"+Global.handleFrameRate);
        SDKLogConfig.SDKLogLevel = "Debug";
        SDKDebugLogger.SDKLogLevel = LogLevel.DEBUG;
        RtsaConfig.LogLevel = 3;
        ClientConfig clientConfig = new ClientConfig()
        {
            //页面取值
            ClientAppId = Global.gameId,
            ClientOpenId = Config.openId,
            ClientId = ClientIdDropDown.value == 0 ? ClientIdInput.text : ClientIdDropDown.options[ClientIdDropDown.value].text,
            ClientSecret = ClientSecrectDropDown.value == 0 ? ClientSecrectInput.text : ClientSecrectDropDown.options[ClientSecrectDropDown.value].text,
            AccessToken = AccessTokenInput.text != null ? AccessTokenInput.text : "",
   
        };

         Client = new Client(clientConfig);
        Debug.Log("SDK 正在初始化");
        try
        {
            Global.client = Client;
            // 监听初始化结束事件
            Global.client.OnInitResult = baseResponse => InitFinish(baseResponse);
            Global.roomType = PlayerPrefs.GetInt("roomType");
            Debug.Log("roomtype"+Global.roomType);
            Global.client.Init();

        }
        catch(SDKException e)
        {
            Client.Destroy();
            Debug.Log("鉴权失败"+e.code+"|"+e.Message);
            OpenDialog(Util.ExceptionMessage(e));
        }
        Application.quitting += ()=> Client.Destroy();
    }

    private void InitFinish(BaseResponse baseResponse)
    {
        Debug.Log("触发oninit");
        if (baseResponse.RtnCode == (int)ErrorCode.COMMON_OK)
        {
            // 初始化成功
            Debug.Log("init成功");
            Global.playerId = Global.client.GetPlayerId();
            if (!string.IsNullOrEmpty(Global.client.GetLastRoomId()))
            {
                // 断线重连场景，直接加入房间
                JoinRoomConfig joinRoomReq = new JoinRoomConfig()
                {
                    RoomId = Global.client.GetLastRoomId()
                };
                PlayerConfig playerInfo = new PlayerConfig();
                Global.room = Global.client.JoinRoom(joinRoomReq, playerInfo, JoinRoomCallback);
            }
            switch (Global.reconnectState) {
                case (int)RoomStatus.SYNCING:
                    Debug.Log("玩家重进游戏");
                    Global.state = 1;
                    Global.isReconnect = true;
                    Global.player = Global.room._player;
                    UnityMainThread.wkr.AddJob(Route.GoGameView);
                    break;
                case (int)RoomStatus.RECYCLING:
                    Global.room = null;
                    UnityMainThread.wkr.AddJob(Route.GoHall);
                    break;
                case (int)RoomStatus.IDLE:
                    Debug.Log("玩家重进房间");
                    Global.isReconnect = true;
                    Global.player = Global.room._player;
                    if (Global.roomType == (int) FrameSync.RoomType.ROOM)
                        UnityMainThread.wkr.AddJob(Route.GoRoom);
                    else if(Global.roomType == (int)FrameSync.RoomType.TEAMROOM)
                        UnityMainThread.wkr.AddJob(Route.GoTeamRoom);
                    else if(Global.roomType == (int)FrameSync.RoomType.ASYCROOM)
                        UnityMainThread.wkr.AddJob(Route.GoAsymmetricRoom);
                    break;
                default:
                    if (Global.isAsymmetric)
                    {
                        UnityMainThread.wkr.AddJob(Route.GoAsymmetricMatchSetting);
                    }
                    else {
                        UnityMainThread.wkr.AddJob(Route.GoHall);
                    }
                    break;
            }

        }
        else
        {
            // 初始化失败
            Debug.Log("init失败");
            Global.client.Destroy();
            Debug.Log("鉴权失败"+baseResponse.RtnCode+"|"+baseResponse.Msg);
            OpenDialog("鉴权失败"+Util.ErrorMessage(baseResponse));
        }

    }



    private void LeaveRoom()
    {
        // 调用离开房间接口
        Global.client.LeaveRoom(res =>
        {
            if (res.RtnCode == 0)
            {
                Debug.Log("离开房间success");
                Route.GoHall();
            }
            else
            {
                Debug.Log("离开房间fail");
            }
        });
    }

    private void ChooseOpenIdType()
    {
        if (IsGuestLogin.isOn)
        {
            Config.openId = Util.MockOpenId();
            // demo生成昵称保存到global
            Global.playerName = Util.MockPlayerName();
        }
        else
        {
            if (String.IsNullOrEmpty(PlayerPrefs.GetString("openId")))
            {
                PlayerPrefs.SetString("openId",Util.MockOpenId());
                PlayerPrefs.SetString("playerName",Util.MockPlayerName());
                PlayerPrefs.Save();
            }
            Config.openId = PlayerPrefs.GetString("openId");
            Global.playerName = PlayerPrefs.GetString("playerName");
        }
    }

    private void DeleteOpenId()
    {
        PlayerPrefs.DeleteKey("openId");
    }


    public void JoinRoomCallback(JoinRoomBaseResponse res)
    {
        if (res.RtnCode == 0)
        {
            Global.reconnectState = res.RoomInfo.RoomStatus;
            Global.room = res.Room;
            Global.player = res.Room._player;
        }
        else
        {
            if (res.RtnCode == (int)ErrorCode.JOIN_OR_CREATE_ROOM_FAILED && Global._retryCount++ < 3)
            {
                //重新初始化
                Global._retryCount++;
                Debug.Log("重新加入");
                InitSDK();
            }
            else
            {
                Global._retryCount = 0;
                Debug.Log("重新加入房间失败");
                LeaveRoom();
            }
        }
    }

    void GoHall() {
        CheckParam();
        if (!isPass) return;

        isPass = false;
        InitSDK();

    }

    public void OpenDialog(string msg)
    {
        Dialog dialog = Instantiate(Dailog);
        dialog.Open("提示", msg);
    }

    public void CheckParam()
    {

        if (GameIdDropDown.value == 0 && GameIdInput.text == "")
        {
            OpenDialog("GameId  is empty");
            return;
        }
        if (GameIdInput.text.Length > 32)
        {
            OpenDialog("GameId over max length");
            return;
        }

        if (ClientIdDropDown.value == 0 && ClientIdInput.text == "")
        {
            OpenDialog("ClientId  is empty");
            return;
        }
        if (ClientIdInput.text.Length > 64)
        {
            OpenDialog("ClientId over max length");
            return;
        }
        if (MatchCodeDropDown.value == 0 && MatchCodeInput.text == "")
        {
            OpenDialog("matchCode  is empty");
            return;
        }
        if (MatchCodeInput.text.Length > 64)
        {
            OpenDialog("matchCode over max length");
            return;
        }
        isPass = true;
    }

    public void OnGameIdChanged(int type)
    {
        switch (type)
        {
            //下拉框
            case 0:
                // 只处理不等于0的情况，即下拉框选中的不是默认值
                if (GameIdDropDown.value != 0)
                {
                    // 清空输入框的值
                    GameIdInput.text = "";
                    // 下拉框不透明
                    GameIdDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                    // 输入框透明，防止遮挡
                    GameIdInput.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                }
                break;
            case 1:// 输入框
                // 只处理输入框文本不为空的情况
                if (GameIdInput.text != "")
                {
                    // 下拉框选中默认值（空白）
                    GameIdDropDown.value = 0;
                    // 下拉框透明    
                    GameIdDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                    // 输入框不透明，使输入框文本内容置顶
                    GameIdInput.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                }
                break;
        }
    }
    public void OnClientIdChanged(int type)
    {
        switch (type)
        {
            //下拉框
            case 0:
                // 只处理不等于0的情况，即下拉框选中的不是默认值
                if (ClientIdDropDown.value != 0)
                {
                    // 清空输入框的值
                    ClientIdInput.text = "";
                    // 下拉框不透明
                    ClientIdDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                    // 输入框透明，防止遮挡
                    ClientIdInput.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                }
                break;
            case 1:// 输入框
                // 只处理输入框文本不为空的情况
                if (ClientIdInput.text != "")
                {
                    // 下拉框选中默认值（空白）
                    ClientIdDropDown.value = 0;
                    // 下拉框透明    
                    ClientIdDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                    // 输入框不透明，使输入框文本内容置顶
                    ClientIdInput.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                }
                break;
        }
    }

    public void OnClientSecretChanged(int type)
    {
        switch (type)
        {
            //下拉框
            case 0:
                // 只处理不等于0的情况，即下拉框选中的不是默认值
                if (ClientSecrectDropDown.value != 0)
                {
                    // 清空输入框的值
                    ClientSecrectInput.text = "";
                    // 下拉框不透明
                    ClientSecrectDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                    // 输入框透明，防止遮挡
                    ClientSecrectInput.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                }
                break;
            case 1:// 输入框
                // 只处理输入框文本不为空的情况
                if (ClientSecrectInput.text != "")
                {
                    // 下拉框选中默认值（空白）
                    ClientSecrectDropDown.value = 0;
                    // 下拉框透明    
                    ClientSecrectDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                    // 输入框不透明，使输入框文本内容置顶
                    ClientSecrectInput.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                }
                break;
        }
    }
    
    public void OnMatchCodeChanged(int type)
    {
        switch (type)
        {
            //下拉框
            case 0:
                // 只处理不等于0的情况，即下拉框选中的不是默认值
                if (MatchCodeDropDown.value != 0)
                {
                    // 清空输入框的值
                    MatchCodeInput.text = "";
                    // 下拉框不透明
                    MatchCodeDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                    // 输入框透明，防止遮挡
                    MatchCodeInput.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                }
                break;
            case 1:// 输入框
                // 只处理输入框文本不为空的情况
                if (MatchCodeInput.text != "")
                {
                    // 下拉框选中默认值（空白）
                    MatchCodeDropDown.value = 0;
                    // 下拉框透明    
                    MatchCodeDropDown.GetComponent<Image>().color = new Color(1, 1, 1, 0);
                    // 输入框不透明，使输入框文本内容置顶
                    MatchCodeInput.GetComponent<Image>().color = new Color(1, 1, 1, 1);
                }
                break;
        }
    }
}
