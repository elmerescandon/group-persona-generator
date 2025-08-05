import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Download, Image, Share2, Wand2 } from 'lucide-react';
import { UserData } from './RegistrationWizard';
import { LoadingSpinner } from './LoadingSpinner';
import { loadImage, addColorBackground, addMaskBorders, createSocialBanner, createAdmissionBanner } from '@/lib/backgroundRemoval';
import { toast } from 'sonner';

interface GeneratedImagesStepProps {
  userData: UserData;
  onNext: () => void;
  onPrev: () => void;
}

export const GeneratedImagesStep = ({ userData, onNext, onPrev }: GeneratedImagesStepProps) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
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
    // Generate images automatically when component mounts
    const generateImages = async () => {
      setIsGenerating(true);
      
      try {
        const userName = `${userData.firstName} ${userData.lastName}`;
        const groupColor = getGroupHexColor();
        
        // Generate profile with mask borders if profile picture exists
        if (userData.profilePicture) {
          toast.info('Processing profile picture...');
          const imageElement = await loadImage(userData.profilePicture);
          const profileWithFlag = await addMaskBorders(imageElement);
          const profileUrl = URL.createObjectURL(profileWithFlag);
          
          setGeneratedImages(prev => ({ ...prev, profileWithFlag: profileUrl }));
        }
        
        // Generate social banner
        toast.info('Creating social media banner...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
        const socialBanner = await createSocialBanner(userData.selectedGroup || 'A', userName, groupColor);
        const socialUrl = URL.createObjectURL(socialBanner);
        setGeneratedImages(prev => ({ ...prev, socialBanner: socialUrl }));
        
        // Generate admission banner
        toast.info('Creating admission banner...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const admissionBanner = await createAdmissionBanner(userData.selectedGroup || 'A', userName, groupColor);
        const admissionUrl = URL.createObjectURL(admissionBanner);
        setGeneratedImages(prev => ({ ...prev, admissionBanner: admissionUrl }));
        
        toast.success('All images generated successfully!');
      } catch (error) {
        console.error('Error generating images:', error);
        toast.error('Failed to generate some images. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateImages();
  }, [userData.profilePicture, userData.selectedGroup, userData.firstName, userData.lastName]);

  const getGroupColor = () => {
    switch (userData.selectedGroup) {
      case 'A': return 'group-a';
      case 'B': return 'group-b';
      case 'C': return 'group-c';
      case 'D': return 'group-d';
      default: return 'primary';
    }
  };

  const getGroupHexColor = () => {
    switch (userData.selectedGroup) {
      case 'A': return '#1e40af'; // Blue
      case 'B': return '#059669'; // Emerald
      case 'C': return '#ea580c'; // Orange
      case 'D': return '#7c3aed'; // Purple
      default: return '#3b82f6'; // Default blue
    }
  };

  const handleRemoveBackground = async () => {
    if (!userData.profilePicture) {
      toast.error('No profile picture found');
      return;
    }

    setIsProcessingBackground(true);
    try {
      toast.info('Regenerating profile image...');
      
      // Load the image
      const imageElement = await loadImage(userData.profilePicture);
      
      // Add mask borders
      const finalImage = await addMaskBorders(imageElement);
      
      // Convert to URL and update the profile image
      const imageUrl = URL.createObjectURL(finalImage);
      setGeneratedImages(prev => ({ ...prev, profileWithFlag: imageUrl }));
      
      toast.success('Profile image regenerated with mask borders!');
    } catch (error) {
      console.error('Image processing failed:', error);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsProcessingBackground(false);
    }
  };

  const images = [
    {
      title: 'Profile with Flag Background',
      description: 'Your profile picture with your group flag as background',
      src: generatedImages.profileWithFlag,
      aspect: 'aspect-square',
      hasBackgroundRemoval: true,
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
            ${image.src ? 'border-primary' : 'border-border'}
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
                  
                  <div className="flex gap-2">
                    {image.hasBackgroundRemoval && image.src && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="flex-1"
                        onClick={handleRemoveBackground}
                        disabled={isProcessingBackground}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {isProcessingBackground ? 'Processing...' : 'Regenerate'}
                      </Button>
                    )}
                    {image.src && (
                      <>
                        <Button size="sm" variant="outline" className={image.hasBackgroundRemoval ? 'flex-1' : 'flex-1'}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
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
            >
              Complete Registration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};