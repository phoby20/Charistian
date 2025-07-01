// src/components/Chip.tsx

"use client";
import { motion } from "framer-motion";
import { X } from "lucide-react";

type ChipColor = "blue" | "green" | "red" | "yellow" | "purple";

interface ChipProps {
  label: string;
  color?: ChipColor;
  onRemove?: () => void;
}

export default function Chip({ label, color, onRemove }: ChipProps) {
  const defaultColor: ChipColor = "blue";
  const colorClass = color || defaultColor;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`inline-flex items-center bg-${colorClass}-100 text-${colorClass}-800 text-sm font-medium px-3 py-1 rounded-full mr-2 w-max`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
