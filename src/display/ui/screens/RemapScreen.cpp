#include "RemapScreen.h"

// --- Mode-dependent name lookup table ---
struct ActionNameEntry {
	GpioAction action;
	InputMode mode;
	const char* name;
};

static const ActionNameEntry actionNameOverrides[] = {
	// Face buttons
	{ BUTTON_PRESS_B1, INPUT_MODE_XINPUT, "A" },
	{ BUTTON_PRESS_B1, INPUT_MODE_XBONE, "A" },
	{ BUTTON_PRESS_B1, INPUT_MODE_XBOXORIGINAL, "A" },
	{ BUTTON_PRESS_B1, INPUT_MODE_SWITCH, "B" },
	{ BUTTON_PRESS_B1, INPUT_MODE_PS3, "Cross" },
	{ BUTTON_PRESS_B1, INPUT_MODE_PS4, "Cross" },
	{ BUTTON_PRESS_B1, INPUT_MODE_PS5, "Cross" },
	{ BUTTON_PRESS_B1, INPUT_MODE_PSCLASSIC, "Cross" },
	{ BUTTON_PRESS_B1, INPUT_MODE_NEOGEO, "A" },
	{ BUTTON_PRESS_B1, INPUT_MODE_MDMINI, "A" },

	{ BUTTON_PRESS_B2, INPUT_MODE_XINPUT, "B" },
	{ BUTTON_PRESS_B2, INPUT_MODE_XBONE, "B" },
	{ BUTTON_PRESS_B2, INPUT_MODE_XBOXORIGINAL, "B" },
	{ BUTTON_PRESS_B2, INPUT_MODE_SWITCH, "A" },
	{ BUTTON_PRESS_B2, INPUT_MODE_PS3, "Circle" },
	{ BUTTON_PRESS_B2, INPUT_MODE_PS4, "Circle" },
	{ BUTTON_PRESS_B2, INPUT_MODE_PS5, "Circle" },
	{ BUTTON_PRESS_B2, INPUT_MODE_PSCLASSIC, "Circle" },
	{ BUTTON_PRESS_B2, INPUT_MODE_NEOGEO, "B" },
	{ BUTTON_PRESS_B2, INPUT_MODE_MDMINI, "B" },

	{ BUTTON_PRESS_B3, INPUT_MODE_XINPUT, "X" },
	{ BUTTON_PRESS_B3, INPUT_MODE_XBONE, "X" },
	{ BUTTON_PRESS_B3, INPUT_MODE_XBOXORIGINAL, "X" },
	{ BUTTON_PRESS_B3, INPUT_MODE_SWITCH, "Y" },
	{ BUTTON_PRESS_B3, INPUT_MODE_PS3, "Square" },
	{ BUTTON_PRESS_B3, INPUT_MODE_PS4, "Square" },
	{ BUTTON_PRESS_B3, INPUT_MODE_PS5, "Square" },
	{ BUTTON_PRESS_B3, INPUT_MODE_PSCLASSIC, "Square" },
	{ BUTTON_PRESS_B3, INPUT_MODE_NEOGEO, "C" },
	{ BUTTON_PRESS_B3, INPUT_MODE_MDMINI, "C" },

	{ BUTTON_PRESS_B4, INPUT_MODE_XINPUT, "Y" },
	{ BUTTON_PRESS_B4, INPUT_MODE_XBONE, "Y" },
	{ BUTTON_PRESS_B4, INPUT_MODE_XBOXORIGINAL, "Y" },
	{ BUTTON_PRESS_B4, INPUT_MODE_SWITCH, "X" },
	{ BUTTON_PRESS_B4, INPUT_MODE_PS3, "Triangle" },
	{ BUTTON_PRESS_B4, INPUT_MODE_PS4, "Triangle" },
	{ BUTTON_PRESS_B4, INPUT_MODE_PS5, "Triangle" },
	{ BUTTON_PRESS_B4, INPUT_MODE_PSCLASSIC, "Triangle" },
	{ BUTTON_PRESS_B4, INPUT_MODE_NEOGEO, "D" },
	{ BUTTON_PRESS_B4, INPUT_MODE_MDMINI, "Start" },

	// Shoulders
	{ BUTTON_PRESS_L1, INPUT_MODE_XINPUT, "LB" },
	{ BUTTON_PRESS_L1, INPUT_MODE_XBONE, "LB" },
	{ BUTTON_PRESS_L1, INPUT_MODE_XBOXORIGINAL, "LB" },
	{ BUTTON_PRESS_L1, INPUT_MODE_SWITCH, "L" },

	{ BUTTON_PRESS_R1, INPUT_MODE_XINPUT, "RB" },
	{ BUTTON_PRESS_R1, INPUT_MODE_XBONE, "RB" },
	{ BUTTON_PRESS_R1, INPUT_MODE_XBOXORIGINAL, "RB" },
	{ BUTTON_PRESS_R1, INPUT_MODE_SWITCH, "R" },

	{ BUTTON_PRESS_L2, INPUT_MODE_XINPUT, "LT" },
	{ BUTTON_PRESS_L2, INPUT_MODE_XBONE, "LT" },
	{ BUTTON_PRESS_L2, INPUT_MODE_XBOXORIGINAL, "LT" },
	{ BUTTON_PRESS_L2, INPUT_MODE_SWITCH, "ZL" },

	{ BUTTON_PRESS_R2, INPUT_MODE_XINPUT, "RT" },
	{ BUTTON_PRESS_R2, INPUT_MODE_XBONE, "RT" },
	{ BUTTON_PRESS_R2, INPUT_MODE_XBOXORIGINAL, "RT" },
	{ BUTTON_PRESS_R2, INPUT_MODE_SWITCH, "ZR" },

	// Stick clicks
	{ BUTTON_PRESS_L3, INPUT_MODE_SWITCH, "LS" },
	{ BUTTON_PRESS_R3, INPUT_MODE_SWITCH, "RS" },

	// System
	{ BUTTON_PRESS_S1, INPUT_MODE_XINPUT, "Back" },
	{ BUTTON_PRESS_S1, INPUT_MODE_XBONE, "Back" },
	{ BUTTON_PRESS_S1, INPUT_MODE_XBOXORIGINAL, "Back" },
	{ BUTTON_PRESS_S1, INPUT_MODE_SWITCH, "-" },
	{ BUTTON_PRESS_S1, INPUT_MODE_PS3, "Select" },
	{ BUTTON_PRESS_S1, INPUT_MODE_PS4, "Select" },
	{ BUTTON_PRESS_S1, INPUT_MODE_PS5, "Select" },
	{ BUTTON_PRESS_S1, INPUT_MODE_PSCLASSIC, "Select" },
	{ BUTTON_PRESS_S1, INPUT_MODE_NEOGEO, "Select" },
	{ BUTTON_PRESS_S1, INPUT_MODE_MDMINI, "Mode" },

	{ BUTTON_PRESS_S2, INPUT_MODE_XINPUT, "Start" },
	{ BUTTON_PRESS_S2, INPUT_MODE_XBONE, "Start" },
	{ BUTTON_PRESS_S2, INPUT_MODE_XBOXORIGINAL, "Start" },
	{ BUTTON_PRESS_S2, INPUT_MODE_SWITCH, "+" },

	// Aux
	{ BUTTON_PRESS_A1, INPUT_MODE_XINPUT, "Guide" },
	{ BUTTON_PRESS_A1, INPUT_MODE_XBONE, "Guide" },
	{ BUTTON_PRESS_A1, INPUT_MODE_XBOXORIGINAL, "Guide" },
	{ BUTTON_PRESS_A1, INPUT_MODE_SWITCH, "Home" },
	{ BUTTON_PRESS_A1, INPUT_MODE_PS3, "PS" },
	{ BUTTON_PRESS_A1, INPUT_MODE_PS4, "PS" },
	{ BUTTON_PRESS_A1, INPUT_MODE_PS5, "PS" },
	{ BUTTON_PRESS_A1, INPUT_MODE_PSCLASSIC, "PS" },
	{ BUTTON_PRESS_A1, INPUT_MODE_NEOGEO, "Select" },
	{ BUTTON_PRESS_A1, INPUT_MODE_MDMINI, "Select" },

	{ BUTTON_PRESS_A2, INPUT_MODE_SWITCH, "Capture" },
	{ BUTTON_PRESS_A2, INPUT_MODE_PS4, "Touchpad" },
};

