import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  CalendarDays,
  FileText,
  Search, 
  Plus, 
  AlertCircle, 
  Trash2, 
  Edit3,
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileCheck,
  MapPin,
  UserCheck,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  Pause,
  Play,
  Clock,
  Copy,
  LogOut,
  Lock,
  User,
  Filter,
  CheckSquare,
  Settings,
  RotateCcw,
  X,
  Eye,
  EyeOff,
  MoreVertical,
  Calendar,
  AlertTriangle,
  Bell,
  ShieldCheck,
  Loader2
} from 'lucide-react';

// ==========================================
// Data Interfaces
// ==========================================

export interface StaffMember {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  username?: string;
  password?: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  department: string;
  isAccountSetup?: boolean;
  setupToken?: string;
  resetToken?: string;
}

export type NotificationRecipientRole = 'ADMIN' | 'MANAGER' | 'ASSIGNED_STAFF';

export interface ChannelNotificationConfig {
  enabled: boolean;
  leadNoticeDays: number[];
  notifyEngagements: boolean;
  notifyProposals: boolean;
  notifyMeetings: boolean;
  recipientRoles: NotificationRecipientRole[];
  assignedStaffIds: string[];
}

export interface NotificationConfig {
  email: ChannelNotificationConfig;
  sms: ChannelNotificationConfig;
}

export interface SubtaskItem {
  id: string;
  category?: string;
  task: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Pending Review';
  assigneeNickname: string;
  dueDate: string;
  reviewedByNickname: string;
  comments: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  managerId: string;
  startDate: string;
  endDate?: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  isPaused?: boolean;
  subtasks: SubtaskItem[];
}

export interface EventSchedule {
  date: string;
  startTime: string;
  endTime: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  assignedStaffIds: string[];
  schedules: EventSchedule[];
  status: 'UPCOMING' | 'DUE TODAY' | 'PAST' | 'COMPLETED';
}

export interface ProposalItem {
  id: string;
  title: string;
  description: string;
  assignedStaffIds: string[];
  deadline: string;
  completionStatus: 'Draft' | 'Submitted' | 'Accepted';
  comments: string;
}

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
}

// Global CSS helper class string to hide native Edge/Chrome password reveal buttons
const PASSWORD_INPUT_STYLE = "w-full border border-slate-300 rounded-lg p-2.5 pr-10 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 [::-ms-reveal]:hidden [::-webkit-credentials-auto-fill-button]:hidden [::-webkit-reveal]:hidden";

// ==========================================
// Theme Loading & Toast Components
// ==========================================

function AppSpinner({ message = "Loading workspace..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 min-h-[350px]">
      <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
      <p className="text-xs font-semibold text-slate-500 tracking-wide">{message}</p>
    </div>
  );
}

