#include "RemapScreen.h"

static const char* actionNames[] = {
	"UP", "DN", "LT", "RT",
	"B1", "B2", "B3", "B4",
	"L1", "R1", "L2", "R2",
	"S1", "S2", "A1", "A2",
	"L3", "R3", "FN",
	"DDIU", "DDID", "DDIL", "DDIR",
	"A3", "A4",
	"E1", "E2", "E3", "E4", "E5",
	"E6", "E7", "E8", "E9", "E10", "E11", "E12",
	"TRB", "MAC", "M1", "M2", "M3", "M4", "M5", "M6",
	"REV",
	"SDP", "SLS", "SRS",
	"SUP", "SN", "S2W", "S1W", "SBP",
	"FOC",
	"4/8W",
	"DUP", "DDN", "DLT", "DRT",
	"LS-X", "LS+X", "LS-Y", "LS+Y",
	"RS-X", "RS+X", "RS-Y", "RS+Y",
	"MODL", "MODH",
};

static const GpioAction actionValues[] = {
	GpioAction::BUTTON_PRESS_UP,
	GpioAction::BUTTON_PRESS_DOWN,
	GpioAction::BUTTON_PRESS_LEFT,
	GpioAction::BUTTON_PRESS_RIGHT,
	GpioAction::BUTTON_PRESS_B1,
	GpioAction::BUTTON_PRESS_B2,
	GpioAction::BUTTON_PRESS_B3,
	GpioAction::BUTTON_PRESS_B4,
	GpioAction::BUTTON_PRESS_L1,
	GpioAction::BUTTON_PRESS_R1,
	GpioAction::BUTTON_PRESS_L2,
	GpioAction::BUTTON_PRESS_R2,
	GpioAction::BUTTON_PRESS_S1,
	GpioAction::BUTTON_PRESS_S2,
	GpioAction::BUTTON_PRESS_A1,
	GpioAction::BUTTON_PRESS_A2,
	GpioAction::BUTTON_PRESS_L3,
	GpioAction::BUTTON_PRESS_R3,
	GpioAction::BUTTON_PRESS_FN,
	GpioAction::BUTTON_PRESS_DDI_UP,
	GpioAction::BUTTON_PRESS_DDI_DOWN,
	GpioAction::BUTTON_PRESS_DDI_LEFT,
	GpioAction::BUTTON_PRESS_DDI_RIGHT,
	GpioAction::BUTTON_PRESS_A3,
	GpioAction::BUTTON_PRESS_A4,
	GpioAction::BUTTON_PRESS_E1,
	GpioAction::BUTTON_PRESS_E2,
	GpioAction::BUTTON_PRESS_E3,
	GpioAction::BUTTON_PRESS_E4,
	GpioAction::BUTTON_PRESS_E5,
	GpioAction::BUTTON_PRESS_E6,
	GpioAction::BUTTON_PRESS_E7,
	GpioAction::BUTTON_PRESS_E8,
	GpioAction::BUTTON_PRESS_E9,
	GpioAction::BUTTON_PRESS_E10,
	GpioAction::BUTTON_PRESS_E11,
	GpioAction::BUTTON_PRESS_E12,
	GpioAction::BUTTON_PRESS_TURBO,
	GpioAction::BUTTON_PRESS_MACRO,
	GpioAction::BUTTON_PRESS_MACRO_1,
	GpioAction::BUTTON_PRESS_MACRO_2,
	GpioAction::BUTTON_PRESS_MACRO_3,
	GpioAction::BUTTON_PRESS_MACRO_4,
	GpioAction::BUTTON_PRESS_MACRO_5,
	GpioAction::BUTTON_PRESS_MACRO_6,
	GpioAction::BUTTON_PRESS_INPUT_REVERSE,
	GpioAction::SUSTAIN_DP_MODE_DP,
	GpioAction::SUSTAIN_DP_MODE_LS,
	GpioAction::SUSTAIN_DP_MODE_RS,
	GpioAction::SUSTAIN_SOCD_MODE_UP_PRIO,
	GpioAction::SUSTAIN_SOCD_MODE_NEUTRAL,
	GpioAction::SUSTAIN_SOCD_MODE_SECOND_WIN,
	GpioAction::SUSTAIN_SOCD_MODE_FIRST_WIN,
	GpioAction::SUSTAIN_SOCD_MODE_BYPASS,
	GpioAction::SUSTAIN_FOCUS_MODE,
	GpioAction::SUSTAIN_4_8_WAY_MODE,
	GpioAction::DIGITAL_DIRECTION_UP,
	GpioAction::DIGITAL_DIRECTION_DOWN,
	GpioAction::DIGITAL_DIRECTION_LEFT,
	GpioAction::DIGITAL_DIRECTION_RIGHT,
	GpioAction::ANALOG_DIRECTION_LS_X_NEG,
	GpioAction::ANALOG_DIRECTION_LS_X_POS,
	GpioAction::ANALOG_DIRECTION_LS_Y_NEG,
	GpioAction::ANALOG_DIRECTION_LS_Y_POS,
	GpioAction::ANALOG_DIRECTION_RS_X_NEG,
	GpioAction::ANALOG_DIRECTION_RS_X_POS,
	GpioAction::ANALOG_DIRECTION_RS_Y_NEG,
	GpioAction::ANALOG_DIRECTION_RS_Y_POS,
	GpioAction::ANALOG_DIRECTION_MOD_LOW,
	GpioAction::ANALOG_DIRECTION_MOD_HIGH,
};

