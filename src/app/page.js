"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    async function loadSongs() {
      const res = await fetch("/api/songs");
      const data = await res.json();
      setSongs(data);
    }

    loadSongs();
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#3b0764_0%,#111827_45%,#020617_100%)] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">
            Live Lyric Typing
          </p>

          <h1 className="mb-4 text-5xl font-black tracking-tight md:text-7xl">
            Type to the beat.
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Pick a song, follow the synced lyrics, and type in real time while
            the music plays.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black/20 p-5">
              <p className="text-sm text-gray-400">Mode</p>
              <p className="text-2xl font-bold">Live Sync</p>
            </div>

            <div className="rounded-2xl bg-black/20 p-5">
              <p className="text-sm text-gray-400">Scoring</p>
              <p className="text-2xl font-bold">Speed + Accuracy</p>
            </div>

            <div className="rounded-2xl bg-black/20 p-5">
              <p className="text-sm text-gray-400">Songs</p>
              <p className="text-2xl font-bold">{songs.length}</p>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-2xl font-bold">Choose a song</h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <Link
              key={song.id}
              href={`/play/${song.id}`}
              className="group rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-fuchsia-300/60 hover:bg-white/15"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-200">
                  {song.difficulty}
                </span>

                <span className="text-sm text-gray-400">
                  {song.duration_seconds}s
                </span>
              </div>

              <h3 className="mb-2 text-2xl font-black group-hover:text-fuchsia-200">
                {song.title}
              </h3>

              <p className="mb-6 text-gray-300">{song.artist}</p>

              <div className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-950 transition group-hover:bg-fuchsia-200">
                Play now →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}