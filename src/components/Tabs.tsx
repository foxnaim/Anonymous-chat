'use client';

import { Tab } from "@headlessui/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsProps {
  children: React.ReactNode;
  defaultIndex?: number;
}

export const Tabs = ({ children, defaultIndex = 0 }: TabsProps) => {
  return (
    <Tab.Group defaultIndex={defaultIndex}>
      {children}
    </Tab.Group>
  );
};

export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <Tab.List className={cn("flex space-x-1 rounded-lg bg-muted p-1", className)}>
      {children}
    </Tab.List>
  );
};

export const TabsTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <Tab
      className={({ selected }) =>
        cn(
          "w-full rounded-md py-2.5 text-sm font-medium leading-5 transition-all",
          "ring-white ring-opacity-60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2",
          selected
            ? "bg-background text-foreground shadow"
            : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
          className
        )
      }
    >
      {children}
    </Tab>
  );
};

export const TabsContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <Tab.Panel>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </Tab.Panel>
  );
};

export const TabsPanels = ({ children }: { children: React.ReactNode }) => {
  return <Tab.Panels>{children}</Tab.Panels>;
};