static const char* lookupOverride(GpioAction action, InputMode mode) {
	for (auto& entry : actionNameOverrides)
		if (entry.action == action && entry.mode == mode)
			return entry.name;
	return nullptr;
}

static const char* getActionName(GpioAction action, InputMode mode) {
	const char* name = lookupOverride(action, mode);
	if (name) return name;

	switch (action) {
		// GP2040 default names (fallback when no mode override matches)
		case GpioAction::BUTTON_PRESS_B1:     return "B1";
		case GpioAction::BUTTON_PRESS_B2:     return "B2";
		case GpioAction::BUTTON_PRESS_B3:     return "B3";
		case GpioAction::BUTTON_PRESS_B4:     return "B4";
		case GpioAction::BUTTON_PRESS_L1:     return "L1";
		case GpioAction::BUTTON_PRESS_R1:     return "R1";
		case GpioAction::BUTTON_PRESS_L2:     return "L2";
		case GpioAction::BUTTON_PRESS_R2:     return "R2";
		case GpioAction::BUTTON_PRESS_S1:     return "S1";
		case GpioAction::BUTTON_PRESS_S2:     return "S2";
		case GpioAction::BUTTON_PRESS_A1:     return "A1";
		case GpioAction::BUTTON_PRESS_A2:     return "A2";
		case GpioAction::BUTTON_PRESS_L3:     return "L3";
		case GpioAction::BUTTON_PRESS_R3:     return "R3";
		// Readable universal names
		case GpioAction::BUTTON_PRESS_UP:     return "Up";
		case GpioAction::BUTTON_PRESS_DOWN:   return "Down";
		case GpioAction::BUTTON_PRESS_LEFT:   return "Left";
		case GpioAction::BUTTON_PRESS_RIGHT:  return "Right";
		case GpioAction::BUTTON_PRESS_FN:     return "Fn";
		case GpioAction::BUTTON_PRESS_DDI_UP:   return "DDI Up";
		case GpioAction::BUTTON_PRESS_DDI_DOWN: return "DDI Down";
		case GpioAction::BUTTON_PRESS_DDI_LEFT: return "DDI Left";
		case GpioAction::BUTTON_PRESS_DDI_RIGHT:return "DDI Right";
		case GpioAction::BUTTON_PRESS_A3:     return "Aux 3";
		case GpioAction::BUTTON_PRESS_A4:     return "Aux 4";
		case GpioAction::BUTTON_PRESS_E1:     return "Ext 1";
		case GpioAction::BUTTON_PRESS_E2:     return "Ext 2";
		case GpioAction::BUTTON_PRESS_E3:     return "Ext 3";
		case GpioAction::BUTTON_PRESS_E4:     return "Ext 4";
		case GpioAction::BUTTON_PRESS_E5:     return "Ext 5";
		case GpioAction::BUTTON_PRESS_E6:     return "Ext 6";
		case GpioAction::BUTTON_PRESS_E7:     return "Ext 7";
		case GpioAction::BUTTON_PRESS_E8:     return "Ext 8";
		case GpioAction::BUTTON_PRESS_E9:     return "Ext 9";
		case GpioAction::BUTTON_PRESS_E10:    return "Ext 10";
		case GpioAction::BUTTON_PRESS_E11:    return "Ext 11";
		case GpioAction::BUTTON_PRESS_E12:    return "Ext 12";
		case GpioAction::BUTTON_PRESS_TURBO:  return "Turbo";
		case GpioAction::BUTTON_PRESS_MACRO:  return "Macro";
		case GpioAction::BUTTON_PRESS_MACRO_1: return "Macro 1";
		case GpioAction::BUTTON_PRESS_MACRO_2: return "Macro 2";
		case GpioAction::BUTTON_PRESS_MACRO_3: return "Macro 3";
		case GpioAction::BUTTON_PRESS_MACRO_4: return "Macro 4";
		case GpioAction::BUTTON_PRESS_MACRO_5: return "Macro 5";
		case GpioAction::BUTTON_PRESS_MACRO_6: return "Macro 6";
		case GpioAction::BUTTON_PRESS_INPUT_REVERSE: return "Reverse";
		case GpioAction::SUSTAIN_DP_MODE_DP:  return "D-Pad";
		case GpioAction::SUSTAIN_DP_MODE_LS:  return "L-Stick";
		case GpioAction::SUSTAIN_DP_MODE_RS:  return "R-Stick";
		case GpioAction::SUSTAIN_SOCD_MODE_UP_PRIO:    return "Up Prio";
		case GpioAction::SUSTAIN_SOCD_MODE_NEUTRAL:    return "Neutral";
		case GpioAction::SUSTAIN_SOCD_MODE_SECOND_WIN: return "Last Win";
		case GpioAction::SUSTAIN_SOCD_MODE_FIRST_WIN:  return "First Win";
		case GpioAction::SUSTAIN_SOCD_MODE_BYPASS:     return "Bypass";
		case GpioAction::SUSTAIN_FOCUS_MODE:  return "Focus";
		case GpioAction::SUSTAIN_4_8_WAY_MODE: return "4/8 Way";
		case GpioAction::DIGITAL_DIRECTION_UP:    return "D-Up";
		case GpioAction::DIGITAL_DIRECTION_DOWN:  return "D-Dn";
		case GpioAction::DIGITAL_DIRECTION_LEFT:  return "D-Lt";
		case GpioAction::DIGITAL_DIRECTION_RIGHT: return "D-Rt";
		case GpioAction::ANALOG_DIRECTION_LS_X_NEG: return "L-Stk L";
		case GpioAction::ANALOG_DIRECTION_LS_X_POS: return "L-Stk R";
		case GpioAction::ANALOG_DIRECTION_LS_Y_NEG: return "L-Stk U";
		case GpioAction::ANALOG_DIRECTION_LS_Y_POS: return "L-Stk D";
		case GpioAction::ANALOG_DIRECTION_RS_X_NEG: return "R-Stk L";
		case GpioAction::ANALOG_DIRECTION_RS_X_POS: return "R-Stk R";
		case GpioAction::ANALOG_DIRECTION_RS_Y_NEG: return "R-Stk U";
		case GpioAction::ANALOG_DIRECTION_RS_Y_POS: return "R-Stk D";
		case GpioAction::ANALOG_DIRECTION_MOD_LOW:  return "Mod Low";
		case GpioAction::ANALOG_DIRECTION_MOD_HIGH: return "Mod High";
		case GpioAction::NONE:                return "NONE";
		case GpioAction::RESERVED:            return "RSRV";
		case GpioAction::ASSIGNED_TO_ADDON:   return "ADDON";
		default:                              return "?";
	}
}

