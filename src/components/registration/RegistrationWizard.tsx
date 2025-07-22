import { useState } from 'react';
import { PersonalInfoStep } from './PersonalInfoStep';
import { GroupSelectionStep } from './GroupSelectionStep';
import { GeneratedImagesStep } from './GeneratedImagesStep';
import { SuccessStep } from './SuccessStep';
import { ProgressBar } from './ProgressBar';

export type UserData = {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  country: string;
  profilePicture: File | null;
  selectedGroup: 'A' | 'B' | 'C' | 'D' | null;
};

const initialUserData: UserData = {
  firstName: '',
  lastName: '',
  birthday: '',
  email: '',
  country: '',
  profilePicture: null,
  selectedGroup: null,
};

export const RegistrationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<UserData>(initialUserData);

  const totalSteps = 4;

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Program Registration</h1>
          <p className="text-muted-foreground text-lg">Join us and get your personalized content</p>
        </div>

        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <div className="mt-8">
          {currentStep === 1 && (
            <PersonalInfoStep
              userData={userData}
              updateUserData={updateUserData}
              onNext={handleNextStep}
            />
          )}
          {currentStep === 2 && (
            <GroupSelectionStep
              selectedGroup={userData.selectedGroup}
              onSelectGroup={(group) => updateUserData({ selectedGroup: group })}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}
          {currentStep === 3 && (
            <GeneratedImagesStep
              userData={userData}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}
          {currentStep === 4 && (
            <SuccessStep userData={userData} />
          )}
        </div>
      </div>
    </div>
  );
};