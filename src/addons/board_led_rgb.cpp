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
    // NeoPico is NOT constructed here — lazy init in process() instead.
    // Loading the WS2812 PIO program during setup (even with an empty
    // FIFO) causes the board to hang when web config mode is entered on
    // some boards (e.g. Waveshare RP2040-Zero). The exact mechanism
    // appears to be a PIO/USB interaction — the enabled-but-stalled
    // state machine on PIO1 somehow interferes with RNDIS init on Core0.
    // By deferring NeoPico construction to the first process() call that
    // runs outside of config mode, the PIO program is never loaded
    // during web config boot.
    neoPico = nullptr;
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
    if (neoPico == nullptr) {
        return;
    }
    float brightness = BOARD_LEDS_RGB_BRIGHTNESS / 255.0f;
    uint32_t frame[100] = {0};
    frame[0] = RGB(color).value(BOARD_LEDS_RGB_FORMAT, brightness);
    neoPico->SetFrame(frame);
    neoPico->Show();
}

void BoardLedRgbAddon::process() {
    isConfigMode = Storage::getInstance().GetConfigMode();

    if (isConfigMode) {
        prevConfigMode = true;
        return;
    }

    // Lazy-init NeoPico on the first process() call outside config
    // mode. Defers loading the WS2812 PIO program until we are past
    // web config init, which avoids the config-mode hang.
    if (neoPico == nullptr) {
        neoPico = new NeoPico(BOARD_LEDS_RGB_PIN, 1, BOARD_LEDS_RGB_FORMAT, BOARD_LEDS_RGB_PIO_SM, BOARD_LEDS_RGB_PIO_BLOCK);
    }

    Gamepad * processedGamepad = Storage::getInstance().GetProcessedGamepad();
    InputMode mode = processedGamepad->getOptions().inputMode;

    if (prevConfigMode || mode != prevInputMode) {
        showColor(colorForInputMode(mode));
        prevInputMode = mode;
    }
    prevConfigMode = false;
}
