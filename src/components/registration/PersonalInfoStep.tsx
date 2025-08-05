import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, User } from 'lucide-react';
import { UserData } from './RegistrationWizard';

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
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setFileError('File size must be less than 2MB');
        setProfilePreview(null);
        updateUserData({ profilePicture: undefined });
        return;
      }

      setFileError(null);
      updateUserData({ profilePicture: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

        {/* Option 1: Large Drop Zone with Centered Preview */}
        <div className="space-y-2">
          <Label>Profile Picture</Label>
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id="profilePicture"
            />
            <div className={`
              w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center
              transition-all duration-200 cursor-pointer
              ${profilePreview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/70 hover:bg-primary/5'}
              group-hover:scale-[1.02] group-active:scale-[0.98]
            `}>
              {profilePreview ? (
                <div className="relative w-full h-full p-4">
                  <img 
                    src={profilePreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-sm font-medium">Change Photo</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-medium text-lg mb-1">Upload your photo</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG up to 2MB • 1000×1000 recommended
                  </p>
                </div>
              )}
            </div>
          </div>
          {fileError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
    </Card>
  );
};