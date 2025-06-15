
import React from "react";

// A friendly cat/chat bubble icon with "OS" written inside
interface ChatOsIconProps extends React.SVGProps<SVGSVGElement> {}

const ChatOsIcon = (props: ChatOsIconProps) => (
  <svg
    viewBox="0 0 48 48"
    width={props.width || 40}
    height={props.height || 40}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    aria-label="ChatOS Logo"
  >
    {/* Bubble shape with cat ears */}
    <path
      d="M12 12 Q10 4 17 7 Q19 2 24 7 Q29 2 31 7 Q38 4 36 12"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <ellipse
      cx="24"
      cy="28"
      rx="16"
      ry="13"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="2"
    />
    <ellipse
      cx="24"
      cy="26"
      rx="14"
      ry="11"
      fill="white"
      stroke="currentColor"
      strokeWidth="1"
    />
    {/* Cat face (optional, simple) */}
    <circle cx="18" cy="26" r="1.2" fill="currentColor" />
    <circle cx="30" cy="26" r="1.2" fill="currentColor" />
    <path
      d="M21 30 Q24 33 27 30"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    {/* "OS" text in center */}
    <text
      x="24"
      y="34"
      textAnchor="middle"
      fontSize="8"
      fontWeight="bold"
      fill="currentColor"
      fontFamily="Inter,Arial,sans-serif"
      dominantBaseline="middle"
    >
      OS
    </text>
  </svg>
);

export default ChatOsIcon;
