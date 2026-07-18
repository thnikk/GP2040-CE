#include "wake.h"

static volatile uint32_t lastActivityTime = 0;

void setLastActivity(uint32_t now_ms) {
    lastActivityTime = now_ms;
}

uint32_t getLastActivity() {
    return lastActivityTime;
}
