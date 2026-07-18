/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: Copyright (c) 2021 Jason Skuby (mytechtoybox.com)
 */

#include "AnimationStation.hpp"
#include "AnimationStorage.hpp"
#include "storagemanager.h"
#include "NeoPico.hpp"
#include "Pixel.hpp"
#include "PlayerLEDs.h"
#include "gp2040.h"
#include "addons/neopicoleds.h"
#include "addons/pleds.h"
#include "themes.h"
#include "usbdriver.h"
#include "enums.h"
#include "helper.h"
#include "wake.h"

uint32_t rgbPLEDValues[4];

// Move to Proto Enums
typedef enum
{
    XINPUT_PLED_OFF       = 0x00, // All off
    XINPUT_PLED_BLINKALL  = 0x01, // All blinking
    XINPUT_PLED_FLASH1    = 0x02, // 1 flashes, then on
    XINPUT_PLED_FLASH2    = 0x03, // 2 flashes, then on
    XINPUT_PLED_FLASH3    = 0x04, // 3 flashes, then on
    XINPUT_PLED_FLASH4    = 0x05, // 4 flashes, then on
    XINPUT_PLED_ON1       = 0x06, // 1 on
    XINPUT_PLED_ON2       = 0x07, // 2 on
    XINPUT_PLED_ON3       = 0x08, // 3 on
    XINPUT_PLED_ON4       = 0x09, // 4 on
    XINPUT_PLED_ROTATE    = 0x0A, // Rotating (e.g. 1-2-4-3)
    XINPUT_PLED_BLINK     = 0x0B, // Blinking*
    XINPUT_PLED_SLOWBLINK = 0x0C, // Slow blinking*
    XINPUT_PLED_ALTERNATE = 0x0D, // Alternating (e.g. 1+4-2+3), then back to previous*
} XInputPLEDPattern;

// TODO: Make this a helper function
// Animation Helper for Player LEDs
PLEDAnimationState getXInputAnimationNEOPICO(uint16_t ledState)
{
    PLEDAnimationState animationState =
    {
        .state = 0,
        .animation = PLED_ANIM_NONE,
        .speed = PLED_SPEED_OFF,
    };

    switch (ledState)
    {
        case XINPUT_PLED_BLINKALL:
        case XINPUT_PLED_ROTATE:
        case XINPUT_PLED_BLINK:
        case XINPUT_PLED_SLOWBLINK:
        case XINPUT_PLED_ALTERNATE:
            animationState.state = (PLED_STATE_LED1 | PLED_STATE_LED2 | PLED_STATE_LED3 | PLED_STATE_LED4);
            animationState.animation = PLED_ANIM_BLINK;
            animationState.speed = PLED_SPEED_FAST;
            break;

        case XINPUT_PLED_FLASH1:
        case XINPUT_PLED_ON1:
            animationState.state = PLED_STATE_LED1;
            animationState.animation = PLED_ANIM_SOLID;
            animationState.speed = PLED_SPEED_OFF;
            break;

        case XINPUT_PLED_FLASH2:
        case XINPUT_PLED_ON2:
            animationState.state = PLED_STATE_LED2;
            animationState.animation = PLED_ANIM_SOLID;
            animationState.speed = PLED_SPEED_OFF;
            break;

        case XINPUT_PLED_FLASH3:
        case XINPUT_PLED_ON3:
            animationState.state = PLED_STATE_LED3;
            animationState.animation = PLED_ANIM_SOLID;
            animationState.speed = PLED_SPEED_OFF;
            break;

        case XINPUT_PLED_FLASH4:
        case XINPUT_PLED_ON4:
            animationState.state = PLED_STATE_LED4;
            animationState.animation = PLED_ANIM_SOLID;
            animationState.speed = PLED_SPEED_OFF;
            break;

        default:
            break;
    }

    return animationState;
}

PLEDAnimationState getXBoneAnimationNEOPICO(Gamepad * gamepad)
{
    PLEDAnimationState animationState =
    {
        .state = (PLED_STATE_LED1 | PLED_STATE_LED2 | PLED_STATE_LED3 | PLED_STATE_LED4),
        .animation = PLED_ANIM_OFF
    };

    if ( gamepad->auxState.playerID.ledValue == 1 ) {
        animationState.animation = PLED_ANIM_SOLID;
    }

    return animationState;
}

