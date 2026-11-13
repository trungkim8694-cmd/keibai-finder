import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

async function autoLinkClaimedCompany(userId: string, email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Check if any approved claim requests exist for this email
    const approvedClaims = await (prisma as any).companyClaimRequest.findMany({
      where: {
        applicantEmail: cleanEmail,
        status: "APPROVED",
      },
    });

    for (const claim of approvedClaims) {
      await (prisma as any).realEstateCompany.update({
        where: { id: claim.companyId },
        data: {
          claimedUserId: userId,
          isClaimed: true,
          isVerified: true,
        },
      });
      if (!claim.userId) {
        await (prisma as any).companyClaimRequest.update({
          where: { id: claim.id },
          data: { userId },
        });
      }
    }
  } catch (err) {
    console.error("[AUTH] Error auto-linking claimed company:", err);
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 365 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "email-otp-link",
      name: "Email OTP & Magic Link",
      credentials: {
        email: { label: "Email", type: "text" },
        otp: { label: "OTP Code", type: "text" },
        token: { label: "Magic Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const cleanEmail = credentials.email.trim().toLowerCase();
        const otpCode = ((credentials as any).otp || (credentials as any).otpCode)?.trim();
        const magicToken = ((credentials as any).token || (credentials as any).magicToken)?.trim();

        if (!otpCode && !magicToken) return null;

        const record = await (prisma as any).authOtpToken.findUnique({
          where: { email: cleanEmail },
        });

        if (!record) return null;

        let isValid = false;

        // Verify via 6-digit OTP
        if (otpCode && record.otpCode === otpCode) {
          if (record.otpExpires && new Date(record.otpExpires) > new Date()) {
            isValid = true;
          }
        }

        // Verify via Magic Link Token
        if (!isValid && magicToken && record.token === magicToken) {
          if (record.tokenExpires && new Date(record.tokenExpires) > new Date()) {
            isValid = true;
          }
        }

        if (!isValid) {
          // Increment failed attempts
          await (prisma as any).authOtpToken.update({
            where: { email: cleanEmail },
            data: { attempts: { increment: 1 } },
          });
          return null;
        }

        // Successfully verified: Find or Create User in DB
        let user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        const adminEmails = (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com")
          .split(",")
          .map((e) => e.trim().toLowerCase());
        const shouldBeAdmin = adminEmails.includes(cleanEmail);

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: cleanEmail,
              name: cleanEmail.split("@")[0],
              emailVerified: new Date(),
              role: shouldBeAdmin ? "ADMIN" : "USER",
            },
          });
        } else {
          const updates: any = {};
          if (!user.emailVerified) updates.emailVerified = new Date();
          if (shouldBeAdmin && user.role !== "ADMIN") updates.role = "ADMIN";
          if (Object.keys(updates).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updates,
            });
          }
        }

        // Auto-link claimed companies to this user
        await autoLinkClaimedCompany(user.id, cleanEmail);

        // Clear one-time OTP
        await (prisma as any).authOtpToken.update({
          where: { email: cleanEmail },
          data: { otpCode: null, attempts: 0 },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === "google" && user?.email) {
        try {
          const cleanEmail = user.email.toLowerCase().trim();
          const adminEmails = (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com")
            .split(",")
            .map((e) => e.trim().toLowerCase());
          const shouldBeAdmin = adminEmails.includes(cleanEmail);

          let dbUser = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: cleanEmail,
                name: user.name || cleanEmail.split("@")[0],
                image: user.image,
                emailVerified: new Date(),
                role: shouldBeAdmin ? "ADMIN" : "USER",
              },
            });
          } else {
            const updates: any = {};
            if (!dbUser.emailVerified) updates.emailVerified = new Date();
            if (user.image && !dbUser.image) updates.image = user.image;
            if (shouldBeAdmin && dbUser.role !== "ADMIN") updates.role = "ADMIN";
            if (Object.keys(updates).length > 0) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: updates,
              });
            }
          }

          user.id = dbUser.id;
          user.role = dbUser.role;

          await autoLinkClaimedCompany(dbUser.id, cleanEmail);
        } catch (err) {
          console.error("[AUTH] Error in Google signIn callback:", err);
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "USER";
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role || "USER";
        session.user.email = token.email;

        // Auto promote to ADMIN if email matches
        const adminEmails = (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com")
          .split(",")
          .map((e) => e.trim().toLowerCase());
        if (session.user.email && adminEmails.includes(session.user.email.toLowerCase()) && session.user.role !== "ADMIN") {
          session.user.role = "ADMIN";
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/?login=true",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-keibai-2026-very-secure",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
