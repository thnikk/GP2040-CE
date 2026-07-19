#ifndef _REMAPSCREEN_H_
#define _REMAPSCREEN_H_

#include "GPGFX_UI_widgets.h"
#include "GPGFX_UI_types.h"
#include "layoutmanager.h"
#include "enums.pb.h"
#include "storagemanager.h"
#include "eventmanager.h"
#include "GPStorageSaveEvent.h"
#include "drivermanager.h"

enum RemapMode {
	REMAP_LAYOUT,
	REMAP_ACTION_SELECT,
	REMAP_KBD_MANAGE,
	REMAP_KBD_SELECT,
	REMAP_KBD_MODIFIER
};

class RemapScreen : public GPScreen {
	public:
		RemapScreen() {}
		RemapScreen(GPGFX* renderer) { setRenderer(renderer); }
		virtual int8_t update();
		virtual void init();
		virtual void shutdown();
	protected:
		virtual void drawScreen();
	private:
		RemapMode mode = REMAP_LAYOUT;
		std::vector<GPButtonLayout> layoutElements;
		size_t cursorIndex = 0;

		GPMenu* gpMenu;
		std::vector<MenuEntry> actionMenu;

		bool isPressed = false;
		Mask_t prevValues = 0;
		uint32_t navB1PinMask = 0;
		uint32_t navB2PinMask = 0;
		uint32_t navUpPinMask = 0;
		uint32_t navDownPinMask = 0;
		uint32_t navLeftPinMask = 0;
		uint32_t navRightPinMask = 0;
		uint32_t navBackPinMask = 0;

		bool hasChanges = false;

		uint8_t kbdManageIndex = 0;
		uint8_t kbdPendingKeycode = 0;
		uint8_t kbdCategory = 0;
		uint16_t kbdCategoryIndex = 0;
		uint8_t kbdModifierIndex = 0;

		void buildActionMenu();
		void assignAction(GpioAction action);
		bool updateActionNavigation(Mask_t values);
		int8_t findNearestPin(int8_t dirX, int8_t dirY);

		bool updateKbdManage(Mask_t values);
		bool updateKbdSelect(Mask_t values);
		bool updateKbdModifier(Mask_t values);

		void enterKbdManage();
		void enterKbdSelect();
		void enterKbdModifier();
		void clearKeyboardKey();
		void assignKeyboardKey(uint8_t keycode, uint8_t modifierMask);
		void persistKeyboardKeyToConfig(uint8_t pin);
		void persistPinMappingToConfig(uint8_t pin);

		void drawKbdManage();
		void drawKbdSelect();
		void drawKbdModifier();
};

#endif
