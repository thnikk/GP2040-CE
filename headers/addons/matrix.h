#ifndef _MATRIX_INPUT_H_
#define _MATRIX_INPUT_H_

#include "gpaddon.h"
#include "virtualpinprovider.h"
#include "config.pb.h"

#include <vector>
#include <cstdint>

#ifndef MATRIX_INPUT_ENABLED
#define MATRIX_INPUT_ENABLED 0
#endif

#define MatrixInputName "MatrixInput"

struct MatrixMappingEntry
{
    uint32_t row;
    uint32_t col;
    uint32_t targetPin;
};

class MatrixInput : public GPAddon, public VirtualPinProvider
{
public:
    virtual bool available();
    virtual void setup();
    virtual void preprocess() {}
    virtual void process() {}
    virtual std::string name() { return MatrixInputName; }

    // VirtualPinProvider
    virtual void update(Mask_t & pinStates);
    virtual bool claimsPin(Pin_t pin);

private:
    void initPins();
    void deinitPins();

    std::vector<uint32_t> rowPins;
    std::vector<uint32_t> colPins;
    std::vector<MatrixMappingEntry> mapping;
    std::vector<uint32_t> claimedPins;
    bool initialized;
};

#endif
