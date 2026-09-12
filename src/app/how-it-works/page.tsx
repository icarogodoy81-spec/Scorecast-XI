import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className="min-h-screen text-slate-100 px-4 py-10 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl mt-4 md:mt-10">
        <h1 className="text-3xl font-bold mb-8 text-white border-b border-white/10 pb-4">
          How to Play
        </h1>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-white">1. Submit a prediction</h2>
          <p className="text-slate-300 leading-relaxed">
            Go to the <strong className="text-white">Make Predictions</strong> page, guess the score
            for a match, and hit save. You&apos;ll see a &quot;Prediction
            saved&quot; message confirming it went through. Predictions can
            be changed as many times as you like until the deadline.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-white">2. Deadline</h2>
          <p className="text-slate-300 leading-relaxed">
            Predictions lock <strong className="text-red-400">10 minutes before kickoff</strong>. After
            that, no changes are allowed for that match.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">3. Scoring</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/20 text-slate-300">
                  <th className="text-left px-5 py-4 font-semibold">Outcome</th>
                  <th className="text-right px-5 py-4 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">Exact score</td>
                  <td className="text-right px-5 py-4 font-bold text-blue-400 text-base">4</td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">Correct result + correct goal difference</td>
                  <td className="text-right px-5 py-4 font-bold text-blue-400 text-base">3</td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">Correct result only (win/draw/loss)</td>
                  <td className="text-right px-5 py-4 font-bold text-blue-400 text-base">2</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 text-slate-400">Wrong result</td>
                  <td className="text-right px-5 py-4 font-bold text-slate-400 text-base">0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            <span className="text-blue-400 font-semibold">Example:</span> match ends 3-1. You guessed 2-0 → correct result (home
            win) and correct goal difference (2) → <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">3 points</strong>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-white">4. Leaderboard tiebreaker</h2>
          <p className="text-slate-300 leading-relaxed">
            If two players are tied on total points, rankings are currently
            ordered by total points only. Additional tiebreaker rules may be
            added later.
          </p>
        </section>

        <Link
          href="/dashboard"
          className="inline-block mt-4 px-6 py-3 rounded-xl bg-slate-900/60 border border-blue-300/30 text-white text-sm font-bold hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 transition-all shadow-sm"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
