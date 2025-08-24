import { Navbar } from "@/components/Navbar";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="dark ">
      <Navbar />
      <h2>Dashboard layout</h2>
      {children}
    </main>
  );
}
