import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, User } from 'lucide-react';
import { UserData } from './RegistrationWizard';

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

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
    'Spain', 'Italy', 'Australia', 'Japan', 'South Korea', 'Brazil', 'Mexico'
  ];

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
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="profilePicture"
              />
              <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center">
                    <User className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Photo</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('profilePicture')?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG up to 2MB, 1000x1000 ideal
              </p>
            </div>
          </div>
          {fileError && (
            <p className="text-sm text-red-500 mt-2">{fileError}</p>
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