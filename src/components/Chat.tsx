// src/components/Chat.tsx
import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User as UserIcon, Send } from 'lucide-react';
import { User } from 'firebase/auth';
import { Message } from '@/hooks/use-webrtc';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


type ChatProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUser: User | null;
};

export function Chat({ open, onOpenChange, messages, onSendMessage, currentUser }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:w-[420px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="font-headline text-lg">Meeting Chat</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4 p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                    "flex items-end gap-2", 
                    msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
                )}
              >
                {msg.senderId !== currentUser?.uid && (
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${msg.senderName}`} />
                     <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                     </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                    "max-w-[75%] rounded-lg p-2 px-3 shadow-sm",
                    msg.senderId === currentUser?.uid 
                        ? "bg-primary text-primary-foreground rounded-br-none" 
                        : "bg-muted rounded-bl-none"
                )}>
                  <p className="text-sm font-medium text-foreground/80">
                    {msg.senderId !== currentUser?.uid ? msg.senderName : ''}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                   <p className="text-xs text-right text-muted-foreground/70 mt-1">
                      {format(new Date(msg.timestamp), 'p')}
                  </p>
                </div>
                 {msg.senderId === currentUser?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${msg.senderName}`} />
                    <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t bg-background">
          <form onSubmit={handleSend} className="flex w-full items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
