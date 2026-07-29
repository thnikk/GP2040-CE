#include "Ripple.hpp"

#define RIPPLE_CYCLE_INCREMENT   50
#define RIPPLE_CYCLE_MAX         2000
#define RIPPLE_CYCLE_MIN         100

Ripple::Ripple(PixelMatrix &matrix) : Animation(matrix) {
}

void Ripple::Animate(RGB (&frame)[100]) {
  if (!time_reached(this->nextRunTime))
    return;

  UpdateTime();

  RGB normalColor = (AnimationStation::options.staticColorNormal != 0)
    ? RGB(AnimationStation::options.staticColorNormal)
    : colors[AnimationStation::options.staticColorIndex];
  RGB pressedColor = (AnimationStation::options.staticColorPressed != 0)
    ? RGB(AnimationStation::options.staticColorPressed)
    : colors[AnimationStation::options.buttonColorIndex];

  // Build set of currently pressed positions
  std::set<std::pair<int8_t, int8_t>> currentPressed;
  for (auto &pixel : this->pixels)
    if (pixel.x >= 0 && pixel.y >= 0)
      currentPressed.insert({pixel.x, pixel.y});

  // Detect new presses (edge-triggered)
  for (auto &pixel : this->pixels) {
    if (pixel.x < 0 || pixel.y < 0)
      continue;

    std::pair<int8_t, int8_t> key = {pixel.x, pixel.y};
    if (prevPressed.find(key) != prevPressed.end())
      continue;

    bool found = false;
    for (auto &origin : origins) {
      if (origin.x == pixel.x && origin.y == pixel.y) {
        origin.elapsed = 0;
        found = true;
        break;
      }
    }
    if (!found)
      origins.push_back({pixel.x, pixel.y, 0});
  }

  prevPressed = currentPressed;

  // Advance elapsed and cull expired origins
  for (auto it = origins.begin(); it != origins.end(); ) {
    it->elapsed += updateTimeInMs;
    if (it->elapsed >= AnimationStation::options.chaseCycleTime)
      it = origins.erase(it);
    else
      ++it;
  }

  // Render
  for (auto &col : matrix->pixels) {
    for (auto &pixel : col) {
      if (pixel.index == NO_PIXEL.index)
        continue;

      bool onWavefront = false;
      if (pixel.x >= 0 && pixel.y >= 0) {
        for (auto &origin : origins) {
          float dx = pixel.x - origin.x;
          float dist = fabs(dx);

          float progress = (float)origin.elapsed / (float)AnimationStation::options.chaseCycleTime;
          float currentRadius = progress * maxRadius;

          if (fabs(dist - currentRadius) < ringThickness) {
            onWavefront = true;
            break;
          }
        }
      }

      for (auto &pos : pixel.positions)
        frame[pos] = onWavefront ? pressedColor : normalColor;
    }
  }

  this->nextRunTime = make_timeout_time_ms(20);
}

void Ripple::ParameterUp() {
  AnimationStation::options.chaseCycleTime += RIPPLE_CYCLE_INCREMENT;
  if (AnimationStation::options.chaseCycleTime > RIPPLE_CYCLE_MAX)
    AnimationStation::options.chaseCycleTime = RIPPLE_CYCLE_MAX;
}

void Ripple::ParameterDown() {
  AnimationStation::options.chaseCycleTime -= RIPPLE_CYCLE_INCREMENT;
  if (AnimationStation::options.chaseCycleTime < RIPPLE_CYCLE_MIN)
    AnimationStation::options.chaseCycleTime = RIPPLE_CYCLE_MIN;
}
