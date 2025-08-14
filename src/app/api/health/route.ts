import { NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * Health check endpoint for deployment verification
 * Used by nixpacks/coolify to verify the application is running correctly
 */
export async function GET() {
  try {
    // Test database connectivity by running a simple query
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        environment: process.env.NODE_ENV || "development",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed",
        environment: process.env.NODE_ENV || "development",
      },
      { status: 503 }
    );
  }
}
