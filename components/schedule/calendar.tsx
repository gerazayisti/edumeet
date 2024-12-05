"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: "assignment" | "class" | "meeting";
  description?: string;
  duration?: string;
}

interface CalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

export function Calendar({ events, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const renderEventDot = (type: Event["type"]) => {
    const colors = {
      assignment: "bg-blue-500",
      class: "bg-green-500",
      meeting: "bg-purple-500",
    };

    return <div className={`w-2 h-2 rounded-full ${colors[type]} mx-0.5`} />;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium bg-background"
          >
            {day}
          </div>
        ))}

        {days.map((day, dayIdx) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <HoverCard key={day.toString()} openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  className={`
                    min-h-[100px] p-2 relative bg-background
                    hover:bg-accent transition-colors
                    ${!isCurrentMonth && "text-muted-foreground"}
                    ${dayEvents.length > 0 && "cursor-pointer"}
                  `}
                  onMouseEnter={() => setHoveredDate(day)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <span className="absolute top-2 right-2 text-sm">
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex">
                      {dayEvents.slice(0, 3).map((event) => renderEventDot(event.type))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs ml-1">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              </HoverCardTrigger>
              {dayEvents.length > 0 && (
                <HoverCardContent
                  className="w-80"
                  align="start"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {format(day, "EEEE, MMMM d")}
                    </p>
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => onEventClick?.(event)}
                        >
                          <div className="flex items-center gap-2">
                            {renderEventDot(event.type)}
                            <span className="font-medium">{event.title}</span>
                          </div>
                          {event.duration && (
                            <p className="text-sm text-muted-foreground ml-6">
                              {event.duration}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-sm text-muted-foreground ml-6">
                              {event.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </HoverCardContent>
              )}
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
}