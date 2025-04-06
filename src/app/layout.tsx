"use client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Web Part Intelligize</title>
      </head>
      <body className="main-body">{children}</body>
    </html>
  );
}
