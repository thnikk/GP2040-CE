#include "MainMenuScreen.h"
#include "hardware/watchdog.h"
#include "system.h"

#include <cctype>

extern uint32_t getMillis();

static uint8_t savedMenuIndex = 0;

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
    menuBackStack.clear();
    menuIndex = savedMenuIndex;

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
    bool turboPinFound = false;
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
            case GpioAction::BUTTON_PRESS_TURBO: turboPinFound = true; break;
            case GpioAction::SUSTAIN_FOCUS_MODE: focusPinFound = true; break;
            default:    break;
        }
    }

    // Compile-time menu nav pins (not affected by runtime remapping)
#ifdef PIN_MENU_UP
    mapMenuUp->pinMask |= 1 << PIN_MENU_UP;
#endif
#ifdef PIN_MENU_DOWN
    mapMenuDown->pinMask |= 1 << PIN_MENU_DOWN;
#endif
#ifdef PIN_MENU_LEFT
    mapMenuLeft->pinMask |= 1 << PIN_MENU_LEFT;
#endif
#ifdef PIN_MENU_RIGHT
    mapMenuRight->pinMask |= 1 << PIN_MENU_RIGHT;
#endif
#ifdef PIN_MENU_SELECT
    mapMenuSelect->pinMask |= 1 << PIN_MENU_SELECT;
#endif
#ifdef PIN_MENU_BACK
    mapMenuBack->pinMask |= 1 << PIN_MENU_BACK;
