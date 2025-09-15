import type { AppProps } from 'next/app';
import Script from 'next/script';
import '../src/index.css';
import { AuthProvider } from '../src/contexts/AuthContext';
import { DataProvider } from '../src/contexts/DataContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Google tag (gtag.js) - KPIbrain */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-6LCG04K0W8"
        strategy="afterInteractive"
      />
      <Script id="ga-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);} 
          gtag('js', new Date());
          gtag('config', 'G-6LCG04K0W8');
        `}
      </Script>

      <AuthProvider>
        <DataProvider>
          <Component {...pageProps} />
        </DataProvider>
      </AuthProvider>
    </>
  );
}