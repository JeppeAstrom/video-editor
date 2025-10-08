import { useEffect, useState } from "react";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQueryList: MediaQueryList = window.matchMedia(query);
    const documentChangeHandler = () => setMatches(mediaQueryList.matches);

    documentChangeHandler();

    mediaQueryList.addEventListener("change", documentChangeHandler);

    return () =>
      mediaQueryList.removeEventListener("change", documentChangeHandler);
  }, [query]);

  return matches;
};

export default useMediaQuery;