static const uint8_t actionCount = sizeof(actionValues) / sizeof(actionValues[0]);

void RemapScreen::init() {
	getRenderer()->clearScreen();
	mode = REMAP_LAYOUT;
	cursorIndex = 0;
	hasChanges = false;
	isPressed = false;

	// Viewport with vertical compression matching main ButtonLayoutScreen
	uint16_t screenW = getRenderer()->getDriver()->getMetrics()->width;
	setViewport(8, 0, 56, screenW);

	// Collect pin button elements (no GPButton child widgets — we draw manually)
	layoutElements.clear();
	auto layoutA = LayoutManager::getInstance().getLayoutA();
	auto layoutB = LayoutManager::getInstance().getLayoutB();
	for (auto& elem : layoutA) {
		if (elem.elementType == GP_ELEMENT_PIN_BUTTON)
			layoutElements.push_back(elem);
	}
	for (auto& elem : layoutB) {
		if (elem.elementType == GP_ELEMENT_PIN_BUTTON)
			layoutElements.push_back(elem);
	}

	// Build action selection menu
	buildActionMenu();

	gpMenu = new GPMenu();
	gpMenu->setRenderer(getRenderer());
	gpMenu->setPosition(8, 16);
	gpMenu->setStrokeColor(1);
	gpMenu->setFillColor(1);
	gpMenu->setMenuSize(18, 4);
	gpMenu->setViewport(this->getViewport());
	gpMenu->setShape(GPShape_Type::GP_SHAPE_SQUARE);
	gpMenu->setMenuData(&actionMenu);
	gpMenu->setMenuTitle("SELECT ACTION");
	gpMenu->setVisibility(false);
	addElement(gpMenu);

	// Build navigation masks
	GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();
	for (Pin_t pin = 0; pin < (Pin_t)NUM_BANK0_GPIOS; pin++) {
		switch (pinMappings[pin].action) {
			case GpioAction::MENU_NAVIGATION_UP:		navUpPinMask |= 1 << pin; break;
			case GpioAction::MENU_NAVIGATION_DOWN:		navDownPinMask |= 1 << pin; break;
			case GpioAction::MENU_NAVIGATION_LEFT:		navLeftPinMask |= 1 << pin; break;
			case GpioAction::MENU_NAVIGATION_RIGHT:		navRightPinMask |= 1 << pin; break;
			case GpioAction::MENU_NAVIGATION_SELECT:	navB1PinMask |= 1 << pin; break;
			case GpioAction::MENU_NAVIGATION_BACK:		navBackPinMask |= 1 << pin; break;
			case GpioAction::BUTTON_PRESS_B1:			navB1PinMask |= 1 << pin; break;
			case GpioAction::BUTTON_PRESS_B2:			navB2PinMask |= 1 << pin; break;
			case GpioAction::BUTTON_PRESS_UP:			navUpPinMask |= 1 << pin; break;
			case GpioAction::BUTTON_PRESS_DOWN:			navDownPinMask |= 1 << pin; break;
			case GpioAction::BUTTON_PRESS_LEFT:			navLeftPinMask |= 1 << pin; break;
			case GpioAction::BUTTON_PRESS_RIGHT:		navRightPinMask |= 1 << pin; break;
			default: break;
		}
	}

	prevValues = Storage::getInstance().GetGamepad()->debouncedGpio;
}

