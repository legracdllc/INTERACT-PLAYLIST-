import { StudentAvatarRenderer } from "@/components/student-avatar-renderer";
import type { PlaylistWinner } from "@/lib/playlist-podium";

export function PlaylistPodium({
  winners,
  title = "Playlist Winners",
}: {
  winners: PlaylistWinner[];
  title?: string;
}) {
  return (
    <section className="panel panel-playful p-5">
      <div className="math-corner-doodles" aria-hidden="true" />
      <p className="poster-ribbon">GA3 Winners</p>
      <h3 className="mt-3 font-display text-2xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">Ranked by completion, score, and submitted show-your-work evidence.</p>

      {winners.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {winners.map((winner) => (
            <article key={winner.studentId} className={`podium-card podium-rank-${winner.rank}`}>
              <p className="podium-rank">#{winner.rank}</p>
              <div className="podium-stage">
                <div className="podium-spotlight" aria-hidden="true" />
                <div className={`podium-pedestal podium-pedestal-${winner.rank}`}>
                  <span className="podium-pedestal-top" />
                  <span className="podium-pedestal-front" />
                </div>
                <div className="podium-avatar-wrap">
                  <StudentAvatarRenderer avatar={winner.avatar} size="md" showLabel />
                </div>
              </div>
              <p className="mt-3 text-center font-display text-xl font-bold">{winner.name}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>Levels done: <strong>{winner.completedItems}</strong></p>
                <p>Show work: <strong>{winner.evidenceCount}</strong></p>
                <p>Total score: <strong>{winner.totalScore}</strong></p>
                <p>Finish time: <strong>{winner.finishTimeLabel}</strong></p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="poster-empty-state mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Podium Waiting</p>
          <p className="mt-2 font-display text-xl font-black text-slate-900">No winners yet.</p>
          <p className="mt-1 text-sm text-slate-600">Complete playlist levels, submit show-your-work links, and earn scores to claim the top three spots.</p>
        </div>
      )}
    </section>
  );
}
