import React from "react";
import { Text, TextProps } from "react-native";

export const AppText: React.FC<TextProps> = (props) => {
  return (
    <Text
      {...props}
      lineBreakStrategyIOS="hangul-word"
      android_hyphenationFrequency="none"
    >
      {props.children}
    </Text>
  );
};
