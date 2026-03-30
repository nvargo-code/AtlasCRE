export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dark:bg-gray-950 dark:text-gray-100">{children}</div>;
}
