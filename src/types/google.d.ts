interface Window {
  google: {
    maps: {
      importLibrary?: (libraryName: string) => Promise<any>;
      places?: {
        Autocomplete: any;
        AutocompleteService?: any;
        AutocompleteSessionToken?: any;
        AutocompleteSuggestion?: any;
      };
      Geocoder: any;
      [key: string]: any;
    };
  };
}