void RemapScreen::shutdown() {
	clearElements();
	if (hasChanges) {
		EventManager::getInstance().triggerEvent(new GPStorageSaveEvent(true, false));
	}
}

void RemapScreen::buildActionMenu() {
	actionMenu.clear();
	for (uint8_t i = 0; i < actionCount; i++) {
		MenuEntry entry;
		entry.label = actionNames[i];
		entry.icon = nullptr;
		entry.submenu = nullptr;
		entry.currentValue = [this]() -> int32_t {
			if (this->cursorIndex < this->layoutElements.size()) {
				uint8_t pin = this->layoutElements[this->cursorIndex].parameters.value;
				return (int32_t)Storage::getInstance().getProfilePinMappings()[pin].action;
			}
			return (int32_t)GpioAction::NONE;
		};
		entry.action = [this, i]() {
			this->assignAction(actionValues[i]);
		};
		entry.optionValue = (int32_t)actionValues[i];
		actionMenu.push_back(entry);
	}
}

void RemapScreen::assignAction(GpioAction action) {
	if (cursorIndex >= layoutElements.size()) return;

	uint8_t pin = layoutElements[cursorIndex].parameters.value;
	GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();
	pinMappings[pin].action = action;
	pinMappings[pin].customButtonMask = 0;
	pinMappings[pin].customDpadMask = 0;
	hasChanges = true;
}

int8_t RemapScreen::findNearestPin(int8_t dirX, int8_t dirY) {
	if (layoutElements.size() <= 1) return -1;

	GPButtonLayout& cur = layoutElements[cursorIndex];
	int16_t cx = cur.parameters.x1 + cur.parameters.x2 / 2;
	int16_t cy = cur.parameters.y1 + cur.parameters.y2 / 2;

	int8_t bestIdx = -1;
	int32_t bestScore = INT32_MAX;

	for (size_t i = 0; i < layoutElements.size(); i++) {
		if (i == cursorIndex) continue;
		GPButtonLayout& e = layoutElements[i];
		int16_t ex = e.parameters.x1 + e.parameters.x2 / 2;
		int16_t ey = e.parameters.y1 + e.parameters.y2 / 2;
		int16_t dx = ex - cx;
		int16_t dy = ey - cy;

		if ((dirX > 0 && dx <= 0) || (dirX < 0 && dx >= 0)) continue;
		if ((dirY > 0 && dy <= 0) || (dirY < 0 && dy >= 0)) continue;

		int32_t primaryDist = (dirX != 0) ? abs(dx) : abs(dy);
		int32_t perpDist = (dirX != 0) ? abs(dy) : abs(dx);
		int32_t score = perpDist * 256 + primaryDist;

		if (score < bestScore) {
			bestScore = score;
			bestIdx = i;
		}
	}
	return bestIdx;
}

int8_t RemapScreen::update() {
	Mask_t values = Storage::getInstance().GetGamepad()->debouncedGpio;
	bool actionFired = false;

	if (mode == REMAP_ACTION_SELECT) {
		actionFired = updateActionNavigation(values);
	} else {
		if (!isPressed && prevValues != values) {
			if (layoutElements.size() > 0) {
				int8_t newIdx = -1;

				if (values & navUpPinMask) {
					newIdx = findNearestPin(0, -1);
				} else if (values & navDownPinMask) {
					newIdx = findNearestPin(0, 1);
				} else if (values & navLeftPinMask) {
					newIdx = findNearestPin(-1, 0);
				} else if (values & navRightPinMask) {
					newIdx = findNearestPin(1, 0);
				} else if (values & navB1PinMask) {
					mode = REMAP_ACTION_SELECT;
					gpMenu->setVisibility(true);
					gpMenu->setIndex(0);
					actionFired = true;
				} else if (values & navB2PinMask) {
					return DisplayMode::MAIN_MENU;
				} else if (values & navBackPinMask) {
					return DisplayMode::MAIN_MENU;
				}

				if (newIdx >= 0 && (size_t)newIdx < layoutElements.size()) {
					cursorIndex = (size_t)newIdx;
					actionFired = true;
				}
			} else {
				if (values & (navB2PinMask | navBackPinMask)) {
					return DisplayMode::MAIN_MENU;
				}
			}
		}
	}

	isPressed = actionFired;
	prevValues = values;

	return -1;
}

