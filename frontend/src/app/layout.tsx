
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


import Navbar from "@/components/Navbar"; 
import { UserProvider } from "@/app/settings/UserContext"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "English AI Tutor",
  description: "Học tiếng Anh với AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <Navbar /> 
          <main className="container mx-auto p-4">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}