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

var myLib = {

     $myFuncs: {
        heartBeatTimer: {},
        
        wsHeartBeatTimer: {},
        
        wsPushFrameTimer: {},
        
        matchTimer: {},
        
        wsQueryFrameTimer: {},
     
        ConvertParamToString: function (str) {
            return (UTF8ToString(str));
        },
        
        StringConvertToUnity: function (str) {
            var uStr = ((typeof (str) === "string") ? str : "");
            var bufferSize = lengthBytesUTF8(uStr) + 1;
            var buffer = _malloc(bufferSize);
            stringToUTF8(uStr, buffer, bufferSize);
            return buffer;
        },
        
        GOBEError: function (errorCode, message) {
            var response = {
                rtnCode: errorCode,
                msg: message
            }
            return response;
        },
        
        HeadersHandle: function (headerObj, sendToGameEdge) {
            var headers;
            headers = {
                appId: headerObj.appId
            };
            if (sendToGameEdge) {
                headers = {
                    appId: headerObj.appId,
                    requestId: headerObj.requestId,
                    sdkVersionCode: headerObj.sdkVersionCode,
                    serviceToken: headerObj.serviceToken,
                };
            }
            return headers;
        }
    },

    HttpPost: function (url, param, header, obj) {
        var requestedURL = myFuncs.ConvertParamToString(url);
        var paramString = myFuncs.ConvertParamToString(param);
        var headerString = myFuncs.ConvertParamToString(header);
        
        var requestBody = JSON.parse(paramString);
        var headerObj = JSON.parse(headerString);
        
        var sendToGameEdge = requestedURL.search("gamex-edge-service") != -1;
        var headers = myFuncs.HeadersHandle(headerObj, sendToGameEdge);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', requestedURL, false);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.withCredentials = false;
        if (headers) {
            Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        }
        try {
            xhr.send(JSON.stringify(requestBody));
        }  catch(err) {
            response = myFuncs.GOBEError(-1, 'GOBE Request Exception');
        }
        var response;
        xhr.onerror = function (e) {
            response = myFuncs.GOBEError(-1, 'GOBE Error');
        };
        xhr.ontimeout = function (e) {
            response = myFuncs.GOBEError(-1, 'GOBE Request Timeout');
        };
        if (xhr.readyState !== 4) {
            response = myFuncs.GOBEError(-1, 'GOBE Error');
        }
        if (xhr.status === 200) {
            var resp = JSON.parse(xhr.responseText);
            if (resp.rtnCode !== 0 && sendToGameEdge) {
                response = myFuncs.GOBEError(resp.rtnCode, resp.msg);
            }
            response = resp;
        } else {
            response = {
                data: xhr.responseText,
                status: xhr.status,
                statusText: xhr.statusText,
                headers: xhr.getAllResponseHeaders(),
                request: xhr,
            };
        }
        return myFuncs.StringConvertToUnity(JSON.stringify(response));
    },
    
    /**
     * 开启心跳定时任务
     */
    startHeartBeat: function (timeCycle, obj) {
        myFuncs.callBack = obj
        heartBeatTimer = setInterval(function() {
            Module.dynCall_v(myFuncs.callBack);
        }, timeCycle);
        return 0;
    },
    
    /**
     * 关闭心跳定时任务
     */
    stopHeartBeat: function () {
        clearInterval(heartBeatTimer);
    },
    
    /**
     * 开启WS心跳定时任务
     */
    startWSHeartBeat: function (timeCycle, obj) {
        myFuncs.wsHeartBeatCallback = obj
        wsHeartBeatTimer = setInterval(function() {
            Module.dynCall_v(myFuncs.wsHeartBeatCallback);
        }, timeCycle);
        return 0;
    },
    
    /**
     * 关闭WS心跳定时任务
     */
    stopWSHeartBeat: function () {
        clearInterval(wsHeartBeatTimer);
    },
    
    /**
     * 开启推帧队列定时任务
     */
    startPushFrameTimer: function (timeCycle, obj) {
        myFuncs.pushFrameMessageCallBack = obj
        wsPushFrameTimer = setInterval(function() {
            Module.dynCall_v(myFuncs.pushFrameMessageCallBack);
        }, timeCycle);
        return 0;
    },
    
    /**
     * 关闭推帧队列定时任务
     */
    stopPushFrameTimer: function () {
        clearInterval(wsPushFrameTimer);
    },
    
    /**
     * 开启匹配定时任务
     */
    startMatchTimer: function (timeCycle, obj) {
        myFuncs.matchCallBack = obj
        matchTimer = setInterval(function() {
            Module.dynCall_v(myFuncs.matchCallBack);
        }, timeCycle);
        return 0;
    },
    
    /**
     * 关闭匹配定时任务
     */
    stopMatchTimer: function () {
        clearInterval(matchTimer);
    },
    
    /**
     * 开启补帧定时任务
     */
    startQueryFrameTimer: function (timeCycle, obj) {
        myFuncs.queryFrameCallBack = obj
        wsQueryFrameTimer = setInterval(function() {
            Module.dynCall_v(myFuncs.queryFrameCallBack);
        }, timeCycle);
        return 0;
    },
    
    /**
     * 关闭补帧定时任务
     */
    stopQueryFrameTimer: function () {
        try {
    		if (wsQueryFrameTimer != null) {
                clearInterval(wsQueryFrameTimer);
            }
    	} catch(err) {
    		wsQueryFrameTimer = null;
    	}
    },

    /**
     * 关闭所有定时任务
     */
    stopAllTimer: function () {
        clearInterval(heartBeatTimer);
        clearInterval(wsHeartBeatTimer);
        clearInterval(wsPushFrameTimer);
        clearInterval(matchTimer);
        clearInterval(wsQueryFrameTimer);
    },

};

autoAddDeps(myLib, '$myFuncs');
mergeInto(LibraryManager.library, myLib);