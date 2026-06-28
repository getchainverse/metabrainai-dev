import React from "react";
import Header from "../Header";

const AppLayout = ({ children }) => (
  <>
    <Header />
    <main className="min-h-[calc(100vh-70px)]">{children}</main>
  </>
);

export default AppLayout;
