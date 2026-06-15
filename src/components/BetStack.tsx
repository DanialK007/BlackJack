import { motion, AnimatePresence } from "framer-motion";

interface BetStackProps {
  amount: number;
}

const CHIP_CONFIG = [
  { value: 100, color: "#e65100", border: "rgba(255,160,80,0.5)", label: "100" },
  { value: 50, color: "#4a148c", border: "rgba(200,150,255,0.5)", label: "50" },
  { value: 25, color: "#2e7d32", border: "rgba(100,220,100,0.5)", label: "25" },
  { value: 10, color: "#1565c0", border: "rgba(100,160,255,0.5)", label: "10" },
  { value: 5, color: "#e53935", border: "rgba(255,140,140,0.5)", label: "5" },
];

function buildStack(amount: number) {
  const chips: typeof CHIP_CONFIG[0][] = [];
  let remaining = amount;
  for (const chip of CHIP_CONFIG) {
    while (remaining >= chip.value && chips.length < 12) {
      chips.push(chip);
      remaining -= chip.value;
    }
  }
  return chips;
}

export function BetStack({ amount }: BetStackProps) {
  const chips = buildStack(amount);

  return (
    <AnimatePresence>
      {amount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 10 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center mt-[50px]"
          data-testid="bet-stack"
        >
          <div style={{ position: "relative", width: 48, height: 16 + chips.length * 5 }}>
            {chips.map((chip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                style={{
                  position: "absolute",
                  bottom: i * 5,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 44,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: chip.color,
                  border: `2px solid ${chip.border}`,
                  outline: "2px solid rgba(0,0,0,0.35)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            ))}
          </div>
          <div
            className="text-xs font-bold mt-1"
            style={{ color: "hsl(43,74%,70%)", fontFamily: "'Inter', sans-serif" }}
          >
            ${amount}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