PLEDAnimationState getPS3AnimationNEOPICO(uint16_t ledState)
{
    const uint8_t ps3LEDs[10][4] = {
        { 0x01, 0x00, 0x00, 0x00 },
        { 0x00, 0x01, 0x00, 0x00 },
        { 0x00, 0x00, 0x01, 0x00 },
        { 0x00, 0x00, 0x00, 0x01 },
        { 0x01, 0x00, 0x00, 0x01 },
        { 0x00, 0x01, 0x00, 0x01 },
        { 0x00, 0x00, 0x01, 0x01 },
        { 0x01, 0x00, 0x01, 0x01 },
        { 0x00, 0x01, 0x01, 0x01 },
        { 0x01, 0x01, 0x01, 0x01 }
    };

    PLEDAnimationState animationState =
    {
        .state = 0,
        .animation = PLED_ANIM_NONE,
        .speed = PLED_SPEED_OFF,
    };

    if (ledState != 0) {
        uint8_t ledNumber = ledState & 0x0F;
        if (ps3LEDs[ledNumber-1][0] == 0x01) animationState.state |= PLED_STATE_LED1;
        if (ps3LEDs[ledNumber-1][1] == 0x01) animationState.state |= PLED_STATE_LED2;
        if (ps3LEDs[ledNumber-1][2] == 0x01) animationState.state |= PLED_STATE_LED3;
        if (ps3LEDs[ledNumber-1][3] == 0x01) animationState.state |= PLED_STATE_LED4;
    }

    if (animationState.state != 0) {
        animationState.animation = PLED_ANIM_SOLID;
        animationState.speed = PLED_SPEED_OFF;
    } else {
        animationState.state = 0;
        animationState.animation = PLED_ANIM_OFF;
        animationState.speed = PLED_SPEED_OFF;
    }

    return animationState;
}

PLEDAnimationState getPS4AnimationNEOPICO(uint32_t flashOn, uint32_t flashOff)
{
    PLEDAnimationState animationState =
    {
        .state = (PLED_STATE_LED1 | PLED_STATE_LED2 | PLED_STATE_LED3 | PLED_STATE_LED4),
        .animation = PLED_ANIM_SOLID,
        .speed = PLED_SPEED_OFF,
    };

    if (flashOn > 0 || flashOff > 0) {
        animationState.animation = PLED_ANIM_BLINK_CUSTOM;
        animationState.speedOn = flashOn;
        animationState.speedOff = flashOff;
    }

    return animationState;
}

bool NeoPicoLEDAddon::available() {
    const LEDOptions& ledOptions = Storage::getInstance().getLedOptions();
    return isValidPin(ledOptions.dataPin);
}

void NeoPicoLEDAddon::setup()
{
    // Set Default LED Options
    const LEDOptions& ledOptions = Storage::getInstance().getLedOptions();
    turnOffWhenSuspended = ledOptions.turnOffWhenSuspended;

    // Get turbo options (turbo RGB led)
    const TurboOptions& turboOptions = Storage::getInstance().getAddonOptions().turboOptions;

    Gamepad * gamepad = Storage::getInstance().GetProcessedGamepad();
    gamepad->auxState.playerID.enabled = true;
    gamepad->auxState.sensors.statusLight.enabled = true;

    if ( ledOptions.pledType == PLED_TYPE_RGB ) {
        neoPLEDs = new NeoPicoPlayerLEDs();
    }

    neopico = nullptr; // set neopico to null

    // Create a dummy Neo Pico for the initial configuration
    neopico = new NeoPico(-1, 0);
    configureLEDs();

    nextRunTime = make_timeout_time_ms(0); // Reset timeout
}

