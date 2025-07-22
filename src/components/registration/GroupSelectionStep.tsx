import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Flag, Shield, Star, Zap } from 'lucide-react';

interface GroupSelectionStepProps {
  selectedGroup: 'A' | 'B' | 'C' | 'D' | null;
  onSelectGroup: (group: 'A' | 'B' | 'C' | 'D') => void;
  onNext: () => void;
  onPrev: () => void;
}

export const GroupSelectionStep = ({ selectedGroup, onSelectGroup, onNext, onPrev }: GroupSelectionStepProps) => {
  const groups = [
    {
      id: 'A' as const,
      name: 'Group A',
      description: 'The Innovators - Leading with creativity and bold ideas',
      icon: Zap,
      color: 'group-a',
    },
    {
      id: 'B' as const,
      name: 'Group B',
      description: 'The Guardians - Protecting and nurturing growth',
      icon: Shield,
      color: 'group-b',
    },
    {
      id: 'C' as const,
      name: 'Group C',
      description: 'The Champions - Achieving excellence through determination',
      icon: Star,
      color: 'group-c',
    },
    {
      id: 'D' as const,
      name: 'Group D',
      description: 'The Pioneers - Exploring new frontiers and possibilities',
      icon: Flag,
      color: 'group-d',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Choose Your Group</CardTitle>
          <p className="text-center text-muted-foreground">
            Select the group that best represents your spirit and values
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {groups.map((group) => {
              const Icon = group.icon;
              const isSelected = selectedGroup === group.id;
              
              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={`
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105
                    ${isSelected 
                      ? `border-${group.color} bg-${group.color}-light shadow-lg` 
                      : 'border-border bg-card hover:border-muted-foreground/50'
                    }
                  `}
                >
                  <div className="text-center space-y-4">
                    <div className={`
                      inline-flex items-center justify-center w-16 h-16 rounded-full transition-colors
                      ${isSelected 
                        ? `bg-${group.color} text-${group.color}-foreground` 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      <Icon className="w-8 h-8" />
                    </div>
                    
                    <div>
                      <h3 className={`
                        text-xl font-semibold mb-2 transition-colors
                        ${isSelected ? `text-${group.color}` : 'text-foreground'}
                      `}>
                        {group.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                    
                    {isSelected && (
                      <div className={`
                        absolute top-3 right-3 w-6 h-6 rounded-full bg-${group.color} flex items-center justify-center
                      `}>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onPrev}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={onNext} 
              disabled={!selectedGroup}
              size="lg"
            >
              Generate My Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};