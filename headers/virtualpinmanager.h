#ifndef _VIRTUALPINMANAGER_H_
#define _VIRTUALPINMANAGER_H_

#include "types.h"
#include "virtualpinprovider.h"
#include <vector>

class VirtualPinManager
{
public:
    VirtualPinManager() {}

    void registerProvider(VirtualPinProvider * provider);
    void unregisterProvider(VirtualPinProvider * provider);
    void applyAll(Mask_t & pinStates);
    bool isPinAddonManaged(Pin_t pin);

private:
    std::vector<VirtualPinProvider *> providers;
};

#endif
