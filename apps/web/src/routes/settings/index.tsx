import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "../../components/placeholder-page.js";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return <PlaceholderPage heading="Settings" />;
}
