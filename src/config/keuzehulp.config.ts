export type KeuzehulpChoice = {
  id: string; // Unique identifier for this choice
  label: string; // Display text
  image: string; // URL for the visual choice
  meilisearchField: string; // The flat field on the Meilisearch product (e.g., 'color', 'finish', 'material')
  meilisearchValue: string; // The exact value to match (e.g., 'Zwart', 'Mat')
};

export type KeuzehulpStep = {
  id: string;
  title: string;
  type: "single" | "multi";
  choices: KeuzehulpChoice[];
};

export const KeuzehulpConfig: Record<string, KeuzehulpStep[]> = {
  "deurklink": [
    {
      id: "color",
      title: "Welke kleur past bij jouw interieur?",
      type: "multi",
      choices: [
        { id: "zwart", label: "Zwart", image: "https://placehold.co/300x300/1a1a1a/FFFFFF?text=Zwart", meilisearchField: "color", meilisearchValue: "Zwart" },
        { id: "chroom", label: "Chroom", image: "https://placehold.co/300x300/C0C0C0/333333?text=Chroom", meilisearchField: "color", meilisearchValue: "Chroom" },
        { id: "rvs", label: "RVS", image: "https://placehold.co/300x300/B0B0B0/333333?text=RVS", meilisearchField: "color", meilisearchValue: "RVS" },
        { id: "messing", label: "Messing PVD", image: "https://placehold.co/300x300/D4AF37/000000?text=Messing", meilisearchField: "color", meilisearchValue: "Messing PVD" },
        { id: "brons", label: "Brons PVD", image: "https://placehold.co/300x300/8B6914/FFFFFF?text=Brons", meilisearchField: "color", meilisearchValue: "Brons PVD" },
        { id: "wit", label: "Wit", image: "https://placehold.co/300x300/F5F5F5/333333?text=Wit", meilisearchField: "color", meilisearchValue: "Wit" },
      ]
    },
    {
      id: "finish",
      title: "Welke afwerking heeft je voorkeur?",
      type: "multi",
      choices: [
        { id: "mat", label: "Mat", image: "https://placehold.co/300x300/888888/FFFFFF?text=Mat", meilisearchField: "finish", meilisearchValue: "Mat" },
        { id: "geborsteld", label: "Geborsteld", image: "https://placehold.co/300x300/A0A0A0/333333?text=Geborsteld", meilisearchField: "finish", meilisearchValue: "Geborsteld" },
        { id: "poedercoat", label: "Poedercoat", image: "https://placehold.co/300x300/444444/FFFFFF?text=Poedercoat", meilisearchField: "finish", meilisearchValue: "Poedercoat" },
      ]
    },
    {
      id: "material",
      title: "Welk materiaal heeft je voorkeur?",
      type: "single",
      choices: [
        { id: "aluminium", label: "Aluminium", image: "https://placehold.co/300x300/D0D0D0/333333?text=Aluminium", meilisearchField: "material", meilisearchValue: "Aluminium" },
        { id: "rvs-mat", label: "RVS", image: "https://placehold.co/300x300/B8B8B8/333333?text=RVS", meilisearchField: "material", meilisearchValue: "RVS" },
      ]
    }
  ]
};
