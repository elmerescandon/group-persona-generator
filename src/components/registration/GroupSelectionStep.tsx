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
      selectedClasses: 'border-group-a bg-group-a-light shadow-xl shadow-group-a/20 ring-2 ring-group-a/30',
      iconClasses: 'bg-group-a text-group-a-foreground',
      titleClasses: 'text-group-a',
      indicatorClasses: 'bg-group-a',
    },
    {
      id: 'B' as const,
      name: 'Group B',
      description: 'The Guardians - Protecting and nurturing growth',
      icon: Shield,
      color: 'group-b',
      selectedClasses: 'border-group-b bg-group-b-light shadow-xl shadow-group-b/20 ring-2 ring-group-b/30',
      iconClasses: 'bg-group-b text-group-b-foreground',
      titleClasses: 'text-group-b',
      indicatorClasses: 'bg-group-b',
    },
    {
      id: 'C' as const,
      name: 'Group C',
      description: 'The Champions - Achieving excellence through determination',
      icon: Star,
      color: 'group-c',
      selectedClasses: 'border-group-c bg-group-c-light shadow-xl shadow-group-c/20 ring-2 ring-group-c/30',
      iconClasses: 'bg-group-c text-group-c-foreground',
      titleClasses: 'text-group-c',
      indicatorClasses: 'bg-group-c',
    },
    {
      id: 'D' as const,
      name: 'Group D',
      description: 'The Pioneers - Exploring new frontiers and possibilities',
      icon: Flag,
      color: 'group-d',
      selectedClasses: 'border-group-d bg-group-d-light shadow-xl shadow-group-d/20 ring-2 ring-group-d/30',
      iconClasses: 'bg-group-d text-group-d-foreground',
      titleClasses: 'text-group-d',
      indicatorClasses: 'bg-group-d',
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
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-500 
                    hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    ${isSelected 
                      ? `${group.selectedClasses} transform scale-105` 
                      : 'border-border bg-card hover:border-muted-foreground/50 hover:bg-muted/20'
                    }
                  `}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Select ${group.name}: ${group.description}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectGroup(group.id);
                    }
                  }}
                >
                  <div className="text-center space-y-4">
                    <div className={`
                      inline-flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300
                      ${isSelected 
                        ? `${group.iconClasses} shadow-lg scale-110` 
                        : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'
                      }
                    `}>
                      <Icon className={`transition-all duration-300 ${isSelected ? 'w-9 h-9' : 'w-8 h-8'}`} />
                    </div>
                    
                    <div>
                      <h3 className={`
                        text-xl font-semibold mb-2 transition-all duration-300
                        ${isSelected ? `${group.titleClasses} text-2xl` : 'text-foreground'}
                      `}>
                        {group.name}
                      </h3>
                      <p className={`
                        text-sm leading-relaxed transition-colors duration-300
                        ${isSelected ? 'text-muted-foreground/90 font-medium' : 'text-muted-foreground'}
                      `}>
                        {group.description}
                      </p>
                    </div>
                    
                    {isSelected && (
                      <div className={`
                        absolute top-3 right-3 w-8 h-8 rounded-full ${group.indicatorClasses} 
                        flex items-center justify-center animate-pulse shadow-lg
                      `}>
                        <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                      </div>
                    )}
                    
                    {isSelected && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none" />
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