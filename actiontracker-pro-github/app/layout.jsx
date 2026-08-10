import "./globals.css";

export const metadata = {
  title: "ActionTracker Pro",
  description: "Professional Action & Task Management System"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
