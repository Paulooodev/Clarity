import { Lexend, Outfit } from "next/font/google";
import "./globals.css";
import SideNav, { MobileBar } from './components/SideNav';

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "Clarity - think first, review honestly",
  description: "Log the decision before you act. Review the reasoning after — separately from how it turned out.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${outfit.variable}`}
    >
      <body className="flex flex-col min-h-screen bg-paper text-ink antialiased">
          <MobileBar />
        <div className="flex flex-1">
          <SideNav />
          <main className="min-w-0 flex-1 px-5 py-10 md:px-10 md:py-14">
            {children}  
          </main>
        </div>

        <footer className="border-t border-rule">
          <div className="mx-auto max-w-[1180px] px-5 py-6 md:px-10">
            <p className="text-ink text-[13px]">
              Clarity is a thinking tool, not care. It doesn&apos;t diagnose or treat
              anything. If you&apos;re struggling with your mental health, talk to a doctor
              or someone you trust —{" "}
              <a 
                href="https://findahelpline.com"
                target="_blank"
                rel="noreferrer"
                className="text-muted underline underline-offset-4 hover:text-indigo"
              >
                find a helpline
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}