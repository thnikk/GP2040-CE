#include "MainMenuScreen.h"
#include "hardware/watchdog.h"
#include "system.h"

#include <cctype>

extern uint32_t getMillis();

static const char* themeNames[] = {
    "Static Rainbow", "Xbox", "Xbox (All)", "Super Famicom",
    "Super Famicom (All)", "PlayStation", "PlayStation (All)",
    "NeoGeo", "NeoGeo Curved", "NeoGeo Modern",
    "6 Button Fighter", "6 Button Fighter+",
    "Street Fighter 2", "Tekken",
    "Guilty Gear A", "Guilty Gear B", "Guilty Gear C",
    "Guilty Gear D", "Guilty Gear E",
    "Fightboard", "Springboard",
};
static const int themeCount = sizeof(themeNames) / sizeof(themeNames[0]);

void MainMenuScreen::init() {
    getRenderer()->clearScreen();
    currentMenu = &mainMenu;
    previousMenu = nullptr;

    exitToScreen = -1;

    gpMenu = new GPMenu();
    gpMenu->setRenderer(getRenderer());
    gpMenu->setPosition(8, 16);
    gpMenu->setStrokeColor(1);
    gpMenu->setFillColor(1);
    gpMenu->setMenuSize(18, 4);
    gpMenu->setViewport(this->getViewport());
    gpMenu->setShape(GPShape_Type::GP_SHAPE_SQUARE);
    gpMenu->setMenuData(currentMenu);
    gpMenu->setMenuTitle(MAIN_MENU_NAME);
    addElement(gpMenu);

    mapMenuUp = new GamepadButtonMapping(0);
    mapMenuDown = new GamepadButtonMapping(0);
    mapMenuLeft = new GamepadButtonMapping(0);
    mapMenuRight = new GamepadButtonMapping(0);
    mapMenuSelect = new GamepadButtonMapping(0);
    mapMenuBack = new GamepadButtonMapping(0);
    mapMenuToggle = new GamepadButtonMapping(0);

    // populate the profiles menu
    uint8_t profileCount = (sizeof(Storage::getInstance().getProfileOptions().gpioMappingsSets)/sizeof(GpioMappings))+1;
    for (uint8_t profileCtr = 0; profileCtr < profileCount; profileCtr++) {
        std::string menuLabel = "";
        if (profileCtr == 0) {
            menuLabel = Storage::getInstance().getGpioMappings().profileLabel;
        } else {
            menuLabel = Storage::getInstance().getProfileOptions().gpioMappingsSets[profileCtr-1].profileLabel;
        }
        if (menuLabel.empty()) {
            menuLabel = "Profile #" + std::to_string(profileCtr);
        }
        for (auto &c : menuLabel) c = toupper(c);
        MenuEntry menuEntry = {menuLabel, NULL, nullptr, std::bind(&MainMenuScreen::currentProfile, this), std::bind(&MainMenuScreen::selectProfile, this), profileCtr+1};
        profilesMenu.push_back(menuEntry);
    }

    bool focusPinFound = false;
    GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();
    for (Pin_t pin = 0; pin < (Pin_t)NUM_BANK0_GPIOS; pin++) {
        switch (pinMappings[pin].action) {
            case GpioAction::MENU_NAVIGATION_UP: mapMenuUp->pinMask |= 1 << pin; break;
            case GpioAction::MENU_NAVIGATION_DOWN: mapMenuDown->pinMask |= 1 << pin; break;
            case GpioAction::MENU_NAVIGATION_LEFT: mapMenuLeft->pinMask |= 1 << pin; break;
            case GpioAction::MENU_NAVIGATION_RIGHT: mapMenuRight->pinMask |= 1 << pin; break;
            case GpioAction::MENU_NAVIGATION_SELECT: mapMenuSelect->pinMask |= 1 << pin; break;
            case GpioAction::MENU_NAVIGATION_BACK: mapMenuBack->pinMask |= 1 << pin; break;
            case GpioAction::MENU_NAVIGATION_TOGGLE: mapMenuToggle->pinMask |= 1 << pin; break;
            case GpioAction::BUTTON_PRESS_B1: navB1PinMask |= 1 << pin; break;
            case GpioAction::BUTTON_PRESS_B2: navB2PinMask |= 1 << pin; break;
            case GpioAction::BUTTON_PRESS_UP: navUpPinMask |= 1 << pin; break;
            case GpioAction::BUTTON_PRESS_DOWN: navDownPinMask |= 1 << pin; break;
            case GpioAction::BUTTON_PRESS_LEFT: navLeftPinMask |= 1 << pin; break;
            case GpioAction::BUTTON_PRESS_RIGHT: navRightPinMask |= 1 << pin; break;
            case GpioAction::SUSTAIN_FOCUS_MODE: focusPinFound = true; break;
            default:    break;
        }
    }

    changeRequiresReboot = false;
    changeRequiresSave = false;
    prevInputMode = Storage::getInstance().GetGamepad()->getOptions().inputMode;
    updateInputMode = Storage::getInstance().GetGamepad()->getOptions().inputMode;
    
    prevDpadMode = Storage::getInstance().GetGamepad()->getOptions().dpadMode;
    updateDpadMode = Storage::getInstance().GetGamepad()->getOptions().dpadMode;
    
    prevSocdMode = Storage::getInstance().GetGamepad()->getOptions().socdMode;
    updateSocdMode = Storage::getInstance().GetGamepad()->getOptions().socdMode;
    
    prevProfile = Storage::getInstance().GetGamepad()->getOptions().profileNumber;
    updateProfile = Storage::getInstance().GetGamepad()->getOptions().profileNumber;
    
    prevFocus = Storage::getInstance().getAddonOptions().focusModeOptions.enabled;
    updateFocus = Storage::getInstance().getAddonOptions().focusModeOptions.enabled;
    
    prevTurbo = Storage::getInstance().getAddonOptions().turboOptions.enabled;
    updateTurbo = Storage::getInstance().getAddonOptions().turboOptions.enabled;

    AnimationOptions animOpts = AnimationStore.getAnimationOptions();
    prevAnimationIndex = animOpts.baseAnimationIndex;
    updateAnimationIndex = animOpts.baseAnimationIndex;
    prevThemeIndex = animOpts.themeIndex;
    updateThemeIndex = animOpts.themeIndex;
    prevBrightness = animOpts.brightness;
    updateBrightness = animOpts.brightness;

    themeMenu.clear();
    for (int i = 0; i < themeCount; i++) {
        std::string name = themeNames[i];
        for (auto &c : name) c = toupper(c);
        themeMenu.push_back({name, NULL, nullptr,
            std::bind(&MainMenuScreen::currentTheme, this),
            std::bind(&MainMenuScreen::selectTheme, this), i});
    }

    brightnessMenu.clear();
    for (uint8_t i = 0; i <= AnimationStation::brightnessSteps; i++) {
        std::string label = std::to_string(i);
        brightnessMenu.push_back({label, NULL, nullptr,
            std::bind(&MainMenuScreen::currentBrightness, this),
            std::bind(&MainMenuScreen::selectBrightness, this), i});
    }

    mainMenu.clear();
    mainMenu.push_back({"Input Mode", NULL, &inputModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"D-Pad Mode", NULL, &dpadModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"SOCD Mode", NULL, &socdModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"Profile", NULL, &profilesMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    if (focusPinFound && Storage::getInstance().getAddonOptions().focusModeOptions.buttonLockMask != 0)
        mainMenu.push_back({"Focus Mode", NULL, &focusModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"Turbo", NULL, &turboModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"LED Config", NULL, &ledMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"Remap", NULL, nullptr, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::selectRemap, this)});
    mainMenu.push_back({"Save & Exit", NULL, &saveMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});

    gpMenu->setMenuData(currentMenu);
    gpMenu->setMenuTitle(MAIN_MENU_NAME);

    prevValues = Storage::getInstance().GetGamepad()->debouncedGpio;
}

void MainMenuScreen::shutdown() {
    clearElements();
    exitToScreen = -1;
}

void MainMenuScreen::drawScreen() {
    gpMenu->setVisibility(!screenIsPrompting);

    if (!screenIsPrompting) {

    } else {
        getRenderer()->drawText(1, 1, "Config has changed.");
        if (changeRequiresSave && !changeRequiresReboot) {
            getRenderer()->drawText(3, 3, "Would you like");
            getRenderer()->drawText(6, 4, "to save?");
        } else if (changeRequiresSave && changeRequiresReboot) {
            getRenderer()->drawText(3, 3, "Would you like");
            getRenderer()->drawText(1, 4, "to save & restart?");
        } else {

        }
        
        if (promptChoice) getRenderer()->drawText(5, 6, CHAR_RIGHT);
        getRenderer()->drawText(6, 6, "Yes");
        if (!promptChoice) getRenderer()->drawText(11, 6, CHAR_RIGHT);
        getRenderer()->drawText(12, 6, "No");
    }
}

void MainMenuScreen::setMenu(std::vector<MenuEntry>* menu) {
    currentMenu = menu;
}

int8_t MainMenuScreen::update() {
    Mask_t values = Storage::getInstance().GetGamepad()->debouncedGpio;

    bool actionFired = false;

    // Check dedicated menu GPIO pins + gamepad button pin masks
    if (!isPressed && prevValues != values) {
        if (values & mapMenuUp->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_UP);
            actionFired = true;
        } else if (values & mapMenuDown->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_DOWN);
            actionFired = true;
        } else if (values & mapMenuSelect->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_SELECT);
            actionFired = true;
        } else if (values & mapMenuBack->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_BACK);
            actionFired = true;
        } else if (values & navB1PinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_SELECT);
            actionFired = true;
        } else if (values & navB2PinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_BACK);
            actionFired = true;
        } else if (values & navUpPinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_UP);
            actionFired = true;
        } else if (values & navDownPinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_DOWN);
            actionFired = true;
        } else if (values & navLeftPinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_LEFT);
            actionFired = true;
        } else if (values & navRightPinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_RIGHT);
            actionFired = true;
        }
    } else {
        isPressed = false;
    }

    // Check for pending navigation actions from Core0 hotkeys
    if (pendingNavAction != 0xFF) {
        updateMenuNavigation((GpioAction)pendingNavAction);
        pendingNavAction = 0xFF;
        actionFired = true;
    }

    isPressed = actionFired;

    prevValues = values;

    if ((exitToScreen != -1) && ((changeRequiresSave) || (changeRequiresReboot))) {
        exitToScreenBeforePrompt = exitToScreen;
        exitToScreen = -1;
        screenIsPrompting = true;
    }

    return exitToScreen;
}

