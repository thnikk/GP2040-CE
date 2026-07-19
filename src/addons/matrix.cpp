#include "addons/matrix.h"
#include "storagemanager.h"
#include "virtualpinmanager.h"

#include "hardware/gpio.h"

bool MatrixInput::available()
{
    const MatrixOptions& options = Storage::getInstance().getAddonOptions().matrixOptions;
    if (!options.enabled)
        return false;
    if (options.rowPins_count == 0 || options.colPins_count == 0 || options.mapping_count == 0)
        return false;
    return true;
}

void MatrixInput::setup()
{
    const MatrixOptions& options = Storage::getInstance().getAddonOptions().matrixOptions;

    // Store row pins
    rowPins.clear();
    for (pb_size_t i = 0; i < options.rowPins_count; i++)
        rowPins.push_back(options.rowPins[i]);

    // Store column pins
    colPins.clear();
    for (pb_size_t i = 0; i < options.colPins_count; i++)
        colPins.push_back(options.colPins[i]);

    // Store mapping and track claimed pins
    mapping.clear();
    claimedPins.clear();
    for (pb_size_t i = 0; i < options.mapping_count; i++)
    {
        MatrixMappingEntry entry;
        entry.row = options.mapping[i].row;
        entry.col = options.mapping[i].col;
        entry.targetPin = options.mapping[i].targetPin;
        mapping.push_back(entry);

        // Track claimed pins for claimsPin()
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

    initPins();
    VirtualPinManager::getInstance().registerProvider(this);
    initialized = true;
}

void MatrixInput::initPins()
{
    // Initialize row pins as outputs, initially HIGH
    for (auto pin : rowPins)
    {
        gpio_init(pin);
        gpio_set_dir(pin, GPIO_OUT);
        gpio_put(pin, 1);
    }

    // Initialize column pins as inputs with pull-up
    for (auto pin : colPins)
    {
        gpio_init(pin);
        gpio_set_dir(pin, GPIO_IN);
        gpio_pull_up(pin);
    }
}

void MatrixInput::deinitPins()
{
    for (auto pin : rowPins)
        gpio_deinit(pin);
    for (auto pin : colPins)
        gpio_deinit(pin);
}

void MatrixInput::update(Mask_t & pinStates)
{
    if (!initialized)
        return;

    // Clear all claimed target pins first
    for (auto& cp : claimedPins)
        pinStates &= ~(1UL << cp);

    // Scan each row
    for (auto row : rowPins)
    {
        gpio_put(row, 0);
        busy_wait_us(10);

        // Read all columns
        for (auto col : colPins)
        {
            if (gpio_get(col) == 0)
            {
                // This intersection is pressed — find the target pin
                for (auto& entry : mapping)
                {
                    if (entry.row == row && entry.col == col)
                    {
                        pinStates |= (1UL << entry.targetPin);
                        break;
                    }
                }
            }
        }

        gpio_put(row, 1);
    }
}

bool MatrixInput::claimsPin(Pin_t pin)
{
    for (auto& cp : claimedPins)
    {
        if ((Pin_t)cp == pin)
            return true;
    }
    return false;
}
