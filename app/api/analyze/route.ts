import { NextRequest, NextResponse } from 'next/server';

// For local development, you can either:
// 1. Run FastAPI backend separately and proxy to it
// 2. Or use this as a placeholder that calls the Python function when deployed

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy to local FastAPI backend for development
    if (process.env.NODE_ENV === 'development') {
      try {
        const response = await fetch(`${API_URL}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json(
            { 
              error: 'Backend error',
              message: errorText || 'FastAPI backend returned an error',
              hint: 'Make sure FastAPI is running: cd app/loan_angel_backend && python -m uvicorn main:app --reload --port 8000'
            },
            { status: response.status }
          );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
      } catch (fetchError: any) {
        // Network error - backend not running
        if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
          return NextResponse.json(
            { 
              error: 'Backend not available',
              message: 'FastAPI backend is not running on port 8000',
              hint: 'Start it with: cd app/loan_angel_backend && python -m uvicorn main:app --reload --port 8000'
            },
            { status: 503 }
          );
        }
        throw fetchError;
      }
    }
    
    // For production, Vercel will use the Python serverless function
    return NextResponse.json(
      { error: 'Not implemented in Next.js route. Use Python serverless function.' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
