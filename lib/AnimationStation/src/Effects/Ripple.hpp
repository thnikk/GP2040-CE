#ifndef _RIPPLE_H_
#define _RIPPLE_H_

#include "../Animation.hpp"
#include "hardware/clocks.h"
#include <stdio.h>
#include <stdlib.h>
#include <vector>
#include <set>
#include <math.h>
#include "../AnimationStation.hpp"

class Ripple : public Animation {
public:
  Ripple(PixelMatrix &matrix);
  ~Ripple() {};

  void Animate(RGB (&frame)[100]);
  void ParameterUp();
  void ParameterDown();

protected:
  struct RippleOrigin {
    int8_t x, y;
    int32_t elapsed;
  };

  std::vector<RippleOrigin> origins;
  std::set<std::pair<int8_t, int8_t>> prevPressed;
  absolute_time_t nextRunTime = nil_time;
  static constexpr float maxRadius = 8.0f;
  static constexpr float ringThickness = 1.0f;
};

#endif
