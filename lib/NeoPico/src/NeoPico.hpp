#ifndef _NEO_PICO_H_
#define _NEO_PICO_H_

#include "ws2812.pio.h"
#include <vector>

typedef enum
{
  LED_FORMAT_GRB = 0,
  LED_FORMAT_RGB = 1,
  LED_FORMAT_GRBW = 2,
  LED_FORMAT_RGBW = 3,
} LEDFormat;

class NeoPico
{
public:
  NeoPico(int ledPin, int numPixels, LEDFormat format = LED_FORMAT_GRB, int stateMachine = 0);
  void Show();
  void Clear();
  void Off();
  LEDFormat GetFormat();
  // void SetPixel(int pixel, uint32_t color);
  void SetFrame(uint32_t newFrame[100]);
private:
  void PutPixel(uint32_t pixel_grb);
  LEDFormat format;
  PIO pio = pio0;
  // Fixed state machine for this instance. Callers that need more
  // than one NeoPico running at once (e.g. a per-button LED chain
  // plus a separate onboard indicator LED) must pass distinct
  // stateMachine values so they don't share PIO0 SM0.
  int sm = 0;
  int numPixels = 0;
  uint32_t frame[100];
};

#endif
