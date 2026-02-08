import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_SUBTITLE}`,
  description: `${APP_NAME} - ${APP_SUBTITLE}`,
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
