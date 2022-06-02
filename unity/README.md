# GameOBEDemoForUnity

## Table of Contencs

* [Introduction](#Introduction)
* [Installation](#Installation)
* [Supported Environmencs](#Supported_Environmencs)
* [Configuration](#Configuration)
* [Sample Code](#Sample_Code)
* [License](#License)

<a id="Introduction"></a>

## Introduction

The GameOBEDemoForUnity sample code provides functions such as creating a room, joining a room, starting a game, and stopping a game. It provides an online battle game sample program for your reference or use.   
Example: Sample code package. Import sample code packages to run, reference, or use.   
SDK: Huawei provides a set of SDKs for online game services.

<a id="Installation"></a>

## Installation

Before using the online battle sample code, check that Unity Hub and Unity 2021.2.15f1c1 are installed.
Decompress the sample code package. In Project of Unity Hub, import the GameOBEDemoForUnity file from the decompressed folder.

<a id="Supported_Environmencs"></a>

## Supported Environmencs

Unity 2021.2.15f1c1 or a later version is recommended.

<a id="Configuration"></a>

## Configuration

To use functions provided by packages in example, you need to set related parameters in \Assets\Config.cs.   
The following describes parameters in \Assets\Config.cs:

| parameters | describes |
|:----- |:-------|
| gameId      |    Game ID, Identify a game. |
| openId      |  Distinguish between different users. |
| clientId    |  Unique identifier used for authentication when integrating SDK. Get from [AppGallery Connect (AGC)](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html#/). |
| cliencsecret|  Key used for authentication when integrating SDK. Get from [AppGallery Connect (AGC)](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html#/). |

<a id="Sample_Code"></a>

## Sample Code

The project structure complies with the Unity standard project. You can find more information
from [the unity official website](https://www.unity.cn/).

* Directory: Assets/resources

  Save picture, video, audio and other resource files.

* Directory: Assets/Scene

  According to the sequence of entry, it includes six game scenes: Home, Hall, Room, Team, Match and GameView.

* Directory: Assets/Script

  Store scripcs from game scenes.

The following is a brief description of the scene design files and corresponding scripcs.

* Home page of game battle platform.

  \Assets\Scene\Home.unity  
  \Assets\Script\scene\Home.cs

* In these scenes, player can perform five operations. If the player wancs to join the room, the player needs to select the area that he wancs to enter, which now includes the rookie area and the expert area. If you want to perform a quick match, you can click the Quick Match button. The system will automatically match the right players for you; Players can also choose to create or join teams and play with friends.

  \Assets\Scene\Hall.unity  
  \Assets\Script\scene\Hall.cs
 
* After the player enters the Match Page the player can choose to join a room or create a room, or select Quick Match to enter the appropriate room to quickly start the game.

  \Assets\Scene\Match.unity  
  \Assets\Script\scene\Match.cs
  
* These pages are used to creating rooms. The room list, Players can select or enter a room number to join a room. And then, Players can click Prepare or leave the room. homeowner is responsible for clicking  to get started.

  \Assets\Scene\CreateRoom.unity  
  \Assets\Script\scene\CreateRoom.cs
  
  \Assets\Scene\Roomlist.unity  
  \Assets\Script\scene\Roomlist.cs
  
  \Assets\Scene\Room.unity  
  \Assets\Script\scene\Room.cs
  
* These pages are used to create teams and display team information. The team list, Players can select or enter a room number to join a room; The team room page is used to display the information about the  successfully matched team rooms. Players can click to prepare or leave the room. All players are ready and the homeowner is responsible for clicking the start button to enter the game scene.

  \Assets\Scene\team.unity  
  \Assets\Script\scene\team.cs
  
  \Assets\Scene\TeamInfoView.unity  
  \Assets\Script\scene\TeamInfoView.cs
  
  \Assets\Scene\teamroom.unity  
  \Assets\Script\scene\teamroom.cs

* After the homeowner clicks to start the game, the player enters the game. Then, the game begins.

  \Assets\Scene\GameView.unity  
  \Assets\Script\scene\GameView.cs

<a id="License"></a>

## License

GameOBEDemoForUnity example is licensed under the [Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
