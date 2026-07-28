/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: Copyright (c) 2024 OpenStickCommunity (gp2040-ce.info)
 */

#ifndef PICO_BOARD_CONFIG_H_
#define PICO_BOARD_CONFIG_H_

#include "enums.pb.h"
#include "class/hid/hid.h"

#define BOARD_CONFIG_LABEL "Waveshare Zero"

// Extra GPIO pads on the back of the RP2040-Zero (small surface-mount pads)
// Uncomment and adjust for your board:
// #define BOARD_EXTRA_PINS {0, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25}

// Main pin mapping Configuration
//                                                  // GP2040 | Xinput | Switch  | PS3/4/5  | Dinput | Arcade |
#define GPIO_PIN_02 GpioAction::BUTTON_PRESS_UP     // UP     | UP     | UP      | UP       | UP     | UP     |
#define KEYBOARD_KEYCODE_GP02 HID_KEY_ARROW_UP
#define GPIO_PIN_03 GpioAction::BUTTON_PRESS_DOWN   // DOWN   | DOWN   | DOWN    | DOWN     | DOWN   | DOWN   |
#define KEYBOARD_KEYCODE_GP03 HID_KEY_ARROW_DOWN
#define GPIO_PIN_04 GpioAction::BUTTON_PRESS_RIGHT  // RIGHT  | RIGHT  | RIGHT   | RIGHT    | RIGHT  | RIGHT  |
#define KEYBOARD_KEYCODE_GP04 HID_KEY_ARROW_RIGHT
#define GPIO_PIN_05 GpioAction::BUTTON_PRESS_LEFT   // LEFT   | LEFT   | LEFT    | LEFT     | LEFT   | LEFT   |
#define KEYBOARD_KEYCODE_GP05 HID_KEY_ARROW_LEFT
#define GPIO_PIN_06 GpioAction::BUTTON_PRESS_B1     // B1     | A      | B       | Cross    | 2      | K1     |
#define KEYBOARD_KEYCODE_GP06 HID_KEY_SHIFT_LEFT
#define GPIO_PIN_07 GpioAction::BUTTON_PRESS_B2     // B2     | B      | A       | Circle   | 3      | K2     |
#define KEYBOARD_KEYCODE_GP07 HID_KEY_Z
#define GPIO_PIN_08 GpioAction::BUTTON_PRESS_R2     // R2     | RT     | ZR      | R2       | 8      | K3     |
#define KEYBOARD_KEYCODE_GP08 HID_KEY_X
#define GPIO_PIN_09 GpioAction::BUTTON_PRESS_L2     // L2     | LT     | ZL      | L2       | 7      | K4     |
#define KEYBOARD_KEYCODE_GP09 HID_KEY_V
#define GPIO_PIN_10 GpioAction::BUTTON_PRESS_B3     // B3     | X      | Y       | Square   | 1      | P1     |
#define KEYBOARD_KEYCODE_GP10 HID_KEY_CONTROL_LEFT
#define GPIO_PIN_11 GpioAction::BUTTON_PRESS_B4     // B4     | Y      | X       | Triangle | 4      | P2     |
#define KEYBOARD_KEYCODE_GP11 HID_KEY_ALT_LEFT
#define GPIO_PIN_12 GpioAction::BUTTON_PRESS_R1     // R1     | RB     | R       | R1       | 6      | P3     |
#define KEYBOARD_KEYCODE_GP12 HID_KEY_SPACE
#define GPIO_PIN_13 GpioAction::BUTTON_PRESS_L1     // L1     | LB     | L       | L1       | 5      | P4     |
#define KEYBOARD_KEYCODE_GP13 HID_KEY_C
#define GPIO_PIN_00 GpioAction::BUTTON_PRESS_S1     // S1     | Back   | Minus   | Select   | 9      | Coin   |
#define KEYBOARD_KEYCODE_GP00 HID_KEY_5
#define GPIO_PIN_01 GpioAction::BUTTON_PRESS_S2     // S2     | Start  | Plus    | Start    | 10     | Start  |
#define KEYBOARD_KEYCODE_GP01 HID_KEY_1
#define GPIO_PIN_26 GpioAction::BUTTON_PRESS_L3     // L3     | LS     | LS      | L3       | 11     | LS     |
#define KEYBOARD_KEYCODE_GP26 HID_KEY_EQUAL
#define GPIO_PIN_27 GpioAction::BUTTON_PRESS_R3     // R3     | RS     | RS      | R3       | 12     | RS     |
#define KEYBOARD_KEYCODE_GP27 HID_KEY_MINUS
#define GPIO_PIN_14 GpioAction::BUTTON_PRESS_A1     // A1     | Guide  | Home    | PS       | 13     | ~      |
#define KEYBOARD_KEYCODE_GP14 HID_KEY_9
#define GPIO_PIN_15 GpioAction::BUTTON_PRESS_A2     // A2     | ~      | Capture | ~        | 14     | ~      |
#define KEYBOARD_KEYCODE_GP15 HID_KEY_F2

// Mini menu navigation pins (compile-time, not remappable)
#define PIN_MENU_UP     2  // matches BUTTON_PRESS_UP
#define PIN_MENU_DOWN   3  // matches BUTTON_PRESS_DOWN
#define PIN_MENU_LEFT   5  // matches BUTTON_PRESS_LEFT
#define PIN_MENU_RIGHT  4  // matches BUTTON_PRESS_RIGHT
#define PIN_MENU_SELECT 6  // matches BUTTON_PRESS_B1
#define PIN_MENU_BACK   7  // matches BUTTON_PRESS_B2

#endif