import { useState } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import { Overview } from "./pages/Overview.js";
import { ToolsPage } from "./pages/Tools.js";

type Page = "overview" | "tools";

export function App() {
  const [page, setPage] = useState<Page>("overview");

  return (
    <AppLayout
      toolsHide
      navigationHide={false}
      navigation={
        <SideNavigation
          header={{ text: "Frank", href: "#" }}
          activeHref={`#${page}`}
          items={[
            { type: "link", text: "Overview", href: "#overview" },
            { type: "link", text: "Tools", href: "#tools" },
          ]}
          onFollow={(event) => {
            event.preventDefault();
            setPage(event.detail.href === "#tools" ? "tools" : "overview");
          }}
        />
      }
      content={page === "overview" ? <Overview /> : <ToolsPage />}
    />
  );
}
