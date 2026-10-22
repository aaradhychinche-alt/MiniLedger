import 'lucide-react-native';

declare module 'lucide-react-native' {
  import { SvgProps } from 'react-native-svg';

  export interface LucideProps extends SvgProps {
    size?: string | number;
    color?: any;
    stroke?: any;
    strokeWidth?: string | number;
  }
}
