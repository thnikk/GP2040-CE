/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: Copyright (c) 2026 OpenStickCommunity (gp2040-ce.info)
 */

#include "addons/board_led_rgb.h"
#include "Animation.hpp"
#include "helper.h"

bool BoardLedRgbAddon::available() {
    return BOARD_LEDS_RGB_ENABLED && isValidPin(BOARD_LEDS_RGB_PIN);
}

void BoardLedRgbAddon::setup() {
    neoPico = new NeoPico(BOARD_LEDS_RGB_PIN, 1, BOARD_LEDS_RGB_FORMAT, BOARD_LEDS_RGB_PIO_SM);
    // Sentinel outside the InputMode range forces a color update on the
    // first process() call.
    prevInputMode = static_cast<InputMode>(-1);
    prevConfigMode = false;
    isConfigMode = Storage::getInstance().GetConfigMode();
    timeSinceBlink = getMillis();
    blinkState = false;
}

uint32_t BoardLedRgbAddon::colorForInputMode(InputMode mode) {
    switch (mode) {
        case INPUT_MODE_XINPUT:      return BOARD_LEDS_RGB_COLOR_XINPUT;
        case INPUT_MODE_SWITCH:      return BOARD_LEDS_RGB_COLOR_SWITCH;
        case INPUT_MODE_PS3:         return BOARD_LEDS_RGB_COLOR_PS3;
        case INPUT_MODE_PS4:         return BOARD_LEDS_RGB_COLOR_PS4;
        case INPUT_MODE_PS5:         return BOARD_LEDS_RGB_COLOR_PS5;
        case INPUT_MODE_XBONE:       return BOARD_LEDS_RGB_COLOR_XBONE;
        case INPUT_MODE_XBOXORIGINAL:
            return BOARD_LEDS_RGB_COLOR_XBOXORIGINAL;
        case INPUT_MODE_KEYBOARD:    return BOARD_LEDS_RGB_COLOR_KEYBOARD;
        case INPUT_MODE_MDMINI:      return BOARD_LEDS_RGB_COLOR_MDMINI;
        case INPUT_MODE_NEOGEO:      return BOARD_LEDS_RGB_COLOR_NEOGEO;
        case INPUT_MODE_PCEMINI:     return BOARD_LEDS_RGB_COLOR_PCEMINI;
        case INPUT_MODE_EGRET:       return BOARD_LEDS_RGB_COLOR_EGRET;
        case INPUT_MODE_ASTRO:       return BOARD_LEDS_RGB_COLOR_ASTRO;
        case INPUT_MODE_PSCLASSIC:   return BOARD_LEDS_RGB_COLOR_PSCLASSIC;
        case INPUT_MODE_GENERIC:
        default:                     return BOARD_LEDS_RGB_COLOR_GENERIC;
    }
}

void BoardLedRgbAddon::showColor(uint32_t color) {
    float brightness = BOARD_LEDS_RGB_BRIGHTNESS / 255.0f;
    uint32_t frame[100] = {0};
    frame[0] = RGB(color).value(BOARD_LEDS_RGB_FORMAT, brightness);
    neoPico->SetFrame(frame);
    neoPico->Show();
}

void BoardLedRgbAddon::process() {
    isConfigMode = Storage::getInstance().GetConfigMode();

    if (isConfigMode) {
        uint32_t millis = getMillis();
        if ((millis - timeSinceBlink) > BOARD_LEDS_RGB_CONFIG_BLINK_MS) {
            blinkState = !blinkState;
            timeSinceBlink = millis;
            showColor(blinkState ? BOARD_LEDS_RGB_COLOR_CONFIG : 0x000000);
        }
        prevConfigMode = true;
        return;
    }

    Gamepad * processedGamepad = Storage::getInstance().GetProcessedGamepad();
    InputMode mode = processedGamepad->getOptions().inputMode;

    // Update on mode change, or right after leaving config mode so the
    // real input-mode color is restored.
    if (prevConfigMode || mode != prevInputMode) {
        showColor(colorForInputMode(mode));
        prevInputMode = mode;
    }
    prevConfigMode = false;
}
