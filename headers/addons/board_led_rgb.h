/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: Copyright (c) 2026 OpenStickCommunity (gp2040-ce.info)
 */

#ifndef _BoardLedRgb_H
#define _BoardLedRgb_H

#include "gpaddon.h"
#include "storagemanager.h"
#include "NeoPico.hpp"

// Disabled by default; enable in BoardConfig.h with
// #define BOARD_LEDS_RGB_ENABLED 1
#ifndef BOARD_LEDS_RGB_ENABLED
#define BOARD_LEDS_RGB_ENABLED 0
#endif

// GPIO driving the onboard addressable LED (e.g. GPIO16 on the
// Waveshare RP2040-Zero). -1 disables the addon regardless of
// BOARD_LEDS_RGB_ENABLED.
#ifndef BOARD_LEDS_RGB_PIN
#define BOARD_LEDS_RGB_PIN -1
#endif

// PIO block and state machine used for this LED. Defaults to PIO1
// SM0, entirely separate hardware from NeoPicoLEDAddon (the
// per-button LED chain), which always runs on PIO0 SM0. Keeping the
// two on different PIO blocks avoids any possibility of them
// contending for the same PIO instruction memory, IRQs, or FIFOs.
#ifndef BOARD_LEDS_RGB_PIO_BLOCK
#define BOARD_LEDS_RGB_PIO_BLOCK pio1
#endif
#ifndef BOARD_LEDS_RGB_PIO_SM
#define BOARD_LEDS_RGB_PIO_SM 0
#endif

// Byte order used by the onboard LED. Most onboard WS2812-style LEDs
// (including the RP2040-Zero) use GRB.
#ifndef BOARD_LEDS_RGB_FORMAT
#define BOARD_LEDS_RGB_FORMAT LED_FORMAT_GRB
#endif

// Overall brightness scale, 0-255.
#ifndef BOARD_LEDS_RGB_BRIGHTNESS
#define BOARD_LEDS_RGB_BRIGHTNESS 128
#endif

// Per-input-mode colors (0xRRGGBB). Override any of these in
// BoardConfig.h to customize.
#ifndef BOARD_LEDS_RGB_COLOR_XINPUT
#define BOARD_LEDS_RGB_COLOR_XINPUT 0x00FF00
#endif
#ifndef BOARD_LEDS_RGB_COLOR_SWITCH
#define BOARD_LEDS_RGB_COLOR_SWITCH 0xFF0000
#endif
#ifndef BOARD_LEDS_RGB_COLOR_PS3
#define BOARD_LEDS_RGB_COLOR_PS3 0x0000FF
#endif
#ifndef BOARD_LEDS_RGB_COLOR_PS4
#define BOARD_LEDS_RGB_COLOR_PS4 0x0000FF
#endif
#ifndef BOARD_LEDS_RGB_COLOR_PS5
#define BOARD_LEDS_RGB_COLOR_PS5 0x0000FF
#endif
#ifndef BOARD_LEDS_RGB_COLOR_XBONE
#define BOARD_LEDS_RGB_COLOR_XBONE 0x00FF00
#endif
#ifndef BOARD_LEDS_RGB_COLOR_XBOXORIGINAL
#define BOARD_LEDS_RGB_COLOR_XBOXORIGINAL 0x00FF00
#endif
#ifndef BOARD_LEDS_RGB_COLOR_KEYBOARD
#define BOARD_LEDS_RGB_COLOR_KEYBOARD 0xFFFF00
#endif
#ifndef BOARD_LEDS_RGB_COLOR_MDMINI
#define BOARD_LEDS_RGB_COLOR_MDMINI 0x00FFFF
#endif
#ifndef BOARD_LEDS_RGB_COLOR_NEOGEO
#define BOARD_LEDS_RGB_COLOR_NEOGEO 0xFF8000
#endif
#ifndef BOARD_LEDS_RGB_COLOR_PCEMINI
#define BOARD_LEDS_RGB_COLOR_PCEMINI 0xFF00FF
#endif
#ifndef BOARD_LEDS_RGB_COLOR_EGRET
#define BOARD_LEDS_RGB_COLOR_EGRET 0xFF8000
#endif
#ifndef BOARD_LEDS_RGB_COLOR_ASTRO
#define BOARD_LEDS_RGB_COLOR_ASTRO 0xFF8000
#endif
#ifndef BOARD_LEDS_RGB_COLOR_PSCLASSIC
#define BOARD_LEDS_RGB_COLOR_PSCLASSIC 0x0000FF
#endif
#ifndef BOARD_LEDS_RGB_COLOR_GENERIC
#define BOARD_LEDS_RGB_COLOR_GENERIC 0xFFFFFF
#endif
// Shown while in web/serial config mode (blinks).
#ifndef BOARD_LEDS_RGB_COLOR_CONFIG
#define BOARD_LEDS_RGB_COLOR_CONFIG 0xFFFF00
#endif

// Blink interval while in config mode, in milliseconds.
#ifndef BOARD_LEDS_RGB_CONFIG_BLINK_MS
#define BOARD_LEDS_RGB_CONFIG_BLINK_MS 500
#endif

// BoardLedRgb Module Name
#define BoardLedRgbName "BoardLedRgb"

// Shows the active input mode (XInput, Switch, PS3, etc.) as a color
// on a single onboard addressable (WS2812-style) RGB LED.
//
// Runs alongside NeoPicoLEDAddon (button-layout LEDs) on a separate
// PIO block (BOARD_LEDS_RGB_PIO_BLOCK/BOARD_LEDS_RGB_PIO_SM) so the
// two share no PIO hardware at all.
class BoardLedRgbAddon : public GPAddon {
public:
	virtual bool available();
	virtual void setup();       // BoardLedRgb Setup
	virtual void process();     // BoardLedRgb Process
	virtual void preprocess() {}
	virtual std::string name() { return BoardLedRgbName; }
private:
	uint32_t colorForInputMode(InputMode mode);
	void showColor(uint32_t color);
	NeoPico *neoPico = nullptr;
	InputMode prevInputMode;
	bool prevConfigMode;
	bool isConfigMode;
	uint32_t timeSinceBlink;
	bool blinkState;
};

#endif  // _BoardLedRgb_H
