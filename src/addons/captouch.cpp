#include "addons/captouch.h"
#include "storagemanager.h"
#include "virtualpinmanager.h"

#include "hardware/gpio.h"
#include "pico/time.h"

static const uint64_t CAP_TOUCH_TIMEOUT_US = 2000;

bool CapTouchInput::available()
{
    const CapTouchOptions& options = Storage::getInstance().getAddonOptions().capTouchOptions;
    if (!options.enabled)
        return false;
    if (options.mapping_count == 0)
        return false;
    return true;
}

void CapTouchInput::setup()
{
    const CapTouchOptions& options = Storage::getInstance().getAddonOptions().capTouchOptions;

    threshold = options.threshold;
    chargeTimeUs = options.chargeTimeUs;

    mapping.clear();
    claimedPins.clear();
    for (pb_size_t i = 0; i < options.mapping_count; i++)
    {
        CapTouchMappingEntry entry;
        entry.sensePin = options.mapping[i].sensePin;
        entry.targetPin = options.mapping[i].targetPin;
        mapping.push_back(entry);

        bool alreadyClaimed = false;
        for (auto& cp : claimedPins)
        {
            if (cp == entry.targetPin)
            {
                alreadyClaimed = true;
                break;
            }
        }
        if (!alreadyClaimed)
            claimedPins.push_back(entry.targetPin);
    }

    VirtualPinManager::getInstance().registerProvider(this);
    initialized = true;
}

uint64_t CapTouchInput::measureDischargeTime(uint32_t pin)
{
    // Charge the pin: output HIGH
    gpio_set_dir(pin, GPIO_OUT);
    gpio_put(pin, 1);

    // Wait for the charge to settle
    busy_wait_us(chargeTimeUs);

    // Switch to input with no pulls to start discharge
    gpio_set_dir(pin, GPIO_IN);
    gpio_disable_pulls(pin);

    // Measure discharge time
    uint64_t start = time_us_64();
    while (gpio_get(pin) && (time_us_64() - start < CAP_TOUCH_TIMEOUT_US))
        tight_loop_contents();

    return time_us_64() - start;
}

void CapTouchInput::update(Mask_t & pinStates)
{
    if (!initialized)
        return;

    // Clear all claimed target pins first
    for (auto& cp : claimedPins)
        pinStates &= ~(1UL << cp);

    // Read each capacitive sense pin
    for (auto& entry : mapping)
    {
        uint64_t dischargeTime = measureDischargeTime(entry.sensePin);
        if (dischargeTime >= threshold)
            pinStates |= (1UL << entry.targetPin);
    }
}

bool CapTouchInput::claimsPin(Pin_t pin)
{
    for (auto& cp : claimedPins)
    {
        if ((Pin_t)cp == pin)
            return true;
    }
    return false;
}
