/*
 * Copyright 2021. Huawei Technologies Co., Ltd. All rights reserved.
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
export class HttpUtil{
    private static baseUrl:string = "";

    //Post请求
    public static post(url, param:object = {}, callback){
        url = HttpUtil.baseUrl + url;
        var xhr = cc.loader.getXMLHttpRequest();
        xhr.open("POST", url, true);
        // xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded"
        xhr.setRequestHeader("Content-Type","application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                let response = xhr.responseText;
                if (xhr.status >= 200 && xhr.status < 300) {
                    let httpStatus = xhr.statusText;
                    callback(true, JSON.parse(response));
                }else{
                    callback(false, response);
                }
            }
        };
        xhr.send(JSON.stringify(param));
    }
}