// --- Action category arrays (replaces flat actionValues[]) ---
static const GpioAction normalActions[] = {
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
	GpioAction::BUTTON_PRESS_L3,
	GpioAction::BUTTON_PRESS_R3,
	GpioAction::BUTTON_PRESS_A1,
	GpioAction::BUTTON_PRESS_A2,
};

static const GpioAction extActions[] = {
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
};

static const GpioAction macroActions[] = {
	GpioAction::BUTTON_PRESS_MACRO,
	GpioAction::BUTTON_PRESS_MACRO_1,
	GpioAction::BUTTON_PRESS_MACRO_2,
	GpioAction::BUTTON_PRESS_MACRO_3,
	GpioAction::BUTTON_PRESS_MACRO_4,
	GpioAction::BUTTON_PRESS_MACRO_5,
	GpioAction::BUTTON_PRESS_MACRO_6,
};

static const GpioAction otherActions[] = {
	GpioAction::BUTTON_PRESS_FN,
	GpioAction::BUTTON_PRESS_TURBO,
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

struct ActionCategory {
	const char* name;
	const GpioAction* entries;
	uint8_t count;
};

static const ActionCategory actionCategories[] = {
	{ "Buttons",  normalActions, sizeof(normalActions)/sizeof(normalActions[0]) },
	{ "Extended", extActions,    sizeof(extActions)/sizeof(extActions[0]) },
	{ "Macro",    macroActions,  sizeof(macroActions)/sizeof(macroActions[0]) },
	{ "Other",    otherActions,  sizeof(otherActions)/sizeof(otherActions[0]) },
};

static const uint8_t actionCategoryCount = sizeof(actionCategories)/sizeof(actionCategories[0]);

struct KeyEntry {
	uint8_t code;
	const char* name;
};

struct KeyCategory {
	const char* name;
	const KeyEntry* entries;
	uint8_t count;
};

static const KeyEntry lettersKeys[] = {
	{ 0x04, "A" }, { 0x05, "B" }, { 0x06, "C" }, { 0x07, "D" },
	{ 0x08, "E" }, { 0x09, "F" }, { 0x0A, "G" }, { 0x0B, "H" },
	{ 0x0C, "I" }, { 0x0D, "J" }, { 0x0E, "K" }, { 0x0F, "L" },
	{ 0x10, "M" }, { 0x11, "N" }, { 0x12, "O" }, { 0x13, "P" },
	{ 0x14, "Q" }, { 0x15, "R" }, { 0x16, "S" }, { 0x17, "T" },
	{ 0x18, "U" }, { 0x19, "V" }, { 0x1A, "W" }, { 0x1B, "X" },
	{ 0x1C, "Y" }, { 0x1D, "Z" },
};

static const KeyEntry numbersKeys[] = {
	{ 0x1E, "1" }, { 0x1F, "2" }, { 0x20, "3" }, { 0x21, "4" },
	{ 0x22, "5" }, { 0x23, "6" }, { 0x24, "7" }, { 0x25, "8" },
	{ 0x26, "9" }, { 0x27, "0" },
};

static const KeyEntry punctKeys[] = {
	{ 0x2D, "-" },   { 0x2E, "=" },    { 0x2F, "[" },  { 0x30, "]" },
	{ 0x31, "\\" },  { 0x33, ";" },    { 0x34, "'" },  { 0x35, "`" },
	{ 0x36, "," },   { 0x37, "." },    { 0x38, "/" },
};

static const KeyEntry navKeys[] = {
	{ 0x52, "Up" },    { 0x51, "Down" },  { 0x50, "Left" },
	{ 0x4F, "Right" }, { 0x4A, "Home" },  { 0x4D, "End" },
	{ 0x4B, "PgUp" },  { 0x4E, "PgDn" },  { 0x49, "Ins" },
	{ 0x4C, "Del" },
};

static const KeyEntry funcKeys[] = {
	{ 0x3A, "F1" },  { 0x3B, "F2" },  { 0x3C, "F3" },  { 0x3D, "F4" },
	{ 0x3E, "F5" },  { 0x3F, "F6" },  { 0x40, "F7" },  { 0x41, "F8" },
	{ 0x42, "F9" },  { 0x43, "F10" }, { 0x44, "F11" }, { 0x45, "F12" },
	{ 0x68, "F13" }, { 0x69, "F14" }, { 0x6A, "F15" }, { 0x6B, "F16" },
	{ 0x6C, "F17" }, { 0x6D, "F18" }, { 0x6E, "F19" }, { 0x6F, "F20" },
	{ 0x70, "F21" }, { 0x71, "F22" }, { 0x72, "F23" }, { 0x73, "F24" },
};

static const KeyEntry numpadKeys[] = {
	{ 0x53, "NumLk" }, { 0x54, "N/" },  { 0x55, "N*" },
	{ 0x56, "N-" },    { 0x57, "N+" },  { 0x58, "NEn" },
	{ 0x59, "N1" },    { 0x5A, "N2" },  { 0x5B, "N3" },
	{ 0x5C, "N4" },    { 0x5D, "N5" },  { 0x5E, "N6" },
	{ 0x5F, "N7" },    { 0x60, "N8" },  { 0x61, "N9" },
	{ 0x62, "N0" },    { 0x63, "N." },
};

static const KeyEntry sysKeys[] = {
	{ 0x29, "Esc" },    { 0x2B, "Tab" },   { 0x39, "Caps" },
	{ 0x28, "Enter" },  { 0x2A, "Bksp" },  { 0x2C, "Space" },
	{ 0x46, "PrtSc" },  { 0x47, "ScrlLk" },{ 0x48, "Pause" },
	{ 0x65, "App" },    { 0x66, "Power" },
};

static const KeyEntry mediaKeys[] = {
	{ 0xE8, "NextTrk" }, { 0xE9, "PrevTrk" }, { 0xF0, "Stop" },
	{ 0xF1, "Play/P" },  { 0xF2, "Mute" },    { 0xF3, "Vol+" },
	{ 0xF4, "Vol-" },
};

static const KeyCategory keyCategories[] = {
	{ "Letters", lettersKeys, sizeof(lettersKeys)/sizeof(lettersKeys[0]) },
	{ "Numbers", numbersKeys, sizeof(numbersKeys)/sizeof(numbersKeys[0]) },
	{ "Punct",   punctKeys,   sizeof(punctKeys)/sizeof(punctKeys[0]) },
	{ "Navigate",navKeys,     sizeof(navKeys)/sizeof(navKeys[0]) },
	{ "Function",funcKeys,    sizeof(funcKeys)/sizeof(funcKeys[0]) },
	{ "Numpad",  numpadKeys,  sizeof(numpadKeys)/sizeof(numpadKeys[0]) },
	{ "System",  sysKeys,     sizeof(sysKeys)/sizeof(sysKeys[0]) },
	{ "Media",   mediaKeys,   sizeof(mediaKeys)/sizeof(mediaKeys[0]) },
};

static const uint8_t kbdCategoryCount = sizeof(keyCategories)/sizeof(keyCategories[0]);
static const uint8_t kbdSelectCategoryCount = 7;

struct ModifierEntry {
	uint8_t mask;
	const char* name;
};

static const ModifierEntry modifierPresets[] = {
	{ 0x00, "None" },
	{ 0x02, "Shift" },
	{ 0x01, "Ctrl" },
	{ 0x04, "Alt" },
	{ 0x08, "Win" },
	{ 0x03, "S+C" },
	{ 0x06, "S+A" },
	{ 0x05, "C+A" },
	{ 0x0A, "W+S" },
	{ 0x09, "W+C" },
	{ 0x0C, "W+A" },
};

static const uint8_t modifierCount = sizeof(modifierPresets)/sizeof(modifierPresets[0]);

static const char* getKeyName(uint8_t code) {
	if (code == 0) return "None";
	for (uint8_t c = 0; c < kbdCategoryCount; c++) {
		for (uint8_t i = 0; i < keyCategories[c].count; i++) {
			if (keyCategories[c].entries[i].code == code)
				return keyCategories[c].entries[i].name;
		}
	}
	return "Key";
}

static const char* getModifierName(uint8_t mask) {
	for (uint8_t i = 0; i < modifierCount; i++) {
		if (modifierPresets[i].mask == mask)
			return modifierPresets[i].name;
	}
	return "Mod";
}

void RemapScreen::init() {
	getRenderer()->clearScreen();
	mode = REMAP_LAYOUT;
	cursorIndex = 0;
	hasChanges = false;
	isPressed = false;

	kbdManageIndex = 0;
	kbdPendingKeycode = 0;
	kbdCategory = 0;
	kbdCategoryIndex = 0;
	kbdModifierIndex = 0;

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

	actionCategory = 0;
	actionCategoryIndex = 0;

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
			default: break;
		}
	}

	// Compile-time menu nav pins (not affected by runtime remapping)
