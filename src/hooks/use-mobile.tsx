import * as React from "react"

const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024
} as const;

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState<DeviceType | undefined>(undefined)

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.mobile) {
        setDeviceType('mobile');
      } else if (width < BREAKPOINTS.desktop) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);
  
  return deviceType;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const updateIsTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop);
    };
    
    updateIsTablet();
    window.addEventListener('resize', updateIsTablet);
    return () => window.removeEventListener('resize', updateIsTablet);
  }, []);
  
  return !!isTablet;
}
