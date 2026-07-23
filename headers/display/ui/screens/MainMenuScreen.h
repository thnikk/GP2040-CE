#ifndef _MAINMENUSCREEN_H_
#define _MAINMENUSCREEN_H_

#include "GPGFX_UI_widgets.h"
#include "GPGFX_UI_types.h"
#include "enums.pb.h"
#include "AnimationStation.hpp"
#include "AnimationStorage.hpp"
#include "eventmanager.h"

#define INPUT_MODE_XINPUT_NAME "XInput"
#define INPUT_MODE_SWITCH_NAME "Nintendo Switch"
#define INPUT_MODE_PS3_NAME "PS3"
#define INPUT_MODE_KEYBOARD_NAME "Keyboard"
#define INPUT_MODE_PS4_NAME "PS4"
#define INPUT_MODE_XBONE_NAME "Xbox One"
#define INPUT_MODE_MDMINI_NAME "Sega Genesis Mini"
#define INPUT_MODE_NEOGEO_NAME "NEOGEO mini"
#define INPUT_MODE_PCEMINI_NAME "PC Engine Mini"
#define INPUT_MODE_EGRET_NAME "EGRET II mini"
#define INPUT_MODE_ASTRO_NAME "ASTROCITY Mini"
#define INPUT_MODE_PSCLASSIC_NAME "Playstation Classic"
#define INPUT_MODE_XBOXORIGINAL_NAME "Original Xbox"
#define INPUT_MODE_PS5_NAME "PS5"
#define INPUT_MODE_GENERIC_NAME "Generic HID"
#define INPUT_MODE_CONFIG_NAME "Web Config"

#define SOCD_MODE_UP_PRIORITY_NAME "Up Priority"
#define SOCD_MODE_NEUTRAL_NAME "Neutral"
#define SOCD_MODE_SECOND_INPUT_PRIORITY_NAME "Last Win"
#define SOCD_MODE_FIRST_INPUT_PRIORITY_NAME "First Win"
#define SOCD_MODE_BYPASS_NAME "Off"

#define DPAD_MODE_DIGITAL_NAME "D-Pad"
#define DPAD_MODE_LEFT_ANALOG_NAME "Left Analog"
#define DPAD_MODE_RIGHT_ANALOG_NAME "Right Analog"

#define MAIN_MENU_NAME "GP2040-CE Mini Menu"

#define ANIMATION_STATIC_NAME "Static"
#define ANIMATION_RAINBOW_NAME "Rainbow"
#define ANIMATION_CHASE_NAME "Chase"
#define ANIMATION_STATIC_THEME_NAME "Static Theme"
#define ANIMATION_CUSTOM_THEME_NAME "Custom Theme"

class MainMenuScreen : public GPScreen {
    public:
        MainMenuScreen() {}
        MainMenuScreen(GPGFX* renderer) { setRenderer(renderer); }
        void setMenu(std::vector<MenuEntry>* menu);
        virtual int8_t update();
        virtual void init();
        virtual void shutdown();

        void testMenu() {}
        void saveAndExit();
        int32_t modeValue();

        void selectInputMode();
        int32_t currentInputMode();

        void selectDPadMode();
        int32_t currentDpadMode();

        void selectSOCDMode();
        int32_t currentSOCDMode();

        void selectProfile();
        int32_t currentProfile();

        void selectFocusMode();
        int32_t currentFocusMode();

        void selectTurboMode();
        int32_t currentTurboMode();

        void selectRemap();

        void selectInputHistoryTimeout();
        int32_t currentInputHistoryTimeout();

        void selectDisplaySaverTimeout();
        int32_t currentDisplaySaverTimeout();

        void selectDisplaySaverMode();
        int32_t currentDisplaySaverMode();

        void selectAnimation();
        int32_t currentAnimation();
        void selectTheme();
        int32_t currentTheme();
        void selectBrightness();
        int32_t currentBrightness();

        void updateMenuNavigation(GpioAction action);
        void queueAction(GpioAction action) { pendingNavAction = (uint8_t)action; }
    protected:
        virtual void drawScreen();
    private:
        uint8_t menuIndex = 0;
        bool isPressed = false;
        uint32_t checkDebounce;
        std::vector<MenuEntry>* currentMenu;
        struct MenuBackEntry {
            std::vector<MenuEntry>* menu;
            uint8_t index;
            std::string title;
        };
        std::vector<MenuBackEntry> menuBackStack;
		uint16_t prevButtonState = 0;
		Mask_t prevValues;
        GPMenu* gpMenu;
        volatile uint8_t pendingNavAction = 0xFF; // 0xFF = none, otherwise GpioAction

        bool screenIsPrompting = false;
        bool promptChoice = false;

        int8_t exitToScreenBeforePrompt = -1;
        int8_t exitToScreen = -1;

        GamepadButtonMapping *mapMenuUp;
        GamepadButtonMapping *mapMenuDown;
        GamepadButtonMapping *mapMenuLeft;
        GamepadButtonMapping *mapMenuRight;
        GamepadButtonMapping *mapMenuSelect;
        GamepadButtonMapping *mapMenuBack;
        GamepadButtonMapping *mapMenuToggle;

        void saveOptions();
        void resetOptions();
        bool changeRequiresReboot = false;
        bool changeRequiresSave = false;

