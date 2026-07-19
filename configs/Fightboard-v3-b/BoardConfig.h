/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: Copyright (c) 2024 OpenStickCommunity (gp2040-ce.info)
 */

#ifndef PICO_BOARD_CONFIG_H_
#define PICO_BOARD_CONFIG_H_

#include "enums.pb.h"
#include "class/hid/hid.h"

#define BOARD_CONFIG_LABEL "fightboard-v3-b"
#define BOARD_SVG

#define BOARD_EXTRA_PINS {17, 18, 19, 20, 21, 22, 23, 24, 25}

// Main pin mapping Configuration
//                                                  // GP2040 | Xinput | Switch  | PS3/4/5  | Dinput | Arcade |
#define GPIO_PIN_29 GpioAction::BUTTON_PRESS_UP     // UP     | UP     | UP      | UP       | UP     | UP     |
#define GPIO_PIN_27 GpioAction::BUTTON_PRESS_DOWN   // DOWN   | DOWN   | DOWN    | DOWN     | DOWN   | DOWN   |
#define GPIO_PIN_26 GpioAction::BUTTON_PRESS_RIGHT  // RIGHT  | RIGHT  | RIGHT   | RIGHT    | RIGHT  | RIGHT  |
#define GPIO_PIN_28 GpioAction::BUTTON_PRESS_LEFT   // LEFT   | LEFT   | LEFT    | LEFT     | LEFT   | LEFT   |
#define GPIO_PIN_05 GpioAction::BUTTON_PRESS_B1     // B1     | A      | B       | Cross    | 2      | K1     |
#define GPIO_PIN_06 GpioAction::BUTTON_PRESS_B2     // B2     | B      | A       | Circle   | 3      | K2     |
#define GPIO_PIN_07 GpioAction::BUTTON_PRESS_R2     // R2     | RT     | ZR      | R2       | 8      | K3     |
#define GPIO_PIN_08 GpioAction::BUTTON_PRESS_L2     // L2     | LT     | ZL      | L2       | 7      | K4     |
#define GPIO_PIN_01 GpioAction::BUTTON_PRESS_B3     // B3     | X      | Y       | Square   | 1      | P1     |
#define GPIO_PIN_02 GpioAction::BUTTON_PRESS_B4     // B4     | Y      | X       | Triangle | 4      | P2     |
#define GPIO_PIN_03 GpioAction::BUTTON_PRESS_R1     // R1     | RB     | R       | R1       | 6      | P3     |
#define GPIO_PIN_04 GpioAction::BUTTON_PRESS_L1     // L1     | LB     | L       | L1       | 5      | P4     |
#define GPIO_PIN_10 GpioAction::BUTTON_PRESS_S1     // S1     | Back   | Minus   | Select   | 9      | Coin   |
#define GPIO_PIN_12 GpioAction::BUTTON_PRESS_S2     // S2     | Start  | Plus    | Start    | 10     | Start  |
#define GPIO_PIN_09 GpioAction::BUTTON_PRESS_L3     // L3     | LS     | LS      | L3       | 11     | LS     |
#define GPIO_PIN_13 GpioAction::BUTTON_PRESS_R3     // R3     | RS     | RS      | R3       | 12     | RS     |
#define GPIO_PIN_11 GpioAction::BUTTON_PRESS_A1     // A1     | Guide  | Home    | PS       | 13     | ~      |

// Set physical pin to open webconfig
#define PIN_WEBCONFIG 12

// Hold this pin + PIN_WEBCONFIG at boot to show the configuration button in webconfig
#define PIN_WEBCONFIG_ADVANCED 10

