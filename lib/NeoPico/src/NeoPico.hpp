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
  NeoPico(int ledPin, int numPixels, LEDFormat format = LED_FORMAT_GRB);
  ~NeoPico();
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
  // State machine claimed for this instance, so multiple NeoPico
  // objects can each drive their own pin at the same time.
  int sm = 0;
  int numPixels = 0;
  uint32_t frame[100];
};

#endif
