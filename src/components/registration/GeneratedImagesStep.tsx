import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Download, Image, Share2 } from 'lucide-react';
import { UserData } from './RegistrationWizard';
import { LoadingSpinner } from './LoadingSpinner';

interface GeneratedImagesStepProps {
  userData: UserData;
  onNext: () => void;
  onPrev: () => void;
}

export const GeneratedImagesStep = ({ userData, onNext, onPrev }: GeneratedImagesStepProps) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<{
    profileWithFlag: string | null;
    socialBanner: string | null;
    admissionBanner: string | null;
  }>({
    profileWithFlag: null,
    socialBanner: null,
    admissionBanner: null,
  });

  useEffect(() => {
    // Simulate image generation process
    const generateImages = async () => {
      setIsGenerating(true);
      
      // Simulate API calls with delays
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedImages(prev => ({ ...prev, profileWithFlag: '/placeholder.svg' }));
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGeneratedImages(prev => ({ ...prev, socialBanner: '/placeholder.svg' }));
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGeneratedImages(prev => ({ ...prev, admissionBanner: '/placeholder.svg' }));
      
      setIsGenerating(false);
    };

    generateImages();
  }, []);

  const getGroupColor = () => {
    switch (userData.selectedGroup) {
      case 'A': return 'group-a';
      case 'B': return 'group-b';
      case 'C': return 'group-c';
      case 'D': return 'group-d';
      default: return 'primary';
    }
  };

  const images = [
    {
      title: 'Profile with Flag Background',
      description: 'Your profile picture with your group flag as background',
      src: generatedImages.profileWithFlag,
      aspect: 'aspect-square',
    },
    {
      title: 'Social Media Banner',
      description: 'Perfect for your social media profiles',
      src: generatedImages.socialBanner,
      aspect: 'aspect-[3/1]',
    },
    {
      title: 'Admission Banner',
      description: 'Celebrate your admission to the program',
      src: generatedImages.admissionBanner,
      aspect: 'aspect-[4/3]',
    },
  ];

  const allImagesGenerated = images.every(img => img.src !== null);

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Your Personalized Content</CardTitle>
          <p className="text-center text-muted-foreground">
            We're generating your custom images with {userData.selectedGroup && `Group ${userData.selectedGroup}`} theme
          </p>
        </CardHeader>
        <CardContent>
          {isGenerating && (
            <div className="text-center py-12">
              <LoadingSpinner />
              <p className="text-lg font-medium mt-4">Generating your personalized content...</p>
              <p className="text-muted-foreground mt-2">This may take a few moments</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {images.map((image, index) => (
              <div key={index} className="space-y-4">
                <div className={`
                  ${image.aspect} w-full bg-muted rounded-lg overflow-hidden border-2 relative
                  ${image.src ? `border-${getGroupColor()}` : 'border-border'}
                `}>
                  {image.src ? (
                    <img 
                      src={image.src} 
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isGenerating ? (
                        <div className="text-center">
                          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Generating...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Pending</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-sm text-muted-foreground">{image.description}</p>
                  
                  {image.src && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onPrev}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={onNext} 
              disabled={!allImagesGenerated}
              size="lg"
              className={allImagesGenerated ? `bg-${getGroupColor()} hover:bg-${getGroupColor()}/90` : ''}
            >
              Complete Registration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};