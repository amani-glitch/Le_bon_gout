import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <img src="/images/lebongout-hero.jpg" alt="Le Bon Gout" className="mb-6 h-24 w-24 rounded-full object-cover" />
      <h1 className="font-display text-5xl">404</h1>
      <p className="mt-2 text-text-muted">
        Apologies — Le Bon Gout couldn't find that page.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}