        struct SpinnerUnit {
            const char* label;
            int32_t minDisplay;
            int32_t maxDisplay;
            int32_t step;
        };
        void adjustSpinnerValue(int8_t direction);
        void switchSpinnerUnit(int8_t direction);
        void saveSpinnerValue();
        void revertSpinnerValue();
        uint8_t currentSpinnerUnit = 0;

        uint32_t repeatTimer = 0;
        int8_t repeatDirection = 0;
        bool isRepeating = false;
        uint32_t repeatInterval = 0;

        #define INPUT_MODE_ENTRIES(name, value) {name##_NAME, NULL, nullptr, std::bind(&MainMenuScreen::currentInputMode, this), std::bind(&MainMenuScreen::selectInputMode, this), value},
        #define DPAD_MODE_ENTRIES(name, value)  {name##_NAME, NULL, nullptr, std::bind(&MainMenuScreen::currentDpadMode,  this), std::bind(&MainMenuScreen::selectDPadMode,  this), value},
        #define SOCD_MODE_ENTRIES(name, value)  {name##_NAME, NULL, nullptr, std::bind(&MainMenuScreen::currentSOCDMode,  this), std::bind(&MainMenuScreen::selectSOCDMode,  this), value},

        std::vector<MenuEntry> inputModeMenu = {
            InputMode_VALUELIST(INPUT_MODE_ENTRIES)
        };
        InputMode prevInputMode;
        InputMode updateInputMode;

        std::vector<MenuEntry> dpadModeMenu = {
            DpadMode_VALUELIST(DPAD_MODE_ENTRIES)
        };
        DpadMode prevDpadMode;
        DpadMode updateDpadMode;

        std::vector<MenuEntry> socdModeMenu = {
            SOCDMode_VALUELIST(SOCD_MODE_ENTRIES)
        };
        SOCDMode prevSocdMode;
        SOCDMode updateSocdMode;

        std::vector<MenuEntry> profilesMenu = {};
        uint8_t prevProfile;
        uint8_t updateProfile;

        std::vector<MenuEntry> focusModeMenu = {
            {"Off",        NULL, nullptr,        std::bind(&MainMenuScreen::currentFocusMode, this), std::bind(&MainMenuScreen::selectFocusMode, this), 0},
            {"On",         NULL, nullptr,        std::bind(&MainMenuScreen::currentFocusMode, this), std::bind(&MainMenuScreen::selectFocusMode, this), 1},
        };
        bool prevFocus;
        bool updateFocus;

        std::vector<MenuEntry> turboModeMenu = {
            {"Off",        NULL, nullptr,        std::bind(&MainMenuScreen::currentTurboMode, this), std::bind(&MainMenuScreen::selectTurboMode, this), 0},
            {"On",         NULL, nullptr,        std::bind(&MainMenuScreen::currentTurboMode, this), std::bind(&MainMenuScreen::selectTurboMode, this), 1},
        };
        bool prevTurbo;
        bool updateTurbo;

        uint8_t prevAnimationIndex;
        uint8_t updateAnimationIndex;
        uint8_t prevThemeIndex;
        uint8_t updateThemeIndex;
        uint8_t prevBrightness;
        uint8_t updateBrightness;

        std::vector<MenuEntry> animationMenu = {
            {ANIMATION_STATIC_NAME,       NULL, nullptr, std::bind(&MainMenuScreen::currentAnimation, this), std::bind(&MainMenuScreen::selectAnimation, this), 0},
            {ANIMATION_RAINBOW_NAME,      NULL, nullptr, std::bind(&MainMenuScreen::currentAnimation, this), std::bind(&MainMenuScreen::selectAnimation, this), 1},
            {ANIMATION_CHASE_NAME,        NULL, nullptr, std::bind(&MainMenuScreen::currentAnimation, this), std::bind(&MainMenuScreen::selectAnimation, this), 2},
            {ANIMATION_STATIC_THEME_NAME, NULL, nullptr, std::bind(&MainMenuScreen::currentAnimation, this), std::bind(&MainMenuScreen::selectAnimation, this), 3},
            {ANIMATION_CUSTOM_THEME_NAME, NULL, nullptr, std::bind(&MainMenuScreen::currentAnimation, this), std::bind(&MainMenuScreen::selectAnimation, this), 4},
        };
        std::vector<MenuEntry> themeMenu;
        std::vector<MenuEntry> brightnessMenu;

        std::vector<MenuEntry> ledMenu = {
            {"Animation",  NULL, &animationMenu,  std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)},
            {"Theme",      NULL, &themeMenu,       std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)},
            {"Brightness", NULL, &brightnessMenu,  std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this)},
        };

        std::vector<MenuEntry> displayMenu;
        std::vector<MenuEntry> histTimeoutMenu;
        uint16_t prevInputHistoryTimeout;
        uint16_t updateInputHistoryTimeout;

        std::vector<MenuEntry> displayTimeoutMenu;
        uint32_t prevDisplaySaverTimeout;
        uint32_t updateDisplaySaverTimeout;
        uint32_t spinnerValueSnapshot;
        uint16_t histSpinnerValueSnapshot;

        std::vector<MenuEntry> displaySaverModeMenu;
        uint8_t prevDisplaySaverMode;
        uint8_t updateDisplaySaverMode;

        std::vector<MenuEntry> mainMenu;

        std::vector<MenuEntry> saveMenu = {
            {"Yes",        NULL, nullptr,        std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::saveAndExit, this), 1},
            {"No",         NULL, nullptr,        std::bind(&MainMenuScreen::modeValue, this), std::bind(&MainMenuScreen::testMenu, this), 0},
        };
};

#endif