void NeoPicoLEDAddon::process()
{
    const LEDOptions& ledOptions = Storage::getInstance().getLedOptions();
    if (!isValidPin(ledOptions.dataPin) || !time_reached(this->nextRunTime))
        return;

    // Get turbo options (turbo RGB led)
    const TurboOptions& turboOptions = Storage::getInstance().getAddonOptions().turboOptions;

    Gamepad * gamepad = Storage::getInstance().GetProcessedGamepad();
    AnimationHotkey action = animationHotkeys(gamepad);
    if (ledOptions.pledType == PLED_TYPE_RGB) {
        inputMode = gamepad->getOptions().inputMode; // HACK
        if (gamepad->auxState.playerID.enabled && gamepad->auxState.playerID.active) {
            switch (inputMode) {
                case INPUT_MODE_XINPUT:
                    animationState = getXInputAnimationNEOPICO(gamepad->auxState.playerID.ledValue);
                    break;
                case INPUT_MODE_PS3:
                    animationState = getPS3AnimationNEOPICO(gamepad->auxState.playerID.ledValue);
                    break;
                case INPUT_MODE_PS4:
                case INPUT_MODE_PS5:
                    animationState = getPS4AnimationNEOPICO(gamepad->auxState.playerID.ledBlinkOn, gamepad->auxState.playerID.ledBlinkOff);
                    break;
                case INPUT_MODE_XBONE:
                    animationState = getXBoneAnimationNEOPICO(gamepad);
                    break;
                default:
                    break;
            }
        }

        if (neoPLEDs != nullptr && animationState.animation != PLED_ANIM_NONE) {
            neoPLEDs->animate(animationState);
        }
    }

    if ( action != HOTKEY_LEDS_NONE ) {
        as.HandleEvent(action);
    }

    if (as.options.baseAnimationIndex != lastMode) {
        as.SetMode(as.options.baseAnimationIndex);
        lastMode = as.options.baseAnimationIndex;
    }

    Gamepad * rawGamepad = Storage::getInstance().GetGamepad();
    uint32_t gpioState = rawGamepad->debouncedGpio;
    vector<Pixel> pressed;
    for (auto row : matrix.pixels)
    {
        for (auto pixel : row)
        {
            if (gpioState & (1UL << pixel.index))
                pressed.push_back(pixel);
        }
    }
    if (pressed.size() > 0)
        as.HandlePressed(pressed);
    else
        as.ClearPressed();

    as.Animate();

		uint32_t timeout = Storage::getInstance().getDisplayOptions().displaySaverTimeout;
		if ((getMillis() - getLastActivity()) > timeout) {
        as.DimBrightnessTo0();
    } else {
        as.SetBrightness(AnimationStation::GetBrightness());
    }

    as.ApplyBrightness(frame);

    // Apply the player LEDs to our first 4 leds if we're in NEOPIXEL mode
    if (ledOptions.pledType == PLED_TYPE_RGB) {
        int32_t pledIndexes[] = { ledOptions.pledIndex1, ledOptions.pledIndex2, ledOptions.pledIndex3, ledOptions.pledIndex4 };
        for (int i = 0; i < PLED_COUNT; i++) {
            if (pledIndexes[i] < 0 || pledIndexes[i] > 99)
                continue;

            float level = (static_cast<float>(PLED_MAX_LEVEL - neoPLEDs->getLedLevels()[i]) / static_cast<float>(PLED_MAX_LEVEL));
            float brightness = as.GetBrightnessX() * level;
            if (gamepad->auxState.sensors.statusLight.enabled && gamepad->auxState.sensors.statusLight.active) {
                rgbPLEDValues[i] = (RGB(gamepad->auxState.sensors.statusLight.color.red, gamepad->auxState.sensors.statusLight.color.green, gamepad->auxState.sensors.statusLight.color.blue)).value(neopico->GetFormat(), brightness);
            } else {
                rgbPLEDValues[i] = ((RGB)ledOptions.pledColor).value(neopico->GetFormat(), brightness);
            }
            frame[pledIndexes[i]] = rgbPLEDValues[i];
        }
    }

    // Turbo LED is a separate RGB that is on if turbo is on, and off if its off
    if ( turboOptions.turboLedType == PLED_TYPE_RGB ) { // RGB or PWM?
        if ( gamepad->auxState.turbo.activity == 1) { // Turbo is on (active sensor)
            if (turboOptions.turboLedIndex >= 0 && turboOptions.turboLedIndex < 100) { // Double check index value
                float brightness = as.GetBrightnessX();
                frame[turboOptions.turboLedIndex] = ((RGB)turboOptions.turboLedColor).value(neopico->GetFormat(), brightness);
            }
        }
    }

    // Case RGB LEDs for a single static color go here
    if ( ledOptions.caseRGBType == CASE_RGB_TYPE_STATIC &&
        ledOptions.caseRGBIndex >= 0 &&
        ledOptions.caseRGBCount > 0 ) {
        float brightness = as.GetBrightnessX();
        uint32_t colorVal = ((RGB)ledOptions.caseRGBColor).value(neopico->GetFormat(), brightness);
        for(int i = 0; i < ledOptions.caseRGBCount; i++) {
            frame[ledOptions.caseRGBIndex+i] = colorVal;
        }
    }

    neopico->SetFrame(frame);
    neopico->Show();
    AnimationStore.save();

    this->nextRunTime = make_timeout_time_ms(NeoPicoLEDAddon::intervalMS);
}

