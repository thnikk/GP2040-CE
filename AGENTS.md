# GP2040-CE Agent Guide

## Build (firmware)
- **Docker only** — do not attempt direct CMake builds (no local ARM toolchain)
- Use `docker-build.py` — builds Docker image + firmware in one step
  - `python3 docker-build.py -b <Board>` — board from `configs/` dir names (default: `Pico`)
  - `-c` clean build, `-v` verbose, `-f` flash to board, `-n` nuke first, `-p <path>` flash mount
  - Boards: Pico, Fightboard-v3[-m|-b|-b-m], KB2040, WaveshareZero, Springboard, Blank
	- When testing, use `Fightboard-v3`
- Output: `build/GP2040-CE_<version>_<sha>_<Board>.uf2`

## Build (web configurator)
- Dev: `npm run dev` from `www/` — starts Vite dev server + mock Express backend
- `npm run dev-board` — connects to real board at `VITE_DEV_BASE_URL` (default `http://192.168.7.1`)
- `npm run lint` — eslint (zero-warnings policy)
- `npm run build` — builds proto types + Vite production build + runs makefsdata
- `www/.env` controls dev board config (`VITE_GP2040_BOARD`, `VITE_GP2040_BOARD_HAS_SVG`)

## Codegen (automatic during build)
- Protobuf → C: `compile_proto.cmake` runs nanopb generator on `proto/enums.proto` and `proto/config.proto`
- Protobuf → TS: `npm run build-proto` generates `www/src_gen/enums.ts`
- Web assets → C: Vite build + `makefsdata.js` produces `lib/httpd/fsdata.c` (embedded web server content)

## Architecture
- `configs/<Board>/BoardConfig.h` — pin mappings and feature defines; `BOARD_SVG` enables SVG pin mapping in web config
- `headers/` — all headers, parallel structure to `src/`
- `src/drivers/` — console protocol drivers (XInput, PS3/4/5, Switch, DInput, etc.)
- `src/addons/` — optional features (display, turbo, RGB, analog, keyboard, etc.)
- `proto/` — nanopb protobuf schemas for config storage/serialization
- `lib/` — vendored libs (tinyusb, nanopb, ArduinoJson via FetchContent, etc.)
- `modules/` — CMake helper modules (FindNodeJS, FindNPM, web-build)
- `www/` — React + Vite + TypeScript frontend (the web configurator)

## Style conventions
- `.editorconfig`: tabs (2-wide), LF, single quotes for JS/TS
- C++: C++17, C: C11
- No test framework, no C++ linter, no typechecker for firmware
- Web: ESLint (react + TS + i18next), Prettier (`npm run format`)

