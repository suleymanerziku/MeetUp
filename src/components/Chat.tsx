// src/components/Chat.tsx
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from 'lucide-react';
import { User } from 'firebase/auth';
import { Message } from '@/hooks/use-webrtc';
import { format } from 'date-fns';

type ChatProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUser: User | null;
};

export function Chat({ open, onOpenChange, messages, onSendMessage, currentUser }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">Meeting Chat</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4 -mr-6">
          <div className="space-y-4 py-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${msg.senderId === currentUser?.uid ? 'justify-end' : ''}`}
              >
                {msg.senderId !== currentUser?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${msg.senderId}`} />
                    <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${msg.senderId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-lg px-3 py-2 max-w-xs break-words ${
                      msg.senderId === currentUser?.uid
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {msg.senderId === currentUser?.uid ? 'You' : msg.senderName} - {format(new Date(msg.timestamp), 'p')}
                  </span>
                </div>
                 {msg.senderId === currentUser?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${msg.senderId}`} />
                    <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter>
          <form onSubmit={handleSend} className="flex w-full items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              autoComplete="off"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
