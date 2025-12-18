'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

/**
 * Client component wrapper for ErrorBoundary
 * This is needed because ErrorBoundary must be a client component,
 * but it's used in the root layout which is a server component.
 */
export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

