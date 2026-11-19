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
      id: "otp-magic-link",
      name: "OTP Magic Link",
      credentials: {
        token: { label: "Verification Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const record = await (prisma as any).verificationToken.findUnique({
          where: { token: credentials.token },
        });

        if (!record || record.expires < new Date()) {
          throw new Error("Invalid or expired token");
        }

        // Delete used token immediately
        await (prisma as any).verificationToken.delete({
          where: { token: credentials.token },
        });

        // Upsert user
        let user = await (prisma as any).user.findUnique({
          where: { email: record.identifier.toLowerCase() },
        });

        if (!user) {
          user = await (prisma as any).user.create({
            data: {
              email: record.identifier.toLowerCase(),
              role: "USER",
              name: record.identifier.split("@")[0],
            },
          });
        }

        // Auto link if company claim exists
        await autoLinkClaimedCompany(user.id, user.email);

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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
          const cleanEmail = user.email.toLowerCase();
          let existingUser = await (prisma as any).user.findUnique({
            where: { email: cleanEmail },
          });

          if (!existingUser) {
            existingUser = await (prisma as any).user.create({
              data: {
                email: cleanEmail,
                name: user.name || cleanEmail.split("@")[0],
                image: user.image,
                role: "USER",
              },
            });
          }

          user.id = existingUser.id;
          (user as any).role = existingUser.role;

          await autoLinkClaimedCompany(existingUser.id, cleanEmail);
        } catch (e) {
          console.error("[AUTH] Error in signIn callback for google:", e);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
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
