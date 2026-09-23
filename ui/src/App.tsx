import AppLayout from "@cloudscape-design/components/app-layout";
import { Overview } from "./pages/Overview.js";

export function App() {
  return <AppLayout navigationHide toolsHide content={<Overview />} />;
}
