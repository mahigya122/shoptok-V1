import React from 'react';
import { Text } from 'react-native';

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export const IconSymbol: React.FC<Props> = ({ name, size = 24, color = '#111' }) => {
  // Minimal placeholder: show the icon name as text for web/dev.
  return <Text style={{ fontSize: size, color }}>{name}</Text>;
};

export default IconSymbol;
