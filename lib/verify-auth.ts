import { getAdminAuth } from "./firebase-admin";

export async function verifyAuth(request: Request): Promise<{ uid: string; email?: string } | null> {
  // Skip auth verification if Firebase admin is not configured
  if (!process.env.FIREBASE_PROJECT_ID) {
    return { uid: "anonymous", email: undefined };
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
