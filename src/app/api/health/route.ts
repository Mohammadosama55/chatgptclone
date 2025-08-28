import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    return NextResponse.json({ 
      status: "unhealthy", 
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: "Database connection failed"
    }, { status: 500 });
  }
}