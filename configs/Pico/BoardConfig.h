/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: Copyright (c) 2024 OpenStickCommunity (gp2040-ce.info)
 */

#ifndef PICO_BOARD_CONFIG_H_
#define PICO_BOARD_CONFIG_H_

#include "enums.pb.h"
#include "class/hid/hid.h"

#define BOARD_CONFIG_LABEL "Pico"

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
#define GPIO_PIN_16 GpioAction::BUTTON_PRESS_S1     // S1     | Back   | Minus   | Select   | 9      | Coin   |
#define KEYBOARD_KEYCODE_GP16 HID_KEY_5
#define GPIO_PIN_17 GpioAction::BUTTON_PRESS_S2     // S2     | Start  | Plus    | Start    | 10     | Start  |
#define KEYBOARD_KEYCODE_GP17 HID_KEY_1
#define GPIO_PIN_18 GpioAction::BUTTON_PRESS_L3     // L3     | LS     | LS      | L3       | 11     | LS     |
#define KEYBOARD_KEYCODE_GP18 HID_KEY_EQUAL
#define GPIO_PIN_19 GpioAction::BUTTON_PRESS_R3     // R3     | RS     | RS      | R3       | 12     | RS     |
#define KEYBOARD_KEYCODE_GP19 HID_KEY_MINUS
#define GPIO_PIN_20 GpioAction::BUTTON_PRESS_A1     // A1     | Guide  | Home    | PS       | 13     | ~      |
#define KEYBOARD_KEYCODE_GP20 HID_KEY_9
#define GPIO_PIN_21 GpioAction::BUTTON_PRESS_A2     // A2     | ~      | Capture | ~        | 14     | ~      |
#define KEYBOARD_KEYCODE_GP21 HID_KEY_F2

// Setting GPIO pins to assigned by add-on
//
#define GPIO_PIN_00 GpioAction::ASSIGNED_TO_ADDON
#define GPIO_PIN_01 GpioAction::ASSIGNED_TO_ADDON
#define GPIO_PIN_15 GpioAction::ASSIGNED_TO_ADDON
#define GPIO_PIN_28 GpioAction::ASSIGNED_TO_ADDON

#define TURBO_ENABLED 1
#define GPIO_PIN_14 GpioAction::BUTTON_PRESS_TURBO
#define TURBO_LED_PIN 15

#define BOARD_LEDS_PIN 28
#define LED_BRIGHTNESS_MAXIMUM 100
#define LED_BRIGHTNESS_STEPS 5
#define LED_FORMAT LED_FORMAT_GRB
#define LEDS_PER_PIXEL 1

// Pin → LED strip index mapping
#define BOARD_LED_INDEX_GP02  3
#define BOARD_LED_INDEX_GP03  1
#define BOARD_LED_INDEX_GP04  2
#define BOARD_LED_INDEX_GP05  0
#define BOARD_LED_INDEX_GP06  8
#define BOARD_LED_INDEX_GP07  9
#define BOARD_LED_INDEX_GP08  10
#define BOARD_LED_INDEX_GP09  11
#define BOARD_LED_INDEX_GP10  4
#define BOARD_LED_INDEX_GP11  5
#define BOARD_LED_INDEX_GP12  6
#define BOARD_LED_INDEX_GP13  7
#define BOARD_LED_INDEX_GP18  13
#define BOARD_LED_INDEX_GP19  14
#define BOARD_LED_INDEX_GP20  12
#define BOARD_LED_INDEX_GP21  15

// Spatial grid for ripple animation
#define BOARD_LED_POSITION_COLS 8
#define BOARD_LED_POSITIONS \
    { -1, -1,  3, -1,  4,  5,  6,  7 }, \
    {  0,  1,  2, -1,  8,  9, 10, 11 }, \
    { -1, -1, -1, -1, 12, 13, 14, 15 }

#define HAS_I2C_DISPLAY 1
#define I2C0_ENABLED 1
#define I2C0_PIN_SDA 0
#define I2C0_PIN_SCL 1
#define BUTTON_LAYOUT BUTTON_LAYOUT_STICKLESS
#define BUTTON_LAYOUT_RIGHT BUTTON_LAYOUT_STICKLESSB

// Mini menu navigation pins (compile-time, not remappable)
#define PIN_MENU_UP     2  // matches BUTTON_PRESS_UP
#define PIN_MENU_DOWN   3  // matches BUTTON_PRESS_DOWN
#define PIN_MENU_LEFT   5  // matches BUTTON_PRESS_LEFT
#define PIN_MENU_RIGHT  4  // matches BUTTON_PRESS_RIGHT
#define PIN_MENU_SELECT 6  // matches BUTTON_PRESS_B1
#define PIN_MENU_BACK   7  // matches BUTTON_PRESS_B2

#endif