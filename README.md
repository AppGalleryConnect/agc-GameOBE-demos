# GameOBECocosDemo

## Table of Contents

* [Introduction](#Introduction)
* [Installation](#Installation)
* [Supported Environments](#Supported_Environments)
* [Configuration](#Configuration)
* [Sample Code](#Sample_Code)
* [License](#License)

<a id="Introduction"></a>

## Introduction

The GameOBECocosDemo sample code provides functions such as creating a room, joining a room, starting a game, and stopping a game. It provides an online battle game sample program for your reference or use.   
Example: Sample code package. Import sample code packages to run, reference, or use.   
SDK: Huawei provides a set of SDKs for online game services.

<a id="Installation"></a>

## Installation

Before using the online battle sample code, check that Cocos Dashboard and Cocos Creator 2.4.4+ are installed.
Decompress the sample code package. In Project of Cocos Dashboard, import the GameOBECocosDemo file from the decompressed folder.

<a id="Supported_Environments"></a>

## Supported Environments

Cocos Creator 2.4.4 or a later version is recommended.

<a id="Configuration"></a>

## Configuration

To use functions provided by packages in example, you need to set related parameters in \assets\config.ts.   
The following describes parameters in \assets\config.ts:

| parameters | describes |
   |:----- |:-------|
| gameId      |    Game ID, Identify a game. |
| openId      |  Distinguish between different users. |
| grantType   |  Authentication mode, the default is "client_credentials". |
| clientId    |  Unique identifier used for authentication when integrating SDK. Get from [AppGallery Connect (AGC)](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html#/). |
| clientSecret|  Key used for authentication when integrating SDK. Get from [AppGallery Connect (AGC)](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html#/). |

<a id="Sample_Code"></a>

## Sample Code

The project structure complies with the Cocos standard project. You can find more information
from [the cocos official website](https://www.cocos.com/).

* Directory: assets/resources

  Save picture, video, audio and other resource files.

* Directory: assets/Scene

  According to the sequence of entry, it includes six game scenes: home, hall, room, team, match and game.

* Directory: assets/Script

  Store scripts from game scenes.

The following is a brief description of the scene design files and corresponding scripts.

* Home page of game battle platform.

  \assets\Scene\home.fire  
  \assets\Script\scene\home.ts
  

* In these scenes, player can perform five operations. If the player wants to join the room, the player needs to select the area that he wants to enter, which now includes the rookie area and the expert area. If you want to perform a quick match, you can click the Quick Match button. The system will automatically match the right players for you; Players can also choose to create or join teams and play with friends.

  \assets\Scene\hall.fire  
  \assets\Script\scene\hall.ts
 
* After the player enters the match Page the player can choose to join a room or create a room, or select Quick Match to enter the appropriate room to quickly start the game.

  \assets\Scene\match.fire  
  \assets\Script\scene\match.ts
  
* These pages are used to creating rooms. The room list, Players can select or enter a room number to join a room. And then, Players can click Prepare or leave the room. homeowner is responsible for clicking  to get started.

  \assets\Scene\roominfo.fire  
  \assets\Script\scene\roominfo.ts
  
  \assets\Scene\roomlist.fire  
  \assets\Script\scene\roomlist.ts
  
  \assets\Scene\room.fire  
  \assets\Script\scene\room.ts
  
* These pages are used to create teams and display team information. The team list, Players can select or enter a room number to join a room; The team room page is used to display the information about the  successfully matched team rooms. Players can click to prepare or leave the room. All players are ready and the homeowner is responsible for clicking the start button to enter the game scene.

  \assets\Scene\team.fire  
  \assets\Script\scene\team.ts
  
  \assets\Scene\teaminfo.fire  
  \assets\Script\scene\teaminfo.ts
  
  \assets\Scene\teamroom.fire  
  \assets\Script\scene\teamroom.ts
  

* After the homeowner clicks to start the game, the player enters the game. Then, the game begins.

  \assets\Scene\game.fire  
  \assets\Script\scene\game.ts
  

<a id="License"></a>

## License

GameOBECocosDemo example is licensed under the [Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
