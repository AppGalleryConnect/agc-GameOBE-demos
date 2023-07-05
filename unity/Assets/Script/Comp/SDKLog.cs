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

#if !UNITY_WEBGL || UNITY_EDITOR
using NLog;
using NLog.Config;
using NLog.Targets;
using NLog.Targets.Wrappers;
using UnityEngine;


public static class SDKLog
{
    private static string layout =
        "${longdate}|${callsite:fileName=true}|${logger}|${level:uppercase=true}|${threadid}|${message}|${exception:format=tostring}";

    private static Target runLog, sdkDebuggerLog, requestOutLog, testLog;
    
    private static LoggingConfiguration config = new LoggingConfiguration();
    
    private static void InitConsoleTargetLog()
    {
        sdkDebuggerLog = new ConsoleTarget()
        {
            Name = "sdkDebuggerLog",
            Layout = layout,
            AutoFlush = true
        };
        
        // 通用的所有run日志
        runLog = new ConsoleTarget()
        {
            Name = "runLog",
            Layout = layout,
            AutoFlush = true
        };
        
        // requestOutLog日志
        requestOutLog = new ConsoleTarget()
        {
            Name = "requestOutLog",
            Layout = layout,
            AutoFlush = true
        };
    }

    private static void InitFileTargetLog()
    {
        // 通用的所有run日志
        runLog = new FileTarget()
        {
            FileName = Application.persistentDataPath  + "/gobe/sdklog/runLog/runLog.log",
            Name = "runLog",
            Layout = layout,
            ArchiveFileName = Application.persistentDataPath  + "/gobe/sdklog/runLog/runLog.${shortdate}_{#}.log",
            ArchiveNumbering = ArchiveNumberingMode.Sequence,
            ArchiveAboveSize = 20971520,
            MaxArchiveFiles = 24,
            ArchiveEvery = FileArchivePeriod.Day,
            ConcurrentWrites = false,
            KeepFileOpen = false
        };

        // requestOutLog日志
        requestOutLog = new FileTarget()
        {
            Name = "requestOutLog",
            FileName = Application.persistentDataPath  + "/gobe/sdklog/requestOutLog/requestOutLog.log",
            Layout = layout,
            ArchiveFileName = Application.persistentDataPath  + "/gobe/sdklog/requestOutLog/requestOutLog.${shortdate}_{#}.log",
            ArchiveNumbering = ArchiveNumberingMode.Sequence,
            ArchiveAboveSize = 20971520,
            MaxArchiveFiles = 24,
            ArchiveEvery = FileArchivePeriod.Day,
            ConcurrentWrites = false,
            KeepFileOpen = false
        };
        
        // SDKDebugger日志
        sdkDebuggerLog = new FileTarget()
        {
            Name = "sdkDebuggerLog",
            FileName = Application.persistentDataPath  + "/gobe/sdklog/sdkDebuggerLog/sdkDebuggerLog.log",
            Layout = layout,
            ArchiveFileName = Application.persistentDataPath  + "/gobe/sdklog/sdkDebuggerLog/sdkDebuggerLog.${shortdate}_{#}.log",
            ArchiveNumbering = ArchiveNumberingMode.Sequence,
            ArchiveAboveSize = 20971520,
            MaxArchiveFiles = 24,
            ArchiveEvery = FileArchivePeriod.Day,
            ConcurrentWrites = false,
            KeepFileOpen = false
        };
    }
    
    public static void InitSDKLog(LogLevel logLevel)
    {
        config.LoggingRules.Clear();
        
        if (SDKLog.SDKLogTarget == "file")
        {
            InitFileTargetLog();
        }
        else
        {
            InitConsoleTargetLog();
        }
        
        // 通用的所有run日志
        config.LoggingRules.Add(new LoggingRule("runLog", 
            logLevel, 
            new AsyncTargetWrapper(runLog, 10000, AsyncTargetWrapperOverflowAction.Block)));
        
        // requestOutLog日志
        config.LoggingRules.Add(new LoggingRule("requestOutLog", 
            logLevel, 
            new AsyncTargetWrapper(requestOutLog, 10000, AsyncTargetWrapperOverflowAction.Block)));
        
        // sdkDebuggerLog日志
        config.LoggingRules.Add(new LoggingRule("sdkDebuggerLog", 
            logLevel, 
            new AsyncTargetWrapper(sdkDebuggerLog, 10000, AsyncTargetWrapperOverflowAction.Block)));
        
        LogManager.Configuration = config;
    }

    public static string SDKLogTarget { get; set; } = "file";
}

#endif
