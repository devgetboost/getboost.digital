import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blank")({
  head: () => ({
    meta: [
      { title: "Blank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BlankPage,
});

function BlankPage() {
  return <div className="min-h-screen bg-background" />;
}
