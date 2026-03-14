import { cn } from '../utils/cn';

type BrandMarkProps = {
  className?: string;
  alt?: string;
};

export default function BrandMark({
  className,
  alt = 'Логотип Quizzy',
}: BrandMarkProps) {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      className={cn('block h-full w-full object-contain', className)}
    />
  );
}
