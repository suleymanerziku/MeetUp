import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Video className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">MeetUp Mobile</h1>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