#ifdef PIN_MENU_UP
	navUpPinMask |= 1 << PIN_MENU_UP;
#endif
#ifdef PIN_MENU_DOWN
	navDownPinMask |= 1 << PIN_MENU_DOWN;
#endif
#ifdef PIN_MENU_LEFT
	navLeftPinMask |= 1 << PIN_MENU_LEFT;
#endif
#ifdef PIN_MENU_RIGHT
	navRightPinMask |= 1 << PIN_MENU_RIGHT;
#endif
#ifdef PIN_MENU_SELECT
	navB1PinMask |= 1 << PIN_MENU_SELECT;
#endif
#ifdef PIN_MENU_BACK
	navB2PinMask |= 1 << PIN_MENU_BACK;
#endif

	prevValues = Storage::getInstance().GetGamepad()->debouncedGpio;
}

void RemapScreen::shutdown() {
	if (hasChanges) {
		EventManager::getInstance().triggerEvent(new GPStorageSaveEvent(true, false));
		Storage::getInstance().GetGamepad()->userRequestedReinit = true;
	}
	clearElements();
}

void RemapScreen::enterActionSelect() {
	mode = REMAP_ACTION_SELECT;
	actionCategory = 0;
	actionCategoryIndex = 0;

	if (cursorIndex >= layoutElements.size()) return;
	uint8_t pin = layoutElements[cursorIndex].parameters.value;
	GpioAction currentAction = Storage::getInstance().getProfilePinMappings()[pin].action;

	for (uint8_t c = 0; c < actionCategoryCount; c++) {
		for (uint16_t i = 0; i < actionCategories[c].count; i++) {
			if (actionCategories[c].entries[i] == currentAction) {
				actionCategory = c;
				actionCategoryIndex = i;
				return;
			}
		}
	}
}

