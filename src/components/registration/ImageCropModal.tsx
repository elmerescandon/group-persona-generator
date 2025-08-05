import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { getCroppedImg, type CropArea } from '@/lib/cropImage';
import { Crop, RotateCcw, ZoomIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  fileName?: string;
}

interface CropperArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageCropModal = ({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onCropComplete,
  fileName = 'profile-picture.jpg'
}: ImageCropModalProps) => {
  const { toast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropperArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropAreaChange = useCallback(
    (croppedArea: CropperArea, croppedAreaPixels: CropperArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) {
      toast({
        title: "Error",
        description: "Please select an area to crop",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels as CropArea,
        rotation,
        { horizontal: false, vertical: false },
        fileName
      );
      
      toast({
        title: "Success",
        description: "Image cropped successfully",
      });
      
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    onClose();
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Crop Your Profile Picture
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1} // 1:1 aspect ratio for square crop
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onRotationChange={onRotationChange}
              onCropAreaChange={onCropAreaChange}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f3f4f6',
                },
                cropAreaStyle: {
                  border: '2px solid #3b82f6',
                },
                mediaStyle: {
                  maxHeight: '100%',
                  maxWidth: '100%',
                },
              }}
            />
          </div>

          <div className="space-y-4 mt-6">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ZoomIn className="w-4 h-4" />
                Zoom: {Math.round(zoom * 100)}%
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RotateCcw className="w-4 h-4" />
                Rotation: {rotation}°
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={resetCrop}
              className="w-full"
              size="sm"
            >
              Reset Crop
            </Button>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex-1 sm:flex-none"
            >
              {isProcessing ? 'Processing...' : 'Crop & Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};