import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SHORTCUTS = [
  ['j', 'Next item'],
  ['o', 'Open source link'],
  ['/', 'Focus search'],
  ['k', 'Toggle this dialog'],
  ['Esc', 'Close overlay'],
];

export default function ShortcutsModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-[14px]">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-sidebar-border">
          {SHORTCUTS.map(([key, desc]) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 text-[12.5px]"
            >
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="min-w-[28px] rounded border border-sidebar-border bg-secondary px-1.5 py-0.5 text-center font-mono text-[11px] text-foreground">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
