import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

// Accept any props (BottomTabBarButtonProps varies across RN versions)
export const HapticTab: React.FC<any> = ({ children, ...props }) => {
  return (
    <TouchableOpacity {...(props as TouchableOpacityProps)}>
      {children}
    </TouchableOpacity>
  );
};

export default HapticTab;
