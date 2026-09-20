import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

export type OnboardingStep = 1 | 2 | 3;

interface ProgressStepperProps {
  currentStep: OnboardingStep;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep }) => {
  const steps = [
    {
      step: 1,
      label: '1. Mobile Number',
      status: currentStep > 1 ? 'Completed' : currentStep === 1 ? 'Current' : 'Next',
    },
    {
      step: 2,
      label: '2. Verify OTP',
      status: currentStep > 2 ? 'Completed' : currentStep === 2 ? 'Current Step' : 'Next',
    },
    {
      step: 3,
      label: '3. Profile Setup',
      status: currentStep === 3 ? 'Final Step' : 'Next',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        {steps.map((item, index) => {
          const isCompleted = item.step < currentStep || (currentStep === 3 && item.step < 3);
          const isCurrent = item.step === currentStep;

          return (
            <React.Fragment key={item.step}>
              {/* Step Node */}
              <View style={styles.stepNodeContainer}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isCurrent && styles.circleCurrent,
                    !isCompleted && !isCurrent && styles.circleUpcoming,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        isCurrent && styles.circleTextCurrent,
                        !isCurrent && styles.circleTextUpcoming,
                      ]}
                    >
                      {item.step}
                    </Text>
                  )}
                </View>

                {/* Step Text Details */}
                <View style={styles.stepInfo}>
                  <Text style={styles.stepLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.stepStatus,
                      (isCompleted || isCurrent) && styles.stepStatusActive,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Connecting Line between steps */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    currentStep > item.step ? styles.connectorLineActive : styles.connectorLineInactive,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    width: '100%',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNodeContainer: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  circleCompleted: {
    backgroundColor: '#168A68',
  },
  circleCurrent: {
    backgroundColor: '#168A68',
    borderWidth: 2,
    borderColor: '#C6EEDB',
  },
  circleUpcoming: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  circleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  circleTextCurrent: {
    color: '#FFFFFF',
  },
  circleTextUpcoming: {
    color: '#64748B',
  },
  connectorLine: {
    height: 2,
    flex: 0.8,
    marginTop: -18,
    borderRadius: 1,
  },
  connectorLineActive: {
    backgroundColor: '#168A68',
  },
  connectorLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepInfo: {
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10243A',
    textAlign: 'center',
  },
  stepStatus: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#68788C',
    marginTop: 1,
  },
  stepStatusActive: {
    color: '#168A68',
  },
});
