type LocalePageProps = Readonly<{
  params: {
    locale: string
  }
}>

export default function LocalePage({ params }: LocalePageProps) {
  return <h1>Hello {params.locale}</h1>
}
