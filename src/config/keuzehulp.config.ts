export type KeuzehulpChoice = {
  id: string; // The attribute term to filter by (e.g., 'binnen', 'zwart')
  label: string; // Display text
  image: string; // URL for the visual choice
  wooAttributeKey?: string; // e.g., 'pa_indoor_outdoor'
  nextStepId?: string; // Optional: For complex conditional branching later
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
      id: "usage",
      title: "Waar heb je deurklinken voor nodig?",
      type: "single",
      choices: [
        { id: "indoor", label: "Binnen", image: "https://placehold.co/300x300/F0F0F0/000000?text=Binnen", wooAttributeKey: "pa_indoor_outdoor" },
        { id: "outdoor", label: "Buiten", image: "https://placehold.co/300x300/D0D0D0/000000?text=Buiten", wooAttributeKey: "pa_indoor_outdoor" },
      ]
    },
    {
      id: "color",
      title: "Wat voor kleur zoek je?",
      type: "multi",
      choices: [
        { id: "zwart", label: "Zwart", image: "https://placehold.co/300x300/222222/FFFFFF?text=Zwart", wooAttributeKey: "pa_color" },
        { id: "rvs", label: "RVS", image: "https://placehold.co/300x300/E0E0E0/333333?text=RVS", wooAttributeKey: "pa_color" },
        { id: "messing", label: "Messing", image: "https://placehold.co/300x300/D4AF37/000000?text=Messing", wooAttributeKey: "pa_color" }
      ]
    },
    {
      id: "type",
      title: "Zoek je een deurschild of rozet?",
      type: "single",
      choices: [
        { id: "deurschild", label: "Deurschild", image: "https://placehold.co/300x300/F0F0F0/000000?text=Schild", wooAttributeKey: "pa_rosette_type" },
        { id: "rozet", label: "Rozet", image: "https://placehold.co/300x300/F0F0F0/000000?text=Rozet", wooAttributeKey: "pa_rosette_type" },
        { id: "zonder", label: "Kale Klink", image: "https://placehold.co/300x300/F0F0F0/000000?text=Klink", wooAttributeKey: "pa_rosette_type" }
      ]
    }
  ]
};
