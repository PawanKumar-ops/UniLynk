import "./globals.css";
import SessionWrapper from "../components/SessionWrapper";

export const metadata = {
  title: "Unilynk",
  description: "UniLynk — Your student journey, achievements and opportunities",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