function NotificationToast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border bg-white max-w-sm animate-in fade-in slide-in-from-bottom-5 transition-all">
      <div className={`p-2 rounded-lg shrink-0 ${
        isError ? 'bg-red-50 text-red-600' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
      }`}>
        {isError ? <AlertCircle className="w-5 h-5" /> : isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
      </div>
      <p className="text-xs font-semibold text-slate-800 leading-snug flex-1">{toast.message}</p>
      <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ==========================================
// Helper Utility Functions
// ==========================================

export function computeProposalDeadlineStatus(deadlineStr: string): 'Upcoming' | 'Due Soon' | 'Due Today' | 'Overdue' {
  if (!deadlineStr) return 'Upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = deadlineStr.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  deadline.setHours(0, 0, 0, 0);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due Today';
  if (diffDays > 0 && diffDays <= 7) return 'Due Soon';
  return 'Upcoming';
}

export function computeProjectStatus(subtasks: SubtaskItem[], isPaused?: boolean): 'Planning' | 'Active' | 'On Hold' | 'Completed' {
  if (isPaused) return 'On Hold';
  if (!subtasks || subtasks.length === 0) return 'Planning';
  const totalSubtasks = subtasks.length;
  const totalCompleted = subtasks.filter(st => st.status === 'Completed').length;
  if (totalCompleted === totalSubtasks) return 'Completed';
  const planningTasks = subtasks.filter(st => (st.category || 'PLANNING') === 'PLANNING');
  const allPlanningCompleted = planningTasks.length > 0 && planningTasks.every(st => st.status === 'Completed');
  return allPlanningCompleted ? 'Active' : 'Planning';
}

export function computeEventStatus(schedules: EventSchedule[], isCompleted?: boolean): 'UPCOMING' | 'DUE TODAY' | 'PAST' | 'COMPLETED' {
  if (isCompleted) return 'COMPLETED';
  if (!schedules || schedules.length === 0) return 'UPCOMING';

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduleDates = schedules
    .filter(s => s.date)
    .map(s => {
      const [year, month, day] = s.date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setHours(0, 0, 0, 0);
      return d;
    });

  if (scheduleDates.length === 0) return 'UPCOMING';

  const latestDate = new Date(Math.max(...scheduleDates.map(d => d.getTime())));

  if (latestDate < today) return 'PAST';

  const todaySessions = schedules.filter(s => {
    if (!s.date) return false;
    const [year, month, day] = s.date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (todaySessions.length > 0) {
    const allEnded = todaySessions.every(s => {
      if (!s.endTime) return false;
      const [hours, minutes] = s.endTime.split(':').map(Number);
      const sessionEnd = new Date();
      sessionEnd.setHours(hours, minutes, 0, 0);
      return now > sessionEnd;
    });

    if (allEnded && todaySessions.every(s => s.endTime)) {
      return 'PAST';
    }

    return 'DUE TODAY';
  }

  return 'UPCOMING';
}

export function getProjectTargetDueDate(project: ProjectItem): string {
  if (project.endDate) return project.endDate;
  const datedSubtasks = project.subtasks.filter(st => st.dueDate);
  if (datedSubtasks.length === 0) return '';
  const dates = datedSubtasks.map(st => st.dueDate);
  return dates.sort().reverse()[0];
}

export function formatFormattedDate(dateStr: string): string {
  if (!dateStr) return 'Not set';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[d.getDay()];
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yy = String(year).slice(-2);
  return `${dayName} ${dd}/${mm}/${yy}`;
}

// Search Dropdowns
function StaffSingleSearchSelect({
  staffMembers,
  selectedNickname,
  onChange,
  disabled = false,
  placeholder = "Select staff..."
}: {
  staffMembers: StaffMember[];
  selectedNickname: string;
  onChange: (nickname: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedStaff = staffMembers.find(s => s.nickname === selectedNickname);

  const filteredStaff = staffMembers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-300 rounded-lg p-2 bg-white text-xs font-mono text-left outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-800"
      >
        <span className="truncate">
          {selectedStaff ? `@${selectedStaff.nickname} (${selectedStaff.name})` : <span className="font-sans text-slate-400">{placeholder}</span>}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Type to search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs outline-none font-sans text-slate-800"
            />
          </div>
          <div className="overflow-y-auto max-h-48 p-1">
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="p-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded cursor-pointer transition font-sans"
            >
              Unassigned
            </div>
            {filteredStaff.length === 0 ? (
              <div className="p-2 text-xs text-slate-400 text-center font-sans">No matching staff</div>
            ) : (
              filteredStaff.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onChange(s.nickname);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`p-1.5 text-xs rounded cursor-pointer flex items-center justify-between transition ${
                    selectedNickname === s.nickname ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold">@{s.nickname}</span> <span className="font-sans text-slate-600">({s.name})</span>
                  </div>
                  {selectedNickname === s.nickname && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventStaffMultiSearchSelect({
  staffMembers,
  selectedStaffIds,
  onToggleStaff
}: {
  staffMembers: StaffMember[];
  selectedStaffIds: string[];
  onToggleStaff: (id: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredStaff = staffMembers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Type name, nickname, or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
        />
      </div>
      <div className="border border-slate-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-slate-50">
        {filteredStaff.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">No matching staff found.</p>
        ) : (
          filteredStaff.map((s) => {
            const isChecked = selectedStaffIds.includes(s.id);
            return (
              <label 
                key={s.id} 
                className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer transition ${
                  isChecked ? 'bg-blue-50 border border-blue-100' : 'hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => onToggleStaff(s.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-800">{s.name}</span>
                  <span className="text-blue-600 font-mono text-[11px]">(@{s.nickname})</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{s.department}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

// Audit Job Control Checklist Template
const AUDIT_SUBTASKS_TEMPLATE: SubtaskItem[] = [
  { id: 'st-1', category: 'PLANNING', task: 'Acceptance & Continuance Assessment', status: 'Not Started', assigneeNickname: 'DGB', dueDate: '2026-07-15', reviewedByNickname: 'JM', comments: '' },
  { id: 'st-2', category: 'PLANNING', task: 'Pre-Audit Planning Meeting & Risk Assessment', status: 'Not Started', assigneeNickname: 'DD', dueDate: '2026-07-18', reviewedByNickname: 'AAB', comments: '' },
  { id: 'st-3', category: 'PLANNING', task: 'Audit Strategy & Overall Materiality Calculation', status: 'Not Started', assigneeNickname: 'DD', dueDate: '2026-07-20', reviewedByNickname: 'JM', comments: '' },
  { id: 'st-4', category: 'PLANNING', task: 'Engagement Letter Execution', status: 'Not Started', assigneeNickname: 'VAE', dueDate: '2026-07-22', reviewedByNickname: 'JM', comments: '' },
  { id: 'st-5', category: 'PLANNING', task: 'Audit Work Plan & Requirements List (PBC List)', status: 'Not Started', assigneeNickname: 'DGB', dueDate: '2026-08-05', reviewedByNickname: 'AAB', comments: '' },
  { id: 'st-6', category: 'EXECUTION', task: 'Opening Balances & Prior Year Working Papers', status: 'Not Started', assigneeNickname: 'DGB', dueDate: '', reviewedByNickname: 'DD', comments: '' },
  { id: 'st-7', category: 'EXECUTION', task: 'Property, Plant & Equipment (PPE) Schedule & Vouching', status: 'Not Started', assigneeNickname: 'DGB', dueDate: '2026-08-15', reviewedByNickname: 'AAB', comments: '' },
  { id: 'st-8', category: 'EXECUTION', task: 'Cash and Cash Equivalents & Bank Confirmations', status: 'Not Started', assigneeNickname: 'DGB', dueDate: '2026-08-18', reviewedByNickname: 'DD', comments: '' },
  { id: 'st-9', category: 'EXECUTION', task: 'Trade Receivables Circularization & Valuation Review', status: 'Not Started', assigneeNickname: 'VAE', dueDate: '2026-08-20', reviewedByNickname: 'DD', comments: '' },
  { id: 'st-10', category: 'EXECUTION', task: 'Revenue Substantive Testing & Cut-off Review', status: 'Not Started', assigneeNickname: 'VAE', dueDate: '2026-08-28', reviewedByNickname: 'AAB', comments: '' },
  { id: 'st-11', category: 'REPORTING', task: 'Draft Financial Statements Review & Notes to Accounts', status: 'Not Started', assigneeNickname: 'DD', dueDate: '2026-09-05', reviewedByNickname: '', comments: '' },
  { id: 'st-12', category: 'REPORTING', task: 'Management Letter (Internal Control Deficiencies)', status: 'Not Started', assigneeNickname: 'AAB', dueDate: '2026-09-10', reviewedByNickname: 'JM', comments: '' }
];

// ==========================================
// Main Application Component
// ==========================================

export default function App() {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ id: Date.now().toString(), message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-tasks' | 'projects' | 'proposals' | 'events' | 'staff' | 'settings'>(() => {
    return (sessionStorage.getItem('schedley_activeTab') as any) || 'dashboard';
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const newItemRef = useRef<HTMLDivElement>(null);

  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [generatedLinkModal, setGeneratedLinkModal] = useState<{ name: string; link: string; titleStr?: string } | null>(null);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isAddProposalOpen, setIsAddProposalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<ProposalItem | null>(null);

  // Notification Config State
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    email: {
      enabled: true,
      leadNoticeDays: [1, 3, 7],
      notifyEngagements: true,
      notifyProposals: true,
      notifyMeetings: true,
      recipientRoles: ['ASSIGNED_STAFF', 'MANAGER'],
      assignedStaffIds: []
    },
    sms: {
      enabled: true,
      leadNoticeDays: [1, 3, 7],
      notifyEngagements: true,
      notifyProposals: true,
      notifyMeetings: true,
      recipientRoles: ['ASSIGNED_STAFF', 'MANAGER'],
      assignedStaffIds: []
    }
  });

  // Mock Database
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    { id: '1', name: 'John Mensah', nickname: 'JM', email: 'john.mensah@auditfirm.com', phoneNumber: '+233240000001', isEmailVerified: true, isPhoneVerified: true, username: 'jmensah', password: 'password123', role: 'ADMIN', department: 'Audit Partner', isAccountSetup: true },
    { id: '2', name: 'Ama Boateng', nickname: 'AAB', email: 'ama.boateng@auditfirm.com', phoneNumber: '+233240000002', isEmailVerified: true, isPhoneVerified: true, username: 'aboateng', password: 'password123', role: 'MANAGER', department: 'Audit Senior Manager', isAccountSetup: true },
    { id: '3', name: 'Kofi Arhin', nickname: 'DGB', email: 'kofi.arhin@auditfirm.com', phoneNumber: '+233240000003', isEmailVerified: true, isPhoneVerified: false, username: 'karhin', password: 'password123', role: 'STAFF', department: 'Audit Associate', isAccountSetup: true }
  ]);

  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: 'PRJ-101',
      name: 'FY2026 Financial Statement Audit - Zenith Enterprise',
      description: 'Statutory external audit engagement evaluating balance sheet items, internal controls, and statutory reporting compliance.',
      managerId: '2',
      startDate: '2026-07-01',
      endDate: '2026-09-08',
      status: 'Active',
      isPaused: false,
      subtasks: [
        { id: 'st-1', category: 'PLANNING', task: 'Acceptance & Continuance Assessment', status: 'Completed', assigneeNickname: 'DGB', dueDate: '2026-07-15', reviewedByNickname: 'JM', comments: 'KYC cleared.' },
        { id: 'st-2', category: 'PLANNING', task: 'Pre-Audit Planning Meeting & Risk Assessment', status: 'Completed', assigneeNickname: 'DD', dueDate: '2026-07-18', reviewedByNickname: 'AAB', comments: 'Risk areas identified.' },
        { id: 'st-7', category: 'EXECUTION', task: 'Property, Plant & Equipment (PPE) Schedule & Vouching', status: 'In Progress', assigneeNickname: 'DGB', dueDate: '2026-08-15', reviewedByNickname: 'AAB', comments: 'Title deeds verified.' },
        { id: 'st-8', category: 'EXECUTION', task: 'Cash and Cash Equivalents & Bank Confirmations', status: 'In Progress', assigneeNickname: 'DGB', dueDate: '2026-08-18', reviewedByNickname: 'DD', comments: 'Confirmations sent.' }
      ]
    }
  ]);

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'EV-101',
      title: 'Audit Kick-off & Planning Meeting - Zenith Enterprise',
      description: 'Review audit scope, client deliverables list and fieldwork timeline with client CFO and finance team.',
      venue: 'Zenith Enterprise Main Boardroom',
      assignedStaffIds: ['1', '2', '3'],
      schedules: [
        { date: '2026-09-03', startTime: '10:00', endTime: '12:00' }
      ],
      status: 'DUE TODAY'
    }
  ]);

  const [proposals, setProposals] = useState<ProposalItem[]>([
    {
      id: 'PROP-101',
      title: 'FY2027 Statutory Audit Tender - Apex Commercial Bank',
      description: 'Technical and financial audit proposal for external audit and IFRS 9 compliance advisory.',
      assignedStaffIds: ['1', '2', '3'],
      deadline: '2026-09-08',
      completionStatus: 'Draft',
      comments: 'Partner review scheduled prior to final submission.'
    }
  ]);

  const navigateTabWithScroll = (tab: typeof activeTab) => {
    setIsLoading(true);
    setActiveTab(tab);
    setActiveProjectId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsLoading(false), 250);
  };

  const openProjectWithScroll = (id: string) => {
    setIsLoading(true);
    setActiveTab('projects');
    setActiveProjectId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsLoading(false), 250);
  };

  useEffect(() => {
    sessionStorage.setItem('schedley_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sToken = params.get('setupToken');
    const rToken = params.get('resetToken');
    if (sToken) setSetupToken(sToken);
    if (rToken) setResetToken(rToken);
  }, []);

  // Global ESC Key Listener to Close Open Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddStaffOpen(false);
        setEditingStaff(null);
        setGeneratedLinkModal(null);
        setIsAddProjectOpen(false);
        setEditingProject(null);
        setIsAddEventOpen(false);
        setEditingEvent(null);
        setIsAddProposalOpen(false);
        setEditingProposal(null);
        setIsNewItemOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 30-Minute Inactivity Session Timeout
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const TIMEOUT_DURATION = 30 * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setCurrentUser(null);
        showToast('Session expired after 30 minutes of inactivity. Please log in again.', 'error');
      }, TIMEOUT_DURATION);
    };

    const eventsList = ['mousemove', 'keydown', 'click', 'scroll'];
    eventsList.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      eventsList.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentUser]);

  // Close New Item Dropdown on Click Outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newItemRef.current && !newItemRef.current.contains(event.target as Node)) {
        setIsNewItemOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (user: StaffMember) => {
    setCurrentUser(user);
    navigateTabWithScroll('dashboard');
    showToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleSaveStaff = (memberData: StaffMember) => {
    if (staffMembers.some(s => s.id === memberData.id)) {
      setStaffMembers(staffMembers.map(s => s.id === memberData.id ? memberData : s));
      showToast('User record updated successfully.', 'success');
    } else {
      const newToken = `token-${Date.now()}`;
      const newMember: StaffMember = {
        ...memberData,
        setupToken: newToken,
        isAccountSetup: false
      };
      setStaffMembers([...staffMembers, newMember]);
      
      const shareableUrl = `${window.location.origin}${window.location.pathname}?setupToken=${newToken}`;
      setGeneratedLinkModal({ name: newMember.name, link: shareableUrl, titleStr: 'User Account Setup Link' });
    }
  };

  const handleAdminTriggerPasswordReset = (s: StaffMember) => {
    const rToken = `reset-${Date.now()}`;
    setStaffMembers(staffMembers.map(m => m.id === s.id ? { ...m, resetToken: rToken } : m));
    const shareableUrl = `${window.location.origin}${window.location.pathname}?resetToken=${rToken}`;
    setGeneratedLinkModal({ name: s.name, link: shareableUrl, titleStr: 'Password Reset Link' });
  };

  const handleCompleteAccountSetup = (token: string, username: string, pass: string) => {
    setStaffMembers(staffMembers.map(s => {
      if (s.setupToken === token) {
        return { ...s, username, password: pass, isAccountSetup: true, setupToken: undefined };
      }
      return s;
    }));
    setSetupToken(null);
    window.history.replaceState({}, document.title, window.location.pathname);
    showToast('Account setup complete! You can now log in.', 'success');
  };

  const handleCompletePasswordReset = (token: string, pass: string) => {
    setStaffMembers(staffMembers.map(s => {
      if (s.resetToken === token) {
        return { ...s, password: pass, resetToken: undefined };
      }
      return s;
    }));
    setResetToken(null);
    window.history.replaceState({}, document.title, window.location.pathname);
    showToast('Password reset complete! Please log in with your new password.', 'success');
  };

  const handleUpdateSelfProfile = (updatedUser: StaffMember) => {
    setStaffMembers(staffMembers.map(s => s.id === updatedUser.id ? updatedUser : s));
    setCurrentUser(updatedUser);
  };

  const handleSaveProject = (projectData: ProjectItem) => {
    if (projects.some(p => p.id === projectData.id)) {
      setProjects(projects.map(p => {
        if (p.id === projectData.id) {
          const updated = { ...p, ...projectData };
          return { ...updated, status: computeProjectStatus(updated.subtasks, updated.isPaused) };
        }
        return p;
      }));
      showToast('Engagement details updated.', 'success');
    } else {
      const initialSubtasks = AUDIT_SUBTASKS_TEMPLATE.map(st => ({ ...st, status: 'Not Started' as const }));
      setProjects([
        { ...projectData, subtasks: initialSubtasks, isPaused: false, status: computeProjectStatus(initialSubtasks, false) },
        ...projects
      ]);
      showToast('New engagement created.', 'success');
    }
  };

  const handleTogglePauseProject = (projectId: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const nextPaused = !p.isPaused;
        return { ...p, isPaused: nextPaused, status: computeProjectStatus(p.subtasks, nextPaused) };
      }
      return p;
    }));
  };

  const handleSaveEvent = (eventData: EventItem) => {
    if (events.some(e => e.id === eventData.id)) {
      setEvents(events.map(e => e.id === eventData.id ? eventData : e));
      showToast('Event updated.', 'success');
    } else {
      setEvents([eventData, ...events]);
      showToast('Event scheduled successfully.', 'success');
    }
  };

  const handleSaveProposal = (proposalData: ProposalItem) => {
    if (proposals.some(pr => pr.id === proposalData.id)) {
      setProposals(proposals.map(pr => pr.id === proposalData.id ? proposalData : pr));
      showToast('Proposal details updated.', 'success');
    } else {
      setProposals([proposalData, ...proposals]);
      showToast('Proposal created.', 'success');
    }
  };

  const handleUpdateSubtasks = (projectId: string, updatedSubtasks: SubtaskItem[]) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, subtasks: updatedSubtasks, status: computeProjectStatus(updatedSubtasks, p.isPaused) };
      }
      return p;
    }));
  };

  if (setupToken) {
    const invitee = staffMembers.find(s => s.setupToken === setupToken);
    return <SetupAccountView invitee={invitee} onComplete={handleCompleteAccountSetup} showToast={showToast} />;
  }

  if (resetToken) {
    const userToReset = staffMembers.find(s => s.resetToken === resetToken);
    return <ResetPasswordView userToReset={userToReset} onComplete={handleCompletePasswordReset} showToast={showToast} />;
  }

  if (!currentUser) {
    return <LoginView staffMembers={staffMembers} onLogin={handleLogin} onTriggerReset={handleAdminTriggerPasswordReset} showToast={showToast} />;
  }

  const activeProject = projects.find(p => p.id === activeProjectId);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'events', label: 'Events & Meetings', icon: CalendarDays },
    ...(currentUser.role === 'ADMIN' ? [{ id: 'staff', label: 'Users', icon: Users }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <NotificationToast toast={toast} onClose={() => setToast(null)} />

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-100 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/20">
              S
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900 block leading-none">Schedley</span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">Audit PM Suite</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !activeProjectId;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTabWithScroll(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm">
              {currentUser.nickname}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-xs">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search workspace..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-slate-100 border-0 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            />
          </div>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
            <div className="relative" ref={newItemRef}>
              <button 
                onClick={() => setIsNewItemOpen(!isNewItemOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" /> New Item <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isNewItemOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 space-y-1 text-xs font-medium">
                  <button 
                    onClick={() => {
                      setIsNewItemOpen(false);
                      setActiveTab('projects');
                      setActiveProjectId(null);
                      setEditingProject(null);
                      setIsAddProjectOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-slate-700"
                  >
                    <FolderKanban className="w-4 h-4 text-blue-600" /> Project
                  </button>

                  <button 
                    onClick={() => {
                      setIsNewItemOpen(false);
                      setActiveTab('proposals');
                      setActiveProjectId(null);
                      setEditingProposal(null);
                      setIsAddProposalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-slate-700"
                  >
                    <FileText className="w-4 h-4 text-purple-600" /> Proposal
                  </button>

                  <button 
                    onClick={() => {
                      setIsNewItemOpen(false);
                      setActiveTab('events');
                      setActiveProjectId(null);
                      setEditingEvent(null);
                      setIsAddEventOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-slate-700"
                  >
                    <CalendarDays className="w-4 h-4 text-amber-600" /> Event / Meeting
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {isLoading ? (
            <AppSpinner message="Loading workspace view..." />
          ) : activeProjectId && activeProject ? (
            <ProjectDetailsView 
              project={activeProject} 
              staffMembers={staffMembers}
              userRole={currentUser.role}
              userNickname={currentUser.nickname}
              onBack={() => setActiveProjectId(null)}
              onUpdateSubtasks={(updated) => handleUpdateSubtasks(activeProject.id, updated)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  projects={projects} 
                  events={events} 
                  proposals={proposals} 
                  currentUser={currentUser}
                  onNavigateTab={navigateTabWithScroll}
                  onOpenProject={openProjectWithScroll}
                />
              )}
              
              {activeTab === 'my-tasks' && (
                <MyTasksView 
                  currentUser={currentUser}
                  projects={projects}
                  proposals={proposals}
                  events={events}
                  searchTerm={globalSearch}
                  onOpenProject={openProjectWithScroll}
                  onOpenProposals={() => navigateTabWithScroll('proposals')}
                  onOpenEvents={() => navigateTabWithScroll('events')}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsView 
                  projects={projects} 
                  staffMembers={staffMembers} 
                  userRole={currentUser.role}
                  searchTerm={globalSearch}
                  onAddClick={() => {
                    setEditingProject(null);
                    setIsAddProjectOpen(true);
                  }} 
                  onEditClick={(prj) => {
                    setEditingProject(prj);
                    setIsAddProjectOpen(true);
                  }}
                  onTogglePause={handleTogglePauseProject}
                  onOpenProject={openProjectWithScroll}
                />
              )}

              {activeTab === 'proposals' && (
                <ProposalsView 
                  proposals={proposals}
                  setProposals={setProposals}
                  staffMembers={staffMembers}
                  userRole={currentUser.role}
                  searchTerm={globalSearch}
                  onAddClick={() => {
                    setEditingProposal(null);
                    setIsAddProposalOpen(true);
                  }}
                  onEditClick={(pr) => {
                    setEditingProposal(pr);
                    setIsAddProposalOpen(true);
                  }}
                />
              )}

              {activeTab === 'staff' && currentUser.role === 'ADMIN' && (
                <StaffView 
                  staffMembers={staffMembers} 
                  searchTerm={globalSearch}
                  onAddClick={() => setIsAddStaffOpen(true)} 
                  onEditClick={(member) => setEditingStaff(member)}
                  onResetPassword={handleAdminTriggerPasswordReset}
                  userRole={currentUser.role} 
                  showToast={showToast}
                />
              )}

              {activeTab === 'events' && (
                <EventsView 
                  events={events} 
                  setEvents={setEvents} 
                  staffMembers={staffMembers}
                  userRole={currentUser.role} 
                  searchTerm={globalSearch}
                  onAddClick={() => {
                    setEditingEvent(null);
                    setIsAddEventOpen(true);
                  }} 
                  onEditClick={(ev) => {
                    setEditingEvent(ev);
                    setIsAddEventOpen(true);
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  currentUser={currentUser} 
                  staffMembers={staffMembers}
                  notificationConfig={notificationConfig}
                  onSaveNotificationConfig={setNotificationConfig}
                  onSave={handleUpdateSelfProfile} 
                  showToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {(isAddStaffOpen || editingStaff) && (
        <StaffFormModal 
          initialData={editingStaff}
          onClose={() => { setIsAddStaffOpen(false); setEditingStaff(null); }} 
          onSave={handleSaveStaff} 
          showToast={showToast}
          currentUserRole={currentUser.role}
        />
      )}

      {generatedLinkModal && (
        <ShareableLinkModal 
          name={generatedLinkModal.name} 
          link={generatedLinkModal.link} 
          titleStr={generatedLinkModal.titleStr}
          onClose={() => setGeneratedLinkModal(null)} 
        />
      )}

      {isAddProjectOpen && (
        <ProjectFormModal 
          initialData={editingProject}
          staffMembers={staffMembers} 
          onClose={() => { setIsAddProjectOpen(false); setEditingProject(null); }} 
          onSave={handleSaveProject}
          showToast={showToast}
        />
      )}

      {(isAddEventOpen || editingEvent) && (
        <AddEventModal 
          initialData={editingEvent}
          staffMembers={staffMembers} 
          onClose={() => { setIsAddEventOpen(false); setEditingEvent(null); }} 
          onSave={handleSaveEvent} 
          showToast={showToast}
        />
      )}

      {(isAddProposalOpen || editingProposal) && (
        <ProposalFormModal 
          initialData={editingProposal}
          staffMembers={staffMembers} 
          onClose={() => { setIsAddProposalOpen(false); setEditingProposal(null); }} 
          onSave={handleSaveProposal} 
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ==========================================
// Views Components
// ==========================================

function LoginView({ 
  staffMembers, 
  onLogin,
  onTriggerReset,
  showToast
}: { 
  staffMembers: StaffMember[]; 
  onLogin: (user: StaffMember) => void;
  onTriggerReset: (user: StaffMember) => void;
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const user = staffMembers.find(s => (s.username === username || s.email === username) && s.isAccountSetup);
    if (!user || user.password !== password) {
      setLoginError('Invalid username/email or password. Please try again.');
      return showToast('Invalid username/email or password.', 'error');
    }
    onLogin(user);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const user = staffMembers.find(s => s.email.toLowerCase() === forgotEmail.toLowerCase());
    if (!user) {
      setLoginError('No registered user account found with that email address.');
      return showToast('No registered user account found with that email address.', 'error');
    }
    onTriggerReset(user);
    setIsForgotPassword(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white mx-auto shadow-md shadow-blue-500/20">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{isForgotPassword ? 'Forgot Password' : 'Schedley Login'}</h1>
          <p className="text-xs text-slate-500">
            {isForgotPassword ? 'Type your email to receive a password reset link.' : 'Sign in to your audit project management workspace.'}
          </p>
        </div>

        {loginError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="flex-1">{loginError}</span>
            <button onClick={() => setLoginError(null)} className="p-0.5 hover:bg-red-100 rounded text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {!isForgotPassword ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg pl-9 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" 
                  placeholder="e.g. jmensah or john.mensah@auditfirm.com" 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                {/* <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[11px] text-blue-600 hover:underline font-semibold">
                  Forgot Password?
                </button> */}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={`pl-9 ${PASSWORD_INPUT_STYLE}`} 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-xs transition">
              Log In
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Email *</label>
              <input 
                type="email" 
                required 
                value={forgotEmail} 
                onChange={(e) => setForgotEmail(e.target.value)} 
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" 
                placeholder="john.mensah@auditfirm.com" 
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setIsForgotPassword(false)} className="w-1/2 bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-lg">
                Back to Login
              </button>
              <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition">
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SetupAccountView({ 
  invitee, 
  onComplete,
  showToast
}: { 
  invitee?: StaffMember; 
  onComplete: (token: string, username: string, pass: string) => void;
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!invitee) {
    return (
      <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border text-center text-xs space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Invalid or Expired Setup Link</h2>
          <p className="text-slate-500">Please contact your Engagement Partner for a valid invite link.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return showToast('Passwords do not match.', 'error');
    onComplete(invitee.setupToken!, username, password);
  };

  return (
    <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Account Credentials Setup</h1>
          <p className="text-xs text-slate-500">Welcome, <span className="font-bold text-slate-800">{invitee.name}</span>! Choose your username & password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chosen Username *</label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" 
              placeholder="e.g. aboateng" 
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={PASSWORD_INPUT_STYLE} 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className={PASSWORD_INPUT_STYLE} 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-xs transition">
            Save Credentials & Finish Setup
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordView({ 
  userToReset, 
  onComplete,
  showToast
}: { 
  userToReset?: StaffMember; 
  onComplete: (token: string, pass: string) => void;
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!userToReset) {
    return (
      <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border text-center text-xs space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Invalid or Expired Reset Link</h2>
          {/* <p className="text-slate-500">Please request a new reset link from the login page or your Audit Project Manager.</p> */}
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return showToast('Passwords do not match.', 'error');
    onComplete(userToReset.resetToken!, password);
  };

  return (
    <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Reset Your Password</h1>
          <p className="text-xs text-slate-500">Resetting credentials for <span className="font-bold text-slate-800">{userToReset.email}</span>.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={PASSWORD_INPUT_STYLE} 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className={PASSWORD_INPUT_STYLE} 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-xs transition">
            Update Password & Log In
          </button>
        </form>
      </div>
    </div>
  );
}

function ShareableLinkModal({ name, link, titleStr, onClose }: { name: string; link: string; titleStr?: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{titleStr || 'User Account Setup Link'}</h2>
        <p className="text-xs text-slate-600">Share this unique link with <span className="font-bold">{name}</span>:</p>
        
        <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg bg-slate-50">
          <input type="text" readOnly value={link} className="w-full bg-transparent text-xs font-mono outline-none text-slate-700 truncate" />
          <button 
            onClick={handleCopy} 
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center gap-1 shrink-0"
          >
            <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-xs font-semibold text-slate-700 rounded-lg">Done</button>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ 
  projects, 
  events, 
  proposals,
  currentUser,
  onNavigateTab,
  onOpenProject
}: { 
  projects: ProjectItem[]; 
  events: EventItem[]; 
  proposals: ProposalItem[];
  currentUser: StaffMember;
  onNavigateTab: (tab: 'my-tasks' | 'projects' | 'proposals' | 'events') => void;
  onOpenProject: (id: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalEngagementsCount = projects.filter(p => p.status !== 'Completed').length;
  const activeProposalsCount = proposals.filter(p => p.completionStatus !== 'Accepted').length;

  let userPendingTasksCount = 0;
  projects.forEach(p => {
    p.subtasks.forEach(st => {
      if (st.assigneeNickname === currentUser.nickname && st.status !== 'Completed') {
        userPendingTasksCount++;
      }
    });
  });

  const userPendingProposalsCount = proposals.filter(p => 
    p.assignedStaffIds.includes(currentUser.id) && p.completionStatus !== 'Accepted'
  ).length;

  const userPendingMeetingsCount = events.filter(e => {
    const isAssigned = e.assignedStaffIds.includes(currentUser.id);
    const dynamicStatus = computeEventStatus(e.schedules, e.status === 'COMPLETED');
    return isAssigned && dynamicStatus !== 'COMPLETED' && dynamicStatus !== 'PAST';
  }).length;

  const dayOfWeek = today.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const currentWeekMonday = new Date(today);
  currentWeekMonday.setDate(today.getDate() - distanceToMonday);

  const nextWeekMonday = new Date(currentWeekMonday);
  nextWeekMonday.setDate(currentWeekMonday.getDate() + 7);

  const upcomingMeetingsThisWeek: { event: EventItem; sessionDate: string }[] = [];
  events.forEach(e => {
    if (e.status === 'COMPLETED') return;
    e.schedules.forEach(s => {
      if (!s.date) return;
      const [y, m, d] = s.date.split('-').map(Number);
      const sessionD = new Date(y, m - 1, d);
      sessionD.setHours(0, 0, 0, 0);
      if (sessionD >= currentWeekMonday && sessionD < nextWeekMonday) {
        upcomingMeetingsThisWeek.push({ event: e, sessionDate: s.date });
      }
    });
  });

  const meetingsToday = events.filter(e => {
    const dynamicStatus = computeEventStatus(e.schedules, e.status === 'COMPLETED');
    return dynamicStatus === 'DUE TODAY';
  });

  const dueSoonProjects: { project: ProjectItem; targetDate: string }[] = [];
  const dueTodayProjects: { project: ProjectItem; targetDate: string }[] = [];
  const overdueProjects: { project: ProjectItem; targetDate: string }[] = [];

  projects.forEach(p => {
    if (p.status === 'Completed') return;
    const targetDate = getProjectTargetDueDate(p);
    if (!targetDate) return;

    const [y, m, d] = targetDate.split('-').map(Number);
    const targetD = new Date(y, m - 1, d);
    targetD.setHours(0, 0, 0, 0);

    const diffTime = targetD.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      overdueProjects.push({ project: p, targetDate });
    } else if (diffDays === 0) {
      dueTodayProjects.push({ project: p, targetDate });
    } else if (diffDays > 0 && diffDays <= 7) {
      dueSoonProjects.push({ project: p, targetDate });
    }
  });

  const dueSoonProposals: ProposalItem[] = [];
  const dueTodayProposals: ProposalItem[] = [];

  proposals.forEach(p => {
    if (p.completionStatus === 'Accepted') return;
    const deadlineStatus = computeProposalDeadlineStatus(p.deadline);
    if (deadlineStatus === 'Due Today') {
      dueTodayProposals.push(p);
    } else if (deadlineStatus === 'Due Soon') {
      dueSoonProposals.push(p);
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">High-level view of your workspace.</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div 
          onClick={() => onNavigateTab('projects')}
          className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs cursor-pointer hover:border-blue-300 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500">Total Active Engagements</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalEngagementsCount}</p>
        </div>

        <div 
          onClick={() => onNavigateTab('proposals')}
          className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs cursor-pointer hover:border-purple-300 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500">Total Pending Proposals</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{activeProposalsCount}</p>
        </div>

        <div 
          onClick={() => onNavigateTab('my-tasks')}
          className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs cursor-pointer hover:border-emerald-300 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500">My Pending Tasks</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{userPendingTasksCount}</p>
        </div>

        <div 
          onClick={() => onNavigateTab('my-tasks')}
          className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs cursor-pointer hover:border-indigo-300 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500">My Pending Proposals</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{userPendingProposalsCount}</p>
        </div>

        <div 
          onClick={() => onNavigateTab('my-tasks')}
          className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs cursor-pointer hover:border-amber-300 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500">My Active Meetings</span>
            <CalendarDays className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{userPendingMeetingsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Engagements Dashboard Column */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-600" /> Engagement Deadlines
          </h2>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-red-600 flex items-center gap-1.5 border-b pb-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Overdue Engagements ({overdueProjects.length})
            </h3>
            {overdueProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No overdue engagements.</p>
            ) : (
              <div className="space-y-2">
                {overdueProjects.map(({ project, targetDate }) => (
                  <div key={project.id} className="p-2.5 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{project.name}</p>
                      <p className="text-[10px] text-red-700 font-mono">Target: {formatFormattedDate(targetDate)}</p>
                    </div>
                    <button onClick={() => onOpenProject(project.id)} className="text-blue-600 hover:underline font-semibold shrink-0">Open</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-amber-600 flex items-center gap-1.5 border-b pb-2">
              <Clock className="w-3.5 h-3.5" /> Due Today ({dueTodayProjects.length})
            </h3>
            {dueTodayProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No engagements due today.</p>
            ) : (
              <div className="space-y-2">
                {dueTodayProjects.map(({ project, targetDate }) => (
                  <div key={project.id} className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{project.name}</p>
                      <p className="text-[10px] text-amber-800 font-mono">Due: {formatFormattedDate(targetDate)}</p>
                    </div>
                    <button onClick={() => onOpenProject(project.id)} className="text-blue-600 hover:underline font-semibold shrink-0">Open</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-blue-600 flex items-center gap-1.5 border-b pb-2">
              <Calendar className="w-3.5 h-3.5" /> Due Soon ({dueSoonProjects.length})
            </h3>
            {dueSoonProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No engagements due soon.</p>
            ) : (
              <div className="space-y-2">
                {dueSoonProjects.map(({ project, targetDate }) => (
                  <div key={project.id} className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{project.name}</p>
                      <p className="text-[10px] text-blue-700 font-mono">Target: {formatFormattedDate(targetDate)}</p>
                    </div>
                    <button onClick={() => onOpenProject(project.id)} className="text-blue-600 hover:underline font-semibold shrink-0">Open</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Proposals Dashboard Column */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" /> Proposals Schedule
          </h2>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-amber-600 flex items-center gap-1.5 border-b pb-2">
              <Clock className="w-3.5 h-3.5" /> Proposals Due Today ({dueTodayProposals.length})
            </h3>
            {dueTodayProposals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No proposals due today.</p>
            ) : (
              <div className="space-y-2">
                {dueTodayProposals.map(prop => (
                  <div key={prop.id} className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{prop.title}</p>
                      <p className="text-[10px] text-amber-800 font-mono">Deadline: {formatFormattedDate(prop.deadline)}</p>
                    </div>
                    <button onClick={() => onNavigateTab('proposals')} className="text-purple-600 hover:underline font-semibold shrink-0">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-purple-600 flex items-center gap-1.5 border-b pb-2">
              <Calendar className="w-3.5 h-3.5" /> Proposals Due Soon ({dueSoonProposals.length})
            </h3>
            {dueSoonProposals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No proposals due soon.</p>
            ) : (
              <div className="space-y-2">
                {dueSoonProposals.map(prop => (
                  <div key={prop.id} className="p-2.5 bg-purple-50/60 border border-purple-100 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{prop.title}</p>
                      <p className="text-[10px] text-purple-700 font-mono">Deadline: {formatFormattedDate(prop.deadline)}</p>
                    </div>
                    <button onClick={() => onNavigateTab('proposals')} className="text-purple-600 hover:underline font-semibold shrink-0">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meetings Dashboard Column */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-600" /> Meetings & Events
          </h2>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-amber-600 flex items-center gap-1.5 border-b pb-2">
              <Clock className="w-3.5 h-3.5" /> Meetings Today ({meetingsToday.length})
            </h3>
            {meetingsToday.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No meetings scheduled for today.</p>
            ) : (
              <div className="space-y-2">
                {meetingsToday.map(ev => (
                  <div key={ev.id} className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{ev.title}</p>
                      <p className="text-[10px] text-amber-800">Venue: {ev.venue}</p>
                    </div>
                    <button onClick={() => onNavigateTab('events')} className="text-amber-700 hover:underline font-semibold shrink-0">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b pb-2">
              <Calendar className="w-3.5 h-3.5" /> Meetings This Week ({upcomingMeetingsThisWeek.length})
            </h3>
            {upcomingMeetingsThisWeek.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No upcoming meetings this week.</p>
            ) : (
              <div className="space-y-2">
                {upcomingMeetingsThisWeek.map(({ event, sessionDate }, idx) => (
                  <div key={`${event.id}-${idx}`} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{event.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Date: {formatFormattedDate(sessionDate)}</p>
                    </div>
                    <button onClick={() => onNavigateTab('events')} className="text-blue-600 hover:underline font-semibold shrink-0">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ 
  currentUser, 
  staffMembers,
  notificationConfig,
  onSaveNotificationConfig,
  onSave,
  showToast
}: { 
  currentUser: StaffMember; 
  staffMembers: StaffMember[];
  notificationConfig: NotificationConfig;
  onSaveNotificationConfig: (config: NotificationConfig) => void;
  onSave: (updated: StaffMember) => void;
  showToast: (msg: string, type: 'error' | 'success' | 'info') => void;
}) {
  const [name, setName] = useState(currentUser.name);
  const [nickname, setNickname] = useState(currentUser.nickname);
  const [username, setUsername] = useState(currentUser.username || '');
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phoneNumber || '');
  const [department, setDepartment] = useState(currentUser.department);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailLeadNoticeInput, setEmailLeadNoticeInput] = useState(notificationConfig.email.leadNoticeDays.join(', '));
  const [smsLeadNoticeInput, setSmsLeadNoticeInput] = useState(notificationConfig.sms.leadNoticeDays.join(', '));

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...currentUser,
      name,
      nickname,
      username,
      email,
      phoneNumber: phone,
      department
    });
    showToast('Personal profile details updated.', 'success');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword !== currentUser.password) {
      return showToast('Incorrect old password.', 'error');
    }
    if (!newPassword) {
      return showToast('Please enter a new password.', 'error');
    }
    if (newPassword !== confirmPassword) {
      return showToast('New password and confirmation do not match.', 'error');
    }

    onSave({
      ...currentUser,
      password: newPassword
    });

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully.', 'success');
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parseLeadNoticeDays = (value: string) => value
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0)
      .filter((day, index, values) => values.indexOf(day) === index)
      .sort((a, b) => a - b);

    onSaveNotificationConfig({
      ...notificationConfig,
      email: { ...notificationConfig.email, leadNoticeDays: parseLeadNoticeDays(emailLeadNoticeInput) },
      sms: { ...notificationConfig.sms, leadNoticeDays: parseLeadNoticeDays(smsLeadNoticeInput) }
    });
    showToast('Alert schedule settings saved.', 'success');
  };

  const updateChannelConfig = (channel: 'email' | 'sms', changes: Partial<ChannelNotificationConfig>) => {
    onSaveNotificationConfig({
      ...notificationConfig,
      [channel]: { ...notificationConfig[channel], ...changes }
    });
  };

  const toggleRecipientRole = (channel: 'email' | 'sms', role: NotificationRecipientRole) => {
    const currentRoles = notificationConfig[channel].recipientRoles;
    updateChannelConfig(channel, {
      recipientRoles: currentRoles.includes(role)
        ? currentRoles.filter(currentRole => currentRole !== role)
        : [...currentRoles, role]
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Settings & Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your personal information.</p>
      </div>

      {/* Basic Profile Details */}
      <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-xs">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-blue-600" /> Basic Profile Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initials / Nickname *</label>
              <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none font-mono text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username *</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" />
                {currentUser.isEmailVerified && (
                  <span title="Email Verified" className="absolute right-3 top-1/2 -translate-y-1/2"><ShieldCheck className="w-4 h-4 text-emerald-600" /></span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact</label>
              <div className="relative">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800" />
                {currentUser.isPhoneVerified ? (
                  <span title="SMS Verified" className="absolute right-3 top-1/2 -translate-y-1/2"><ShieldCheck className="w-4 h-4 text-emerald-600" /></span>
                ) : (
                  <button type="button" onClick={() => showToast('SMS verification code sent to your phone.', 'info')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded border border-blue-200">Verify</button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none text-slate-800" placeholder="e.g. Audit Senior, Partner..." />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-xs transition">
            Update Profile Details
          </button>
        </div>
      </form>

      {/* Security Credentials Form */}
      <form onSubmit={handlePasswordSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-xs">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-blue-600" /> Security Credentials
          </h3>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Old Password *</label>
              <div className="relative">
                <input 
                  type={showOldPassword ? "text" : "password"} 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  className={PASSWORD_INPUT_STYLE} 
                  placeholder="Enter old password..." 
                />
                <button 
                  type="button" 
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className={PASSWORD_INPUT_STYLE} 
                  placeholder="Enter new password..." 
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className={PASSWORD_INPUT_STYLE} 
                  placeholder="Confirm new password..." 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-xs transition">
            Change Password
          </button>
        </div>
      </form>

      {/* Admin Automated Alerts Form */}
      {/* {currentUser.role === 'ADMIN' && (
        <form onSubmit={handleConfigSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4 text-blue-600" /> System Automated Alerts Configuration
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(['email', 'sms'] as const).map((channel) => {
              const config = notificationConfig[channel];
              const isEmail = channel === 'email';
              const leadNoticeInput = isEmail ? emailLeadNoticeInput : smsLeadNoticeInput;
              const setLeadNoticeInput = isEmail ? setEmailLeadNoticeInput : setSmsLeadNoticeInput;
              const label = isEmail ? 'Email notifications' : 'SMS notifications';

              return (
                <section key={channel} className="rounded-xl border border-slate-200 p-4 space-y-4">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="font-bold text-slate-800">{label}</span>
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(event) => updateChannelConfig(channel, { enabled: event.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">{isEmail ? 'Send alerts to verified email addresses.' : 'Send alerts only to verified mobile numbers.'}</p>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead alert days</label>
                    <input
                      type="text"
                      value={leadNoticeInput}
                      onChange={(event) => setLeadNoticeInput(event.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 1, 3, 7"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-2">Alert types</label>
                    <div className="space-y-1.5">
                      {([
                        ['notifyEngagements', 'Engagement deadlines'],
                        ['notifyProposals', 'Proposal deadlines'],
                        ['notifyMeetings', 'Meetings and events']
                      ] as const).map(([setting, settingLabel]) => (
                        <label key={setting} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={config[setting]} onChange={(event) => updateChannelConfig(channel, { [setting]: event.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                          <span>{settingLabel}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-2">Recipient groups</label>
                    <div className="space-y-1.5">
                      {([
                        ['ASSIGNED_STAFF', 'Assigned staff'],
                        ['MANAGER', 'Engagement managers'],
                        ['ADMIN', 'System administrators']
                      ] as const).map(([role, roleLabel]) => (
                        <label key={role} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={config.recipientRoles.includes(role)} onChange={() => toggleRecipientRole(channel, role)} className="rounded text-blue-600 focus:ring-blue-500" />
                          <span>{roleLabel}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Additional assigned staff</label>
                    <EventStaffMultiSearchSelect
                      staffMembers={staffMembers}
                      selectedStaffIds={config.assignedStaffIds}
                      onToggleStaff={(staffId) => updateChannelConfig(channel, {
                        assignedStaffIds: config.assignedStaffIds.includes(staffId)
                          ? config.assignedStaffIds.filter(id => id !== staffId)
                          : [...config.assignedStaffIds, staffId]
                      })}
                    />
                  </div>
                </section>
              );
            })}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-xs transition">
              Save Alert Settings
            </button>
          </div>
        </form>
      )}*/}
    </div>
  );
}

function MyTasksView({
  currentUser,
  projects,
  proposals,
  events,
  searchTerm,
  onOpenProject,
  onOpenProposals,
  onOpenEvents
}: {
  currentUser: StaffMember;
  projects: ProjectItem[];
  proposals: ProposalItem[];
  events: EventItem[];
  searchTerm: string;
  onOpenProject: (id: string) => void;
  onOpenProposals: () => void;
  onOpenEvents: () => void;
}) {
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PROJECTS' | 'PROPOSALS' | 'EVENTS'>('ALL');

  const pendingSubtasks: { project: ProjectItem; subtask: SubtaskItem }[] = [];
  const completedSubtasks: { project: ProjectItem; subtask: SubtaskItem }[] = [];

  projects.forEach(p => {
    p.subtasks.forEach(st => {
      if (st.assigneeNickname === currentUser.nickname) {
        if (!searchTerm || st.task.toLowerCase().includes(searchTerm.toLowerCase()) || p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          if (st.status === 'Completed') {
            completedSubtasks.push({ project: p, subtask: st });
          } else {
            pendingSubtasks.push({ project: p, subtask: st });
          }
        }
      }
    });
  });

  const pendingProposals: ProposalItem[] = [];
  const acceptedProposals: ProposalItem[] = [];

  proposals.forEach(pr => {
    if (pr.assignedStaffIds.includes(currentUser.id) &&
       (!searchTerm || pr.title.toLowerCase().includes(searchTerm.toLowerCase()))) {
      if (pr.completionStatus === 'Accepted') {
        acceptedProposals.push(pr);
      } else {
        pendingProposals.push(pr);
      }
    }
  });

  const pendingEvents: EventItem[] = [];
  const completedEvents: EventItem[] = [];

  events.forEach(ev => {
    if (ev.assignedStaffIds.includes(currentUser.id) &&
       (!searchTerm || ev.title.toLowerCase().includes(searchTerm.toLowerCase()) || ev.venue.toLowerCase().includes(searchTerm.toLowerCase()))) {
      const dynamicStatus = computeEventStatus(ev.schedules, ev.status === 'COMPLETED');
      if (dynamicStatus === 'COMPLETED' || dynamicStatus === 'PAST') {
        completedEvents.push(ev);
      } else {
        pendingEvents.push(ev);
      }
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks & Assignments</h1>
        <p className="text-xs text-slate-500 mt-1">Consolidated view of all tasks, proposals and meetings assigned to @{currentUser.nickname}.</p>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
        <span className="text-xs font-semibold text-slate-600 mr-2">Filter View:</span>
        {[
          { id: 'ALL', label: 'All Tasks' },
          { id: 'PROJECTS', label: 'Project Tasks' },
          { id: 'PROPOSALS', label: 'Proposals' },
          { id: 'EVENTS', label: 'Events/Meetings' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setTaskFilter(filter.id as any)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              taskFilter === filter.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {(taskFilter === 'ALL' || taskFilter === 'PROJECTS') && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <FolderKanban className="w-4 h-4 text-blue-600" /> Project Working Papers
            </h2>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Pending Tasks ({pendingSubtasks.length})
              </h3>
              {pendingSubtasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-200">No pending subtasks assigned.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {pendingSubtasks.map(({ project, subtask }) => (
                    <div key={subtask.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {subtask.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          {subtask.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{subtask.task}</h4>
                      <p className="text-[11px] text-slate-500 truncate">Project: {project.name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Due: {subtask.dueDate || 'Flexible'}</span>
                        <button onClick={() => onOpenProject(project.id)} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                          Open Engagement <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Completed Tasks ({completedSubtasks.length})
              </h3>
              {completedSubtasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-200">No completed subtasks yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {completedSubtasks.map(({ project, subtask }) => (
                    <div key={subtask.id} className="bg-white/80 border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {subtask.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 line-through">{subtask.task}</h4>
                      <p className="text-[11px] text-slate-500 truncate">Project: {project.name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Done</span>
                        <button onClick={() => onOpenProject(project.id)} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                          Open Engagement <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(taskFilter === 'ALL' || taskFilter === 'PROPOSALS') && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <FileText className="w-4 h-4 text-purple-600" /> Assigned Proposals & Tenders
            </h2>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Pending / Draft Proposals ({pendingProposals.length})
              </h3>
              {pendingProposals.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-200">No pending proposals.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {pendingProposals.map(pr => (
                    <div key={pr.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                          PROPOSAL
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {pr.completionStatus}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{pr.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{pr.description}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Deadline: {pr.deadline || 'None'}</span>
                        <button onClick={onOpenProposals} className="text-purple-600 hover:underline font-semibold flex items-center gap-1">
                          Open Proposals <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Accepted Proposals ({acceptedProposals.length})
              </h3>
              {acceptedProposals.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-200">No accepted proposals yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {acceptedProposals.map(pr => (
                    <div key={pr.id} className="bg-white/80 border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                          PROPOSAL
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Accepted
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{pr.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{pr.description}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Status: Accepted</span>
                        <button onClick={onOpenProposals} className="text-purple-600 hover:underline font-semibold flex items-center gap-1">
                          Open Proposals <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(taskFilter === 'ALL' || taskFilter === 'EVENTS') && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <CalendarDays className="w-4 h-4 text-amber-600" /> Assigned Meetings & Events
            </h2>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Upcoming / Due Meetings ({pendingEvents.length})
              </h3>
              {pendingEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-200">No active or upcoming meetings assigned.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {pendingEvents.map(ev => (
                    <div key={ev.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                          MEETING
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {computeEventStatus(ev.schedules, ev.status === 'COMPLETED')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                      <p className="text-[11px] text-slate-500">Venue: {ev.venue}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Sessions: {ev.schedules.length}</span>
                        <button onClick={onOpenEvents} className="text-amber-700 hover:underline font-semibold flex items-center gap-1">
                          Open Events <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Past / Completed Meetings ({completedEvents.length})
              </h3>
              {completedEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-200">No past or completed meetings.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {completedEvents.map(ev => (
                    <div key={ev.id} className="bg-white/80 border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          MEETING
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Past
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">{ev.title}</h4>
                      <p className="text-[11px] text-slate-500">Venue: {ev.venue}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Past Meeting</span>
                        <button onClick={onOpenEvents} className="text-amber-700 hover:underline font-semibold flex items-center gap-1">
                          Open Events <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectsView({ 
  projects, 
  staffMembers, 
  userRole,
  searchTerm,
  onAddClick, 
  onEditClick,
  onTogglePause,
  onOpenProject 
}: { 
  projects: ProjectItem[]; 
  staffMembers: StaffMember[]; 
  userRole: string;
  searchTerm: string;
  onAddClick: () => void; 
  onEditClick: (prj: ProjectItem) => void;
  onTogglePause: (id: string) => void;
  onOpenProject: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const canModify = userRole === 'ADMIN' || userRole === 'MANAGER';

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Engagements</h1>
          <p className="text-xs text-slate-500 mt-1">Manage active engagements, assigned team members and timelines.</p>
        </div>
        {canModify && (
          <button onClick={onAddClick} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition">
            <Plus className="w-4 h-4" /> New Engagement
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
        <span className="text-xs font-semibold text-slate-600 mr-2">Status Filter:</span>
        {['ALL', 'Planning', 'Active', 'On Hold', 'Completed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              statusFilter === status ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredProjects.map((prj) => {
          const manager = staffMembers.find((s) => s.id === prj.managerId);
          const totalTasks = prj.subtasks?.length || 0;
          const completedTasks = prj.subtasks?.filter(st => st.status === 'Completed').length || 0;
          const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div key={prj.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-bold text-slate-900 text-base leading-snug">{prj.name}</h3>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 ${
                  prj.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  prj.status === 'Planning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  prj.status === 'On Hold' ? 'bg-red-50 text-red-700 border border-red-100' :
                  'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {prj.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{prj.description || 'No description provided.'}</p>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-600">Audit Completion Progress</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                     {progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      progressPercentage === 100 ? 'bg-emerald-500' :
                      progressPercentage >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Audit PM Suite</span>
                  <span className="font-semibold text-slate-900">
                    {manager ? `${manager.name}` : 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Project Timeline:</span>
                  <span className="font-mono text-slate-700">{prj.startDate} → {prj.endDate || 'Ongoing'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {canModify && (
                  <>
                    <button 
                      onClick={() => onTogglePause(prj.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition ${
                        prj.isPaused 
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={prj.isPaused ? "Resume Project" : "Pause Project"}
                    >
                      {prj.isPaused ? <Play className="w-3.5 h-3.5 text-amber-600" /> : <Pause className="w-3.5 h-3.5 text-slate-500" />}
                      {prj.isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button 
                      onClick={() => onEditClick(prj)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </>
                )}
                <button 
                  onClick={() => onOpenProject(prj.id)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectDetailsView({ 
  project, 
  staffMembers, 
  userRole,
  userNickname,
  onBack, 
  onUpdateSubtasks 
}: { 
  project: ProjectItem; 
  staffMembers: StaffMember[]; 
  userRole: string;
  userNickname: string;
  onBack: () => void; 
  onUpdateSubtasks: (updated: SubtaskItem[]) => void;
}) {
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>(project.subtasks);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('PLANNING');

  const canModifyAll = userRole === 'ADMIN' || userRole === 'MANAGER';

  const toggleTaskAccordion = (id: string) => {
    setOpenTaskId(openTaskId === id ? null : id);
  };

  const handleSubtaskChange = (id: string, field: keyof SubtaskItem, value: any) => {
    const updated = subtasks.map(st => st.id === id ? { ...st, [field]: value } : st);
    setSubtasks(updated);
    onUpdateSubtasks(updated);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newId = `st-${Date.now()}`;
    const newSubtask: SubtaskItem = {
      id: newId,
      category: newTaskCategory,
      task: newTaskTitle,
      status: 'Not Started',
      assigneeNickname: '',
      dueDate: '',
      reviewedByNickname: '',
      comments: ''
    };
    const updated = [...subtasks, newSubtask];
    setSubtasks(updated);
    onUpdateSubtasks(updated);
    setNewTaskTitle('');
    setOpenTaskId(newId);
  };

  const handleDeleteSubtask = (id: string) => {
    if (confirm('Delete this task?')) {
      const updated = subtasks.filter(st => st.id !== id);
      setSubtasks(updated);
      onUpdateSubtasks(updated);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                project.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                project.status === 'Planning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                project.status === 'On Hold' ? 'bg-red-50 text-red-700 border border-red-100' :
                'bg-blue-50 text-blue-700 border border-blue-100'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Audit Job Control Checklist</p>
          </div>
        </div>
      </div>

      {canModifyAll && (
        <form onSubmit={handleAddSubtask} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <select 
            value={newTaskCategory} 
            onChange={(e) => setNewTaskCategory(e.target.value)}
            className="border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-slate-50 outline-none text-slate-800"
          >
            <option value="PLANNING">PLANNING</option>
            <option value="EXECUTION">EXECUTION</option>
            <option value="REPORTING">REPORTING</option>
          </select>

          <input 
            type="text" 
            placeholder="Type new audit task area..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          />

          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </form>
      )}

      <div className="space-y-6">
        {['PLANNING', 'EXECUTION', 'REPORTING'].map((cat) => {
          const categoryTasks = subtasks.filter(st => (st.category || 'PLANNING') === cat);
          if (categoryTasks.length === 0) return null;

          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {cat} PHASE ({categoryTasks.length})
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="space-y-3">
                {categoryTasks.map((st) => {
                  const isOpen = openTaskId === st.id;
                  const canEditTask = canModifyAll || st.assigneeNickname === userNickname;

                  return (
                    <div 
                      key={st.id} 
                      className={`bg-white border rounded-xl shadow-xs transition ${
                        isOpen ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleTaskAccordion(st.id)}>
                        <div className="flex-1 pr-4">
                          {canModifyAll ? (
                            <input 
                              type="text" 
                              value={st.task} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleSubtaskChange(st.id, 'task', e.target.value)}
                              className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white outline-none py-0.5 rounded"
                            />
                          ) : (
                            <h4 className="text-sm font-bold text-slate-900">{st.task}</h4>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            st.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            st.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {st.status}
                          </span>

                          {st.assigneeNickname && (
                            <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              @{st.assigneeNickname}
                            </span>
                          )}

                          <button type="button" className="p-1 text-slate-400 hover:text-slate-600 rounded">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 rounded-b-xl text-xs">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Status</label>
                              <select 
                                value={st.status} 
                                disabled={!canEditTask}
                                onChange={(e) => handleSubtaskChange(st.id, 'status', e.target.value as any)}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white outline-none font-semibold text-slate-800 disabled:bg-slate-100"
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Audit Assignee</label>
                              <StaffSingleSearchSelect
                                staffMembers={staffMembers}
                                selectedNickname={st.assigneeNickname}
                                onChange={(nickname) => handleSubtaskChange(st.id, 'assigneeNickname', nickname)}
                                disabled={!canModifyAll}
                                placeholder="Search staff..."
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Target Due Date</label>
                              <input 
                                type="date" 
                                value={st.dueDate} 
                                disabled={!canModifyAll}
                                onChange={(e) => handleSubtaskChange(st.id, 'dueDate', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white outline-none font-mono disabled:bg-slate-100 text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Manager / Reviewer</label>
                              <StaffSingleSearchSelect
                                staffMembers={staffMembers}
                                selectedNickname={st.reviewedByNickname}
                                onChange={(nickname) => handleSubtaskChange(st.id, 'reviewedByNickname', nickname)}
                                disabled={!canModifyAll}
                                placeholder="Search reviewer..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                              Comments & Working Notes
                            </label>
                            <textarea 
                              rows={3}
                              placeholder="Record notes, test findings, or comments..."
                              value={st.comments} 
                              disabled={!canEditTask}
                              onChange={(e) => handleSubtaskChange(st.id, 'comments', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs outline-none bg-white focus:ring-2 focus:ring-blue-500 text-slate-800 leading-relaxed disabled:bg-slate-100"
                            />
                          </div>

                          {canModifyAll && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                              <span className="text-[11px] text-slate-400">Ref ID: {st.id}</span>
                              <button 
                                type="button"
                                onClick={() => handleDeleteSubtask(st.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-semibold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Subtask
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProposalsView({
  proposals,
  setProposals,
  staffMembers,
  userRole,
  searchTerm,
  onAddClick,
  onEditClick
}: {
  proposals: ProposalItem[];
  setProposals: any;
  staffMembers: StaffMember[];
  userRole: string;
  searchTerm: string;
  onAddClick: () => void;
  onEditClick: (pr: ProposalItem) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const canModify = userRole === 'ADMIN' || userRole === 'MANAGER';

  const handleDeleteProposal = (id: string) => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      setProposals(proposals.filter((pr: ProposalItem) => pr.id !== id));
    }
  };

  const handleCompletionStatusChange = (id: string, newStatus: 'Draft' | 'Submitted' | 'Accepted') => {
    setProposals(proposals.map((pr: ProposalItem) => pr.id === id ? { ...pr, completionStatus: newStatus } : pr));
  };

  const filteredProposals = proposals.filter(pr => {
    const matchesSearch = pr.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pr.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || pr.completionStatus === statusFilter;
    
    let matchesDate = true;
    if (pr.deadline) {
      if (startDate && pr.deadline < startDate) matchesDate = false;
      if (endDate && pr.deadline > endDate) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proposals & Tenders</h1>
          <p className="text-xs text-slate-500 mt-1">Track proposals, submission deadlines and client acceptance statuses.</p>
        </div>
        {canModify && (
          <button onClick={onAddClick} className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 shadow-xs transition">
            <Plus className="w-4 h-4" /> Create Proposal
          </button>
        )}
      </div>

      <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl shadow-xs gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <span className="font-semibold text-slate-600">Status:</span>
          {['ALL', 'Draft', 'Submitted', 'Accepted'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 font-semibold rounded-lg transition ${
                statusFilter === status ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 font-semibold text-slate-600">
          <span>Deadline Range:</span>
          <input type="date" value={startDate} onChange={(e) => { const nextStartDate = e.target.value; setStartDate(nextStartDate); if (endDate && nextStartDate > endDate) setEndDate(''); }} className="border border-slate-300 rounded p-1 font-mono text-xs bg-slate-50 outline-none text-slate-800" />
          <span>to</span>
          <input type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-300 rounded p-1 font-mono text-xs bg-slate-50 outline-none text-slate-800" />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-red-600 hover:underline text-xs ml-1">Clear</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredProposals.map((pr) => {
          const deadlineStatus = computeProposalDeadlineStatus(pr.deadline);
          const assignedNames = pr.assignedStaffIds
            .map(id => {
              const staff = staffMembers.find(s => s.id === id);
              return staff ? `${staff.name}` : null;
            })
            .filter(Boolean);

          return (
            <div key={pr.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      deadlineStatus === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                      deadlineStatus === 'Due Today' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      deadlineStatus === 'Due Soon' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {deadlineStatus}
                    </span>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      pr.completionStatus === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      pr.completionStatus === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {pr.completionStatus}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{pr.title}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {canModify && (
                    <button 
                      onClick={() => onEditClick(pr)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
                      title="Edit Proposal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {userRole === 'ADMIN' && (
                    <button 
                      onClick={() => handleDeleteProposal(pr.id)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="Delete Proposal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{pr.description}</p>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Deadline:
                  </span>
                  <span className="font-mono text-slate-800">{pr.deadline || 'Not set'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-900">Assigned Team:</span> 
                  <span className="truncate">{assignedNames.join(', ') || 'Unassigned'}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-slate-900">Completion Status:</span>
                  <select 
                    value={pr.completionStatus}
                    disabled={!canModify}
                    onChange={(e) => handleCompletionStatusChange(pr.id, e.target.value as any)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs outline-none bg-white font-semibold text-slate-800 disabled:bg-slate-100"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Accepted">Accepted</option>
                  </select>
                </div>

                {pr.comments && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-900 block mb-0.5 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-600" /> Notes:
                    </span>
                    <p className="bg-slate-50 p-2 rounded border border-slate-200/60 text-[11px] text-slate-700 italic">
                      "{pr.comments}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventsView({ 
  events, 
  setEvents, 
  staffMembers, 
  userRole, 
  searchTerm,
  onAddClick,
  onEditClick
}: { 
  events: EventItem[]; 
  setEvents: any; 
  staffMembers: StaffMember[]; 
  userRole: string; 
  searchTerm: string;
  onAddClick: () => void;
  onEditClick: (ev: EventItem) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const canModify = userRole === 'ADMIN' || userRole === 'MANAGER';

  const toggleComplete = (id: string) => {
    setEvents(events.map((ev: EventItem) => {
      if (ev.id === id) {
        const nextStatus = ev.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED';
        return { ...ev, status: nextStatus };
      }
      return ev;
    }));
  };

  const deleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter((ev: EventItem) => ev.id !== id));
    }
  };

  const filteredEvents = events.filter(ev => {
    const dynamicStatus = computeEventStatus(ev.schedules, ev.status === 'COMPLETED');
    const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ev.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ev.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || dynamicStatus === statusFilter;

    let matchesDate = true;
    if (startDate || endDate) {
      const hasSessionInRange = ev.schedules.some(sch => {
        if (!sch.date) return false;
        if (startDate && sch.date < startDate) return false;
        if (endDate && sch.date > endDate) return false;
        return true;
      });
      matchesDate = hasSessionInRange;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events & Client Meetings</h1>
          <p className="text-xs text-slate-500 mt-1">Schedule client presentations and meetings.</p>
        </div>
        {canModify && (
          <button onClick={onAddClick} className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 shadow-xs transition">
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        )}
      </div>

      <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl shadow-xs gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <span className="font-semibold text-slate-600">Status:</span>
          {['ALL', 'UPCOMING', 'DUE TODAY', 'PAST', 'COMPLETED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 font-semibold rounded-lg transition ${
                statusFilter === status ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 font-semibold text-slate-600">
          <span>Meeting Date Range:</span>
          <input type="date" value={startDate} onChange={(e) => { const nextStartDate = e.target.value; setStartDate(nextStartDate); if (endDate && nextStartDate > endDate) setEndDate(''); }} className="border border-slate-300 rounded p-1 font-mono text-xs bg-slate-50 outline-none text-slate-800" />
          <span>to</span>
          <input type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-300 rounded p-1 font-mono text-xs bg-slate-50 outline-none text-slate-800" />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-red-600 hover:underline text-xs ml-1">Clear</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredEvents.map((ev) => {
          const dynamicStatus = computeEventStatus(ev.schedules, ev.status === 'COMPLETED');
          const assignedNames = ev.assignedStaffIds
            .map(id => {
              const staff = staffMembers.find(s => s.id === id);
              return staff ? `${staff.name}` : null;
            })
            .filter(Boolean);

          return (
            <div key={ev.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${
                    dynamicStatus === 'PAST' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                    dynamicStatus === 'DUE TODAY' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    dynamicStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                    'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {dynamicStatus}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{ev.title}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => toggleComplete(ev.id)}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                      dynamicStatus === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Mark Completed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  {canModify && (
                    <button 
                      onClick={() => onEditClick(ev)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
                      title="Edit Event Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {userRole === 'ADMIN' && (
                    <button 
                      onClick={() => deleteEvent(ev.id)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600">{ev.description}</p>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Venue:</span> {ev.venue}
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Assigned Team:</span> {assignedNames.join(', ') || 'None'}
                </div>

                <div className="pt-2">
                  <span className="font-semibold text-slate-900 block mb-1">Scheduled Session Times:</span>
                  <div className="space-y-1">
                    {ev.schedules.map((s, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200/60 flex justify-between font-mono text-[11px]">
                        <span>📅 {s.date}</span>
                        <span>⏰ {s.startTime} - {s.endTime || 'No end time'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StaffActionMenu({
  staff,
  copiedId,
  isLastRow,
  handleCopyInviteLink,
  onResetPassword,
  onEditClick
}: {
  staff: StaffMember;
  copiedId: string | null;
  isLastRow: boolean;
  handleCopyInviteLink: (s: StaffMember) => void;
  onResetPassword: (s: StaffMember) => void;
  onEditClick: (s: StaffMember) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        title="User Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 space-y-1 text-xs font-medium ${
          isLastRow ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          <button
            onClick={() => {
              handleCopyInviteLink(staff);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-lg flex items-center gap-2 text-amber-700 transition"
          >
            <Copy className="w-3.5 h-3.5" /> {copiedId === staff.id ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={() => {
              onResetPassword(staff);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-lg flex items-center gap-2 text-purple-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Password
          </button>

          <button
            onClick={() => {
              onEditClick(staff);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-blue-700 transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      )}
    </div>
  );
}

function StaffView({ 
  staffMembers, 
  searchTerm, 
  onAddClick, 
  onEditClick, 
  onResetPassword,
  userRole,
  showToast 
}: { 
  staffMembers: StaffMember[]; 
  searchTerm: string; 
  onAddClick: () => void; 
  onEditClick: (staff: StaffMember) => void; 
  onResetPassword: (staff: StaffMember) => void;
  userRole: string; 
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyInviteLink = (s: StaffMember) => {
    const token = s.setupToken || `token-${Date.now()}`;
    const shareableUrl = `${window.location.origin}${window.location.pathname}?setupToken=${token}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedId(s.id);
    showToast('Setup link copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredStaff = staffMembers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users & Access</h1>
          <p className="text-xs text-slate-500 mt-1">Manage personnel roles, trigger password resets, and generate setup links.</p>
        </div>
        {userRole === 'ADMIN' && (
          <button onClick={onAddClick} className="bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 shadow-xs transition">
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-visible shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
              <th className="py-3.5 px-6">Name</th>
              <th className="py-3.5 px-6">Initials</th>
              <th className="py-3.5 px-6">Email / Username</th>
              <th className="py-3.5 px-6">Designation</th>
              <th className="py-3.5 px-6">Role</th>
              {userRole === 'ADMIN' && <th className="py-3.5 px-6 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredStaff.map((s, index) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-semibold text-slate-900">{s.name}</td>
                <td className="py-4 px-6 font-mono text-xs text-blue-600 font-bold">@{s.nickname}</td>
                <td className="py-4 px-6 text-slate-600 text-xs">
                  <div>{s.email}</div>
                  <div className="font-mono text-[10px] text-slate-400">{s.username ? `@${s.username}` : 'Setup Pending'}</div>
                </td>
                <td className="py-4 px-6 text-slate-600">{s.department}</td>
                <td className="py-4 px-6">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold inline-block whitespace-nowrap ${
                    s.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    s.role === 'MANAGER' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {s.role}
                  </span>
                </td>
                {userRole === 'ADMIN' && (
                  <td className="py-4 px-6 text-right">
                    <StaffActionMenu
                      staff={s}
                      copiedId={copiedId}
                      isLastRow={index >= filteredStaff.length - 2}
                      handleCopyInviteLink={handleCopyInviteLink}
                      onResetPassword={onResetPassword}
                      onEditClick={onEditClick}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Modals
function ProposalFormModal({ 
  initialData, 
  staffMembers, 
  onClose, 
  onSave,
  showToast
}: { 
  initialData: ProposalItem | null; 
  staffMembers: StaffMember[]; 
  onClose: () => void; 
  onSave: (pr: ProposalItem) => void; 
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [deadline, setDeadline] = useState(initialData?.deadline || '');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(initialData?.assignedStaffIds || []);
  const [completionStatus, setCompletionStatus] = useState<'Draft' | 'Submitted' | 'Accepted'>(initialData?.completionStatus || 'Draft');
  const [comments, setComments] = useState(initialData?.comments || '');

  const handleStaffToggle = (id: string) => {
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return showToast('Title and Deadline date are required.', 'error');

    onSave({
      id: initialData?.id || `PROP-${Date.now()}`,
      title,
      description,
      deadline,
      assignedStaffIds: selectedStaffIds,
      completionStatus,
      comments
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-900">
          {initialData ? 'Edit Proposal Details' : 'Create New Proposal'}
        </h2>

        <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Proposal Title *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" placeholder="e.g. FY2027 Audit Tender - Zenith Ltd" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" rows={2} placeholder="Scope, requirements, client details..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Submission Deadline *</label>
              <input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none font-mono text-slate-800" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Completion Status</label>
              <select value={completionStatus} onChange={(e) => setCompletionStatus(e.target.value as any)} className="w-full border border-slate-300 rounded-lg p-2 outline-none bg-white font-semibold text-slate-800">
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Accepted">Accepted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Team Members</label>
            <EventStaffMultiSearchSelect
              staffMembers={staffMembers}
              selectedStaffIds={selectedStaffIds}
              onToggleStaff={handleStaffToggle}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Comments & Notes</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" rows={2} placeholder="Partner comments, review notes..." />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-xs font-semibold text-slate-600 rounded-lg">Cancel</button>
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-xs font-semibold text-white rounded-lg hover:bg-blue-700">
              {initialData ? 'Update Proposal' : 'Save Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectFormModal({ initialData, staffMembers, onClose, onSave, showToast }: { initialData: ProjectItem | null; staffMembers: StaffMember[]; onClose: () => void; onSave: (project: ProjectItem) => void; showToast: (msg: string, type?: 'error' | 'success' | 'info') => void }) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [managerId, setManagerId] = useState(initialData?.managerId || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !managerId || !startDate) return showToast('Please fill in required fields.', 'error');

    if (endDate && startDate > endDate) {
      return showToast('Start Date must be before or equal to End Date.', 'error');
    }

    onSave({
      id: initialData?.id || `PRJ-${Date.now()}`,
      name,
      description,
      managerId,
      startDate,
      endDate: endDate || undefined,
      status: initialData?.status || 'Planning',
      isPaused: initialData?.isPaused || false,
      subtasks: initialData?.subtasks || []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          {initialData ? 'Edit Engagement Details' : 'Create New Audit Engagement'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Engagement Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" placeholder="e.g. FY2026 Audit - Zenith Ltd" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit PM Suite *</label>
            <select required value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800">
              <option value="">Select Project Manager...</option>
              {staffMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (@{m.nickname}) - {m.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" rows={3} placeholder="Audit engagement scope..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date (Optional)</label>
              <input type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold rounded-lg">Cancel</button>
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              {initialData ? 'Update Engagement' : 'Create Engagement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddEventModal({ 
  initialData, 
  staffMembers, 
  onClose, 
  onSave,
  showToast
}: { 
  initialData: EventItem | null; 
  staffMembers: StaffMember[]; 
  onClose: () => void; 
  onSave: (ev: EventItem) => void; 
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [venue, setVenue] = useState(initialData?.venue || '');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(initialData?.assignedStaffIds || []);
  const [schedules, setSchedules] = useState<EventSchedule[]>(
    initialData?.schedules || [{ date: '', startTime: '09:00', endTime: '10:00' }]
  );

  const handleStaffToggle = (id: string) => {
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleRemoveSchedule = (indexToRemove: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== indexToRemove));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venue) return showToast('Title and Venue are required.', 'error');

    for (let sch of schedules) {
      if (sch.startTime && sch.endTime && sch.startTime >= sch.endTime) {
        return showToast('Meeting Start Time must be strictly earlier than End Time.', 'error');
      }
    }

    onSave({
      id: initialData?.id || `EV-${Date.now()}`,
      title,
      description,
      venue,
      assignedStaffIds: selectedStaffIds,
      schedules,
      status: initialData?.status || 'UPCOMING'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-900">
          {initialData ? 'Edit Event Details' : 'Schedule Event / Client Meeting'}
        </h2>
        
        <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" placeholder="e.g. Audit Closing Board Presentation" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Venue *</label>
            <input type="text" required value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" placeholder="e.g. Client Boardroom / Teams Link" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" rows={2} placeholder="Meeting agenda and scope..." />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Staff</label>
            <EventStaffMultiSearchSelect
              staffMembers={staffMembers}
              selectedStaffIds={selectedStaffIds}
              onToggleStaff={handleStaffToggle}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Schedules & Times</label>
            {schedules.map((sch, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input 
                  type="date" 
                  value={sch.date} 
                  onChange={(e) => {
                    const updated = [...schedules];
                    updated[i].date = e.target.value;
                    setSchedules(updated);
                  }} 
                  className="border border-slate-300 rounded p-1.5 outline-none text-xs text-slate-800" 
                />
                <input 
                  type="time" 
                  value={sch.startTime} 
                  onChange={(e) => {
                    const updated = [...schedules];
                    updated[i].startTime = e.target.value;
                    setSchedules(updated);
                  }} 
                  className="border border-slate-300 rounded p-1.5 outline-none text-xs text-slate-800" 
                />
                <span className="text-slate-400">to</span>
                <input 
                  type="time" 
                  value={sch.endTime} 
                  onChange={(e) => {
                    const updated = [...schedules];
                    updated[i].endTime = e.target.value;
                    setSchedules(updated);
                  }} 
                  min={sch.startTime || undefined}
                  className="border border-slate-300 rounded p-1.5 outline-none text-xs text-slate-800" 
                />

                {schedules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(i)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition shrink-0"
                    title="Remove Schedule Day"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => setSchedules([...schedules, { date: '', startTime: '09:00', endTime: '10:00' }])} 
              className="text-blue-600 font-semibold hover:underline text-xs"
            >
              + Add Another Day
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-xs font-semibold text-slate-600 rounded-lg">Cancel</button>
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-xs font-semibold text-white rounded-lg hover:bg-blue-700">
              {initialData ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffFormModal({ initialData, onClose, onSave, showToast, currentUserRole }: { initialData: StaffMember | null; onClose: () => void; onSave: (staff: StaffMember) => void; showToast: (msg: string, type?: 'error' | 'success' | 'info') => void; currentUserRole?: string }) {
  const [name, setName] = useState(initialData?.name || '');
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [department, setDepartment] = useState(initialData?.department || 'Audit Senior');
  
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF'>(
    initialData?.role || 'STAFF'
  );

  const canEditRole = currentUserRole === 'ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nickname || !email) return showToast('Name, Initials, and Email are required.', 'error');

    onSave({
      id: initialData?.id || Date.now().toString(),
      name,
      nickname,
      username,
      email,
      department,
      role: canEditRole ? role : (initialData?.role || 'STAFF'),
      password: initialData?.password,
      isAccountSetup: initialData?.isAccountSetup ?? false,
      setupToken: initialData?.setupToken || `token-${Date.now()}`
    });
    onClose();
  };

  const handleCopyLink = () => {
    const token = initialData?.setupToken || `token-${Date.now()}`;
    const shareableUrl = `${window.location.origin}${window.location.pathname}?setupToken=${token}`;
    navigator.clipboard.writeText(shareableUrl);
    showToast('Setup invite link copied to clipboard!', 'info');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          {initialData ? 'Edit User Details' : 'Add Audit Staff Member'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initials / Nickname *</label>
              <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none font-mono text-slate-800" />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none font-mono text-slate-800" placeholder="e.g. jmensah" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Designation</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800" placeholder="e.g. Audit Senior, Partner..." />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role & Authority</label>
            <select 
              value={role} 
              disabled={!canEditRole}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'STAFF')} 
              className="w-full border border-slate-300 rounded-lg p-2 outline-none bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            {!canEditRole && (
              <p className="text-[10px] text-slate-400 mt-1 italic">Only Administrators can change user roles.</p>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            {initialData ? (
              <button 
                type="button" 
                onClick={handleCopyLink}
                className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 transition flex items-center gap-1"
                title="Copy shareable account setup URL"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Invite Link
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold rounded-lg">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                {initialData ? 'Update Account' : 'Create Staff'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
