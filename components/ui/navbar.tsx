"use client"

import Link from "next/link"
import { useState } from "react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header
      className="fixed top-6 left-1/2 z-20 flex w-[calc(100%-2rem)] -translate-x-1/2 flex-col rounded-full border border-[#333] bg-[#1f1f1f57] px-6 py-3 backdrop-blur-sm sm:w-auto"
    >
      <div className="flex w-full items-center justify-between gap-x-6 sm:gap-x-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-6 w-6 items-center justify-center">
            <div className="absolute inset-0 rounded-sm border border-gray-300 opacity-60"></div>
            <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-blue-400"></div>
            <span className="absolute text-xs font-bold text-white">L</span>
          </div>
          <span className="hidden text-sm font-semibold text-white sm:inline">LYKA</span>
        </div>

        <div className="hidden sm:block">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-500 hover:to-blue-700"
          >
            Get started
          </Link>
        </div>

        <button
          className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden ${
          isOpen ? "max-h-40 opacity-100 pt-4" : "max-h-0 opacity-0 pt-0 pointer-events-none"
        }`}
      >
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-500 hover:to-blue-700"
        >
          Get started
        </Link>
      </div>
    </header>
  )
}