#endif
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

    prevInputHistoryTimeout = Storage::getInstance().getDisplayOptions().inputHistoryTimeout;
    updateInputHistoryTimeout = prevInputHistoryTimeout;

    prevDisplaySaverTimeout = Storage::getInstance().getDisplayOptions().displaySaverTimeout;
    updateDisplaySaverTimeout = prevDisplaySaverTimeout;

    prevDisplaySaverMode = Storage::getInstance().getDisplayOptions().displaySaverMode;
    updateDisplaySaverMode = prevDisplaySaverMode;

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

    histTimeoutMenu.clear();
    {
        MenuEntry histEntry;
        histEntry.isSpinner = true;
        histEntry.currentValue = std::bind(&MainMenuScreen::currentInputHistoryTimeout, this);
        histEntry.displayValue = [this]() -> std::string {
            if (updateInputHistoryTimeout == 0) return "Off";
            return std::to_string(updateInputHistoryTimeout) + "s";
        };
        histTimeoutMenu.push_back(histEntry);
    }
    static const uint32_t displayTimeoutValues[] = {0, 15000, 30000, 60000, 120000, 300000, 600000};
    static const char* displayTimeoutLabels[] = {"Off", "15s", "30s", "1m", "2m", "5m", "10m"};
    displayTimeoutMenu.clear();
    MenuEntry spinnerEntry;
    spinnerEntry.isSpinner = true;
    spinnerEntry.currentValue = std::bind(&MainMenuScreen::currentDisplaySaverTimeout, this);
    spinnerEntry.displayValue = [this]() -> std::string {
        if (updateDisplaySaverTimeout == 0) return "Off";
        if (currentSpinnerUnit == 0)
            return std::to_string(updateDisplaySaverTimeout / 1000) + "s";
        else
            return std::to_string(updateDisplaySaverTimeout / 60000) + "m";
    };
    displayTimeoutMenu.push_back(spinnerEntry);

    displaySaverModeMenu.clear();
    displaySaverModeMenu.push_back({"Display Off", NULL, nullptr,
        std::bind(&MainMenuScreen::currentDisplaySaverMode, this),
        std::bind(&MainMenuScreen::selectDisplaySaverMode, this), 0});
    displaySaverModeMenu.push_back({"Snow", NULL, nullptr,
        std::bind(&MainMenuScreen::currentDisplaySaverMode, this),
        std::bind(&MainMenuScreen::selectDisplaySaverMode, this), 1});
    displaySaverModeMenu.push_back({"Bounce", NULL, nullptr,
        std::bind(&MainMenuScreen::currentDisplaySaverMode, this),
        std::bind(&MainMenuScreen::selectDisplaySaverMode, this), 2});
    displaySaverModeMenu.push_back({"Pipes", NULL, nullptr,
        std::bind(&MainMenuScreen::currentDisplaySaverMode, this),
        std::bind(&MainMenuScreen::selectDisplaySaverMode, this), 3});
    displaySaverModeMenu.push_back({"Toast", NULL, nullptr,
        std::bind(&MainMenuScreen::currentDisplaySaverMode, this),
        std::bind(&MainMenuScreen::selectDisplaySaverMode, this), 4});

    displayMenu.clear();
    displayMenu.push_back({"Idle Timeout", NULL, &displayTimeoutMenu,
        std::bind(&MainMenuScreen::modeValue, this),
        std::bind(&MainMenuScreen::testMenu, this)});
    displayMenu.push_back({"Screen Saver", NULL, &displaySaverModeMenu,
        std::bind(&MainMenuScreen::modeValue, this),
        std::bind(&MainMenuScreen::testMenu, this)});
    displayMenu.push_back({"Hist Timeout", NULL, &histTimeoutMenu,
        std::bind(&MainMenuScreen::modeValue, this),
        std::bind(&MainMenuScreen::testMenu, this)});

    mainMenu.clear();
    mainMenu.push_back({"Input Mode", NULL, &inputModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"D-Pad Mode", NULL, &dpadModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"SOCD Mode", NULL, &socdModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"Profile", NULL, &profilesMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    if (focusPinFound && Storage::getInstance().getAddonOptions().focusModeOptions.buttonLockMask != 0)
        mainMenu.push_back({"Focus Mode", NULL, &focusModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    if (turboPinFound)
        mainMenu.push_back({"Turbo", NULL, &turboModeMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"Display", NULL, &displayMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"LED Config", NULL, &ledMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});
    mainMenu.push_back({"Remap", NULL, nullptr, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::selectRemap, this)});
    mainMenu.push_back({"Save & Exit", NULL, &saveMenu, std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)});

    gpMenu->setMenuData(currentMenu);
    gpMenu->setMenuTitle(MAIN_MENU_NAME);
    if (menuIndex >= gpMenu->getDataSize())
        menuIndex = 0;
    gpMenu->setIndex(menuIndex);

    prevValues = Storage::getInstance().GetGamepad()->debouncedGpio;
}

void MainMenuScreen::shutdown() {
    clearElements();
    exitToScreen = -1;
}

void MainMenuScreen::drawScreen() {
    bool isSpinnerView = currentMenu->size() > 0 && currentMenu->at(menuIndex).isSpinner;
    gpMenu->setVisibility(!screenIsPrompting && !isSpinnerView);

    if (!screenIsPrompting) {
        if (isSpinnerView) {
            getRenderer()->drawText(
                (21 - gpMenu->getMenuTitle().length()) / 2, 0,
                gpMenu->getMenuTitle().c_str());
            std::string valueStr = currentMenu->at(0).displayValue();
            getRenderer()->drawText(
                (21 - valueStr.length()) / 2, 3, valueStr.c_str());
            if (currentMenu == &displayTimeoutMenu)
                getRenderer()->drawText(2, 5,
                    CHAR_UP CHAR_DOWN ":adjust " CHAR_LEFT CHAR_RIGHT ":unit");
            getRenderer()->drawText(3, 6, "A:set  B:back");
        }
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
    uint32_t now = getMillis();
    bool actionFired = false;
    bool isSpinnerItem = currentMenu->size() > 0 && currentMenu->at(menuIndex).isSpinner;

    // Check dedicated menu GPIO pins + gamepad button pin masks
    if (!isPressed && prevValues != values) {
        if (values & mapMenuUp->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_UP);
            actionFired = true;
            if (isSpinnerItem) { repeatTimer = now; repeatDirection = 1; isRepeating = false; }
        } else if (values & mapMenuDown->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_DOWN);
            actionFired = true;
            if (isSpinnerItem) { repeatTimer = now; repeatDirection = -1; isRepeating = false; }
        } else if (values & mapMenuLeft->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_LEFT);
            actionFired = true;
        } else if (values & mapMenuRight->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_RIGHT);
            actionFired = true;
        } else if (values & mapMenuSelect->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_SELECT);
            actionFired = true;
        } else if (values & mapMenuBack->pinMask) {
            updateMenuNavigation(GpioAction::MENU_NAVIGATION_BACK);
            actionFired = true;
        }
    } else {
        isPressed = false;
    }

    // Hold-to-repeat for UP/DOWN on spinner items
    if (isSpinnerItem && repeatDirection != 0) {
        bool stillHeld = false;
        if (repeatDirection > 0 && (values & mapMenuUp->pinMask)) stillHeld = true;
        if (repeatDirection < 0 && (values & mapMenuDown->pinMask)) stillHeld = true;

        if (stillHeld) {
            if (!isRepeating && now - repeatTimer >= 400) {
                isRepeating = true;
                repeatTimer = now;
                repeatInterval = 100;
                updateMenuNavigation(repeatDirection > 0 ? GpioAction::MENU_NAVIGATION_UP : GpioAction::MENU_NAVIGATION_DOWN);
                actionFired = true;
            } else if (isRepeating && now - repeatTimer >= repeatInterval) {
                repeatTimer = now;
                repeatInterval = repeatInterval > 35 ? repeatInterval - 5 : 30;
                updateMenuNavigation(repeatDirection > 0 ? GpioAction::MENU_NAVIGATION_UP : GpioAction::MENU_NAVIGATION_DOWN);
                actionFired = true;
            }
        } else {
            repeatDirection = 0;
            isRepeating = false;
        }
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
    bool isSpinnerItem = false;
    if (currentMenu->size() > 0 && currentMenu->at(menuIndex).isSpinner)
        isSpinnerItem = true;

    switch (action) { 
        case GpioAction::MENU_NAVIGATION_UP:
            if (!screenIsPrompting) {
                if (isSpinnerItem) {
                    adjustSpinnerValue(1);
                } else {
                    if (menuIndex > 0) {
                        menuIndex--;
                    } else {
                        menuIndex = menuSize-1;
                    }
                    changeIndex = true;
                }
            } else {
                promptChoice = !promptChoice;
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_DOWN:
            if (!screenIsPrompting) {
                if (isSpinnerItem) {
                    adjustSpinnerValue(-1);
                } else {
                    if (menuIndex < menuSize-1) {
                        menuIndex++;
                    } else {
                        menuIndex = 0;
                    }
                    changeIndex = true;
                }
            } else {
                promptChoice = !promptChoice;
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_LEFT:
            if (screenIsPrompting) {
                promptChoice = !promptChoice;
            } else if (isSpinnerItem) {
                switchSpinnerUnit(-1);
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_RIGHT:
            if (screenIsPrompting) {
                promptChoice = !promptChoice;
            } else if (isSpinnerItem) {
                switchSpinnerUnit(1);
            }
            isPressed = true;
            break;
        case GpioAction::MENU_NAVIGATION_SELECT:
            if (!screenIsPrompting) {
                if (isSpinnerItem) {
                    saveSpinnerValue();
                    if (!menuBackStack.empty()) {
                        MenuBackEntry back = menuBackStack.back();
                        menuBackStack.pop_back();
                        currentMenu = back.menu;
                        menuIndex = back.index;
                        changeIndex = true;
                        gpMenu->setMenuData(currentMenu);
                        gpMenu->setMenuTitle(back.title);
                    }
                } else if (currentMenu->at(menuIndex).submenu != nullptr) {
                    menuBackStack.push_back({currentMenu, menuIndex, gpMenu->getMenuTitle()});
                    currentMenu = currentMenu->at(menuIndex).submenu;
                    if (currentMenu->size() > 0 && currentMenu->at(0).isSpinner) {
                        if (currentMenu == &displayTimeoutMenu)
                            spinnerValueSnapshot = updateDisplaySaverTimeout;
                        else if (currentMenu == &histTimeoutMenu)
                            histSpinnerValueSnapshot = updateInputHistoryTimeout;
                    }
                    gpMenu->setMenuData(currentMenu);
                    gpMenu->setMenuTitle(menuBackStack.back().menu->at(menuBackStack.back().index).label);
                    menuIndex = 0;
                    for (size_t i = 0; i < currentMenu->size(); i++) {
                        if (currentMenu->at(i).optionValue != -1 &&
                            currentMenu->at(i).currentValue() == currentMenu->at(i).optionValue) {
                            menuIndex = i;
                            break;
                        }
                    }
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
                if (isSpinnerItem)
                    revertSpinnerValue();
                if (!menuBackStack.empty()) {
                    MenuBackEntry back = menuBackStack.back();
                    menuBackStack.pop_back();
                    currentMenu = back.menu;
                    menuIndex = back.index;
                    changeIndex = true;
                    gpMenu->setMenuData(currentMenu);
                    gpMenu->setMenuTitle(back.title);
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
    savedMenuIndex = menuIndex;
    if (changeRequiresSave) {
        saveOptions();
    } else {
        exitToScreen = DisplayMode::BUTTONS;
    }
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
        if (prevInputHistoryTimeout != updateInputHistoryTimeout) updateInputHistoryTimeout = prevInputHistoryTimeout;
        if (prevDisplaySaverTimeout != updateDisplaySaverTimeout) updateDisplaySaverTimeout = prevDisplaySaverTimeout;
        if (prevDisplaySaverMode != updateDisplaySaverMode) updateDisplaySaverMode = prevDisplaySaverMode;
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
        if (prevInputHistoryTimeout != updateInputHistoryTimeout) {
            Storage::getInstance().getDisplayOptions().inputHistoryTimeout = updateInputHistoryTimeout;
            saveHasChanged = true;
        }
        if (prevDisplaySaverTimeout != updateDisplaySaverTimeout) {
            Storage::getInstance().getDisplayOptions().displaySaverTimeout = updateDisplaySaverTimeout;
            saveHasChanged = true;
        }
        if (prevDisplaySaverMode != updateDisplaySaverMode) {
            Storage::getInstance().getDisplayOptions().displaySaverMode = static_cast<DisplaySaverMode>(updateDisplaySaverMode);
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

        if (prevTurbo != valueToSave) changeRequiresSave = true;
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

void MainMenuScreen::selectInputHistoryTimeout() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint16_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevInputHistoryTimeout = Storage::getInstance().getDisplayOptions().inputHistoryTimeout;
        updateInputHistoryTimeout = valueToSave;

        if (prevInputHistoryTimeout != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentInputHistoryTimeout() {
    return updateInputHistoryTimeout;
}

void MainMenuScreen::selectDisplaySaverTimeout() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint32_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevDisplaySaverTimeout = Storage::getInstance().getDisplayOptions().displaySaverTimeout;
        updateDisplaySaverTimeout = valueToSave;

        if (prevDisplaySaverTimeout != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentDisplaySaverTimeout() {
    return updateDisplaySaverTimeout;
}

void MainMenuScreen::selectDisplaySaverMode() {
    if (currentMenu->at(menuIndex).optionValue != -1) {
        uint8_t valueToSave = currentMenu->at(menuIndex).optionValue;
        prevDisplaySaverMode = Storage::getInstance().getDisplayOptions().displaySaverMode;
        updateDisplaySaverMode = valueToSave;

        if (prevDisplaySaverMode != valueToSave) changeRequiresSave = true;
    }
}

int32_t MainMenuScreen::currentDisplaySaverMode() {
    return updateDisplaySaverMode;
}

void MainMenuScreen::selectRemap() {
    savedMenuIndex = menuIndex;
    exitToScreen = DisplayMode::REMAP;
}

void MainMenuScreen::adjustSpinnerValue(int8_t direction) {
    if (currentMenu == &displayTimeoutMenu) {
        uint32_t raw = updateDisplaySaverTimeout;

        if (raw == 0 && direction > 0) {
            updateDisplaySaverTimeout = 1000;
            currentSpinnerUnit = 0;
            if (prevDisplaySaverTimeout != updateDisplaySaverTimeout)
                changeRequiresSave = true;
            return;
        }

        if (currentSpinnerUnit == 0) {
            int32_t displayVal = raw / 1000;
            displayVal += direction;
            if (displayVal > 600) displayVal = 600;
            else if (displayVal < 0) displayVal = 0;
            updateDisplaySaverTimeout = displayVal * 1000;
        } else {
            int32_t displayVal = raw / 60000;
            displayVal += direction;
            if (displayVal > 10) displayVal = 10;
            else if (displayVal < 1) displayVal = 1;
            updateDisplaySaverTimeout = displayVal * 60000;
        }

        if (prevDisplaySaverTimeout != updateDisplaySaverTimeout)
            changeRequiresSave = true;
    } else if (currentMenu == &histTimeoutMenu) {
        int32_t displayVal = updateInputHistoryTimeout;
        if (displayVal == 0 && direction > 0) {
            displayVal = 1;
        } else {
            displayVal += direction;
            if (displayVal > 60) displayVal = 60;
            else if (displayVal < 0) displayVal = 0;
        }
        updateInputHistoryTimeout = displayVal;
        if (prevInputHistoryTimeout != updateInputHistoryTimeout)
            changeRequiresSave = true;
    }
}

void MainMenuScreen::switchSpinnerUnit(int8_t direction) {
    if (currentMenu != &displayTimeoutMenu) return;
    if (currentSpinnerUnit == 0 && direction > 0) {
        if (updateDisplaySaverTimeout > 0 && updateDisplaySaverTimeout < 60000)
            updateDisplaySaverTimeout = 60000;
        currentSpinnerUnit = 1;
    } else if (currentSpinnerUnit == 1 && direction < 0) {
        if (updateDisplaySaverTimeout / 1000 > 600)
            updateDisplaySaverTimeout = 600000;
        currentSpinnerUnit = 0;
    }
}

void MainMenuScreen::saveSpinnerValue() {
    if (currentMenu == &displayTimeoutMenu) {
        if (spinnerValueSnapshot != updateDisplaySaverTimeout) {
            prevDisplaySaverTimeout = updateDisplaySaverTimeout;
            Storage::getInstance().getDisplayOptions().displaySaverTimeout = updateDisplaySaverTimeout;
            EventManager::getInstance().triggerEvent(new GPStorageSaveEvent(true, false));
        }
    } else if (currentMenu == &histTimeoutMenu) {
        if (histSpinnerValueSnapshot != updateInputHistoryTimeout) {
            prevInputHistoryTimeout = updateInputHistoryTimeout;
            Storage::getInstance().getDisplayOptions().inputHistoryTimeout = updateInputHistoryTimeout;
            EventManager::getInstance().triggerEvent(new GPStorageSaveEvent(true, false));
        }
    }
}

void MainMenuScreen::revertSpinnerValue() {
    if (currentMenu == &displayTimeoutMenu) {
        updateDisplaySaverTimeout = spinnerValueSnapshot;
        prevDisplaySaverTimeout = spinnerValueSnapshot;
    } else if (currentMenu == &histTimeoutMenu) {
        updateInputHistoryTimeout = histSpinnerValueSnapshot;
        prevInputHistoryTimeout = histSpinnerValueSnapshot;
    }
}
