file(GLOB_RECURSE WEB_SOURCES ${WEB_SRC_DIR}/src/*)
list(APPEND WEB_SOURCES
  ${WEB_SRC_DIR}/package.json
  ${WEB_SRC_DIR}/package-lock.json
  ${WEB_SRC_DIR}/vite.config.ts
  ${WEB_SRC_DIR}/tsconfig.json
  ${WEB_SRC_DIR}/makefsdata.js
  ${WEB_SRC_DIR}/copy-board-svg.js
  ${WEB_SRC_DIR}/index.html
  ${CMAKE_SOURCE_DIR}/configs/${GP2040_BOARDCONFIG}/board.svg
)

set(NEED_REBUILD FALSE)

if(NOT EXISTS "${OUT_FILE}")
  set(NEED_REBUILD TRUE)
else()
  file(TIMESTAMP "${OUT_FILE}" OUT_TS)
  foreach(SRC ${WEB_SOURCES})
    if(EXISTS "${SRC}")
      file(TIMESTAMP "${SRC}" SRC_TS)
      if(SRC_TS GREATER OUT_TS)
        set(NEED_REBUILD TRUE)
        break()
      endif()
    endif()
  endforeach()
endif()

if(NEED_REBUILD)
  message(STATUS "Web sources changed, rebuilding...")
  execute_process(
    COMMAND ${NPM_EXECUTABLE} ci
    WORKING_DIRECTORY ${WEB_SRC_DIR}
    RESULT_VARIABLE NPM_CI_RESULT
  )
  if(NOT NPM_CI_RESULT EQUAL "0")
    message(FATAL_ERROR "npm ci failed with ${NPM_CI_RESULT}")
  endif()

  execute_process(
    COMMAND ${CMAKE_COMMAND} -E env
      "VITE_GP2040_BOARD=${VITE_GP2040_BOARD}"
      "VITE_GP2040_BOARD_HAS_SVG=${VITE_GP2040_BOARD_HAS_SVG}"
      "GP2040_BOARDCONFIG=${GP2040_BOARDCONFIG}"
      ${NPM_EXECUTABLE} run build
    WORKING_DIRECTORY ${WEB_SRC_DIR}
    RESULT_VARIABLE NPM_BUILD_RESULT
  )
  if(NOT NPM_BUILD_RESULT EQUAL "0")
    message(FATAL_ERROR "npm run build failed with ${NPM_BUILD_RESULT}")
  endif()
else()
  message(STATUS "Web sources up to date, skipping build")
endif()
