#include "DisplaySaverScreen.h"

#include "pico/stdlib.h"
#include "version.h"
#include "wake.h"

void DisplaySaverScreen::init() {
    const DisplayOptions& options = Storage::getInstance().getDisplayOptions();
    displaySaverMode = options.displaySaverMode;
    enteredSaverTime = getLastActivity();

    getRenderer()->clearScreen();

    switch (displaySaverMode) {
        case DisplaySaverMode::DISPLAY_SAVER_SNOW:
            initSnowScene();
            break;
        case DisplaySaverMode::DISPLAY_SAVER_BOUNCE:
            break;
        case DisplaySaverMode::DISPLAY_SAVER_PIPES:
            break;
        case DisplaySaverMode::DISPLAY_SAVER_TOAST:
            initToasters();
            break;
        case DisplaySaverMode::DISPLAY_SAVER_STARS:
            initStarsScene();
            break;
    }
}

void DisplaySaverScreen::shutdown() {
    clearElements();
}

void DisplaySaverScreen::drawScreen() {
    switch (displaySaverMode) {
        case DisplaySaverMode::DISPLAY_SAVER_SNOW:
            drawSnowScene();
            break;
        case DisplaySaverMode::DISPLAY_SAVER_BOUNCE:
            drawBounceScene();
            break;
        case DisplaySaverMode::DISPLAY_SAVER_PIPES:
            drawPipeScene();
            break;
        case DisplaySaverMode::DISPLAY_SAVER_TOAST:
            drawToasterScene();
            break;
        case DisplaySaverMode::DISPLAY_SAVER_STARS:
            drawStarsScene();
            break;
    }
}

int8_t DisplaySaverScreen::update() {
    if (!Storage::getInstance().GetConfigMode()) {
        if (getLastActivity() > enteredSaverTime)
            return DisplayMode::BUTTONS;
    }

    return -1;
}

void DisplaySaverScreen::initSnowScene() {
    for (uint8_t x = 0; x < SCREEN_WIDTH; ++x) {
        for (uint8_t y = 0; y < SCREEN_HEIGHT; ++y) {
            snowflakeSpeeds[x][y] = 0;
            snowflakeDrift[x][y] = 0;
            getRenderer()->drawPixel(x, y, 0);
        }
    }
}

void DisplaySaverScreen::drawSnowScene() {
    for (int8_t y = SCREEN_HEIGHT - 1; y >= 0; --y) {
        for (uint8_t x = 0; x < SCREEN_WIDTH; ++x) {
            if (snowflakeSpeeds[x][y] > 0) {
                uint8_t speed = snowflakeSpeeds[x][y];
                uint8_t newY = y + speed;
                int8_t drift = snowflakeDrift[x][y];
                int8_t newX = x + drift;

                if (newX < 0) newX = 0;
                if (newX >= SCREEN_WIDTH) newX = SCREEN_WIDTH - 1;

                if (newY >= SCREEN_HEIGHT) {
                    getRenderer()->drawPixel(x, y, 0);
                    snowflakeSpeeds[x][y] = 0;
                    snowflakeDrift[x][y] = 0;
                } else {
                    getRenderer()->drawPixel(x, y, 0);
                    getRenderer()->drawPixel(newX, newY, 1);
                    snowflakeSpeeds[newX][newY] = speed;
                    snowflakeDrift[newX][newY] = drift;
                    snowflakeSpeeds[x][y] = 0;
                    snowflakeDrift[x][y] = 0;
                }
            }
        }
    }

    for (uint8_t x = 0; x < SCREEN_WIDTH; ++x) {
        if (rand() % 100 == 0) {
            getRenderer()->drawPixel(x, 0, 1);
            snowflakeSpeeds[x][0] = (rand() % 3) + 1;
            snowflakeDrift[x][0] = (rand() % 3) - 1;
        }
    }
}

void DisplaySaverScreen::drawBounceScene() {
    uint16_t scaledWidth = static_cast<uint16_t>(bounceSpriteWidth * bounceScale);
    uint16_t scaledHeight = static_cast<uint16_t>(bounceSpriteHeight * bounceScale);

    bounceSpriteX += bounceSpriteVelocityX;
    bounceSpriteY += bounceSpriteVelocityY;

    if (bounceSpriteX <= 0 || bounceSpriteX + scaledWidth >= SCREEN_WIDTH) bounceSpriteVelocityX = -bounceSpriteVelocityX;

    if (bounceSpriteY <= 0 || bounceSpriteY + scaledHeight >= SCREEN_HEIGHT) bounceSpriteVelocityY = -bounceSpriteVelocityY;

    getRenderer()->drawSprite((uint8_t *)bootLogoBottom, bounceSpriteWidth, bounceSpriteHeight, 0, bounceSpriteX, bounceSpriteY, 0, bounceScale);
}

void DisplaySaverScreen::drawPipeScene() {
    const uint8_t PIPE_WIDTH = 4;
    const uint8_t PIPE_COLOR = 1;

    uint8_t currentX = 0;
    uint8_t currentY = 0;

    while (currentY < SCREEN_HEIGHT) {
        bool connectRight = rand() % 2;
        bool connectDown = rand() % 2;

        if (connectRight && currentX + PIPE_WIDTH < SCREEN_WIDTH) {
            for (uint8_t i = 0; i < PIPE_WIDTH; ++i) {
                getRenderer()->drawPixel(currentX + i, currentY, PIPE_COLOR);
            }
        }

        if (connectDown && currentY + PIPE_WIDTH < SCREEN_HEIGHT) {
            for (uint8_t i = 0; i < PIPE_WIDTH; ++i) {
                getRenderer()->drawPixel(currentX, currentY + i, PIPE_COLOR);
            }
        }

        getRenderer()->drawPixel(currentX, currentY, PIPE_COLOR);

        currentX += PIPE_WIDTH;
        if (currentX >= SCREEN_WIDTH) {
            currentX = 0;
            currentY += PIPE_WIDTH;
        }

        for (volatile uint32_t delay = 0; delay < 10000; ++delay) {
            // Do nothing, just burn some CPU cycles
        }
    }
}

