import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performDetection } from '@/lib/detector-service';
import { ScanRequest } from '@/types/detector';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce requirement: User must be signed in AND (verify with Student ID OR have Paid access)
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Access Restricted: You must sign in and verify your Student ID for 100% Free Access or activate a Paid Pass to use the detector.',
          requiresAuth: true,
          requiresAccess: true,
        },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const hasStudentAccess = user.isStudent === true;
    const hasPaidAccess = user.isPaid === true;

    if (!hasStudentAccess && !hasPaidAccess) {
      return NextResponse.json(
        { 
          error: 'Access Restricted: Please complete Student ID verification for free access or activate a Paid Pass to proceed.',
          requiresAccess: true,
        },
        { status: 403 }
      );
    }

    const body: ScanRequest = await req.json();
    const { text, title, checkParaphrase, checkWebPlagiarism, checkAiWriting } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid submission: Text content is required.' },
        { status: 400 }
      );
    }

    const trimmed = text.trim();
    if (trimmed.length < 20) {
      return NextResponse.json(
        { error: 'Text is too short for reliable analysis. Please provide at least 20 characters.' },
        { status: 400 }
      );
    }

    // Limit to 25,000 characters per scan (~4,000 words) for free student tier / 50,000 for paid
    const maxChars = hasPaidAccess ? 50000 : 25000;
    if (trimmed.length > maxChars) {
      return NextResponse.json(
        { error: `Document exceeds scan limit (maximum ${maxChars.toLocaleString()} characters per scan).` },
        { status: 413 }
      );
    }

    const result = await performDetection(trimmed, {
      documentTitle: title || 'Document Analysis',
      checkParaphrase: checkParaphrase ?? true,
      checkWebPlagiarism: checkWebPlagiarism ?? true,
      checkAiWriting: checkAiWriting ?? true,
    });

    return NextResponse.json({
      success: true,
      data: result,
      userTier: user.tier || (hasStudentAccess ? 'free_student' : 'pro_paid'),
      isStudent: hasStudentAccess,
      isPaid: hasPaidAccess,
      accessType: user.accessType,
    });
  } catch (error: any) {
    console.error('API /api/detect error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal detector engine error.' },
      { status: 500 }
    );
  }
}
