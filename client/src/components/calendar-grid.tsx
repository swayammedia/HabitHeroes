import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { format } from "date-fns";

interface CalendarGridProps {
  completions: Date[];
  onComplete: () => void;
}

export default function CalendarGrid({ completions, onComplete }: CalendarGridProps) {
  // Get current month's days
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const currentMonth = format(today, 'MMMM yyyy');

  // Format date to YYYY-MM-DD for comparison
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const completedDays = completions.map(date => formatDate(new Date(date)));
  const todayStr = formatDate(today);

  // Check if today is completed
  const isCompletedToday = completedDays.includes(todayStr);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">{currentMonth}</h3>
        <button
          onClick={onComplete}
          disabled={isCompletedToday}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isCompletedToday ? "Completed Today" : "Done Task Today"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-xs text-center font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {/* Add empty cells for correct day alignment */}
        {Array.from({ length: new Date(today.getFullYear(), today.getMonth(), 1).getDay() - 1 }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const currentDate = new Date(today.getFullYear(), today.getMonth(), day);
          const dateStr = formatDate(currentDate);
          const isCompleted = completedDays.includes(dateStr);

          return (
            <div
              key={day}
              className={cn(
                "aspect-square rounded-sm p-1 text-xs relative",
                "bg-muted hover:bg-muted/80",
                "flex items-center justify-center",
                isCompleted && "bg-emerald-100 text-emerald-900"
              )}
            >
              <span className="z-10">{day}</span>
              {isCompleted && (
                <Check className="w-3 h-3 text-emerald-600 absolute" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}