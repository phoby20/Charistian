import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logged out" });
    response.cookies.set("token", "", { maxAge: 0, httpOnly: true });
    return response;
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