uint32_t NeoPicoLEDAddon::getBaseButtonMaskForPin(Pin_t pin)
{
    GpioMappingInfo* pinMappings = Storage::getInstance().getGpioMappings().pins;
    if (pin < 0 || pin >= (Pin_t)NUM_BANK0_GPIOS)
        return 0;

    switch (pinMappings[pin].action)
    {
        case GpioAction::BUTTON_PRESS_B1:       return GAMEPAD_MASK_B1;
        case GpioAction::BUTTON_PRESS_B2:       return GAMEPAD_MASK_B2;
        case GpioAction::BUTTON_PRESS_B3:       return GAMEPAD_MASK_B3;
        case GpioAction::BUTTON_PRESS_B4:       return GAMEPAD_MASK_B4;
        case GpioAction::BUTTON_PRESS_L1:       return GAMEPAD_MASK_L1;
        case GpioAction::BUTTON_PRESS_R1:       return GAMEPAD_MASK_R1;
        case GpioAction::BUTTON_PRESS_L2:       return GAMEPAD_MASK_L2;
        case GpioAction::BUTTON_PRESS_R2:       return GAMEPAD_MASK_R2;
        case GpioAction::BUTTON_PRESS_S1:       return GAMEPAD_MASK_S1;
        case GpioAction::BUTTON_PRESS_S2:       return GAMEPAD_MASK_S2;
        case GpioAction::BUTTON_PRESS_L3:       return GAMEPAD_MASK_L3;
        case GpioAction::BUTTON_PRESS_R3:       return GAMEPAD_MASK_R3;
        case GpioAction::BUTTON_PRESS_A1:       return GAMEPAD_MASK_A1;
        case GpioAction::BUTTON_PRESS_A2:       return GAMEPAD_MASK_A2;
        case GpioAction::BUTTON_PRESS_A3:       return GAMEPAD_MASK_A3;
        case GpioAction::BUTTON_PRESS_A4:       return GAMEPAD_MASK_A4;
        case GpioAction::BUTTON_PRESS_E1:       return GAMEPAD_MASK_E1;
        case GpioAction::BUTTON_PRESS_E2:       return GAMEPAD_MASK_E2;
        case GpioAction::BUTTON_PRESS_E3:       return GAMEPAD_MASK_E3;
        case GpioAction::BUTTON_PRESS_E4:       return GAMEPAD_MASK_E4;
        case GpioAction::BUTTON_PRESS_E5:       return GAMEPAD_MASK_E5;
        case GpioAction::BUTTON_PRESS_E6:       return GAMEPAD_MASK_E6;
        case GpioAction::BUTTON_PRESS_E7:       return GAMEPAD_MASK_E7;
        case GpioAction::BUTTON_PRESS_E8:       return GAMEPAD_MASK_E8;
        case GpioAction::BUTTON_PRESS_E9:       return GAMEPAD_MASK_E9;
        case GpioAction::BUTTON_PRESS_E10:      return GAMEPAD_MASK_E10;
        case GpioAction::BUTTON_PRESS_E11:      return GAMEPAD_MASK_E11;
        case GpioAction::BUTTON_PRESS_E12:      return GAMEPAD_MASK_E12;
        case GpioAction::BUTTON_PRESS_UP:       return GAMEPAD_MASK_DU;
        case GpioAction::BUTTON_PRESS_DOWN:     return GAMEPAD_MASK_DD;
        case GpioAction::BUTTON_PRESS_LEFT:     return GAMEPAD_MASK_DL;
        case GpioAction::BUTTON_PRESS_RIGHT:    return GAMEPAD_MASK_DR;
        default:                                return 0;
    }
}

