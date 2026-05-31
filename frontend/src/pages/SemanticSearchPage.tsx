import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchService, type SearchResult } from '@/services/searchService';

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_SCHEDULED: 'Appointment scheduled',
  APPOINTMENT_UPDATED:   'Appointment updated',
  APPOINTMENT_COMPLETED: 'Appointment completed',
  APPOINTMENT_CANCELLED: 'Appointment cancelled',
  RESULT_CREATED:        'Result created',
  RESULT_UPDATED:        'Result updated',
};

const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT_SCHEDULED: 'bg-blue-100 text-blue-800',
  APPOINTMENT_UPDATED:   'bg-yellow-100 text-yellow-800',
  APPOINTMENT_COMPLETED: 'bg-green-100 text-green-800',
  APPOINTMENT_CANCELLED: 'bg-red-100 text-red-800',
  RESULT_CREATED:        'bg-purple-100 text-purple-800',
  RESULT_UPDATED:        'bg-orange-100 text-orange-800',
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function ResultCard({ item }: { item: SearchResult }) {
  const { activity, score } = item;
  const patient = activity.snapshot.patient;

  return (
    <div className="rounded-md border p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[activity.type] ?? 'bg-muted text-muted-foreground'}`}
          >
            {TYPE_LABELS[activity.type] ?? activity.type}
          </span>
          {patient && (
            <span className="text-sm font-medium">
              {patient.fullName}
              {patient.code != null && (
                <span className="ml-1 font-mono text-xs text-muted-foreground">HC-{patient.code}</span>
              )}
            </span>
          )}
        </div>
        <ScoreBar score={score} />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{activity.generatedText}</p>

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
        <p className="text-muted-foreground">Search patient history using natural language</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. paciente con dolor abdominal crónico…"
          className="flex-1"
        />
        <Button type="submit" disabled={mutation.isPending || !query.trim()} className="gap-2">
          {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Search
        </Button>
      </form>

      {mutation.isError && (
        <p className="text-sm text-destructive mb-4">Search failed. Make sure OpenAI is configured.</p>
      )}

      {mutation.data && mutation.data.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No results found.</p>
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
