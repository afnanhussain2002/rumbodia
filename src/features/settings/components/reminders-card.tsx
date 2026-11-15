"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { notificationsSupported, useReminderPrefs } from "@/features/settings/hooks/use-reminders";

const noop = () => () => {};

export function RemindersCard() {
  const [prefs, update] = useReminderPrefs();
  const supported = useSyncExternalStore(noop, notificationsSupported, () => true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const browserPermission = useSyncExternalStore(
    noop,
    () => (notificationsSupported() ? Notification.permission : "default"),
    () => "default" as NotificationPermission,
  );
  const current = permission ?? browserPermission;

  async function enable() {
    if (!supported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") update({ enabled: true });
  }

  return (
    <Card aria-labelledby="reminders-title">
      <CardHeader
        title="Reminders"
        titleId="reminders-title"
        subtitle="Only works while Rumbodia is open in a browser tab."
      />
      {!supported ? (
        <p className="text-[15px] text-ink-soft">This browser does not support notifications.</p>
      ) : current === "denied" ? (
        <p className="text-[15px] text-ink-soft">Notifications are blocked for this site. Allow them in your browser settings to use reminders.</p>
      ) : !prefs.enabled ? (
        <Button variant="secondary" icon={<Bell size={18} aria-hidden />} onClick={enable}>
          Turn on reminders
        </Button>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {prefs.times.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`reminder-${i}`}>
                  Reminder {i + 1}
                </label>
                <input
                  id={`reminder-${i}`}
                  type="time"
                  value={t}
                  onChange={(e) => {
                    if (!/^\d{2}:\d{2}$/.test(e.target.value)) return;
                    update({ times: prefs.times.map((x, j) => (j === i ? e.target.value : x)) });
                  }}
                  className="h-11 rounded-[12px] border border-line bg-card px-3 text-[16px] tabular"
                />
                <IconButton label={`Remove reminder ${t}`} onClick={() => update({ times: prefs.times.filter((_, j) => j !== i) })}>
                  <Trash2 size={18} aria-hidden />
                </IconButton>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {prefs.times.length < 4 && (
              <Button variant="secondary" size="sm" icon={<Plus size={16} aria-hidden />} onClick={() => update({ times: [...prefs.times, "18:00"] })}>
                Add a time
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => update({ enabled: false })}>
              Turn off
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
