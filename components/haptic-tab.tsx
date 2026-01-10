import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface HapticTabProps extends TouchableOpacityProps {}

export const HapticTab: React.FC<HapticTabProps> = ({ children, ...props }) => {
  const handlePress = (event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (props.onPress) props.onPress(event);
  };

  return (
    <TouchableOpacity {...props} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
};

export default HapticTab;