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

import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;
import Component = cc.Component;
import {RecordInfo} from "../../GOBE/GOBE";
import global from "../../global";
import * as Util from "../../util";
import {getFileHash} from "../../util";
import {CmdType, frameSyncPlayerInitList, frameSyncPlayerList, GameSceneType} from "./FrameSync";
import * as JSZip from "jszip";

@ccclass
export class RecordItem extends Component {
    @property(cc.Label)
    public recordId: cc.Label | null = null;

    @property(cc.Label)
    public createTime: cc.Label | null = null;

    @property(cc.Node)
    public recordBtn: cc.Node | null = null;

    private id: string;
    private roomId: string;
    private url: string;
    private sha256: string;

    init(record: RecordInfo) {
        this.id = record.recordId;
        this.roomId = record.roomId;
        this.recordId.string = record.recordId;
        this.url = record.url;
        this.sha256 = record.fileSha256;
        this.createTime.string = Util.getDate(Number(record.createTime));

        this.recordBtn.on(cc.Node.EventType.TOUCH_START, () => this.getRecordById())
    }

    getRecordById() {
        global.client.queryRecordById(this.id)
            .then((res) => {
                Util.printLog(`查询战绩成功${JSON.stringify(res)}`);
                if (res.url) {
                    let remoteUrl = res.url;
                    let fileSha256 = res.fileSha256;
                    Util.download(remoteUrl)
                        .then(async (res: ArrayBuffer) => {
                            const pathName = remoteUrl.substring(remoteUrl.lastIndexOf('_') + 1, remoteUrl.lastIndexOf('.'));
                            const fileName = remoteUrl.substring(remoteUrl.lastIndexOf('/') + 1, remoteUrl.lastIndexOf('.'));
                            let result;
                            if (cc.sys.isBrowser) {
                                const sha256 = await getFileHash(res);
                                result = sha256 == fileSha256;
                                console.log(`文件完整性校验成功,sha256: ${sha256}`);
                            }
                            else {
                                result = true;
                            }
                            if (result) {
                                let newZip = new JSZip();
                                newZip.loadAsync(res).then(zip => {
                                    zip.file(`${pathName}/${fileName}.data`).async('text').then(data => {
                                        let lines = data.split('\n');
                                        lines.forEach((item, idx) => {
                                            if(!item) {
                                                lines.splice(idx, 1);
                                            }
                                        });
                                        global.gameSceneType = GameSceneType.FOR_RECORD;

                                        let hasFindSyncRoomInfo = false;
                                        for(let i = 0; i < lines.length; i++) {
                                            let line = JSON.parse(lines[i]);
                                            let frame: GOBE.RecvFrameMessage = {
                                                currentRoomFrameId: line.data.frameId,
                                                frameInfo: line.data?.frameInfo,
                                                ext: {
                                                    seed: line.data.seed,
                                                },
                                                isReplay: false,
                                                time: line.ts
                                            }

                                            if (!hasFindSyncRoomInfo && frame.frameInfo && frame.frameInfo.length > 0) {
                                                for(let j =0; j < frame.frameInfo.length; j++) {
                                                    let frameData: string[] = frame.frameInfo[j].data;
                                                    if (frameData && frameData.length > 0) {
                                                        for(let k = 0; k < frameData.length; k++) {
                                                            let obj = JSON.parse(frameData[k]);
                                                            if(obj.cmd == CmdType.syncRoomInfo) {
                                                                frameSyncPlayerInitList.players = obj.roomInfo.players;
                                                                frameSyncPlayerList.players = obj.roomInfo.players;
                                                                global.roomType = obj.roomInfo.roomType;
                                                                global.recordRoomInfo = obj.roomInfo;
                                                                hasFindSyncRoomInfo = true;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if (hasFindSyncRoomInfo) {
                                                        break;
                                                    }
                                                }
                                            }
                                            global.unhandleFrames.push(frame);
                                        }
                                    cc.director.loadScene("game");
                                });
                                });
                            }
                            else{
                                Util.printLog(`sha256校验不一致，recordId：${this.id}`);
                            }
                        })
                        .catch((err) => {
                            Util.printLog('download err : ' + err);
                        });
                }
            })
            .catch((err) => {
                Util.printLog(`查询战绩失败,err: ${err}`);
            });
    }
}
