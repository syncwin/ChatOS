
import React from 'react';

interface ChatOsIconProps extends React.SVGProps<SVGSVGElement> {}

/**
 * Chat bubble with OS centered inside.
 */
const ChatOsIcon = (props: ChatOsIconProps) => (
  <svg
    width={36}
    height={36}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Chat bubble shape */}
    <rect x="3" y="4" width="30" height="22" rx="6" fill="#6366F1" />
    {/* Bubble tip */}
    <polygon points="10,26 14,26 12,32" fill="#6366F1"/>
    {/* "OS" label in center */}
    <text
      x="50%"
      y="56%"
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="Inter, Arial, sans-serif"
      fontWeight="bold"
      fontSize="12"
      fill="white"
    >OS</text>
  </svg>
);

export default ChatOsIcon;
