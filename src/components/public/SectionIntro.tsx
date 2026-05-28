type SectionIntroProps = Readonly<{
  eyebrow?: string;
  title: string;
  text?: string;
  align?: 'left' | 'center';
}>;

export function SectionIntro({ eyebrow, title, text, align = 'center' }: SectionIntroProps) {
  return (
    <div className={['section-intro', `section-intro--${align}`].join(' ')}>
      {eyebrow ? <p className="section-intro__eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {text ? <p className="section-intro__text">{text}</p> : null}
    </div>
  );
}
