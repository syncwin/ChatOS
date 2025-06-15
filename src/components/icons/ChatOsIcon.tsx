
import React from "react";

// Cat chat bubble with "OS" inside, for use as the logo/icon everywhere.
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
    {/* Cat bubble with cat ears */}
    <path
      d="M12 12 Q10 4 17 7 Q19 2 24 7 Q29 2 31 7 Q38 4 36 12"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    {/* Chat bubble */}
    <ellipse
      cx="24"
      cy="28"
      rx="16"
      ry="13"
      fill="currentColor"
      fillOpacity={props.fillOpacity ?? 0.14}
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
    {/* Cat face/eyes, optional (can be commented if distraction) */}
    {/* <circle cx="18" cy="26" r="1.2" fill="currentColor" />
    <circle cx="30" cy="26" r="1.2" fill="currentColor" />
    <path
      d="M21 30 Q24 33 27 30"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    /> */}
    {/* "OS" text centered inside the chat bubble */}
    <text
      x="24"
      y="30"
      textAnchor="middle"
      fontSize="10"
      fontWeight="bold"
      fill="currentColor"
      fontFamily="Inter, Arial, sans-serif"
      dominantBaseline="middle"
      letterSpacing="2"
    >
      OS
    </text>
  </svg>
);

export default ChatOsIcon;
