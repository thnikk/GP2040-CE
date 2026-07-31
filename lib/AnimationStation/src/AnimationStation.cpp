/**
 * Copyright (c) 2020 Raspberry Pi (Trading) Ltd.
 *
 * Modified by Jonathan Barket - 2021
 * SPDX-License-Identifier: BSD-3-Clause
 */

#include "AnimationStation.hpp"

float AnimationStation::brightnessX = 0;
absolute_time_t AnimationStation::nextChange = nil_time;
AnimationOptions AnimationStation::options = {};
uint8_t AnimationStation::effectCount = TOTAL_EFFECTS;


AnimationStation::AnimationStation() {
  AnimationStation::SetBrightness(128);
}

void AnimationStation::ConfigureBrightness(uint8_t max, uint8_t steps) {
  (void)max;
  (void)steps;
}

void AnimationStation::HandleEvent(AnimationHotkey action) {
  if (action == HOTKEY_LEDS_NONE || !time_reached(AnimationStation::nextChange)) {
    return;
  }
  AnimationStation::nextChange = make_timeout_time_ms(250);

  if (action == HOTKEY_LEDS_ANIMATION_UP) {
    ChangeAnimation(1);
  }

  if (action == HOTKEY_LEDS_ANIMATION_DOWN) {
    ChangeAnimation(-1);
  }


  if (this->baseAnimation == nullptr || this->buttonAnimation == nullptr) {
    return;
  }
  
  if (action == HOTKEY_LEDS_PARAMETER_UP) {
    this->baseAnimation->ParameterUp();
  }

  if (action == HOTKEY_LEDS_PARAMETER_DOWN) {
    this->baseAnimation->ParameterDown();
  }

  if (action == HOTKEY_LEDS_PRESS_PARAMETER_UP) {
    this->buttonAnimation->ParameterUp();
  }

  if (action == HOTKEY_LEDS_PRESS_PARAMETER_DOWN) {
    this->buttonAnimation->ParameterDown();
  }

  if (action == HOTKEY_LEDS_FADETIME_UP) {
    this->baseAnimation->FadeTimeUp();
  }

  if (action == HOTKEY_LEDS_FADETIME_DOWN) {
    this->baseAnimation->FadeTimeDown();
  }  
  
}

void AnimationStation::ChangeAnimation(int changeSize) {
  this->SetMode(this->AdjustIndex(changeSize));
}

uint16_t AnimationStation::AdjustIndex(int changeSize) {
  int newIndex = (int)this->options.baseAnimationIndex + changeSize;

  if (newIndex >= AnimationStation::effectCount) {
    return 0;
  }

  if (newIndex < 0) {
    return (AnimationStation::effectCount - 1);
  }

  return (uint16_t)newIndex;
}

void AnimationStation::HandlePressed(std::vector<Pixel> pressed) {
  this->lastPressed = pressed;
  this->baseAnimation->UpdatePixels(pressed);  
  this->buttonAnimation->UpdatePixels(pressed);
}

void AnimationStation::ClearPressed() {
  if (this->buttonAnimation != nullptr) {
    this->buttonAnimation->ClearPixels();
  }
  if (this->baseAnimation != nullptr) {
    this->baseAnimation->ClearPixels();
  }

  this->lastPressed.clear();
}

void AnimationStation::Animate() {
  if (baseAnimation == nullptr || buttonAnimation == nullptr) {
    this->Clear();
    return;
  }

  baseAnimation->Animate(this->frame);
  buttonAnimation->Animate(this->frame);
}

void AnimationStation::Clear() { memset(frame, 0, sizeof(frame)); }

float AnimationStation::GetBrightnessX() {
  return AnimationStation::brightnessX;
}

uint8_t AnimationStation::GetBrightness() {
  return AnimationStation::options.brightness;
}

uint8_t AnimationStation::GetMode() { return this->options.baseAnimationIndex; }

void AnimationStation::SetMode(uint8_t mode) {
  this->options.baseAnimationIndex = mode;
  AnimationEffects newEffect =
      static_cast<AnimationEffects>(this->options.baseAnimationIndex);

  if (this->baseAnimation != nullptr) {
    delete this->baseAnimation;
  }
  if (this->buttonAnimation != nullptr) {
    delete this->buttonAnimation;
  }

  this->Clear();

  switch (newEffect) {
  case AnimationEffects::EFFECT_RAINBOW:
    this->baseAnimation = new Rainbow(matrix);
    this->buttonAnimation = new StaticColor(matrix, lastPressed);
    break;
  case AnimationEffects::EFFECT_CHASE:
    this->baseAnimation = new Chase(matrix);
    this->buttonAnimation = new StaticColor(matrix, lastPressed);
    break;
  case AnimationEffects::EFFECT_STATIC_THEME:
    this->baseAnimation = new StaticTheme(matrix);
    this->buttonAnimation = new StaticColor(matrix, lastPressed);
    break;
  case AnimationEffects::EFFECT_RIPPLE:
    this->baseAnimation = new Ripple(matrix);
    this->buttonAnimation = new StaticColor(matrix, lastPressed);
    break;
  case AnimationEffects::EFFECT_CUSTOM_THEME:
    this->baseAnimation = new CustomTheme(matrix);
    this->buttonAnimation = new CustomThemePressed(matrix, lastPressed);
    break;
  default:
    this->baseAnimation = new StaticColor(matrix);
    this->buttonAnimation = new StaticColor(matrix, lastPressed);
    break;
  }
}

void AnimationStation::SetMatrix(PixelMatrix matrix) {
  this->matrix = matrix;
}

void AnimationStation::SetOptions(AnimationOptions options) {
  AnimationStation::options = options;
  AnimationStation::SetBrightness(options.brightness);
}

void AnimationStation::ApplyBrightness(uint32_t *frameValue) {
  for (int i = 0; i < 100; i++)
    frameValue[i] = this->frame[i].value(Animation::format, brightnessX);
}

void AnimationStation::SetBrightness(uint8_t brightness) {
  AnimationStation::options.brightness = brightness;
  AnimationStation::brightnessX = brightness / 255.0F;
  if (AnimationStation::brightnessX > 1)
    AnimationStation::brightnessX = 1;
}

void AnimationStation::DimBrightnessTo0() {
  AnimationStation::brightnessX = 0;
}
