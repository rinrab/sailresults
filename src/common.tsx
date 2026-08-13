import { tokens, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider } from "@fluentui/react-components";
import { Home24Filled } from "@fluentui/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Racer } from "./scoring";

export function formatString(str: string) {
  return (str == "") ? "-" : str;
}

export function racerMatches(racer: Racer, query: string) {
  return (racer.name + racer.number).toLowerCase().includes(query);
}

export function Layout({ children, print = undefined }) {
  return <div className="layout">
    {children}
    {print && <div className="print-only">{print}</div>}
  </div>;
}

export function NavBar({ children }) {
  const navigate = useNavigate();

  return <div style={{
    padding: "4px 8px",
    backgroundColor: tokens.colorNeutralBackground4,
    display: "flex",
  }} className="screen-only">
    <Breadcrumb style={{ flex: 1 }}>
      <BreadcrumbItem>
        <BreadcrumbButton onClick={() => navigate("/")}>
          <Home24Filled />
        </BreadcrumbButton>
      </BreadcrumbItem>
      { children }
    </Breadcrumb>
  </div>;
}

export function NavBarItem({ title, to }) {
  const navigate = useNavigate();
  return <>
    <BreadcrumbDivider />
    <BreadcrumbItem>
      <BreadcrumbButton onClick={() => navigate(to)}>{title}</BreadcrumbButton>
    </BreadcrumbItem>
  </>
}

export function Content({ children, screenOnly = false }) {
  return <div
    className={screenOnly ? "screen-only" : ""}
    style={{
      flex: "1",
      padding: "8px",
      minHeight: "0",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
    { children }
  </div>
}