void DisplaySaverScreen::initToasters() {
    for (uint16_t i = 0; i < numberOfToasters; ++i) {
        double scale = (static_cast<double>(rand()) / RAND_MAX);
        int16_t dx = (-1 - rand() % 3);
        int16_t dy = (1 + rand() % 3);

        toasters.push_back({
            (uint8_t *)bootLogoTop,
            toasterSpriteWidth,
            toasterSpriteHeight,
            scale,
            static_cast<int16_t>(SCREEN_WIDTH - toasterSpriteWidth * scale),
            static_cast<int16_t>(rand() % (SCREEN_HEIGHT - static_cast<int16_t>(toasterSpriteHeight * scale))),
            static_cast<int16_t>(dx),
            static_cast<int16_t>(dy)
        });
    }
}

void DisplaySaverScreen::drawToasterScene() {
    for (uint16_t i = 0; i < toasters.size(); ++i) {
        ToastParams& sprite = toasters[i];

        getRenderer()->drawSprite(sprite.image, sprite.width, sprite.height, 0, sprite.x, sprite.y, 0, sprite.scale);

        sprite.x += sprite.dx;
        sprite.y += sprite.dy;

        if (sprite.x + sprite.width * sprite.scale < 0) {
            sprite.x = SCREEN_WIDTH;
            sprite.y = rand() % (SCREEN_HEIGHT - static_cast<int16_t>(sprite.height * sprite.scale));
        }

        if (sprite.y > SCREEN_HEIGHT) {
            sprite.y = 0;
        }
    }
}

void DisplaySaverScreen::initStarsScene() {
    starsEnteredTime = getMillis();
    occasionalStarX = 3 + (rand() % (SCREEN_WIDTH - 6));
    occasionalStarY = 3 + (rand() % (SCREEN_HEIGHT - 6));
    nextStarTime = getMillis() + 2000 + (rand() % 3000);

    const int16_t MOON_CX = 64, MOON_CY = 32, MOON_R2 = 30 * 30;
    const int16_t STAR_MIN_DIST2 = 12 * 12;
    const int16_t MARGIN = 2;
    const int16_t X_MAX = SCREEN_WIDTH - 1 - MARGIN;
    const int16_t Y_MAX = SCREEN_HEIGHT - 1 - MARGIN;

    for (uint8_t i = 0; i < NUM_STARS; ++i) {
        bool valid = false;
        for (uint8_t attempt = 0; attempt < 50; ++attempt) {
            int16_t x = MARGIN + (rand() % (X_MAX - MARGIN + 1));
            int16_t y = MARGIN + (rand() % (Y_MAX - MARGIN + 1));
            int16_t dx = x - MOON_CX, dy = y - MOON_CY;
            if (dx * dx + dy * dy < MOON_R2) continue;
            bool tooClose = false;
            for (uint8_t j = 0; j < i; ++j) {
                int16_t dxs = x - stars[j][0], dys = y - stars[j][1];
                if (dxs * dxs + dys * dys < STAR_MIN_DIST2) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose) { stars[i][0] = x; stars[i][1] = y; valid = true; break; }
        }
        if (!valid) { stars[i][0] = MARGIN + (rand() % (X_MAX - MARGIN + 1)); stars[i][1] = MARGIN + (rand() % (Y_MAX - MARGIN + 1)); }
    }
}

void DisplaySaverScreen::drawStarsScene() {
    uint32_t elapsed = getMillis() - starsEnteredTime;

    if (elapsed <= 2000) {
        for (uint8_t i = 0; i < NUM_STARS; ++i) {
            uint8_t starSize = rand() % 3;
            int16_t cx = stars[i][0];
            int16_t cy = stars[i][1];
            getRenderer()->drawLine(cx - starSize, cy, cx + starSize, cy, 1, 0);
            getRenderer()->drawLine(cx, cy - starSize, cx, cy + starSize, 1, 0);
        }

        getRenderer()->drawEllipse(64, 32, 28, 28, 1, 1);
        getRenderer()->drawEllipse(70, 26, 25, 25, 0, 1);
    } else {
        const uint32_t GROW_MS = 200;
        const uint32_t SHRINK_MS = 200;
        const uint32_t ANIM_MS = GROW_MS + SHRINK_MS;

        uint32_t now = getMillis();
        if (now >= nextStarTime) {
            uint32_t animPos = now - nextStarTime;
            if (animPos < ANIM_MS) {
                uint8_t starSize;
                if (animPos < GROW_MS)
                    starSize = (animPos * 3) / GROW_MS;
                else
                    starSize = 3 - ((animPos - GROW_MS) * 3) / SHRINK_MS;
                getRenderer()->drawLine(occasionalStarX - starSize, occasionalStarY, occasionalStarX + starSize, occasionalStarY, 1, 0);
                getRenderer()->drawLine(occasionalStarX, occasionalStarY - starSize, occasionalStarX, occasionalStarY + starSize, 1, 0);
            } else {
                occasionalStarX = 3 + (rand() % (SCREEN_WIDTH - 6));
                occasionalStarY = 3 + (rand() % (SCREEN_HEIGHT - 6));
                nextStarTime = now + 2000 + (rand() % 3000);
            }
        }
    }
}
