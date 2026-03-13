import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { APP_NAME, APP_SUBTITLE, THEME_STORAGE_KEY } from '@/lib/constants';

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
  const themeInitializationScript = `
    (() => {
      try {
        const savedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme === 'dark' || savedTheme === 'light'
          ? savedTheme
          : (prefersDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      } catch (_) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  `;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
