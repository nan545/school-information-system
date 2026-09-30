import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, RefreshCw, Users } from 'lucide-react';
import { api } from '../../services/api.ts';

export const StudentCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, currentEnrollments] = await Promise.all([
        api.getAvailableCourses(),
        api.getMyEnrollments(),
      ]);
      setCourses(catalog.courses);
      setAcademicYear(catalog.academicYear);
      setEnrollments(currentEnrollments);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load course information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeEnrollments = enrollments.filter((item) => item.status === 'ACTIVE');
  const enrolledCourseIds = new Set(activeEnrollments.map((item) => item.subjectId));

  const enroll = async (courseId: string) => {
    setPendingId(courseId);
    setNotice('');
    try {
      await api.enrollInCourse(courseId);
      setNotice('You are enrolled. A confirmation was added to your notifications.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to enroll in this course.');
    } finally {
      setPendingId('');
    }
  };

  const withdraw = async (enrollmentId: string) => {
    setPendingId(enrollmentId);
    setNotice('');
    try {
      await api.withdrawFromCourse(enrollmentId);
      setNotice('Your course withdrawal is confirmed.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to withdraw from this course.');
    } finally {
      setPendingId('');
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Student workspace</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
            <BookOpen className="h-5 w-5 text-blue-600" /> Courses &amp; enrollment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse current course offerings, manage your enrollment, and review past course status.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {notice && <div role="status" className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}
      {error && <div role="alert" className="flex flex-col gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline">Try again</button></div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Available courses</h2>
            <p className="text-xs text-slate-500">{academicYear?.name || 'No active academic year'}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{courses.length} courses</span>
        </div>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">No courses are available</p>
            <p className="mt-1 text-xs text-slate-500">Please check back when the next academic year is opened.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const canEnroll = course.enrollmentOpen && course.availableSeats > 0 && !isEnrolled;
              const teachers = [...new Set(course.teacherSubjects.map((item: any) => item.teacher?.user?.fullName).filter(Boolean))];
              return (
                <article key={course.id} className="flex flex-col justify-between rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold leading-snug text-slate-900">{course.name}</p>
                        <p className="mt-1 font-mono text-xs text-blue-700">{course.code}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">{course.creditHours} credits</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{course.department?.name || 'General course'}</p>
                    {teachers.length > 0 && <p className="mt-1 text-xs text-slate-600">Instructor: {teachers.join(', ')}</p>}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" /> {course.enrolledCount}/{course.capacity} enrolled
                    </span>
                    {isEnrolled ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Enrolled</span>
                    ) : (
                      <button type="button" onClick={() => void enroll(course.id)} disabled={!canEnroll || !!pendingId} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                        {pendingId === course.id ? 'Enrolling…' : !course.enrollmentOpen ? 'Enrollment closed' : course.availableSeats === 0 ? 'Course full' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">My enrollment history</h2>
          <span className="text-xs text-slate-500">{enrollments.length} records</span>
        </div>
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
        ) : enrollments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-7 text-center text-sm text-slate-500">You haven’t enrolled in any courses yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {enrollments.map((enrollment) => (
              <li key={enrollment.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{enrollment.subject?.name || 'Course'} <span className="font-mono text-xs text-slate-500">({enrollment.subject?.code})</span></p>
                  <p className="mt-1 text-xs text-slate-500">{enrollment.class?.academicYear?.name || 'Academic year'} · {enrollment.class?.name || 'Class'}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${enrollment.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : enrollment.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    <Clock3 className="h-3.5 w-3.5" />{enrollment.status}
                  </span>
                  {enrollment.status === 'ACTIVE' && <button type="button" onClick={() => void withdraw(enrollment.id)} disabled={!!pendingId} className="text-xs font-semibold text-rose-700 hover:underline disabled:opacity-50">{pendingId === enrollment.id ? 'Withdrawing…' : 'Withdraw'}</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
