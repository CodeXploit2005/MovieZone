export interface Movie {
  _id?: string;
  id: string | number;
  title?: string;
  name?: string;
  poster_path?: string;
  posterPath?: string;
  backdrop_path?: string;
  release_date?: string;
  releaseDate?: string;
  first_air_date?: string;
  vote_average?: number;
  voteAverage?: number;
  isLocal?: boolean;
  views?: number;
  overview?: string;
  description?: string;
  genres?: { id?: number; name: string }[];
  runtime?: number;
  production_countries?: { name: string }[];
  tagline?: string;
  popularity?: number;
  isCustom?: boolean;
  media_type?: 'movie' | 'tv';
  trailerUrl?: string;
  videos?: {
    results: {
      key: string;
      site: string;
      type: string;
    }[];
  };
}
