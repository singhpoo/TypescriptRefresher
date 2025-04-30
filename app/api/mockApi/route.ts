import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "";

  // Use a Promise to handle the delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        NextResponse.json({
          success: true,
          query: query,
        })
      );
    }, 1000);
  });
}
