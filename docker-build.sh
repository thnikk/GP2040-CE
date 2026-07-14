#!/bin/sh
set -e

IMAGE="${IMAGE:-gp2040-ce-builder}"
BOARD="${BOARD:-Pico}"
BUILD_DIR="build"

# Fix root-owned files from previous container runs (if any)
docker run --rm -v "$(pwd):/build" --user 0:0 "$IMAGE" sh -c '
  chown -R 1000:1000 \
    /build/.git/modules \
    /build/lib/pico_pio_usb \
    /build/lib/tinyusb \
    /build/www \
    /build/build \
    2>/dev/null || true
  rm -rf /build/www/node_modules /build/www/build 2>/dev/null || true
' 2>/dev/null

docker run --rm -v "$(pwd):/build" "$IMAGE" \
  bash -c "cmake -B $BUILD_DIR -DCMAKE_BUILD_TYPE=Release -DGP2040_BOARDCONFIG=$BOARD && cmake --build $BUILD_DIR --parallel"
