import { execSync } from "child_process";

const pins = {
  up: 17,
  down: 27,
  left: 22,
  right: 23,
};

// Initialize all pins as output and off
for (const pin of Object.values(pins)) {
  try {
    execSync(`gpioset gpiochip0 ${pin}=0`);
  } catch (e) {
    console.warn(`⚠️ Couldn't init GPIO ${pin}:`, e.message);
  }
}

function resetLeds() {
  for (const pin of Object.values(pins)) {
    try {
      execSync(`gpioset gpiochip0 ${pin}=0`);
    } catch {}
  }
}

export function setDirection(direction) {
  console.log(`🟢 Blink direction: ${direction}`);
  resetLeds();

  const pin = pins[direction];
  if (pin !== undefined) {
    try {
      // Turn LED ON
      execSync(`gpioset gpiochip0 ${pin}=1`);
      // Wait 200ms then turn it OFF
      setTimeout(() => {
        try {
          execSync(`gpioset gpiochip0 ${pin}=0`);
        } catch {}
      }, 200);
    } catch (e) {
      console.warn(`⚠️ Failed to blink GPIO ${pin}:`, e.message);
    }
  }
}

process.on("SIGINT", () => {
  resetLeds();
  process.exit();
});
