// Minimal shim to support components referencing react-router-dom APIs
// Used during migration to Next.js Pages Router
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to }) => {
  const router = useRouter();
  React.useEffect(() => {
    router.push(to);
  }, [to, router]);
  return null;
};

export const Outlet: React.FC = ({ children }) => {
  // In Next.js we render children directly; existing Layout now accepts children
  return <>{children}</>;
};

export const LinkShim: React.FC<
  { to: string; className?: string; children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>
> = ({ to, children, ...rest }) => {
  return (
    <Link href={to} {...rest}>
      {children as any}
    </Link>
  );
};

// react-router-dom NavLink compatibility (supports className fn receiving { isActive })
export const NavLink: React.FC<
  {
    to: string;
    className?: string | ((opts: { isActive: boolean; isPending?: boolean; isTransitioning?: boolean }) => string);
    children?: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>
> = ({ to, className, children, ...rest }) => {
  const router = useRouter();
  const asPath = typeof window === 'undefined' ? router.asPath || '' : window.location.pathname + window.location.search + window.location.hash;
  const currentPath = (asPath || '').split('?')[0].split('#')[0];
  const isActive = currentPath === to;
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <Link href={to} {...rest} className={computedClassName}>
      {children as any}
    </Link>
  );
};

// Named exports to match common imports
export { LinkShim as Link };

// Hooks
export const useParams = <T extends Record<string, string>>() => {
  const { query } = useRouter();
  return query as unknown as T;
};

export const useNavigate = () => {
  const router = useRouter();
  return (to: string) => router.push(to);
};

export const useLocation = () => {
  const router = useRouter();
  const asPath = typeof window === 'undefined' ? router.asPath || '' : window.location.pathname + window.location.search + window.location.hash;
  const pathname = (asPath || '').split('?')[0].split('#')[0];
  return { pathname } as { pathname: string };
};

// Router placeholder (not used directly in Next.js)
export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Routes = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Route = ({ children }: { children: React.ReactNode }) => <>{children}</>;