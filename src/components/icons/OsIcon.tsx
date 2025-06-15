
import React from 'react';

interface OsIconProps extends React.SVGProps<SVGSVGElement> {}

const OsIcon = (props: OsIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="currentColor"
    {...props}
  >
    <path d="m13 14v4c0 1.1-.9 2-2 2s-2-.9-2-2v-4c0-1.1.9-2 2-2s2 .9 2 2zm18 2c0 8.27-6.73 15-15 15s-15-6.73-15-15 6.73-15 15-15 15 6.73 15 15zm-16-2c0-2.21-1.79-4-4-4s-4 1.79-4 4v4c0 2.21 1.79 4 4 4s4-1.79 4-4zm4.06-.49c.22-.87 1.01-1.51 1.94-1.51 1.1 0 2 .9 2 2 0 .55.45 1 1 1s1-.45 1-1c0-2.21-1.79-4-4-4s-4 1.79-4 4c0 .33.17.65.45.83l5.49 3.66c-.22.87-1.01 1.51-1.94 1.51-1.1 0-2-.9-2-2 0-.55-.45-1-1-1s-1 .45-1 1c0 2.21 1.79 4 4 4s4-1.79 4-4c0-.33-.17-.65-.45-.83z" />
  </svg>
);

export default OsIcon;