void RemapScreen::assignAction(GpioAction action) {
	if (cursorIndex >= layoutElements.size()) return;

	uint8_t pin = layoutElements[cursorIndex].parameters.value;
	GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();
	pinMappings[pin].action = action;
	pinMappings[pin].customButtonMask = 0;
	pinMappings[pin].customDpadMask = 0;
	persistPinMappingToConfig(pin);
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
		int32_t score = perpDist * 6 + primaryDist;

		if (score < bestScore) {
			bestScore = score;
			bestIdx = i;
		}
	}
	return bestIdx;
}

void RemapScreen::enterKbdManage() {
	mode = REMAP_KBD_MANAGE;
	kbdManageIndex = 0;
}

void RemapScreen::enterKbdSelect() {
	mode = REMAP_KBD_SELECT;
	kbdCategory = 0;
	kbdCategoryIndex = 0;
}

void RemapScreen::enterKbdModifier() {
	mode = REMAP_KBD_MODIFIER;
	kbdModifierIndex = 0;
}

void RemapScreen::clearKeyboardKey() {
	if (cursorIndex >= layoutElements.size()) return;
	uint8_t pin = layoutElements[cursorIndex].parameters.value;
	Storage::getInstance().getKeyboardKeycodes()[pin] = 0;
	Storage::getInstance().getKeyboardModifierMasks()[pin] = 0;
	persistKeyboardKeyToConfig(pin);
	hasChanges = true;
}

