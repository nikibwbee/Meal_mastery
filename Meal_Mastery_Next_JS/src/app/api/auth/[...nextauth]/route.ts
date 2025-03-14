import NextAuth from "next-auth";
import { authOptions } from "./options"; // Ensure this path is correct

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
