/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: Copyright (c) 2024 OpenStickCommunity (gp2040-ce.info)
 */

#ifndef PICO_BOARD_CONFIG_H_
#define PICO_BOARD_CONFIG_H_

#include "enums.pb.h"
#include "class/hid/hid.h"

#define BOARD_CONFIG_LABEL "fightboard-v3-b-m"
#define BOARD_SVG

// Boot-hold input mode overrides: holding B1 (A) selects XInput,
// holding B2 (B) selects Switch. This matches the board's silkscreen
// button coloring (A=green/XInput, B=red/Switch).
#define DEFAULT_INPUT_MODE_B1 INPUT_MODE_XINPUT
#define DEFAULT_INPUT_MODE_B2 INPUT_MODE_SWITCH

// Main pin mapping Configuration
//                                                  // GP2040 | Xinput | Switch  | PS3/4/5  | Dinput | Arcade |
#define GPIO_PIN_00 GpioAction::BUTTON_PRESS_UP     // UP     | UP     | UP      | UP       | UP     | UP     |
#define GPIO_PIN_02 GpioAction::BUTTON_PRESS_DOWN   // DOWN   | DOWN   | DOWN    | DOWN     | DOWN   | DOWN   |
#define GPIO_PIN_03 GpioAction::BUTTON_PRESS_RIGHT  // RIGHT  | RIGHT  | RIGHT   | RIGHT    | RIGHT  | RIGHT  |
#define GPIO_PIN_01 GpioAction::BUTTON_PRESS_LEFT   // LEFT   | LEFT   | LEFT    | LEFT     | LEFT   | LEFT   |
#define GPIO_PIN_09 GpioAction::BUTTON_PRESS_B1     // B1     | A      | B       | Cross    | 2      | K1     |
#define GPIO_PIN_12 GpioAction::BUTTON_PRESS_B2     // B2     | B      | A       | Circle   | 3      | K2     |
#define GPIO_PIN_13 GpioAction::BUTTON_PRESS_R2     // R2     | RT     | ZR      | R2       | 8      | K3     |
#define GPIO_PIN_14 GpioAction::BUTTON_PRESS_L2     // L2     | LT     | ZL      | L2       | 7      | K4     |
#define GPIO_PIN_15 GpioAction::BUTTON_PRESS_B3     // B3     | X      | Y       | Square   | 1      | P1     |
#define GPIO_PIN_28 GpioAction::BUTTON_PRESS_B4     // B4     | Y      | X       | Triangle | 4      | P2     |
#define GPIO_PIN_27 GpioAction::BUTTON_PRESS_R1     // R1     | RB     | R       | R1       | 6      | P3     |
#define GPIO_PIN_26 GpioAction::BUTTON_PRESS_L1     // L1     | LB     | L       | L1       | 5      | P4     |
#define GPIO_PIN_07 GpioAction::BUTTON_PRESS_S1     // S1     | Back   | Minus   | Select   | 9      | Coin   |
#define GPIO_PIN_05 GpioAction::BUTTON_PRESS_S2     // S2     | Start  | Plus    | Start    | 10     | Start  |
#define GPIO_PIN_08 GpioAction::BUTTON_PRESS_L3     // L3     | LS     | LS      | L3       | 11     | LS     |
#define GPIO_PIN_04 GpioAction::BUTTON_PRESS_R3     // R3     | RS     | RS      | R3       | 12     | RS     |
#define GPIO_PIN_06 GpioAction::BUTTON_PRESS_A1     // A1     | Guide  | Home    | PS       | 13     | ~      |
#define GPIO_PIN_17 GpioAction::BUTTON_PRESS_A2     // A2     | ~      | Capture | ~        | 14     | ~      |

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
#define KEY_BUTTON_A2   HID_KEY_F2            // A2     | ~      | Capture | ~        | 14     | ~      |
#define KEY_BUTTON_FN   -1                    // Hotkey Function                                        |

// Onboard WS2812 RGB LED (GPIO16) - shows the active input mode as a
// color. Runs alongside the per-switch LEDs above (BOARD_LEDS_PIN),
// each on its own PIO state machine.
// NOTE: this onboard chip is wired RGB, unlike the GRB per-switch
// chain above (LED_FORMAT) - the color order was swapped.
#define BOARD_LEDS_RGB_ENABLED 1
#define BOARD_LEDS_RGB_PIN 16
#define BOARD_LEDS_RGB_FORMAT LED_FORMAT_RGB
#define BOARD_LEDS_RGB_BRIGHTNESS 16

#define HAS_I2C_DISPLAY 0
#define I2C1_ENABLED 0

// #define BUTTON_LAYOUT BUTTON_LAYOUT_FIGHTBOARD_MIRRORED
// #define BUTTON_LAYOUT_RIGHT BUTTON_LAYOUT_FIGHTBOARD_STICK_MIRRORED
#define BUTTON_LAYOUT BUTTON_LAYOUT_BOARD_DEFINED_A
#define BUTTON_LAYOUT_RIGHT BUTTON_LAYOUT_BOARD_DEFINED_B

// Start x pos at 0
#define DEFAULT_BOARD_LAYOUT_A {\
    {GP_ELEMENT_BTN_BUTTON, { 60,  25, 8, 8, 1, 1, GAMEPAD_MASK_B3, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 60,  45, 8, 8, 1, 1, GAMEPAD_MASK_B1, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 40,  15, 8, 8, 1, 1, GAMEPAD_MASK_B4, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 40,  35, 8, 8, 1, 1, GAMEPAD_MASK_B2, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 20,  15, 8, 8, 1, 1, GAMEPAD_MASK_R1, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 20,  35, 8, 8, 1, 1, GAMEPAD_MASK_R2, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 0,  15, 8, 8, 1, 1, GAMEPAD_MASK_L1, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 0,  35, 8, 8, 1, 1, GAMEPAD_MASK_L2, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 0,  50, 4, 4, 1, 1, GAMEPAD_MASK_L3, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 10,  50, 4, 4, 1, 1, GAMEPAD_MASK_S1, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 20,  50, 4, 4, 1, 1, GAMEPAD_MASK_A1, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 30,  50, 4, 4, 1, 1, GAMEPAD_MASK_S2, GP_SHAPE_ELLIPSE}},\
    {GP_ELEMENT_BTN_BUTTON, { 40,  50, 4, 4, 1, 1, GAMEPAD_MASK_R3, GP_SHAPE_ELLIPSE}}\
}

// End x pos at 130; 22, 0, 19, 38 -> -16, -38, -19, 0 -> 114, 92, 111, 130
// y: 23, 39, 42, 45
#define DEFAULT_BOARD_LAYOUT_B {\
	{GP_ELEMENT_DIR_BUTTON, {108, 23, 8, 8, 1, 1, GAMEPAD_MASK_UP,    GP_SHAPE_ELLIPSE}},\
	{GP_ELEMENT_DIR_BUTTON, {92, 45, 8, 8, 1, 1, GAMEPAD_MASK_LEFT,  GP_SHAPE_ELLIPSE}},\
	{GP_ELEMENT_DIR_BUTTON, {111, 42, 8, 8, 1, 1, GAMEPAD_MASK_DOWN,  GP_SHAPE_ELLIPSE}},\
	{GP_ELEMENT_DIR_BUTTON, {130, 39, 8, 8, 1, 1, GAMEPAD_MASK_RIGHT, GP_SHAPE_ELLIPSE}},\
}

