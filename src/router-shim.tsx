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

export const Outlet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  // In Next.js we render children directly; existing Layout now accepts children
  return <>{children}</>;
};

type AnchorProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'>;

export const LinkShim: React.FC<
  AnchorProps & { to: string; className?: string; children?: React.ReactNode }
> = ({ to, children, className, ...rest }) => {
  return (
    <Link href={to} {...rest} className={className}>
      {children as any}
    </Link>
  );
};

// react-router-dom NavLink compatibility (supports className fn receiving { isActive })
export const NavLink: React.FC<
  AnchorProps & {
    to: string;
    className?: string | ((opts: { isActive: boolean; isPending?: boolean; isTransitioning?: boolean }) => string);
    children?: React.ReactNode;
  }
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
// Accept common props to satisfy type-checking when using React Router APIs

type BrowserRouterProps = { children: React.ReactNode };
export const BrowserRouter: React.FC<BrowserRouterProps> = ({ children }) => <>{children}</>;

type RoutesProps = { children: React.ReactNode };
export const Routes: React.FC<RoutesProps> = ({ children }) => <>{children}</>;

// Minimal Route props-compatible shim
// Supports path, element, index, and children so TypeScript doesn't error
// At runtime we simply render the provided element or children

type RouteProps = {
  path?: string;
  element?: React.ReactNode;
  index?: boolean;
  caseSensitive?: boolean;
  children?: React.ReactNode;
};

export const Route: React.FC<RouteProps> = ({ element, children }) => {
  return <>{element ?? children ?? null}</>;
};