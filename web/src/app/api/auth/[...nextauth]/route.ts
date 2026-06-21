import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      if (session.user) {
        session.user.id = user.id;
        
        // Tự động gán quyền ADMIN cho email chỉ định nếu chưa được cập nhật trong DB
        if (user.email === 'trungkim8694@gmail.com' && user.role !== 'ADMIN') {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
          });
          user.role = 'ADMIN';
        }
        
        session.user.role = user.role || "USER";
      }
      return session;
    },
  },
  pages: {
    // We can define custom sign-in page here later
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