void RemapScreen::persistKeyboardKeyToConfig(uint8_t pin) {
	GpioMappings* active = &Storage::getInstance().getGpioMappings();
	uint32_t profileNum = Storage::getInstance().getGamepadOptions().profileNumber;
	if (profileNum >= 2) {
		uint32_t profileIdx = profileNum - 2;
		ProfileOptions& profiles = Storage::getInstance().getProfileOptions();
		if (profileIdx < profiles.gpioMappingsSets_count && profiles.gpioMappingsSets[profileIdx].enabled)
			active = &profiles.gpioMappingsSets[profileIdx];
	}
	active->keyboardKeycodes[pin] = Storage::getInstance().getKeyboardKeycodes()[pin];
	active->keyboardKeycodes_count = NUM_BANK0_GPIOS;
	active->keyboardModifierMasks[pin] = Storage::getInstance().getKeyboardModifierMasks()[pin];
	active->keyboardModifierMasks_count = NUM_BANK0_GPIOS;
}

void RemapScreen::persistPinMappingToConfig(uint8_t pin) {
	GpioMappings* active = &Storage::getInstance().getGpioMappings();
	uint32_t profileNum = Storage::getInstance().getGamepadOptions().profileNumber;
	if (profileNum >= 2) {
		uint32_t profileIdx = profileNum - 2;
		ProfileOptions& profiles = Storage::getInstance().getProfileOptions();
		if (profileIdx < profiles.gpioMappingsSets_count && profiles.gpioMappingsSets[profileIdx].enabled)
			active = &profiles.gpioMappingsSets[profileIdx];
	}
	active->pins[pin] = Storage::getInstance().getProfilePinMappings()[pin];
	active->pins_count = NUM_BANK0_GPIOS;
}

void RemapScreen::assignKeyboardKey(uint8_t keycode, uint8_t modifierMask) {
	if (cursorIndex >= layoutElements.size()) return;
	uint8_t pin = layoutElements[cursorIndex].parameters.value;
	Storage::getInstance().getKeyboardKeycodes()[pin] = keycode;
	Storage::getInstance().getKeyboardModifierMasks()[pin] = modifierMask;
	persistKeyboardKeyToConfig(pin);
	hasChanges = true;
}