void MainMenuScreen::updateMenuNavigation(GpioAction action) {
    bool changeIndex = false;
    uint16_t menuSize = gpMenu->getDataSize();

    switch (action) { 
        case GpioAction::MENU_NAVIGATION_UP:
            if (!screenIsPrompting) {
                if (menuIndex > 0) {
                    menuIndex--;
                } else {
                    menuIndex = menuSize-1;
                }
                changeIndex = true;
            } else {
                promptChoice = !promptChoice;
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_DOWN:
            if (!screenIsPrompting) {
                if (menuIndex < menuSize-1) {
                    menuIndex++;
                } else {
                    menuIndex = 0;
                }
                changeIndex = true;
            } else {
                promptChoice = !promptChoice;
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_LEFT:
            if (screenIsPrompting) {
                promptChoice = !promptChoice;
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_RIGHT:
            if (screenIsPrompting) {
                promptChoice = !promptChoice;
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_SELECT:
            if (!screenIsPrompting) {
                if (currentMenu->at(menuIndex).submenu != nullptr) {
                    previousMenu = currentMenu;
                    currentMenu = currentMenu->at(menuIndex).submenu;
                    gpMenu->setMenuData(currentMenu);
                    gpMenu->setMenuTitle(previousMenu->at(menuIndex).label);
                    menuIndex = 0;
                    changeIndex = true;
                } else {
                    currentMenu->at(menuIndex).action();
                }
            } else {
                if (promptChoice) {
                    saveOptions();
                } else {
                    resetOptions();
                    exitToScreen = DisplayMode::BUTTONS;
                    exitToScreenBeforePrompt = DisplayMode::BUTTONS;
                    isPressed = false;
                }
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_BACK:
            if (!screenIsPrompting) {
                if (previousMenu != nullptr) {
                    currentMenu = previousMenu;
                    previousMenu = nullptr;
                    menuIndex = 0;
                    changeIndex = true;
                    gpMenu->setMenuData(currentMenu);
                    gpMenu->setMenuTitle(MAIN_MENU_NAME);
                } else {
                    exitToScreen = DisplayMode::BUTTONS;
                    exitToScreenBeforePrompt = DisplayMode::BUTTONS;
                    isPressed = false;
                }
            } else {
                // back again goes back to the menu
                screenIsPrompting = false;
                isPressed = false;
            }
            isPressed = true;
            break;
        default:
            break;
    }

    if (changeIndex) gpMenu->setIndex(menuIndex);
}

void MainMenuScreen::saveAndExit() {
    saveOptions();
}

int32_t MainMenuScreen::modeValue() {
    return -1;
}

void MainMenuScreen::selectInputMode() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        InputMode valueToSave = (InputMode)currentMenu->at(menuIndex).optionValue;
        prevInputMode = Storage::getInstance().GetGamepad()->getOptions().inputMode;
        updateInputMode = valueToSave;

        if (prevInputMode != valueToSave) {
            // input mode requires a save and reboot
            changeRequiresReboot = true;
            changeRequiresSave = true;
        }
    }
}

int32_t MainMenuScreen::currentInputMode() {
    return updateInputMode;
}

void MainMenuScreen::selectDPadMode() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        DpadMode valueToSave = (DpadMode)currentMenu->at(menuIndex).optionValue;
        prevDpadMode = Storage::getInstance().GetGamepad()->getOptions().dpadMode;
        updateDpadMode = valueToSave;

        if (prevDpadMode != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentDpadMode() {
    return updateDpadMode;
}

void MainMenuScreen::selectSOCDMode() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        SOCDMode valueToSave = (SOCDMode)currentMenu->at(menuIndex).optionValue;
        prevSocdMode = Storage::getInstance().GetGamepad()->getOptions().socdMode;
        updateSocdMode = valueToSave;

        if (prevDpadMode != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentSOCDMode() {
    return updateSocdMode;
}

void MainMenuScreen::resetOptions() {
    if (changeRequiresSave) {
        if (prevInputMode != updateInputMode) updateInputMode = prevInputMode;
        if (prevDpadMode != updateDpadMode) updateDpadMode = prevDpadMode;
        if (prevSocdMode != updateSocdMode) updateSocdMode = prevSocdMode;
        if (prevProfile != updateProfile) updateProfile = prevProfile;
        if (prevFocus != updateFocus) updateFocus = prevFocus;
        if (prevTurbo != updateTurbo) updateTurbo = prevTurbo;
        if (prevAnimationIndex != updateAnimationIndex) updateAnimationIndex = prevAnimationIndex;
        if (prevThemeIndex != updateThemeIndex) updateThemeIndex = prevThemeIndex;
        if (prevBrightness != updateBrightness) updateBrightness = prevBrightness;
    }

    changeRequiresSave = false;
    changeRequiresReboot = false;
    screenIsPrompting = false;
}

void MainMenuScreen::saveOptions() {
    GamepadOptions& options = Storage::getInstance().getGamepadOptions();

    if (changeRequiresSave) {
        bool saveHasChanged = false;
        bool animHasChanged = false;
        if (prevInputMode != updateInputMode) {
            options.inputMode = updateInputMode;
            saveHasChanged = true;
        }
        if (prevDpadMode != updateDpadMode) {
            options.dpadMode = updateDpadMode;
            saveHasChanged = true;
        }
        if (prevSocdMode != updateSocdMode) {
            options.socdMode = updateSocdMode;
            saveHasChanged = true;
        }
        if (prevProfile != updateProfile) {
            options.profileNumber = updateProfile;
            saveHasChanged = true;
        }
        if (prevFocus != updateFocus) {
            Storage::getInstance().getAddonOptions().focusModeOptions.enabled = updateFocus;
            saveHasChanged = true;
        }
        if (prevTurbo != updateTurbo) {
            Storage::getInstance().getAddonOptions().turboOptions.enabled = updateTurbo;
            saveHasChanged = true;
        }

        if (prevAnimationIndex != updateAnimationIndex) {
            AnimationStation::options.baseAnimationIndex = updateAnimationIndex;
            animHasChanged = true;
        }
        if (prevThemeIndex != updateThemeIndex) {
            AnimationStation::options.themeIndex = updateThemeIndex;
            animHasChanged = true;
        }
        if (prevBrightness != updateBrightness) {
            AnimationStation::options.brightness = updateBrightness;
            AnimationStation::SetBrightness(AnimationStation::options.brightness);
            animHasChanged = true;
        }

        if (animHasChanged) {
            AnimationStore.save();
        }

        if (saveHasChanged) {
            EventManager::getInstance().triggerEvent(new GPStorageSaveEvent(true, changeRequiresReboot));
            screenIsPrompting = false;
        }
        changeRequiresSave = false;
        changeRequiresReboot = false;
    }

    if (exitToScreenBeforePrompt != -1) {
        exitToScreen = exitToScreenBeforePrompt;
        exitToScreenBeforePrompt = -1;
    }
}

void MainMenuScreen::selectProfile() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint8_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevProfile = Storage::getInstance().GetGamepad()->getOptions().profileNumber;
        updateProfile = valueToSave;

        if (prevProfile != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentProfile() {
    return updateProfile;
}

void MainMenuScreen::selectFocusMode() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint8_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevFocus = Storage::getInstance().getAddonOptions().focusModeOptions.enabled;
        updateFocus = valueToSave;

        if (prevFocus != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentFocusMode() {
    return updateFocus;
}

void MainMenuScreen::selectTurboMode() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint8_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevTurbo = Storage::getInstance().getAddonOptions().turboOptions.enabled;
        updateTurbo = valueToSave;

        if (updateTurbo != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentTurboMode() {
    return updateTurbo;
}

void MainMenuScreen::selectAnimation() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint8_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevAnimationIndex = AnimationStation::options.baseAnimationIndex;
        updateAnimationIndex = valueToSave;
        if (prevAnimationIndex != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentAnimation() {
    return updateAnimationIndex;
}

void MainMenuScreen::selectTheme() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint8_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevThemeIndex = AnimationStation::options.themeIndex;
        updateThemeIndex = valueToSave;
        if (prevThemeIndex != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentTheme() {
    return updateThemeIndex;
}

void MainMenuScreen::selectBrightness() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint8_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevBrightness = AnimationStation::options.brightness;
        updateBrightness = valueToSave;
        if (prevBrightness != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentBrightness() {
    return updateBrightness;
}

void MainMenuScreen::selectRemap() {
    exitToScreen = DisplayMode::REMAP;
}
