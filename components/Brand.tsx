import Image from 'next/image';
import Link from 'next/link';

export function Brand({ markOnly = false }: { markOnly?: boolean }) {
  return <Link href="/" className="brand" aria-label="Closely home">
    <Image src={markOnly ? '/brand/closely-mark.svg' : '/brand/closely-wordmark.svg'} alt="Closely" width={markOnly ? 40 : 118} height={markOnly ? 40 : 37} unoptimized />
  </Link>;
}