int8_t RemapScreen::update() {
	Mask_t values = Storage::getInstance().GetGamepad()->debouncedGpio;
	bool actionFired = false;

	if (mode == REMAP_ACTION_SELECT) {
		actionFired = updateActionSelect(values);
	} else if (mode == REMAP_KBD_MANAGE) {
		actionFired = updateKbdManage(values);
	} else if (mode == REMAP_KBD_SELECT) {
		actionFired = updateKbdSelect(values);
	} else if (mode == REMAP_KBD_MODIFIER) {
		actionFired = updateKbdModifier(values);
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
					if (DriverManager::getInstance().getInputMode() == INPUT_MODE_KEYBOARD) {
						enterKbdManage();
					} else {
						enterActionSelect();
					}
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

bool RemapScreen::updateActionSelect(Mask_t values) {
	if (!isPressed && prevValues != values) {
		uint16_t catSize = actionCategories[actionCategory].count;

		if (values & navLeftPinMask) {
			if (actionCategory > 0) {
				actionCategory--;
				actionCategoryIndex = 0;
			}
			return true;
		} else if (values & navRightPinMask) {
			if (actionCategory < actionCategoryCount - 1) {
				actionCategory++;
				actionCategoryIndex = 0;
			}
			return true;
		} else if (values & navUpPinMask) {
			if (actionCategoryIndex > 0) actionCategoryIndex--;
			return true;
		} else if (values & navDownPinMask) {
			if (actionCategoryIndex < catSize - 1) actionCategoryIndex++;
			return true;
		} else if (values & navB1PinMask) {
			assignAction(actionCategories[actionCategory].entries[actionCategoryIndex]);
			mode = REMAP_LAYOUT;
			return true;
		} else if (values & navB2PinMask) {
			mode = REMAP_LAYOUT;
			return true;
		} else if (values & navBackPinMask) {
			mode = REMAP_LAYOUT;
			return true;
		}
	}
	return false;
}

bool RemapScreen::updateKbdManage(Mask_t values) {
	if (!isPressed && prevValues != values) {
		uint8_t pin = layoutElements[cursorIndex].parameters.value;
		uint8_t kc = Storage::getInstance().getKeyboardKeycodes()[pin];
		uint8_t mod = Storage::getInstance().getKeyboardModifierMasks()[pin];
		uint8_t itemCount = (kc ? 1 : 0) + (mod ? 1 : 0) + 1;

		if (values & navUpPinMask) {
			if (kbdManageIndex > 0) kbdManageIndex--;
			return true;
		} else if (values & navDownPinMask) {
			if (kbdManageIndex < itemCount - 1) kbdManageIndex++;
			return true;
		} else if (values & navB1PinMask) {
			uint8_t keyIdx = kc ? 0 : 255;
			uint8_t modIdx = (kc && mod) ? 1 : (mod ? 0 : 255);
			uint8_t addIdx = itemCount - 1;

			if (kbdManageIndex == addIdx) {
				if (kc) {
					kbdPendingKeycode = kc;
					enterKbdModifier();
				} else {
					enterKbdSelect();
				}
			} else if (kbdManageIndex == keyIdx) {
				clearKeyboardKey();
			} else if (kbdManageIndex == modIdx) {
				Storage::getInstance().getKeyboardModifierMasks()[pin] = 0;
				persistKeyboardKeyToConfig(pin);
				hasChanges = true;
			}
			kbdManageIndex = 0;
			return true;
		} else if (values & navB2PinMask) {
			mode = REMAP_LAYOUT;
			return true;
		} else if (values & navBackPinMask) {
			mode = REMAP_LAYOUT;
			return true;
		}
	}
	return false;
}

bool RemapScreen::updateKbdSelect(Mask_t values) {
	if (!isPressed && prevValues != values) {
		uint16_t catSize = keyCategories[kbdCategory].count;

		if (values & navLeftPinMask) {
			if (kbdCategory > 0) {
				kbdCategory--;
				kbdCategoryIndex = 0;
			}
			return true;
		} else if (values & navRightPinMask) {
			if (kbdCategory < kbdSelectCategoryCount - 1) {
				kbdCategory++;
				kbdCategoryIndex = 0;
			}
			return true;
		} else if (values & navUpPinMask) {
			if (kbdCategoryIndex > 0) kbdCategoryIndex--;
			return true;
		} else if (values & navDownPinMask) {
			if (kbdCategoryIndex < catSize - 1) kbdCategoryIndex++;
			return true;
		} else if (values & navB1PinMask) {
			assignKeyboardKey(keyCategories[kbdCategory].entries[kbdCategoryIndex].code, 0);
			enterKbdManage();
			return true;
		} else if (values & navB2PinMask) {
			enterKbdManage();
			return true;
		} else if (values & navBackPinMask) {
			enterKbdManage();
			return true;
		}
	}
	return false;
}

bool RemapScreen::updateKbdModifier(Mask_t values) {
	if (!isPressed && prevValues != values) {
		if (values & navUpPinMask) {
			if (kbdModifierIndex > 0) kbdModifierIndex--;
			return true;
		} else if (values & navDownPinMask) {
			if (kbdModifierIndex < modifierCount - 1) kbdModifierIndex++;
			return true;
		} else if (values & navB1PinMask) {
			assignKeyboardKey(kbdPendingKeycode, modifierPresets[kbdModifierIndex].mask);
			kbdPendingKeycode = 0;
			enterKbdManage();
			return true;
		} else if (values & navB2PinMask) {
			enterKbdManage();
			return true;
		} else if (values & navBackPinMask) {
			enterKbdManage();
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

			InputMode currentMode = DriverManager::getInstance().getInputMode();
			const char* label = getActionName(action, currentMode);

			char topBuf[22];
			if (currentMode == INPUT_MODE_KEYBOARD) {
				uint8_t kc = Storage::getInstance().getKeyboardKeycodes()[pinNum];
				uint8_t mod = Storage::getInstance().getKeyboardModifierMasks()[pinNum];
				if (kc != 0) {
					if (mod) {
						snprintf(topBuf, sizeof(topBuf), "GP%02d:%s %s", pinNum, getKeyName(kc), getModifierName(mod));
					} else {
						snprintf(topBuf, sizeof(topBuf), "GP%02d:%s", pinNum, getKeyName(kc));
					}
				} else {
					snprintf(topBuf, sizeof(topBuf), "GP%02d:--", pinNum);
				}
			} else {
				snprintf(topBuf, sizeof(topBuf), "GP%02d:%s", pinNum, label);
			}
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
	} else if (mode == REMAP_ACTION_SELECT) {
		drawActionSelect();
	} else if (mode == REMAP_KBD_MANAGE) {
		drawKbdManage();
	} else if (mode == REMAP_KBD_SELECT) {
		drawKbdSelect();
	} else if (mode == REMAP_KBD_MODIFIER) {
		drawKbdModifier();
	}
}

void RemapScreen::drawActionSelect() {
	char lineBuf[22];

	snprintf(lineBuf, sizeof(lineBuf), "<%s[%d/%d]>",
		actionCategories[actionCategory].name,
		actionCategory + 1, actionCategoryCount);
	getRenderer()->drawText(0, 0, lineBuf);

	uint16_t catSize = actionCategories[actionCategory].count;
	uint8_t pageSize = 4;
	uint16_t page = actionCategoryIndex / pageSize;
	uint16_t pageStart = page * pageSize;
	uint8_t onPage = catSize - pageStart;
	if (onPage > pageSize) onPage = pageSize;

	InputMode currentMode = DriverManager::getInstance().getInputMode();
	for (uint8_t i = 0; i < onPage; i++) {
		uint16_t idx = pageStart + i;
		getRenderer()->drawText(1, 2 + i, (idx == actionCategoryIndex) ? CHAR_RIGHT : " ");
		getRenderer()->drawText(2, 2 + i,
			getActionName(actionCategories[actionCategory].entries[idx], currentMode));
	}

	if (catSize > pageSize) {
		uint16_t totalPages = (catSize + pageSize - 1) / pageSize;
		snprintf(lineBuf, sizeof(lineBuf), "Page %d/%d", page + 1, totalPages);
		getRenderer()->drawText(11, 7, lineBuf);
	}
}

void RemapScreen::drawKbdManage() {
	if (cursorIndex >= layoutElements.size()) return;
	uint8_t pin = layoutElements[cursorIndex].parameters.value;
	uint8_t kc = Storage::getInstance().getKeyboardKeycodes()[pin];
	uint8_t mod = Storage::getInstance().getKeyboardModifierMasks()[pin];

	getRenderer()->drawText(0, 0, "Key mapping:");

	uint8_t y = 2;
	if (kc) {
		getRenderer()->drawText(1, y, (kbdManageIndex == 0) ? CHAR_RIGHT : " ");
		getRenderer()->drawText(3, y, "x");
		getRenderer()->drawText(5, y, getKeyName(kc));
		y++;
	}
	if (mod) {
		uint8_t idx = (kc ? 1 : 0);
		getRenderer()->drawText(1, y, (kbdManageIndex == idx) ? CHAR_RIGHT : " ");
		getRenderer()->drawText(3, y, "x");
		getRenderer()->drawText(5, y, getModifierName(mod));
		y++;
	}
	uint8_t addIdx = (kc ? 1 : 0) + (mod ? 1 : 0);
	getRenderer()->drawText(1, y, (kbdManageIndex == addIdx) ? CHAR_RIGHT : " ");
	getRenderer()->drawText(3, y, kc ? "+ Add Mod" : "+ Add Key");
}

void RemapScreen::drawKbdSelect() {
	char lineBuf[22];

	snprintf(lineBuf, sizeof(lineBuf), "<%s[%d/%d]>",
		keyCategories[kbdCategory].name,
		kbdCategory + 1, kbdSelectCategoryCount);
	getRenderer()->drawText(0, 0, lineBuf);

	uint16_t catSize = keyCategories[kbdCategory].count;
	uint8_t pageSize = 4;
	uint16_t page = kbdCategoryIndex / pageSize;
	uint16_t pageStart = page * pageSize;
	uint8_t onPage = catSize - pageStart;
	if (onPage > pageSize) onPage = pageSize;

	for (uint8_t i = 0; i < onPage; i++) {
		uint16_t idx = pageStart + i;
		getRenderer()->drawText(1, 2 + i, (idx == kbdCategoryIndex) ? CHAR_RIGHT : " ");
		getRenderer()->drawText(2, 2 + i, keyCategories[kbdCategory].entries[idx].name);
	}

	if (catSize > pageSize) {
		uint16_t totalPages = (catSize + pageSize - 1) / pageSize;
		snprintf(lineBuf, sizeof(lineBuf), "Page %d/%d", page + 1, totalPages);
		getRenderer()->drawText(11, 7, lineBuf);
	}
}

void RemapScreen::drawKbdModifier() {
	char lineBuf[22];

	getRenderer()->drawText(0, 0, "Modifier");

	uint8_t pageSize = 4;
	uint8_t page = kbdModifierIndex / pageSize;
	uint8_t pageStart = page * pageSize;
	uint8_t onPage = modifierCount - pageStart;
	if (onPage > pageSize) onPage = pageSize;

	for (uint8_t i = 0; i < onPage; i++) {
		uint8_t idx = pageStart + i;
		getRenderer()->drawText(1, 2 + i, (idx == kbdModifierIndex) ? CHAR_RIGHT : " ");
		getRenderer()->drawText(2, 2 + i, modifierPresets[idx].name);
	}

	if (modifierCount > pageSize) {
		uint8_t totalPages = (modifierCount + pageSize - 1) / pageSize;
		snprintf(lineBuf, sizeof(lineBuf), "Page %d/%d", page + 1, totalPages);
		getRenderer()->drawText(11, 7, lineBuf);
	}
}
