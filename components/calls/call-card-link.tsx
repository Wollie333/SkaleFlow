'use client';

interface CallCardLinkProps {
  roomCode: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Opens the call room in a full-screen window with autoJoin.
 * Used instead of <Link> to avoid embedding the call inside the dashboard layout.
 */
export function CallCardLink({ roomCode, children, className }: CallCardLinkProps) {
  return (
    <button
      onClick={() => window.open(`/call-room/${roomCode}?autoJoin=true`, '_blank')}
      className={className}
    >
      {children}
    </button>
  );
}
