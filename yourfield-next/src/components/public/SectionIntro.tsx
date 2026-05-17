type SectionIntroProps = Readonly<{
  eyebrow?: string;
  title: string;
  text?: string;
  align?: 'left' | 'center';
}>;

export function SectionIntro({ eyebrow, title, text, align = 'center' }: SectionIntroProps) {
  return (
    <div
      className={['mb-10 max-w-3xl', align === 'center' ? 'mx-auto text-center' : 'text-left'].join(
        ' ',
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-bold text-primary md:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-8 text-text-light md:text-lg">{text}</p> : null}
    </div>
  );
}
