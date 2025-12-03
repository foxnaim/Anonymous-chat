'use client';

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { FiX, FiMenu } from "react-icons/fi";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const Sidebar = ({ items, title, isOpen, onClose, onOpen }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border"
        onClick={onOpen}
      >
        <FiMenu className="h-6 w-6" />
      </button>

      {/* Mobile sidebar */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="lg:hidden relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-col bg-card border-r border-border">
                <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border">
                  <h1 className="text-xl font-bold text-primary">{title}</h1>
                  <button
                    type="button"
                    className="rounded-md p-2 text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col px-3 py-4 space-y-1">
                  {items.map((item, index) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={item.path as any}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {Icon && <Icon className="h-5 w-5" />}
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">{title}</h1>
        </div>
        <nav className="flex flex-1 flex-col px-3 py-4 space-y-1">
          {items.map((item, index) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.path as any}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

