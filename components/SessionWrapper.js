"use client";

import { SessionProvider } from "next-auth/react";
import QueryProvider from "./QueryProvider";

const SessionWrapper = ({ children }) => {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
};

export default SessionWrapper;
