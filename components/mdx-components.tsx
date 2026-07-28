import Image from "next/image";
import { useMDXComponent } from "next-contentlayer2/hooks";

type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

function Figure({
  src,
  alt,
  caption,
  width = 1200,
  height = 800,
}: FigureProps) {
  return (
    <figure>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 672px) calc(100vw - 2rem), 640px"
        className="rounded-lg"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const components = {
  Image,
  Figure,
};

interface MdxProps {
  code: string;
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code);

  return <Component components={components} />;
}
