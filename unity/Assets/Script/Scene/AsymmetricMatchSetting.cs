/**
 * Copyright 2024. Huawei Technologies Co., Ltd. All rights reserved.
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
using UnityEngine.UI;

public class AsymmetricMatchSetting : MonoBehaviour
{
    public InputField LevelInput;
    public InputField AgeInput;
    public InputField PowerInput;
    public InputField SkillInput;
    public InputField WeaponInput;
    public Toggle SinglePlayerToggle;
    public Button ConfirmBtn;

    // Start is called before the first frame update
    void Start()
    {
        InitListener();
    }


    private void InitListener()
    {
        ConfirmBtn.onClick.AddListener(() => OnclickConfirmBtn());
    }
    public void OnclickConfirmBtn() {
        Global.level = LevelInput.text != "" ? LevelInput.text : "";
        Global.age = AgeInput.text != "" ? AgeInput.text : "";
        Global.power = PowerInput.text != "" ? PowerInput.text : "";
        Global.skill = SkillInput.text != "" ? SkillInput.text : "";
        Global.weapon = WeaponInput.text != "" ? WeaponInput.text : "";
        Global.teamNumber = SinglePlayerToggle.isOn ? "1" : "11";
        Route.GoHall();
    }
}
