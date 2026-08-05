import Link from "next/link";

const THEME = {
  darkBlue: '#0f172a',
  darkBlue2: '#111c34',
  darkBlue3: '#172554',
  border: '#243b63',
  text: '#f8fafc',
  mutedText: '#cbd5e1',
};

export default function HowItWorks() {
  return (
    <div
      style={{ background: THEME.darkBlue, minHeight: '100vh', color: THEME.text }}
      className="px-4 py-10 md:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">How to Play</h1>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">1. Submit a prediction</h2>
          <p style={{ color: THEME.mutedText }}>
            Go to the <strong>Make Predictions</strong> page, guess the score
            for a match, and hit save. You&apos;ll see a &quot;Prediction
            saved&quot; message confirming it went through. Predictions can
            be changed as many times as you like until the deadline.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">2. Deadline</h2>
          <p style={{ color: THEME.mutedText }}>
            Predictions lock <strong>10 minutes before kickoff</strong>. After
            that, no changes are allowed for that match.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">3. Scoring</h2>
          <div
            style={{ background: THEME.darkBlue2, border: `1px solid ${THEME.border}` }}
            className="rounded-xl overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th className="text-left px-4 py-3">Outcome</th>
                  <th className="text-right px-4 py-3">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td className="px-4 py-3">Exact score</td>
                  <td className="text-right px-4 py-3 font-bold">4</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td className="px-4 py-3">Correct result + correct goal difference</td>
                  <td className="text-right px-4 py-3 font-bold">3</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td className="px-4 py-3">Correct result only (win/draw/loss)</td>
                  <td className="text-right px-4 py-3 font-bold">2</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Wrong result</td>
                  <td className="text-right px-4 py-3 font-bold">0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: THEME.mutedText }} className="mt-3 text-sm">
            Example: match ends 3-1. You guessed 2-0 → correct result (home
            win) and correct goal difference (2) → <strong>3 points</strong>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">4. Leaderboard tiebreaker</h2>
          <p style={{ color: THEME.mutedText }}>
            If two players are tied on total points, rankings are currently
            ordered by total points only. Additional tiebreaker rules may be
            added later.
          </p>
        </section>

        <Link
          href="/dashboard"
          style={{
            background: THEME.darkBlue3,
            border: `1px solid ${THEME.border}`,
            color: THEME.text,
          }}
          className="inline-block px-5 py-3 rounded-xl text-sm font-bold hover:border-blue-400 hover:bg-blue-900/40 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
