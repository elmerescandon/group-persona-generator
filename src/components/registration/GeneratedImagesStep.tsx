import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Download, Image, Share2, Archive } from 'lucide-react';
import { UserData } from './RegistrationWizard';
import { loadImage, addMaskBorders, createSocialBanner, createAdmissionBanner } from '@/lib/backgroundRemoval';
import { toast } from 'sonner';

interface GeneratedImagesStepProps {
  userData: UserData;
  onNext: () => void;
  onPrev: () => void;
}

export const GeneratedImagesStep = ({ userData, onNext, onPrev }: GeneratedImagesStepProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<{
    profileWithFlag: string | null;
    socialBanner: string | null;
    admissionBanner: string | null;
  }>({
    profileWithFlag: null,
    socialBanner: null,
    admissionBanner: null,
  });
  const [loadingStates, setLoadingStates] = useState({
    profileWithFlag: true,
    socialBanner: true,
    admissionBanner: true,
  });


  useEffect(() => {
    // Generate images automatically when component mounts
    const generateImages = async () => {
      try {
        const userName = `${userData.firstName} ${userData.lastName}`;
        const groupColor = getGroupHexColor();
        
        // Generate profile with mask borders if profile picture exists
        if (userData.profilePicture) {
          toast.info('Processing profile picture...');
          const imageElement = await loadImage(userData.profilePicture);
          const profileWithFlag = await addMaskBorders(imageElement, userData.selectedGroup || 'A');
          const profileUrl = URL.createObjectURL(profileWithFlag);
          
          setGeneratedImages(prev => ({ ...prev, profileWithFlag: profileUrl }));
          setLoadingStates(prev => ({ ...prev, profileWithFlag: false }));
        } else {
          setLoadingStates(prev => ({ ...prev, profileWithFlag: false }));
        }
        
        // Generate social banner
        toast.info('Creating social media banner...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
        const socialBanner = await createSocialBanner(userData.selectedGroup || 'A', userName, groupColor);
        const socialUrl = URL.createObjectURL(socialBanner);
        setGeneratedImages(prev => ({ ...prev, socialBanner: socialUrl }));
        setLoadingStates(prev => ({ ...prev, socialBanner: false }));
        
        // Generate admission banner
        toast.info('Creating admission banner...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const admissionBanner = await createAdmissionBanner(userData.selectedGroup || 'A', userName, groupColor);
        const admissionUrl = URL.createObjectURL(admissionBanner);
        setGeneratedImages(prev => ({ ...prev, admissionBanner: admissionUrl }));
        setLoadingStates(prev => ({ ...prev, admissionBanner: false }));
        
        toast.success('All images generated successfully!');
      } catch (error) {
        console.error('Error generating images:', error);
        toast.error('Failed to generate some images. Please try again.');
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

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${userData.firstName}_${userData.lastName}_${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success(`${filename} downloaded successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image. Please try again.');
    }
  };

  const handleDownloadAll = async () => {
    const imagesToDownload = [
      { url: generatedImages.profileWithFlag, filename: 'profile_with_flag' },
      { url: generatedImages.socialBanner, filename: 'social_banner' },
      { url: generatedImages.admissionBanner, filename: 'admission_banner' }
    ].filter(img => img.url !== null);

    if (imagesToDownload.length === 0) {
      toast.error('No images available to download');
      return;
    }

    toast.info('Downloading all images...');
    
    for (const image of imagesToDownload) {
      await handleDownloadImage(image.url!, image.filename);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
    }
    
    toast.success(`Downloaded ${imagesToDownload.length} images!`);
  };

  const images = [
    {
      key: 'profileWithFlag',
      title: 'Profile with Flag Background',
      description: 'Your profile picture with your group flag as background',
      src: generatedImages.profileWithFlag,
      aspect: 'aspect-square',
      filename: 'profile_with_flag',
      isLoading: loadingStates.profileWithFlag,
    },
    {
      key: 'socialBanner',
      title: 'Social Media Banner',
      description: 'Perfect for your social media profiles',
      src: generatedImages.socialBanner,
      aspect: 'aspect-[3/1]',
      filename: 'social_banner',
      isLoading: loadingStates.socialBanner,
    },
    {
      key: 'admissionBanner',
      title: 'Admission Banner',
      description: 'Celebrate your admission to the program',
      src: generatedImages.admissionBanner,
      aspect: 'aspect-[4/3]',
      filename: 'admission_banner',
      isLoading: loadingStates.admissionBanner,
    },
  ];

  const allImagesGenerated = images.every(img => img.src !== null);
  const hasNextImage = currentImageIndex < images.length - 1;
  const hasPrevImage = currentImageIndex > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Your Personalized Content</CardTitle>
          <p className="text-center text-muted-foreground">
            We're generating your custom images with {userData.selectedGroup && `Group ${userData.selectedGroup}`} theme
          </p>
        </CardHeader>
        <CardContent>
          {/* Carousel Container */}
          <div className="relative mb-8">
            {/* Image Display Area - Fixed Height */}
            <div className="h-[500px] relative overflow-hidden rounded-lg border-2 border-border">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  {images[currentImageIndex].isLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-lg font-medium">Generating {images[currentImageIndex].title}...</p>
                        <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
                      </div>
                    </div>
                  ) : images[currentImageIndex].src ? (
                    <img 
                      src={images[currentImageIndex].src} 
                      alt={images[currentImageIndex].title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No image available</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {hasPrevImage && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                onClick={() => setCurrentImageIndex(prev => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            
            {hasNextImage && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                onClick={() => setCurrentImageIndex(prev => prev + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {/* Carousel Dots */}
            <div className="flex justify-center mt-4 space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Image Info */}
          <motion.div
            key={`info-${currentImageIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center mb-4"
          >
            <h3 className="text-xl font-semibold mb-2">{images[currentImageIndex].title}</h3>
            <p className="text-muted-foreground">{images[currentImageIndex].description}</p>
          </motion.div>

          {/* Download Buttons - No Animation */}
          <div className="flex justify-center gap-4 mb-6">
            {images[currentImageIndex].src && (
              <Button 
                onClick={() => handleDownloadImage(images[currentImageIndex].src!, images[currentImageIndex].filename)}
                className="flex-1 max-w-xs"
              >
                <Download className="w-4 h-4 mr-2" />
                Download This Image
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleDownloadAll}
              disabled={!allImagesGenerated}
              className="flex-1 max-w-xs"
            >
              <Archive className="w-4 h-4 mr-2" />
              Download All ({images.filter(img => img.src).length})
            </Button>
          </div>

          {/* Navigation */}
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