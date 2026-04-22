import { useEffect, useState } from 'react';
import { API_URL } from '../config';
const API = API_URL;
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { Course } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CourseStats {
  course: Course;
  totalSessions: number;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  rate: number;
}

interface StudentStats {
  student_id: string;
  full_name: string;
  photo_url: string;
  student_code: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
  group_name: string;
}

export default function Reports() {
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [view, setView] = useState<'courses' | 'students'>('courses');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [coursesRes, sessionsRes, recordsRes, enrollRes] = await Promise.all([
        fetch(`${API}/api/courses`).then((r) => r.json()),
        fetch(`${API}/api/sessions`).then((r) => r.json()),
        fetch(`${API}/api/records`).then((r) => r.json()),
        fetch(`${API}/api/enrollments`).then((r) => r.json()),
      ]);

      const courseList = (coursesRes ?? []) as Course[];

      const sessions = sessionsRes ?? [];
      const records = recordsRes ?? [];
      const enrollments = enrollRes ?? [];

      const sessionsByCourse: Record<string, number> = {};
      sessions.forEach((s: { course_id: string }) => {
        sessionsByCourse[s.course_id] = (sessionsByCourse[s.course_id] ?? 0) + 1;
      });

      const enrolledByCourse: Record<string, number> = {};
      enrollments.forEach((e: { course_id: string }) => {
        enrolledByCourse[e.course_id] = (enrolledByCourse[e.course_id] ?? 0) + 1;
      });

      const stats: CourseStats[] = courseList.map((c) => {
        const courseRecords = records.filter(
          (r: { attendance_sessions?: { course_id?: string } }) => {
            const session = r.attendance_sessions;
            return session?.course_id === c.id;
          }
        );
        const present = courseRecords.filter(
          (r: { status: string }) => r.status === 'present'
        ).length;
        const absent = courseRecords.filter(
          (r: { status: string }) => r.status === 'absent'
        ).length;
        const late = courseRecords.filter((r: { status: string }) => r.status === 'late').length;
        const total = courseRecords.length;
        return {
          course: c,
          totalSessions: sessionsByCourse[c.id] ?? 0,
          totalEnrolled: enrolledByCourse[c.id] ?? 0,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      });
      setCourseStats(stats);

      const studentMap: Record<string, StudentStats> = {};
      records.forEach(
        (r: {
          student_id: string;
          status: string;
          students?: {
            full_name?: string;
            photo_url?: string;
            student_code?: string;
            group_name?: string;
          };
        }) => {
          if (!r.student_id) return;
          if (!studentMap[r.student_id]) {
            studentMap[r.student_id] = {
              student_id: r.student_id,
              full_name: r.students?.full_name ?? '',
              photo_url: r.students?.photo_url ?? '',
              student_code: r.students?.student_code ?? '',
              present: 0,
              absent: 0,
              late: 0,
              total: 0,
              rate: 0,
              group_name: r.students?.group_name ?? '',
            };
          }
          studentMap[r.student_id].total++;
          if (r.status === 'present') studentMap[r.student_id].present++;
          else if (r.status === 'absent') studentMap[r.student_id].absent++;
          else if (r.status === 'late') studentMap[r.student_id].late++;
        }
      );
      const sList = Object.values(studentMap)
        .map((s) => ({
          ...s,
          rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
        }))
        .sort((a, b) => a.rate - b.rate);
      setStudentStats(sList);
    } catch (_e) {
      console.error('Erreur fetchData');
    } finally {
      setLoading(false);
    }
  }

  const overallRate = courseStats.length
    ? Math.round(courseStats.reduce((sum, s) => sum + s.rate, 0) / courseStats.length)
    : 0;

  const maxPresent = Math.max(...courseStats.map((s) => s.presentCount), 1);

  const getRateColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const getRateBar = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-400';
    if (rate >= 60) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const filteredStudents = studentStats.filter(
    (s) => filterGroup === 'ALL' || s.group_name === filterGroup
  );

  const groups = ['ALL', ...new Set(studentStats.map((s) => s.group_name).filter(Boolean))].sort();

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();

      // Fetch alerts to build "Liste Rouge"
      const res = await fetch(`${API}/api/alerts`);
      const alertsData = res.ok ? await res.json() : [];

      interface CriticalAlert {
        status: string;
        absence_count: number;
        threshold: number;
        students?: { full_name?: string; student_code?: string };
        courses?: { name?: string };
      }

      const criticalAlerts = (alertsData as CriticalAlert[]).filter(
        (a) => a.status === 'active' || a.absence_count >= a.threshold
      );

      // Title
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("Rapport d'Assiduite Global", 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date de generation: ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
      doc.text(`Taux global de l'etablissement: ${overallRate}%`, 14, 34);

      // Section 1: Liste Rouge (Alertes)
      if (criticalAlerts.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(220, 38, 38); // Red
        doc.text("LISTE ROUGE - ALERTES D'ABSENTEISME", 14, 48);
        doc.setTextColor(0, 0, 0);

        const alertRows = criticalAlerts.map((a) => [
          a.students?.full_name || 'Inconnu',
          a.students?.student_code || 'N/A',
          a.courses?.name || 'N/A',
          `${a.absence_count} / ${a.threshold}`,
          a.status === 'active' ? 'Critique' : a.status,
        ]);

        autoTable(doc, {
          startY: 53,
          head: [['Etudiant', 'Code', 'Cours', 'Absences / Seuil', 'Statut']],
          body: alertRows,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] },
          styles: { fontSize: 9 },
        });
      }

      // Section 2: Bilan par Cours
      const docWithTable = doc as unknown as { lastAutoTable: { finalY: number } };
      let nextY = docWithTable.lastAutoTable ? docWithTable.lastAutoTable.finalY + 15 : 48;
      if (nextY > 250) {
        doc.addPage();
        nextY = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('BILAN PAR COURS', 14, nextY);

      const courseRows = courseStats.map((s) => [
        s.course.name,
        s.course.teacher_name,
        `${s.presentCount}`,
        `${s.absentCount}`,
        `${s.rate}%`,
      ]);

      autoTable(doc, {
        startY: nextY + 5,
        head: [['Module', 'Professeur', 'Presences', 'Absences', 'Taux']],
        body: courseRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
      });

      // Section 3: Liste complete (Students)
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('INVENTAIRE DES ETUDIANTS', 14, 20);

      const studentRows = studentStats.map((s) => [
        s.full_name,
        s.student_code,
        s.group_name || 'N/A',
        `${s.present}`,
        `${s.absent}`,
        `${s.late}`,
        `${s.rate}%`,
      ]);

      autoTable(doc, {
        startY: 25,
        head: [['Nom Complet', 'Matricule', 'Groupe', 'Presents', 'Absents', 'Retards', 'Taux']],
        body: studentRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 },
      });

      // Signatures
      const finalY = docWithTable.lastAutoTable.finalY + 30;
      if (finalY < 270) {
        doc.setFontSize(10);
        doc.text("Signature de l'Administration :", 20, finalY);
        doc.text("Cachet de l'Etablissement :", 130, finalY);
      }

      // Save
      doc.save(`rapport_assiduite_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (_e) {
      console.error('Erreur lors de la generation du PDF');
      alert('Erreur lors de la génération du rapport PDF.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-slate-500 text-xs mb-2">Taux Moyen de Présence</p>
          <p className={`text-4xl font-bold ${getRateColor(overallRate)}`}>{overallRate}%</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {overallRate >= 70 ? (
              <TrendingUp size={14} className="text-emerald-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs ${overallRate >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
              {overallRate >= 70 ? 'Satisfaisant' : 'À améliorer'}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-slate-500 text-xs mb-2">Total Sessions</p>
          <p className="text-4xl font-bold text-slate-800">
            {courseStats.reduce((s, c) => s + c.totalSessions, 0)}
          </p>
          <p className="text-slate-400 text-xs mt-2">Sur tous les cours</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-slate-500 text-xs mb-2">Total Enregistrements</p>
          <p className="text-4xl font-bold text-slate-800">
            {courseStats.reduce((s, c) => s + c.presentCount + c.absentCount + c.lateCount, 0)}
          </p>
          <p className="text-slate-400 text-xs mt-2">Présences & absences</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView('courses')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-all font-medium ${view === 'courses' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Par Cours
            </button>
            <button
              onClick={() => setView('students')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-all font-medium ${view === 'students' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Par Étudiant
            </button>
          </div>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
          >
            <Download size={14} />
            Télécharger Rapport PDF
          </button>
        </div>

        {/* Group Tabs (Only for Student View) */}
        {view === 'students' && groups.length > 1 && (
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-50/50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setFilterGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterGroup === group
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {group === 'ALL' ? 'Tous les Groupes' : `Groupe ${group}`}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'courses' ? (
          <div className="p-5 space-y-4">
            {courseStats.map((s) => (
              <div key={s.course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{s.course.name}</p>
                      <p className="text-slate-400 text-xs">
                        {s.course.teacher_name} · {s.totalSessions} sessions · {s.totalEnrolled}{' '}
                        étudiants
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getRateColor(s.rate)}`}>{s.rate}%</p>
                    <p className="text-slate-400 text-xs">{s.presentCount} présents</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-700"
                      style={{
                        width: `${maxPresent > 0 ? (s.presentCount / maxPresent) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all duration-700"
                      style={{ width: `${maxPresent > 0 ? (s.lateCount / maxPresent) * 100 : 0}%` }}
                    />
                    <div
                      className="h-full bg-red-400 transition-all duration-700"
                      style={{
                        width: `${maxPresent > 0 ? (s.absentCount / maxPresent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {s.presentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {s.lateCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      {s.absentCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Étudiant
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                    Présences
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                    Absences
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                    Retards
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Taux
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            s.photo_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(s.full_name)}&background=3b82f6&color=fff&size=36`
                          }
                          alt={s.full_name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{s.full_name}</p>
                          <p className="text-slate-400 text-xs">{s.student_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-emerald-600 font-semibold text-sm">{s.present}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-red-500 font-semibold text-sm">{s.absent}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-amber-600 font-semibold text-sm">{s.late}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-base font-bold ${getRateColor(s.rate)}`}>
                        {s.rate}%
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getRateBar(s.rate)} rounded-full transition-all duration-700`}
                          style={{ width: `${s.rate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
