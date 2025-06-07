import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: string;
}

export interface Session {
  user: User;
  expires: string;
  sessionToken: string;
}

// Simple session management for demo (in production, use NextAuth.js or similar)
export class AuthService {
  private static sessions = new Map<string, Session>();
  private static users = new Map<string, User>();
  private static sessionFile = path.join(process.cwd(), ".sessions.json");
  private static userFile = path.join(process.cwd(), ".users.json");

  // Load sessions from file
  private static loadSessions() {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const data = fs.readFileSync(this.sessionFile, "utf8");
        const sessions = JSON.parse(data);
        this.sessions = new Map(Object.entries(sessions));
        console.log(`📂 Loaded ${this.sessions.size} sessions from disk`);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  }

  // Save sessions to file
  private static saveSessions() {
    try {
      const sessionsObj = Object.fromEntries(this.sessions);
      fs.writeFileSync(this.sessionFile, JSON.stringify(sessionsObj, null, 2));
    } catch (error) {
      console.error("Error saving sessions:", error);
    }
  }

  // Load users from file
  private static loadUsers() {
    try {
      if (fs.existsSync(this.userFile)) {
        const data = fs.readFileSync(this.userFile, "utf8");
        const users = JSON.parse(data);
        this.users = new Map(Object.entries(users));
        console.log(`📂 Loaded ${this.users.size} users from disk`);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }

  // Save users to file
  private static saveUsers() {
    try {
      const usersObj = Object.fromEntries(this.users);
      fs.writeFileSync(this.userFile, JSON.stringify(usersObj, null, 2));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  }

  // Initialize storage
  private static initStorage() {
    if (this.sessions.size === 0) {
      this.loadSessions();
      this.loadUsers();
    }
  }

  // Debug method to get all sessions
  static debug_getAllSessions(): Map<string, Session> {
    this.initStorage();
    return this.sessions;
  }

  // Create or get user by email
  static async createOrGetUser(userData: {
    email: string;
    name: string;
    phone?: string;
  }): Promise<User> {
    this.initStorage();

    const existingUser = Array.from(this.users.values()).find(
      (user) => user.email === userData.email
    );

    if (existingUser) {
      // Update user data if needed
      existingUser.name = userData.name;
      existingUser.phone = userData.phone;
      this.saveUsers();
      return existingUser;
    }

    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      created_at: new Date().toISOString(),
    };

    this.users.set(newUser.id, newUser);
    this.saveUsers();
    return newUser;
  }

  // Create session for user
  static async createSession(user: User): Promise<string> {
    this.initStorage();

    const sessionToken = crypto.randomUUID();
    const session: Session = {
      user,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      sessionToken,
    };

    this.sessions.set(sessionToken, session);
    this.saveSessions();
    return sessionToken;
  }

  // Get session from token
  static async getSession(sessionToken: string): Promise<Session | null> {
    this.initStorage();

    console.log(
      "Looking up session for token:",
      sessionToken
        ? sessionToken.substring(0, 5) +
            "..." +
            sessionToken.substring(sessionToken.length - 5)
        : "null"
    );
    console.log("Available sessions:", Array.from(this.sessions.keys()).length);

    const session = this.sessions.get(sessionToken);
    if (!session) {
      console.log("No session found for token");
      return null;
    }

    // Check if session is expired
    if (new Date(session.expires) < new Date()) {
      console.log("Session expired");
      this.sessions.delete(sessionToken);
      this.saveSessions();
      return null;
    }

    console.log("Session found for user:", session.user.email);
    return session;
  }

  // Get user from request
  static async getUserFromRequest(request: NextRequest): Promise<User | null> {
    this.initStorage();

    // Log request info for debugging
    console.log("Processing auth request");

    // First try from Authorization header (for localStorage token) - prioritize this
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log(
        "Found auth header with token:",
        token.substring(0, 5) + "..." + token.substring(token.length - 5)
      );
      const session = await this.getSession(token);
      if (session?.user) {
        console.log("Authenticated via header token:", session.user.email);
        return session.user;
      }
    }

    // If header auth failed, try from cookies
    const sessionToken = request.cookies.get("session-token")?.value;
    if (sessionToken) {
      console.log("Found session cookie token");
      const session = await this.getSession(sessionToken);
      if (session?.user) {
        console.log("Authenticated via cookie token:", session.user.email);
        return session.user;
      }
    }

    console.log("No valid authentication found");
    return null;
  }

  // Destroy session
  static async destroySession(sessionToken: string): Promise<void> {
    this.initStorage();
    this.sessions.delete(sessionToken);
    this.saveSessions();
  }
}
