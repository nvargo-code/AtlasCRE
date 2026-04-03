"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  type: "open_house" | "showing" | "milestone" | "close";
  title: string;
  subtitle: string;
  date: string;
  time?: string;
  status: string;
  link?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    const allEvents: CalendarEvent[] = [];

    // Fetch open houses
    const ohRes = await fetch("/api/portal/open-houses");
    if (ohRes.ok) {
      const data = await ohRes.json();
      for (const oh of data.openHouses || []) {
        allEvents.push({
          id: `oh-${oh.id}`,
          type: "open_house",
          title: `Open House: ${oh.listing.address}`,
          subtitle: `${oh.startTime} — ${oh.endTime}`,
          date: oh.date,
          time: oh.startTime,
          status: oh.status,
        });
      }
    }

    // Fetch showings
    const shRes = await fetch("/api/portal/showings");
    if (shRes.ok) {
      const data = await shRes.json();
      for (const sh of data.showings || []) {
        if (sh.preferredDate) {
          allEvents.push({
            id: `sh-${sh.id}`,
            type: "showing",
            title: `Tour: ${sh.listing.address}`,
            subtitle: sh.client?.name || "Client",
            date: sh.preferredDate,
            time: sh.preferredTime || undefined,
            status: sh.status,
          });
        }
      }
    }

    // Fetch transactions with close dates
    const txRes = await fetch("/api/portal/transactions");
    if (txRes.ok) {
      const data = await txRes.json();
      for (const tx of data.transactions || []) {
        if (tx.closeDate) {
          allEvents.push({
            id: `tx-${tx.id}`,
            type: "close",
            title: `Closing: ${tx.propertyAddress}`,
            subtitle: tx.contractPrice ? `$${Number(tx.contractPrice).toLocaleString()}` : "",
            date: tx.closeDate,
            status: tx.status,
            link: "/portal/transactions",
          });
        }
        // Milestone due dates
        for (const ms of tx.milestones || []) {
          if (ms.dueDate && ms.status !== "completed") {
            allEvents.push({
              id: `ms-${ms.id}`,
              type: "milestone",
              title: `${ms.name}: ${tx.propertyAddress}`,
              subtitle: "Due",
              date: ms.dueDate,
              status: ms.status,
              link: "/portal/transactions",
            });
          }
        }
      }
    }

    // Sort by date
    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setEvents(allEvents);
    setLoading(false);
  }

  // Generate week days
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
    open_house: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
    showing: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    milestone: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    close: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  };

  if (loading) {
    return <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
          <h1 className="text-2xl md:text-3xl font-light text-navy">
            <span className="font-semibold">Calendar</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 text-navy/40 hover:text-navy">&larr;</button>
          <button onClick={() => setWeekOffset(0)} className="text-[11px] font-semibold tracking-wider uppercase text-gold px-3 py-1">Today</button>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 text-navy/40 hover:text-navy">&rarr;</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6">
        {[
          { type: "open_house", label: "Open House" },
          { type: "showing", label: "Showing" },
          { type: "milestone", label: "Milestone" },
          { type: "close", label: "Closing" },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-1.5 text-[10px] text-mid-gray">
            <div className={`w-2 h-2 rounded-full ${typeColors[item.type].dot}`} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-px bg-navy/10 border border-navy/10">
        {/* Day headers */}
        {weekDays.map((day) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={day.toISOString()} className={`p-3 text-center ${isToday ? "bg-gold/5" : "bg-warm-gray"}`}>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className={`text-lg font-bold ${isToday ? "text-gold" : "text-navy"}`}>
                {day.getDate()}
              </p>
              <p className="text-[10px] text-mid-gray">
                {day.toLocaleDateString("en-US", { month: "short" })}
              </p>
            </div>
          );
        })}

        {/* Event cells */}
        {weekDays.map((day) => {
          const dayStr = day.toISOString().split("T")[0];
          const dayEvents = events.filter((e) => {
            const eDate = new Date(e.date).toISOString().split("T")[0];
            return eDate === dayStr;
          });

          return (
            <div key={`events-${day.toISOString()}`} className="bg-white min-h-[120px] p-2 space-y-1">
              {dayEvents.map((event) => {
                const colors = typeColors[event.type] || typeColors.showing;
                const Wrapper = event.link ? Link : "div";
                return (
                  <Wrapper
                    key={event.id}
                    href={event.link || "#"}
                    className={`block p-2 ${colors.bg} rounded text-[10px] leading-tight hover:opacity-80 transition-opacity`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
                      <span className={`font-semibold ${colors.text} truncate`}>{event.title}</span>
                    </div>
                    {event.time && <p className="text-mid-gray ml-2.5">{event.time}</p>}
                    <p className="text-mid-gray ml-2.5 truncate">{event.subtitle}</p>
                  </Wrapper>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Upcoming list */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-navy mb-4">Upcoming Events</h2>
        <div className="space-y-2">
          {events
            .filter((e) => new Date(e.date) >= today)
            .slice(0, 10)
            .map((event) => {
              const colors = typeColors[event.type] || typeColors.showing;
              return (
                <div key={event.id} className="bg-white border border-navy/10 p-4 flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">{event.title}</p>
                    <p className="text-[11px] text-mid-gray">{event.subtitle}</p>
                  </div>
                  <div className="text-right text-[11px] text-mid-gray flex-shrink-0">
                    <p>{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                    {event.time && <p>{event.time}</p>}
                  </div>
                </div>
              );
            })}
          {events.filter((e) => new Date(e.date) >= today).length === 0 && (
            <p className="text-mid-gray text-sm text-center py-8">No upcoming events.</p>
          )}
        </div>
      </div>
    </div>
  );
}
