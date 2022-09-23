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
 
var WebSocketLibrary = {
	$webSocketState: {
		instances: {},

		onOpen: null,
		onMessage: null,
		onError: null,
		onClose: null,
		
		WEBSOCKET_INSTANCE_NOT_FOUND: -1,
		WEBSOCKET_CONNECTING: -2,
		WEBSOCKET_NOT_CONNECTED: -3,
		WEBSOCKET_CLOSING: -4,
		WEBSOCKET_CLOSED: -5,
		WEBSOCKET_NOT_OPEN: -6,
		WEBSOCKET_IS_INVALID: -7,
	},

	/**
	 * 移除WebSocket实例
	 */
	WebSocketFree: function() {
		var instance = webSocketState.instances;
		if (!instance) return 0;
		
		if (instance.ws && instance.ws.readyState < 2) {
			instance.ws.close();
		}

		delete webSocketState.instances;
		return 0;
	},

	/**
	 * 连接 WebSocket
	 */
	WebSocketConnect: function(url) {
	    var urlStr = UTF8ToString(url);
	    
		var instance = webSocketState.instances;
        
      	instance.ws = new WebSocket(urlStr, instance.subprotocols);

		instance.ws.binaryType = 'arraybuffer';
		
		instance.ws.onerror = function(ev) {
        	if (webSocketState.onError) {
        		var errorMsg = "WebSocket error.";
        		var errorMsgLength = lengthBytesUTF8(errorMsg) + 1;
        		var buffer = _malloc(errorMsgLength);
        		stringToUTF8(msg, buffer, length);
        
        		try {
        			Module.dynCall_vi(webSocketState.onError, buffer);
        		} finally {
        			_free(buffer);
        		}
        	}
        };
		
		instance.ws.onclose = function(ev) {
        	if (webSocketState.onClose) {
        		Module.dynCall_vi(webSocketState.onClose, ev.code);
            }
        
        	delete instance.ws;
        };
        		
        instance.ws.onopen = function() {
        	if (webSocketState.onOpen) {
        		Module.dynCall_v(webSocketState.onOpen);
        	}
        };

		instance.ws.onmessage = function(ev) {

			if (webSocketState.onMessage === null) {
				return;
			}

			if (ev.data instanceof ArrayBuffer) {
				var dataBuffer = new Uint8Array(ev.data);
            } else {
				var dataBuffer = (new TextEncoder()).encode(ev.data);
            }
            
            var buffer = _malloc(dataBuffer.length);
            HEAPU8.set(dataBuffer, buffer);
            
            try {
            	Module.dynCall_vii(webSocketState.onMessage, buffer, dataBuffer.length);
            } finally {
            	_free(buffer);
            }
		};

		return 0;
	},

	/**
	 * 关闭 WebSocket 连接
	 */
	WebSocketClose: function(code, reasonPtr) {
		var instance = webSocketState.instances;
		if (!instance) { 
		    return webSocketState.WEBSOCKET_INSTANCE_NOT_FOUND;
		}

		if (!instance.ws) {
			return webSocketState.WEBSOCKET_NOT_CONNECTED;	    
		}

		if (instance.ws.readyState === 2) {
			return webSocketState.WEBSOCKET_CLOSING;
		}

		if (instance.ws.readyState === 3) {
			return webSocketState.WEBSOCKET_CLOSED;
		}

		var reason = ( reasonPtr ? UTF8ToString(reasonPtr) : undefined );

		try {
			instance.ws.close(code, reason);
		} catch(err) {
			return webSocketState.WEBSOCKET_IS_INVALID;
		}

		return 0;
	},

	/**
	 * 发送数据 byte[]
	 */
	WebSocketSend: function(bufferPtr, length) {
		var instance = webSocketState.instances;
		if (!instance) {
		    return webSocketState.WEBSOCKET_INSTANCE_NOT_FOUND;
        }

		if (!instance.ws) {
			return webSocketState.WEBSOCKET_NOT_CONNECTED;
		}

		if (instance.ws.readyState !== 1) {
			return webSocketState.WEBSOCKET_NOT_OPEN;
		}

		instance.ws.send(HEAPU8.buffer.slice(bufferPtr, bufferPtr + length));

		return 0;
	},

	/**
	 * 发送数据 string
	 */
	WebSocketSendText: function(message) {
		var instance = webSocketState.instances;
		if (!instance) {
		    return webSocketState.WEBSOCKET_INSTANCE_NOT_FOUND;
        }
        
        if (!instance.ws) {
        	return webSocketState.WEBSOCKET_NOT_CONNECTED;
        }
        
        if (instance.ws.readyState !== 1) {
        	return webSocketState.WEBSOCKET_NOT_OPEN;
        }
		instance.ws.send(UTF8ToString(message));
		return 0;
	},
	
	/**
	 * 获取WebSocket状态
	 */
	WebSocketGetState: function() {
		var instance = webSocketState.instances;
		if (!instance) return webSocketState.WEBSOCKET_INSTANCE_NOT_FOUND;

		if (instance.ws) {
			return instance.ws.readyState;
		} else {
			return 3;
		}
	},
	
	/**
	 * WebSocket onOpen 回调
	 *
	 * @param C#的回调方法
	 */
	WebSocketSetOnOpen: function(callback) {
		webSocketState.onOpen = callback;
	},

	/**
	 * WebSocket onMessage 回调
	 *
	 * @param C#的回调方法
	 */
	WebSocketSetOnMessage: function(callback) {
		webSocketState.onMessage = callback;
	},

	/**
	 * WebSocket onError 回调
	 *
	 * @param C#的回调方法
	 */
	WebSocketSetOnError: function(callback) {
		webSocketState.onError = callback;
	},

	/**
	 * WebSocket onClose 回调
	 *
	 * @param C#的回调方法
	 */
	WebSocketSetOnClose: function(callback) {
		webSocketState.onClose = callback;
	},

};

autoAddDeps(WebSocketLibrary, '$webSocketState');
mergeInto(LibraryManager.library, WebSocketLibrary);
