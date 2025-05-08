import { IconType } from 'react-icons';
import { SVGAttributes } from 'react';

declare module 'react-icons/fa' {
  export const FaMicrophone: IconType;
  export const FaStop: IconType;
  export const FaSave: IconType;
  export const FaTrash: IconType;
  export const FaFileAlt: IconType;
  export const FaCopy: IconType;
  export const FaFileDownload: IconType;
  export const FaListUl: IconType;
  export const FaCalendarAlt: IconType;
  export const FaUserAlt: IconType;
  export const FaChartLine: IconType;
}

// Make IconType compatible with JSX
declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      as?: React.ElementType;
    }
  }
}

// Extend IconType to be compatible with JSX
declare module 'react-icons' {
  interface IconBaseProps extends SVGAttributes<SVGElement> {
    size?: string | number;
    color?: string;
    title?: string;
  }

  interface IconType {
    (props: IconBaseProps): JSX.Element;
    displayName?: string;
  }
}
