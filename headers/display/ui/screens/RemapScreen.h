#ifndef _REMAPSCREEN_H_
#define _REMAPSCREEN_H_

#include "GPGFX_UI_widgets.h"
#include "GPGFX_UI_types.h"
#include "layoutmanager.h"
#include "enums.pb.h"
#include "storagemanager.h"
#include "eventmanager.h"
#include "GPStorageSaveEvent.h"

enum RemapMode {
	REMAP_LAYOUT,
	REMAP_ACTION_SELECT
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

		void buildActionMenu();
		void assignAction(GpioAction action);
		bool updateActionNavigation(Mask_t values);
		int8_t findNearestPin(int8_t dirX, int8_t dirY);
};

#endif