bool RemapScreen::updateActionNavigation(Mask_t values) {
	if (!isPressed && prevValues != values) {
		uint16_t menuSize = gpMenu->getDataSize();
		uint16_t newIndex = gpMenu->getIndex();

		if (values & navUpPinMask) {
			if (newIndex > 0) {
				newIndex--;
			} else {
				newIndex = menuSize - 1;
			}
			gpMenu->setIndex(newIndex);
			return true;
		} else if (values & navDownPinMask) {
			if (newIndex < menuSize - 1) {
				newIndex++;
			} else {
				newIndex = 0;
			}
			gpMenu->setIndex(newIndex);
			return true;
		} else if (values & navB1PinMask) {
			actionMenu.at(gpMenu->getIndex()).action();
			mode = REMAP_LAYOUT;
			gpMenu->setVisibility(false);
			return true;
		} else if (values & navB2PinMask) {
			mode = REMAP_LAYOUT;
			gpMenu->setVisibility(false);
			return true;
		} else if (values & navBackPinMask) {
			mode = REMAP_LAYOUT;
			gpMenu->setVisibility(false);
			return true;
		}
	}
	return false;
}

void RemapScreen::drawScreen() {
	GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();

	if (mode == REMAP_LAYOUT) {
		double scaleX = this->getScaleX();
		double scaleY = this->getScaleY();

		if ((scaleX > 0.0f) & ((scaleY == 0.0f) || (scaleY == 1.0f))) {
			scaleY = scaleX;
		} else if (((scaleX == 0.0f) || (scaleX == 1.0f)) & (scaleY > 0.0f)) {
			scaleX = scaleY;
		}

		uint16_t offsetX = ((getRenderer()->getDriver()->getMetrics()->width - (uint16_t)((double)(this->getViewport().right - this->getViewport().left) * scaleX)) / 2);
		uint16_t vpTop = this->getViewport().top;
		uint16_t vpLeft = this->getViewport().left;

		// --- Draw pin buttons with viewport scaling (matches main screen layout) ---
		for (size_t i = 0; i < layoutElements.size(); i++) {
			GPButtonLayout& elem = layoutElements[i];
			uint16_t cx = elem.parameters.x1;
			uint16_t cy = elem.parameters.y1;

			if (scaleX > 0.0f) {
				cx = (uint16_t)((double)cx * scaleX + vpLeft) + offsetX;
			}
			if (scaleY > 0.0f) {
				cy = (uint16_t)((double)cy * scaleY + vpTop);
			}

			uint8_t fill = (i == cursorIndex) ? 1 : 0;

			if (elem.parameters.shape == GP_SHAPE_ELLIPSE) {
				uint16_t radius = (uint16_t)((double)elem.parameters.x2 * scaleX);
				getRenderer()->drawEllipse(cx, cy, radius, radius, 1, fill);
			} else if (elem.parameters.shape == GP_SHAPE_SQUARE) {
				uint16_t sizeX = (uint16_t)((double)elem.parameters.x2 * scaleX) + vpLeft;
				uint16_t sizeY = (uint16_t)((double)elem.parameters.y2 * scaleY) + vpTop;
				getRenderer()->drawRectangle(cx, cy, sizeX + offsetX, sizeY, 1, fill);
			}
		}

		// --- Top info bar (row 0) ---
		if (cursorIndex < layoutElements.size()) {
			uint8_t pinNum = layoutElements[cursorIndex].parameters.value;
			GpioAction action = pinMappings[pinNum].action;

			const char* label = NULL;
			for (uint8_t i = 0; i < actionCount; i++) {
				if (actionValues[i] == action) {
					label = actionNames[i];
					break;
				}
			}
			if (label == NULL) {
				switch (action) {
					case GpioAction::NONE:				label = "NONE"; break;
					case GpioAction::RESERVED:			label = "RSRV"; break;
					case GpioAction::ASSIGNED_TO_ADDON:	label = "ADDON"; break;
					default:							label = "?"; break;
				}
			}

			char topBuf[22];
			snprintf(topBuf, sizeof(topBuf), "GP%02d:%s", pinNum, label);
			getRenderer()->drawText(0, 0, topBuf);
		} else {
			getRenderer()->drawText(0, 0, "No board layout");
		}

		// --- Bottom action bar (row 7) ---
		if (layoutElements.size() > 0) {
			getRenderer()->drawText(0, 7, "A:assign  B:back");
		} else {
			getRenderer()->drawText(0, 7, "B:back");
		}
	}
	// Action select mode: no manual drawing needed — GPMenu draws itself on cleared bg
}
