import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL || 'aslah.c77@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Aslah@123';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (email !== adminEmail || password !== adminPassword) {
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
