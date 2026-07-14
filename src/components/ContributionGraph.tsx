"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import type { SessionRecord } from "./session-provider";

type ContributionGraphProps = {
  records: SessionRecord[];
};

function localDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ContributionGraph({ records }: ContributionGraphProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const counts = records.reduce<Record<string, number>>((result, record) => {
    const key = localDateKey(record.completedAt);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <section className="contribution-card">
      <div className="dashboard-section-heading">
        <div><span>Contribution calendar</span><h2>{monthLabel}</h2></div>
        <CalendarBlank size={28} weight="light" />
      </div>
      <div className="weekday-row" aria-hidden="true">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
      </div>
      <div className="contribution-grid" role="grid" aria-label={`Completed focus sessions in ${monthLabel}`}>
        {Array.from({ length: firstWeekday }).map((_, index) => <span className="contribution-spacer" key={`spacer-${index}`} />)}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(year, month, day);
          const count = counts[localDateKey(date)] ?? 0;
          const level = Math.min(4, count);
          return (
            <span
              className={`contribution-cell level-${level}`}
              role="gridcell"
              key={day}
              aria-label={`${date.toLocaleDateString()}: ${count} completed ${count === 1 ? "session" : "sessions"}`}
              title={`${date.toLocaleDateString()}: ${count} completed ${count === 1 ? "session" : "sessions"}`}
            >
              <span>{day}</span>
            </span>
          );
        })}
      </div>
      <div className="contribution-legend"><span>0</span><i className="level-0" /><i className="level-1" /><i className="level-2" /><i className="level-3" /><i className="level-4" /><span>4+</span></div>
    </section>
  );
}

