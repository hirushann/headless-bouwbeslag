interface Window {
  google: {
    maps: {
      importLibrary: (libraryName: string) => Promise<any>;
      places?: {
        Autocomplete: any;
      };
      [key: string]: any;
    };
  };
}
