'use client';

import { Switch } from "@headlessui/react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector, toggleTheme } from "@/lib";
const ThemeSwitch = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const dispatch = useAppDispatch();
  const enabled = theme === "light";
  return (
    <div className="flex items-center gap-3">
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-white/70"
      >
        Тема интерфейса
      </motion.span>
      <Switch
        checked={enabled}
        onChange={() => dispatch(toggleTheme())}
        className={`relative inline-flex h-6 w-12 items-center rounded-full border border-white/20 transition ${
          enabled ? "bg-primary/80" : "bg-white/10"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </Switch>
    </div>
  );
};
export default ThemeSwitch;
