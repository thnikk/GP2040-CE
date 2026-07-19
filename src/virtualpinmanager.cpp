#include "virtualpinmanager.h"

void VirtualPinManager::registerProvider(VirtualPinProvider * provider)
{
    providers.push_back(provider);
}

void VirtualPinManager::unregisterProvider(VirtualPinProvider * provider)
{
    for (auto it = providers.begin(); it != providers.end(); ++it)
    {
        if (*it == provider)
        {
            providers.erase(it);
            return;
        }
    }
}

void VirtualPinManager::applyAll(Mask_t & pinStates)
{
    for (auto provider : providers)
    {
        provider->update(pinStates);
    }
}

bool VirtualPinManager::isPinAddonManaged(Pin_t pin)
{
    for (auto provider : providers)
    {
        if (provider->claimsPin(pin))
            return true;
    }
    return false;
}
