
import { motion } from "framer-motion";
import "./HeroVisual.css";

export default function HeroVisual() {
  return (
    <motion.div
      className="rentsure-hero-visual"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="hero-visual-glow" />

      <motion.img
        className="rentsure-house-image"
        src="/images/rentsure-hero.png"
        alt="Modern 3D house with rental property and deposit planning cards"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
