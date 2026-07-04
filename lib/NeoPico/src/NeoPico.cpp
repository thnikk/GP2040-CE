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

NeoPico::NeoPico(int ledPin, int numPixels, LEDFormat format) : format(format), numPixels(numPixels) {
  // Claim a free state machine so more than one NeoPico instance can
  // run at the same time (e.g. a per-button LED chain plus a separate
  // onboard indicator LED), each on its own pin. Try PIO0 first, then
  // PIO1, then fall back to PIO0 SM0 (the old hardcoded behavior) if
  // every SM is already claimed.
  pio = pio0;
  sm = pio_claim_unused_sm(pio, false);
  if (sm < 0) {
    pio = pio1;
    sm = pio_claim_unused_sm(pio, false);
  }
  if (sm < 0) {
    pio = pio0;
    sm = 0;
  }

  uint offset = pio_add_program(pio, &ws2812_program);
  bool rgbw = (format == LED_FORMAT_GRBW) || (format == LED_FORMAT_RGBW);
  ws2812_program_init(pio, sm, offset, ledPin, 800000, rgbw);
  this->Clear();
  sleep_ms(10);
}

NeoPico::~NeoPico() {
  pio_sm_set_enabled(pio, sm, false);
  pio_sm_unclaim(pio, sm);
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
