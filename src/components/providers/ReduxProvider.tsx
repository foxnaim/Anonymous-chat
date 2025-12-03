'use client';

import { Provider } from "react-redux";
import { useRef, type ReactNode } from "react";
import { makeStore, type AppStore } from "@/lib";
interface ReduxProviderProps {
  children: ReactNode;
}
const ReduxProvider = ({ children }: ReduxProviderProps) => {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
};
export default ReduxProvider;
