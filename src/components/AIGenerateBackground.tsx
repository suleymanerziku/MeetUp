"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateBackground } from '@/ai/flows/generate-background';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

type AIGenerateBackgroundProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackgroundGenerated: (dataUri: string) => void;
};

export function AIGenerateBackground({ open, onOpenChange, onBackgroundGenerated }: AIGenerateBackgroundProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const result = await generateBackground({ prompt });
      if (result.backgroundDataUri) {
        setGeneratedImage(result.backgroundDataUri);
      } else {
        throw new Error("AI did not return an image.");
      }
    } catch (error) {
      console.error("Failed to generate background:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate a background. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyBackground = () => {
    if (generatedImage) {
      onBackgroundGenerated(generatedImage);
      onOpenChange(false);
      setGeneratedImage(null);
      setPrompt('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate AI Background</DialogTitle>
          <DialogDescription>
            Describe the virtual background you want to create. Be as descriptive as you like!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="prompt"
            placeholder="e.g., A cozy library with a fireplace, a futuristic city skyline at night..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="col-span-3"
          />
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center h-48 bg-muted rounded-md">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {generatedImage && !isLoading && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image src={generatedImage} alt="Generated AI background" fill className="object-cover" />
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate'}
          </Button>
          {generatedImage && (
            <Button onClick={handleApplyBackground} variant="default">
              Apply Background
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
