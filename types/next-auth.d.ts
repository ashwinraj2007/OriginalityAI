import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: 'student' | 'standard';
      accessType: 'student_free' | 'paid_pro';
      isStudent: boolean;
      isPaid: boolean;
      institutionName?: string;
      studentId?: string;
      idCardUrl?: string;
      studentReason?: string;
      tier: 'free_student' | 'pro_paid';
      paymentPlan?: string;
      transactionId?: string;
      paidAt?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    userType?: 'student' | 'standard';
    accessType?: 'student_free' | 'paid_pro';
    isStudent?: boolean;
    isPaid?: boolean;
    institutionName?: string;
    studentId?: string;
    idCardUrl?: string;
    studentReason?: string;
    tier?: 'free_student' | 'pro_paid';
    paymentPlan?: string;
    transactionId?: string;
    paidAt?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    userType?: 'student' | 'standard';
    accessType?: 'student_free' | 'paid_pro';
    isStudent?: boolean;
    isPaid?: boolean;
    institutionName?: string;
    studentId?: string;
    idCardUrl?: string;
    studentReason?: string;
    tier?: 'free_student' | 'pro_paid';
    paymentPlan?: string;
    transactionId?: string;
    paidAt?: string;
  }
}
