import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Calendar, Clock, MapPin, User as UserIcon } from 'lucide-react';

export const StudentTimetable: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  useEffect(() => {
    if (!student?.id) return;
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const data = await api.getStudentTimetable(student.id);
        setTimetable(data);
      } catch (err) {
        console.error('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [student?.id]);

  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter((t) => t.dayOfWeek === day);
    return acc;
  }, {} as Record<string, any[]>);

  const displayedDays = selectedDay === 'ALL' ? DAYS : [selectedDay];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Class Timetable & Lecture Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort: <span className="font-medium text-slate-700">{student?.class?.name || 'Assigned Class'}</span> • Academic Year 2024-2025
          </p>
        </div>

        {/* Day Selector Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
              selectedDay === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Week
          </button>
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2 py-1 rounded-sm font-medium transition-colors ${
                selectedDay === d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-md border border-slate-200">
          Loading timetable schedules...
        </div>
      ) : (
        <div className="space-y-4">
          {displayedDays.map((day) => {
            const slots = slotsByDay[day] || [];
            return (
              <div key={day} className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 tracking-wide uppercase">{day}</span>
                  <span className="text-xs text-slate-400 font-mono">{slots.length} periods scheduled</span>
                </div>

                {slots.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {slots.map((s) => (
                      <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/75 transition-colors">
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-sm shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{s.startTime} - {s.endTime}</span>
                          </div>

                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>{s.subject?.name}</span>
                              <span className="text-xs font-mono font-normal text-slate-400">({s.subject?.code})</span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3 text-slate-400" />
                                {s.teacher?.user?.fullName || 'Faculty Instructor'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {s.roomNumber}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">No lecture slots assigned for this day.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
