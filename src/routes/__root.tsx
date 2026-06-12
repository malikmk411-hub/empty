import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  ),
});
