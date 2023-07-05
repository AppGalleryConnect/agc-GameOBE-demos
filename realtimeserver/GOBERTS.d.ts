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

export declare interface ActionArgs {
    sender: string;
    gameData: string;
    roomId: string;
    SDK: {
        /**
         * 请求补帧
         * @param beginFrameId - 起始帧号
         * @param size - 请求帧数量
         */
        requestFrame: (beginFrameId: number, size: number) => Promise<void>;
        sendData: (data: string, players?: string[]) => Promise<void>;
        setCache: (key: string, value: string, expireTime: number) => Promise<void>;
        getCache: (key: string) => Promise<CacheValue>;
        deleteCache: (key: string) => Promise<void>;
        setCacheIfNotExist: (key: string, value: string, expireTime: number) => Promise<void>;
        getRoomInfo: () => Promise<RoomInfo>;
        log: {
            info: (message: string) => void;
            warn: (message: string) => void;
            error: (message: string) => void;
        };
        updateRoomProperties: (updateRoomInfo: UpdateRoomInfo) => Promise<void>;
        removePlayer: (playerId: string) => Promise<void>;
        dismiss: () => Promise<void>;
        getAutoFrame: () => boolean;
        getFrameRate: () => number;
    };
}

declare interface ArgsConfig {
    sender: string;
    roomId: string;
    appId: string;
    ticket: string;
    domain: string;
    projectId: string;
    gameData?: string;
    autoFrame: boolean;
    frameRate: number;
    frameRequesting: boolean;
    frameRequestSize: number;
    logger?: any;
}

export declare const enum AutoFrame {
    AUTO_FRAME_OFF = 0,
    AUTO_FRAME_ON = 1
}

declare interface BaseResponse {
    ret: {
        code: number;
        msg?: string;
    };
}

export declare interface CacheValue {
    value?: string;
}

declare interface CacheValue_2 {
    value?: string;
}

export declare type CommonFunc = (args: ActionArgs) => void;

declare interface CreateChannelResponse extends BaseResponse {
    data: CreateChannelResponseData;
}

declare interface CreateChannelResponseData {
    setupTicket: string;
    joinTicket: string;
}

export declare type ErrorFunc = (error: GOBEError, args: ActionArgs) => void;

/**
 * 附加信息
 * @public
 */
export declare interface FrameExtInfo {
    seed: number;
}

/**
 * 帧数据信息
 * @public
 */
export declare interface FrameInfo extends FramePlayerInfo {
    data: string[];
    timestamp: number;
}

/**
 * 帧数据玩家信息
 * @public
 */
export declare interface FramePlayerInfo {
    playerId: string;
}

export declare type FramePlayerInfoFunc = (playerInfo: FramePlayerInfo, args: ActionArgs) => void;

/**
 * 帧数据玩家信息
 * @public
 */
export declare interface FramePlayerPropInfo {
    playerId: string;
    customProp: string;
}

export declare interface GameServer {
    onCreateRoom: CommonFunc;
    onConnect?: CommonFunc;
    onDisconnect?: CommonFunc;
    onRecvFromClient?: CommonFunc;
    onDestroyRoom: CommonFunc;
    onJoin?: FramePlayerInfoFunc;
    onLeave?: FramePlayerInfoFunc;
    onStartFrameSync?: CommonFunc;
    onStopFrameSync?: CommonFunc;
    onRecvFrame?: OnRecvFrameFunc;
    onRecvFromClientV2?: OnRecvFromClientFunc;
    onRequestFrameError?: ErrorFunc;
    onRoomPropertiesChange?: OnRoomPropertiesChangeFunc;
    onUpdateCustomProperties?: OnUpdateCustomPropertiesFunc;
    onUpdateCustomStatus?: OnUpdateCustomStatusFunc;
    onRealTimeServerDisconnected?: CommonFunc;
    onRealTimeServerConnected?: CommonFunc;
}

declare interface GetCacheResponse extends BaseResponse {
    value?: string;
}

declare interface GetRoomInfoResponse extends BaseResponse {
    roomInfo: RoomInfo_2;
}

export declare interface gobeDevloperCode {
    appId: string;
    gameServer: GameServer;
}

/**
 * 自定义错误类
 * @public
 */
export declare class GOBEError extends Error {
    code: number;
    constructor(code: number, message?: string);
}

export declare const enum ImType {
    ALL_PLAYERS_EXCEPT_ME = 1,
    SPECIFILED_PLAYERS = 2
}

/**
 * 云侧sdk接口定义文档
 */
declare interface MethodRoute {
    createRoom: (request: ServerLessMethodRequest) => void;
}

export declare const myHandler: (event: serverInterface.ServerLessEvent, context: serverInterface.ServerLessContext, callback: (res: any) => void, logger: any) => void;

export declare type OnRecvFrameFunc = (msg: RecvFrameMessage | RecvFrameMessage[], args: ActionArgs) => void;

export declare type OnRecvFromClientFunc = (msg: RecvFromClientInfo, args: ActionArgs) => void;

export declare type OnRoomPropertiesChangeFunc = (msg: UpdateRoomInfo, args: ActionArgs) => void;

