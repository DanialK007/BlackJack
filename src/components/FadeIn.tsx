import { motion, type HTMLMotionProps } from "framer-motion";

interface FadeInProps extends HTMLMotionProps<"div"> {
  duration?: number;
  delay?: number;
  fade?: boolean;
  popup?: boolean;
}

export function FadeIn({
  children,
  duration = 0.45,
  delay = 0,
  fade = true,
  popup = false,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{
        opacity: fade ? 0 : 1,
        y: popup ? 10 : 0,
        scale: popup ? 0.96 : 1,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
