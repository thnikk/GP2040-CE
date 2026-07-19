#ifndef _VIRTUALPINMANAGER_H_
#define _VIRTUALPINMANAGER_H_

#include "types.h"
#include "virtualpinprovider.h"
#include <vector>

class VirtualPinManager
{
public:
    static VirtualPinManager & getInstance()
    {
        static VirtualPinManager instance;
        return instance;
    }

    VirtualPinManager(VirtualPinManager const &) = delete;
    void operator=(VirtualPinManager const &) = delete;

    void registerProvider(VirtualPinProvider * provider);
    void unregisterProvider(VirtualPinProvider * provider);
    void applyAll(Mask_t & pinStates);
    bool isPinAddonManaged(Pin_t pin);

private:
    VirtualPinManager() {}
    std::vector<VirtualPinProvider *> providers;
};

#endif