std::vector<std::vector<Pixel>> NeoPicoLEDAddon::createPinLEDLayout(uint8_t ledsPerPixel)
{
    const LEDOptions& ledOptions = Storage::getInstance().getLedOptions();
    std::vector<Pixel> pixels;

    for (Pin_t pin = 0; pin < (Pin_t)NUM_BANK0_GPIOS; pin++)
    {
        int32_t ledIndex = pin < (Pin_t)ledOptions.pinLedIndices_count
            ? ledOptions.pinLedIndices[pin] : -1;

        if (ledIndex < 0)
            continue;

        uint32_t mask = getBaseButtonMaskForPin(pin);

        std::vector<uint8_t> positions;
        positions.resize(ledsPerPixel);
        for (uint8_t l = 0; l < ledsPerPixel; l++)
            positions[l] = ledIndex + l;

        pixels.push_back(Pixel(pin, mask, positions));
    }

    if (pixels.empty())
        return {};

    return { pixels };
}

void NeoPicoLEDAddon::configureLEDs()
{
    const LEDOptions& ledOptions = Storage::getInstance().getLedOptions();
    const TurboOptions& turboOptions = Storage::getInstance().getAddonOptions().turboOptions;
    vector<vector<Pixel>> pixels = createPinLEDLayout(ledOptions.ledsPerButton);
    matrix.setup(pixels, ledOptions.ledsPerButton);
    ledCount = matrix.getLedCount();
    if (ledOptions.pledType == PLED_TYPE_RGB && PLED_COUNT > 0)
        ledCount += PLED_COUNT;

    if (turboOptions.turboLedType == PLED_TYPE_RGB)
        ledCount += 1;

    if (ledOptions.caseRGBType == CASE_RGB_TYPE_STATIC ) {
        ledCount += ledOptions.caseRGBCount;
    }

    // Remove the old neopico (config can call this)
    delete neopico;
    neopico = new NeoPico(ledOptions.dataPin, ledCount, static_cast<LEDFormat>(ledOptions.ledFormat));
    neopico->Off();

    Animation::format = static_cast<LEDFormat>(ledOptions.ledFormat);
    as.ConfigureBrightness(ledOptions.brightnessMaximum, ledOptions.brightnessSteps);
    AnimationOptions animationOptions = AnimationStore.getAnimationOptions();
    addStaticThemes(ledOptions, animationOptions);
    as.SetOptions(animationOptions);
    as.SetMatrix(matrix);
    as.SetMode(as.options.baseAnimationIndex);
    lastMode = as.options.baseAnimationIndex;
}

AnimationHotkey animationHotkeys(Gamepad *gamepad)
{
    AnimationHotkey action = HOTKEY_LEDS_NONE;

    if (gamepad->pressedS1() && gamepad->pressedS2())
    {
        if (gamepad->pressedB3())
        {
            action = HOTKEY_LEDS_ANIMATION_UP;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_B3 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedB1())
        {
            action = HOTKEY_LEDS_ANIMATION_DOWN;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_B1 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedB4())
        {
            action = HOTKEY_LEDS_BRIGHTNESS_UP;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_B4 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedB2())
        {
            action = HOTKEY_LEDS_BRIGHTNESS_DOWN;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_B2 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedR1())
        {
            action = HOTKEY_LEDS_PARAMETER_UP;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_R1 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedR2())
        {
            action = HOTKEY_LEDS_PARAMETER_DOWN;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_R2 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedL1())
        {
            action = HOTKEY_LEDS_PRESS_PARAMETER_UP;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_L1 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedL2())
        {
            action = HOTKEY_LEDS_PRESS_PARAMETER_DOWN;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_L2 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedL3())
        {
            action = HOTKEY_LEDS_FADETIME_DOWN;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_L3 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
        else if (gamepad->pressedR3())
        {
            action = HOTKEY_LEDS_FADETIME_UP;
            gamepad->state.buttons &= ~(GAMEPAD_MASK_R3 | GAMEPAD_MASK_S1 | GAMEPAD_MASK_S2);
        }
    }

    return action;
}
