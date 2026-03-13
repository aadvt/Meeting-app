import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { SplineScene } from "@/components/ui/spline-scene"
import { Navbar } from "@/components/ui/navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="container mx-auto px-4">
          <Card className="relative h-[500px] w-full overflow-hidden border-none bg-black/[0.96]">
            <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" />

            <div className="flex h-full flex-col md:flex-row">
              <div className="relative z-10 flex flex-1 flex-col justify-center p-8">
                <p className="text-sm uppercase tracking-[0.28em] text-blue-400/90">Meet LYKA</p>
                <h1 className="mt-4 max-w-2xl bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-white md:text-5xl">
                  MEET LYKA, YOUR MEETING ASSISTANT.
                </h1>
                <p className="mt-4 max-w-lg text-neutral-300">
                  Capture decisions, action items, and risks in real-time so every meeting turns into execution.
                </p>

                <div className="mt-8">
                  <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
                    <Link href="/login">Get Started</Link>
                  </Button>
                </div>
              </div>

              <div className="relative flex-1">
                <SplineScene
                  scene="https://prod.spline.design/UbM7F-HZcyTbZ4y3/scene.splinecode"
                  className="h-full w-full"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
