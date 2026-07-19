#ifndef _CAPTOUCH_INPUT_H_
#define _CAPTOUCH_INPUT_H_

#include "gpaddon.h"
#include "virtualpinprovider.h"
#include "config.pb.h"

#include <vector>
#include <cstdint>

#ifndef CAPTOUCH_INPUT_ENABLED
#define CAPTOUCH_INPUT_ENABLED 0
#endif

#define CapTouchInputName "CapTouchInput"

struct CapTouchMappingEntry
{
    uint32_t sensePin;
    uint32_t targetPin;
};

class CapTouchInput : public GPAddon, public VirtualPinProvider
{
public:
    virtual bool available();
    virtual void setup();
    virtual void preprocess() {}
    virtual void process() {}
    virtual std::string name() { return CapTouchInputName; }

    // VirtualPinProvider
    virtual void update(Mask_t & pinStates);
    virtual bool claimsPin(Pin_t pin);

private:
    uint64_t measureDischargeTime(uint32_t pin);

    std::vector<CapTouchMappingEntry> mapping;
    std::vector<uint32_t> claimedPins;
    uint32_t threshold;
    uint32_t chargeTimeUs;
    bool initialized;
};

#endif
