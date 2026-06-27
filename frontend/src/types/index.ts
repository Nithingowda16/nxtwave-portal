export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MENTOR' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  role: Role;
  studentId?: string;
  employeeId?: string;
  name: string;
  profilePhoto?: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  mobile: string;
  address?: string;
  aadhaar?: string;
  college?: string;
  branch?: string;
  semester?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  profilePhoto?: string;
}

export interface EMI {
  id: string;
  emiNumber: number;
  dueDate: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  receiptUrl?: string;
  lateFee: number;
}

export interface LiveClass {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  liveUrl?: string;
  mentorName: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subject: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  maxMarks: number;
  deadline: string;
}

export interface Submission {
  id: string;
  fileUrl: string;
  submitTime: string;
  marks?: number;
  feedback?: string;
  gradedAt?: string;
  assignment: Assignment;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  attachment?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    role: Role;
    profile?: {
      name: string;
      profilePhoto?: string;
    };
  };
}

export interface ChatRoom {
  id: string;
  studentId?: string;
  mentorId?: string;
  isAdmin: boolean;
  student?: {
    user: {
      profile?: { name: string };
    };
  };
  mentor?: {
    user: {
      profile?: { name: string };
    };
  };
  messages?: ChatMessage[];
}
