import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  FileText,
  Trophy,
  TrendingUp,
  Calendar,
  Moon,
  Sun,
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  subject: string;
  duration: number;
  totalQuestions: number;
  dueDate: string;
  status: 'available' | 'in_progress' | 'completed' | 'missed';
  score?: number;
  attempts?: number;
  maxAttempts: number;
}

interface CompletedQuiz {
  id: string;
  title: string;
  subject: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  warnings: number;
}

interface Stat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StudentDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
  }, []);

  useEffect(() => {
    // Save dark mode preference to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Mock data - replace with real API calls
  const [availableQuizzes] = useState<Quiz[]>([
    {
      id: '1',
      title: 'Mathematics Mid-Term Exam',
      subject: 'Mathematics',
      duration: 60,
      totalQuestions: 50,
      dueDate: '2025-11-20',
      status: 'available',
      attempts: 0,
      maxAttempts: 1,
    },
    {
      id: '2',
      title: 'Physics Quiz - Chapter 5',
      subject: 'Physics',
      duration: 30,
      totalQuestions: 25,
      dueDate: '2025-11-19',
      status: 'available',
      attempts: 0,
      maxAttempts: 2,
    },
    {
      id: '3',
      title: 'Chemistry Lab Assessment',
      subject: 'Chemistry',
      duration: 45,
      totalQuestions: 30,
      dueDate: '2025-11-22',
      status: 'in_progress',
      attempts: 1,
      maxAttempts: 1,
    },
  ]);

  const [completedQuizzes] = useState<CompletedQuiz[]>([
    {
      id: '1',
      title: 'Biology Quiz - Cell Structure',
      subject: 'Biology',
      score: 42,
      totalQuestions: 50,
      completedAt: '2025-11-15',
      warnings: 0,
    },
    {
      id: '2',
      title: 'History Assignment',
      subject: 'History',
      score: 38,
      totalQuestions: 40,
      completedAt: '2025-11-14',
      warnings: 1,
    },
    {
      id: '3',
      title: 'English Literature Quiz',
      subject: 'English',
      score: 45,
      totalQuestions: 50,
      completedAt: '2025-11-12',
      warnings: 0,
    },
  ]);

  const stats: Stat[] = [
    {
      label: 'Available Quizzes',
      value: availableQuizzes.filter(q => q.status === 'available').length,
      icon: <BookOpen className="w-5 h-5 text-blue-600" strokeWidth={2} />,
      color: 'blue',
    },
    {
      label: 'Completed',
      value: completedQuizzes.length,
      icon: <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={2} />,
      color: 'green',
    },
    {
      label: 'Average Score',
      value: `${Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score / q.totalQuestions * 100), 0) / completedQuizzes.length)}%`,
      icon: <Trophy className="w-5 h-5 text-purple-600" strokeWidth={2} />,
      color: 'purple',
    },
    {
      label: 'Total Warnings',
      value: completedQuizzes.reduce((sum, q) => sum + q.warnings, 0),
      icon: <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={2} />,
      color: 'red',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-200">Available</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded border border-yellow-200">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded border border-blue-200">Completed</span>;
      case 'missed':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-200">Missed</span>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Navbar */}
      <nav className={`${darkMode ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border-b px-8 py-4 shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: '"Playfair Display", serif', fontOpticalSizing: 'auto' }}>Scrutiny</h1>
          </div>    
          <div className="flex items-center gap-4">
            <button className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} font-medium transition-colors`}>
              Dashboard
            </button>
            <button className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} font-medium transition-colors`}>
              My Quizzes
            </button>
            <button className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} font-medium transition-colors`}>
              Results
            </button>
            <button className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} font-medium transition-colors`}>
              Schedule
            </button>
            <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <button 
              onClick={toggleDarkMode}
              className={`w-9 h-9 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full flex items-center justify-center transition-colors`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
            </button>
            <button className={`w-9 h-9 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full flex items-center justify-center transition-colors`}>
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>S</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-8 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} p-4 rounded-lg border h-32 flex flex-col justify-between`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                </div>
                <div className={`w-11 h-11 ${darkMode ? 'bg-gray-800' : `bg-${stat.color}-100`} rounded-lg flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Available Quizzes Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Available Quizzes</h2>
            <button className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium transition-colors`}>
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableQuizzes.map((quiz) => (
              <div key={quiz.id} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-lg border p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{quiz.title}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{quiz.subject}</p>
                  </div>
                  {getStatusBadge(quiz.status)}
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 mb-4 space-y-2`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock className="w-4 h-4" strokeWidth={2} />
                      Duration
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quiz.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <FileText className="w-4 h-4" strokeWidth={2} />
                      Questions
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quiz.totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" strokeWidth={2} />
                      Due Date
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(quiz.dueDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Attempts: {quiz.attempts}/{quiz.maxAttempts}
                  </span>
                  <span className={`text-xs font-medium ${getDaysRemaining(quiz.dueDate).includes('Overdue') || getDaysRemaining(quiz.dueDate).includes('today') ? 'text-red-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getDaysRemaining(quiz.dueDate)}
                  </span>
                </div>

                <button 
                  className={`w-full py-2.5 px-4 ${quiz.status === 'in_progress' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2`}
                  disabled={(quiz.attempts ?? 0) >= quiz.maxAttempts && quiz.status !== 'in_progress'}
                >
                  <Play className="w-4 h-4" strokeWidth={2} />
                  {quiz.status === 'in_progress' ? 'Resume Quiz' : 'Start Quiz'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Results</h2>
            <button className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium transition-colors`}>
              View All
            </button>
          </div>
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-lg border`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Quiz Title</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Subject</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Score</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Warnings</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Action</th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? 'divide-gray-800' : 'divide-gray-200'} divide-y`}>
                  {completedQuizzes.map((quiz) => (
                    <tr key={quiz.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{quiz.title}</td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{quiz.subject}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(quiz.score, quiz.totalQuestions)}`}>
                            {quiz.score}/{quiz.totalQuestions}
                          </span>
                          <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            ({Math.round((quiz.score / quiz.totalQuestions) * 100)}%)
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(quiz.completedAt)}</td>
                      <td className="px-6 py-4">
                        {quiz.warnings > 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                            {quiz.warnings}
                          </span>
                        ) : (
                          <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium transition-colors`}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
