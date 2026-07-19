#ifndef _VIRTUALPINPROVIDER_H_
#define _VIRTUALPINPROVIDER_H_

#include "types.h"

class VirtualPinProvider
{
public:
    virtual ~VirtualPinProvider() { }
    virtual void update(Mask_t & pinStates) = 0;
    virtual bool claimsPin(Pin_t pin) = 0;
};

#endif