// Keyboard Mapping Configuration
//                                            // GP2040 | Xinput | Switch  | PS3/4/5  | Dinput | Arcade |
#define KEY_DPAD_UP     HID_KEY_ARROW_UP      // UP     | UP     | UP      | UP       | UP     | UP     |
#define KEY_DPAD_DOWN   HID_KEY_ARROW_DOWN    // DOWN   | DOWN   | DOWN    | DOWN     | DOWN   | DOWN   |
#define KEY_DPAD_RIGHT  HID_KEY_ARROW_RIGHT   // RIGHT  | RIGHT  | RIGHT   | RIGHT    | RIGHT  | RIGHT  |
#define KEY_DPAD_LEFT   HID_KEY_ARROW_LEFT    // LEFT   | LEFT   | LEFT    | LEFT     | LEFT   | LEFT   |
#define KEY_BUTTON_B1   HID_KEY_SHIFT_LEFT    // B1     | A      | B       | Cross    | 2      | K1     |
#define KEY_BUTTON_B2   HID_KEY_Z             // B2     | B      | A       | Circle   | 3      | K2     |
#define KEY_BUTTON_R2   HID_KEY_X             // R2     | RT     | ZR      | R2       | 8      | K3     |
#define KEY_BUTTON_L2   HID_KEY_V             // L2     | LT     | ZL      | L2       | 7      | K4     |
#define KEY_BUTTON_B3   HID_KEY_CONTROL_LEFT  // B3     | X      | Y       | Square   | 1      | P1     |
#define KEY_BUTTON_B4   HID_KEY_ALT_LEFT      // B4     | Y      | X       | Triangle | 4      | P2     |
#define KEY_BUTTON_R1   HID_KEY_SPACE         // R1     | RB     | R       | R1       | 6      | P3     |
#define KEY_BUTTON_L1   HID_KEY_C             // L1     | LB     | L       | L1       | 5      | P4     |
#define KEY_BUTTON_S1   HID_KEY_5             // S1     | Back   | Minus   | Select   | 9      | Coin   |
#define KEY_BUTTON_S2   HID_KEY_1             // S2     | Start  | Plus    | Start    | 10     | Start  |
#define KEY_BUTTON_L3   HID_KEY_EQUAL         // L3     | LS     | LS      | L3       | 11     | LS     |
#define KEY_BUTTON_R3   HID_KEY_MINUS         // R3     | RS     | RS      | R3       | 12     | RS     |
#define KEY_BUTTON_A1   HID_KEY_9             // A1     | Guide  | Home    | PS       | 13     | ~      |
#define KEY_BUTTON_FN   -1                    // Hotkey Function                                        |

// Boot-hold pin-based input mode overrides
#define DEFAULT_INPUT_MODE_XINPUT_PIN 5   // B1 (GP5)
#define DEFAULT_INPUT_MODE_SWITCH_PIN 6   // B2 (GP6)
#define DEFAULT_INPUT_MODE_PS3_PIN 1      // B3 (GP1)
#define DEFAULT_INPUT_MODE_PS4_PIN 2      // B4 (GP2)
#define DEFAULT_INPUT_MODE_PS5_PIN 3      // R1 (GP3)
#define DEFAULT_INPUT_MODE_KEYBOARD_PIN 4 // L1 (GP4)

// Hotkeys
#define HOTKEY_08_BUTTONS_MASK 3072  // L3+R3
#define HOTKEY_08_DPAD_MASK 4        // Left
#define HOTKEY_08_AUX_MASK 0
#define HOTKEY_08_ACTION 42          // HOTKEY_PREVIOUS_PROFILE

#define HOTKEY_09_BUTTONS_MASK 3072  // L3+R3
#define HOTKEY_09_DPAD_MASK 8        // Right
#define HOTKEY_09_AUX_MASK 0
#define HOTKEY_09_ACTION 35          // HOTKEY_NEXT_PROFILE

// Onboard WS2812 RGB LED (GPIO16) - shows the active input mode as a
// color. NOTE: this onboard chip is wired RGB, not the GRB used by
// the per-switch chain on other Fightboard variants - color order
// was swapped accordingly.
#define BOARD_LEDS_RGB_ENABLED 1
#define BOARD_LEDS_RGB_PIN 16
#define BOARD_LEDS_RGB_FORMAT LED_FORMAT_RGB
#define BOARD_LEDS_RGB_BRIGHTNESS 16
#define BOARD_LEDS_RGB_COLOR_PS4 0xFFFF00      // yellow
#define BOARD_LEDS_RGB_COLOR_PS5 0xFF00FF      // purple
#define BOARD_LEDS_RGB_COLOR_KEYBOARD 0xFF8000 // orange

// Mini menu navigation pins (compile-time, not remappable)
#define PIN_MENU_UP     29  // matches BUTTON_PRESS_UP
#define PIN_MENU_DOWN   27  // matches BUTTON_PRESS_DOWN
#define PIN_MENU_LEFT   28  // matches BUTTON_PRESS_LEFT
#define PIN_MENU_RIGHT  26  // matches BUTTON_PRESS_RIGHT
#define PIN_MENU_SELECT 5   // matches BUTTON_PRESS_B1
#define PIN_MENU_BACK   6   // matches BUTTON_PRESS_B2
#endif
