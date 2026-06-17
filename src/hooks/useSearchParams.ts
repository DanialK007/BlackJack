import { useLocation } from "wouter";

export function useSearchParams() {
  const [location] = useLocation();
  
  // Extract the query string from the location
  // location includes the pathname and search query
  const queryIndex = location.indexOf("?");
  const queryString = queryIndex !== -1 ? location.substring(queryIndex + 1) : "";
  const params = new URLSearchParams(queryString);
  
  return params;
}
