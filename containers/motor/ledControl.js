let Gpio;
let gpioAvailable = false;

try {
  const onoff = await import('onoff');
  Gpio = onoff.Gpio;
  // 🧪 اختبار فعلي للـ GPIO
  try {
    const testPin = new Gpio(4, 'out');
    testPin.writeSync(0);
    testPin.unexport();
    gpioAvailable = true;
    console.log("🟢 GPIO hardware mode enabled (onoff working).");
  } catch (innerErr) {
    console.warn("⚠️ GPIO not writable, switching to simulation mode:", innerErr.message);
  }
} catch (err) {
  console.warn("⚠️ GPIO library not found, running in simulation mode:", err.message);
}

// fallback class (simulation)
if (!gpioAvailable) {
  Gpio = class {
    constructor(pin, dir) {
      this.pin = pin;
      this.dir = dir;
    }
    writeSync(value) {
      console.log(`💡 Simulated GPIO ${this.pin} (${this.dir}) = ${value}`);
    }
    unexport() {}
  };
}

// Define GPIO pins for each direction
const leds = {
  up: new Gpio(17, 'out'),
  down: new Gpio(27, 'out'),
  left: new Gpio(22, 'out'),
  right: new Gpio(23, 'out'),
};

// Turn all LEDs off
function resetLeds() {
  Object.values(leds).forEach(pin => pin.writeSync(0));
}

// Turn on the LED for the given direction
export function setDirection(direction) {
  console.log(`🟢 Direction: ${direction}`);
  resetLeds();

  if (leds[direction]) {
    leds[direction].writeSync(1);
  }
}

// Turn off everything on exit
process.on('SIGINT', () => {
  resetLeds();
  Object.values(leds).forEach(pin => pin.unexport());
  process.exit();
});
