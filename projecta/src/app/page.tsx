"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function Home() {
  const [minutes, setMinutes] = useState(30);
  const [prompt, setPrompt] = useState(
    "Berikan ringkasan log dalam 30 menit kebelakang"
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendPrompt(customPrompt?: string) {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body = { prompt: customPrompt ?? prompt, minutes };
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json.summary || JSON.stringify(json.raw || json, null, 2));
      } else {
        setError(json.error || JSON.stringify(json));
      }
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen page-bg bg-white font-sans">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-indigo-600 w-12 h-12 flex items-center justify-center text-white text-xl shadow-md">
              ⚡
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900">LogAI</h1>
              <p className="text-sm text-zinc-600">
                Prompt Dashboard — SigNoz + Gemini
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-zinc-500"
            >
              📊 Incident Dashboard
            </Link>
            <div className="text-sm text-zinc-700">
              Status: <span className="font-medium text-green-600">Ready</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <section className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">
              Compose Prompt
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Tulis pertanyaan Anda dan sertakan periode waktu.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm text-zinc-700 w-36">
                  Lookback (minutes)
                </label>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-36 rounded-lg border border-zinc-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-700">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-zinc-200 p-3 text-sm shadow-sm placeholder-zinc-400 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => sendPrompt()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 shadow"
                >
                  🚀 Send Prompt
                </button>

                <button
                  onClick={() =>
                    sendPrompt(
                      "Berikan saya log ERROR dalam 30 menit kebelakang dan ringkas"
                    )
                  }
                  disabled={loading}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm bg-white"
                >
                  ⚠️ Quick: ERROR 30m
                </button>

                <button
                  onClick={() =>
                    sendPrompt(
                      "Ringkas kondisi server (CPU, mem, error) dalam 30 menit"
                    )
                  }
                  disabled={loading}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm bg-white"
                >
                  🖥️ Quick: Server
                </button>

                <button
                  onClick={() => {
                    setPrompt(
                      "Berikan ringkasan log dalam 30 menit kebelakang"
                    );
                    setMinutes(30);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm bg-white"
                >
                  ♻️ Reset
                </button>
              </div>
            </div>
          </section>

          <aside className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Quick Tips</h3>
            <ul className="mt-3 space-y-3 text-sm text-zinc-600">
              <li>• Gunakan quick prompts untuk pertanyaan umum.</li>
              <li>
                • Jika SigNoz berjalan di Docker, set `SIGNOZ_LOGS_API` sesuai
                jaringan.
              </li>
              <li>
                • Webhook test: gunakan{" "}
                <code className="rounded bg-zinc-100 px-1">
                  /api/webhook/debug
                </code>
                .
              </li>
            </ul>
          </aside>
        </div>

        <section className="mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Result</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Ringkasan akan muncul di sini setelah request selesai.
                </p>
              </div>
              <div className="text-sm text-zinc-500">
                {loading ? "Processing…" : "Idle"}
              </div>
            </div>

            <div className="mt-4">
              {error && (
                <pre className="rounded p-4 text-sm text-red-700 bg-red-50">
                  {error}
                </pre>
              )}

              {result && (
                <div className="mt-2 rounded-lg border border-zinc-100 p-4 bg-zinc-50">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-800">
                    {result}
                  </pre>
                </div>
              )}

              {!loading && !result && !error && (
                <div className="mt-2 text-sm text-zinc-500">
                  No result yet — send a prompt to get started.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-zinc-500">
          SigNoz integration and Gemini summarization.
        </div>
      </footer>
    </div>
  );
}
