"""
Observability for pipeline phases.

Wrap a phase entrypoint in `with track_run('phase') as run:` to:
  - record a row in pipeline_runs on entry (status='running')
  - update it on exit with succeeded/skipped + counts
  - update it with failed + error message on exception (then re-raise)

The yielded dict is mutable; the caller sets keys as the phase makes progress:
  run['input_count'] = 12
  run['output_count'] = 3
  run['status'] = 'skipped'   # opt-in escape hatch for empty queues
  run['metadata'] = {'week_start': '2026-04-21'}
"""
from contextlib import contextmanager
from datetime import datetime, timezone

from db import supabase


@contextmanager
def track_run(phase: str, dry_run: bool = False):
    inserted = supabase.table('pipeline_runs').insert({
        'phase': phase,
        'status': 'running',
    }).execute()
    run_id = inserted.data[0]['id']

    state: dict = {}
    try:
        yield state
    except Exception as exc:
        metadata = dict(state.get('metadata', {}))
        if dry_run:
            metadata['dry_run'] = True
        update = {
            'status': 'failed',
            'error_message': str(exc)[:2000],
            'finished_at': datetime.now(timezone.utc).isoformat(),
        }
        if metadata:
            update['metadata'] = metadata
        supabase.table('pipeline_runs').update(update).eq('id', run_id).execute()
        raise

    # Success path. Caller may override status to 'skipped'.
    update = {
        'status': state.get('status', 'succeeded'),
        'finished_at': datetime.now(timezone.utc).isoformat(),
    }
    for key in ('input_count', 'output_count'):
        if key in state:
            update[key] = state[key]
    metadata = dict(state.get('metadata', {}))
    if dry_run:
        metadata['dry_run'] = True
    if metadata:
        update['metadata'] = metadata
    supabase.table('pipeline_runs').update(update).eq('id', run_id).execute()
