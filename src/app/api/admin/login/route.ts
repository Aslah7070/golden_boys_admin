import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import Admin from '@/models/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectToDatabase();

    const adminUser = await Admin.findOne({ email });

    if (!adminUser || adminUser.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 86400, // 1 day in seconds
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ message: 'Login successful' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 500 });
  }
}
