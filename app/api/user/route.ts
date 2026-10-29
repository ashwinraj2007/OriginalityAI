import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({
      authenticated: false,
      tier: 'guest',
      isStudent: false,
      isPaid: false,
      message: 'Sign in and verify with Student ID for free or activate a Paid Pass.',
    });
  }

  const user = session.user as any;

  return NextResponse.json({
    authenticated: true,
    user: {
      name: user.name,
      email: user.email,
      accessType: user.accessType,
      isStudent: user.isStudent ?? false,
      isPaid: user.isPaid ?? false,
      institutionName: user.institutionName,
      studentId: user.studentId,
      idCardUrl: user.idCardUrl,
      paymentPlan: user.paymentPlan,
      transactionId: user.transactionId,
      paidAt: user.paidAt,
      studentReason: user.studentReason,
      tier: user.tier || 'free_student',
      scansAllowed: 'unlimited',
    },
  });
}
