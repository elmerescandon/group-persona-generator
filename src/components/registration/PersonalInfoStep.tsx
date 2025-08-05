import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, User } from 'lucide-react';
import { UserData } from './RegistrationWizard';
import { ImageCropModal } from './ImageCropModal';
import { useToast } from '@/hooks/use-toast';

interface Country {
  name: string;
  flag: string;
}

const LATIN_AMERICAN_COUNTRIES: Country[] = [
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Bolivia', flag: '🇧🇴' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'Colombia', flag: '🇨🇴' },
  // { name: 'Costa Rica', flag: '🇨🇷' },
  // { name: 'Cuba', flag: '🇨🇺' },
  // { name: 'Dominican Republic', flag: '🇩🇴' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'El Salvador', flag: '🇸🇻' },
  { name: 'Guatemala', flag: '🇬🇹' },
  // { name: 'Haiti', flag: '🇭🇹' },
  { name: 'Honduras', flag: '🇭🇳' },
  // { name: 'Jamaica', flag: '🇯🇲' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Nicaragua', flag: '🇳🇮' },
  { name: 'Panama', flag: '🇵🇦' },
  { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Peru', flag: '🇵🇪' },
  // { name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Venezuela', flag: '🇻🇪' }
];

interface PersonalInfoStepProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: () => void;
}

export const PersonalInfoStep = ({ userData, updateUserData, onNext }: PersonalInfoStepProps) => {
  const { toast } = useToast();
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('profile-picture.jpg');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFileError('Please select an image file');
        toast({
          title: "Error",
          description: "Please select a valid image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setFileError('File size must be less than 2MB');
        setProfilePreview(null);
        updateUserData({ profilePicture: undefined });
        toast({
          title: "Error",
          description: "File size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      setFileError(null);
      setOriginalFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        setOriginalImageSrc(imageSrc);
        setIsCropModalOpen(true);
      };
      reader.onerror = () => {
        setFileError('Failed to read file');
        toast({
          title: "Error",
          description: "Failed to read the selected file",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    updateUserData({ profilePicture: croppedFile });
    
    // Create preview for the cropped image
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
    
    setIsCropModalOpen(false);
    setOriginalImageSrc(null);
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setOriginalImageSrc(null);
    // Reset file input
    const fileInput = document.getElementById('profilePicture') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const isFormValid = () => {
    return userData.firstName && 
           userData.lastName && 
           userData.birthday && 
           userData.email && 
           userData.country && 
           userData.profilePicture;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={userData.firstName}
              onChange={(e) => updateUserData({ firstName: e.target.value })}
              placeholder="Enter your first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={userData.lastName}
              onChange={(e) => updateUserData({ lastName: e.target.value })}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday">Birthday</Label>
          <Input
            id="birthday"
            type="date"
            value={userData.birthday}
            onChange={(e) => updateUserData({ birthday: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={userData.email}
            onChange={(e) => updateUserData({ email: e.target.value })}
            placeholder="Enter your email address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={userData.country} onValueChange={(value) => updateUserData({ country: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your country" className="text-muted-foreground" />
            </SelectTrigger>
            <SelectContent>
              {LATIN_AMERICAN_COUNTRIES.map((country) => (
                <SelectItem key={country.name} value={country.name}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Profile Picture</Label>
          <div className="flex items-start gap-4">
            {/* Square Profile Picture Preview */}
            <div className="relative group flex-shrink-0">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="profilePicture"
              />
              <div className={`
                w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center
                transition-all duration-300 cursor-pointer relative overflow-hidden
                ${profilePreview 
                  ? 'border-primary/30 bg-primary/5 shadow-lg' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md'
                }
                group-hover:scale-105 group-active:scale-95
              `}>
                {profilePreview ? (
                  <>
                    <img 
                      src={profilePreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <div className="text-white text-center">
                        <Upload className="w-4 h-4 mx-auto mb-1" />
                        <p className="text-xs font-medium">Change</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 bg-muted rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Photo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button and Info - Side by side layout */}
            <div className="flex-1 space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('profilePicture')?.click()}
                className="w-full hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {profilePreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  JPG, PNG up to 2MB
                </p>
                <p className="text-xs text-muted-foreground">
                  1000×1000 pixels recommended for best quality
                </p>
              </div>
            </div>
          </div>

          {fileError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
              <p className="text-sm text-red-600">{fileError}</p>
            </div>
          )}
        </div>

        <Button 
          onClick={onNext} 
          disabled={!isFormValid()}
          className="w-full"
          size="lg"
        >
          Continue to Group Selection
        </Button>
      </CardContent>
      
      {/* Image Crop Modal */}
      {originalImageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={handleCropCancel}
          imageSrc={originalImageSrc}
          onCropComplete={handleCropComplete}
          fileName={originalFileName}
        />
      )}
    </Card>
  );
};