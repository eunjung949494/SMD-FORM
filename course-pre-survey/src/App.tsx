import React, { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Database, Users, LayoutDashboard, FileSpreadsheet, Copy, Mail, Send, ExternalLink, RefreshCw, LogIn, LogOut, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BrowserRouter, Routes, Route, useParams, Link, Navigate } from 'react-router-dom';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy,
  User,
  deleteDoc,
  doc
} from './firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://wqinxfhgqfonyaphwwpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaW54ZmhncWZvbnlhcGh3d3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MDExMzYsImV4cCI6MjA5MTI3NzEzNn0.D2h5eLWznaTWTEdgn31c2Io2Kd2HGY01gLwYgcdX-E4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ChartSection = ({ data }: { data: any[] }) => {
  const jobData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(s => {
      const job = s.job || '미지정';
      counts[job] = (counts[job] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const aiUsageData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(s => {
      const usage = s.ai_usage || '미지정';
      counts[usage] = (counts[usage] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">직무별 응답 분포</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jobData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {jobData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">AI 사용 경험 비율</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={aiUsageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {aiUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {aiUsageData.map((entry, index) => (
            <div key={index} className="flex items-center text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {entry.name} ({entry.value})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string;
}

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    const state = (this as any).state;
    const props = (this as any).props;
    if (state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">문제가 발생했습니다</h2>
            <p className="text-gray-600 mb-6 text-sm">
              {state.errorInfo.includes('{') ? '데이터베이스 권한이 없거나 설정이 올바르지 않습니다.' : state.errorInfo}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return props.children;
  }
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type FormData = {
  q1_job: string;
  q1_job_other: string;
  q2_tools: string[];
  q2_tools_other: string;
  q3_frequency: string;
  q4_ai_usage: string;
  q5_ai_tools: string[];
  q5_ai_tools_other: string;
  q6_expectations: string;
  n8n_experience: string;
  n8n_usecase: string;
  n8n_level: string;
};

const INITIAL_DATA: FormData = {
  q1_job: '',
  q1_job_other: '',
  q2_tools: [],
  q2_tools_other: '',
  q3_frequency: '',
  q4_ai_usage: '',
  q5_ai_tools: [],
  q5_ai_tools_other: '',
  q6_expectations: '',
  n8n_experience: '',
  n8n_usecase: '',
  n8n_level: '',
};

const Logo = () => (
  <div className="flex items-center justify-center mb-6">
    <div className="text-2xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
      상미당 홀딩스
    </div>
  </div>
);

const SurveyForm = () => {
  const { courseId } = useParams();
  const isN8N = courseId === 'n8n';
  const courseName = isN8N ? 'N8N 자동화 과정' : '바이브 코딩 과정';
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Pre-fill from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const job = params.get('job');
    
    if (job) {
      const jobOptions = ['사무/행정', '마케팅/기획', '영업'];
      if (jobOptions.includes(job)) {
        setFormData(prev => ({ ...prev, q1_job: job }));
      } else {
        setFormData(prev => ({ ...prev, q1_job: '기타', q1_job_other: job }));
      }
    }
  }, []);

  const totalSteps = isN8N ? 4 : 3;

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.q1_job) newErrors.q1_job = '하시는 일을 선택해주세요.';
      if (formData.q1_job === '기타' && !formData.q1_job_other.trim()) {
        newErrors.q1_job_other = '기타 항목을 입력해주세요.';
      }

      if (formData.q2_tools.length === 0) newErrors.q2_tools = '사용하시는 프로그램을 1개 이상 선택해주세요.';
      if (formData.q2_tools.includes('기타') && !formData.q2_tools_other.trim()) {
        newErrors.q2_tools_other = '기타 항목을 입력해주세요.';
      }

      if (!formData.q3_frequency) newErrors.q3_frequency = '사용 빈도를 선택해주세요.';
    }

    if (currentStep === 2) {
      if (!formData.q4_ai_usage) newErrors.q4_ai_usage = 'AI 사용 경험을 선택해주세요.';
      
      if (formData.q5_ai_tools.length === 0) newErrors.q5_ai_tools = 'AI 서비스를 1개 이상 선택해주세요.';
      if (formData.q5_ai_tools.includes('기타') && !formData.q5_ai_tools_other.trim()) {
        newErrors.q5_ai_tools_other = '기타 항목을 입력해주세요.';
      }
    }

    if (currentStep === 3) {
      if (isN8N) {
        if (!formData.n8n_experience) newErrors.n8n_experience = 'n8n 사용 경험을 선택해주세요.';
        if (!formData.n8n_usecase.trim()) newErrors.n8n_usecase = '다루었으면 하는 실무 사례를 작성해주세요.';
        if (!formData.n8n_level) newErrors.n8n_level = '기대하는 활용 수준을 선택해주세요.';
      } else {
        if (!formData.q6_expectations.trim()) newErrors.q6_expectations = '기대하는 점을 입력해주세요.';
      }
    }

    if (currentStep === 4 && isN8N) {
      if (!formData.q6_expectations.trim()) newErrors.q6_expectations = '기대하는 점을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const path = 'vibe_survey';
      await addDoc(collection(db, path), {
        course_type: courseId || 'vibe',
        job: formData.q1_job === '기타' ? formData.q1_job_other : formData.q1_job,
        tools: formData.q2_tools.map(t => t === '기타' ? formData.q2_tools_other : t),
        frequency: formData.q3_frequency,
        ai_usage: formData.q4_ai_usage,
        ai_tools: formData.q5_ai_tools.map(t => t === '기타' ? formData.q5_ai_tools_other : t),
        expectations: formData.q6_expectations,
        n8n_experience: isN8N ? formData.n8n_experience : null,
        n8n_usecase: isN8N ? formData.n8n_usecase : null,
        n8n_level: isN8N ? formData.n8n_level : null,
        created_at: new Date().toISOString(),
      });
      
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError('설문 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleArrayItem = (field: 'q2_tools' | 'q5_ai_tools', item: string) => {
    setFormData((prev) => {
      const current = prev[field];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      
      if (errors[field]) {
        setErrors((e) => {
          const newE = { ...e };
          delete newE[field];
          return newE;
        });
      }
      
      return { ...prev, [field]: updated };
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <Logo />
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">설문 제출 완료</h2>
          <p className="text-gray-600 mb-8">
            {courseName} 사전 설문에 참여해 주셔서 감사합니다.<br/>
            보내주신 소중한 의견을 바탕으로 더 나은 과정을 준비하겠습니다.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <Logo />
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{courseName} 사전 설문조사</h1>
          <p className="text-gray-600">과정 진행을 위한 사전 설문입니다. 솔직한 답변 부탁드립니다.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span>{step}단계 / 총 {totalSteps}단계</span>
            <span>{Math.round((step / totalSteps) * 100)}% 완료</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <motion.div 
              className={cn("h-2.5 rounded-full", isN8N ? "bg-green-600" : "bg-blue-600")}
              initial={{ width: `${((step - 1) / totalSteps) * 100}%` }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-4">1단계: 기본 정보</h2>
                    
                    {/* Q1 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q1. 현재 어떤 일을 하고 계신가요? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {['사무/행정', '마케팅/기획', '영업', '기타'].map((option) => (
                          <label key={option} className={cn(
                            "flex items-center p-4 border rounded-xl cursor-pointer transition-colors",
                            formData.q1_job === option ? (isN8N ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50") : "border-gray-200 hover:bg-gray-50"
                          )}>
                            <input
                              type="radio"
                              name="q1_job"
                              value={option}
                              checked={formData.q1_job === option}
                              onChange={(e) => updateData('q1_job', e.target.value)}
                              className={cn("w-4 h-4 border-gray-300", isN8N ? "text-green-600 focus:ring-green-500" : "text-blue-600 focus:ring-blue-500")}
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {formData.q1_job === '기타' && (
                        <input
                          type="text"
                          placeholder="직접 입력해주세요"
                          value={formData.q1_job_other}
                          onChange={(e) => updateData('q1_job_other', e.target.value)}
                          className={cn("mt-2 block w-full rounded-xl border-gray-300 shadow-sm p-3 border", isN8N ? "focus:border-green-500 focus:ring-green-500" : "focus:border-blue-500 focus:ring-blue-500")}
                        />
                      )}
                      {errors.q1_job && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q1_job}</p>}
                      {errors.q1_job_other && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q1_job_other}</p>}
                    </div>

                    {/* Q2 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q2. 회사에서 일할 때 주로 어떤 프로그램을 쓰시나요? (여러 개 선택 가능) <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[
                          '회사 메신저 (슬랙, 팀즈 등)',
                          '문서 작성 및 공유 (노션, 구글 워크스페이스 등)',
                          '업무 관리 (지라, 아사나, 트렐로 등)',
                          '오피스 프로그램 (엑셀, 파워포인트 등)',
                          '회사 자체 시스템 (사내 포털, ERP 등)',
                          '기타'
                        ].map((option) => (
                          <label key={option} className={cn(
                            "flex items-center p-4 border rounded-xl cursor-pointer transition-colors",
                            formData.q2_tools.includes(option) ? (isN8N ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50") : "border-gray-200 hover:bg-gray-50"
                          )}>
                            <input
                              type="checkbox"
                              checked={formData.q2_tools.includes(option)}
                              onChange={() => toggleArrayItem('q2_tools', option)}
                              className={cn("w-4 h-4 rounded border-gray-300", isN8N ? "text-green-600 focus:ring-green-500" : "text-blue-600 focus:ring-blue-500")}
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {formData.q2_tools.includes('기타') && (
                        <input
                          type="text"
                          placeholder="직접 입력해주세요"
                          value={formData.q2_tools_other}
                          onChange={(e) => updateData('q2_tools_other', e.target.value)}
                          className={cn("mt-2 block w-full rounded-xl border-gray-300 shadow-sm p-3 border", isN8N ? "focus:border-green-500 focus:ring-green-500" : "focus:border-blue-500 focus:ring-blue-500")}
                        />
                      )}
                      {errors.q2_tools && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q2_tools}</p>}
                      {errors.q2_tools_other && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q2_tools_other}</p>}
                    </div>

                    {/* Q3 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q3. 회사에서 기본으로 주는 프로그램 외에, 인터넷에 있는 다른 업무용 서비스(웹사이트 등)를 얼마나 자주 쓰시나요? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[
                          '거의 사용하지 않음',
                          '가끔 사용함',
                          '자주 사용함',
                          '대부분의 업무에 사용함'
                        ].map((option) => (
                          <label key={option} className={cn(
                            "flex items-center p-4 border rounded-xl cursor-pointer transition-colors",
                            formData.q3_frequency === option ? (isN8N ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50") : "border-gray-200 hover:bg-gray-50"
                          )}>
                            <input
                              type="radio"
                              name="q3_frequency"
                              value={option}
                              checked={formData.q3_frequency === option}
                              onChange={(e) => updateData('q3_frequency', e.target.value)}
                              className={cn("w-4 h-4 border-gray-300", isN8N ? "text-green-600 focus:ring-green-500" : "text-blue-600 focus:ring-blue-500")}
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {errors.q3_frequency && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q3_frequency}</p>}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-4">2단계: 인공지능(AI) 사용 경험</h2>
                    
                    {/* Q4 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q4. 지금 일하시면서 인공지능(AI)을 써보신 적이 있나요? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[
                          '안 써봄',
                          '나 혼자 가끔 써봄',
                          '우리 팀원들과 같이 씀',
                          '회사 전체에서 적극적으로 씀'
                        ].map((option) => (
                          <label key={option} className={cn(
                            "flex items-center p-4 border rounded-xl cursor-pointer transition-colors",
                            formData.q4_ai_usage === option ? (isN8N ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50") : "border-gray-200 hover:bg-gray-50"
                          )}>
                            <input
                              type="radio"
                              name="q4_ai_usage"
                              value={option}
                              checked={formData.q4_ai_usage === option}
                              onChange={(e) => updateData('q4_ai_usage', e.target.value)}
                              className={cn("w-4 h-4 border-gray-300", isN8N ? "text-green-600 focus:ring-green-500" : "text-blue-600 focus:ring-blue-500")}
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {errors.q4_ai_usage && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q4_ai_usage}</p>}
                    </div>

                    {/* Q5 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q5. 써본 적 있는 인공지능(AI) 서비스를 모두 골라주세요. <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[
                          '챗지피티(ChatGPT)',
                          '제미나이(Gemini)',
                          '클로드(Claude)',
                          '퍼플렉시티(Perplexity)',
                          '기타'
                        ].map((option) => (
                          <label key={option} className={cn(
                            "flex items-center p-4 border rounded-xl cursor-pointer transition-colors",
                            formData.q5_ai_tools.includes(option) ? (isN8N ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50") : "border-gray-200 hover:bg-gray-50"
                          )}>
                            <input
                              type="checkbox"
                              checked={formData.q5_ai_tools.includes(option)}
                              onChange={() => toggleArrayItem('q5_ai_tools', option)}
                              className={cn("w-4 h-4 rounded border-gray-300", isN8N ? "text-green-600 focus:ring-green-500" : "text-blue-600 focus:ring-blue-500")}
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {formData.q5_ai_tools.includes('기타') && (
                        <input
                          type="text"
                          placeholder="직접 입력해주세요"
                          value={formData.q5_ai_tools_other}
                          onChange={(e) => updateData('q5_ai_tools_other', e.target.value)}
                          className={cn("mt-2 block w-full rounded-xl border-gray-300 shadow-sm p-3 border", isN8N ? "focus:border-green-500 focus:ring-green-500" : "focus:border-blue-500 focus:ring-blue-500")}
                        />
                      )}
                      {errors.q5_ai_tools && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q5_ai_tools}</p>}
                      {errors.q5_ai_tools_other && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q5_ai_tools_other}</p>}
                    </div>
                  </div>
                )}

                {step === 3 && isN8N && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-4">3단계: N8N 경험</h2>
                    
                    {/* Q6 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q6. n8n을 사용해본 경험이 있나요? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[
                          '처음 들어봄',
                          '이름만 들어봄',
                          '간단히 사용해봄',
                          '실제 업무에 사용 중'
                        ].map((option) => (
                          <label key={option} className={cn(
                            "flex items-center p-4 border rounded-xl cursor-pointer transition-colors",
                            formData.n8n_experience === option ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                          )}>
                            <input
                              type="radio"
                              name="n8n_experience"
                              value={option}
                              checked={formData.n8n_experience === option}
                              onChange={(e) => updateData('n8n_experience', e.target.value)}
                              className="w-4 h-4 border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {errors.n8n_experience && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.n8n_experience}</p>}
                    </div>

                    {/* Q7 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q7. 강의에서 다루었으면 하는 실무 사례가 있다면 작성해주세요. <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={formData.n8n_usecase}
                        onChange={(e) => updateData('n8n_usecase', e.target.value)}
                        placeholder="예: 매일 아침 슬랙으로 뉴스레터 요약 받기 등"
                        className="block w-full rounded-xl border-gray-300 shadow-sm p-4 border resize-none focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.n8n_usecase && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.n8n_usecase}</p>}
                    </div>

                    {/* Q8 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        Q8. 강의 수강 이후 어떤 수준까지 활용하기를 기대하시나요? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[
                          '개인 업무 자동화',
                          '팀 업무 자동화',
                          '회사 자동화 시스템 구축',
                          'AI 기반 자동화 구축'
                        ].map((option) => (
                          <label key={option} className={cn(
                            "flex items-center p-4 border rounded-xl cursor-pointer transition-colors",
                            formData.n8n_level === option ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                          )}>
                            <input
                              type="radio"
                              name="n8n_level"
                              value={option}
                              checked={formData.n8n_level === option}
                              onChange={(e) => updateData('n8n_level', e.target.value)}
                              className="w-4 h-4 border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-3 text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {errors.n8n_level && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.n8n_level}</p>}
                    </div>
                  </div>
                )}

                {((step === 3 && !isN8N) || (step === 4 && isN8N)) && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-4">{isN8N ? '4단계' : '3단계'}: 수업에 바라는 점</h2>
                    
                    {/* Q6 or Q9 */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium text-gray-900">
                        {isN8N ? 'Q9' : 'Q6'}. 이번 수업을 통해 가장 배우고 싶거나 기대하는 점은 무엇인가요? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={5}
                        value={formData.q6_expectations}
                        onChange={(e) => updateData('q6_expectations', e.target.value)}
                        placeholder="자유롭게 작성해주세요."
                        className={cn("block w-full rounded-xl border-gray-300 shadow-sm p-4 border resize-none", isN8N ? "focus:border-green-500 focus:ring-green-500" : "focus:border-blue-500 focus:ring-blue-500")}
                      />
                      {errors.q6_expectations && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{errors.q6_expectations}</p>}
                    </div>

                    {submitError && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{submitError}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1 || isSubmitting}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                step === 1 || isSubmitting
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-200 bg-gray-100"
              )}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              이전
            </button>

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className={cn(
                  "flex items-center px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm",
                  isN8N ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm",
                  isSubmitting 
                    ? (isN8N ? "bg-green-400 cursor-not-allowed" : "bg-blue-400 cursor-not-allowed") 
                    : (isN8N ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700")
                )}
              >
                {isSubmitting ? '제출 중...' : '제출하기'}
                {!isSubmitting && <CheckCircle2 className="w-4 h-4 ml-1" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [supabaseParticipants, setSupabaseParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sbLoading, setSbLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'data' | 'participants'>('data');
  const [copiedLink, setCopiedLink] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Supabase Data
  const fetchSupabaseParticipants = async () => {
    setSbLoading(true);
    try {
      // Note: Table name and column names might need adjustment
      // Assuming table: 'applications', status column: 'status'
      const { data, error } = await supabase
        .from('applications') // 테이블 이름을 확인해주세요!
        .select('*')
        .eq('status', '선정'); // '선정'된 인원만 가져오기

      if (error) throw error;
      setSupabaseParticipants(data || []);
    } catch (error) {
      console.error('Supabase fetch error:', error);
      // If table doesn't exist, we'll show an empty list or error
    } finally {
      setSbLoading(false);
    }
  };

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;

    fetchSupabaseParticipants();

    const surveyPath = 'vibe_survey';
    const participantPath = 'participants';
    
    const surveyQ = query(collection(db, surveyPath), orderBy('created_at', 'desc'));
    const participantQ = query(collection(db, participantPath), orderBy('created_at', 'desc'));
    
    setLoading(true);
    
    const unsubscribeSurveys = onSnapshot(surveyQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSurveys(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, surveyPath);
    });

    const unsubscribeParticipants = onSnapshot(participantQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, participantPath);
    });

    return () => {
      unsubscribeSurveys();
      unsubscribeParticipants();
    };
  }, [isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'SMD1234') {
      setIsAuthorized(true);
      sessionStorage.setItem('admin_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem('admin_auth');
    setPassword('');
  };

  const filteredSurveys = surveys.filter(s => filter === 'all' || s.course_type === filter);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleDeleteSurvey = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vibe_survey', id));
      setDeletingId(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const getMailtoLink = (courseName: string, url: string) => {
    const subject = encodeURIComponent(`[상미당 홀딩스] ${courseName} 사전 설문조사 안내`);
    const body = encodeURIComponent(`안녕하세요,\n\n${courseName} 대상자로 선정되신 것을 축하드립니다.\n원활한 교육 진행을 위해 아래 링크를 클릭하여 사전 설문조사에 참여해 주시기 바랍니다.\n\n설문 링크: ${url}\n\n감사합니다.`);
    return `mailto:?subject=${subject}&body=${body}`;
  };

  const baseUrl = window.location.origin;
  const vibeUrl = `${baseUrl}/survey/vibe`;
  const n8nUrl = `${baseUrl}/survey/n8n`;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <Logo />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h2>
          <p className="text-gray-600 mb-8">비밀번호를 입력하여 접속해 주세요.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                  loginError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                )}
                autoFocus
              />
              {loginError && <p className="text-red-500 text-xs mt-2 text-left">비밀번호가 올바르지 않습니다.</p>}
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
            >
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                설문 데이터 관리자
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                  실시간 연결됨
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">상미당 홀딩스 교육 과정 사전 설문 결과 및 발송</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('data')}
            className={cn(
              "flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-colors",
              activeTab === 'data' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
            )}
          >
            <Database className="w-4 h-4 mr-2" />
            응답 데이터
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={cn(
              "flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-colors",
              activeTab === 'participants' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
            )}
          >
            <Users className="w-4 h-4 mr-2" />
            선정 인원 명단
          </button>
        </div>

        {activeTab === 'data' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">설문 응답 분석</h2>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">전체 과정 보기</option>
                <option value="vibe">바이브 코딩 과정</option>
                <option value="n8n">N8N 자동화 과정</option>
              </select>
            </div>

            <ChartSection data={filteredSurveys} />
            
            {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Users className="w-5 h-5" /></div>
              <h3 className="font-medium text-gray-600">총 응답 수</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{surveys.length}명</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LayoutDashboard className="w-5 h-5" /></div>
              <h3 className="font-medium text-gray-600">바이브 코딩 과정</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{surveys.filter(s => s.course_type === 'vibe').length}명</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><FileSpreadsheet className="w-5 h-5" /></div>
              <h3 className="font-medium text-gray-600">N8N 자동화 과정</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{surveys.filter(s => s.course_type === 'n8n').length}명</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 whitespace-nowrap">과정명</th>
                  <th className="px-4 py-4 whitespace-nowrap">제출일시</th>
                  <th className="px-4 py-4 whitespace-nowrap">직무</th>
                  <th className="px-4 py-4 whitespace-nowrap">협업 툴</th>
                  <th className="px-4 py-4 whitespace-nowrap">외부 서비스 빈도</th>
                  <th className="px-4 py-4 whitespace-nowrap">AI 사용 경험</th>
                  <th className="px-4 py-4 whitespace-nowrap">AI 서비스</th>
                  <th className="px-4 py-4 whitespace-nowrap">n8n 경험</th>
                  <th className="px-4 py-4 whitespace-nowrap">희망 실무 사례</th>
                  <th className="px-4 py-4 whitespace-nowrap">기대 활용 수준</th>
                  <th className="px-4 py-4 min-w-[200px]">기대하는 점</th>
                  <th className="px-4 py-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={12} className="text-center py-12 text-gray-500">데이터를 불러오는 중...</td></tr>
                ) : filteredSurveys.length === 0 ? (
                  <tr><td colSpan={12} className="text-center py-12 text-gray-500">수집된 데이터가 없습니다.</td></tr>
                ) : (
                  filteredSurveys.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {s.course_type === 'n8n' ? <span className="text-green-700 bg-green-100 px-2.5 py-1 rounded-md text-xs font-bold">N8N 과정</span> : <span className="text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md text-xs font-bold">바이브 과정</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(s.created_at).toLocaleString('ko-KR')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{s.job}</td>
                      <td className="px-4 py-3 truncate max-w-[150px]" title={Array.isArray(s.tools) ? s.tools.join(', ') : s.tools}>
                        {Array.isArray(s.tools) ? s.tools.join(', ') : s.tools}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{s.frequency}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{s.ai_usage}</td>
                      <td className="px-4 py-3 truncate max-w-[150px]" title={Array.isArray(s.ai_tools) ? s.ai_tools.join(', ') : s.ai_tools}>
                        {Array.isArray(s.ai_tools) ? s.ai_tools.join(', ') : s.ai_tools}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{s.n8n_experience || '-'}</td>
                      <td className="px-4 py-3 truncate max-w-[150px]" title={s.n8n_usecase}>{s.n8n_usecase || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{s.n8n_level || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 line-clamp-2" title={s.expectations}>{s.expectations}</td>
                      <td className="px-4 py-3 text-right">
                        {deletingId === s.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleDeleteSurvey(s.id)}
                              className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                            >
                              확인
                            </button>
                            <button 
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeletingId(s.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        ) : activeTab === 'participants' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">교육 선정 인원 명단</h2>
                <p className="text-sm text-gray-500">Supabase(교육 신청 앱)에서 '선정'된 인원을 실시간으로 가져옵니다.</p>
              </div>
              <button 
                onClick={fetchSupabaseParticipants}
                disabled={sbLoading}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", sbLoading && "animate-spin")} />
                동기화
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">이름</th>
                      <th className="px-6 py-4">사번</th>
                      <th className="px-6 py-4">이메일</th>
                      <th className="px-6 py-4">회사</th>
                      <th className="px-6 py-4">신청 과정</th>
                      <th className="px-6 py-4">상태</th>
                      <th className="px-6 py-4 text-right">설문 링크 생성</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sbLoading && supabaseParticipants.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-500">Supabase에서 데이터를 불러오는 중...</td></tr>
                    ) : supabaseParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500">
                          선정된 인원이 없거나 테이블 설정이 필요합니다.<br/>
                          <span className="text-xs text-gray-400 mt-2 block">(테이블명: applications, 상태컬럼: status='선정' 기준)</span>
                        </td>
                      </tr>
                    ) : (
                      supabaseParticipants.map((p, i) => {
                        // Supabase 컬럼명에 맞춰 수정 필요
                        const pName = p.name || p.user_name || '이름없음';
                        const pEmpId = p.employee_id || p.emp_id || p.id_number || '-';
                        const pEmail = p.email || p.user_email || '-';
                        const pCompany = p.company || p.organization || p.dept || '-';
                        const pJob = p.job || p.position || '';
                        const pCourse = p.course_type || p.course || 'vibe';
                        
                        const personalUrl = `${baseUrl}/survey/${pCourse}?name=${encodeURIComponent(pName)}&job=${encodeURIComponent(pJob)}`;
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{pName}</td>
                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">{pEmpId}</td>
                            <td className="px-6 py-4 text-gray-500">{pEmail}</td>
                            <td className="px-6 py-4 text-gray-600">{pCompany}</td>
                            <td className="px-6 py-4">
                              {pCourse === 'n8n' ? <span className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs font-bold">N8N 과정</span> : <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs font-bold">바이브 과정</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">선정됨</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <a 
                                  href={personalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold"
                                  title="미리보기"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                  미리보기
                                </a>
                                <button 
                                  onClick={() => handleCopy(pEmail, `email-${i}`)}
                                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold"
                                  title="이메일 복사"
                                >
                                  {copiedLink === `email-${i}` ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Mail className="w-3.5 h-3.5 mr-1" />}
                                  {copiedLink === `email-${i}` ? '복사됨' : '이메일'}
                                </button>
                                <button 
                                  onClick={() => handleCopy(personalUrl, `sb-${i}`)}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold"
                                  title="설문 링크 복사"
                                >
                                  {copiedLink === `sb-${i}` ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                  {copiedLink === `sb-${i}` ? '복사됨' : '설문 링크'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vibe Send Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">바이브 코딩 과정</h2>
              <p className="text-gray-600 text-sm mb-6">바이브 코딩 과정 대상자에게 보낼 설문 링크입니다.</p>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600 truncate">{vibeUrl}</span>
                <button 
                  onClick={() => handleCopy(vibeUrl, 'vibe')}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="링크 복사"
                >
                  {copiedLink === 'vibe' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a 
                  href={vibeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center py-2.5 px-4 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  미리보기
                </a>
                <button 
                  onClick={() => handleCopy(vibeUrl, 'vibe')}
                  className="flex items-center justify-center py-2.5 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  {copiedLink === 'vibe' ? '복사 완료!' : '링크 복사'}
                </button>
                <a 
                  href={getMailtoLink('바이브 코딩 과정', vibeUrl)}
                  className="flex items-center justify-center py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  이메일 작성
                </a>
              </div>
            </div>

            {/* N8N Send Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">N8N 자동화 과정</h2>
              <p className="text-gray-600 text-sm mb-6">N8N 자동화 과정 대상자에게 보낼 설문 링크입니다.</p>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600 truncate">{n8nUrl}</span>
                <button 
                  onClick={() => handleCopy(n8nUrl, 'n8n')}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="링크 복사"
                >
                  {copiedLink === 'n8n' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a 
                  href={n8nUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center py-2.5 px-4 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  미리보기
                </a>
                <button 
                  onClick={() => handleCopy(n8nUrl, 'n8n')}
                  className="flex items-center justify-center py-2.5 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  {copiedLink === 'n8n' ? '복사 완료!' : '링크 복사'}
                </button>
                <a 
                  href={getMailtoLink('N8N 자동화 과정', n8nUrl)}
                  className="flex items-center justify-center py-2.5 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  이메일 작성
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/survey/:courseId" element={<SurveyForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