export declare type OnUpdateCustomPropertiesFunc = (player: FramePlayerPropInfo, args: ActionArgs) => void;

export declare type OnUpdateCustomStatusFunc = (msg: PlayerStatusInfo, args: ActionArgs) => void;

export declare interface PlayerInfo {
    playerId: string;
    status?: number;
    customPlayerStatus?: number;
    customPlayerProperties?: string;
    teamId?: string;
    isRobot?: number;
    robotName?: string;
    matchParams?: Record<string, string>;
}

declare interface PlayerInfo_2 {
    playerId: string;
    status?: number;
    customPlayerStatus?: number;
    customPlayerProperties?: string;
    teamId?: string;
    isRobot?: number;
    robotName?: string;
    matchParams?: Record<string, string>;
}

/**
 * 帧数据玩家信息
 * @public
 */
export declare interface PlayerStatusInfo {
    playerId: string;
    customStatus: number;
}

/**
 * 帧广播消息
 * @public
 */
export declare interface RecvFrameMessage extends ServerFrameMessage {
    isReplay: boolean;
    time: number;
}

/**
 * 房间消息广播回调参数
 * @param roomId - 房间ID
 * @param sendPlayerId - 发送者playerId
 * @param msg - 消息内容
 * @public
 */
export declare interface RecvFromClientInfo {
    srcPlayer: string;
    msg: string;
}

export declare interface RoomInfo {
    appId: string;
    roomId: string;
    roomType: string;
    roomCode: string;
    roomName: string;
    roomStatus: number;
    customRoomProperties: string;
    ownerId: string;
    maxPlayers: number;
    players: PlayerInfo[];
    router: RouterInfo;
    isPrivate: number;
    isLock: number;
    createTime: number;
}

declare interface RoomInfo_2 {
    appId: string;
    roomId: string;
    roomType: string;
    roomCode: string;
    roomName: string;
    roomStatus: number;
    customRoomProperties: string;
    ownerId: string;
    maxPlayers: number;
    players: PlayerInfo_2[];
    router: RouterInfo_2;
    isPrivate: number;
    isLock: number;
    createTime: number;
}

export declare interface RouterInfo {
    routerId: number;
    routerType: number;
    routerAddr: string;
}

declare interface RouterInfo_2 {
    routerId: number;
    routerType: number;
    routerAddr: string;
}

/**
 * 服务端 ACK 消息
 */
declare interface ServerAckMessage {
    rtnCode: number;
    msg: string;
}

/**
 * 服务端推送消息
 * @public
 */
export declare interface ServerFrameMessage {
    currentRoomFrameId: number;
    frameInfo: FrameInfo[];
    ext: FrameExtInfo;
}

/**
 * 服务端返回帧数据玩家信息
 * @public
 */
export declare interface ServerFramePlayerInfo extends FramePlayerInfo {
    extraInfo?: string;
}

declare namespace serverInterface {
    export {
        MethodRoute,
        ServerLessEvent,
        ServerLessEventBody,
        ServerLessEventBodyRequest,
        ServerLessContext,
        ServerLessMethodRequest,
        ArgsConfig,
        ServerAckMessage,
        BaseResponse,
        GetRoomInfoResponse,
        CreateChannelResponse,
        GetCacheResponse,
        CreateChannelResponseData,
        RoomInfo_2 as RoomInfo,
        PlayerInfo_2 as PlayerInfo,
        RouterInfo_2 as RouterInfo,
        CacheValue_2 as CacheValue
    }
}

declare interface ServerLessContext {
    env: {
        GOBE_EDGE_DOMAIN: string;
        DEVELOPER_PROJECT_ID: string;
        DEVELOPER_APP_ID: string;
        WS_HEARTBEAT_CYCLE: string;
    };
}

declare interface ServerLessEvent {
    body: string;
    headers: {
        ticket: string;
    };
}

declare interface ServerLessEventBody {
    method: keyof MethodRoute;
    request: string;
    data: string;
    setupTicket: string;
    joinTicket: string;
}

declare interface ServerLessEventBodyRequest {
    roomId: string;
    operator?: string;
    epAddress: string;
    autoFrame: string;
    frameRate: string;
}

declare interface ServerLessMethodRequest {
    roomId: string;
    operator?: string;
    ticket: string;
    domain: string;
    data: string;
    projectId: string;
    logger: any;
    appId: string;
    epAddress: string;
    setupTicket: string;
    joinTicket: string;
    autoFrame: string;
    frameRate: string;
    wsHeartbeatCycle: string;
}

/**
 * 可以更新的房间信息属性
 * @public
 * @param roomName - 房间名称
 * @param customRoomProperties - 房间自定义属性
 * @param ownerId - 房主ID
 * @param isPrivate - 是否私有
 * @param isLock - 是否锁定房间 0：非锁定（允许加入房间），1：锁定（不允许加入房间）
 */
export declare interface UpdateRoomInfo {
    roomName?: string;
    customRoomProperties?: string;
    ownerId?: string;
    isPrivate?: number;
    isLock?: number;
}

export { }
export as namespace GOBERTS
