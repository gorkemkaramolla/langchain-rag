type CharacterPageProps = {
  params: {
    slug: string;
  };
};

export default async function CharacterPage({
  params: { slug },
}: CharacterPageProps) {
  return <>{slug}</>;
}
