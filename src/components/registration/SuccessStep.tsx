import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Mail, Download, Home } from 'lucide-react';
import { UserData } from './RegistrationWizard';

interface SuccessStepProps {
  userData: UserData;
}

export const SuccessStep = ({ userData }: SuccessStepProps) => {
  const getGroupColor = () => {
    switch (userData.selectedGroup) {
      case 'A': return 'group-a';
      case 'B': return 'group-b';
      case 'C': return 'group-c';
      case 'D': return 'group-d';
      default: return 'primary';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className={`w-20 h-20 bg-${getGroupColor()} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <CheckCircle2 className={`w-12 h-12 text-${getGroupColor()}-foreground`} />
          </div>
          <CardTitle className="text-3xl">Welcome to the Program!</CardTitle>
          <p className="text-muted-foreground text-lg">
            Congratulations, {userData.firstName}! You've successfully registered for {userData.selectedGroup && `Group ${userData.selectedGroup}`}.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`p-6 bg-${getGroupColor()}-light rounded-lg border border-${getGroupColor()}/20`}>
            <h3 className="font-semibold mb-3 flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Check Your Email
            </h3>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation email to <strong>{userData.email}</strong> with your registration details 
              and links to download your personalized content.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">What's Next?</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span>Download your personalized images from the email</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span>Join your group's community and connect with fellow members</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span>Attend the welcome orientation session next week</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Content
            </Button>
            <Button className={`w-full bg-${getGroupColor()} hover:bg-${getGroupColor()}/90`}>
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at <a href="mailto:support@program.com" className="text-primary hover:underline">support@program.com</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};