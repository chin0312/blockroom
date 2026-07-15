"use client";

import { useMemo, useState } from "react";
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { getRoom } from "@/lib/rooms";
import type { SessionRecord } from "./session-provider";

const DAY_SECONDS = 24 * 60 * 60;

type ContributionGraphProps = {
  records: SessionRecord[];
};

type MonthCursor = {
  year: number;
  month: number;
};

function localDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function shiftMonth(cursor: MonthCursor, amount: number): MonthCursor {
  const shifted = new Date(cursor.year, cursor.month + amount, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function ContributionGraph({ records }: ContributionGraphProps) {
  const today = new Date();
  const currentMonth = {
    year: today.getFullYear(),
    month: today.getMonth(),
  };
  const [visibleMonth, setVisibleMonth] = useState<MonthCursor>(currentMonth);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const recordsByDay = useMemo(() => {
    const grouped = new Map<string, SessionRecord[]>();
    records.forEach((record) => {
      const key = localDateKey(record.completedAt);
      grouped.set(key, [...(grouped.get(key) ?? []), record]);
    });
    grouped.forEach((dayRecords) => {
      dayRecords.sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      );
    });
    return grouped;
  }, [records]);

  const monthDate = new Date(visibleMonth.year, visibleMonth.month, 1);
  const daysInMonth = new Date(
    visibleMonth.year,
    visibleMonth.month + 1,
    0,
  ).getDate();
  const firstWeekday = monthDate.getDay();
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(monthDate);
  const isCurrentMonth =
    visibleMonth.year === currentMonth.year &&
    visibleMonth.month === currentMonth.month;

  const selectedRecords = selectedDateKey
    ? recordsByDay.get(selectedDateKey) ?? []
    : [];
  const selectedTotalSeconds = selectedRecords.reduce(
    (total, record) => total + record.durationSeconds,
    0,
  );
  const selectedDate = selectedDateKey
    ? new Date(
        Number(selectedDateKey.slice(0, 4)),
        Number(selectedDateKey.slice(5, 7)) - 1,
        Number(selectedDateKey.slice(8, 10)),
      )
    : null;

  function navigateMonth(amount: number) {
    setVisibleMonth((cursor) => shiftMonth(cursor, amount));
    setSelectedDateKey(null);
  }

  function returnToCurrentMonth() {
    setVisibleMonth(currentMonth);
    setSelectedDateKey(null);
  }

  return (
    <section className="contribution-card">
      <div className="contribution-heading">
        <div className="dashboard-section-heading contribution-title">
          <div>
            <span>Contribution calendar</span>
            <h2>{monthLabel}</h2>
          </div>
          <CalendarBlank size={28} weight="light" />
        </div>
        <div className="calendar-controls" aria-label="Calendar navigation">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            aria-label="View previous month"
          >
            <CaretLeft size={17} weight="bold" />
          </button>
          {!isCurrentMonth && (
            <button type="button" className="calendar-today" onClick={returnToCurrentMonth}>
              This month
            </button>
          )}
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            disabled={isCurrentMonth}
            aria-label="View next month"
          >
            <CaretRight size={17} weight="bold" />
          </button>
        </div>
      </div>

      <div className="weekday-row" aria-hidden="true">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div
        className="contribution-grid"
        role="grid"
        aria-label={`Recorded focus time in ${monthLabel}`}
      >
        {Array.from({ length: firstWeekday }).map((_, index) => (
          <span className="contribution-spacer" key={`spacer-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(visibleMonth.year, visibleMonth.month, day);
          const dateKey = localDateKey(date);
          const dayRecords = recordsByDay.get(dateKey) ?? [];
          const totalSeconds = dayRecords.reduce(
            (total, record) => total + record.durationSeconds,
            0,
          );
          const ratio = Math.min(1, totalSeconds / DAY_SECONDS);
          const fillAlpha = totalSeconds > 0 ? 0.08 + ratio * 0.84 : 0.025;
          const borderAlpha = totalSeconds > 0 ? 0.16 + ratio * 0.7 : 0.08;
          const isSelected = selectedDateKey === dateKey;
          const ariaDuration = totalSeconds > 0 ? formatDuration(totalSeconds) : "no recorded time";

          return (
            <button
              type="button"
              className="contribution-cell"
              role="gridcell"
              key={day}
              aria-selected={isSelected}
              aria-label={`${date.toLocaleDateString()}: ${ariaDuration}, ${dayRecords.length} saved ${dayRecords.length === 1 ? "session" : "sessions"}`}
              title={`${date.toLocaleDateString()}: ${ariaDuration}`}
              onClick={() => setSelectedDateKey(dateKey)}
              style={{
                backgroundColor: `rgba(118, 103, 247, ${fillAlpha})`,
                borderColor: `rgba(118, 103, 247, ${borderAlpha})`,
                color: ratio >= 0.48 ? "white" : undefined,
              }}
            >
              <span>{day}</span>
              {totalSeconds > 0 && <i aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="contribution-scale" aria-label="Color scale from zero to 24 recorded hours">
        <span>0h</span>
        <i />
        <span>24h</span>
      </div>

      <div className="calendar-day-detail" aria-live="polite">
        {!selectedDate ? (
          <div className="calendar-detail-empty">
            <ClockCounterClockwise size={24} weight="light" />
            <div>
              <strong>Select a day</strong>
              <p>Open any calendar cell to inspect its real saved sessions.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="calendar-detail-summary">
              <div>
                <span>
                  {new Intl.DateTimeFormat(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }).format(selectedDate)}
                </span>
                <strong>{formatDuration(selectedTotalSeconds)}</strong>
              </div>
              <p>
                {selectedRecords.length} saved {selectedRecords.length === 1 ? "session" : "sessions"}
              </p>
            </div>
            {selectedRecords.length === 0 ? (
              <p className="calendar-no-records">No completed sessions were saved on this day.</p>
            ) : (
              <div className="calendar-record-list">
                {selectedRecords.map((record) => (
                  <article key={record.id}>
                    <span className="calendar-record-signal" aria-hidden="true" />
                    <div>
                      <strong>{getRoom(record.roomSlug)?.name ?? "Room session"}</strong>
                      <p>
                        Saved {new Intl.DateTimeFormat(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(record.completedAt))}
                      </p>
                    </div>
                    <strong>{formatDuration(record.durationSeconds)}</strong>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
