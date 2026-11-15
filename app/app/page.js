
"use client";

import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("For You");

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="flex items-center justify-between p-5 border-b border-gray-800">
        <h1 className="text-3xl font-bold text-pink-500">
          Coko Roco
        </h1>

        <input
          type="text"
          placeholder="Search videos..."
          className="bg-gray-900 rounded-full px-5 py-2 outline-none"
        />

        <button className="bg-pink-600 px-5 py-2 rounded-full">
          Upload +
        </button>
      </header>

      <div className="flex">

        {/* SIDEBAR */}
        <aside className="w-56 min-h-screen border-r border-gray-800 p-5 hidden md:block">
          {["Home", "Explore", "Following", "Live", "Profile"].map(item => (
            <button
              key={item}
              className="block w-full text-left p-4 hover:bg-gray-900 rounded-xl"
            >
              {item}
            </button>
          ))}
        </aside>

        {/* MAIN FEED */}
        <section className="flex-1 p-6 max-w-3xl mx-auto">

          <div className="flex gap-6 mb-6 border-b border-gray-800 pb-4">
            {["For You", "Following", "Viral"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? "text-pink-500 font-bold"
                    : "text-gray-400"
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-center py-24">
            <h2 className="text-2xl font-bold mb-3">
              Welcome to Coko Roco
            </h2>

            <p className="text-gray-400">
              Discover amazing videos from creators around the world.
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}
