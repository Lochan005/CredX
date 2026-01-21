import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Credx Loan Angel API',
    version: '1.0.0'
  });
}
