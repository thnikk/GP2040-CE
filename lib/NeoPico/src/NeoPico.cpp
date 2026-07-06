/**
 * Copyright (c) 2020 Raspberry Pi (Trading) Ltd.
 *
 * Modified by Jonathan Barket - 2021
 * SPDX-License-Identifier: BSD-3-Clause
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "pico/stdlib.h"
#include "hardware/pio.h"
#include "hardware/clocks.h"
#include "NeoPico.hpp"

LEDFormat NeoPico::GetFormat() {
  return format;
}

void NeoPico::PutPixel(uint32_t pixelData) {
  switch (format) {
    case LED_FORMAT_GRB:
    case LED_FORMAT_RGB:
      pio_sm_put_blocking(pio, sm, pixelData << 8u);
      break;
    case LED_FORMAT_GRBW:
    case LED_FORMAT_RGBW:
      pio_sm_put_blocking(pio, sm, pixelData);
      break;
  }
}

NeoPico::NeoPico(int ledPin, int numPixels, LEDFormat format, int stateMachine) : format(format), numPixels(numPixels) {
  // Fixed PIO0 state machine, chosen by the caller, so more than one
  // NeoPico instance can run at the same time (e.g. a per-button LED
  // chain plus a separate onboard indicator LED) without fighting
  // over the same SM. No runtime claiming: it's simpler and avoids
  // any dynamic PIO/state-machine interaction across cores.
  pio = pio0;
  sm = stateMachine;

  uint offset = pio_add_program(pio, &ws2812_program);
  bool rgbw = (format == LED_FORMAT_GRBW) || (format == LED_FORMAT_RGBW);
  ws2812_program_init(pio, sm, offset, ledPin, 800000, rgbw);
  this->Clear();
  sleep_ms(10);
}

void NeoPico::Clear() {
  memset(frame, 0, sizeof(frame));
}

void NeoPico::SetFrame(uint32_t newFrame[100]) {
  memcpy(frame, newFrame, sizeof(frame));
}

void NeoPico::Show() {
  for (int i = 0; i < this->numPixels; ++i) {
     this->PutPixel(this->frame[i]);
  }
  sleep_ms(10);
}

void NeoPico::Off() {
  Clear();
  for (int i = 0; i < this->numPixels; ++i) {
     this->PutPixel(this->frame[i]);
  }
  sleep_ms(10);
}
