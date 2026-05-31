import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchService, type SearchResult } from '@/services/searchService';

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <p className="mt-0.5 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function ResultCard({ item }: { item: SearchResult }) {
  const { activity, score } = item;
  const { snapshot } = activity;
  const patient = snapshot.patient;
  const appt    = snapshot.appointment;

  return (
    <div className="rounded-md border p-4 space-y-3">
      {/* Header: patient + score */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
              Study Result
            </span>
            {patient && (
              <span className="text-sm font-medium">
                {patient.fullName}
                {patient.code != null && (
                  <span className="ml-1.5 font-mono text-xs text-muted-foreground">HC-{patient.code}</span>
                )}
              </span>
            )}
          </div>

          {/* Secondary meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {snapshot.doctor?.fullName && <span>{snapshot.doctor.fullName}</span>}
            {appt?.code != null && (
              <Link
                to={`/appointments/${appt.id}`}
                className="font-mono hover:underline hover:text-foreground transition-colors"
              >
                Appt #{appt.code}
              </Link>
            )}
            {appt?.studyType?.name && <span>{appt.studyType.name}</span>}
            {appt?.scheduledDate && (
              <span>{new Date(appt.scheduledDate).toLocaleDateString()}</span>
            )}
            {appt?.duration != null && <span>{appt.duration} min</span>}
          </div>
        </div>

        <ScoreBar score={score} />
      </div>

      {/* Appointment context */}
      {(appt?.reason || appt?.notes) && (
        <div className="space-y-1.5 border-t pt-2.5">
          <Field label="Reason" value={appt?.reason} />
          <Field label="Notes"  value={appt?.notes} />
        </div>
      )}

      {/* Result — always present */}
      <div className="space-y-1.5 border-t pt-2.5">
        <Field label="Findings"   value={snapshot.findings} />
        <Field label="Conclusion" value={snapshot.conclusion} />
      </div>

      <p className="text-xs text-muted-foreground">
        {new Date(activity.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

export function SemanticSearchPage() {
  const [query, setQuery] = useState('');

  const mutation = useMutation({
    mutationFn: (q: string) => searchService.search(q),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) mutation.mutate(query.trim());
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Semantic Search</h1>
        <p className="text-muted-foreground">Search clinical results using natural language</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. dolor abdominal crónico, hallazgos en hígado…"
          className="flex-1"
        />
        <Button type="submit" disabled={mutation.isPending || !query.trim()} className="gap-2">
          {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Search
        </Button>
      </form>

      {mutation.isError && (
        <p className="mb-4 text-sm text-destructive">Search failed. Make sure OpenAI is configured.</p>
      )}

      {mutation.data && mutation.data.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No results found.</p>
      )}

      {mutation.data && mutation.data.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{mutation.data.length} result(s)</p>
          {mutation.data.map((item) => (
            <ResultCard key={item.activity.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
