"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

function Header1() {
  return (
    <header className="fixed left-0 top-0 z-40 w-full">
      <div className="mx-auto flex w-full max-w-7xl justify-end px-4 py-5 md:px-6">
        <Button asChild className="bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90">
          <Link href="/login">Get started</Link>
        </Button>
      </div>
    </header>
  );
}

export { Header1 };
